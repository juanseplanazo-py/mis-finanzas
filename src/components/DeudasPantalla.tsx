"use client";

import { useState } from "react";
import MeDebenVista, { type LadoDeuda } from "./MeDebenVista";
import Segmentado from "./Segmentado";

/** Pestaña "Me deben" con selector Me deben | Yo debo. */
export default function DeudasPantalla({
  ladoInicial = "me-deben",
  autoNuevo = false,
}: {
  ladoInicial?: LadoDeuda;
  autoNuevo?: boolean;
}) {
  const [lado, setLado] = useState<LadoDeuda>(ladoInicial);

  return (
    <MeDebenVista
      key={lado}
      lado={lado}
      autoNuevo={autoNuevo && lado === ladoInicial}
      selector={
        <Segmentado<LadoDeuda>
          opciones={[
            { key: "me-deben", label: "Me deben" },
            { key: "yo-debo", label: "Yo debo" },
          ]}
          valor={lado}
          onChange={setLado}
        />
      }
    />
  );
}
