"use client";

import { supabase } from "@/lib/supabase";
import { usePeriodo } from "@/lib/periodo-context";
import { calcularResumen, dentroDeLoPlanificado } from "@/lib/calc";
import { formatGuaranies } from "@/lib/format";
import LogoJ from "@/components/LogoJ";
import PeriodoSelector from "@/components/PeriodoSelector";
import RequierePeriodo from "@/components/RequierePeriodo";
import IngresoEditable from "@/components/IngresoEditable";
import KpiCard from "@/components/KpiCard";
import ResumenRapido from "@/components/ResumenRapido";

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
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-xs font-medium text-slate-400 active:text-slate-600"
        >
          Salir
        </button>
      </header>

      <RequierePeriodo>
        <Contenido />
      </RequierePeriodo>
    </main>
  );
}

function Contenido() {
  const { periodos, periodo, movimientos, seleccionarPeriodo, registrarPeriodoNuevo } =
    usePeriodo();

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

      <IngresoEditable />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Pagado" value={r.pagado} />
        <KpiCard
          label="Falta por gastar"
          value={r.faltaPorGastar}
          tono={r.faltaPorGastar < 0 ? "negativo" : "neutro"}
        />
        <KpiCard
          label="Disponible real"
          value={r.disponibleReal}
          tono={r.disponibleReal < 0 ? "negativo" : "neutro"}
        />
        <KpiCard label="Presupuestado" value={r.presupuestado} />
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          ok
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <p className="text-sm font-semibold">
          {ok
            ? "✓ Vas dentro de lo planificado"
            : "Atención: tu disponible es menor a lo que falta por gastar"}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="opacity-70">Disponible real</span>
            <p className="font-semibold tabular-nums">
              {formatGuaranies(r.disponibleReal)}
            </p>
          </div>
          <div>
            <span className="opacity-70">Falta por gastar</span>
            <p className="font-semibold tabular-nums">
              {formatGuaranies(r.faltaPorGastar)}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resumen rápido
        </h2>
        <ResumenRapido />
      </section>
    </div>
  );
}
