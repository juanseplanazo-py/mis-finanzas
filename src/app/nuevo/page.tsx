import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MovimientoForm from "@/components/MovimientoForm";

export default async function AgregarMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ detalle?: string }>;
}) {
  const { detalle } = await searchParams;
  const modoDetalle = detalle === "1";

  return (
    <main>
      <header className="mb-6 flex items-center gap-2">
        <Link
          href="/gastos"
          aria-label="Volver a Gastos"
          className="-ml-1 rounded-lg p-1 text-slate-500 active:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {modoDetalle ? "Nuevo gasto detallado" : "Nuevo movimiento"}
        </h1>
      </header>

      {modoDetalle && (
        <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Después de guardar vas a poder cargar el desglose (Supermercado, Cena,
          etc.). El Pagado se calcula solo con esos gastos.
        </p>
      )}

      <MovimientoForm modoDetalle={modoDetalle} />
    </main>
  );
}
