/** Logo de la app: cuadrado azul + "J" blanca. */
export default function LogoJ({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Mis Finanzas"
      className="shrink-0"
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
  );
}
