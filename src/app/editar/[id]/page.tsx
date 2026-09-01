import Link from "next/link";
import EditarMovimiento from "@/components/EditarMovimiento";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver al Dashboard"
          className="text-2xl leading-none text-gray-500"
        >
          &larr;
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar ítem</h1>
      </header>

      <EditarMovimiento id={id} />
    </main>
  );
}
