import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { kzFmt, rotuloEstado, type EstadoReserva } from "@/lib/reservas";

export const Route = createFileRoute("/admin-reservas")({
  head: () => ({
    meta: [
      { title: "Reservas — Painel do gestor" },
      { name: "description", content: "Todas as reservas do marketplace, com pesquisa e filtro por estado." },
      { property: "og:title", content: "Reservas — Painel do gestor" },
      { property: "og:description", content: "Todas as reservas do marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <AdminReservas />
    </AdminGuard>
  ),
});

const estados = Object.keys(rotuloEstado) as EstadoReserva[];

function AdminReservas() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<EstadoReserva | "todos">("todos");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reservas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reservas").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  const lista = data.filter(
    (r) =>
      (filtro === "todos" || r.estado === filtro) &&
      `${r.numero} ${r.titulo} ${r.local ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );
  const totalComissao = data.filter((r) => r.estado === "concluida").reduce((s, r) => s + Number(r.comissao ?? 0), 0);

  async function mudar(id: string, estado: EstadoReserva) {
    const { error } = await supabase.from("reservas").update({ estado }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado");
    qc.invalidateQueries({ queryKey: ["admin-reservas"] });
  }

  return (
    <AdminShell>
      <div className="space-y-4 p-5">
        <h1 className="text-2xl">Reservas</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-display text-xl text-primary">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Comissões (concluídas)</p>
            <p className="font-display text-xl text-primary">{kzFmt(totalComissao)}</p>
          </div>
        </div>
        <Input placeholder="Pesquisar por número, título ou local" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {(["todos", ...estados] as const).map((e) => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filtro === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {e === "todos" ? "Todos" : rotuloEstado[e]}
            </button>
          ))}
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">A carregar…</p>}
        {!isLoading && lista.length === 0 && <p className="text-sm text-muted-foreground">Sem reservas.</p>}
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.titulo}</p>
                  <p className="text-xs text-muted-foreground">{r.numero} · {new Date(r.inicio).toLocaleDateString("pt-AO")} · {r.metodo_pagamento}</p>
                  <p className="text-xs text-muted-foreground">Total {kzFmt(r.total)} · Comissão {kzFmt(r.comissao)} · Caução {kzFmt(r.caucao)}</p>
                </div>
                <Badge variant="secondary">{rotuloEstado[r.estado]}</Badge>
              </div>
              <select
                className="mt-2 w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm"
                value={r.estado}
                onChange={(e) => mudar(r.id, e.target.value as EstadoReserva)}
              >
                {estados.map((e) => <option key={e} value={e}>{rotuloEstado[e]}</option>)}
              </select>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
