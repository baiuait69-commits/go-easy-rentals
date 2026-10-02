import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import logoAsset from "@/assets/teu-carro-logo.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Kubuka" },
      {
        name: "description",
        content: "Crie a sua conta Kubuka ou entre com email e palavra-passe para reservar viaturas em Angola.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Kubuka" },
      { property: "og:description", content: "Aceda à sua conta Kubuka para reservar viaturas em Luanda." },
    ],
  }),
  component: AuthPage,
});

const credenciais = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "A palavra-passe precisa de 6+ caracteres" }).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { roles, loading: rolesLoading } = useRoles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || rolesLoading || !session) return;
    if (roles.includes("admin")) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (roles.includes("empresa")) {
      navigate({ to: "/empresa", replace: true });
      return;
    }
    navigate({ to: "/", replace: true });
  }, [loading, rolesLoading, session, roles, navigate]);

  const validar = () => {
    const parsed = credenciais.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return null;
    }
    return parsed.data;
  };

  async function entrar() {
    const dados = validar();
    if (!dados) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword(dados);
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Email ou palavra-passe incorretos."
          : error.message,
      );
      return;
    }
    const { data: funcoes, error: erroFuncoes } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    if (erroFuncoes) {
      await supabase.auth.signOut();
      toast.error("Não foi possível verificar as permissões da conta. Contacte o suporte.");
      return;
    }
    const roles = (funcoes ?? []).map((item) => item.role);
    toast.success("Bem-vindo de volta!");
    if (roles.includes("admin")) navigate({ to: "/admin", replace: true });
    else if (roles.includes("empresa")) navigate({ to: "/empresa", replace: true });
    else navigate({ to: "/", replace: true });
  }

  async function criarConta() {
    const dados = validar();
    if (!dados) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp(dados);
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Já existe uma conta com este email."
          : error.message,
      );
      return;
    }
    if (data.session) {
      toast.success("Conta de cliente criada. Já está a usar a Kubuka!");
      navigate({ to: "/", replace: true });
      return;
    }
    const { error: erroEntrada } = await supabase.auth.signInWithPassword(dados);
    if (erroEntrada) {
      toast.error("Conta criada. Entre com o seu email e palavra-passe.");
      return;
    }
    toast.success("Conta criada. Já está a usar a Kubuka!");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background shadow-[0_0_60px_-25px_rgba(212,175,55,0.35)]">
        <header className="bg-heat px-5 pt-10 pb-12 text-foreground">
          <img
            src={logoAsset.url}
            alt="Teu Carro — app de aluguer de carros"
            width={1280}
            height={699}
            className="h-14 w-auto rounded-xl bg-card object-contain px-2 py-1"
          />
          <h1 className="mt-3 text-3xl">Entrar ou criar conta</h1>
          <p className="mt-1 text-sm opacity-90">Reserve viaturas em Luanda em segundos.</p>
        </header>

        <div className="-mt-6 rounded-t-3xl bg-background px-5 pt-6 pb-10">
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <TabsContent value="entrar" className="m-0">
                <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={entrar}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Entrar
                </Button>
              </TabsContent>

              <TabsContent value="criar" className="m-0">
                <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={criarConta}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Criar conta
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Sem confirmação por email — a conta fica ativa de imediato.
                </p>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
