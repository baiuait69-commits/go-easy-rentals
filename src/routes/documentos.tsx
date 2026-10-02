import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/documentos")({ component: Documentos });

const tipos = [
  ["bilhete_identidade", "Bilhete de Identidade"],
  ["carta_conducao", "Carta de condução"],
  ["nif", "NIF"],
  ["registo_comercial", "Registo comercial"],
  ["outro", "Outro"],
] as const;

function Documentos() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<string>("bilhete_identidade");
  const [file, setFile] = useState<File | null>(null);

  const query = useQuery({
    queryKey: ["documentos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos_verificacao").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      if (!user || !file) throw new Error("Seleccione um ficheiro.");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safe}`;
      const upload = await supabase.storage.from("verificacao").upload(path, file, { upsert: false });
      if (upload.error) throw upload.error;
      const { error } = await supabase.from("documentos_verificacao").insert({
        user_id: user.id,
        tipo,
        ficheiro_url: path,
        estado: "pendente",
      });
      if (error) {
        await supabase.storage.from("verificacao").remove([path]);
        throw error;
      }
    },
    onSuccess: () => { setFile(null); toast.success("Documento enviado para verificação."); qc.invalidateQueries({ queryKey: ["documentos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !user) return <AppShell><div className="px-5 pt-16 text-center"><h1 className="text-2xl">Verificação de documentos</h1><p className="mt-2 text-sm text-muted-foreground">Inicie sessão para enviar os seus documentos.</p><Button asChild className="mt-6 rounded-2xl"><Link to="/auth">Entrar</Link></Button></div></AppShell>;

  return <AppShell><header className="px-5 pt-8"><p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><FileCheck2 className="h-4 w-4" /> Verificação</p><h1 className="mt-1 text-2xl">Os meus documentos</h1><p className="mt-1 text-sm text-muted-foreground">Envie os documentos necessários para aprovação da sua conta.</p></header><div className="space-y-4 px-5 py-5"><div className="space-y-3 rounded-2xl border border-border bg-card p-4"><Select value={tipo} onValueChange={setTipo}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{tipos.map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center"><Upload className="h-5 w-5 text-primary" /><span className="mt-2 text-sm">{file ? file.name : "Escolher documento"}</span><span className="mt-1 text-xs text-muted-foreground">PDF, JPG ou PNG</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label><Button className="h-11 w-full rounded-xl" disabled={!file || enviar.isPending} onClick={() => enviar.mutate()}>{enviar.isPending ? "A enviar…" : "Enviar para verificação"}</Button></div><div className="space-y-2">{(query.data ?? []).map((d: any) => <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4"><div><p className="text-sm font-medium">{tipos.find(([v]) => v === d.tipo)?.[1] ?? d.tipo}</p><p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-PT")}</p></div><Badge variant={d.estado === "aprovado" ? "default" : d.estado === "rejeitado" ? "destructive" : "secondary"}>{d.estado}</Badge></div>)}{!query.data?.length && <p className="py-6 text-center text-sm text-muted-foreground">Ainda não enviou documentos.</p>}</div></div></AppShell>;
}
