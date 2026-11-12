"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import {
  fetchAhorros,
  fetchTarjetas,
  fetchTarjetaMovimientos,
  fetchDeudas,
  fetchDeudasMias,
} from "@/lib/queries";
import { fetchMetasConProgreso } from "@/lib/metas-data";
import { calcularResumen, deudaTarjeta, totalAhorros, totalMeDeben } from "@/lib/calc";
import {
  controlPeriodo,
  mayoresDesvios,
  patrimonioLiquido,
  topCategorias,
  type MetaConProgreso,
  type Semaforo,
} from "@/lib/analisis";
import { usePeriodo } from "@/lib/periodo-context";
import PageHeader from "./PageHeader";
import PeriodoSelector from "./PeriodoSelector";
import Money from "./Money";
import MetaProgreso from "./MetaProgreso";

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {children}
      </div>
    </section>
  );
}

const SEMAFORO: Record<
  Semaforo,
  { titulo: string; clase: string; icono: typeof CheckCircle2 }
> = {
  verde: {
    titulo: "Vas bien",
    clase: "bg-green-50 text-green-700",
    icono: CheckCircle2,
  },
  amarillo: {
    titulo: "Ajustado",
    clase: "bg-amber-50 text-amber-700",
    icono: AlertTriangle,
  },
  rojo: {
    titulo: "Te estás quedando corto",
    clase: "bg-red-50 text-red-700",
    icono: XCircle,
  },
};

interface Globales {
  ahorros: number;
  deudaTarjetas: number;
  meDeben: number;
  yoDebo: number;
  metas: MetaConProgreso[];
}

export default function AnalisisVista() {
  const {
    periodos,
    periodo,
    movimientos,
    seleccionarPeriodo,
    registrarPeriodoNuevo,
    eliminarPeriodo,
  } = usePeriodo();
  const [g, setG] = useState<Globales | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      fetchAhorros(),
      fetchTarjetas(),
      fetchTarjetaMovimientos(),
      fetchDeudas(),
      fetchDeudasMias().catch(() => []),
      fetchMetasConProgreso(),
    ])
      .then(([ahorros, tarjetas, tmovs, deudas, mias, metas]) => {
        if (!activo) return;
        setG({
          ahorros: totalAhorros(ahorros),
          deudaTarjetas: tarjetas.reduce(
            (acc, t) =>
              acc + deudaTarjeta(tmovs.filter((m) => m.tarjeta_id === t.id)),
            0,
          ),
          meDeben: totalMeDeben(deudas),
          yoDebo: totalMeDeben(mias),
          metas,
        });
      })
      .catch(() => activo && setG(null));
    return () => {
      activo = false;
    };
  }, []);

  const control = useMemo(
    () => (periodo ? controlPeriodo(movimientos, periodo) : null),
    [movimientos, periodo],
  );
  const categorias = useMemo(() => topCategorias(movimientos), [movimientos]);
  const desvios = useMemo(() => mayoresDesvios(movimientos), [movimientos]);

  if (!periodo || !control) return null;

  const resumen = calcularResumen(movimientos, periodo.ingreso);
  const s = SEMAFORO[control.semaforo];
  const Icono = s.icono;
  const tiempoPct = (control.diasTranscurridos / control.diasTotales) * 100;
  const patrimonio = g
    ? patrimonioLiquido({
        disponibleReal: resumen.disponibleReal,
        ahorros: g.ahorros,
        deudaTarjetas: g.deudaTarjetas,
        meDeben: g.meDeben,
        yoDebo: g.yoDebo,
      })
    : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Análisis" subtitle={periodo.nombre} />

      <PeriodoSelector
        periodos={periodos}
        seleccionado={periodo}
        onSelect={seleccionarPeriodo}
        onCreado={registrarPeriodoNuevo}
        onEliminado={eliminarPeriodo}
      />

      {/* A. Control del período */}
      <Seccion titulo="Control del período">
        <div className={`flex items-start gap-3 rounded-xl p-3 ${s.clase}`}>
          <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{s.titulo}</p>
            <p className="mt-0.5 text-sm">
              {control.semaforo === "rojo" ? (
                <>
                  Te faltan <Money value={Math.abs(control.margen)} className="font-semibold" tono="negativo" /> para
                  cubrir lo que falta por gastar.
                </>
              ) : control.semaforo === "amarillo" ? (
                <>
                  Alcanza, pero te sobran solo{" "}
                  <Money value={control.margen} className="font-semibold" />.
                </>
              ) : (
                <>
                  Tu Disponible real cubre lo que falta y te sobran{" "}
                  <Money value={control.margen} className="font-semibold" />.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-600">Presupuesto consumido</span>
            <span className="font-semibold text-slate-900">
              {Math.round(control.consumidoPct)}%
            </span>
          </div>
          <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                control.consumidoPct > 100 ? "bg-red-500" : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(control.consumidoPct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Día {control.diasTranscurridos} de {control.diasTotales} (
            {Math.round(tiempoPct)}% del período).
            {control.consumidoPct > tiempoPct + 10
              ? " Vas más rápido que el calendario."
              : control.consumidoPct < tiempoPct - 10
                ? " Vas más lento que el calendario."
                : ""}
          </p>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cómo cerrarías el período
          </p>
          <p>
            Pagando lo que falta según lo presupuestado:{" "}
            <Money
              value={control.cierreSegunPresupuesto}
              tono={control.cierreSegunPresupuesto < 0 ? "negativo" : "neutro"}
              className="font-semibold"
            />
          </p>
          {control.tasaDesvio > 0.005 && (
            <p>
              Con el mismo desvío que llevás (+
              {Math.round(control.tasaDesvio * 100)}%):{" "}
              <Money
                value={control.cierreAlRitmo}
                tono={control.cierreAlRitmo < 0 ? "negativo" : "neutro"}
                className="font-semibold"
              />
            </p>
          )}
          <p className="text-xs text-slate-400">
            Es una estimación a partir de tus propios gastos ya pagados.
          </p>
        </div>
      </Seccion>

      {/* B. ¿Por dónde se me va la plata? */}
      <Seccion titulo="¿Por dónde se va la plata?">
        {categorias.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay gastos pagados en este período.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              Lo que más pesó: <strong>{categorias[0].nombre}</strong> (
              {Math.round(categorias[0].pct)}% de lo gastado).
            </p>
            <ul className="space-y-3">
              {categorias.map((c) => (
                <li key={c.nombre}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-slate-700">{c.nombre}</span>
                    <Money value={c.total} className="shrink-0 font-semibold" />
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(c.pct, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Dónde te pasaste del presupuesto
          </p>
          {desvios.length === 0 ? (
            <p className="mt-1.5 text-sm text-slate-500">
              Ningún gasto superó lo presupuestado.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {desvios.map((d) => (
                <li
                  key={d.nombre}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="truncate text-slate-700">{d.nombre}</span>
                  <span className="shrink-0 text-red-600">
                    +<Money value={d.exceso} tono="negativo" className="font-semibold" />
                    {d.pct !== null ? ` (${Math.round(d.pct)}%)` : " (sin presupuesto)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Seccion>

      {/* Metas */}
      <Seccion titulo="Metas de ahorro">
        {!g ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : g.metas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no tenés metas.{" "}
            <Link href="/ahorros?vista=metas" className="font-medium text-blue-600">
              Crear una
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {g.metas.map((m) => (
              <MetaProgreso
                key={m.meta.id}
                item={m}
                reservado={periodo.ahorro_reservado ?? 0}
                finPeriodo={periodo.fecha_fin}
              />
            ))}
            <Link
              href="/ahorros?vista=metas"
              className="flex items-center gap-1 text-sm font-medium text-blue-600"
            >
              Administrar metas
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </Seccion>

      {/* D. Patrimonio líquido */}
      <Seccion titulo="Patrimonio líquido">
        {!g || patrimonio === null ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : (
          <>
            <dl className="space-y-2 text-sm">
              <Fila label="Disponible real del período" valor={resumen.disponibleReal} />
              <Fila label="+ Ahorros" valor={g.ahorros} />
              <Fila label="− Deuda de tarjetas" valor={g.deudaTarjetas} />
              <Fila label="+ Me deben" valor={g.meDeben} />
              <Fila label="− Yo debo" valor={g.yoDebo} />
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-slate-900">
                Patrimonio líquido aprox.
              </span>
              <Money
                value={patrimonio}
                tono={patrimonio < 0 ? "negativo" : "neutro"}
                className="text-xl font-bold"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              El Fondo de emergencia ya está incluido en Ahorros, por eso no se
              suma aparte.
            </p>
          </>
        )}
      </Seccion>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd>
        <Money value={valor} className="font-medium" />
      </dd>
    </div>
  );
}
