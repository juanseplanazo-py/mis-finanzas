-- ============================================================================
-- Limpieza de datos de prueba — PASO OPCIONAL, requiere tu confirmación
-- ============================================================================
-- Estas 2 filas de `movimientos` NO están en tu lista de 25 ítems reales:
-- se crearon/editaron durante el testing de sesiones anteriores.
--
--   bde4fdfb-88b6-4ecf-8788-2d29136d1cfe  Semana 1 / Supermercado  (200000 / 157000)
--   1737e885-a06f-49c6-8a65-0d87841e2ea7  Gym / Gym                (200000 / 0)
--
-- Si NO se borran, el Presupuestado del período quedaría
-- 3.999.164 + 400.000 = 4.399.164 (incorrecto).
--
-- Ejecutar SOLO después de confirmar. Correr ANTES del seed.
-- ============================================================================

delete from public.movimientos
where id in (
  'bde4fdfb-88b6-4ecf-8788-2d29136d1cfe',
  '1737e885-a06f-49c6-8a65-0d87841e2ea7'
);

-- Opcional: el período "Septiembre - Octubre 2026" se creó al probar el
-- selector y no tiene movimientos. Descomentá si querés eliminarlo:
-- delete from public.periodos where nombre = 'Septiembre - Octubre 2026';
