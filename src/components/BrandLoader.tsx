import LogoJ from "./LogoJ";

/** Pantalla de carga con la marca — se ve al abrir la PWA mientras verifica la sesión. */
export default function BrandLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <LogoJ size={72} />
      <p className="text-lg font-semibold text-slate-900">Mis Finanzas</p>
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
        aria-hidden="true"
      />
    </div>
  );
}
