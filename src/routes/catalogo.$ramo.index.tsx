import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { categoriasDe, ramos, type Ramo } from "@/lib/catalogo";

export const Route = createFileRoute("/catalogo/$ramo/")({
  head: () => ({
    meta: [
      { title: "Categorias — O Meu Carro" },
      { name: "description", content: "Escolha a categoria de viaturas ou máquinas que pretende alugar." },
      { property: "og:title", content: "Categorias — O Meu Carro" },
      { property: "og:description", content: "Escolha a categoria de viaturas ou máquinas que pretende alugar." },
    ],
  }),
  component: Categorias,
});

function Categorias() {
  const { ramo } = Route.useParams();
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const info = ramos.find((r) => r.slug === (ramo as Ramo));
  const lista = categoriasDe(ramo as Ramo).filter((c) =>
    c.nome.toLowerCase().includes(termo.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <header className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
        <button onClick={() => navigate({ to: "/" })} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="font-display text-lg uppercase tracking-wide text-primary">
          {info?.nome ?? "Categorias"}
        </h1>
      </header>

      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder={`Pesquisar ${info?.nome.toLowerCase() ?? ""}...`}
            className="h-11 rounded-2xl border border-primary/25 bg-card pl-9"
          />
        </div>

        <h2 className="mt-5 text-base">Categorias</h2>
        <ul className="mt-3 space-y-2">
          {lista.map((c) => (
            <li key={c.slug}>
              <Link
                to="/catalogo/$ramo/$categoria"
                params={{ ramo, categoria: c.slug }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <span className="text-xl">{c.icone}</span>
                <span className="flex-1 text-sm font-semibold">{c.nome}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {lista.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria encontrada.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
