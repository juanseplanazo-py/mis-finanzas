import MeDebenVista from "@/components/MeDebenVista";

export default async function MeDebenPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { nuevo } = await searchParams;
  return (
    <main>
      <MeDebenVista autoNuevo={nuevo === "1"} />
    </main>
  );
}
