"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Movimiento } from "@/lib/types";
import { formatFecha } from "@/lib/format";
import { StatusDot } from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import EmptyState from "./EmptyState";
import Money from "./Money";

type Filtro = "todos" | "Fijo" | "Variable" | "Ahorro" | "Deuda";

const chips: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "Fijo", label: "Fijos" },
  { key: "Variable", label: "Variables" },
  { key: "Ahorro", label: "Ahorro" },
  { key: "Deuda", label: "Deuda" },
];

// Orden de las secciones por categoría.
const ordenCategorias = ["Fijo", "Variable", "Ahorro", "Deuda"];

function coincide(m: Movimiento, q: string): boolean {
  if (!q) return true;
  const t = q.toLowerCase();
  return (
    m.razon.toLowerCase().includes(t) ||
    m.concepto.toLowerCase().includes(t) ||
    m.categoria.toLowerCase().includes(t) ||
    m.subcategoria.toLowerCase().includes(t)
  );
}

// --- Orden manual por categoría, guardado en este dispositivo -------------

function claveOrden(periodoId: string, categoria: string): string {
  return `mf_orden_${periodoId}_${categoria}`;
}

function leerOrden(clave: string): string[] {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function guardarOrden(clave: string, ids: string[]) {
  try {
    localStorage.setItem(clave, JSON.stringify(ids));
  } catch {}
}

/** Aplica el orden manual guardado; los ítems nuevos van al final. */
function aplicarOrden(items: Movimiento[], clave: string): Movimiento[] {
  const guardado = leerOrden(clave);
  if (guardado.length === 0) return items;
  const porId = new Map(items.map((m) => [m.id, m]));
  const ordenados: Movimiento[] = [];
  for (const id of guardado) {
    const m = porId.get(id);
    if (m) {
      ordenados.push(m);
      porId.delete(id);
    }
  }
  for (const m of items) if (porId.has(m.id)) ordenados.push(m);
  return ordenados;
}

function GastoItem({
  m,
  handle,
}: {
  m: Movimiento;
  handle?: React.ReactNode;
}) {
  return (
    <div className="flex items-stretch gap-0 rounded-2xl border border-slate-200 bg-white">
      <Link
        href={`/gastos/${m.id}`}
        className={`block flex-1 p-4 active:bg-slate-50 ${
          handle ? "rounded-l-2xl" : "rounded-2xl"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <StatusDot mov={m} />
              {m.razon}
            </p>
            <p className="truncate text-sm text-slate-500">{m.concepto}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {m.subcategoria}
              {m.fecha ? ` · ${formatFecha(m.fecha)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="text-right text-sm">
              <p className="text-xs text-slate-400">Sobrante</p>
              <Money
                value={m.sobrante}
                tono={m.sobrante < 0 ? "negativo" : "neutro"}
                className="block font-semibold"
              />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
          </div>
        </div>

        {m.inicial > 0 ? (
          <ProgressBar pagado={m.pagado} inicial={m.inicial} className="mt-3" />
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Sin presupuesto · Pagado{" "}
            <Money value={m.pagado} tono="tenue" className="text-xs" />
          </p>
        )}
      </Link>
      {handle}
    </div>
  );
}

function GastoItemOrdenable({ m }: { m: Movimiento }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: m.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <GastoItem
        m={m}
        handle={
          <button
            type="button"
            aria-label="Reordenar"
            className="flex w-9 shrink-0 touch-none select-none items-center justify-center rounded-r-2xl text-slate-300 active:bg-slate-100 active:text-slate-500"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}

function CategoriaLista({
  items,
  periodoId,
  categoria,
  ordenable,
  onReordenado,
}: {
  items: Movimiento[];
  periodoId: string;
  categoria: string;
  ordenable: boolean;
  onReordenado: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  if (!ordenable) {
    return (
      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m.id}>
            <GastoItem m={m} />
          </li>
        ))}
      </ul>
    );
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const desde = items.findIndex((m) => m.id === active.id);
    const hasta = items.findIndex((m) => m.id === over.id);
    if (desde === -1 || hasta === -1) return;
    const nuevo = arrayMove(items, desde, hasta);
    guardarOrden(
      claveOrden(periodoId, categoria),
      nuevo.map((m) => m.id),
    );
    onReordenado();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext
        items={items.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id}>
              <GastoItemOrdenable m={m} />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default function GastosLista({
  movimientos,
  periodoId,
}: {
  movimientos: Movimiento[];
  periodoId: string;
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordenTick, setOrdenTick] = useState(0);

  const buscando = q.trim() !== "";

  const grupos = useMemo(() => {
    const filtrados = movimientos.filter(
      (m) =>
        coincide(m, q) && (filtro === "todos" || m.categoria === filtro),
    );

    const porCat = new Map<string, Movimiento[]>();
    for (const m of filtrados) {
      const arr = porCat.get(m.categoria) ?? [];
      arr.push(m);
      porCat.set(m.categoria, arr);
    }

    const claves = [...porCat.keys()].sort((a, b) => {
      const ia = ordenCategorias.indexOf(a);
      const ib = ordenCategorias.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return claves.map((cat) => {
      const itemsBase = porCat.get(cat)!;
      const items = buscando
        ? itemsBase
        : aplicarOrden(itemsBase, claveOrden(periodoId, cat));
      return {
        cat,
        items,
        presupuestado: itemsBase.reduce((s, m) => s + m.inicial, 0),
      };
    });
  }, [movimientos, q, filtro, periodoId, buscando, ordenTick]);

  const total = grupos.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por razón, concepto, categoría…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFiltro(c.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              filtro === c.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <EmptyState
          title={
            q || filtro !== "todos"
              ? "Sin resultados"
              : "Este período no tiene gastos"
          }
          hint={
            q || filtro !== "todos"
              ? "Probá con otro texto o filtro."
              : "Tocá + para agregar el primero."
          }
        />
      ) : (
        grupos.map((g) => (
          <section key={g.cat}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {g.cat} · {g.items.length}
              </h2>
              <Money
                value={g.presupuestado}
                tono="tenue"
                className="text-xs"
              />
            </div>
            <CategoriaLista
              items={g.items}
              periodoId={periodoId}
              categoria={g.cat}
              ordenable={!buscando}
              onReordenado={() => setOrdenTick((t) => t + 1)}
            />
          </section>
        ))
      )}
    </div>
  );
}
