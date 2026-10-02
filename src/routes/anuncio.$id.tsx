import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, ShieldCheck, Truck, UserRound } from "lucide-react";
import { ReservarDialog } from "@/components/ReservarDialog";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { kz, rotuloCategoria } from "@/lib/marketplace";

export const Route = createFileRoute("/anuncio/$id")({
  head: () => ({
    meta: [
      { title: "Anúncio — Teu Carro" },
      { name: "description", content: "Detalhes do anúncio: preços, condições e reserva." },
      { property: "og:title", content: "Anúncio — Teu Carro" },
      { property: "og:description", content: "Detalhes do anúncio: preços, condições e reserva." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetalheAnuncio,
});

function DetalheAnuncio() {
  const { id } = Route.useParams();

  const { data: anuncio, isLoading } = useQuery({
    queryKey: ["anuncio", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("anuncios").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="px-5 pt-16 text-sm text-muted-foreground">A carregar anúncio…</p>
      </AppShell>
    );
  }

  if (!anuncio) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <h1 className="text-2xl">Anúncio indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este anúncio já não está publicado no marketplace.
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl">
            <Link to="/marketplace">Voltar ao marketplace</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const precos = [
    { rotulo: "Hora", valor: anuncio.preco_hora },
    { rotulo: "Dia", valor: anuncio.preco_dia },
    { rotulo: "Semana", valor: anuncio.preco_semana },
    { rotulo: "Mês", valor: anuncio.preco_mes },
  ].filter((p) => p.valor != null);

  return (
    <AppShell>
      <div className="relative">
        {anuncio.imagem && (
          <img src={anuncio.imagem} alt={anuncio.titulo} className="h-56 w-full object-cover" />
        )}
        <Link
          to="/marketplace"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {rotuloCategoria(anuncio.categoria)} · {anuncio.subcategoria}
          </p>
          <h1 className="mt-1 text-2xl leading-tight">{anuncio.titulo}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {anuncio.municipio}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {anuncio.com_motorista && (
            <Badge variant="secondary">
              <UserRound className="mr-1 h-3.5 w-3.5" /> Motorista opcional
            </Badge>
          )}
          {anuncio.entrega && (
            <Badge className="bg-accent text-accent-foreground">
              <Truck className="mr-1 h-3.5 w-3.5" /> Entrega no local
            </Badge>
          )}
          {!anuncio.disponivel && <Badge variant="secondary">Indisponível</Badge>}
        </div>

        {anuncio.descricao && (
          <p className="text-sm leading-relaxed text-muted-foreground">{anuncio.descricao}</p>
        )}

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-base">Preços</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {precos.map((p) => (
              <li key={p.rotulo} className="rounded-xl bg-secondary/60 p-3">
                <span className="block text-xs text-muted-foreground">{p.rotulo}</span>
                <span className="font-display text-accent">{kz(p.valor)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Caução: {kz(anuncio.caucao)}
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 text-sm">
          {anuncio.marca && <Ficha rotulo="Marca" valor={anuncio.marca} />}
          {anuncio.modelo && <Ficha rotulo="Modelo" valor={anuncio.modelo} />}
          {anuncio.ano && <Ficha rotulo="Ano" valor={String(anuncio.ano)} />}
          {anuncio.transmissao && <Ficha rotulo="Caixa" valor={anuncio.transmissao} />}
          {anuncio.combustivel && <Ficha rotulo="Combustível" valor={anuncio.combustivel} />}
          {anuncio.lugares && <Ficha rotulo="Lugares" valor={String(anuncio.lugares)} />}
          {anuncio.carga_m3 && <Ficha rotulo="Carga" valor={`${anuncio.carga_m3} m³`} />}
        </ul>

        <ReservarDialog
          label="Pedir reserva"
          disabled={!anuncio.disponivel || anuncio.preco_dia == null}
          item={{
            anuncioId: anuncio.id, ref: anuncio.id, titulo: anuncio.titulo, imagem: anuncio.imagem, local: anuncio.municipio,
            precos: { hora: anuncio.preco_hora, dia: anuncio.preco_dia == null ? null : Number(anuncio.preco_dia), semana: anuncio.preco_semana, mes: anuncio.preco_mes },
            caucao: Number(anuncio.caucao),
          }}
        />
      </div>
    </AppShell>
  );
}

function Ficha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <li className="rounded-xl border border-border p-3">
      <span className="block text-xs text-muted-foreground">{rotulo}</span>
      <span className="font-semibold">{valor}</span>
    </li>
  );
}
