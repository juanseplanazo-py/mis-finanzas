import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditarMovimiento from "@/components/EditarMovimiento";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
          Editar ítem
        </h1>
      </header>

      <EditarMovimiento id={id} />
    </main>
  );
}
