"use client";

import { useCallback, useEffect, useState } from "react";
import { Target, Plus, Pencil, Trash2 } from "lucide-react";
import type { Ahorro, MetaAhorro, OrigenMeta } from "@/lib/types";
import {
  fetchAhorros,
  insertMeta,
  updateMeta,
  deleteMeta,
} from "@/lib/queries";
import { fetchMetasConProgreso } from "@/lib/metas-data";
import type { MetaConProgreso } from "@/lib/analisis";
import { usePeriodo } from "@/lib/periodo-context";
import { parseMonto } from "@/lib/format";
import PageHeader from "./PageHeader";
import Money from "./Money";
import BottomSheet from "./BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MontoInput from "./MontoInput";
import MetaProgreso from "./MetaProgreso";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

interface Datos {
  nombre: string;
  monto_meta: number;
  fecha_objetivo: string | null;
  origen: OrigenMeta;
  ahorro_id: string | null;
}

function MetaForm({
  inicial,
  cuentas,
  onGuardar,
  onCancelar,
}: {
  inicial?: MetaAhorro;
  cuentas: Ahorro[];
  onGuardar: (d: Datos) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [monto, setMonto] = useState(
    inicial?.monto_meta != null ? String(inicial.monto_meta) : "",
  );
  const [fecha, setFecha] = useState(inicial?.fecha_objetivo ?? "");
  const [origen, setOrigen] = useState<OrigenMeta>(inicial?.origen ?? "fondo");
  const [ahorroId, setAhorroId] = useState(
    inicial?.ahorro_id ?? cuentas[0]?.id ?? "",
  );
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return setErr("El nombre es obligatorio.");
        if (parseMonto(monto) <= 0) return setErr("Ingresá una meta mayor a 0.");
        if (origen === "cuenta" && !ahorroId)
          return setErr("Elegí la cuenta de ahorro vinculada.");
        setG(true);
        try {
          await onGuardar({
            nombre: nombre.trim(),
            monto_meta: parseMonto(monto),
            fecha_objetivo: fecha || null,
            origen,
            ahorro_id: origen === "cuenta" ? ahorroId : null,
          });
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre de la meta
        </label>
        <input
          className={inputClass}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Fondo de emergencia"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Monto a juntar
        </label>
        <MontoInput value={monto} onChange={setMonto} placeholder="0" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          ¿Dónde está ese dinero?
        </label>
        <select
          className={inputClass}
          value={origen}
          onChange={(e) => setOrigen(e.target.value as OrigenMeta)}
        >
          <option value="fondo">En el Fondo de emergencia</option>
          <option value="cuenta" disabled={cuentas.length === 0}>
            En una cuenta de Ahorros
          </option>
        </select>
        <p className="mt-1 text-xs text-slate-400">
          El avance sale del saldo de ese lugar; no hay que cargarlo dos veces.
        </p>
      </div>
      {origen === "cuenta" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Cuenta
          </label>
          <select
            className={inputClass}
            value={ahorroId}
            onChange={(e) => setAhorroId(e.target.value)}
          >
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Fecha objetivo{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="date"
          className={inputClass}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={g}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {g ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Card del monto que se aparta para ahorrar en el período actual. */
function AhorroReservado() {
  const { periodo, cambiarAhorroReservado } = usePeriodo();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!periodo) return null;

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Reservado para ahorrar · {periodo.nombre}
      </p>
      {editando ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <MontoInput value={valor} onChange={setValor} autoFocus />
          </div>
          <button
            type="button"
            disabled={g}
            onClick={async () => {
              setG(true);
              setErr(null);
              try {
                await cambiarAhorroReservado(parseMonto(valor));
                setEditando(false);
              } catch {
                setErr("No se pudo guardar.");
              } finally {
                setG(false);
              }
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {g ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="px-2 py-2 text-sm text-slate-500"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <Money
            value={periodo.ahorro_reservado ?? 0}
            className="text-2xl font-semibold"
          />
          <button
            type="button"
            onClick={() => {
              setValor(String(periodo.ahorro_reservado ?? 0));
              setErr(null);
              setEditando(true);
            }}
            className="text-sm font-medium text-blue-600"
          >
            Editar
          </button>
        </div>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      <p className="mt-1 text-xs text-slate-400">
        Es solo un recordatorio: no cambia tu Disponible real. Sirve para
        estimar cuándo llegás a cada meta.
      </p>
    </div>
  );
}

export default function MetasVista({
  selector,
}: {
  selector?: React.ReactNode;
}) {
  const { periodo } = usePeriodo();
  const [items, setItems] = useState<MetaConProgreso[]>([]);
  const [cuentas, setCuentas] = useState<Ahorro[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [sheet, setSheet] = useState<
    { modo: "nueva" } | { modo: "editar"; m: MetaAhorro } | null
  >(null);
  const [borrar, setBorrar] = useState<MetaAhorro | null>(null);
  const [proc, setProc] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [metas, ahorros] = await Promise.all([
        fetchMetasConProgreso(),
        fetchAhorros(),
      ]);
      setItems(metas);
      setCuentas(ahorros);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reservado = periodo?.ahorro_reservado ?? 0;

  return (
    <div>
      <PageHeader
        title="Ahorros"
        subtitle="Metas"
        right={
          <button
            type="button"
            onClick={() => setSheet({ modo: "nueva" })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        }
      />

      {selector}

      {estado === "error" && (
        <p className="text-sm text-red-600">No se pudieron cargar las metas.</p>
      )}

      <AhorroReservado />

      <div className="space-y-3">
        {estado === "listo" && items.length === 0 && (
          <EmptyState
            title="Todavía no tenés metas"
            hint="Tocá Agregar para crear la primera (por ejemplo, tu fondo de emergencia)."
          />
        )}

        {items.map((it) => (
          <div
            key={it.meta.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Target className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <MetaProgreso
                  item={it}
                  reservado={reservado}
                  finPeriodo={periodo?.fecha_fin ?? null}
                />
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Editar meta"
                  onClick={() => setSheet({ modo: "editar", m: it.meta })}
                  className="rounded-lg p-2 text-slate-400 active:bg-slate-100 active:text-blue-600"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar meta"
                  onClick={() => setBorrar(it.meta)}
                  className="rounded-lg p-2 text-slate-400 active:bg-red-50 active:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.modo === "editar" ? "Editar meta" : "Nueva meta de ahorro"}
      >
        {sheet && (
          <MetaForm
            inicial={sheet.modo === "editar" ? sheet.m : undefined}
            cuentas={cuentas}
            onCancelar={() => setSheet(null)}
            onGuardar={async (datos) => {
              if (sheet.modo === "editar") {
                await updateMeta(sheet.m.id, datos);
              } else {
                await insertMeta(datos);
              }
              setSheet(null);
              await cargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrar !== null}
        title="¿Eliminar esta meta?"
        description={
          borrar
            ? `${borrar.nombre} — no se borra ningún saldo, solo la meta.`
            : undefined
        }
        confirmLabel="Eliminar"
        loading={proc}
        onCancel={() => setBorrar(null)}
        onConfirm={async () => {
          if (!borrar) return;
          setProc(true);
          try {
            await deleteMeta(borrar.id);
            setBorrar(null);
            await cargar();
          } finally {
            setProc(false);
          }
        }}
      />
    </div>
  );
}
