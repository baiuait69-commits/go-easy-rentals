import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Navigation, Package, Shield, Star, Truck, UserRound, Users, Wrench } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { kwanza, viaturas } from "@/lib/mock-data";

export const Route = createFileRoute("/viatura/$id")({
  loader: ({ params }) => {
    const viatura = viaturas.find((v) => v.id === params.id);
    if (!viatura) throw notFound();
    return { viatura };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Viatura indisponível — Kubuka" }, { name: "robots", content: "noindex" }] };
    }
    const nome = `${loaderData.viatura.marca} ${loaderData.viatura.modelo}`;
    return {
      meta: [
        { title: `${nome} para alugar — Kubuka` },
        { name: "description", content: `Alugue o ${nome} em ${loaderData.viatura.zona} com entrega e motorista opcional.` },
        { property: "og:title", content: `${nome} para alugar — Kubuka` },
        { property: "og:description", content: `Disponível em ${loaderData.viatura.zona} a partir de ${kwanza(loaderData.viatura.precoDia)} por dia.` },
      ],
    };
  },
  component: Detalhe,
});

const periodos = [
  { chave: "hora", label: "Hora", mult: 1 },
  { chave: "dia", label: "Dia", mult: 1 },
  { chave: "semana", label: "Semana", mult: 6 },
  { chave: "mes", label: "Mês", mult: 24 },
] as const;

function Detalhe() {
  const { viatura } = Route.useLoaderData();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<(typeof periodos)[number]["chave"]>("dia");
  const [motorista, setMotorista] = useState(false);
  const [entrega, setEntrega] = useState(true);
  const [seguro, setSeguro] = useState(true);

  const isCarrinha = viatura.categoria === "Carrinha";
  const [cargaM3, setCargaM3] = useState(1);
  const [tipoCarga, setTipoCarga] = useState<"mudanca" | "mercadoria">("mudanca");
  const [ajudantes, setAjudantes] = useState(false);

  const capacidade = viatura.cargaM3 ?? 0;
  const cargaExcede = isCarrinha && cargaM3 > capacidade;

  const base =
    periodo === "hora"
      ? viatura.precoHora
      : viatura.precoDia * (periodos.find((p) => p.chave === periodo)?.mult ?? 1);
  const total =
    base +
    (motorista ? 25000 : 0) +
    (entrega && !viatura.entregaGratis ? 8000 : 0) +
    (seguro ? 12000 : 0) +
    (isCarrinha && ajudantes ? 10000 : 0);

  return (
    <AppShell>
      <div className="relative">
        <img
          src={viatura.imagem}
          alt={`${viatura.marca} ${viatura.modelo}`}
          width={1024}
          height={768}
          className="h-64 w-full object-cover"
        />
        <Link
          to="/"
          className="absolute left-4 top-4 rounded-full bg-card/90 p-2 backdrop-blur"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-background px-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl">
              {viatura.marca} {viatura.modelo}
            </h1>
            <p className="text-sm text-muted-foreground">
              {viatura.empresa} · {viatura.categoria} · {viatura.transmissao}
            </p>
          </div>
          <Badge className="bg-accent text-accent-foreground">
            <Star className="mr-1 h-3 w-3" /> {viatura.avaliacao}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {viatura.zona}
              <span className="block text-xs text-muted-foreground">a {viatura.distanciaKm} km de si</span>
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl"
            onClick={() => toast.success("A abrir GPS até à viatura…")}
          >
            <Navigation className="mr-1 h-4 w-4" /> GPS
          </Button>
        </div>

        <h2 className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">Período de aluguer</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {periodos.map((p) => (
            <button
              key={p.chave}
              onClick={() => setPeriodo(p.chave)}
              className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                periodo === p.chave ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isCarrinha && (
          <>
            <h2 className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
              Detalhes da mudança / carga
            </h2>
            <div className="mt-2 space-y-4 rounded-2xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTipoCarga("mudanca")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    tipoCarga === "mudanca" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Package className="h-4 w-4" /> Mudança de casa
                </button>
                <button
                  onClick={() => setTipoCarga("mercadoria")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    tipoCarga === "mercadoria" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Truck className="h-4 w-4" /> Mercadoria
                </button>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume de carga</span>
                  <span className={`font-semibold ${cargaExcede ? "text-destructive" : "text-primary"}`}>
                    {cargaM3} m³ <span className="font-normal text-muted-foreground">/ capacidade {capacidade} m³</span>
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  min={1}
                  max={Math.max(capacidade + 5, 25)}
                  step={1}
                  value={[cargaM3]}
                  onValueChange={([v]) => setCargaM3(v ?? 1)}
                />
                {cargaExcede ? (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    O volume excede a capacidade desta carrinha. Escolha uma carrinha maior ou reduza o volume.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Capacidade disponível: {capacidade - cargaM3} m³ restantes.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <UserRound className="h-4 w-4 text-accent" />
                  <span className="text-sm">
                    Motorista
                    <span className="block text-xs text-muted-foreground">
                      {viatura.comMotorista ? "+ 25 000 Kz" : "Não disponível nesta carrinha"}
                    </span>
                  </span>
                </div>
                <Switch
                  checked={motorista && viatura.comMotorista}
                  onCheckedChange={setMotorista}
                  disabled={!viatura.comMotorista}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-sm">
                    Ajudantes de carga
                    <span className="block text-xs text-muted-foreground">+ 10 000 Kz</span>
                  </span>
                </div>
                <Switch checked={ajudantes} onCheckedChange={setAjudantes} />
              </div>
            </div>
          </>
        )}

        <h2 className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">Serviços adicionais</h2>
        <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
          {!isCarrinha && (
            <Extra
              icon={<UserRound className="h-4 w-4 text-accent" />}
              titulo="Motorista"
              sub="+ 25 000 Kz"
              checked={motorista}
              onChange={setMotorista}
              disabled={!viatura.comMotorista}
            />
          )}
          <Extra
            icon={<Navigation className="h-4 w-4 text-accent" />}
            titulo="Entrega onde estiver"
            sub={viatura.entregaGratis ? "Grátis" : "+ 8 000 Kz"}
            checked={entrega}
            onChange={setEntrega}
          />
          <Extra
            icon={<Shield className="h-4 w-4 text-accent" />}
            titulo="Seguro completo"
            sub="+ 12 000 Kz"
            checked={seguro}
            onChange={setSeguro}
          />
        </ul>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench className="h-4 w-4" /> Assistência em caso de avaria incluída em todas as reservas.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="font-display text-xl text-accent">{kwanza(total)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="rounded-lg bg-secondary px-3 py-2 text-center">Multicaixa Express</span>
            <span className="rounded-lg bg-secondary px-3 py-2 text-center">Cartão / Transferência</span>
          </div>
          <Button
            className="mt-4 h-12 w-full rounded-2xl text-base"
            disabled={!viatura.disponivel || cargaExcede}
            onClick={() => {
              toast.success("Reserva enviada à empresa", {
                description: isCarrinha
                  ? `${tipoCarga === "mudanca" ? "Mudança de casa" : "Mercadoria"} · ${cargaM3} m³${motorista ? " · com motorista" : ""}. Confirmação em tempo real.`
                  : "Vai receber a confirmação em tempo real.",
              });
              navigate({ to: "/reservas" });
            }}
          >
            {!viatura.disponivel ? "Indisponível hoje" : cargaExcede ? "Volume excede a capacidade" : "Reservar agora"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Extra({
  icon,
  titulo,
  sub,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  titulo: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">
          {titulo}
          <span className="block text-xs text-muted-foreground">
            {disabled ? "Não disponível nesta viatura" : sub}
          </span>
        </span>
      </div>
      <Switch checked={checked && !disabled} onCheckedChange={onChange} disabled={disabled} />
    </li>
  );
}