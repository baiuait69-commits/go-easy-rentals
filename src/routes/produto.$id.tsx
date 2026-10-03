import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/hooks/useFavoritos";
import { kz, produtoPorId } from "@/lib/catalogo";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do equipamento — O Meu Carro" },
      { name: "description", content: "Ficha técnica, preço por dia e reserva imediata do equipamento escolhido." },
      { property: "og:title", content: "Detalhe do equipamento — O Meu Carro" },
      { property: "og:description", content: "Ficha técnica, preço por dia e reserva imediata do equipamento escolhido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetalheProduto,
});

const periodos = [
  { chave: "dia", nome: "1 dia", multiplicador: 1 },
  { chave: "semana", nome: "1 semana", multiplicador: 6.5 },
  { chave: "mes", nome: "1 mês", multiplicador: 25 },
] as const;

function DetalheProduto() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { isFavorito, alternar } = useFavoritos();
  const [periodo, setPeriodo] = useState<(typeof periodos)[number]>(periodos[0]);

  const p = produtoPorId(id);

  if (!p) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <h1 className="font-display text-lg text-primary">Equipamento não encontrado</h1>
          <Button asChild className="mt-4 rounded-2xl">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const total = Math.round(p.precoDia * periodo.multiplicador);

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3 border-b border-primary/20 px-5 py-4">
        <button onClick={() => navigate({ to: "/" })} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="flex-1 truncate font-display text-base text-primary">{p.nome}</h1>
        <button onClick={() => alternar(p.id)} aria-label="Guardar nos favoritos">
          <Heart className={`h-5 w-5 ${isFavorito(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </header>

      <div className="flex h-52 items-center justify-center overflow-hidden bg-secondary text-6xl">
        {p.imagem ? (
          <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" />
        ) : (
          p.icone
        )}
      </div>

      <div className="px-5 py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.marca}</p>
        <h2 className="mt-1 font-display text-xl">{p.nome}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{p.resumo}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" /> {p.zona}
        </p>

        <p className="mt-4 text-2xl font-bold text-primary">
          {kz(p.precoDia)}
          <span className="text-sm font-normal text-muted-foreground"> /dia</span>
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.descricao}</p>

        <h3 className="mt-6 text-sm font-semibold">Ficha técnica</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {p.fichas.map((f) => (
            <li key={f.rotulo} className="rounded-2xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.rotulo}</p>
              <p className="text-sm font-semibold">{f.valor}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-semibold">Período de aluguer</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {periodos.map((op) => (
            <button
              key={op.chave}
              onClick={() => setPeriodo(op)}
              className={`rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors ${
                periodo.chave === op.chave
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {op.nome}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Total estimado</span>
          <span className="font-display text-lg text-primary">{kz(total)}</span>
        </div>

        <ReservarDialog
          item={{
            itemRef: `produto:${p.id}`,
            titulo: p.nome,
            imagem: p.imagem ?? null,
            local: p.zona,
            precos: { dia: p.precoDia },
          }}
          trigger={<Button className="mt-4 h-12 w-full rounded-2xl text-base">Reservar agora</Button>}
        />
      </div>
    </AppShell>
  );
}
