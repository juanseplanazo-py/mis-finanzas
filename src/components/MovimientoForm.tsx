"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase";
import {
  fetchPeriodos,
  insertMovimiento,
  updateMovimiento,
  setUsarDetalles,
} from "@/lib/queries";
import { resolverSeleccionado } from "@/lib/periodos";
import type { Movimiento, NuevoMovimiento, Periodo } from "@/lib/types";
import {
  RAZONES,
  CATEGORIAS,
  SUBCATEGORIAS,
  METODOS_PAGO,
} from "@/lib/constants";
import {
  formatGuaranies,
  formatMontoInput,
  parseMonto,
  hoyISO,
} from "@/lib/format";

const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const fieldClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

/** Incluye el valor actual como opción aunque no esté en la lista base (datos viejos / import). */
function opciones(lista: readonly string[], actual: string): string[] {
  return lista.includes(actual) ? [...lista] : [actual, ...lista];
}

export default function MovimientoForm({
  movimiento,
  modoDetalle = false,
}: {
  movimiento?: Movimiento;
  /** Alta de "gasto detallado": Pagado arranca derivado del detalle (0). */
  modoDetalle?: boolean;
}) {
  const router = useRouter();
  const editando = Boolean(movimiento);

  // Pagado no editable cuando: alta detallada, o edición de un movimiento derivado.
  const detalleNuevo = !editando && modoDetalle;
  const pagadoBloqueado =
    detalleNuevo || (editando && Boolean(movimiento?.usar_detalles));

  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [periodoEstado, setPeriodoEstado] = useState<
    "cargando" | "listo" | "sin-periodo"
  >(editando ? "listo" : "cargando");

  const [razon, setRazon] = useState(movimiento?.razon ?? RAZONES[0]);
  const [concepto, setConcepto] = useState(movimiento?.concepto ?? "");
  const [categoria, setCategoria] = useState(
    movimiento?.categoria ?? CATEGORIAS[0],
  );
  const [subcategoria, setSubcategoria] = useState(
    movimiento?.subcategoria ?? SUBCATEGORIAS[0],
  );
  const [inicial, setInicial] = useState(
    movimiento ? String(movimiento.inicial) : "",
  );
  const [pagado, setPagado] = useState(
    movimiento ? String(movimiento.pagado) : "",
  );
  const [metodoPago, setMetodoPago] = useState(
    movimiento?.metodo_pago ?? METODOS_PAGO[0],
  );
  const [fecha, setFecha] = useState(
    movimiento ? (movimiento.fecha ?? "") : hoyISO(),
  );

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let activo = true;
    if (!supabaseConfigured) {
      setPeriodoEstado(editando ? "listo" : "sin-periodo");
      return;
    }
    fetchPeriodos()
      .then((lista) => {
        if (!activo) return;
        if (editando) {
          setPeriodo(
            lista.find((p) => p.id === movimiento?.periodo_id) ?? null,
          );
          setPeriodoEstado("listo");
        } else {
          const sel = resolverSeleccionado(lista);
          if (sel) {
            setPeriodo(sel);
            setPeriodoEstado("listo");
          } else {
            setPeriodoEstado("sin-periodo");
          }
        }
      })
      .catch(() => {
        if (!activo) return;
        setPeriodoEstado(editando ? "listo" : "sin-periodo");
      });
    return () => {
      activo = false;
    };
  }, [editando, movimiento]);

  const inicialNum = parseMonto(inicial);
  const pagadoNum = parseMonto(pagado);
  const sobrante = useMemo(() => inicialNum - pagadoNum, [inicialNum, pagadoNum]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!concepto.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }

    const campos = {
      razon,
      concepto: concepto.trim(),
      categoria,
      subcategoria,
      inicial: inicialNum,
      pagado: pagadoNum, // Pagado = 0 es válido (gasto previsto sin pagar).
      sobrante,
      metodo_pago: metodoPago,
      fecha: fecha || null, // La fecha es opcional (el Excel la tiene vacía).
    };

    setGuardando(true);
    try {
      if (editando && movimiento) {
        await updateMovimiento(movimiento.id, campos);
        setOk(true);
        setTimeout(() => {
          router.push(`/gastos/${movimiento.id}`);
          router.refresh();
        }, 700);
      } else {
        if (!periodo) {
          setError(
            "No hay un período activo. Creá uno en Inicio antes de agregar ítems.",
          );
          setGuardando(false);
          return;
        }

        if (detalleNuevo) {
          // Gasto detallado: pagado arranca en 0 y usar_detalles = true.
          const nuevo: NuevoMovimiento = {
            periodo_id: periodo.id,
            ...campos,
            pagado: 0,
            sobrante: inicialNum,
          };
          const row = await insertMovimiento(nuevo);
          await setUsarDetalles(row.id, true, 0, inicialNum);
          setOk(true);
          setTimeout(() => {
            router.push(`/gastos/${row.id}`);
            router.refresh();
          }, 700);
        } else {
          const nuevo: NuevoMovimiento = { periodo_id: periodo.id, ...campos };
          await insertMovimiento(nuevo);
          setOk(true);
          setTimeout(() => {
            router.push("/gastos");
            router.refresh();
          }, 700);
        }
      }
    } catch {
      setError("No se pudo guardar. Intentá de nuevo.");
      setGuardando(false);
    }
  }

  if (periodoEstado === "cargando") {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }

  if (periodoEstado === "sin-periodo") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        No hay un período activo. Abrí Inicio y creá un período (o ejecutá la
        migración de Supabase) antes de agregar ítems.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {periodo && (
        <p className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-600">
          Período:{" "}
          <span className="font-medium text-gray-900">{periodo.nombre}</span>
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="razon">
          Razón
        </label>
        <select
          id="razon"
          className={fieldClass}
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
        >
          {opciones(RAZONES, razon).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="concepto">
          Concepto
        </label>
        <input
          id="concepto"
          type="text"
          className={fieldClass}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Mensual"
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="categoria">
          Categoría
        </label>
        <select
          id="categoria"
          className={fieldClass}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {opciones(CATEGORIAS, categoria).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="subcategoria">
          Subcategoría
        </label>
        <select
          id="subcategoria"
          className={fieldClass}
          value={subcategoria}
          onChange={(e) => setSubcategoria(e.target.value)}
        >
          {opciones(SUBCATEGORIAS, subcategoria).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="inicial">
          Inicial
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500">
            Gs.
          </span>
          <input
            id="inicial"
            type="text"
            inputMode="numeric"
            className={`${fieldClass} pl-12`}
            value={formatMontoInput(inicial)}
            onChange={(e) => setInicial(e.target.value)}
            placeholder="200.000"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="pagado">
          Pagado
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-500">
            Gs.
          </span>
          <input
            id="pagado"
            type="text"
            inputMode="numeric"
            readOnly={pagadoBloqueado}
            className={`${fieldClass} pl-12 ${
              pagadoBloqueado ? "bg-gray-100 text-gray-500" : ""
            }`}
            value={formatMontoInput(pagado)}
            onChange={(e) => !pagadoBloqueado && setPagado(e.target.value)}
            placeholder="0"
          />
        </div>
        {pagadoBloqueado && (
          <p className="mt-1 text-xs text-gray-400">
            Se calcula automáticamente desde el detalle de gastos.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="metodo_pago">
          Método de pago
        </label>
        <select
          id="metodo_pago"
          className={fieldClass}
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
        >
          {opciones(METODOS_PAGO, metodoPago).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="fecha">
          Fecha <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <input
          id="fecha"
          type="date"
          className={fieldClass}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        {fecha && (
          <button
            type="button"
            onClick={() => setFecha("")}
            className="mt-1 text-xs font-medium text-blue-600"
          >
            Quitar fecha
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <span className="text-sm font-medium text-gray-700">Sobrante</span>
        <p
          className={`mt-1 text-xl font-semibold ${
            sobrante < 0 ? "text-red-600" : "text-gray-900"
          }`}
        >
          {formatGuaranies(sobrante)}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {ok && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {editando ? "Cambios guardados ✓" : "Ítem guardado ✓"}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando || ok}
        className="w-full rounded-xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
      >
        {guardando
          ? "Guardando…"
          : editando
            ? "Guardar cambios"
            : "Guardar"}
      </button>
    </form>
  );
}
