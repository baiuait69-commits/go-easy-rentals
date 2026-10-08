import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type KycEstado = Database["public"]["Enums"]["kyc_estado"];
export type PagamentoEstado = Database["public"]["Enums"]["pagamento_estado"];

export const rotuloKyc: Record<KycEstado, string> = {
  nao_iniciado: "Não iniciado",
  pendente: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export const rotuloPagamento: Record<PagamentoEstado, string> = {
  pendente: "Aguarda pagamento",
  pago_retido: "Pago (retido na plataforma)",
  entregue: "Bem entregue",
  recebido: "Recepção confirmada",
  liberado: "Pago ao fornecedor",
  reembolsado: "Reembolsado",
};

export const fotosObrigatorias = [
  ["frente", "Frente"],
  ["traseira", "Traseira"],
  ["lateral_esq", "Lateral esquerda"],
  ["lateral_dir", "Lateral direita"],
  ["interior", "Interior"],
  ["painel", "Painel / horas"],
  ["codigo", "Foto com o código"],
] as const;

export const qualidadesTitular = ["Representante", "Empresa proprietária", "Procurador", "Gestor autorizado", "Outro"];

/** Envia um ficheiro para a pasta privada do utilizador e devolve o caminho. */
export async function enviarDocumento(userId: string, ficheiro: File, nome: string) {
  if (ficheiro.size > 10 * 1024 * 1024) throw new Error("Ficheiro maior que 10 MB");
  const ext = ficheiro.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const caminho = `${userId}/${nome}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("kyc").upload(caminho, ficheiro, { upsert: true });
  if (error) throw error;
  return caminho;
}

export async function urlDocumento(caminho: string | null | undefined) {
  if (!caminho) return null;
  if (caminho.startsWith("http") || caminho.startsWith("/")) return caminho;
  const { data } = await supabase.storage.from("kyc").createSignedUrl(caminho, 600);
  return data?.signedUrl ?? null;
}

export function gerarCodigo() {
  return `MC-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const AVISO_PAGAMENTO =
  "Nunca efectue pagamentos directamente ao fornecedor fora da plataforma. O MEU CARRO não se responsabiliza por pagamentos efectuados fora do sistema.";
export const AVISO_VERIFICADO =
  "VERIFICADO não significa “confiável em qualquer circunstância”. Significa que a plataforma confirmou determinados dados e documentos.";
