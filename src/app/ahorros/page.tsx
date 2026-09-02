import AhorrosVista from "@/components/AhorrosVista";

export default async function AhorrosPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { nuevo } = await searchParams;
  return (
    <main>
      <AhorrosVista autoNuevo={nuevo === "1"} />
    </main>
  );
}
