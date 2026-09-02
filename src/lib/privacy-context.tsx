"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface PrivacyCtx {
  oculto: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyCtx>({
  oculto: false,
  toggle: () => {},
});

export const usePrivacy = () => useContext(PrivacyContext);

const KEY = "mf_privacy";

/** Modo privacidad: oculta todos los montos. Se guarda por dispositivo (localStorage). */
export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    try {
      setOculto(localStorage.getItem(KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  const toggle = useCallback(() => {
    setOculto((v) => {
      const n = !v;
      try {
        localStorage.setItem(KEY, n ? "1" : "0");
      } catch {
        /* ignora */
      }
      return n;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ oculto, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}
