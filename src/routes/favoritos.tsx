import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/hooks/useFavoritos";
import { kz, produtoPorId } from "@/lib/catalogo";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — O Meu Carro" },
      { name: "description", content: "Os equipamentos e viaturas que guardou para alugar mais tarde." },
      { property: "og:title", content: "Favoritos — O Meu Carro" },
      { property: "og:description", content: "Os equipamentos e viaturas que guardou para alugar mais tarde." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { favoritos, alternar } = useFavoritos();
  const lista = favoritos.map(produtoPorId).filter(Boolean);

  return (
    <AppShell>
      <header className="border-b border-primary/20 px-5 py-4">
        <h1 className="font-display text-lg text-primary">Favoritos</h1>
        <p className="text-xs text-muted-foreground">Guardados para alugar mais tarde</p>
      </header>

      <div className="px-5 pt-4">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Ainda não guardou nenhum equipamento.</p>
            <Button asChild className="mt-4 rounded-2xl">
              <Link to="/">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {lista.map((p) => (
              <li key={p!.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
                <Link to="/produto/$id" params={{ id: p!.id }} className="flex gap-3 p-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-3xl">
                    {p!.imagem ? (
                      <img src={p!.imagem} alt={p!.nome} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      p!.icone
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p!.nome}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p!.resumo}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{kz(p!.precoDia)}/dia</p>
                  </div>
                </Link>
                <button
                  onClick={() => alternar(p!.id)}
                  aria-label="Remover dos favoritos"
                  className="absolute right-3 top-3"
                >
                  <Heart className="h-5 w-5 fill-primary text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
