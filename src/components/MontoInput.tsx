"use client";

import { formatMontoInput } from "@/lib/format";

/**
 * Input de monto en guaraníes. Muestra "Gs." como prefijo y agrupa miles.
 * `value` / `onChange` trabajan con el string crudo (solo dígitos relevantes).
 */
export default function MontoInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500">
        Gs.
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-11 pr-3 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        value={formatMontoInput(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
