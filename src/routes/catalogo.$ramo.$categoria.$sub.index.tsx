import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Heart, Search, SlidersHorizontal } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/hooks/useFavoritos";
import { categoriaPorSlug, kz, marcasDe, produtos, type Ramo } from "@/lib/catalogo";

export const Route = createFileRoute("/catalogo/$ramo/$categoria/$sub/")({
  head: () => ({
    meta: [
      { title: "Equipamentos disponíveis — O Meu Carro" },
      { name: "description", content: "Veja os equipamentos e viaturas disponíveis para aluguer, com preços por dia." },
      { property: "og:title", content: "Equipamentos disponíveis — O Meu Carro" },
      { property: "og:description", content: "Veja os equipamentos e viaturas disponíveis para aluguer, com preços por dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Listagem,
});

function Listagem() {
  const { ramo, categoria, sub } = Route.useParams();
  const navigate = useNavigate();
  const { isFavorito, alternar } = useFavoritos();

  const [termo, setTermo] = useState("");
  const [marca, setMarca] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<"relevancia" | "preco-asc" | "preco-desc">("relevancia");

  const cat = categoriaPorSlug(categoria);
  const subNome = cat?.subcategorias.find((s) => s.slug === sub)?.nome ?? "Produtos";
  const marcas = marcasDe(ramo as Ramo, categoria, sub);

  const lista = useMemo(() => {
    const base = produtos.filter(
      (p) => p.ramo === ramo && p.categoria === categoria && p.subcategoria === sub,
    );
    const filtrada = base.filter(
      (p) =>
        (!marca || p.marca === marca) &&
        (p.nome + p.marca + p.resumo).toLowerCase().includes(termo.trim().toLowerCase()),
    );
    if (ordem === "preco-asc") return [...filtrada].sort((a, b) => a.precoDia - b.precoDia);
    if (ordem === "preco-desc") return [...filtrada].sort((a, b) => b.precoDia - a.precoDia);
    return filtrada;
  }, [ramo, categoria, sub, marca, termo, ordem]);

  return (
    <AppShell>
      <header className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
        <button
          onClick={() => navigate({ to: "/catalogo/$ramo/$categoria", params: { ramo, categoria } })}
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="font-display text-lg text-primary">{subNome}</h1>
      </header>

      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquisar marca ou modelo..."
            className="h-11 rounded-2xl border border-primary/25 bg-card pl-9"
          />
        </div>

        {marcas.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <Chip activo={marca === null} onClick={() => setMarca(null)}>
              Todas
            </Chip>
            {marcas.map((m) => (
              <Chip key={m} activo={marca === m} onClick={() => setMarca(m)}>
                {m}
              </Chip>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Ordenar:</span>
          <Chip activo={ordem === "relevancia"} onClick={() => setOrdem("relevancia")}>
            Relevância
          </Chip>
          <Chip activo={ordem === "preco-asc"} onClick={() => setOrdem("preco-asc")}>
            Preço ↑
          </Chip>
          <Chip activo={ordem === "preco-desc"} onClick={() => setOrdem("preco-desc")}>
            Preço ↓
          </Chip>
        </div>

        <ul className="mt-5 space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
              <Link to="/produto/$id" params={{ id: p.id }} className="flex gap-3 p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-3xl">
                  {p.imagem ? (
                    <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    p.icone
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.nome}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.resumo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.zona}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{kz(p.precoDia)}/dia</p>
                </div>
              </Link>
              <button
                onClick={() => alternar(p.id)}
                aria-label="Guardar nos favoritos"
                className="absolute right-3 top-3"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorito(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            </li>
          ))}
          {lista.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Ainda não há equipamentos nesta subcategoria.
            </li>
          )}
        </ul>

        <Button asChild variant="outline" className="mt-6 w-full rounded-2xl border-primary/30">
          <Link to="/catalogo/$ramo" params={{ ramo }}>
            Ver outras categorias
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
