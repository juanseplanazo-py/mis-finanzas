import { estadoMovimiento, type EstadoMovimiento } from "@/lib/calc";

const estilos: Record<
  EstadoMovimiento,
  { dot: string; chip: string; label: string }
> = {
  pendiente: {
    dot: "bg-slate-300",
    chip: "bg-slate-100 text-slate-600",
    label: "Pendiente",
  },
  parcial: {
    dot: "bg-amber-400",
    chip: "bg-amber-100 text-amber-700",
    label: "Parcial",
  },
  pagado: {
    dot: "bg-green-500",
    chip: "bg-green-100 text-green-700",
    label: "Pagado",
  },
};

/** Punto de color chico que indica el estado inferido del gasto. */
export function StatusDot({ mov }: { mov: { inicial: number; pagado: number } }) {
  const e = estadoMovimiento(mov);
  return (
    <span
      title={estilos[e].label}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${estilos[e].dot}`}
    />
  );
}

/** Chip con la etiqueta del estado. */
export default function StatusBadge({
  mov,
}: {
  mov: { inicial: number; pagado: number };
}) {
  const e = estadoMovimiento(mov);
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${estilos[e].chip}`}
    >
      {estilos[e].label}
    </span>
  );
}
