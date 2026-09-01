"use client";

import { useEffect } from "react";

/** Panel que sube desde abajo. Cierra con backdrop / Escape. Respeta safe-area iOS. */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Panel"}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-up relative max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
        {title && (
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
