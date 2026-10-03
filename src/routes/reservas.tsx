import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarPlus, Check, Navigation, Star, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { kzFmt, rotuloEstado, type EstadoReserva, type Reserva } from "@/lib/reservas";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "As minhas reservas — Teu Carro" },
      { name: "description", content: "Acompanhe reservas activas, estenda o aluguer, avalie e gira pedidos recebidos." },
      { property: "og:title", content: "As minhas reservas — Teu Carro" },
      { property: "og:description", content: "Reservas activas, extensão do aluguer, histórico e pedidos recebidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reservas,
});

const ACTIVAS: EstadoReserva[] = ["pendente", "confirmada", "em_utilizacao"];

function Reservas() {
  const { user, loading } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["reservas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("reservas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <h1 className="text-2xl">As minhas reservas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Inicie sessão para ver as suas reservas.</p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl"><Link to="/auth">Entrar</Link></Button>
        </div>
      </AppShell>
    );
  }

  const minhas = data.filter((r) => r.cliente_id === user?.id);
  const recebidas = data.filter((r) => r.fornecedor_id === user?.id);
  const activas = minhas.filter((r) => ACTIVAS.includes(r.estado));
  const historico = minhas.filter((r) => !ACTIVAS.includes(r.estado));

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <h1 className="text-2xl">As minhas reservas</h1>
        <p className="text-sm text-muted-foreground">Acompanhe, estenda e avalie os seus alugueres.</p>
      </header>
      <Tabs defaultValue="activas" className="mt-5 px-5 pb-8">
        <TabsList className={`grid w-full rounded-2xl ${recebidas.length ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="activas" className="rounded-xl">Activas</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-xl">Histórico</TabsTrigger>
          {recebidas.length > 0 && <TabsTrigger value="recebidas" className="rounded-xl">Pedidos</TabsTrigger>}
        </TabsList>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">A carregar…</p>}
        <TabsContent value="activas" className="mt-4 space-y-4">
          {!isLoading && activas.length === 0 && <Vazio />}
          {activas.map((r) => <Cartao key={r.id} r={r} modo="cliente" />)}
        </TabsContent>
        <TabsContent value="historico" className="mt-4 space-y-4">
          {!isLoading && historico.length === 0 && <p className="text-sm text-muted-foreground">Ainda sem histórico.</p>}
          {historico.map((r) => <Cartao key={r.id} r={r} modo="cliente" />)}
        </TabsContent>
        <TabsContent value="recebidas" className="mt-4 space-y-4">
          {recebidas.map((r) => <Cartao key={r.id} r={r} modo="fornecedor" />)}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Vazio() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Não tem reservas activas.</p>
      <Button asChild className="mt-4 rounded-2xl"><Link to="/marketplace">Ver anúncios</Link></Button>
    </div>
  );
}

function Cartao({ r, modo }: { r: Reserva; modo: "cliente" | "fornecedor" }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function actualizar(campos: Partial<Reserva>, msg: string) {
    setBusy(true);
    const { error } = await supabase.from("reservas").update(campos).eq("id", r.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["reservas"] });
  }

  function estender() {
    const inicio = new Date(r.inicio).getTime();
    const fim = new Date(r.fim).getTime();
    const dias = Math.max(1, (fim - inicio) / 86_400_000);
    const porDia = Number(r.total) / dias;
    actualizar(
      { fim: new Date(fim + 86_400_000).toISOString(), total: Math.round(Number(r.total) + porDia) },
      "Aluguer estendido por mais 1 dia",
    );
  }

  const fmt = (d: string) => new Date(d).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" });

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex gap-3 p-3">
        {r.imagem ? (
          <img src={r.imagem} alt={r.titulo} loading="lazy" className="h-20 w-24 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className="h-20 w-24 shrink-0 rounded-2xl bg-secondary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-base">{r.titulo}</h2>
            <Badge variant={r.estado === "pendente" ? "secondary" : "default"}>{rotuloEstado[r.estado]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{r.numero} · {r.metodo_pagamento}</p>
          <p className="text-xs text-muted-foreground">{fmt(r.inicio)} → {fmt(r.fim)}</p>
          <p className="mt-1 font-display text-accent">{kzFmt(r.total)}</p>
          {modo === "fornecedor" && (
            <p className="text-[11px] text-muted-foreground">A receber: {kzFmt(Number(r.total) - Number(r.comissao ?? 0))}</p>
          )}
        </div>
      </div>

      {modo === "cliente" && ACTIVAS.includes(r.estado) && (
        <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
          <Button variant="secondary" size="sm" className="rounded-xl" disabled={busy || r.estado === "pendente"} onClick={estender}>
            <CalendarPlus className="mr-1 h-4 w-4" /> Estender
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(r.local ?? r.titulo)}`, "_blank")}
          >
            <Navigation className="mr-1 h-4 w-4" /> GPS
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={busy || r.estado === "em_utilizacao"}
            onClick={() => actualizar({ estado: "cancelada" }, "Reserva cancelada")}
          >
            <X className="mr-1 h-4 w-4" /> Cancelar
          </Button>
        </div>
      )}

      {modo === "cliente" && r.estado === "concluida" && (
        <div className="flex items-center justify-between border-t border-border p-3">
          <span className="text-xs text-muted-foreground">{r.avaliacao ? "A sua avaliação" : "Avalie a experiência"}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} aria-label={`Dar ${n} estrelas`} disabled={busy}
                onClick={() => actualizar({ avaliacao: n }, `Obrigado pela avaliação de ${n} estrelas!`)}>
                <Star className={`h-5 w-5 ${n <= (r.avaliacao ?? 0) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {modo === "fornecedor" && (
        <div className="flex flex-wrap gap-2 border-t border-border p-3">
          {r.estado === "pendente" && (
            <>
              <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "confirmada" }, "Reserva aprovada")}>
                <Check className="mr-1 h-4 w-4" /> Aprovar
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "rejeitada" }, "Reserva rejeitada")}>
                <X className="mr-1 h-4 w-4" /> Rejeitar
              </Button>
            </>
          )}
          {r.estado === "confirmada" && (
            <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "em_utilizacao" }, "Marcada em utilização")}>
              Em utilização
            </Button>
          )}
          {r.estado === "em_utilizacao" && (
            <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "concluida" }, "Reserva concluída")}>
              Concluir
            </Button>
          )}
          {r.avaliacao && <span className="text-xs text-muted-foreground">Avaliação do cliente: {r.avaliacao}★</span>}
        </div>
      )}
    </article>
  );
}
