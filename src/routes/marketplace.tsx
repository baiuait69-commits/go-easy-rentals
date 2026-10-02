import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Search, Store } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { categorias, kz, municipios, rotuloCategoria, type Categoria } from "@/lib/marketplace";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Teu Carro" },
      {
        name: "description",
        content:
          "Veículos, carrinhas, camiões, máquinas e serviços de transporte disponíveis para alugar em Angola.",
      },
      { property: "og:title", content: "Marketplace — Teu Carro" },
      {
        property: "og:description",
        content: "Alugue veículos, máquinas e serviços de transporte perto de si.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");
  const [municipio, setMunicipio] = useState("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", categoria, municipio],
    queryFn: async () => {
      let q = supabase
        .from("anuncios")
        .select("*")
        .eq("estado", "aprovado")
        .order("destaque", { ascending: false })
        .order("created_at", { ascending: false });
      if (categoria !== "todas") q = q.eq("categoria", categoria);
      if (municipio !== "todos") q = q.eq("municipio", municipio);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const resultados = (data ?? []).filter((a) =>
    `${a.titulo} ${a.marca ?? ""} ${a.modelo ?? ""} ${a.subcategoria} ${a.municipio}`
      .toLowerCase()
      .includes(termo.toLowerCase()),
  );

  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-10 text-foreground">
        <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-90">
          <Store className="h-3.5 w-3.5" /> Marketplace
        </p>
        <h1 className="mt-2 text-3xl leading-tight">
          Tudo o que precisa,
          <br /> num só lugar.
        </h1>
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="O quê? Carrinha, camião, gerador…"
            className="h-12 rounded-2xl border-0 bg-card pl-9 text-foreground"
          />
        </div>
      </header>

      <div className="-mt-5 rounded-t-3xl bg-background px-5 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ valor: "todas" as const, label: "Todas" }, ...categorias].map((c) => (
            <button
              key={c.valor}
              onClick={() => setCategoria(c.valor)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                categoria === c.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Select value={municipio} onValueChange={setMunicipio}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Onde?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os municípios</SelectItem>
              {municipios.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="text-lg">Anúncios</h2>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "a carregar…" : `${resultados.length} resultados`}
          </span>
        </div>

        <ul className="mt-3 space-y-4">
          {resultados.map((a) => (
            <li key={a.id}>
              <Link
                to="/anuncio/$id"
                params={{ id: a.id }}
                className="block overflow-hidden rounded-3xl border border-border bg-card"
              >
                {a.imagem && (
                  <img
                    src={a.imagem}
                    alt={a.titulo}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base">{a.titulo}</h3>
                      <p className="text-xs text-muted-foreground">
                        {rotuloCategoria(a.categoria)} · {a.subcategoria}
                      </p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block font-display text-accent">{kz(a.preco_dia)}</span>
                      <span className="text-[11px] text-muted-foreground">por dia</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {a.municipio}
                    </span>
                    {a.com_motorista && <Badge variant="secondary">Com motorista</Badge>}
                    {a.entrega && <Badge className="bg-accent text-accent-foreground">Entrega</Badge>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {!isLoading && resultados.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum anúncio corresponde à sua pesquisa.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
