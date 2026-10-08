import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, Circle, ExternalLink } from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { AVISO_PAGAMENTO, AVISO_VERIFICADO, enviarDocumento, urlDocumento } from "@/lib/kyc";

export function AvisoPagamento() {
  return (
    <div className="flex gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      <p>{AVISO_PAGAMENTO}</p>
    </div>
  );
}

interface Reputacao {
  identidade: boolean; telefone: boolean; documentacao: boolean; bens_verificados: number;
  concluidas: number; finalizadas: number; avaliacao: number | null; desde: string | null;
}

export function SeloFornecedor({ ownerId, bemVerificado }: { ownerId: string; bemVerificado: boolean }) {
  const { data } = useQuery({
    queryKey: ["reputacao", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reputacao_fornecedor", { _uid: ownerId });
      if (error) throw error;
      return data as unknown as Reputacao;
    },
  });
  if (!data) return null;
  const verificado = data.identidade && data.documentacao;
  const taxa = data.finalizadas ? Math.round((data.concluidas / data.finalizadas) * 100) : null;
  const meses = data.desde ? Math.max(0, Math.floor((Date.now() - new Date(data.desde).getTime()) / 2.6e9)) : 0;
  const itens: [boolean, string][] = [
    [data.identidade, "Identidade confirmada"],
    [data.documentacao, "Documentação confirmada"],
    [bemVerificado, "Bem verificado"],
    [data.telefone, "Telefone verificado"],
    [data.concluidas > 0, `${data.concluidas} transações concluídas`],
    [taxa !== null && taxa >= 90, taxa === null ? "Sem histórico de reservas" : `${taxa}% de reservas concluídas`],
  ];
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <p className={`flex items-center gap-2 font-display text-sm tracking-wide ${verificado ? "text-accent" : "text-muted-foreground"}`}>
        <BadgeCheck className="h-5 w-5" /> {verificado ? "FORNECEDOR VERIFICADO" : "FORNECEDOR NÃO VERIFICADO"}
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
        {itens.map(([ok, t]) => (
          <li key={t} className="flex items-center gap-2">
            <Circle className={`h-2.5 w-2.5 ${ok ? "fill-green-500 text-green-500" : "fill-muted text-muted-foreground"}`} /> {t}
          </li>
        ))}
        <li className="text-muted-foreground">
          {meses < 1 ? "Novo na plataforma" : `${meses} meses na plataforma`}
          {data.avaliacao ? ` · ${data.avaliacao}★` : ""}
        </li>
      </ul>
      <p className="mt-3 text-[11px] font-semibold uppercase leading-4 text-muted-foreground">{AVISO_VERIFICADO}</p>
    </section>
  );
}

export function CampoFicheiro({
  userId, nome, rotulo, valor, onChange, accept = "image/*,application/pdf", capture,
}: {
  userId: string; nome: string; rotulo: string; valor: string | null | undefined;
  onChange: (caminho: string) => void; accept?: string; capture?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${valor ? "border-accent/60 bg-accent/10" : "border-dashed border-border"}`}>
      <span className="min-w-0 truncate">{rotulo}</span>
      <span className="shrink-0 font-semibold text-accent">{busy ? "A enviar…" : valor ? "✓ Enviado" : "Carregar"}</span>
      <input
        type="file"
        className="hidden"
        accept={accept}
        {...(capture ? { capture: "environment" as const } : {})}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true); setErro(null);
          try { onChange(await enviarDocumento(userId, f, nome)); } catch (er) { setErro(er instanceof Error ? er.message : "Erro"); }
          setBusy(false);
        }}
      />
      {erro && <span className="text-destructive">{erro}</span>}
    </label>
  );
}

export function VerDocumento({ caminho, rotulo }: { caminho: string | null | undefined; rotulo: string }) {
  if (!caminho) return <span className="text-[11px] text-muted-foreground">{rotulo}: —</span>;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent underline"
      onClick={async () => { const u = await urlDocumento(caminho); if (u) window.open(u, "_blank"); }}
    >
      {rotulo} <ExternalLink className="h-3 w-3" />
    </button>
  );
}
