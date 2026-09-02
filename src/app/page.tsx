"use client";

import { supabase } from "@/lib/supabase";
import { usePeriodo } from "@/lib/periodo-context";
import { calcularResumen, dentroDeLoPlanificado } from "@/lib/calc";
import LogoJ from "@/components/LogoJ";
import PeriodoSelector from "@/components/PeriodoSelector";
import RequierePeriodo from "@/components/RequierePeriodo";
import IngresoEditable from "@/components/IngresoEditable";
import KpiCard from "@/components/KpiCard";
import Money from "@/components/Money";
import ResumenRapido from "@/components/ResumenRapido";
import PrivacyToggle from "@/components/PrivacyToggle";

export default function InicioPage() {
  return (
    <main>
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoJ size={30} />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Mis Finanzas
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <PrivacyToggle />
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 active:bg-slate-100 active:text-slate-600"
          >
            Salir
          </button>
        </div>
      </header>

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

  const r = calcularResumen(movimientos, periodo.ingreso);
  const ok = dentroDeLoPlanificado(r);

  return (
    <div className="space-y-6">
      <PeriodoSelector
        periodos={periodos}
        seleccionado={periodo}
        onSelect={seleccionarPeriodo}
        onCreado={registrarPeriodoNuevo}
      />

      <div className="space-y-3">
        <IngresoEditable />

        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Pagado" value={r.pagado} />
          <KpiCard
            label="Falta por gastar"
            value={r.faltaPorGastar}
            tono={r.faltaPorGastar < 0 ? "negativo" : "neutro"}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Disponible real
          </p>
          <Money
            value={r.disponibleReal}
            tono={r.disponibleReal < 0 ? "negativo" : "neutro"}
            className="mt-1 block text-2xl font-bold"
          />
          <p
            className={`mt-1 text-xs font-medium ${
              ok ? "text-green-600" : "text-amber-600"
            }`}
          >
            {ok
              ? "✓ Vas dentro de lo planificado"
              : "⚠ Tu disponible es menor a lo que falta por gastar"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resumen rápido
        </h2>
        <ResumenRapido />
      </section>
    </div>
  );
}
