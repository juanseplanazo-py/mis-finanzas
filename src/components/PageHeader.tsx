import PrivacyToggle from "./PrivacyToggle";

/** Encabezado de vista: título grande + subtítulo opcional + ojito + slot a la derecha. */
export default function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <PrivacyToggle />
        {right}
      </div>
    </header>
  );
}
