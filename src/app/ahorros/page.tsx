import AhorrosPantalla from "@/components/AhorrosPantalla";

export default async function AhorrosPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; vista?: string }>;
}) {
  const { nuevo, vista } = await searchParams;
  return (
    <main>
      <AhorrosPantalla
        vistaInicial={vista === "fondo" ? "fondo" : "cuentas"}
        autoNuevo={nuevo === "1"}
      />
    </main>
  );
}
