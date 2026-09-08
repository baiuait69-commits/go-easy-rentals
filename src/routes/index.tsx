import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { kz, produtos, ramos } from "@/lib/catalogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "O Meu Carro — Viaturas, máquinas e equipamentos" },
      {
        name: "description",
        content:
          "Alugue viaturas, máquinas e equipamentos em Angola. Escolha por categoria, subcategoria e marca, compare preços e reserve num instante.",
      },
      { property: "og:title", content: "O Meu Carro — Viaturas, máquinas e equipamentos" },
      {
        property: "og:description",
        content: "Alugue viaturas, máquinas e equipamentos em Angola. Mais opções. Mais mobilidade. Sempre consigo.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");

  const sugestoes = termo.trim()
    ? produtos.filter((p) =>
        `${p.nome} ${p.marca} ${p.resumo}`.toLowerCase().includes(termo.trim().toLowerCase()),
      )
    : [];

  const destaques = produtos.filter((p) => p.destaque);

  return (
    <AppShell>
      <div className="bg-heat px-5 pb-6 pt-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
          Viaturas · Máquinas · Equipamentos
        </p>
      </div>

      <div className="rounded-t-3xl bg-background px-5 pt-6">
        <h1 className="text-center text-xl">O que pretende alugar?</h1>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquisar o que procura..."
            className="h-12 rounded-2xl border border-primary/30 bg-card pl-9"
          />
        </div>

        {sugestoes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {sugestoes.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <span className="text-xl">{p.icone}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.nome}</span>
                    <span className="block text-[11px] text-muted-foreground">{p.resumo}</span>
                  </span>
                  <span className="text-xs font-semibold text-primary">{kz(p.precoDia)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-6 text-base">Destaques</h2>
        <div className="relative -mx-5 mt-3">
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 scrollbar-hide">
            {destaques.map((p) => (
              <li key={p.id} className="w-[72vw] max-w-[280px] shrink-0 snap-start">
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="block overflow-hidden rounded-2xl border border-primary/30 bg-card"
                >
                  <div className="relative h-36 w-full">
                    {p.imagem ? (
                      <img
                        src={p.imagem}
                        alt={p.nome}
                        loading="lazy"
                        width={280}
                        height={144}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-secondary text-4xl">
                        {p.icone}
                      </span>
                    )}
                    <Star className="absolute right-2 top-2 h-4 w-4 fill-primary text-primary" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{p.nome}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.resumo}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {kz(p.precoDia)} <span className="text-[10px] text-muted-foreground">/ dia</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3">
          {ramos.map((r) => (
            <Link
              key={r.slug}
              to="/catalogo/$ramo"
              params={{ ramo: r.slug }}
              className="rounded-2xl border border-primary/40 bg-card p-4 text-center transition-colors hover:border-primary"
            >
              <span className="block text-3xl">{r.icone}</span>
              <span className="mt-2 block font-display text-sm uppercase tracking-wide text-primary">
                {r.nome}
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                {r.descricao}
              </span>
            </Link>
          ))}
        </div>

        <Link
          to="/marketplace"
          className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm"
        >
          <span className="flex-1">Ver todos os anúncios publicados</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </AppShell>
  );
}
