"use client";

import AnalisisVista from "@/components/AnalisisVista";
import RequierePeriodo from "@/components/RequierePeriodo";

export default function AnalisisPage() {
  return (
    <main>
      <RequierePeriodo>
        <AnalisisVista />
      </RequierePeriodo>
    </main>
  );
}
