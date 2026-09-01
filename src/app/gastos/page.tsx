"use client";

import { usePeriodo } from "@/lib/periodo-context";
import PageHeader from "@/components/PageHeader";
import PeriodoSelector from "@/components/PeriodoSelector";
import RequierePeriodo from "@/components/RequierePeriodo";
import MovimientosTabla from "@/components/MovimientosTabla";

export default function GastosPage() {
  return (
    <main>
      <PageHeader title="Gastos" subtitle="Presupuesto del período" />
      <RequierePeriodo>
        <Contenido />
      </RequierePeriodo>
    </main>
  );
}

function Contenido() {
  const {
    periodos,
    periodo,
    movimientos,
    seleccionarPeriodo,
    registrarPeriodoNuevo,
    eliminarMovimiento,
  } = usePeriodo();

  if (!periodo) return null;

  return (
    <div className="space-y-5">
      <PeriodoSelector
        periodos={periodos}
        seleccionado={periodo}
        onSelect={seleccionarPeriodo}
        onCreado={registrarPeriodoNuevo}
      />
      <MovimientosTabla
        movimientos={movimientos}
        onEliminar={eliminarMovimiento}
      />
    </div>
  );
}
