-- ============================================================================
-- Migración 006 — "Yo debo" + Fondo de emergencia
-- ============================================================================
-- INCREMENTAL · NO DESTRUCTIVA · IDEMPOTENTE.
-- Solo CREA dos tablas nuevas (arrancan vacías). NO toca ninguna tabla ni valor
-- existente: movimientos, periodos, ahorros, tarjetas, deudas_a_favor, etc.
-- quedan exactamente igual (ninguna fórmula del dashboard cambia).
--
-- Ejecutar: Supabase Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================================

-- 0) función updated_at (ya existe desde migración 003; defensivo/idempotente)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Yo debo: deudas que YO tengo con otras personas --------------------
create table if not exists public.deudas_mias (
  id         uuid        primary key default gen_random_uuid(),
  persona    text        not null,                    -- a quién le debo
  concepto   text        not null default '',
  monto      integer     not null default 0,          -- guaraníes, entero
  estado     text        not null default 'pendiente'
             check (estado in ('pendiente', 'pagado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists deudas_mias_set_updated_at on public.deudas_mias;
create trigger deudas_mias_set_updated_at
  before update on public.deudas_mias
  for each row execute function public.set_updated_at();

alter table public.deudas_mias enable row level security;
drop policy if exists "acceso_autenticado" on public.deudas_mias;
create policy "acceso_autenticado" on public.deudas_mias
  for all to authenticated using (true) with check (true);

-- 2) Fondo de emergencia: aportes (+) y gastos (-) -----------------------
--    Saldo del fondo = SUMA(aportes) - SUMA(gastos). Es independiente del
--    período: NO afecta Pagado / Falta por gastar / Disponible real.
create table if not exists public.fondo_movimientos (
  id         uuid        primary key default gen_random_uuid(),
  tipo       text        not null check (tipo in ('aporte', 'gasto')),
  concepto   text        not null,
  monto      integer     not null default 0,          -- guaraníes, entero
  fecha      date        not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fondo_movimientos_fecha_idx
  on public.fondo_movimientos (fecha);

drop trigger if exists fondo_movimientos_set_updated_at on public.fondo_movimientos;
create trigger fondo_movimientos_set_updated_at
  before update on public.fondo_movimientos
  for each row execute function public.set_updated_at();

alter table public.fondo_movimientos enable row level security;
drop policy if exists "acceso_autenticado" on public.fondo_movimientos;
create policy "acceso_autenticado" on public.fondo_movimientos
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Verificación (opcional). Ambas deben dar 0:
--   select count(*) from public.deudas_mias;
--   select count(*) from public.fondo_movimientos;
-- ----------------------------------------------------------------------------
