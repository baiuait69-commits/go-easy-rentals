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