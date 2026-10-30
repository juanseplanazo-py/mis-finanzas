"use client";

/** Selector de 2+ opciones tipo pestañas (mismo estilo que los chips de Gastos). */
export default function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { key: T; label: string }[];
  valor: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="mb-4 grid gap-1 rounded-xl bg-slate-100 p-1"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
    >
      {opciones.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={valor === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg py-2 text-sm font-semibold ${
            valor === o.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
