"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "./BottomNav";

type Estado = "verificando" | "con-sesion" | "sin-sesion";

/**
 * Protege toda la app. Sin sesión -> redirige a /login.
 * /login se muestra sin protección (y si ya hay sesión, redirige a /).
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (activo) setEstado(data.session ? "con-sesion" : "sin-sesion");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEstado(session ? "con-sesion" : "sin-sesion");
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (estado === "sin-sesion" && pathname !== "/login") {
      router.replace("/login");
    }
    if (estado === "con-sesion" && pathname === "/login") {
      router.replace("/");
    }
  }, [estado, pathname, router]);

  // Página de login: sin protección.
  if (pathname === "/login") {
    if (estado === "con-sesion") return null; // redirigiendo a /
    return <>{children}</>;
  }

  if (estado === "verificando") {
    return <p className="mt-10 text-center text-sm text-gray-500">Cargando…</p>;
  }

  if (estado === "sin-sesion") {
    return null; // redirigiendo a /login
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
