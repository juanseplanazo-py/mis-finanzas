-- ============================================================================
-- Seed de datos REALES — período "Agosto - Septiembre 2026"
-- ============================================================================
-- IDEMPOTENTE: cada bloque usa "where not exists" con una clave natural, así
-- que correrlo dos veces no genera duplicados.
-- Requisitos previos: migración 003 aplicada + limpieza de datos de prueba.
-- Fechas: van NULL (el Excel las tiene vacías; no se inventan).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) MOVIMIENTOS (25 ítems)  — clave natural: (periodo_id, razon, concepto)
-- ---------------------------------------------------------------------------
with periodo as (
  select id from public.periodos where nombre = 'Agosto - Septiembre 2026'
),
datos (orden, razon, concepto, metodo_pago, categoria, subcategoria, inicial, pagado) as (
  values
    ( 1, 'Mamá',              'Mensual',      'Tarjeta de Débito GNB',  'Deuda',    'Familiar',            230000, 0),
    ( 2, 'Tarjeta de Crédito','Itau',         'Tarjeta de Débito GNB',  'Deuda',    'Tarjeta de Crédito',       0, 0),
    ( 3, 'Tarjeta de Crédito','GNB',          'Tarjeta de Débito GNB',  'Deuda',    'Tarjeta de Crédito',       0, 0),
    ( 4, 'Cooperativa',       'Solidaridad',  'Tarjeta de Débito GNB',  'Deuda',    'Tarjeta de Crédito',   15000, 0),
    ( 5, 'Belén',             'Línea',        'Tarjeta de Débito GNB',  'Fijo',     'Telefonía',           101250, 101250),
    ( 6, 'Belén',             'Seguro',       'Tarjeta de Débito GNB',  'Fijo',     'Seguro Médico',       421000, 421000),
    ( 7, 'Gym',               'Mensual',      'Tarjeta de Débito GNB',  'Fijo',     'Gimnasio',            200000, 0),
    ( 8, 'IVA',               'Taxit',        'Tarjeta de Débito GNB',  'Fijo',     'Contabilidad',        129000, 0),
    ( 9, 'Exa',               'Mensual',      'Tarjeta de Débito GNB',  'Fijo',     'Santa Clara',          35000, 0),
    (10, 'Depilación',        'Mensual',      'Tarjeta de Débito GNB',  'Fijo',     'Depilación',           90000, 0),
    (11, 'Suscripciones',     'Gmail',        'Tarjeta de Débito GNB',  'Fijo',     'Suscripciones',        16500, 16500),
    (12, 'Suscripciones',     'Disney +',     'Tarjeta de Débito GNB',  'Fijo',     'Suscripciones',       140264, 140264),
    (13, 'Suscripciones',     'Spotify',      'Tarjeta de Débito GNB',  'Fijo',     'Suscripciones',        77890, 77890),
    (14, 'Suscripciones',     'Icloud +',     'Tarjeta de Débito Itaú', 'Fijo',     'Suscripciones',        23260, 23260),
    (15, 'Pablo',             'Celular',      'Tarjeta de Débito GNB',  'Fijo',     'Celular',             250000, 250000),
    (16, 'Peluquería',        'Mensual',      'Tarjeta de Débito GNB',  'Variable', 'Peluquería',          102000, 0),
    (17, 'IVA',               'IVA',          'Tarjeta de Débito GNB',  'Variable', 'IVA',                      0, 0),
    (18, 'Semana 1',          'Alimentación', 'Tarjeta de Débito GNB',  'Variable', 'Alimentación',        200000, 187000),
    (19, 'Semana 2',          'Alimentación', 'Tarjeta de Débito GNB',  'Variable', 'Alimentación',        200000, 0),
    (20, 'Semana 3',          'Alimentación', 'Tarjeta de Débito GNB',  'Variable', 'Alimentación',        200000, 0),
    (21, 'Semana 4',          'Alimentación', 'Tarjeta de Débito GNB',  'Variable', 'Alimentación',        200000, 0),
    (22, 'Semana 5',          'Alimentación', 'Tarjeta de Débito GNB',  'Variable', 'Alimentación',             0, 0),
    (23, 'Combustible',       'Mensual',      'Tarjeta de Débito GNB',  'Variable', 'Transporte',          500000, 0),
    (24, 'Emergencia',        'Itau',         'Tarjeta de Débito Basa', 'Ahorro',   'Emergencia',          300000, 300000),
    (25, 'Ahorro',            'Ahorro',       'Tarjeta de Débito Basa', 'Ahorro',   'Ahorro',              568000, 568000)
)
insert into public.movimientos
  (periodo_id, razon, concepto, metodo_pago, categoria, subcategoria, inicial, pagado, sobrante, fecha, created_at)
select p.id, d.razon, d.concepto, d.metodo_pago, d.categoria, d.subcategoria,
       d.inicial, d.pagado, d.inicial - d.pagado, null,
       now() + (d.orden * interval '1 second')  -- preserva el orden del Excel
from datos d
cross join periodo p
where not exists (
  select 1 from public.movimientos m
  where m.periodo_id = p.id and m.razon = d.razon and m.concepto = d.concepto
);

-- ---------------------------------------------------------------------------
-- 2) AHORROS  — clave natural: nombre
-- ---------------------------------------------------------------------------
insert into public.ahorros (nombre, saldo)
select v.nombre, v.saldo
from (values ('BASA Cuenta', 1358000), ('Cadiem', 17203612)) as v(nombre, saldo)
where not exists (
  select 1 from public.ahorros a where a.nombre = v.nombre
);

-- ---------------------------------------------------------------------------
-- 3) TARJETAS DE CRÉDITO  — clave natural: nombre
-- ---------------------------------------------------------------------------
insert into public.tarjetas_credito (nombre, linea_credito)
select v.nombre, v.linea_credito
from (values ('GNB', 5400000), ('Itaú', 2000000)) as v(nombre, linea_credito)
where not exists (
  select 1 from public.tarjetas_credito t where t.nombre = v.nombre
);

-- ---------------------------------------------------------------------------
-- 4) CONCEPTOS DE TARJETA  — clave natural: (tarjeta_id, concepto)
--    Deuda GNB  = (1.055.000 + 47.900 + 0) - (0 + 0)   = 1.102.900
--    Deuda Itaú = (143.000 + 0 + 73.000) - (0)         = 216.000
-- ---------------------------------------------------------------------------
with datos (tarjeta, concepto, monto, tipo) as (
  values
    ('GNB',  'Agosto',      1055000, 'cargo'),
    ('GNB',  'Leche Mari',    47900, 'cargo'),
    ('GNB',  'Cuota Anual',       0, 'cargo'),
    ('GNB',  'Reintegro',         0, 'descuento'),
    ('GNB',  'Me deben',          0, 'descuento'),
    ('Itaú', 'Julio',        143000, 'cargo'),
    ('Itaú', 'Cuota Anual',       0, 'cargo'),
    ('Itaú', 'Reintegro',         0, 'descuento'),
    ('Itaú', 'Me deben',      73000, 'cargo')
)
insert into public.tarjeta_movimientos (tarjeta_id, concepto, monto, tipo)
select t.id, d.concepto, d.monto, d.tipo
from datos d
join public.tarjetas_credito t on t.nombre = d.tarjeta
where not exists (
  select 1 from public.tarjeta_movimientos tm
  where tm.tarjeta_id = t.id and tm.concepto = d.concepto
);

-- ---------------------------------------------------------------------------
-- 5) ME DEBEN  — clave natural: (persona, monto)
-- ---------------------------------------------------------------------------
insert into public.deudas_a_favor (persona, concepto, monto, estado, periodo_id)
select 'Pablo', '', 90000, 'pendiente',
       (select id from public.periodos where nombre = 'Agosto - Septiembre 2026')
where not exists (
  select 1 from public.deudas_a_favor d where d.persona = 'Pablo' and d.monto = 90000
);
