import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { categorias, kz, municipios, rotuloCategoria, rotuloEstado, type Categoria } from "@/lib/marketplace";

export const Route = createFileRoute("/meus-anuncios")({
  head: () => ({
    meta: [
      { title: "Os meus anúncios — Teu Carro" },
      {
        name: "description",
        content: "Publique e faça a gestão dos seus veículos, máquinas e serviços de transporte.",
      },
      { property: "og:title", content: "Os meus anúncios — Teu Carro" },
      { property: "og:description", content: "Publique e faça a gestão dos seus anúncios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusAnuncios,
});

const vazio = {
  titulo: "",
  categoria: "veiculos" as Categoria,
  subcategoria: "",
  municipio: "Talatona",
  preco_dia: "",
  caucao: "",
  descricao: "",
  imagem: "",
  com_motorista: false,
  entrega: false,
};

function MeusAnuncios() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [aberto, setAberto] = useState(false);

  const anunciosQuery = useQuery({
    queryKey: ["meus-anuncios", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const client: any = supabase;\n      const { error } = await client.from("anuncios").insert({
        owner_id: user!.id,
        titulo: form.titulo.trim(),
        categoria: form.categoria,
        subcategoria: form.subcategoria.trim() || "Geral",
        municipio: form.municipio,
        preco_dia: form.preco_dia ? Number(form.preco_dia) : null,
        caucao: Number(form.caucao || 0),
        descricao: form.descricao.trim() || null,
        imagem: form.imagem.trim() || null,
        com_motorista: form.com_motorista,
        entrega: form.entrega,
        estado: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio enviado para aprovação.");
      setForm(vazio);
      setAberto(false);
      queryClient.invalidateQueries({ queryKey: ["meus-anuncios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apagar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio removido.");
      queryClient.invalidateQueries({ queryKey: ["meus-anuncios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <h1 className="text-2xl">Entre para publicar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Precisa de uma conta para publicar e gerir anúncios no marketplace.
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl">
            <Link to="/auth">Entrar ou criar conta</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="bg-heat px-5 pt-8 pb-8 text-foreground">
        <h1 className="text-2xl leading-tight">Os meus anúncios</h1>
        <p className="mt-1 text-sm opacity-90">Publique a sua frota, máquinas ou serviços.</p>
      </header>

      <div className="space-y-4 px-5 py-5">
        <Button className="h-12 w-full rounded-2xl" onClick={() => setAberto((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> {aberto ? "Fechar formulário" : "Novo anúncio"}
        </Button>

        {aberto && (
          <form
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.titulo.trim()) {
                toast.error("Indique o título.");
                return;
              }
              criar.mutate();
            }}
          >
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Toyota Hiace de carga"
                className="mt-1 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.valor} value={c.valor}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Município</Label>
                <Select value={form.municipio} onValueChange={(v) => setForm({ ...form, municipio: v })}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sub">Subcategoria</Label>
                <Input
                  id="sub"
                  value={form.subcategoria}
                  onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                  placeholder="Carrinha de carga"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço / dia (Kz, definido por si)</Label>
                <Input
                  id="preco"
                  inputMode="numeric"
                  value={form.preco_dia}
                  onChange={(e) => setForm({ ...form, preco_dia: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="caucao">Caução (Kz)</Label>
                <Input
                  id="caucao"
                  inputMode="numeric"
                  value={form.caucao}
                  onChange={(e) => setForm({ ...form, caucao: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="imagem">Imagem (link)</Label>
                <Input
                  id="imagem"
                  value={form.imagem}
                  onChange={(e) => setForm({ ...form, imagem: e.target.value })}
                  placeholder="/images/van-1.jpg"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
              <Label htmlFor="motorista">Motorista opcional</Label>
              <Switch
                id="motorista"
                checked={form.com_motorista}
                onCheckedChange={(v) => setForm({ ...form, com_motorista: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
              <Label htmlFor="entrega">Entrega no local</Label>
              <Switch
                id="entrega"
                checked={form.entrega}
                onCheckedChange={(v) => setForm({ ...form, entrega: v })}
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={criar.isPending}>
              {criar.isPending ? "A enviar…" : "Enviar para aprovação"}
            </Button>
          </form>
        )}

        <ul className="space-y-3">
          {(anunciosQuery.data ?? []).map((a) => (
            <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base">{a.titulo}</h2>
                  <p className="text-xs text-muted-foreground">
                    {rotuloCategoria(a.categoria)} · {a.municipio}
                  </p>
                </div>
                <Badge variant={a.estado === "aprovado" ? "default" : "secondary"}>
                  {rotuloEstado[a.estado]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-accent">{a.preco_dia != null ? `${kz(a.preco_dia)} / dia` : "Preço definido pelo proprietário"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-destructive"
                  onClick={() => apagar.mutate(a.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remover
                </Button>
              </div>
            </li>
          ))}
          {anunciosQuery.data?.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Ainda não publicou nenhum anúncio.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
