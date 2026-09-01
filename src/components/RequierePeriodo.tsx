"use client";

import { usePeriodo } from "@/lib/periodo-context";

/** Muestra el contenido sólo cuando el período está cargado; si no, el estado correspondiente. */
export default function RequierePeriodo({
  children,
}: {
  children: React.ReactNode;
}) {
  const { estado } = usePeriodo();

  if (estado === "sin-config") {
    return (
      <p className="mt-6 text-sm text-red-600">
        Supabase no está configurado. Completá <code>.env.local</code>.
      </p>
    );
  }

  if (estado === "migracion-pendiente") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Falta ejecutar una migración de la base.</p>
        <p className="mt-1">
          Abrí Supabase → SQL Editor y ejecutá los archivos de{" "}
          <code>supabase/</code> que falten. Después recargá.
        </p>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <p className="mt-6 text-sm text-red-600">
        No se pudieron cargar los datos. Reintentá en unos segundos.
      </p>
    );
  }

  if (estado === "cargando") {
    return (
      <div className="mt-10 flex justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return <>{children}</>;
}
