import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AvisoPagamento, CampoFicheiro } from "@/components/Antifraude";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AVISO_VERIFICADO, rotuloKyc } from "@/lib/kyc";

type Ver = Database["public"]["Tables"]["verificacoes"]["Row"];
type Kyc = Database["public"]["Tables"]["kyc_fornecedor"]["Row"];

export const Route = createFileRoute("/verificacao")({
  head: () => ({
    meta: [
      { title: "Verificação de identidade — O Meu Carro" },
      { name: "description", content: "Verifique a sua identidade e a sua conta de fornecedor para reservar e publicar com segurança." },
      { property: "og:title", content: "Verificação de identidade — O Meu Carro" },
      { property: "og:description", content: "KYC de clientes e fornecedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verificacao,
});

function Verificacao() {
  const { user, loading } = useAuth();
  if (!loading && !user) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <h1 className="text-2xl">Entre para se verificar</h1>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl"><Link to="/auth">Entrar ou criar conta</Link></Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-8">
        <h1 className="flex items-center gap-2 text-2xl"><ShieldCheck className="h-6 w-6 text-accent" /> Verificação</h1>
        <p className="mt-1 text-sm opacity-90">A plataforma confirma identidade, documentos e titularidade.</p>
      </header>
      <div className="space-y-4 px-5 py-5">
        {user && (
          <Tabs defaultValue="cliente">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="fornecedor">Fornecedor</TabsTrigger>
            </TabsList>
            <TabsContent value="cliente"><Cliente userId={user.id} /></TabsContent>
            <TabsContent value="fornecedor"><Fornecedor userId={user.id} /></TabsContent>
          </Tabs>
        )}
        <AvisoPagamento />
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">{AVISO_VERIFICADO}</p>
      </div>
    </AppShell>
  );
}

function Passo({ ok, t }: { ok: boolean; t: string }) {
  return <li className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}{t}</li>;
}

function Cliente({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["verificacao", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("verificacoes").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState<Partial<Ver>>({ doc_tipo: "BI" });
  useEffect(() => { if (data) setF(data); }, [data]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Ver, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function guardar() {
    if (!f.nome_completo || !f.data_nascimento || !f.morada || !f.telefone || !f.doc_numero || !f.doc_frente || !f.selfie) {
      toast.error("Preencha nome, data de nascimento, morada, telefone, documento (frente) e selfie."); return;
    }
    const idade = (Date.now() - new Date(f.data_nascimento).getTime()) / 3.156e10;
    if (idade < 18) { toast.error("Tem de ter pelo menos 18 anos."); return; }
    setBusy(true);
    const payload = {
      user_id: userId, nome_completo: f.nome_completo, data_nascimento: f.data_nascimento, morada: f.morada,
      contacto_emergencia: f.contacto_emergencia ?? null, telefone: f.telefone, doc_tipo: f.doc_tipo ?? "BI",
      doc_numero: f.doc_numero.trim().toUpperCase(), doc_frente: f.doc_frente, doc_verso: f.doc_verso ?? null, selfie: f.selfie,
    };
    const { error } = data
      ? await supabase.from("verificacoes").update(payload).eq("user_id", userId)
      : await supabase.from("verificacoes").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enviado para análise");
    qc.invalidateQueries({ queryKey: ["verificacao", userId] });
  }

  if (isLoading) return <p className="py-4 text-sm text-muted-foreground">A carregar…</p>;
  const estado = data?.estado ?? "nao_iniciado";
  return (
    <div className="space-y-4 pt-3">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between"><h2 className="text-base">O seu progresso</h2><Badge variant={estado === "aprovado" ? "default" : "secondary"}>{rotuloKyc[estado]}</Badge></div>
        <ul className="mt-3 space-y-2">
          <Passo ok t="Conta criada" />
          <Passo ok={!!data?.telefone_verificado} t="Telefone verificado" />
          <Passo ok={estado === "aprovado"} t="Identidade verificada" />
          <Passo ok={!!data?.pagamento_validado} t="Pagamento validado" />
          <Passo ok={estado === "aprovado"} t="Autorizado a reservar" />
        </ul>
        {data?.motivo && <p className="mt-2 text-xs text-destructive">Motivo: {data.motivo}</p>}
        <p className="mt-2 text-[11px] text-muted-foreground">Alterar o nome, documento ou selfie volta a enviar a verificação para análise.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <Campo l="Nome completo" v={f.nome_completo} on={(v) => set("nome_completo", v)} />
        <div className="grid grid-cols-2 gap-2">
          <Campo l="Data de nascimento" type="date" v={f.data_nascimento} on={(v) => set("data_nascimento", v)} />
          <Campo l="Telefone" v={f.telefone} on={(v) => set("telefone", v)} ph="+244 9XX XXX XXX" />
        </div>
        <Campo l="Morada" v={f.morada} on={(v) => set("morada", v)} />
        <Campo l="Contacto de emergência (recomendado)" v={f.contacto_emergencia} on={(v) => set("contacto_emergencia", v)} />
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <div><Label className="text-xs">Documento</Label>
            <select className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-2 text-sm" value={f.doc_tipo ?? "BI"} onChange={(e) => set("doc_tipo", e.target.value)}>
              <option>BI</option><option>Passaporte</option>
            </select></div>
          <Campo l="Número" v={f.doc_numero} on={(v) => set("doc_numero", v)} />
        </div>
        <CampoFicheiro userId={userId} nome="doc-frente" rotulo="Documento — frente" valor={f.doc_frente} onChange={(c) => set("doc_frente", c)} />
        <CampoFicheiro userId={userId} nome="doc-verso" rotulo="Documento — verso" valor={f.doc_verso} onChange={(c) => set("doc_verso", c)} />
        <CampoFicheiro userId={userId} nome="selfie" rotulo="Selfie a segurar o documento" valor={f.selfie} onChange={(c) => set("selfie", c)} accept="image/*" capture />
        <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={guardar}>{busy ? "A enviar…" : "Enviar para verificação"}</Button>
      </section>
    </div>
  );
}

function Fornecedor({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["kyc-fornecedor", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("kyc_fornecedor").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState<Partial<Kyc>>({ tipo: "singular" });
  useEffect(() => { if (data) setF(data); }, [data]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Kyc, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const empresa = f.tipo === "empresa";

  async function guardar() {
    if (!f.nif || !f.iban || !f.titular_conta || !f.endereco) { toast.error("Preencha NIF, endereço, IBAN e titular da conta."); return; }
    if (!/^AO\d{2}[\d ]{15,}$/i.test(f.iban.replace(/\s/g, "").replace(/^(AO\d{2})/i, "$1 "))) { toast.error("IBAN angolano inválido (AO06…)."); return; }
    if (empresa && (!f.denominacao || !f.certidao || !f.representante || !f.representante_bi || !f.contacto_empresa)) {
      toast.error("Empresa: denominação, certidão, representante, BI do representante e contacto são obrigatórios."); return;
    }
    setBusy(true);
    const payload = {
      user_id: userId, tipo: f.tipo ?? "singular", nif: f.nif.trim(), banco: f.banco ?? null, iban: f.iban.replace(/\s/g, "").toUpperCase(),
      titular_conta: f.titular_conta, endereco: f.endereco, denominacao: f.denominacao ?? null, certidao: f.certidao ?? null,
      alvara: f.alvara ?? null, representante: f.representante ?? null, representante_bi: f.representante_bi ?? null, contacto_empresa: f.contacto_empresa ?? null,
    };
    const { error } = data
      ? await supabase.from("kyc_fornecedor").update(payload).eq("user_id", userId)
      : await supabase.from("kyc_fornecedor").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados de fornecedor enviados para análise");
    qc.invalidateQueries({ queryKey: ["kyc-fornecedor", userId] });
  }

  if (isLoading) return <p className="py-4 text-sm text-muted-foreground">A carregar…</p>;
  const estado = data?.estado ?? "nao_iniciado";
  return (
    <div className="space-y-4 pt-3">
      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between"><h2 className="text-base">Conta de fornecedor</h2><Badge variant={estado === "aprovado" ? "default" : "secondary"}>{rotuloKyc[estado]}</Badge></div>
        <p className="mt-2 text-xs text-muted-foreground">Também precisa da verificação de identidade (separador Cliente). Só fornecedores aprovados podem publicar. Alterar IBAN, NIF ou titular volta a exigir aprovação.</p>
        {data?.motivo && <p className="mt-2 text-xs text-destructive">Motivo: {data.motivo}</p>}
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-2">
          {(["singular", "empresa"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set("tipo", t)} className={`rounded-xl py-2 text-xs font-semibold ${f.tipo === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {t === "singular" ? "Pessoa singular" : "Empresa"}
            </button>
          ))}
        </div>
        {empresa && <Campo l="Denominação social" v={f.denominacao} on={(v) => set("denominacao", v)} />}
        <Campo l="NIF" v={f.nif} on={(v) => set("nif", v)} />
        <Campo l={empresa ? "Endereço da empresa" : "Morada"} v={f.endereco} on={(v) => set("endereco", v)} />
        {empresa && (
          <>
            <Campo l="Contacto empresarial" v={f.contacto_empresa} on={(v) => set("contacto_empresa", v)} />
            <Campo l="Representante legal" v={f.representante} on={(v) => set("representante", v)} />
            <CampoFicheiro userId={userId} nome="certidao" rotulo="Certidão de registo comercial" valor={f.certidao} onChange={(c) => set("certidao", c)} />
            <CampoFicheiro userId={userId} nome="alvara" rotulo="Alvará / licença (se aplicável)" valor={f.alvara} onChange={(c) => set("alvara", c)} />
            <CampoFicheiro userId={userId} nome="bi-representante" rotulo="BI do representante" valor={f.representante_bi} onChange={(c) => set("representante_bi", c)} />
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Campo l="Banco" v={f.banco} on={(v) => set("banco", v)} />
          <Campo l={empresa ? "Titular (empresa)" : "Titular da conta"} v={f.titular_conta} on={(v) => set("titular_conta", v)} />
        </div>
        <Campo l="IBAN" v={f.iban} on={(v) => set("iban", v)} ph="AO06 0000 0000 0000 0000 0000 0" />
        <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={guardar}>{busy ? "A enviar…" : "Enviar para verificação"}</Button>
      </section>
    </div>
  );
}

function Campo({ l, v, on, type = "text", ph }: { l: string; v: string | null | undefined; on: (v: string) => void; type?: string; ph?: string }) {
  return (
    <div>
      <Label className="text-xs">{l}</Label>
      <Input type={type} value={v ?? ""} placeholder={ph} onChange={(e) => on(e.target.value)} className="mt-1 rounded-xl" />
    </div>
  );
}
