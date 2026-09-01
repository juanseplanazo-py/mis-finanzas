/** Pantalla de carga con la marca — se ve al abrir la PWA mientras verifica la sesión. */
export default function BrandLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <svg
        width="72"
        height="72"
        viewBox="0 0 64 64"
        role="img"
        aria-label="Mis Finanzas"
      >
        <rect width="64" height="64" rx="15" fill="#2563eb" />
        <path
          d="M41 15 V35 A12.5 12.5 0 0 1 16 34.5"
          fill="none"
          stroke="#fff"
          strokeWidth="11"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-lg font-semibold text-gray-900">Mis Finanzas</p>
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        aria-hidden="true"
      />
    </div>
  );
}
