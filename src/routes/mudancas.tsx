import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Search, Star, Package, Truck, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { kwanza, viaturas } from "@/lib/mock-data";
import logoAsset from "@/assets/teu-carro-logo.jpg.asset.json";

export const Route = createFileRoute("/mudancas")({
  head: () => ({
    meta: [
      { title: "Carrinhas para mudanças e mercadoria — Teu Carro" },
      {
        name: "description",
        content:
          "Alugue carrinhas e camiões de caixa fechada em Luanda para mudanças de casa e transporte de mercadoria, com motorista opcional e ajudantes.",
      },
      { property: "og:title", content: "Carrinhas para mudanças e mercadoria — Teu Carro" },
      {
        property: "og:description",
        content: "Mudanças de casa e transporte de carga em Luanda: escolha a carrinha pelo volume em m³ e reserve com motorista.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mudancas,
});

const carrinhas = viaturas.filter((v) => v.categoria === "Carrinha");

function Mudancas() {
  const [termo, setTermo] = useState("");
  const [cargaMin, setCargaMin] = useState(0);

  const resultados = carrinhas.filter((v) => {
    const alvo = `${v.marca} ${v.modelo} ${v.zona}`.toLowerCase();
    return alvo.includes(termo.toLowerCase()) && (v.cargaM3 ?? 0) >= cargaMin;
  });

  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-10 text-foreground">
        <img
          src={logoAsset.url}
          alt="Teu Carro — app de aluguer de carros"
          width={1280}
          height={699}
          className="mb-4 h-14 w-auto rounded-xl bg-card object-contain px-2 py-1"
        />
        <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-90">
          <Truck className="h-3.5 w-3.5" /> Mudanças e mercadoria
        </p>
        <h1 className="mt-2 text-3xl leading-tight">
          Carrinhas para
          <br /> mudar tudo.
        </h1>
        <p className="mt-2 text-sm opacity-90">
          Mudanças de casa e transporte de carga em Luanda, com motorista opcional.
        </p>
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Carrinha, camião ou zona"
            className="h-12 rounded-2xl border-0 bg-card pl-9 text-foreground"
          />
        </div>
      </header>

      <div className="-mt-5 rounded-t-3xl bg-background px-5 pt-5">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Volume de carga mínimo</span>
            <span className="font-semibold text-primary">{cargaMin} m³</span>
          </div>
          <Slider
            className="mt-3"
            min={0}
            max={20}
            step={1}
            value={[cargaMin]}
            onValueChange={([v]) => setCargaMin(v ?? 0)}
          />
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="text-lg">Carrinhas disponíveis</h2>
          <span className="text-sm text-muted-foreground">{resultados.length} opções</span>
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
                    <Badge className="bg-primary text-primary-foreground">Mudanças</Badge>
                    {v.comMotorista && <Badge className="bg-accent text-accent-foreground">Motorista</Badge>}
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
                      <Package className="h-3.5 w-3.5" /> {v.cargaM3} m³
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
              Nenhuma carrinha corresponde à pesquisa.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
