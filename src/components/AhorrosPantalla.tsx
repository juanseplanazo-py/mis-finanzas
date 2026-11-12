"use client";

import { useState } from "react";
import AhorrosVista from "./AhorrosVista";
import FondoVista from "./FondoVista";
import MetasVista from "./MetasVista";
import Segmentado from "./Segmentado";

export type VistaAhorros = "cuentas" | "fondo" | "metas";

/** Pestaña "Ahorros" con selector Cuentas | Fondo de emergencia | Metas. */
export default function AhorrosPantalla({
  vistaInicial = "cuentas",
  autoNuevo = false,
}: {
  vistaInicial?: VistaAhorros;
  autoNuevo?: boolean;
}) {
  const [vista, setVista] = useState<VistaAhorros>(vistaInicial);

  const selector = (
    <Segmentado<VistaAhorros>
      opciones={[
        { key: "cuentas", label: "Cuentas" },
        { key: "fondo", label: "Fondo" },
        { key: "metas", label: "Metas" },
      ]}
      valor={vista}
      onChange={setVista}
    />
  );

  if (vista === "fondo") return <FondoVista selector={selector} />;
  if (vista === "metas") return <MetasVista selector={selector} />;
  return <AhorrosVista autoNuevo={autoNuevo} selector={selector} />;
}
