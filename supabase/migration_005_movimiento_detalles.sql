-- ============================================================================
-- Migración 005 — Detalle opcional de gastos por movimiento
-- ============================================================================
-- INCREMENTAL · NO DESTRUCTIVA · IDEMPOTENTE.
-- NO toca ningún valor financiero existente:
--   * movimientos.usar_detalles se agrega con DEFAULT false
--     -> TODOS los movimientos actuales quedan usar_detalles = false
--        (comportamiento actual 100% intacto: Pagado editable a mano).
--   * movimiento_detalles arranca vacía.
--   * pagado / sobrante / inicial de los movimientos: SIN CAMBIOS.
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

-- 1) Flag opt-in por movimiento ------------------------------------------
--    NOT NULL + DEFAULT false => Postgres rellena todas las filas existentes
--    con false sin reescribir la tabla ni tocar otros campos.
alter table public.movimientos
  add column if not exists usar_detalles boolean not null default false;

-- 2) Tabla de detalles (desglose de un movimiento) ---------------------
create table if not exists public.movimiento_detalles (
  id            uuid        primary key default gen_random_uuid(),
  movimiento_id uuid        not null references public.movimientos(id) on delete cascade,
  concepto      text        not null,
  monto         integer     not null default 0,   -- guaraníes, entero
  fecha         date,                              -- opcional (puede ser NULL)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists movimiento_detalles_mov_idx
  on public.movimiento_detalles (movimiento_id);

drop trigger if exists movimiento_detalles_set_updated_at on public.movimiento_detalles;
create trigger movimiento_detalles_set_updated_at
  before update on public.movimiento_detalles
  for each row execute function public.set_updated_at();

-- 3) RLS: sólo el rol authenticated (mismo criterio que el resto) -------
alter table public.movimiento_detalles enable row level security;
drop policy if exists "acceso_autenticado" on public.movimiento_detalles;
create policy "acceso_autenticado" on public.movimiento_detalles
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Verificación (opcional). Ambas deben dar 0:
--   select count(*) from public.movimientos where usar_detalles is not false;
--   select count(*) from public.movimiento_detalles;
-- ----------------------------------------------------------------------------
