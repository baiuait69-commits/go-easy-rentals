import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarPlus, Check, Star, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { kz } from "@/lib/marketplace";

type Reserva = Database["public"]["Tables"]["reservas"]["Row"];
type Estado = Database["public"]["Enums"]["reserva_estado"];

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

export const rotuloEstado: Record<Estado, string> = {
  pendente: "Pendente", confirmada: "Confirmada", em_utilizacao: "Em utilização",
  concluida: "Concluída", cancelada: "Cancelada", rejeitada: "Rejeitada",
};
const ACTIVAS: Estado[] = ["pendente", "confirmada", "em_utilizacao"];

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
    return <AppShell><div className="px-5 pt-16 text-center"><h1 className="text-2xl">As minhas reservas</h1><p className="mt-2 text-sm text-muted-foreground">Inicie sessão para ver as suas reservas.</p><Button asChild className="mt-6 h-12 w-full rounded-2xl"><Link to="/auth">Entrar</Link></Button></div></AppShell>;
  }

  const minhas = data.filter((r) => r.cliente_id === user?.id);
  const recebidas = data.filter((r) => r.fornecedor_id === user?.id);
  const vazio = (t: string) => <p className="py-10 text-center text-sm text-muted-foreground">{isLoading ? "A carregar…" : t}</p>;

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <h1 className="text-2xl">As minhas reservas</h1>
        <p className="text-sm text-muted-foreground">Acompanhe, estenda e avalie os seus alugueres.</p>
      </header>
      <Tabs defaultValue="activas" className="mt-5 px-5">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="activas" className="rounded-xl">Activas</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-xl">Histórico</TabsTrigger>
          <TabsTrigger value="recebidos" className="rounded-xl">Pedidos{recebidas.some((r) => r.estado === "pendente") ? " •" : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="activas" className="mt-4 space-y-4">
          {minhas.filter((r) => ACTIVAS.includes(r.estado)).map((r) => <Cartao key={r.id} r={r} papel="cliente" />)}
          {!minhas.some((r) => ACTIVAS.includes(r.estado)) && vazio("Sem reservas activas.")}
        </TabsContent>
        <TabsContent value="historico" className="mt-4 space-y-4">
          {minhas.filter((r) => !ACTIVAS.includes(r.estado)).map((r) => <Cartao key={r.id} r={r} papel="cliente" />)}
          {!minhas.some((r) => !ACTIVAS.includes(r.estado)) && vazio("Ainda sem histórico.")}
        </TabsContent>
        <TabsContent value="recebidos" className="mt-4 space-y-4">
          {recebidas.map((r) => <Cartao key={r.id} r={r} papel="fornecedor" />)}
          {!recebidas.length && vazio("Ainda não recebeu pedidos de reserva nos seus anúncios.")}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Cartao({ r, papel }: { r: Reserva; papel: "cliente" | "fornecedor" }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function actualizar(patch: Partial<Reserva>, ok: string) {
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.from("reservas").update(patch).eq("id", r.id).select("id").maybeSingle();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("A reserva não foi alterada. Verifique a sua sessão ou o estado da reserva.");
      return;
    }
    toast.success(ok);
    await qc.invalidateQueries({ queryKey: ["reservas"] });
  }
  function estender() {
    const dia = 24 * 3600_000;
    const dur = new Date(r.fim).getTime() - new Date(r.inicio).getTime();
    const porDia = Number(r.total) / Math.max(1, dur / dia);
    const total = Math.round((Number(r.total) + porDia) * 100) / 100;
    void actualizar({ fim: new Date(new Date(r.fim).getTime() + dia).toISOString(), total }, "Aluguer estendido por mais 1 dia");
  }
  const fmt = (d: string) => new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex gap-3 p-3">
        {r.imagem && <img src={r.imagem} alt={r.titulo} loading="lazy" className="h-20 w-28 shrink-0 rounded-2xl object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-base">{r.titulo}</h2>
            <Badge variant={r.estado === "pendente" ? "secondary" : r.estado === "cancelada" || r.estado === "rejeitada" ? "destructive" : "default"}>{rotuloEstado[r.estado]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{r.numero} · {fmt(r.inicio)} → {fmt(r.fim)}</p>
          <p className="text-xs text-muted-foreground">{r.metodo_pagamento}{r.local ? ` · ${r.local}` : ""}</p>
          <p className="mt-1 font-display text-accent">{kz(r.total)}{papel === "fornecedor" && <span className="ml-2 text-xs text-muted-foreground">recebe {kz(Number(r.total) - Number(r.comissao ?? 0))}</span>}</p>
        </div>
      </div>
      {papel === "cliente" && (r.estado === "pendente" || r.estado === "confirmada" || r.estado === "em_utilizacao") && (
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          {r.estado !== "pendente" ? <Button variant="secondary" className="rounded-xl" disabled={busy} onClick={estender}><CalendarPlus className="mr-1 h-4 w-4" /> Estender 1 dia</Button> : <span />}
          {r.estado !== "em_utilizacao" && <Button variant="secondary" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "cancelada" }, "Reserva cancelada")}><X className="mr-1 h-4 w-4" /> Cancelar</Button>}
        </div>
      )}
      {papel === "cliente" && r.estado === "concluida" && (
        <div className="flex items-center justify-between border-t border-border p-3">
          <span className="text-xs text-muted-foreground">{r.avaliacao ? "A sua avaliação" : "Avalie a experiência"}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} aria-label={`Dar ${n} estrelas`} disabled={busy || r.avaliacao != null} onClick={() => actualizar({ avaliacao: n }, `Obrigado pela avaliação de ${n} estrelas!`)}>
                <Star className={`h-5 w-5 ${n <= (r.avaliacao ?? 0) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
      {papel === "fornecedor" && r.estado === "pendente" && (
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          <Button className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "confirmada" }, "Reserva aprovada")}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>
          <Button variant="secondary" className="rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "rejeitada" }, "Reserva rejeitada")}><X className="mr-1 h-4 w-4" /> Rejeitar</Button>
        </div>
      )}
      {papel === "fornecedor" && r.estado === "confirmada" && (
        <div className="border-t border-border p-3"><Button className="w-full rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "em_utilizacao" }, "Marcada em utilização")}>Marcar "Em utilização"</Button></div>
      )}
      {papel === "fornecedor" && r.estado === "em_utilizacao" && (
        <div className="border-t border-border p-3"><Button className="w-full rounded-xl" disabled={busy} onClick={() => actualizar({ estado: "concluida" }, "Reserva concluída")}>Marcar "Concluída"</Button></div>
      )}
    </article>
  );
}
