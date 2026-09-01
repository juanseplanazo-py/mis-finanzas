"use client";

import { useEffect } from "react";

/** Diálogo de confirmación centrado. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  const btn =
    tone === "danger"
      ? "bg-red-600 active:bg-red-700"
      : "bg-blue-600 active:bg-blue-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        className="animate-fade-in absolute inset-0 bg-black/40"
      />
      <div className="animate-fade-in relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description && (
          <div className="mt-1.5 text-sm text-slate-500">{description}</div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${btn}`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
