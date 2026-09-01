import DetalleGasto from "@/components/DetalleGasto";

export default async function GastoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <DetalleGasto id={id} />
    </main>
  );
}
