import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Reserva = Database["public"]["Tables"]["reservas"]["Row"];
export type EstadoReserva = Database["public"]["Enums"]["reserva_estado"];

export const COMISSAO = 0.15;

export const rotuloEstado: Record<EstadoReserva, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  em_utilizacao: "Em utilização",
  concluida: "Concluída",
  cancelada: "Cancelada",
  rejeitada: "Rejeitada",
};

export const metodosPagamento = ["Multicaixa Express", "Cartão", "Transferência"] as const;

export const kzFmt = (v: number | null | undefined) =>
  `${new Intl.NumberFormat("pt-AO").format(Math.round(Number(v ?? 0)))} Kz`;

export type Periodo = "hora" | "dia" | "semana" | "mes";
export const HORAS: Record<Periodo, number> = { hora: 1, dia: 24, semana: 168, mes: 720 };

export interface Precos {
  hora?: number | null;
  dia: number;
  semana?: number | null;
  mes?: number | null;
}

/** Calcula o total para um intervalo usando o melhor preço disponível. */
export function calcularTotal(precos: Precos, inicio: Date, fim: Date, periodo: Periodo) {
  const horas = Math.max(1, Math.ceil((fim.getTime() - inicio.getTime()) / 3_600_000));
  const porHora = precos.hora ?? precos.dia / 10;
  const porSemana = precos.semana ?? precos.dia * 6.5;
  const porMes = precos.mes ?? precos.dia * 25;
  switch (periodo) {
    case "hora":
      return Math.round(horas * porHora);
    case "dia":
      return Math.round(Math.ceil(horas / 24) * precos.dia);
    case "semana":
      return Math.round(Math.ceil(horas / 168) * porSemana);
    case "mes":
      return Math.round(Math.ceil(horas / 720) * porMes);
  }
}

export async function registarTentativa(email: string, origem: "app" | "admin", erro: string | null) {
  try {
    await supabase.from("auth_tentativas").insert({
      email: email.trim().toLowerCase().slice(0, 255),
      origem,
      sucesso: !erro,
      erro: erro?.slice(0, 500) ?? null,
    });
  } catch {
    /* não bloquear o login */
  }
}
