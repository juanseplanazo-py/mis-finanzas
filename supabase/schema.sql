-- Esquema completo de "Mis Finanzas" (para una instalación desde cero).
-- Si tu base YA tiene la tabla `movimientos`, NO ejecutes este archivo:
-- usá la migración incremental `migration_002_periodos.sql`.
--
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y Run.

-- Períodos mensuales (del 25 de un mes al 24 del siguiente, según el Excel).
create table if not exists public.periodos (
  id           uuid        primary key default gen_random_uuid(),
  nombre       text        not null,               -- "Agosto - Septiembre 2026"
  fecha_inicio date        not null,
  fecha_fin    date        not null,
  ingreso      integer     not null default 0,     -- guaraníes, entero
  created_at   timestamptz not null default now()
);

create table if not exists public.movimientos (
  id           uuid        primary key default gen_random_uuid(),
  periodo_id   uuid        references public.periodos(id) on delete set null,
  razon        text        not null,
  concepto     text        not null,
  categoria    text        not null,
  subcategoria text        not null,
  inicial      integer     not null default 0,  -- monto presupuestado (guaraníes, entero)
  pagado       integer     not null default 0,  -- monto gastado real (guaraníes, entero)
  sobrante     integer     not null default 0,  -- calculado: inicial - pagado
  metodo_pago  text        not null,
  fecha        date        not null default current_date,
  created_at   timestamptz not null default now()
);

-- Bloque "Me deben" del Excel.
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

create index if not exists movimientos_fecha_idx
  on public.movimientos (fecha desc, created_at desc);
create index if not exists movimientos_periodo_idx
  on public.movimientos (periodo_id);

-- Uso personal de un solo usuario con la anon/publishable key.
-- RLS activado + política permisiva (ajustar si más adelante se agrega auth).
alter table public.periodos enable row level security;
drop policy if exists "acceso_total_anon" on public.periodos;
create policy "acceso_total_anon" on public.periodos
  for all to anon using (true) with check (true);

alter table public.movimientos enable row level security;
drop policy if exists "acceso_total_anon" on public.movimientos;
create policy "acceso_total_anon" on public.movimientos
  for all to anon using (true) with check (true);

alter table public.deudas_a_favor enable row level security;
drop policy if exists "acceso_total_anon" on public.deudas_a_favor;
create policy "acceso_total_anon" on public.deudas_a_favor
  for all to anon using (true) with check (true);
