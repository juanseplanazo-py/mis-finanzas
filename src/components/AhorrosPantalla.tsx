"use client";

import { useState } from "react";
import AhorrosVista from "./AhorrosVista";
import FondoVista from "./FondoVista";
import Segmentado from "./Segmentado";

type Vista = "cuentas" | "fondo";

/** Pestaña "Ahorros" con selector Cuentas | Fondo de emergencia. */
export default function AhorrosPantalla({
  vistaInicial = "cuentas",
  autoNuevo = false,
}: {
  vistaInicial?: Vista;
  autoNuevo?: boolean;
}) {
  const [vista, setVista] = useState<Vista>(vistaInicial);

  const selector = (
    <Segmentado<Vista>
      opciones={[
        { key: "cuentas", label: "Cuentas" },
        { key: "fondo", label: "Fondo de emergencia" },
      ]}
      valor={vista}
      onChange={setVista}
    />
  );

  return vista === "fondo" ? (
    <FondoVista selector={selector} />
  ) : (
    <AhorrosVista autoNuevo={autoNuevo} selector={selector} />
  );
}
