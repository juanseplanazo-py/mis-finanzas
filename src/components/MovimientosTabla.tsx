"use client";

import { useState } from "react";
import Link from "next/link";
import type { Movimiento } from "@/lib/types";
import { formatGuaranies, formatFecha } from "@/lib/format";
import { estadoMovimiento, type EstadoMovimiento } from "@/lib/calc";
import CategoriaBadge from "./CategoriaBadge";

function montoClase(n: number) {
  return n < 0 ? "text-red-600" : "text-gray-900";
}

const puntoColor: Record<EstadoMovimiento, string> = {
  pendiente: "bg-gray-300",
  parcial: "bg-amber-400",
  pagado: "bg-green-500",
};

const puntoTitulo: Record<EstadoMovimiento, string> = {
  pendiente: "Pendiente (sin pagar)",
  parcial: "Pago parcial",
  pagado: "Pagado",
};

function EstadoPunto({ mov }: { mov: Movimiento }) {
  const estado = estadoMovimiento(mov);
  return (
    <span
      title={puntoTitulo[estado]}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${puntoColor[estado]}`}
    />
  );
}

/** Acciones Editar / Eliminar con confirmación inline (nunca borra directo). */
function Acciones({
  mov,
  onEliminar,
}: {
  mov: Movimiento;
  onEliminar: (id: string) => Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  if (confirmando) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-gray-600">
          ¿Seguro que querés eliminar este registro?
        </span>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="font-medium text-gray-500"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={borrando}
          onClick={async () => {
            setBorrando(true);
            try {
              await onEliminar(mov.id);
            } finally {
              setBorrando(false);
            }
          }}
          className="font-semibold text-red-600 disabled:opacity-60"
        >
          {borrando ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={`/editar/${mov.id}`}
        className="font-medium text-blue-600"
      >
        Editar
      </Link>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="font-medium text-red-600"
      >
        Eliminar
      </button>
    </div>
  );
}

/** Vista mobile: tarjeta con lo esencial + detalle desplegable (incluye acciones). */
function FilaMobile({
  mov,
  onEliminar,
}: {
  mov: Movimiento;
  onEliminar: (id: string) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <li className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <EstadoPunto mov={mov} />
            {mov.razon}
          </p>
          <p className="truncate text-sm text-gray-600">{mov.concepto}</p>
          <p className="mt-0.5 text-xs text-gray-400">{formatFecha(mov.fecha)}</p>
          <div className="mt-1">
            <CategoriaBadge categoria={mov.categoria} />
          </div>
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className="text-gray-500">
            Inicial{" "}
            <span className="font-medium text-gray-900">
              {formatGuaranies(mov.inicial)}
            </span>
          </p>
          <p className="text-gray-500">
            Pagado{" "}
            <span className="font-medium text-gray-900">
              {formatGuaranies(mov.pagado)}
            </span>
          </p>
          <p className="text-gray-500">
            Sobrante{" "}
            <span className={`font-semibold ${montoClase(mov.sobrante)}`}>
              {formatGuaranies(mov.sobrante)}
            </span>
          </p>
        </div>
      </button>

      {abierto && (
        <div className="border-t border-gray-100 px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt className="text-gray-500">Método</dt>
            <dd className="text-right text-gray-900">{mov.metodo_pago}</dd>
            <dt className="text-gray-500">Categoría</dt>
            <dd className="text-right text-gray-900">{mov.categoria}</dd>
            <dt className="text-gray-500">Subcategoría</dt>
            <dd className="text-right text-gray-900">{mov.subcategoria}</dd>
          </dl>
          <div className="mt-3 border-t border-gray-100 pt-3">
            <Acciones mov={mov} onEliminar={onEliminar} />
          </div>
        </div>
      )}
    </li>
  );
}

export default function MovimientosTabla({
  movimientos,
  onEliminar,
}: {
  movimientos: Movimiento[];
  onEliminar: (id: string) => Promise<void>;
}) {
  if (movimientos.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Este período todavía no tiene ítems. Tocá <strong>+ Agregar</strong> para
        cargar un gasto previsto.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: lista de tarjetas desplegables */}
      <ul className="space-y-3 md:hidden">
        {movimientos.map((mov) => (
          <FilaMobile key={mov.id} mov={mov} onEliminar={onEliminar} />
        ))}
      </ul>

      {/* Desktop: tabla completa (con scroll horizontal de respaldo) */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <th className="px-3 py-2 font-medium">Razón</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Método</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Subcategoría</th>
              <th className="px-3 py-2 text-right font-medium">Inicial</th>
              <th className="px-3 py-2 text-right font-medium">Pagado</th>
              <th className="px-3 py-2 text-right font-medium">Sobrante</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    <EstadoPunto mov={mov} />
                    {mov.razon}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700">{mov.concepto}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  {formatFecha(mov.fecha)}
                </td>
                <td className="px-3 py-2 text-gray-700">{mov.metodo_pago}</td>
                <td className="px-3 py-2">
                  <CategoriaBadge categoria={mov.categoria} />
                </td>
                <td className="px-3 py-2 text-gray-700">{mov.subcategoria}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900">
                  {formatGuaranies(mov.inicial)}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900">
                  {formatGuaranies(mov.pagado)}
                </td>
                <td
                  className={`px-3 py-2 text-right whitespace-nowrap font-semibold ${montoClase(
                    mov.sobrante,
                  )}`}
                >
                  {formatGuaranies(mov.sobrante)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Acciones mov={mov} onEliminar={onEliminar} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
