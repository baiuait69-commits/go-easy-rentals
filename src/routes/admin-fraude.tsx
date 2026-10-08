import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { VerDocumento } from "@/components/Antifraude";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { rotuloKyc, rotuloPagamento, type PagamentoEstado } from "@/lib/kyc";
import { kzFmt } from "@/lib/reservas";

export const Route = createFileRoute("/admin-fraude")({
  head: () => ({
    meta: [
      { title: "Verificação e antifraude — Painel do gestor" },
      { name: "description", content: "Fila de KYC, alertas de fraude, reservas em análise e pagamentos retidos." },
      { property: "og:title", content: "Verificação e antifraude — Painel do gestor" },
      { property: "og:description", content: "KYC, alertas e pagamentos retidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdminGuard><AdminFraude /></AdminGuard>,
});

function useLista<T>(chave: string, fn: () => PromiseLike<{ data: T[] | null; error: unknown }>) {
  return useQuery({ queryKey: ["fraude", chave], queryFn: async () => { const { data, error } = await fn(); if (error) throw error; return data ?? []; } });
}

function AdminFraude() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["fraude"] });
  const clientes = useLista("clientes", () => supabase.from("verificacoes").select("*").order("updated_at", { ascending: false }));
  const fornecedores = useLista("fornecedores", () => supabase.from("kyc_fornecedor").select("*").order("updated_at", { ascending: false }));
  const bens = useLista("bens", () => supabase.from("anuncios").select("*").or("estado.eq.pendente,bem_verificado.eq.false").order("updated_at", { ascending: false }).limit(100));
  const alertas = useLista("alertas", () => supabase.from("alertas_fraude").select("*").order("created_at", { ascending: false }).limit(200));
  const reservas = useLista("reservas", () => supabase.from("reservas").select("*").or("em_analise.eq.true,estado_pagamento.neq.liberado").order("created_at", { ascending: false }).limit(200));
  const historico = useLista("historico", () => supabase.from("historico_alteracoes").select("*").order("created_at", { ascending: false }).limit(200));

  const nomes = new Map((clientes.data ?? []).map((c) => [c.user_id, c.nome_completo ?? c.user_id.slice(0, 8)]));
  const nome = (id: string | null) => (id ? nomes.get(id) ?? id.slice(0, 8) : "—");
  const relacionadas = (id: string | null) => (id ? (alertas.data ?? []).filter((a) => a.user_id === id && a.tipo === "conta_duplicada").length : 0);

  async function run(p: PromiseLike<{ error: { message: string } | null }>, ok: string) {
    const { error } = await p;
    if (error) toast.error(error.message); else { toast.success(ok); refresh(); }
  }
  const motivo = () => window.prompt("Motivo da rejeição:")?.trim() || null;

  const pendC = (clientes.data ?? []).filter((c) => c.estado === "pendente");
  const pendF = (fornecedores.data ?? []).filter((c) => c.estado === "pendente");
  const abertos = (alertas.data ?? []).filter((a) => !a.resolvido);
  const analise = (reservas.data ?? []).filter((r) => r.em_analise);

  return (
    <AdminShell>
      <div className="space-y-4 p-5">
        <h1 className="text-2xl">Verificação & antifraude</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi t="Clientes em análise" v={pendC.length} />
          <Kpi t="Fornecedores em análise" v={pendF.length} />
          <Kpi t="Alertas abertos" v={abertos.length} />
          <Kpi t="Reservas em análise" v={analise.length} />
        </div>
        <Tabs defaultValue="clientes">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 rounded-xl">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="bens">Bens</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="reservas">Reservas & pagamentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="space-y-3">
            {(clientes.data ?? []).map((c) => (
              <Card key={c.user_id}>
                <Topo t={c.nome_completo ?? "Sem nome"} b={rotuloKyc[c.estado]} ok={c.estado === "aprovado"} />
                <p className="text-xs text-muted-foreground">{c.doc_tipo} {c.doc_numero ?? "—"} · Nasc. {c.data_nascimento ?? "—"} · {c.telefone ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{c.morada ?? "—"} · Emergência: {c.contacto_emergencia ?? "—"}</p>
                {relacionadas(c.user_id) > 0 && <p className="text-xs font-semibold text-destructive">⚠ {relacionadas(c.user_id)} ligação(ões) a outras contas</p>}
                <div className="flex flex-wrap gap-3"><VerDocumento caminho={c.doc_frente} rotulo="Frente" /><VerDocumento caminho={c.doc_verso} rotulo="Verso" /><VerDocumento caminho={c.selfie} rotulo="Selfie" /></div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl" onClick={() => run(supabase.from("verificacoes").update({ estado: "aprovado", motivo: null }).eq("user_id", c.user_id), "Identidade aprovada")}>Aprovar</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { const m = motivo(); if (m) void run(supabase.from("verificacoes").update({ estado: "rejeitado", motivo: m }).eq("user_id", c.user_id), "Rejeitada"); }}>Rejeitar</Button>
                  <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => run(supabase.from("verificacoes").update({ telefone_verificado: !c.telefone_verificado }).eq("user_id", c.user_id), "Telefone actualizado")}>{c.telefone_verificado ? "✓ Telefone" : "Validar telefone"}</Button>
                  <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => run(supabase.from("verificacoes").update({ pagamento_validado: !c.pagamento_validado }).eq("user_id", c.user_id), "Pagamento actualizado")}>{c.pagamento_validado ? "✓ Pagamento" : "Validar pagamento"}</Button>
                </div>
              </Card>
            ))}
            {!clientes.data?.length && <Vazio />}
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-3">
            {(fornecedores.data ?? []).map((k) => (
              <Card key={k.user_id}>
                <Topo t={k.tipo === "empresa" ? k.denominacao ?? "Empresa" : nome(k.user_id)} b={rotuloKyc[k.estado]} ok={k.estado === "aprovado"} />
                <p className="text-xs text-muted-foreground">{k.tipo === "empresa" ? "Empresa" : "Pessoa singular"} · NIF {k.nif ?? "—"} · {k.endereco ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{k.banco ?? "—"} · {k.iban ?? "—"} · Titular: {k.titular_conta ?? "—"}</p>
                {k.tipo === "empresa" && <p className="text-xs text-muted-foreground">Representante: {k.representante ?? "—"} · {k.contacto_empresa ?? "—"}</p>}
                <p className="text-xs text-muted-foreground">Identidade pessoal: {rotuloKyc[(clientes.data ?? []).find((c) => c.user_id === k.user_id)?.estado ?? "nao_iniciado"]}</p>
                <div className="flex flex-wrap gap-3"><VerDocumento caminho={k.certidao} rotulo="Certidão" /><VerDocumento caminho={k.alvara} rotulo="Alvará" /><VerDocumento caminho={k.representante_bi} rotulo="BI representante" /></div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={() => run(supabase.from("kyc_fornecedor").update({ estado: "aprovado", motivo: null }).eq("user_id", k.user_id), "Fornecedor aprovado")}>Aprovar</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { const m = motivo(); if (m) void run(supabase.from("kyc_fornecedor").update({ estado: "rejeitado", motivo: m }).eq("user_id", k.user_id), "Rejeitado"); }}>Rejeitar</Button>
                </div>
              </Card>
            ))}
            {!fornecedores.data?.length && <Vazio />}
          </TabsContent>

          <TabsContent value="bens" className="space-y-3">
            {(bens.data ?? []).map((a) => {
              const fotos = (a.fotos_verificacao ?? {}) as Record<string, string>;
              return (
                <Card key={a.id}>
                  <Topo t={a.titulo} b={a.bem_verificado ? "Bem verificado" : a.estado} ok={a.bem_verificado} />
                  <p className="text-xs text-muted-foreground">Dono: {nome(a.owner_id)} · {a.e_proprietario ? "Proprietário" : `Não proprietário (${a.qualidade_titular ?? "—"})`}</p>
                  <p className="text-xs text-muted-foreground">Matrícula {a.matricula ?? "—"} · VIN {a.vin ?? "—"} · Série {a.numero_serie ?? "—"} · {a.quilometragem ?? a.horas_uso ?? "—"} {a.horas_uso ? "h" : "km"}</p>
                  <p className="text-xs text-muted-foreground">Código de verificação: <b>{a.codigo_verificacao ?? "—"}</b></p>
                  <div className="flex flex-wrap gap-3">
                    <VerDocumento caminho={a.doc_titularidade} rotulo="Titularidade" />
                    <VerDocumento caminho={a.doc_seguro} rotulo="Seguro" />
                    <VerDocumento caminho={a.doc_inspecao} rotulo="Inspecção" />
                    {Object.entries(fotos).map(([k, v]) => <VerDocumento key={k} caminho={v} rotulo={k} />)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl" onClick={() => run(supabase.from("anuncios").update({ bem_verificado: true, estado: "aprovado" }).eq("id", a.id), "Bem verificado e publicado")}>Verificar e publicar</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => run(supabase.from("anuncios").update({ estado: "rejeitado" }).eq("id", a.id), "Anúncio rejeitado")}>Rejeitar</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => run(supabase.from("anuncios").update({ estado: "bloqueado" }).eq("id", a.id), "Anúncio bloqueado")}>Bloquear</Button>
                  </div>
                </Card>
              );
            })}
            {!bens.data?.length && <Vazio />}
          </TabsContent>

          <TabsContent value="alertas" className="space-y-3">
            {(alertas.data ?? []).map((a) => (
              <Card key={a.id}>
                <Topo t={a.descricao} b={a.resolvido ? "Resolvido" : a.gravidade} ok={a.resolvido} perigo={!a.resolvido && a.gravidade === "alta"} />
                <p className="text-xs text-muted-foreground">{a.tipo} · {nome(a.user_id)} · {new Date(a.created_at).toLocaleString("pt-AO")}</p>
                {!a.resolvido && <Button size="sm" variant="secondary" className="w-fit rounded-xl" onClick={() => run(supabase.from("alertas_fraude").update({ resolvido: true }).eq("id", a.id), "Alerta resolvido")}>Marcar resolvido</Button>}
              </Card>
            ))}
            {!alertas.data?.length && <Vazio />}
          </TabsContent>

          <TabsContent value="reservas" className="space-y-3">
            {(reservas.data ?? []).map((r) => (
              <Card key={r.id}>
                <Topo t={`${r.numero} · ${r.titulo}`} b={r.em_analise ? "Em análise" : rotuloPagamento[r.estado_pagamento]} ok={!r.em_analise} perigo={r.risco === "alto"} />
                <p className="text-xs text-muted-foreground">Cliente {nome(r.cliente_id)} · {kzFmt(r.total)} · {r.metodo_pagamento} · Ref. {r.referencia_pagamento ?? "—"} · Risco <b>{r.risco}</b></p>
                <div className="flex flex-wrap gap-2">
                  {r.em_analise && <>
                    <Button size="sm" className="rounded-xl" onClick={() => run(supabase.from("reservas").update({ em_analise: false }).eq("id", r.id), "Reserva libertada")}>Libertar</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => run(supabase.from("reservas").update({ em_analise: false, estado: "rejeitada" }).eq("id", r.id), "Reserva bloqueada")}>Bloquear</Button>
                  </>}
                  {(["pago_retido", "liberado", "reembolsado"] as PagamentoEstado[]).filter((p) => p !== r.estado_pagamento).map((p) => (
                    <Button key={p} size="sm" variant="secondary" className="rounded-xl" onClick={() => run(supabase.from("reservas").update({ estado_pagamento: p }).eq("id", r.id), rotuloPagamento[p])}>
                      {p === "pago_retido" ? "Confirmar pagamento" : p === "liberado" ? "Pagar fornecedor" : "Reembolsar"}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
            {!reservas.data?.length && <Vazio />}
          </TabsContent>

          <TabsContent value="historico" className="space-y-2">
            {(historico.data ?? []).map((h) => (
              <div key={h.id} className="rounded-xl border border-border bg-card p-3 text-xs">
                <b>{h.tabela}.{h.campo}</b> · {nome(h.user_id)} · {new Date(h.created_at).toLocaleString("pt-AO")}
                <p className="text-muted-foreground">{h.antigo ?? "—"} → {h.novo ?? "—"}</p>
              </div>
            ))}
            {!historico.data?.length && <Vazio />}
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function Kpi({ t, v }: { t: string; v: number }) {
  return <div className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{t}</p><p className="font-display text-xl text-primary">{v}</p></div>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">{children}</div>;
}
function Topo({ t, b, ok, perigo }: { t: string; b: string; ok: boolean; perigo?: boolean }) {
  return <div className="flex items-start justify-between gap-2"><p className="min-w-0 font-semibold">{t}</p><Badge variant={perigo ? "destructive" : ok ? "default" : "secondary"}>{b}</Badge></div>;
}
function Vazio() { return <p className="py-4 text-sm text-muted-foreground">Nada por aqui.</p>; }
