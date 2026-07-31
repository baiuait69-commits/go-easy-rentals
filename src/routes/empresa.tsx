import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { Check, FileText, Percent, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { kwanza, receitaMensal, reservas, viaturas } from "@/lib/mock-data";

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: "Painel da empresa — Kubuka" },
      {
        name: "description",
        content: "Gestão de frota, preços e disponibilidade, aprovação de reservas e relatórios financeiros.",
      },
      { property: "og:title", content: "Painel da empresa — Kubuka" },
      { property: "og:description", content: "Frota, reservas e relatórios da sua rent-a-car num só painel." },
    ],
  }),
  component: Empresa,
});

function Empresa() {
  const frota = viaturas.filter((v) => v.empresa === "Kilamba Rent-a-Car");
  const pendentes = reservas.filter((r) => r.estado === "Pendente" || r.estado === "Em curso");
  const receita = receitaMensal.at(-1)?.valor ?? 0;

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Parceiro verificado</p>
        <h1 className="text-2xl">Kilamba Rent-a-Car</h1>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 px-5">
        <Kpi rotulo="Frota" valor={`${frota.length}`} />
        <Kpi rotulo="Reservas" valor={`${pendentes.length}`} />
        <Kpi rotulo="Ocupação" valor="78%" />
      </div>

      <Tabs defaultValue="frota" className="mt-5 px-5">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="frota" className="rounded-xl">
            Frota
          </TabsTrigger>
          <TabsTrigger value="reservas" className="rounded-xl">
            Reservas
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="rounded-xl">
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frota" className="mt-4 space-y-3">
          {frota.map((v) => (
            <article key={v.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <img
                src={v.imagem}
                alt={`${v.marca} ${v.modelo}`}
                loading="lazy"
                width={1024}
                height={768}
                className="h-16 w-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm">
                  {v.marca} {v.modelo}
                </h2>
                <p className="text-xs text-muted-foreground">{kwanza(v.precoDia)} / dia</p>
              </div>
              <div className="text-right">
                <Switch defaultChecked={v.disponivel} onCheckedChange={() => toast.success("Disponibilidade actualizada")} />
                <p className="mt-1 text-[10px] text-muted-foreground">disponível</p>
              </div>
            </article>
          ))}
          <Button variant="secondary" className="w-full rounded-xl">
            Adicionar viatura à frota
          </Button>
        </TabsContent>

        <TabsContent value="reservas" className="mt-4 space-y-3">
          {pendentes.map((r) => {
            const v = viaturas.find((x) => x.id === r.viaturaId)!;
            return (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm">
                      {v.marca} {v.modelo}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {r.cliente} · {r.periodo}
                    </p>
                    <p className="mt-1 font-display text-accent">{kwanza(r.total)}</p>
                  </div>
                  <Badge variant={r.estado === "Pendente" ? "secondary" : "default"}>{r.estado}</Badge>
                </div>
                {r.estado === "Pendente" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button className="rounded-xl" onClick={() => toast.success(`Reserva ${r.id} aprovada`)}>
                      <Check className="mr-1 h-4 w-4" /> Aprovar
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => toast("Reserva rejeitada", { description: r.id })}
                    >
                      <X className="mr-1 h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-accent" /> Receita de Agosto
              </h2>
              <span className="font-display text-accent">{kwanza(receita)}</span>
            </div>
            <div className="mt-4 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitaMensal}>
                  <XAxis dataKey="mes" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                  <Bar dataKey="valor" fill="var(--color-chart-1)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 text-sm">
            <h2 className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-accent" /> Comissões e plano
            </h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex justify-between">
                <span>Comissão da plataforma (12%)</span>
                <span>{kwanza(receita * 0.12)}</span>
              </li>
              <li className="flex justify-between">
                <span>Plano de assinatura Pro</span>
                <span>75 000 Kz / mês</span>
              </li>
              <li className="flex justify-between text-foreground">
                <span>Líquido a receber</span>
                <span className="font-display text-accent">{kwanza(receita * 0.88 - 75000)}</span>
              </li>
            </ul>
          </section>

          <Button variant="secondary" className="w-full rounded-xl">
            <FileText className="mr-2 h-4 w-4" /> Gerir contratos
          </Button>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Kpi({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="font-display text-xl text-accent">{valor}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
    </div>
  );
}