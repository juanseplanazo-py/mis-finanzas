"use client";

import { usePeriodo } from "@/lib/periodo-context";
import PageHeader from "@/components/PageHeader";
import PeriodoSelector from "@/components/PeriodoSelector";
import RequierePeriodo from "@/components/RequierePeriodo";
import GastosLista from "@/components/GastosLista";

export default function GastosPage() {
  return (
    <main>
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
  } = usePeriodo();

  if (!periodo) return null;

  return (
    <div className="space-y-5">
      <PageHeader title="Gastos" subtitle={periodo.nombre} />
      <PeriodoSelector
        periodos={periodos}
        seleccionado={periodo}
        onSelect={seleccionarPeriodo}
        onCreado={registrarPeriodoNuevo}
      />
      <GastosLista movimientos={movimientos} />
    </div>
  );
}
