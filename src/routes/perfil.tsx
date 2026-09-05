import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  CreditCard,
  Gift,
  Headphones,
  LogIn,
  LogOut,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil e verificação — Kubuka" },
      {
        name: "description",
        content: "Verificação de identidade, meios de pagamento Multicaixa Express e programa de fidelização.",
      },
      { property: "og:title", content: "Perfil e verificação — Kubuka" },
      { property: "og:description", content: "Identidade verificada, pagamentos e pontos de fidelização." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-12 text-foreground">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card font-display text-2xl text-accent">
            {(user?.email?.[0] ?? "N").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl">{user ? (user.email ?? "Conta Kubuka") : "Visitante"}</h1>
            <p className="text-sm opacity-90">
              {user ? "Conta Kubuka · Luanda" : "Entre para gerir as suas reservas"}
            </p>
          </div>
        </div>
      </header>

      <div className="-mt-6 space-y-4 rounded-t-3xl bg-background px-5 pt-6">
        {!loading && !user && (
          <Button asChild className="h-12 w-full rounded-2xl">
            <Link to="/auth">
              <LogIn className="mr-2 h-4 w-4" /> Entrar ou criar conta
            </Link>
          </Button>
        )}

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-accent" /> Verificação de identidade
            </h2>
            <Badge className="bg-accent text-accent-foreground">Verificado</Badge>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-accent" /> Bilhete de Identidade validado
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-accent" /> Carta de condução válida até 2029
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-accent" /> Selfie de confirmação
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-accent" /> Meios de pagamento
          </h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3 text-sm">
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Multicaixa Express
              </span>
              <Badge variant="secondary">Principal</Badge>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3 text-sm">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Visa •••• 4417
              </span>
            </li>
          </ul>
          <Button variant="secondary" className="mt-3 w-full rounded-xl">
            Adicionar meio de pagamento
          </Button>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-accent" /> Programa de fidelização
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">1 240 de 2 000 pontos para o nível Ouro</p>
          <Progress value={62} className="mt-3" />
        </section>

        <Button variant="secondary" className="h-12 w-full rounded-2xl">
          <Headphones className="mr-2 h-4 w-4" /> Falar com o suporte
        </Button>
      </div>
    </AppShell>
  );
}