-- ============================================================================
-- Migración 002 — Períodos, ingreso del período y "Me deben"
-- ============================================================================
-- INCREMENTAL Y NO DESTRUCTIVA:
--   * No borra ni recrea la tabla `movimientos`.
--   * No borra datos existentes.
--   * Se puede ejecutar más de una vez sin romper nada (idempotente).
--
-- Cómo ejecutarla:
--   Supabase Dashboard → SQL Editor → New query → pegar TODO este archivo → Run.
-- ============================================================================

-- 1) Tabla de períodos ------------------------------------------------------
create table if not exists public.periodos (
  id           uuid        primary key default gen_random_uuid(),
  nombre       text        not null,               -- "Agosto - Septiembre 2026"
  fecha_inicio date        not null,
  fecha_fin    date        not null,
  ingreso      integer     not null default 0,     -- guaraníes, entero
  created_at   timestamptz not null default now()
);

-- 2) Tabla "Me deben" (deudas a favor) ------------------------------------
create table if not exists public.deudas_a_favor (
  id         uuid        primary key default gen_random_uuid(),
  persona    text        not null,
  concepto   text        not null default '',
  monto      integer     not null default 0,
  estado     text        not null default 'pendiente'
               check (estado in ('pendiente', 'pagado')),
  periodo_id uuid        references public.periodos(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3) Relación movimientos -> período ------------------------------------
alter table public.movimientos
  add column if not exists periodo_id uuid
  references public.periodos(id) on delete set null;

create index if not exists movimientos_periodo_idx
  on public.movimientos (periodo_id);

-- 4) RLS para las tablas nuevas (mismo criterio que `movimientos`:
--    uso personal de un solo usuario con la anon/publishable key) --------
alter table public.periodos enable row level security;
drop policy if exists "acceso_total_anon" on public.periodos;
create policy "acceso_total_anon" on public.periodos
  for all to anon using (true) with check (true);

alter table public.deudas_a_favor enable row level security;
drop policy if exists "acceso_total_anon" on public.deudas_a_favor;
create policy "acceso_total_anon" on public.deudas_a_favor
  for all to anon using (true) with check (true);

-- 5) Período inicial: "Agosto - Septiembre 2026" -----------------------
--    Basado en tu Excel: los períodos van del 25 de un mes al 24 del
--    siguiente, e ingreso = Gs. 4.000.000.
--    Sólo se inserta si todavía no existe un período con ese nombre.
insert into public.periodos (nombre, fecha_inicio, fecha_fin, ingreso)
select 'Agosto - Septiembre 2026', date '2026-08-25', date '2026-09-24', 4000000
where not exists (
  select 1 from public.periodos where nombre = 'Agosto - Septiembre 2026'
);

-- 6) Asociar movimientos existentes SIN período al período que les
--    corresponde por FECHA (rango fecha_inicio..fecha_fin).
--    Es seguro: sólo toca filas con periodo_id NULL y sólo si la fecha
--    del movimiento cae dentro de un período existente.
--    (La única fila actual — "Semana 1 / Supermercado", fecha 2026-08-31 —
--     cae dentro de "Agosto - Septiembre 2026".)
update public.movimientos m
set periodo_id = p.id
from public.periodos p
where m.periodo_id is null
  and m.fecha >= p.fecha_inicio
  and m.fecha <= p.fecha_fin;

-- 7) Verificación (opcional) — deberían quedar 0 filas:
-- select * from public.movimientos where periodo_id is null;
