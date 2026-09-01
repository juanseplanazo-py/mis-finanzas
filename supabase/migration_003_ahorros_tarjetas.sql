-- ============================================================================
-- Migración 003 — Ahorros, Tarjetas de crédito, fecha de movimientos nullable
-- ============================================================================
-- INCREMENTAL Y NO DESTRUCTIVA. Idempotente (se puede correr más de una vez).
--   * No borra ni recrea tablas existentes.
--   * No borra datos.
-- Ejecutar: Supabase Dashboard → SQL Editor → New query → pegar todo → Run.
-- ============================================================================

-- 1) movimientos.fecha: permitir NULL --------------------------------------
--    El Excel real tiene la columna "Fecha de pago" vacía en la mayoría de
--    los ítems. Antes era NOT NULL con default current_date.
alter table public.movimientos alter column fecha drop not null;

-- 2) deudas_a_favor.concepto: asegurar que exista --------------------------
--    (ya se creó en la migración 002; este ADD es defensivo / idempotente)
alter table public.deudas_a_favor
  add column if not exists concepto text not null default '';

-- 3) función auxiliar para mantener updated_at -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4) ahorros (cuentas de ahorro / inversión) ------------------------------
create table if not exists public.ahorros (
  id         uuid        primary key default gen_random_uuid(),
  nombre     text        not null,
  saldo      integer     not null default 0,   -- guaraníes, entero
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists ahorros_set_updated_at on public.ahorros;
create trigger ahorros_set_updated_at
  before update on public.ahorros
  for each row execute function public.set_updated_at();

-- 5) tarjetas_credito ----------------------------------------------------
create table if not exists public.tarjetas_credito (
  id            uuid        primary key default gen_random_uuid(),
  nombre        text        not null,
  linea_credito integer     not null default 0,   -- guaraníes, entero
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists tarjetas_credito_set_updated_at on public.tarjetas_credito;
create trigger tarjetas_credito_set_updated_at
  before update on public.tarjetas_credito
  for each row execute function public.set_updated_at();

-- 6) tarjeta_movimientos (conceptos que forman la deuda de cada tarjeta) --
--    deuda de la tarjeta = SUM(cargos) - SUM(descuentos)
create table if not exists public.tarjeta_movimientos (
  id         uuid        primary key default gen_random_uuid(),
  tarjeta_id uuid        not null references public.tarjetas_credito(id) on delete cascade,
  concepto   text        not null,
  monto      integer     not null default 0,
  tipo       text        not null default 'cargo' check (tipo in ('cargo', 'descuento')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tarjeta_movimientos_tarjeta_idx
  on public.tarjeta_movimientos (tarjeta_id);
drop trigger if exists tarjeta_movimientos_set_updated_at on public.tarjeta_movimientos;
create trigger tarjeta_movimientos_set_updated_at
  before update on public.tarjeta_movimientos
  for each row execute function public.set_updated_at();

-- 7) RLS + políticas anon (mismo criterio que el resto de la app:
--    uso personal de un solo usuario con la publishable/anon key) ---------
alter table public.ahorros enable row level security;
drop policy if exists "acceso_total_anon" on public.ahorros;
create policy "acceso_total_anon" on public.ahorros
  for all to anon using (true) with check (true);

alter table public.tarjetas_credito enable row level security;
drop policy if exists "acceso_total_anon" on public.tarjetas_credito;
create policy "acceso_total_anon" on public.tarjetas_credito
  for all to anon using (true) with check (true);

alter table public.tarjeta_movimientos enable row level security;
drop policy if exists "acceso_total_anon" on public.tarjeta_movimientos;
create policy "acceso_total_anon" on public.tarjeta_movimientos
  for all to anon using (true) with check (true);
