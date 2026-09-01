"use client";

import { Plus } from "lucide-react";

/** Botón flotante principal. Se apoya justo encima de la bottom nav, centrado. */
export default function FloatingActionButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Agregar"
      className="fixed left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:bg-blue-700"
      style={{ bottom: "calc(3.25rem + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
