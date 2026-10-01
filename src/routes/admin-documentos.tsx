import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ExternalLink, FileCheck2, FileX2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listarDocumentosPendentes, reverDocumento } from "@/lib/marketplace-admin.functions";

export const Route = createFileRoute("/admin-documentos")({ component: () => <AdminGuard requerFuncao="admin"><AdminDocumentos /></AdminGuard> });
const tipos: Record<string, string> = { bilhete_identidade: "Bilhete de Identidade", carta_conducao: "Carta de condução", nif: "NIF", registo_comercial: "Registo comercial", outro: "Outro" };

function AdminDocumentos() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarDocumentosPendentes);
  const rever = useServerFn(reverDocumento);
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const query = useQuery({ queryKey: ["admin", "documentos"], queryFn: () => listar() });
  const mutation = useMutation({ mutationFn: (data: { id: string; estado: "aprovado" | "rejeitado"; motivo?: string }) => rever({ data }), onSuccess: () => { toast.success("Documento actualizado."); queryClient.invalidateQueries({ queryKey: ["admin", "documentos"] }); }, onError: (e: Error) => toast.error(e.message) });
  const docs = query.data ?? [];
  const pendentes = docs.filter((d: any) => d.estado === "pendente");
  return <AdminShell><div className="space-y-4 px-5 py-6"><div><h1 className="text-2xl">Verificação de documentos</h1><p className="mt-1 text-sm text-muted-foreground">{pendentes.length} pendentes · {docs.length} no total</p></div>{query.isLoading && <p className="text-sm text-muted-foreground">A carregar documentos…</p>}{query.isError && <p className="text-sm text-destructive">{(query.error as Error).message}</p>}<ul className="space-y-3">{docs.map((d: any) => <li key={d.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm">{d.perfis?.nome ?? "Utilizador"}</h2><p className="text-xs text-muted-foreground">{tipos[d.tipo] ?? d.tipo}{d.numero ? ` · ${d.numero}` : ""}</p><p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-PT")}</p></div><Badge variant={d.estado === "aprovado" ? "default" : d.estado === "rejeitado" ? "destructive" : "secondary"}>{d.estado}</Badge></div><Button asChild variant="outline" className="mt-3 w-full rounded-xl"><a href={d.ficheiro_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Ver documento</a></Button>{d.estado === "pendente" && <div className="mt-3 space-y-2"><div className="space-y-1"><Label htmlFor={`motivo-${d.id}`}>Motivo (obrigatório para rejeitar)</Label><Input id={`motivo-${d.id}`} value={motivos[d.id] ?? ""} onChange={(e) => setMotivos((p) => ({ ...p, [d.id]: e.target.value }))} placeholder="Ex.: documento ilegível" className="h-10 rounded-xl" /></div><div className="grid grid-cols-2 gap-2"><Button className="rounded-xl" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: d.id, estado: "aprovado" })}><FileCheck2 className="mr-1 h-4 w-4" /> Aprovar</Button><Button variant="secondary" className="rounded-xl" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: d.id, estado: "rejeitado", motivo: motivos[d.id] })}><FileX2 className="mr-1 h-4 w-4" /> Rejeitar</Button></div></div>}{d.estado === "rejeitado" && d.motivo_rejeicao && <p className="mt-2 text-xs text-destructive">Motivo: {d.motivo_rejeicao}</p>}</li>)}</ul>{!query.isLoading && docs.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Não existem documentos para verificar.</div>}</div></AdminShell>;
}
