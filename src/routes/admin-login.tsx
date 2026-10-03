import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { criarContaGestorInicial } from "@/lib/roles.functions";


export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Login do gestor — Kubuka" },
      {
        name: "description",
        content:
          "Área reservada: entre com as credenciais de gestor, empresa ou suporte para aceder ao painel de administração Kubuka.",
      },
      { property: "og:title", content: "Login do gestor — Kubuka" },
      { property: "og:description", content: "Acesso restrito ao painel de administração da Kubuka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

const credenciais = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "A palavra-passe precisa de 6+ caracteres" }).max(72),
});

function AdminLogin() {
  const navigate = useNavigate();
  const { roles, loading } = useRoles();
  const criarGestor = useServerFn(criarContaGestorInicial);
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && roles.length > 0) navigate({ to: "/admin", replace: true });
  }, [loading, roles, navigate]);

  async function entrar() {
    const parsed = credenciais.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    void registarTentativa(parsed.data.email, "admin", error?.message ?? null);
    if (error) {
      setBusy(false);
      toast.error(error.message.includes("Invalid login") ? "Email ou palavra-passe incorretos." : error.message);
      return;
    }

    const { data: funcoes } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    setBusy(false);

    if (!funcoes || funcoes.length === 0) {
      await supabase.auth.signOut();
      toast.error("Esta conta não tem acesso ao painel de gestão.");
      return;
    }

    toast.success("Sessão de gestão iniciada");
    navigate({ to: "/admin", replace: true });
  }

  async function criarConta() {
    const parsed = credenciais.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    try {
      await criarGestor({ data: parsed.data });
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw new Error(error.message);
      toast.success("Conta de gestor criada. Bem-vindo ao painel.");
      navigate({ to: "/admin", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background px-5 py-16 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" /> Área reservada
        </div>
        <h1 className="mt-2 text-3xl">{modo === "entrar" ? "Login do gestor" : "Criar conta do gestor"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {modo === "entrar"
            ? "Acesso exclusivo a contas com função de gestor, empresa ou suporte. O acesso de clientes faz-se na aplicação."
            : "Cria a conta de gestor principal do painel. As restantes contas de painel são criadas dentro de Funções e permissões."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`h-10 rounded-xl text-sm transition ${
                modo === m ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gestor@exemplo.com"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Palavra-passe</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
          <Button
            className="h-12 w-full rounded-2xl"
            disabled={busy}
            onClick={modo === "entrar" ? entrar : criarConta}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modo === "entrar" ? "Entrar no painel" : "Criar conta e entrar"}
          </Button>
        </div>


        <Button asChild variant="ghost" className="mt-8 w-full rounded-2xl text-muted-foreground">
          <Link to="/">Voltar à aplicação</Link>
        </Button>
      </div>
    </div>
  );
}