"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/lib/privacy-context";

/** Botón de ojito: oculta/muestra todos los montos. */
export default function PrivacyToggle() {
  const { oculto, toggle } = usePrivacy();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={oculto ? "Mostrar montos" : "Ocultar montos"}
      aria-pressed={oculto}
      className="rounded-lg p-1.5 text-slate-400 active:bg-slate-100 active:text-slate-600"
    >
      {oculto ? (
        <EyeOff className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Eye className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
