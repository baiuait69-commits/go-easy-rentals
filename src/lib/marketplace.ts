import type { Database } from "@/integrations/supabase/types";

export type Categoria = Database["public"]["Enums"]["anuncio_categoria"];
export type Estado = Database["public"]["Enums"]["anuncio_estado"];
export type Anuncio = Database["public"]["Tables"]["anuncios"]["Row"];

export const categorias: { valor: Categoria; label: string }[] = [
  { valor: "veiculos", label: "Veículos" },
  { valor: "transporte", label: "Transporte" },
  { valor: "pesados", label: "Pesados" },
  { valor: "maquinas", label: "Máquinas" },
  { valor: "servicos", label: "Serviços" },
];

export const rotuloCategoria = (c: Categoria) =>
  categorias.find((x) => x.valor === c)?.label ?? c;

export const rotuloEstado: Record<Estado, string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
};

export const municipios = [
  "Talatona",
  "Maianga",
  "Viana",
  "Cacuaco",
  "Belas",
  "Kilamba",
  "Zango",
  "Luanda",
];

export const kz = (valor: number | null | undefined) =>
  valor == null
    ? "—"
    : new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: "AOA",
        maximumFractionDigits: 0,
      }).format(valor);
