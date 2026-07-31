import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarPlus, Navigation, Star } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { kwanza, reservas, viaturas } from "@/lib/mock-data";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "As minhas reservas — Kubuka" },
      {
        name: "description",
        content: "Acompanhe reservas activas, estenda o aluguer pelo aplicativo e avalie a experiência.",
      },
      { property: "og:title", content: "As minhas reservas — Kubuka" },
      { property: "og:description", content: "Reservas activas, extensão do aluguer e histórico." },
    ],
  }),
  component: Reservas,
});

function Reservas() {
  const minhas = reservas.filter((r) => r.cliente === "Nelson Cabral");
  const activas = minhas.filter((r) => r.estado !== "Concluída");
  const historico = minhas.filter((r) => r.estado === "Concluída");

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <h1 className="text-2xl">As minhas reservas</h1>
        <p className="text-sm text-muted-foreground">Acompanhe, estenda e avalie os seus alugueres.</p>
      </header>

      <Tabs defaultValue="activas" className="mt-5 px-5">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="activas" className="rounded-xl">
            Activas
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-xl">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="mt-4 space-y-4">
          {activas.map((r) => (
            <CartaoReserva key={r.id} id={r.id} activa />
          ))}
        </TabsContent>
        <TabsContent value="historico" className="mt-4 space-y-4">
          {historico.map((r) => (
            <CartaoReserva key={r.id} id={r.id} />
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function CartaoReserva({ id, activa }: { id: string; activa?: boolean }) {
  const reserva = reservas.find((r) => r.id === id)!;
  const viatura = viaturas.find((v) => v.id === reserva.viaturaId)!;
  const [nota, setNota] = useState(0);

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex gap-3 p-3">
        <img
          src={viatura.imagem}
          alt={`${viatura.marca} ${viatura.modelo}`}
          loading="lazy"
          width={1024}
          height={768}
          className="h-20 w-28 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-base">
              {viatura.marca} {viatura.modelo}
            </h2>
            <Badge variant={reserva.estado === "Pendente" ? "secondary" : "default"}>{reserva.estado}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {reserva.id} · {reserva.periodo}
          </p>
          <p className="text-xs text-muted-foreground">{reserva.metodo}</p>
          <p className="mt-1 font-display text-accent">{kwanza(reserva.total)}</p>
        </div>
      </div>

      {activa ? (
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => toast.success("Aluguer estendido por mais 1 dia")}
          >
            <CalendarPlus className="mr-1 h-4 w-4" /> Estender
          </Button>
          <Button className="rounded-xl" onClick={() => toast.success("A abrir GPS até à viatura…")}>
            <Navigation className="mr-1 h-4 w-4" /> Localizar
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-border p-3">
          <span className="text-xs text-muted-foreground">Avalie a experiência</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Dar ${n} estrelas`}
                onClick={() => {
                  setNota(n);
                  toast.success(`Obrigado pela avaliação de ${n} estrelas!`);
                }}
              >
                <Star className={`h-5 w-5 ${n <= nota ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}