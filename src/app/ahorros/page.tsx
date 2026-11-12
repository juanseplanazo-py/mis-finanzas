import AhorrosPantalla, {
  type VistaAhorros,
} from "@/components/AhorrosPantalla";

export default async function AhorrosPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; vista?: string }>;
}) {
  const { nuevo, vista } = await searchParams;
  const vistaInicial: VistaAhorros =
    vista === "fondo" || vista === "metas" ? vista : "cuentas";
  return (
    <main>
      <AhorrosPantalla vistaInicial={vistaInicial} autoNuevo={nuevo === "1"} />
    </main>
  );
}
