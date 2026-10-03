import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calcularTotal, COMISSAO, HORAS, kzFmt, metodosPagamento, type Periodo, type Precos } from "@/lib/reservas";

export interface ItemReserva {
  anuncioId?: string | null;
  itemRef: string;
  titulo: string;
  imagem?: string | null;
  local?: string | null;
  precos: Precos;
  caucao?: number;
  extrasValor?: number;
  extras?: Record<string, unknown>;
}

function paraInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ReservarDialog({ item, trigger, disabled }: { item: ItemReserva; trigger: ReactNode; disabled?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const amanha = new Date(Date.now() + 86_400_000);
  amanha.setMinutes(0, 0, 0);
  const [inicio, setInicio] = useState(paraInput(amanha));
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [fim, setFim] = useState(paraInput(new Date(amanha.getTime() + 86_400_000)));
  const [metodo, setMetodo] = useState<string>(metodosPagamento[0]);
  const [busy, setBusy] = useState(false);

  const di = new Date(inicio);
  const df = new Date(fim);
  const valido = !isNaN(di.getTime()) && !isNaN(df.getTime()) && df > di;
  const base = valido ? calcularTotal(item.precos, di, df, periodo) : 0;
  const total = base + (item.extrasValor ?? 0);
  const caucao = item.caucao ?? 0;

  function mudarPeriodo(p: Periodo) {
    setPeriodo(p);
    if (!isNaN(di.getTime())) setFim(paraInput(new Date(di.getTime() + HORAS[p] * 3_600_000)));
  }

  async function confirmar(): Promise<void> {
    if (!valido) { toast.error("A data de fim tem de ser depois do início."); return; }
    if (di.getTime() < Date.now() - 3_600_000) { toast.error("A data de início já passou."); return; }
    setBusy(true);
    const { data, error } = await supabase
      .from("reservas")
      .insert({
        anuncio_id: item.anuncioId ?? null,
        item_ref: item.itemRef,
        titulo: item.titulo,
        imagem: item.imagem ?? null,
        local: item.local ?? null,
        inicio: di.toISOString(),
        fim: df.toISOString(),
        total,
        caucao,
        comissao: Math.round(total * COMISSAO),
        metodo_pagamento: metodo,
        extras: { periodo, ...(item.extras ?? {}) } as never,
      })
      .select("numero")
      .single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Reserva ${data.numero} enviada`, { description: "Vai receber a confirmação do fornecedor." });
    setOpen(false);
    navigate({ to: "/reservas" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && !user) {
          toast.info("Inicie sessão para reservar.");
          navigate({ to: "/auth" });
          return;
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-[420px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-left">Reservar · {item.titulo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {(["hora", "dia", "semana", "mes"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => mudarPeriodo(p)}
                className={`rounded-xl py-2 text-xs font-semibold ${periodo === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {p === "mes" ? "Mês" : p[0]!.toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Pagamento</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {metodosPagamento.map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodo(m)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-semibold ${metodo === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 rounded-2xl border border-border bg-card p-3 text-sm">
            <Linha r="Aluguer" v={kzFmt(base)} />
            {!!item.extrasValor && <Linha r="Extras" v={kzFmt(item.extrasValor)} />}
            <Linha r="Caução (reembolsável)" v={kzFmt(caucao)} />
            <Linha r="Inclui comissão (15%)" v={kzFmt(total * COMISSAO)} />
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="text-primary">{kzFmt(total)}</span>
            </div>
          </div>
          <Button className="h-12 w-full rounded-2xl" disabled={busy || !valido} onClick={confirmar}>
            {busy ? "A enviar…" : "Confirmar reserva"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Linha({ r, v }: { r: string; v: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{r}</span>
      <span>{v}</span>
    </div>
  );
}
