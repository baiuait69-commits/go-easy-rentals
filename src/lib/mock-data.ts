export type Categoria = "SUV" | "Sedan" | "Compacto" | "Pick-up" | "Luxo";
export type Transmissao = "Manual" | "Automática";

export type Viatura = {
  id: string;
  marca: string;
  modelo: string;
  categoria: Categoria;
  transmissao: Transmissao;
  precoDia: number;
  precoHora: number;
  lugares: number;
  combustivel: string;
  imagem: string;
  empresa: string;
  zona: string;
  distanciaKm: number;
  avaliacao: number;
  entregaGratis: boolean;
  comMotorista: boolean;
  disponivel: boolean;
};

export const viaturas: Viatura[] = [
  {
    id: "prado-2022",
    marca: "Toyota",
    modelo: "Land Cruiser Prado",
    categoria: "SUV",
    transmissao: "Automática",
    precoDia: 95000,
    precoHora: 12000,
    lugares: 7,
    combustivel: "Gasóleo",
    imagem: "/images/car-1.jpg",
    empresa: "Kilamba Rent-a-Car",
    zona: "Talatona, Luanda",
    distanciaKm: 2.4,
    avaliacao: 4.9,
    entregaGratis: true,
    comMotorista: true,
    disponivel: true,
  },
  {
    id: "corolla-2023",
    marca: "Toyota",
    modelo: "Corolla",
    categoria: "Sedan",
    transmissao: "Automática",
    precoDia: 42000,
    precoHora: 6000,
    lugares: 5,
    combustivel: "Gasolina",
    imagem: "/images/car-2.jpg",
    empresa: "Angoauto Aluguer",
    zona: "Maianga, Luanda",
    distanciaKm: 5.1,
    avaliacao: 4.7,
    entregaGratis: true,
    comMotorista: false,
    disponivel: true,
  },
  {
    id: "tucson-2021",
    marca: "Hyundai",
    modelo: "Tucson",
    categoria: "SUV",
    transmissao: "Automática",
    precoDia: 58000,
    precoHora: 8000,
    lugares: 5,
    combustivel: "Gasolina",
    imagem: "/images/car-3.jpg",
    empresa: "Benguela Drive",
    zona: "Benfica, Luanda",
    distanciaKm: 8.7,
    avaliacao: 4.5,
    entregaGratis: false,
    comMotorista: true,
    disponivel: true,
  },
  {
    id: "swift-2022",
    marca: "Suzuki",
    modelo: "Swift",
    categoria: "Compacto",
    transmissao: "Manual",
    precoDia: 28000,
    precoHora: 4500,
    lugares: 5,
    combustivel: "Gasolina",
    imagem: "/images/car-4.jpg",
    empresa: "Kilamba Rent-a-Car",
    zona: "Kilamba, Luanda",
    distanciaKm: 11.3,
    avaliacao: 4.3,
    entregaGratis: false,
    comMotorista: false,
    disponivel: false,
  },
];

export type Reserva = {
  id: string;
  viaturaId: string;
  cliente: string;
  periodo: string;
  total: number;
  estado: "Pendente" | "Confirmada" | "Em curso" | "Concluída";
  metodo: string;
};

export const reservas: Reserva[] = [
  {
    id: "RSV-1042",
    viaturaId: "prado-2022",
    cliente: "Nelson Cabral",
    periodo: "12 – 15 Ago",
    total: 285000,
    estado: "Em curso",
    metodo: "Multicaixa Express",
  },
  {
    id: "RSV-1038",
    viaturaId: "corolla-2023",
    cliente: "Ana Tchissola",
    periodo: "02 – 04 Ago",
    total: 84000,
    estado: "Pendente",
    metodo: "Cartão Visa",
  },
  {
    id: "RSV-1015",
    viaturaId: "swift-2022",
    cliente: "Nelson Cabral",
    periodo: "18 – 20 Jul",
    total: 56000,
    estado: "Concluída",
    metodo: "Multicaixa Express",
  },
  {
    id: "RSV-1009",
    viaturaId: "tucson-2021",
    cliente: "Job Manuel",
    periodo: "05 – 09 Jul",
    total: 232000,
    estado: "Concluída",
    metodo: "Transferência",
  },
];

export const kwanza = (valor: number) =>
  new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(valor) + " Kz";

export const receitaMensal = [
  { mes: "Mar", valor: 1850000 },
  { mes: "Abr", valor: 2240000 },
  { mes: "Mai", valor: 1980000 },
  { mes: "Jun", valor: 2760000 },
  { mes: "Jul", valor: 3120000 },
  { mes: "Ago", valor: 3540000 },
];

export type Parceiro = {
  id: string;
  nome: string;
  nif: string;
  zona: string;
  frota: number;
  estado: "Pendente" | "Aprovado" | "Suspenso";
  plano: "Básico" | "Pro" | "Premium";
};

export const parceiros: Parceiro[] = [
  { id: "EMP-01", nome: "Kilamba Rent-a-Car", nif: "5417820394", zona: "Talatona", frota: 24, estado: "Aprovado", plano: "Pro" },
  { id: "EMP-02", nome: "Angoauto Aluguer", nif: "5410093882", zona: "Maianga", frota: 12, estado: "Aprovado", plano: "Básico" },
  { id: "EMP-03", nome: "Benguela Drive", nif: "5438871200", zona: "Benfica", frota: 8, estado: "Pendente", plano: "Básico" },
  { id: "EMP-04", nome: "Luanda Prime Cars", nif: "5449920117", zona: "Ilha", frota: 31, estado: "Pendente", plano: "Premium" },
  { id: "EMP-05", nome: "Cabinda Motors", nif: "5401778452", zona: "Cabinda", frota: 5, estado: "Suspenso", plano: "Básico" },
];

export type UtilizadorAdmin = {
  id: string;
  nome: string;
  email: string;
  tipo: "Cliente" | "Empresa";
  verificado: boolean;
  reservas: number;
  activo: boolean;
};

export const utilizadores: UtilizadorAdmin[] = [
  { id: "USR-1001", nome: "Nelson Cabral", email: "nelson@email.ao", tipo: "Cliente", verificado: true, reservas: 12, activo: true },
  { id: "USR-1002", nome: "Ana Tchissola", email: "ana.t@email.ao", tipo: "Cliente", verificado: false, reservas: 3, activo: true },
  { id: "USR-1003", nome: "Job Manuel", email: "job.m@email.ao", tipo: "Cliente", verificado: true, reservas: 7, activo: false },
  { id: "USR-1004", nome: "Kilamba Rent-a-Car", email: "geral@kilambarac.ao", tipo: "Empresa", verificado: true, reservas: 64, activo: true },
];

export const pagamentosAdmin = [
  { id: "PAG-8891", origem: "RSV-1042", metodo: "Multicaixa Express", valor: 285000, comissao: 34200, estado: "Liquidado" },
  { id: "PAG-8887", origem: "RSV-1038", metodo: "Cartão Visa", valor: 84000, comissao: 10080, estado: "Pendente" },
  { id: "PAG-8871", origem: "RSV-1015", metodo: "Multicaixa Express", valor: 56000, comissao: 6720, estado: "Liquidado" },
  { id: "PAG-8860", origem: "RSV-1009", metodo: "Transferência", valor: 232000, comissao: 27840, estado: "Liquidado" },
];

export const ticketsSuporte = [
  { id: "TK-341", assunto: "Viatura não entregue no local combinado", utilizador: "Ana Tchissola", prioridade: "Alta", estado: "Aberto" },
  { id: "TK-338", assunto: "Reembolso de reserva cancelada", utilizador: "Job Manuel", prioridade: "Média", estado: "Em análise" },
  { id: "TK-330", assunto: "Erro ao validar bilhete de identidade", utilizador: "Nelson Cabral", prioridade: "Baixa", estado: "Resolvido" },
];

export const utilizacaoSemanal = [
  { dia: "Seg", reservas: 34 },
  { dia: "Ter", reservas: 41 },
  { dia: "Qua", reservas: 38 },
  { dia: "Qui", reservas: 52 },
  { dia: "Sex", reservas: 76 },
  { dia: "Sáb", reservas: 88 },
  { dia: "Dom", reservas: 61 },
];