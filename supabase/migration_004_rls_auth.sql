-- ============================================================================
-- Migración 004 — Cerrar acceso anónimo. Requiere sesión autenticada.
-- ============================================================================
-- App personal de UN SOLO usuario:
--   * No se agrega user_id por fila (innecesario con un único usuario).
--   * Se reemplaza la política "acceso_total_anon" (rol anon) por
--     "acceso_autenticado" (rol authenticated) en las 6 tablas.
--
-- Efecto:
--   - Sin sesión (solo publishable key -> rol anon): la API NO devuelve filas
--     y RECHAZA todo INSERT / UPDATE / DELETE (RLS deny por defecto).
--   - Con sesión (JWT del usuario -> rol authenticated): acceso total, igual
--     que antes.
--
-- INCREMENTAL, NO DESTRUCTIVA, IDEMPOTENTE. No toca datos.
-- Ejecutar: Supabase Dashboard -> SQL Editor -> New query -> pegar todo -> Run.
-- ============================================================================

do $$
declare
  t text;
  tablas text[] := array[
    'periodos', 'movimientos', 'ahorros',
    'tarjetas_credito', 'tarjeta_movimientos', 'deudas_a_favor'
  ];
begin
  foreach t in array tablas loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "acceso_total_anon" on public.%I', t);
    execute format('drop policy if exists "acceso_autenticado" on public.%I', t);
    execute format(
      'create policy "acceso_autenticado" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Verificación (opcional): debería listar 6 filas, todas con roles={authenticated}
-- select tablename, policyname, roles
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename;
