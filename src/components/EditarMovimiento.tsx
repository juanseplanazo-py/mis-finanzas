"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMovimiento } from "@/lib/queries";
import type { Movimiento } from "@/lib/types";
import MovimientoForm from "./MovimientoForm";

export default function EditarMovimiento({ id }: { id: string }) {
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-existe">(
    "cargando",
  );
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);

  useEffect(() => {
    let activo = true;
    fetchMovimiento(id)
      .then((mov) => {
        if (!activo) return;
        if (mov) {
          setMovimiento(mov);
          setEstado("listo");
        } else {
          setEstado("no-existe");
        }
      })
      .catch(() => activo && setEstado("no-existe"));
    return () => {
      activo = false;
    };
  }, [id]);

  if (estado === "cargando") {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }

  if (estado === "no-existe" || !movimiento) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          No se encontró ese registro (puede haber sido eliminado).
        </p>
        <Link href="/" className="text-sm font-medium text-blue-600">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return <MovimientoForm movimiento={movimiento} />;
}
