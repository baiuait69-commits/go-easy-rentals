import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

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
    const { error } = await supabase.auth.signInWithPassword(dados);
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Email ou palavra-passe incorretos."
          : error.message,
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/", replace: true });
  }

  async function criarConta() {
    const dados = validar();
    if (!dados) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...dados,
      options: { emailRedirectTo: window.location.origin },
    });
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
      navigate({ to: "/", replace: true });
      return;
    }
    setEmailEnviado(dados.email);
    toast.success("Conta criada. Confirme o email para entrar.");
  }

  async function reenviar() {
    if (!emailEnviado) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailEnviado,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível reenviar agora. Tente daqui a pouco.");
      return;
    }
    toast.success("Email de verificação reenviado.");
  }

  async function entrarComGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Não foi possível entrar com Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
        <header className="bg-heat px-5 pt-10 pb-12 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest opacity-90">
            <Car className="h-4 w-4" /> Kubuka
          </div>
          <h1 className="mt-3 text-3xl">Entrar ou criar conta</h1>
          <p className="mt-1 text-sm opacity-90">Reserve viaturas em Luanda em segundos.</p>
        </header>

        <div className="-mt-6 rounded-t-3xl bg-background px-5 pt-6 pb-10">
          {emailEnviado ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl">Confirme o seu email</h2>
              <p className="text-sm text-muted-foreground">
                Enviámos um link de verificação para <strong>{emailEnviado}</strong>. Abra o link para
                concluir a criação da conta e depois volte para entrar.
              </p>
              <Button
                variant="secondary"
                className="h-12 w-full rounded-2xl"
                disabled={busy}
                onClick={reenviar}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reenviar email de verificação
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setEmailEnviado(null)}>
                Voltar
              </Button>
            </div>
          ) : (
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
              </TabsContent>

              <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="secondary"
                className="h-12 w-full rounded-2xl"
                disabled={busy}
                onClick={entrarComGoogle}
              >
                Continuar com Google
              </Button>
            </div>
          </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
