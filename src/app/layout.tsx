import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "App personal de finanzas: presupuesto, tarjetas, ahorros y deudas a favor",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mis Finanzas",
  },
  // Los iconos de pestaña / home-screen los resuelve Next por convención:
  // src/app/icon.png y src/app/apple-icon.png.
  //
  // Next 15 emite "mobile-web-app-capable"; iOS Safari también necesita
  // el meta con prefijo apple para abrir en modo standalone (sin barra del navegador).
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-36">
          <AuthGate>{children}</AuthGate>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
