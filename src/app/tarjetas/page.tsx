import TarjetasVista from "@/components/TarjetasVista";

export default async function TarjetasPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { nueva } = await searchParams;
  return (
    <main>
      <TarjetasVista autoNueva={nueva === "1"} />
    </main>
  );
}
