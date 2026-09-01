"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import FloatingActionButton from "./FloatingActionButton";
import BottomSheet from "./BottomSheet";
import AddMenu from "./AddMenu";

/** Chrome de la app autenticada: bottom nav + FAB + menú de "Agregar". */
export default function AppChrome() {
  const [addOpen, setAddOpen] = useState(false);
  const pathname = usePathname();

  // En los formularios de alta/edición no mostramos el FAB (evita duplicar la acción).
  const ocultarFab =
    pathname.startsWith("/nuevo") || pathname.startsWith("/editar");

  return (
    <>
      {!ocultarFab && <FloatingActionButton onClick={() => setAddOpen(true)} />}
      <BottomNav />
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="¿Qué querés agregar?"
      >
        <AddMenu onNavigate={() => setAddOpen(false)} />
      </BottomSheet>
    </>
  );
}
