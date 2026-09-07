import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { categoriaPorSlug } from "@/lib/catalogo";

export const Route = createFileRoute("/catalogo/$ramo/$categoria/")({
  head: () => ({
    meta: [
      { title: "Subcategorias — O Meu Carro" },
      { name: "description", content: "Escolha a subcategoria para ver os equipamentos e viaturas disponíveis." },
      { property: "og:title", content: "Subcategorias — O Meu Carro" },
      { property: "og:description", content: "Escolha a subcategoria para ver os equipamentos e viaturas disponíveis." },
    ],
  }),
  component: Subcategorias,
});

function Subcategorias() {
  const { ramo, categoria } = Route.useParams();
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const cat = categoriaPorSlug(categoria);
  const lista = (cat?.subcategorias ?? []).filter((s) =>
    s.nome.toLowerCase().includes(termo.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <header className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
        <button onClick={() => navigate({ to: "/catalogo/$ramo", params: { ramo } })} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="font-display text-lg text-primary">{cat?.nome ?? "Categoria"}</h1>
      </header>

      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquisar..."
            className="h-11 rounded-2xl border border-primary/25 bg-card pl-9"
          />
        </div>

        <h2 className="mt-5 text-base">Subcategorias</h2>
        <ul className="mt-3 space-y-2">
          {lista.map((s) => (
            <li key={s.slug}>
              <Link
                to="/catalogo/$ramo/$categoria/$sub"
                params={{ ramo, categoria, sub: s.slug }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <span className="text-xl">{s.icone}</span>
                <span className="flex-1 text-sm font-semibold">{s.nome}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {lista.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma subcategoria encontrada.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
