import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { accaoRapida, diagnosticarAcesso, type ResultadoDiagnostico } from "@/lib/diagnostico.functions";

export const Route = createFileRoute("/admin-diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico de acesso — Painel do gestor" },
      { name: "description", content: "Assistente de IA que analisa problemas de acesso e sugere a resolução." },
      { property: "og:title", content: "Diagnóstico de acesso — Painel do gestor" },
      { property: "og:description", content: "Assistente de IA para problemas de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AdminGuard requireAdmin>
      <Diagnostico />
    </AdminGuard>
  ),
});

const rotuloAccao: Record<ResultadoDiagnostico["accoes"][number], string> = {
  atribuir_admin: "Dar acesso de gestor",
  atribuir_suporte: "Dar função de suporte",
  atribuir_empresa: "Dar função de empresa",
  confirmar_email: "Confirmar email",
};

function Diagnostico() {
  const qc = useQueryClient();
  const analisar = useServerFn(diagnosticarAcesso);
  const executar = useServerFn(accaoRapida);
  const [email, setEmail] = useState("");
  const [descricao, setDescricao] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<(ResultadoDiagnostico & { email: string }) | null>(null);

  const { data: historico = [] } = useQuery({
    queryKey: ["diagnosticos"],
    queryFn: async () => {
      const { data } = await supabase.from("diagnosticos_acesso").select("*").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  async function correr() {
    setBusy(true);
    try {
      const r = await analisar({ data: { email, descricao } });
      setRes({ ...r, email });
      qc.invalidateQueries({ queryKey: ["diagnosticos"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function accao(a: ResultadoDiagnostico["accoes"][number]) {
    if (!res) return;
    try {
      await executar({ data: { email: res.email, accao: a } });
      toast.success(`${rotuloAccao[a]}: feito`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-4 p-5">
        <div>
          <h1 className="text-2xl">Diagnóstico de acesso</h1>
          <p className="text-sm text-muted-foreground">Descreva o problema e a IA analisa a conta e as tentativas de entrada.</p>
        </div>
        <Input type="email" placeholder="Email da conta afectada" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Textarea rows={4} placeholder="Ex.: Não consigo entrar no painel do gestor, aparece 'sem acesso'." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <Button className="h-12 w-full rounded-2xl" disabled={busy || !email || descricao.length < 5} onClick={correr}>
          {busy ? "A analisar…" : "Analisar"}
        </Button>

        {res && (
          <section className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4">
            <h2 className="text-base text-primary">Causa provável</h2>
            <p className="text-sm">{res.causa}</p>
            <h2 className="text-base text-primary">Passos</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {res.passos.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
            {res.accoes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {res.accoes.map((a) => (
                  <Button key={a} size="sm" variant="secondary" className="rounded-xl" onClick={() => accao(a)}>{rotuloAccao[a]}</Button>
                ))}
              </div>
            )}
          </section>
        )}

        <h2 className="pt-2 text-base">Análises anteriores</h2>
        {historico.length === 0 && <p className="text-sm text-muted-foreground">Ainda sem análises.</p>}
        <ul className="space-y-2">
          {historico.map((h) => {
            const r = h.resultado as unknown as ResultadoDiagnostico;
            return (
              <li key={h.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold">{h.email_alvo}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-AO")}</p>
                <p className="mt-1 text-muted-foreground">{r?.causa}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminShell>
  );
}
