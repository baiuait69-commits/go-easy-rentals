// Estrutura hierárquica dinâmica:
// Ramo -> Categoria -> Subcategoria -> Produto

export type Ramo = "viaturas" | "maquinas";

export type CategoriaCat = {
  slug: string;
  nome: string;
  ramo: Ramo;
  icone: string; // emoji simples, substituível por ícone próprio
  ordem: number;
  ativa: boolean;
  subcategorias: SubcategoriaCat[];
};

export type SubcategoriaCat = {
  slug: string;
  nome: string;
  icone: string;
};

export type Produto = {
  id: string;
  nome: string;
  marca: string;
  ramo: Ramo;
  categoria: string; // slug
  subcategoria: string; // slug
  resumo: string;
  descricao: string;
  precoDia: number;
  imagem?: string;
  icone: string;
  destaque?: boolean;
  fichas: { rotulo: string; valor: string }[];
  zona: string;
};

export const kz = (v: number) =>
  new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(v) + " Kz";

export const ramos: { slug: Ramo; nome: string; icone: string; descricao: string }[] = [
  {
    slug: "viaturas",
    nome: "Viaturas",
    icone: "🚗",
    descricao: "Alugue carros, SUVs, vans, camiões, motos, barcos...",
  },
  {
    slug: "maquinas",
    nome: "Máquinas",
    icone: "🚜",
    descricao: "Alugue máquinas, ferramentas, geradores e equipamentos...",
  },
];

export const categorias: CategoriaCat[] = [
  {
    slug: "automoveis",
    nome: "Automóveis",
    ramo: "viaturas",
    icone: "🚘",
    ordem: 1,
    ativa: true,
    subcategorias: [
      { slug: "sedan", nome: "Sedan", icone: "🚙" },
      { slug: "compacto", nome: "Compacto", icone: "🚗" },
      { slug: "luxo", nome: "Luxo", icone: "👑" },
    ],
  },
  {
    slug: "suv-todo-o-terreno",
    nome: "SUV & Todo-o-terreno",
    ramo: "viaturas",
    icone: "🚙",
    ordem: 2,
    ativa: true,
    subcategorias: [
      { slug: "suv", nome: "SUV", icone: "🚙" },
      { slug: "suv-premium", nome: "SUV Premium", icone: "👑" },
      { slug: "4x4", nome: "4x4", icone: "🛻" },
      { slug: "todo-o-terreno", nome: "Todo-o-terreno", icone: "🏔️" },
    ],
  },
  {
    slug: "utilitarios",
    nome: "Utilitários",
    ramo: "viaturas",
    icone: "🚐",
    ordem: 3,
    ativa: true,
    subcategorias: [
      { slug: "carrinhas-carga", nome: "Carrinhas de carga", icone: "🚚" },
      { slug: "mudancas", nome: "Mudanças", icone: "📦" },
    ],
  },
  {
    slug: "transporte-passageiros",
    nome: "Transporte de passageiros",
    ramo: "viaturas",
    icone: "🚌",
    ordem: 4,
    ativa: true,
    subcategorias: [
      { slug: "minibus", nome: "Minibus", icone: "🚐" },
      { slug: "autocarros", nome: "Autocarros", icone: "🚌" },
    ],
  },
  {
    slug: "motos",
    nome: "Motos",
    ramo: "viaturas",
    icone: "🏍️",
    ordem: 5,
    ativa: true,
    subcategorias: [
      { slug: "urbanas", nome: "Urbanas", icone: "🛵" },
      { slug: "todo-o-terreno-moto", nome: "Todo-o-terreno", icone: "🏍️" },
    ],
  },
  {
    slug: "embarcacoes",
    nome: "Embarcações",
    ramo: "viaturas",
    icone: "🛥️",
    ordem: 6,
    ativa: true,
    subcategorias: [
      { slug: "lanchas", nome: "Lanchas", icone: "🚤" },
      { slug: "barcos-pesca", nome: "Barcos de pesca", icone: "🎣" },
    ],
  },
  {
    slug: "reboques-atrelados",
    nome: "Reboques & Atrelados",
    ramo: "viaturas",
    icone: "🚛",
    ordem: 7,
    ativa: true,
    subcategorias: [
      { slug: "atrelados", nome: "Atrelados", icone: "🚛" },
      { slug: "porta-maquinas", nome: "Porta-máquinas", icone: "🛻" },
    ],
  },
  {
    slug: "construcao-civil",
    nome: "Construção Civil",
    ramo: "maquinas",
    icone: "🏗️",
    ordem: 1,
    ativa: true,
    subcategorias: [
      { slug: "escavadoras", nome: "Escavadoras", icone: "🚜" },
      { slug: "retroescavadoras", nome: "Retroescavadoras", icone: "🚧" },
      { slug: "cilindros", nome: "Cilindros compactadores", icone: "🛞" },
    ],
  },
  {
    slug: "agricultura",
    nome: "Agricultura",
    ramo: "maquinas",
    icone: "🌾",
    ordem: 2,
    ativa: true,
    subcategorias: [
      { slug: "tratores", nome: "Tratores", icone: "🚜" },
      { slug: "alfaias", nome: "Alfaias agrícolas", icone: "🌱" },
    ],
  },
  {
    slug: "elevacao-movimentacao",
    nome: "Elevação & Movimentação",
    ramo: "maquinas",
    icone: "🏗️",
    ordem: 3,
    ativa: true,
    subcategorias: [
      { slug: "gruas", nome: "Gruas", icone: "🏗️" },
      { slug: "empilhadores", nome: "Empilhadores", icone: "🛻" },
      { slug: "plataformas", nome: "Plataformas elevatórias", icone: "🪜" },
    ],
  },
  {
    slug: "energia-electricidade",
    nome: "Energia & Electricidade",
    ramo: "maquinas",
    icone: "⚡",
    ordem: 4,
    ativa: true,
    subcategorias: [
      { slug: "geradores", nome: "Geradores", icone: "🔌" },
      { slug: "geradores-portateis", nome: "Geradores portáteis", icone: "🔋" },
      { slug: "geradores-industriais", nome: "Geradores industriais", icone: "🏭" },
      { slug: "geradores-silenciosos", nome: "Geradores silenciosos", icone: "🔇" },
      { slug: "torres-iluminacao", nome: "Torres de iluminação", icone: "💡" },
      { slug: "compressores", nome: "Compressores", icone: "🌀" },
      { slug: "transformadores", nome: "Transformadores", icone: "⚙️" },
      { slug: "quadros-electricos", nome: "Quadros eléctricos", icone: "🔲" },
    ],
  },
  {
    slug: "ferramentas-electricas",
    nome: "Ferramentas Eléctricas",
    ramo: "maquinas",
    icone: "🔧",
    ordem: 5,
    ativa: true,
    subcategorias: [
      { slug: "martelos", nome: "Martelos demolidores", icone: "🔨" },
      { slug: "serras", nome: "Serras", icone: "🪚" },
    ],
  },
  {
    slug: "equipamentos-obra",
    nome: "Ferramentas & Equipamentos de Obra",
    ramo: "maquinas",
    icone: "🧰",
    ordem: 6,
    ativa: true,
    subcategorias: [
      { slug: "betoneiras", nome: "Betoneiras", icone: "🛠️" },
      { slug: "andaimes", nome: "Andaimes", icone: "🪜" },
    ],
  },
  {
    slug: "bombas-agua",
    nome: "Bombas & Água",
    ramo: "maquinas",
    icone: "💧",
    ordem: 7,
    ativa: true,
    subcategorias: [
      { slug: "bombas-submersiveis", nome: "Bombas submersíveis", icone: "💧" },
      { slug: "cisternas", nome: "Cisternas", icone: "🚰" },
    ],
  },
  {
    slug: "limpeza-industrial",
    nome: "Limpeza Industrial",
    ramo: "maquinas",
    icone: "🧼",
    ordem: 8,
    ativa: true,
    subcategorias: [
      { slug: "lavadoras", nome: "Lavadoras de alta pressão", icone: "🚿" },
      { slug: "aspiradores", nome: "Aspiradores industriais", icone: "🧹" },
    ],
  },
  {
    slug: "climatizacao",
    nome: "Climatização",
    ramo: "maquinas",
    icone: "❄️",
    ordem: 9,
    ativa: true,
    subcategorias: [
      { slug: "ar-condicionado", nome: "Ar condicionado móvel", icone: "❄️" },
      { slug: "ventilacao", nome: "Ventilação", icone: "🌬️" },
    ],
  },
];

export const produtos: Produto[] = [
  {
    id: "land-cruiser-300",
    nome: "Toyota Land Cruiser 300",
    marca: "Toyota",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "suv-premium",
    resumo: "SUV Premium · 4x4",
    descricao: "Toyota Land Cruiser 300 — conforto, potência e segurança para qualquer terreno.",
    precoDia: 150000,
    imagem: "/images/vehicles/toyota-land-cruiser-300.svg",
    icone: "🚙",
    destaque: true,
    zona: "Talatona, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "7 Lugares" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "range-rover-sport",
    nome: "Range Rover Sport",
    marca: "Land Rover",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "suv-premium",
    resumo: "SUV Premium · 4x4",
    descricao: "Range Rover Sport — luxo britânico com capacidade todo-o-terreno.",
    precoDia: 180000,
    imagem: "/images/vehicles/range-rover-sport.svg",
    icone: "🚙",
    zona: "Miramar, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "5 Lugares" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "bmw-x5",
    nome: "BMW X5",
    marca: "BMW",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "suv-premium",
    resumo: "SUV Premium · 4x4",
    descricao: "BMW X5 — desportividade e conforto premium para a cidade e estrada.",
    precoDia: 170000,
    imagem: "/images/vehicles/bmw-x5.svg",
    icone: "🚙",
    zona: "Talatona, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "5 Lugares" },
      { rotulo: "Combustível", valor: "Gasolina" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "mercedes-gle",
    nome: "Mercedes-Benz GLE",
    marca: "Mercedes-Benz",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "suv-premium",
    resumo: "SUV Premium · 4x4",
    descricao: "Mercedes-Benz GLE — elegância, tecnologia e potência.",
    precoDia: 160000,
    imagem: "/images/vehicles/mercedes-gle.svg",
    icone: "🚙",
    zona: "Kilamba, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "5 Lugares" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "prado-suv",
    nome: "Toyota Land Cruiser Prado",
    marca: "Toyota",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "suv",
    resumo: "SUV · 4x4",
    descricao: "Prado — o clássico robusto para trabalho e família.",
    precoDia: 95000,
    imagem: "/images/vehicles/toyota-prado.svg",
    icone: "🚙",
    zona: "Talatona, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "7 Lugares" },
      { rotulo: "Combustível", valor: "Gasóleo" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "hilux-4x4",
    nome: "Toyota Hilux",
    marca: "Toyota",
    ramo: "viaturas",
    categoria: "suv-todo-o-terreno",
    subcategoria: "4x4",
    resumo: "Pick-up · 4x4",
    descricao: "Hilux — pick-up de trabalho fiável em qualquer piso.",
    precoDia: 88000,
    imagem: "/images/vehicles/toyota-hilux.svg",
    icone: "🛻",
    zona: "Viana, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "5 Lugares" },
      { rotulo: "Combustível", valor: "Gasóleo" },
      { rotulo: "Caixa", valor: "Manual" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "corolla-sedan",
    nome: "Toyota Corolla",
    marca: "Toyota",
    ramo: "viaturas",
    categoria: "automoveis",
    subcategoria: "sedan",
    resumo: "Sedan · Económico",
    descricao: "Corolla — económico, confortável e ideal para o dia-a-dia.",
    precoDia: 42000,
    imagem: "/images/vehicles/toyota-corolla.svg",
    icone: "🚗",
    zona: "Maianga, Luanda",
    fichas: [
      { rotulo: "Lugares", valor: "5 Lugares" },
      { rotulo: "Combustível", valor: "Gasolina" },
      { rotulo: "Caixa", valor: "Automático" },
      { rotulo: "Tração", valor: "4x2" },
    ],
  },
  {
    id: "hyundai-h1",
    nome: "Hyundai H1 Carga",
    marca: "Hyundai",
    ramo: "viaturas",
    categoria: "utilitarios",
    subcategoria: "carrinhas-carga",
    resumo: "Carrinha de carga · 8 m³",
    descricao: "Carrinha de carga para mercadoria e pequenas mudanças.",
    precoDia: 65000,
    imagem: "/images/vehicles/hyundai-h1.svg",
    icone: "🚚",
    zona: "Cazenga, Luanda",
    fichas: [
      { rotulo: "Carga", valor: "8 m³" },
      { rotulo: "Combustível", valor: "Gasóleo" },
      { rotulo: "Motorista", valor: "Opcional" },
      { rotulo: "Caixa", valor: "Manual" },
    ],
  },
  {
    id: "iveco-mudancas",
    nome: "Iveco Daily Mudanças",
    marca: "Iveco",
    ramo: "viaturas",
    categoria: "utilitarios",
    subcategoria: "mudancas",
    resumo: "Mudanças · 18 m³",
    descricao: "Iveco Daily com caixa fechada, ideal para mudanças de casa.",
    precoDia: 110000,
    imagem: "/images/vehicles/iveco-daily.svg",
    icone: "📦",
    zona: "Viana, Luanda",
    fichas: [
      { rotulo: "Carga", valor: "18 m³" },
      { rotulo: "Combustível", valor: "Gasóleo" },
      { rotulo: "Motorista", valor: "Incluído" },
      { rotulo: "Ajudantes", valor: "Opcional" },
    ],
  },
  {
    id: "honda-eu30is",
    nome: "Honda EU30iS",
    marca: "Honda",
    ramo: "maquinas",
    categoria: "energia-electricidade",
    subcategoria: "geradores-portateis",
    resumo: "Gerador portátil · 3kVA",
    descricao: "Gerador Honda EU30iS, ideal para uso em obras, eventos e backup de energia.",
    precoDia: 250000,
    icone: "🔋",
    destaque: true,
    zona: "Talatona, Luanda",
    fichas: [
      { rotulo: "Potência", valor: "3 kW" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Arranque", valor: "Partida eléctrica" },
      { rotulo: "Nível de ruído", valor: "58 dB" },
    ],
  },
  {
    id: "honda-eg1000",
    nome: "Honda EG1000",
    marca: "Honda",
    ramo: "maquinas",
    categoria: "energia-electricidade",
    subcategoria: "geradores-industriais",
    resumo: "Gerador industrial · 8kVA",
    descricao: "Gerador industrial para obras de média dimensão.",
    precoDia: 450000,
    icone: "🏭",
    zona: "Viana, Luanda",
    fichas: [
      { rotulo: "Potência", valor: "8 kVA" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Arranque", valor: "Partida eléctrica" },
      { rotulo: "Depósito", valor: "40 L" },
    ],
  },
  {
    id: "honda-eu70is",
    nome: "Honda EU70iS",
    marca: "Honda",
    ramo: "maquinas",
    categoria: "energia-electricidade",
    subcategoria: "geradores-silenciosos",
    resumo: "Gerador silencioso · 7kVA",
    descricao: "Gerador silencioso para eventos e zonas residenciais.",
    precoDia: 600000,
    icone: "🔇",
    zona: "Miramar, Luanda",
    fichas: [
      { rotulo: "Potência", valor: "7 kVA" },
      { rotulo: "Combustível", valor: "Gasolina" },
      { rotulo: "Ruído", valor: "52 dB" },
      { rotulo: "Arranque", valor: "Eléctrico" },
    ],
  },
  {
    id: "honda-em1800",
    nome: "Honda EM1800",
    marca: "Honda",
    ramo: "maquinas",
    categoria: "energia-electricidade",
    subcategoria: "geradores-industriais",
    resumo: "Gerador industrial · 18kVA",
    descricao: "Gerador industrial de alta potência para grandes obras.",
    precoDia: 900000,
    icone: "🏭",
    zona: "Cacuaco, Luanda",
    fichas: [
      { rotulo: "Potência", valor: "18 kVA" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Arranque", valor: "Automático" },
      { rotulo: "Depósito", valor: "100 L" },
    ],
  },
  {
    id: "cat-320",
    nome: "CAT 320 Escavadora",
    marca: "CAT",
    ramo: "maquinas",
    categoria: "construcao-civil",
    subcategoria: "escavadoras",
    resumo: "Escavadora · 20 ton",
    descricao: "Escavadora de rastos para movimentação de terras.",
    precoDia: 850000,
    icone: "🚜",
    zona: "Viana, Luanda",
    fichas: [
      { rotulo: "Peso", valor: "20 ton" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Operador", valor: "Incluído" },
      { rotulo: "Balde", valor: "1,2 m³" },
    ],
  },
  {
    id: "jcb-3cx",
    nome: "JCB 3CX",
    marca: "JCB",
    ramo: "maquinas",
    categoria: "construcao-civil",
    subcategoria: "retroescavadoras",
    resumo: "Retroescavadora",
    descricao: "Retroescavadora versátil para obras urbanas.",
    precoDia: 520000,
    icone: "🚧",
    zona: "Cacuaco, Luanda",
    fichas: [
      { rotulo: "Potência", valor: "74 kW" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Operador", valor: "Incluído" },
      { rotulo: "Tração", valor: "4x4" },
    ],
  },
  {
    id: "empilhador-toyota",
    nome: "Empilhador Toyota 2.5T",
    marca: "Toyota",
    ramo: "maquinas",
    categoria: "elevacao-movimentacao",
    subcategoria: "empilhadores",
    resumo: "Empilhador · 2,5 ton",
    descricao: "Empilhador a diesel para armazéns e logística.",
    precoDia: 210000,
    icone: "🛻",
    zona: "Zona Industrial, Viana",
    fichas: [
      { rotulo: "Capacidade", valor: "2,5 ton" },
      { rotulo: "Altura", valor: "4,5 m" },
      { rotulo: "Combustível", valor: "Diesel" },
      { rotulo: "Operador", valor: "Opcional" },
    ],
  },
];

export const marcasDe = (ramo: Ramo, categoria: string, subcategoria: string) =>
  Array.from(
    new Set(
      produtos
        .filter((p) => p.ramo === ramo && p.categoria === categoria && p.subcategoria === subcategoria)
        .map((p) => p.marca),
    ),
  );

export const categoriasDe = (ramo: Ramo) =>
  categorias.filter((c) => c.ramo === ramo && c.ativa).sort((a, b) => a.ordem - b.ordem);

export const categoriaPorSlug = (slug: string) => categorias.find((c) => c.slug === slug);

export const produtoPorId = (id: string) => produtos.find((p) => p.id === id);
