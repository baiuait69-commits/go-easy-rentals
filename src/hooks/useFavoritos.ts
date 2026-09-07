import { useCallback, useEffect, useState } from "react";

const CHAVE = "omc:favoritos";

function ler(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CHAVE) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    setFavoritos(ler());
    const sync = () => setFavoritos(ler());
    window.addEventListener("omc:favoritos", sync);
    return () => window.removeEventListener("omc:favoritos", sync);
  }, []);

  const alternar = useCallback((id: string) => {
    const atuais = ler();
    const novos = atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
    window.localStorage.setItem(CHAVE, JSON.stringify(novos));
    window.dispatchEvent(new Event("omc:favoritos"));
  }, []);

  return { favoritos, alternar, isFavorito: (id: string) => favoritos.includes(id) };
}
