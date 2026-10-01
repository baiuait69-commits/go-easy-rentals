import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GripVertical, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { listarCategoriasAdmin, atualizarCategoria } from "@/lib/marketplace-admin.functions";

export const Route = createFileRoute("/admin-categorias")({ component: () => <AdminGuard requerFuncao="admin"><AdminCategorias /></AdminGuard> });

function AdminCategorias() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarCategoriasAdmin);
  const atualizar = useServerFn(atualizarCategoria);
  const query = useQuery({ queryKey: ["admin", "categorias"], queryFn: () => listar() });
  const mutation = useMutation({ mutationFn: (data: any) => atualizar({ data }), onSuccess: () => { toast.success("Categoria guardada."); queryClient.invalidateQueries({ queryKey: ["admin", "categorias"] }); }, onError: (e: Error) => toast.error(e.message) });
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const categorias = (query.data ?? []).map((c: any) => ({ ...c, ...(drafts[c.id] ?? {}) }));
  return <AdminShell><div className="space-y-4 px-5 py-6"><div><h1 className="text-2xl">Categorias</h1><p className="mt-1 text-sm text-muted-foreground">Edite o nome, descrição, ordem e disponibilidade das categorias do marketplace.</p></div>{query.isLoading && <p className="text-sm text-muted-foreground">A carregar categorias…</p>}{query.isError && <p className="text-sm text-destructive">{(query.error as Error).message}</p>}<ul className="space-y-3">{categorias.map((c: any) => <li key={c.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-muted-foreground" /><div><h2 className="text-sm">{c.nome}</h2><p className="text-xs text-muted-foreground">/{c.slug}</p></div></div><Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Activa" : "Inactiva"}</Badge></div><div className="mt-3 space-y-3"><div className="space-y-1"><Label htmlFor={`nome-${c.id}`}>Nome</Label><Input id={`nome-${c.id}`} value={c.nome} onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: { ...p[c.id], nome: e.target.value } }))} className="h-10 rounded-xl" /></div><div className="space-y-1"><Label htmlFor={`descricao-${c.id}`}>Descrição</Label><Input id={`descricao-${c.id}`} value={c.descricao ?? ""} onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: { ...p[c.id], descricao: e.target.value } }))} className="h-10 rounded-xl" /></div><div className="flex items-center justify-between"><label htmlFor={`ativo-${c.id}`} className="text-sm">Disponível no marketplace</label><Switch id={`ativo-${c.id}`} checked={c.ativo} onCheckedChange={(v) => setDrafts((p) => ({ ...p, [c.id]: { ...p[c.id], ativo: v } }))} /></div><div className="grid grid-cols-[1fr_auto] items-end gap-2"><div className="space-y-1"><Label htmlFor={`ordem-${c.id}`}>Ordem</Label><Input id={`ordem-${c.id}`} type="number" min={0} value={c.ordem} onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: { ...p[c.id], ordem: Number(e.target.value) } }))} className="h-10 rounded-xl" /></div><Button className="h-10 rounded-xl" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: c.id, nome: c.nome, descricao: c.descricao ?? "", ativo: c.ativo, ordem: c.ordem })}><Save className="mr-1 h-4 w-4" /> Guardar</Button></div></div></li>)}</ul></div></AdminShell>;
}
