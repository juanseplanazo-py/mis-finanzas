-- ============================================================================
-- Migración 007 — Metas de ahorro + ahorro reservado por período
-- ============================================================================
-- INCREMENTAL · NO DESTRUCTIVA · IDEMPOTENTE.
--   * periodos.ahorro_reservado: se agrega con DEFAULT 0 -> todos los períodos
--     existentes quedan en 0. NO cambia ingreso ni ningún valor existente.
--   * metas_ahorro: tabla nueva (arranca vacía).
-- Ninguna fórmula del dashboard cambia.
--
-- Ejecutar: Supabase Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================================

-- 0) función updated_at (ya existe; defensivo/idempotente)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Monto que se aparta para ahorrar al inicio del período --------------
alter table public.periodos
  add column if not exists ahorro_reservado integer not null default 0;

-- 2) Metas de ahorro -------------------------------------------------------
--    El progreso NO se guarda: se lee del saldo de lo que la meta tiene
--    vinculado (el Fondo de emergencia o una cuenta de Ahorros).
create table if not exists public.metas_ahorro (
  id             uuid        primary key default gen_random_uuid(),
  nombre         text        not null,
  monto_meta     integer     not null default 0,       -- guaraníes, entero
  fecha_objetivo date,                                  -- opcional
  origen         text        not null check (origen in ('fondo', 'cuenta')),
  ahorro_id      uuid        references public.ahorros(id) on delete set null,
  archivada      boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists metas_ahorro_set_updated_at on public.metas_ahorro;
create trigger metas_ahorro_set_updated_at
  before update on public.metas_ahorro
  for each row execute function public.set_updated_at();

alter table public.metas_ahorro enable row level security;
drop policy if exists "acceso_autenticado" on public.metas_ahorro;
create policy "acceso_autenticado" on public.metas_ahorro
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Verificación (opcional):
--   select count(*) from public.metas_ahorro;                              -- 0
--   select count(*) from public.periodos where ahorro_reservado <> 0;      -- 0
-- ----------------------------------------------------------------------------
