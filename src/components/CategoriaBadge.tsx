const estilos: Record<string, string> = {
  deuda: "bg-red-100 text-red-700",
  fijo: "bg-blue-100 text-blue-700",
  variable: "bg-amber-100 text-amber-700",
  ahorro: "bg-green-100 text-green-700",
};

export default function CategoriaBadge({ categoria }: { categoria: string }) {
  const clase = estilos[categoria.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}
    >
      {categoria}
    </span>
  );
}
