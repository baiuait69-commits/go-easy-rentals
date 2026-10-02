export type AppRole = "admin" | "empresa" | "suporte";

export type AdminArea = "estatisticas" | "reservas" | "parceiros" | "utilizadores" | "pagamentos" | "suporte";

export const rotuloFuncao: Record<AppRole, string> = {
  admin: "Gestor",
  empresa: "Empresa",
  suporte: "Suporte",
};

export const permissoes: Record<AppRole, AdminArea[]> = {
  admin: ["estatisticas", "reservas", "parceiros", "utilizadores", "pagamentos", "suporte"],
  empresa: ["estatisticas", "pagamentos"],
  suporte: ["utilizadores", "suporte"],
};

export const rotuloArea: Record<AdminArea, string> = {
  estatisticas: "Stats",
  reservas: "Reservas",
  parceiros: "Parceiros",
  utilizadores: "Users",
  pagamentos: "Pagam.",
  suporte: "Suporte",
};

export function areasPara(funcoes: AppRole[]): AdminArea[] {
  const ordem: AdminArea[] = ["estatisticas", "reservas", "parceiros", "utilizadores", "pagamentos", "suporte"];
  const set = new Set(funcoes.flatMap((f) => permissoes[f] ?? []));
  return ordem.filter((a) => set.has(a));
}
