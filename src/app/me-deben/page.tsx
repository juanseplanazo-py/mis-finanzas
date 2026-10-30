import DeudasPantalla from "@/components/DeudasPantalla";

export default async function MeDebenPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; lado?: string }>;
}) {
  const { nuevo, lado } = await searchParams;
  return (
    <main>
      <DeudasPantalla
        ladoInicial={lado === "yo-debo" ? "yo-debo" : "me-deben"}
        autoNuevo={nuevo === "1"}
      />
    </main>
  );
}
