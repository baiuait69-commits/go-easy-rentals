import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Search, Star, SlidersHorizontal, Gauge, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kwanza, viaturas, type Categoria } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kubuka — Alugue viaturas perto de si" },
      {
        name: "description",
        content:
          "Pesquise viaturas por localização em Luanda, filtre por preço, marca, categoria e transmissão, e reserve em tempo real.",
      },
      { property: "og:title", content: "Kubuka — Alugue viaturas perto de si" },
      {
        property: "og:description",
        content: "Pesquise viaturas por localização em Luanda, filtre por preço, marca, categoria e transmissão, e reserve em tempo real.",
      },
    ],
  }),
  component: Index,
});

const categorias: (Categoria | "Todas")[] = ["Todas", "SUV", "Sedan", "Compacto", "Pick-up", "Luxo"];

function Index() {
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "Todas">("Todas");
  const [marca, setMarca] = useState("todas");
  const [transmissao, setTransmissao] = useState("todas");
  const [precoMax, setPrecoMax] = useState(100000);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const marcas = useMemo(() => Array.from(new Set(viaturas.map((v) => v.marca))), []);

  const resultados = viaturas.filter((v) => {
    const alvo = `${v.marca} ${v.modelo} ${v.zona}`.toLowerCase();
    return (
      alvo.includes(termo.toLowerCase()) &&
      (categoria === "Todas" || v.categoria === categoria) &&
      (marca === "todas" || v.marca === marca) &&
      (transmissao === "todas" || v.transmissao === transmissao) &&
      v.precoDia <= precoMax
    );
  });

  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-10 text-primary-foreground">
        <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-90">
          <MapPin className="h-3.5 w-3.5" /> Talatona, Luanda
        </p>
        <h1 className="mt-2 text-3xl leading-tight">
          A viatura certa,
          <br /> onde estiver.
        </h1>
        <div className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Marca, modelo ou zona"
              className="h-12 rounded-2xl border-0 bg-card pl-9 text-foreground"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-2xl"
            onClick={() => setFiltrosAbertos((v) => !v)}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="-mt-5 rounded-t-3xl bg-background px-5 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                categoria === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtrosAbertos && (
          <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <Select value={marca} onValueChange={setMarca}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as marcas</SelectItem>
                  {marcas.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={transmissao} onValueChange={setTransmissao}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Transmissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Qualquer caixa</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automática">Automática</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Preço máximo / dia</span>
                <span className="font-semibold text-accent">{kwanza(precoMax)}</span>
              </div>
              <Slider
                className="mt-3"
                min={20000}
                max={120000}
                step={5000}
                value={[precoMax]}
                onValueChange={([v]) => setPrecoMax(v ?? 120000)}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="text-lg">Disponíveis perto de si</h2>
          <span className="text-sm text-muted-foreground">{resultados.length} viaturas</span>
        </div>

        <ul className="mt-3 space-y-4">
          {resultados.map((v) => (
            <li key={v.id}>
              <Link
                to="/viatura/$id"
                params={{ id: v.id }}
                className="block overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div className="relative">
                  <img
                    src={v.imagem}
                    alt={`${v.marca} ${v.modelo}`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-44 w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    {v.entregaGratis && <Badge className="bg-accent text-accent-foreground">Entrega grátis</Badge>}
                    {!v.disponivel && <Badge variant="secondary">Indisponível hoje</Badge>}
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base">
                        {v.marca} {v.modelo}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {v.empresa} · {v.zona}
                      </p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block font-display text-accent">{kwanza(v.precoDia)}</span>
                      <span className="text-[11px] text-muted-foreground">por dia</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-accent" /> {v.avaliacao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" /> {v.transmissao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {v.lugares} lugares
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {v.distanciaKm} km
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {resultados.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma viatura corresponde aos filtros escolhidos.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
