import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MovimientoForm from "@/components/MovimientoForm";

export default function AgregarMovimientoPage() {
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Nuevo movimiento
        </h1>
      </header>
      <MovimientoForm />
    </main>
  );
}
