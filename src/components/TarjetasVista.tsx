"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  TarjetaCredito,
  TarjetaMovimiento,
  TipoTarjetaMovimiento,
} from "@/lib/types";
import {
  fetchTarjetas,
  fetchTarjetaMovimientos,
  insertTarjeta,
  updateTarjeta,
  deleteTarjeta,
  insertTarjetaMovimiento,
  updateTarjetaMovimiento,
  deleteTarjetaMovimiento,
} from "@/lib/queries";
import { deudaTarjeta, disponibleTarjeta } from "@/lib/calc";
import { parseMonto } from "@/lib/format";
import PageHeader from "./PageHeader";
import Money from "./Money";
import BottomSheet from "./BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

// ---- Formularios (dentro de sheets) --------------------------------------

function TarjetaForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: { nombre: string; linea: number };
  onGuardar: (nombre: string, linea: number) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [linea, setLinea] = useState(
    inicial?.linea != null ? String(inicial.linea) : "",
  );
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return setErr("El nombre es obligatorio.");
        setG(true);
        try {
          await onGuardar(nombre.trim(), parseMonto(linea));
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          className={inputClass}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="GNB"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Línea de crédito
        </label>
        <MontoInput value={linea} onChange={setLinea} placeholder="0" />
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

function ConceptoForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: { concepto: string; monto: number; tipo: TipoTarjetaMovimiento };
  onGuardar: (
    concepto: string,
    monto: number,
    tipo: TipoTarjetaMovimiento,
  ) => Promise<void>;
  onCancelar: () => void;
}) {
  const [concepto, setConcepto] = useState(inicial?.concepto ?? "");
  const [monto, setMonto] = useState(
    inicial?.monto != null ? String(inicial.monto) : "",
  );
  const [tipo, setTipo] = useState<TipoTarjetaMovimiento>(
    inicial?.tipo ?? "cargo",
  );
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!concepto.trim()) return setErr("El concepto es obligatorio.");
        setG(true);
        try {
          await onGuardar(concepto.trim(), parseMonto(monto), tipo);
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          className={inputClass}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Agosto"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Monto
        </label>
        <MontoInput value={monto} onChange={setMonto} placeholder="0" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          className={inputClass}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoTarjetaMovimiento)}
        >
          <option value="cargo">Cargo (suma a la deuda)</option>
          <option value="descuento">Descuento (resta de la deuda)</option>
        </select>
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

// ---- Card de una tarjeta -------------------------------------------------

function TarjetaCard({
  tarjeta,
  conceptos,
  onRecargar,
  onEditar,
  onEliminar,
}: {
  tarjeta: TarjetaCredito;
  conceptos: TarjetaMovimiento[];
  onRecargar: () => Promise<void>;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [sheetConcepto, setSheetConcepto] = useState<
    { modo: "nuevo" } | { modo: "editar"; c: TarjetaMovimiento } | null
  >(null);
  const [borrarConceptoId, setBorrarConceptoId] = useState<string | null>(null);
  const [proc, setProc] = useState(false);

  const deuda = deudaTarjeta(conceptos);
  const disponible = disponibleTarjeta(tarjeta.linea_credito, deuda);
  const usoPct =
    tarjeta.linea_credito > 0
      ? Math.min(Math.max(deuda / tarjeta.linea_credito, 0), 1) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-slate-900">
          {tarjeta.nombre}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Deuda
          </p>
          <Money value={deuda} className="mt-0.5 block text-base font-semibold" />
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Disponible
          </p>
          <Money
            value={disponible}
            tono={disponible < 0 ? "negativo" : "positivo"}
            className="mt-0.5 block text-base font-semibold"
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${usoPct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Línea{" "}
          <Money
            value={tarjeta.linea_credito}
            tono="tenue"
            className="text-xs"
          />
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600"
      >
        {abierto ? (
          <>
            Ocultar detalle <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </>
        ) : (
          <>
            Ver detalle <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      {abierto && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {conceptos.length === 0 ? (
            <EmptyState title="Sin conceptos cargados" />
          ) : (
            <ul className="space-y-2">
              {conceptos.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="text-slate-900">{c.concepto}</span>
                    <span
                      className={`ml-2 text-xs ${
                        c.tipo === "descuento"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      {c.tipo}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-medium text-slate-900">
                      {c.tipo === "descuento" ? "−" : ""}
                      <Money value={c.monto} className="font-medium" />
                    </span>
                    <button
                      type="button"
                      aria-label="Editar concepto"
                      onClick={() => setSheetConcepto({ modo: "editar", c })}
                      className="text-slate-400 active:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar concepto"
                      onClick={() => setBorrarConceptoId(c.id)}
                      className="text-slate-400 active:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setSheetConcepto({ modo: "nuevo" })}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar concepto
          </button>

          <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-sm">
            <button
              type="button"
              onClick={onEditar}
              className="font-medium text-blue-600"
            >
              Editar tarjeta
            </button>
            <button
              type="button"
              onClick={onEliminar}
              className="font-medium text-red-600"
            >
              Eliminar tarjeta
            </button>
          </div>
        </div>
      )}

      <BottomSheet
        open={sheetConcepto !== null}
        onClose={() => setSheetConcepto(null)}
        title={
          sheetConcepto?.modo === "editar" ? "Editar concepto" : "Nuevo concepto"
        }
      >
        {sheetConcepto && (
          <ConceptoForm
            inicial={
              sheetConcepto.modo === "editar"
                ? {
                    concepto: sheetConcepto.c.concepto,
                    monto: sheetConcepto.c.monto,
                    tipo: sheetConcepto.c.tipo,
                  }
                : undefined
            }
            onCancelar={() => setSheetConcepto(null)}
            onGuardar={async (concepto, monto, tipo) => {
              if (sheetConcepto.modo === "editar") {
                await updateTarjetaMovimiento(sheetConcepto.c.id, {
                  concepto,
                  monto,
                  tipo,
                });
              } else {
                await insertTarjetaMovimiento({
                  tarjeta_id: tarjeta.id,
                  concepto,
                  monto,
                  tipo,
                });
              }
              setSheetConcepto(null);
              await onRecargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrarConceptoId !== null}
        title="¿Eliminar este concepto?"
        confirmLabel="Eliminar"
        loading={proc}
        onCancel={() => setBorrarConceptoId(null)}
        onConfirm={async () => {
          if (!borrarConceptoId) return;
          setProc(true);
          try {
            await deleteTarjetaMovimiento(borrarConceptoId);
            setBorrarConceptoId(null);
            await onRecargar();
          } finally {
            setProc(false);
          }
        }}
      />
    </div>
  );
}

// ---- Vista -------------------------------------------------------------

export default function TarjetasVista({
  autoNueva = false,
}: {
  autoNueva?: boolean;
}) {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([]);
  const [conceptos, setConceptos] = useState<TarjetaMovimiento[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [sheetTarjeta, setSheetTarjeta] = useState<
    { modo: "nueva" } | { modo: "editar"; t: TarjetaCredito } | null
  >(autoNueva ? { modo: "nueva" } : null);
  const [borrarTarjeta, setBorrarTarjeta] = useState<TarjetaCredito | null>(null);
  const [proc, setProc] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [ts, cs] = await Promise.all([
        fetchTarjetas(),
        fetchTarjetaMovimientos(),
      ]);
      setTarjetas(ts);
      setConceptos(cs);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totales = useMemo(() => {
    const deuda = tarjetas.reduce(
      (acc, t) =>
        acc + deudaTarjeta(conceptos.filter((c) => c.tarjeta_id === t.id)),
      0,
    );
    const linea = tarjetas.reduce((acc, t) => acc + t.linea_credito, 0);
    return { deuda, disponible: linea - deuda };
  }, [tarjetas, conceptos]);

  return (
    <div>
      <PageHeader
        title="Tarjetas de crédito"
        right={
          <button
            type="button"
            onClick={() => setSheetTarjeta({ modo: "nueva" })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        }
      />

      {estado === "error" && (
        <p className="text-sm text-red-600">No se pudieron cargar las tarjetas.</p>
      )}

      {estado === "listo" && tarjetas.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Deuda total
            </p>
            <Money
              value={totales.deuda}
              className="mt-0.5 block text-lg font-bold"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Disponible total
            </p>
            <Money
              value={totales.disponible}
              tono="positivo"
              className="mt-0.5 block text-lg font-bold"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {estado === "listo" && tarjetas.length === 0 && (
          <EmptyState
            title="No hay tarjetas"
            hint="Tocá Agregar para cargar la primera."
          />
        )}

        {tarjetas.map((t) => (
          <TarjetaCard
            key={t.id}
            tarjeta={t}
            conceptos={conceptos.filter((c) => c.tarjeta_id === t.id)}
            onRecargar={cargar}
            onEditar={() => setSheetTarjeta({ modo: "editar", t })}
            onEliminar={() => setBorrarTarjeta(t)}
          />
        ))}
      </div>

      <BottomSheet
        open={sheetTarjeta !== null}
        onClose={() => setSheetTarjeta(null)}
        title={
          sheetTarjeta?.modo === "editar" ? "Editar tarjeta" : "Nueva tarjeta"
        }
      >
        {sheetTarjeta && (
          <TarjetaForm
            inicial={
              sheetTarjeta.modo === "editar"
                ? {
                    nombre: sheetTarjeta.t.nombre,
                    linea: sheetTarjeta.t.linea_credito,
                  }
                : undefined
            }
            onCancelar={() => setSheetTarjeta(null)}
            onGuardar={async (nombre, linea) => {
              if (sheetTarjeta.modo === "editar") {
                await updateTarjeta(sheetTarjeta.t.id, {
                  nombre,
                  linea_credito: linea,
                });
              } else {
                await insertTarjeta({ nombre, linea_credito: linea });
              }
              setSheetTarjeta(null);
              await cargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrarTarjeta !== null}
        title="¿Eliminar la tarjeta?"
        description={
          borrarTarjeta
            ? `${borrarTarjeta.nombre} — también borra sus ${
                conceptos.filter((c) => c.tarjeta_id === borrarTarjeta.id).length
              } concepto(s).`
            : undefined
        }
        confirmLabel="Eliminar tarjeta"
        loading={proc}
        onCancel={() => setBorrarTarjeta(null)}
        onConfirm={async () => {
          if (!borrarTarjeta) return;
          setProc(true);
          try {
            await deleteTarjeta(borrarTarjeta.id);
            setBorrarTarjeta(null);
            await cargar();
          } finally {
            setProc(false);
          }
        }}
      />
    </div>
  );
}
