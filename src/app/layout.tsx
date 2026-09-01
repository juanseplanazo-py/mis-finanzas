import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "Dashboard y registro de movimientos financieros personales",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mis Finanzas",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
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
        <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-24">
          <AuthGate>{children}</AuthGate>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
