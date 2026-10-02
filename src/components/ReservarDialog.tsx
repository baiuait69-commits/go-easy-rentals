import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { kz } from "@/lib/marketplace";

export type ItemReserva = {
  anuncioId?: string | null;
  ref: string;
  titulo: string;
  imagem?: string | null;
  local?: string | null;
  precos: { hora?: number | null; dia: number | null; semana?: number | null; mes?: number | null };
  caucao: number;
};

const HORA = 3600_000;
const periodos = [
  { id: "hora", rotulo: "Hora", ms: HORA },
  { id: "dia", rotulo: "Dia", ms: 24 * HORA },
  { id: "semana", rotulo: "Semana", ms: 7 * 24 * HORA },
  { id: "mes", rotulo: "Mês", ms: 30 * 24 * HORA },
] as const;
const metodos = ["Multicaixa Express", "Cartão", "Transferência bancária"];

function local(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ReservarDialog({ item, disabled, label = "Reservar" }: { item: ItemReserva; disabled?: boolean; label?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const amanha = new Date(Date.now() + 24 * HORA); amanha.setMinutes(0, 0, 0);
  const [inicio, setInicio] = useState(local(amanha));
  const [fim, setFim] = useState(local(new Date(amanha.getTime() + 24 * HORA)));
  const [periodo, setPeriodo] = useState<(typeof periodos)[number]["id"]>("dia");
  const [metodo, setMetodo] = useState<string>(metodos[0]!);
  const [aEnviar, setAEnviar] = useState(false);

  const disponiveis = periodos.filter((p) => p.id === "dia" || item.precos[p.id] != null);
  const per = periodos.find((p) => p.id === periodo)!;
  const dur = new Date(fim).getTime() - new Date(inicio).getTime();
  const unidades = dur > 0 ? Math.ceil(dur / per.ms) : 0;
  const precoBase = item.precos[periodo] ?? item.precos.dia;\n  const total = unidades * Number(precoBase ?? 0);
  const comissao = Math.round(total * 0.15);

  async function confirmar() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (item.precos.dia == null) { toast.error("O proprietário ainda não definiu o preço."); return; }\n    if (dur <= 0) { toast.error("O fim tem de ser depois do início."); return; }
    setAEnviar(true);
    const { data, error } = await supabase.from("reservas").insert({
      anuncio_id: item.anuncioId ?? null, item_ref: item.ref, titulo: item.titulo, imagem: item.imagem ?? null,
      local: item.local ?? null, inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString(),
      total, caucao: item.caucao, metodo_pagamento: metodo, cliente_id: user.id,
      extras: { periodo, unidades },
    }).select("numero").single();
    setAEnviar(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Reserva ${data.numero} enviada ao fornecedor.`);
    setOpen(false);
    navigate({ to: "/reservas" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 w-full rounded-2xl text-base" disabled={disabled}
          onClick={(e) => { if (!user) { e.preventDefault(); toast("Inicie sessão para reservar."); navigate({ to: "/auth" }); } }}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader><DialogTitle>Reservar {item.titulo}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1">
            {disponiveis.map((p) => (
              <Button key={p.id} type="button" size="sm" variant={periodo === p.id ? "default" : "secondary"} className="rounded-lg" onClick={() => setPeriodo(p.id)}>{p.rotulo}</Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Início</Label><Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
          </div>
          <div>
            <Label>Pagamento</Label>
            <div className="mt-1 grid gap-1">
              {metodos.map((m) => (
                <Button key={m} type="button" size="sm" variant={metodo === m ? "default" : "secondary"} className="justify-start rounded-lg" onClick={() => setMetodo(m)}>{m}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1 rounded-xl bg-secondary/60 p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{unidades} × {per.rotulo.toLowerCase()}</span><span className="font-semibold">{kz(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Caução (devolvida)</span><span>{kz(item.caucao)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Comissão da plataforma (15%)</span><span>{kz(comissao)}</span></div>
          </div>
          <Button className="h-12 w-full rounded-xl" disabled={aEnviar || unidades === 0} onClick={confirmar}>
            {aEnviar ? "A enviar…" : `Confirmar ${kz(total)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
