const app = document.getElementById("app");
const toast = document.getElementById("toast");
let heroAnimationFrame = 0;
let heroResizeHandler = null;
const API_BASE = window.LEADSCORE_API_BASE || (location.protocol === "file:" ? "http://127.0.0.1:4173" : "");

const LEGAL_SCORE =
  "O LeadScore Empresas utiliza dados públicos e sinais de mercado para gerar estimativas de potencial comercial. O sistema não exibe faturamento real declarado à Receita Federal. O score apresentado é uma análise estimada e não deve ser interpretado como informação fiscal, contábil ou financeira oficial.";
const LEGAL_CONTACT =
  "O LeadScore Empresas organiza contatos empresariais e informações públicas para fins de prospecção B2B. O sistema não promete telefone pessoal privado de sócios ou empresários. Telefones de responsáveis só devem ser exibidos quando estiverem disponíveis em fontes públicas, fornecidos pelo próprio titular, inseridos pelo usuário ou obtidos por base parceira com uso permitido.";
const LEGAL_USER =
  "O usuário é responsável por utilizar os dados de forma ética, respeitando LGPD, finalidade legítima, transparência, opt-out e boas práticas de comunicação comercial.";

const crmStages = [
  "Novo lead",
  "Contatado",
  "Respondeu",
  "Reunião marcada",
  "Proposta enviada",
  "Cliente fechado",
  "Perdido",
];

const plans = [
  {
    name: "Básico",
    price: "R$ 97",
    period: "/mês",
    description: "Para começar a prospectar com segmentação e score.",
    features: [
      "500 consultas mensais",
      "Filtros básicos",
      "Score de Potencial",
      "Score de Contato",
      "Exportação limitada",
      "1 usuário",
    ],
  },
  {
    name: "Pro",
    price: "R$ 197",
    period: "/mês",
    description: "Para times comerciais que precisam abordar e acompanhar.",
    featured: true,
    features: [
      "3.000 consultas mensais",
      "Exportação CSV",
      "Gerador de abordagem",
      "Listas salvas",
      "CRM simples",
      "Busca de WhatsApp comercial",
      "3 usuários",
    ],
  },
  {
    name: "Agência",
    price: "R$ 497",
    period: "/mês",
    description: "Para agências e operações recorrentes de prospecção.",
    features: [
      "15.000 consultas mensais",
      "Multiusuário",
      "CRM completo",
      "Exportação avançada",
      "Enriquecimento de dados",
      "Mensagens com IA",
      "Histórico de contato",
      "Integrações",
      "10 usuários",
    ],
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Para empresas com volume alto e integrações específicas.",
    features: [
      "Consultas personalizadas",
      "API",
      "Integração com CRM externo",
      "Onboarding",
      "Suporte prioritário",
      "Contrato sob medida",
    ],
  },
];

const offerLabels = {
  trafego: "tráfego pago",
  social: "social media",
  site: "site profissional",
  landing: "landing page",
  crm: "CRM",
  whatsapp: "automação de WhatsApp",
  consultoria: "consultoria",
  contabilidade: "contabilidade",
  energia: "energia solar",
  credito: "crédito empresarial",
  seguro: "seguro empresarial",
  maquina: "máquina de cartão",
  software: "software",
  cobranca: "cobrança",
  agencia: "agência de marketing",
};

const brazilStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const seedCompanies = [
  {
    id: "vita-campo",
    fantasia: "Clínica VitaCampo",
    razao: "VitaCampo Serviços Médicos Ltda",
    cnpj: "12.384.770/0001-91",
    cidade: "Campo Grande",
    estado: "MS",
    bairro: "Jardim dos Estados",
    cnae: "8630-5/03",
    cnaesSecundarios: "Atividades de estética e serviços de saúde complementar",
    segmento: "Clínicas",
    porte: "EPP",
    capital: 180000,
    abertura: "2017-04-18",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 2,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Antônio Maria Coelho, 1844",
    cep: "79020-210",
    telefone: "(67) 3321-4088",
    telefone2: "(67) 3028-1190",
    whatsapp: "(67) 99218-4401",
    email: "contato@vitacampo.com.br",
    site: "https://vitacampo.example",
    instagram: "@clinicavitacampo",
    facebook: "facebook.com/clinicavitacampo",
    linkedin: "linkedin.com/company/vitacampo",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Mariana Alves Duarte", qualificacao: "Sócia administradora" }],
    responsavelComercial: "Renata Paiva",
    telefoneResponsavelPublico: "(67) 99218-4401",
    fonteContato: "Site oficial e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-21",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Enviar WhatsApp consultivo",
    dono: "Ana Comercial",
    valorEstimado: 4200,
    oportunidade:
      "Clínica ativa, capital social consistente, presença digital incompleta e forte aderência para captação local por mídia paga e WhatsApp.",
  },
  {
    id: "legal-norte",
    fantasia: "Legal Norte Advocacia",
    razao: "Legal Norte Sociedade Individual de Advocacia",
    cnpj: "44.903.118/0001-26",
    cidade: "Campo Grande",
    estado: "MS",
    bairro: "Centro",
    cnae: "6911-7/01",
    cnaesSecundarios: "Consultoria jurídica empresarial",
    segmento: "Escritórios de advocacia",
    porte: "ME",
    capital: 60000,
    abertura: "2020-08-02",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Simples Limitada",
    endereco: "Avenida Afonso Pena, 2560",
    cep: "79002-073",
    telefone: "(67) 3042-6500",
    telefone2: "",
    whatsapp: "(67) 99640-7702",
    email: "atendimento@legalnorte.example",
    site: "",
    instagram: "@legalnorte.adv",
    facebook: "facebook.com/legalnorteadv",
    linkedin: "linkedin.com/company/legal-norte",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Gustavo Henrique Leal", qualificacao: "Titular administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Google Maps e Instagram",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-19",
    status: "Contatado",
    ultimaInteracao: "WhatsApp enviado há 2 dias",
    proximaAcao: "Follow-up com análise de presença digital",
    dono: "Bruno SDR",
    valorEstimado: 2500,
    oportunidade:
      "Escritório com bom contato comercial, mas sem site aparente. Oportunidade para página institucional, SEO local e automação de captação.",
  },
  {
    id: "bella-forma",
    fantasia: "Bella Forma Estética",
    razao: "Bella Forma Estética Avançada Ltda",
    cnpj: "28.118.504/0001-07",
    cidade: "Dourados",
    estado: "MS",
    bairro: "Vila Planalto",
    cnae: "9602-5/02",
    cnaesSecundarios: "Comércio varejista de cosméticos",
    segmento: "Empresas de estética",
    porte: "ME",
    capital: 45000,
    abertura: "2023-01-10",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua João Rosa Góes, 911",
    cep: "79804-020",
    telefone: "(67) 3422-9011",
    telefone2: "",
    whatsapp: "(67) 99120-3322",
    email: "agenda@bellaforma.example",
    site: "",
    instagram: "@bellaforma.dourados",
    facebook: "",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Patrícia Neves Lima", qualificacao: "Sócia administradora" }],
    responsavelComercial: "Patrícia Neves Lima",
    telefoneResponsavelPublico: "(67) 99120-3322",
    fonteContato: "Instagram e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-25",
    status: "Respondeu",
    ultimaInteracao: "Solicitou proposta",
    proximaAcao: "Enviar plano de campanhas locais",
    dono: "Ana Comercial",
    valorEstimado: 3300,
    oportunidade:
      "Segmento visual, canal de WhatsApp ativo e Instagram com sinais de venda. Pode contratar tráfego pago, landing page e automação.",
  },
  {
    id: "contab-prime",
    fantasia: "Contab Prime",
    razao: "Contab Prime Assessoria Contábil Ltda",
    cnpj: "31.220.781/0001-64",
    cidade: "Três Lagoas",
    estado: "MS",
    bairro: "Centro",
    cnae: "6920-6/01",
    cnaesSecundarios: "Consultoria em gestão empresarial",
    segmento: "Contabilidades",
    porte: "EPP",
    capital: 135000,
    abertura: "2014-09-14",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 1,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Paranaíba, 330",
    cep: "79601-020",
    telefone: "(67) 3521-6002",
    telefone2: "(67) 3522-4121",
    whatsapp: "",
    email: "comercial@contabprime.example",
    site: "https://contabprime.example",
    instagram: "@contabprime",
    facebook: "facebook.com/contabprime",
    linkedin: "linkedin.com/company/contab-prime",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Rogério Martins Costa", qualificacao: "Sócio administrador" }],
    responsavelComercial: "Larissa Mota",
    telefoneResponsavelPublico: "",
    fonteContato: "CNPJ e site oficial",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-18",
    status: "Reunião marcada",
    ultimaInteracao: "Reunião agendada para 01/07",
    proximaAcao: "Preparar diagnóstico de CRM",
    dono: "Bruno SDR",
    valorEstimado: 5200,
    oportunidade:
      "Empresa madura, com capital social relevante e site ativo. Boa aderência para CRM, automação de WhatsApp e aquisição B2B.",
  },
  {
    id: "casa-nova",
    fantasia: "CasaNova Imóveis",
    razao: "CasaNova Negócios Imobiliários Ltda",
    cnpj: "17.904.252/0001-88",
    cidade: "Cuiabá",
    estado: "MT",
    bairro: "Jardim Aclimação",
    cnae: "6821-8/01",
    cnaesSecundarios: "Corretagem na compra e venda de imóveis",
    segmento: "Imobiliárias",
    porte: "EPP",
    capital: 220000,
    abertura: "2011-03-28",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 3,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Avenida Historiador Rubens de Mendonça, 1455",
    cep: "78050-000",
    telefone: "(65) 3054-7710",
    telefone2: "(65) 3623-8900",
    whatsapp: "(65) 99918-0021",
    email: "vendas@casanovaimoveis.example",
    site: "https://casanovaimoveis.example",
    instagram: "@casanovaimoveis",
    facebook: "facebook.com/casanovaimoveis",
    linkedin: "linkedin.com/company/casanova-imoveis",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Cláudia Torres Ribeiro", qualificacao: "Sócia administradora" }],
    responsavelComercial: "Equipe Comercial CasaNova",
    telefoneResponsavelPublico: "(65) 99918-0021",
    fonteContato: "Site oficial e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-24",
    status: "Proposta enviada",
    ultimaInteracao: "Proposta de CRM enviada",
    proximaAcao: "Follow-up com gestor comercial",
    dono: "Carla Hunter",
    valorEstimado: 7800,
    oportunidade:
      "Operação com múltiplos canais e filiais. Potencial para CRM, automação de atendimento e qualificação de leads imobiliários.",
  },
  {
    id: "escola-horizonte",
    fantasia: "Escola Horizonte",
    razao: "Horizonte Ensino Fundamental Ltda",
    cnpj: "08.223.670/0001-33",
    cidade: "Rondonópolis",
    estado: "MT",
    bairro: "Vila Aurora",
    cnae: "8513-9/00",
    cnaesSecundarios: "Educação infantil e cursos livres",
    segmento: "Escolas",
    porte: "Demais",
    capital: 350000,
    abertura: "2008-02-05",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 1,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Rio Branco, 730",
    cep: "78700-180",
    telefone: "(66) 3421-3310",
    telefone2: "",
    whatsapp: "",
    email: "secretaria@escolahorizonte.example",
    site: "https://escolahorizonte.example",
    instagram: "@escolahorizonte",
    facebook: "facebook.com/escolahorizonte",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Helena Matos Bittencourt", qualificacao: "Diretora administradora" }],
    responsavelComercial: "Secretaria escolar",
    telefoneResponsavelPublico: "",
    fonteContato: "Site oficial",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-20",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Ligar para secretaria",
    dono: "Carla Hunter",
    valorEstimado: 6100,
    oportunidade:
      "Empresa estabelecida, com presença digital básica. Oportunidade para campanha de matrículas, landing page e atendimento por WhatsApp.",
  },
  {
    id: "oficina-turbo",
    fantasia: "Oficina TurboCar",
    razao: "TurboCar Manutenção Automotiva Ltda",
    cnpj: "52.901.774/0001-10",
    cidade: "Campo Grande",
    estado: "MS",
    bairro: "Vila Sobrinho",
    cnae: "4520-0/01",
    cnaesSecundarios: "Comércio varejista de peças automotivas",
    segmento: "Oficinas",
    porte: "ME",
    capital: 25000,
    abertura: "2024-12-03",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Ceará, 212",
    cep: "79003-010",
    telefone: "(67) 3027-7400",
    telefone2: "",
    whatsapp: "(67) 98444-3001",
    email: "",
    site: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Diego Fernandes Rocha", qualificacao: "Sócio administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Google Maps",
    fonteOficial: true,
    contatoValidado: false,
    lastVerified: "2026-05-05",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Validar telefone antes da abordagem",
    dono: "Ana Comercial",
    valorEstimado: 1800,
    oportunidade:
      "Empresa recente, com telefone comercial e sem presença digital aparente. Boa oportunidade para oferta de site simples, Google Maps e WhatsApp.",
  },
  {
    id: "solar-max",
    fantasia: "SolarMax Energia",
    razao: "SolarMax Projetos de Energia Ltda",
    cnpj: "23.001.590/0001-75",
    cidade: "Cuiabá",
    estado: "MT",
    bairro: "Bosque da Saúde",
    cnae: "4321-5/00",
    cnaesSecundarios: "Instalação e manutenção elétrica",
    segmento: "Empresas de energia solar",
    porte: "EPP",
    capital: 480000,
    abertura: "2016-11-11",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 4,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Avenida Miguel Sutil, 3420",
    cep: "78048-000",
    telefone: "(65) 3025-8110",
    telefone2: "(65) 3025-8111",
    whatsapp: "(65) 99677-5010",
    email: "comercial@solarmax.example",
    site: "https://solarmaxenergia.example",
    instagram: "@solarmaxenergia",
    facebook: "facebook.com/solarmaxenergia",
    linkedin: "linkedin.com/company/solarmaxenergia",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Eduardo Nascimento Vieira", qualificacao: "Sócio administrador" }],
    responsavelComercial: "Paulo Andrade",
    telefoneResponsavelPublico: "(65) 99677-5010",
    fonteContato: "Site oficial, CNPJ e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-26",
    status: "Cliente fechado",
    ultimaInteracao: "Contrato assinado",
    proximaAcao: "Onboarding",
    dono: "Carla Hunter",
    valorEstimado: 12000,
    oportunidade:
      "Empresa com alto capital social, várias filiais e canais de contato fortes. Potencial alto para mídia paga, CRM e automação comercial.",
  },
  {
    id: "nexa-tech",
    fantasia: "NexaTech Software",
    razao: "NexaTech Soluções Digitais Ltda",
    cnpj: "39.882.108/0001-32",
    cidade: "São Paulo",
    estado: "SP",
    bairro: "Pinheiros",
    cnae: "6201-5/01",
    cnaesSecundarios: "Desenvolvimento de programas sob encomenda",
    segmento: "Empresas de tecnologia",
    porte: "Demais",
    capital: 750000,
    abertura: "2019-06-17",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 2,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua dos Pinheiros, 870",
    cep: "05422-001",
    telefone: "(11) 3042-1188",
    telefone2: "",
    whatsapp: "(11) 95880-4410",
    email: "growth@nexatech.example",
    site: "https://nexatech.example",
    instagram: "@nexatech.software",
    facebook: "",
    linkedin: "linkedin.com/company/nexatech-software",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Rafael Sampaio Koga", qualificacao: "Sócio administrador" }],
    responsavelComercial: "Camila Nery",
    telefoneResponsavelPublico: "",
    fonteContato: "LinkedIn, site oficial e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-22",
    status: "Proposta enviada",
    ultimaInteracao: "Reunião de diagnóstico realizada",
    proximaAcao: "Enviar proposta revisada",
    dono: "Bruno SDR",
    valorEstimado: 18500,
    oportunidade:
      "Empresa B2B de tecnologia com estrutura comercial provável. Boa fit para prospecção outbound, CRM e automações multicanal.",
  },
  {
    id: "sabor-raiz",
    fantasia: "Sabor Raiz Restaurante",
    razao: "Sabor Raiz Alimentação Ltda",
    cnpj: "40.775.600/0001-05",
    cidade: "Dourados",
    estado: "MS",
    bairro: "Centro",
    cnae: "5611-2/01",
    cnaesSecundarios: "Serviços de alimentação para eventos",
    segmento: "Restaurantes",
    porte: "ME",
    capital: 30000,
    abertura: "2025-02-07",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Avenida Marcelino Pires, 1770",
    cep: "79801-001",
    telefone: "(67) 3423-9912",
    telefone2: "",
    whatsapp: "(67) 99290-1200",
    email: "",
    site: "",
    instagram: "@saborraiz.dourados",
    facebook: "facebook.com/saborraizdourados",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "João Pedro Martins", qualificacao: "Sócio administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Instagram e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-16",
    status: "Contatado",
    ultimaInteracao: "Ligação sem retorno",
    proximaAcao: "Enviar abordagem curta por WhatsApp",
    dono: "Ana Comercial",
    valorEstimado: 2100,
    oportunidade:
      "Boa presença em redes sociais e WhatsApp comercial, mas sem site ou e-mail. Oferta indicada: cardápio digital e campanhas locais.",
  },
  {
    id: "pantanal-build",
    fantasia: "Construtora Pantanal",
    razao: "Pantanal Construções e Engenharia Ltda",
    cnpj: "11.002.440/0001-50",
    cidade: "Campo Grande",
    estado: "MS",
    bairro: "Chácara Cachoeira",
    cnae: "4120-4/00",
    cnaesSecundarios: "Serviços de engenharia",
    segmento: "Construtoras",
    porte: "Demais",
    capital: 1200000,
    abertura: "2006-05-22",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 5,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua da Paz, 1210",
    cep: "79040-230",
    telefone: "(67) 3326-8800",
    telefone2: "(67) 3326-8811",
    whatsapp: "",
    email: "projetos@pantanalbuild.example",
    site: "https://pantanalbuild.example",
    instagram: "",
    facebook: "",
    linkedin: "linkedin.com/company/pantanal-build",
    googleMaps: "Google Business Profile verificado",
    socios: [{ nome: "Alberto Senna Prado", qualificacao: "Sócio administrador" }],
    responsavelComercial: "Departamento de Projetos",
    telefoneResponsavelPublico: "",
    fonteContato: "CNPJ e site oficial",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-13",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "E-mail consultivo para diretoria",
    dono: "Carla Hunter",
    valorEstimado: 22000,
    oportunidade:
      "Alto potencial econômico estimado, empresa madura e capital social elevado. Abordagem ideal por e-mail corporativo e LinkedIn.",
  },
  {
    id: "move-academia",
    fantasia: "Move+ Academia",
    razao: "Move Mais Atividades Físicas Ltda",
    cnpj: "47.338.880/0001-89",
    cidade: "Rondonópolis",
    estado: "MT",
    bairro: "Centro",
    cnae: "9313-1/00",
    cnaesSecundarios: "Treinamento funcional e comércio de suplementos",
    segmento: "Academias",
    porte: "ME",
    capital: 70000,
    abertura: "2022-10-12",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Avenida Amazonas, 505",
    cep: "78700-210",
    telefone: "(66) 3422-5509",
    telefone2: "",
    whatsapp: "(66) 99931-8820",
    email: "contato@movemais.example",
    site: "",
    instagram: "@movemaisacademia",
    facebook: "facebook.com/movemaisacademia",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Fernanda Pacheco Azevedo", qualificacao: "Sócia administradora" }],
    responsavelComercial: "Fernanda Pacheco Azevedo",
    telefoneResponsavelPublico: "(66) 99931-8820",
    fonteContato: "Instagram e Google Maps",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-23",
    status: "Reunião marcada",
    ultimaInteracao: "Aceitou call de 20 minutos",
    proximaAcao: "Apresentar campanha de matrícula",
    dono: "Ana Comercial",
    valorEstimado: 3600,
    oportunidade:
      "Academia com WhatsApp e Instagram ativos. Potencial para anúncios locais, captação de planos e automação de reativação.",
  },
  {
    id: "credito-agil",
    fantasia: "Crédito Ágil PJ",
    razao: "Crédito Ágil Intermediação de Negócios Ltda",
    cnpj: "35.009.741/0001-14",
    cidade: "São Paulo",
    estado: "SP",
    bairro: "Vila Olímpia",
    cnae: "6619-3/02",
    cnaesSecundarios: "Correspondentes de instituições financeiras",
    segmento: "Empresas de crédito PJ",
    porte: "EPP",
    capital: 510000,
    abertura: "2018-01-19",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 2,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Gomes de Carvalho, 1507",
    cep: "04547-005",
    telefone: "(11) 4002-9090",
    telefone2: "",
    whatsapp: "(11) 94999-2800",
    email: "parcerias@creditoagilpj.example",
    site: "https://creditoagilpj.example",
    instagram: "@creditoagilpj",
    facebook: "",
    linkedin: "linkedin.com/company/credito-agil-pj",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Silvia Gomes Andrade", qualificacao: "Sócia administradora" }],
    responsavelComercial: "Time de Parcerias",
    telefoneResponsavelPublico: "(11) 94999-2800",
    fonteContato: "Site oficial e LinkedIn",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-26",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Abordar parceria via LinkedIn",
    dono: "Bruno SDR",
    valorEstimado: 15000,
    oportunidade:
      "Empresa com canais fortes e operação B2B. Alta aderência para campanhas de aquisição, landing pages e CRM de parceiros.",
  },
  {
    id: "segura-corp",
    fantasia: "SeguraCorp",
    razao: "SeguraCorp Corretora de Seguros Ltda",
    cnpj: "21.774.002/0001-45",
    cidade: "Campo Grande",
    estado: "MS",
    bairro: "Santa Fé",
    cnae: "6622-3/00",
    cnaesSecundarios: "Consultoria em seguros empresariais",
    segmento: "Seguros empresariais",
    porte: "ME",
    capital: 90000,
    abertura: "2015-07-09",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Euclides da Cunha, 840",
    cep: "79021-170",
    telefone: "",
    telefone2: "",
    whatsapp: "",
    email: "atendimento@seguracorp.example",
    site: "https://seguracorp.example",
    instagram: "",
    facebook: "",
    linkedin: "linkedin.com/company/seguracorp",
    googleMaps: "",
    socios: [{ nome: "Marcelo Viana Lopes", qualificacao: "Sócio administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Site oficial",
    fonteOficial: true,
    contatoValidado: false,
    lastVerified: "2026-03-28",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Validar canal por e-mail",
    dono: "Carla Hunter",
    valorEstimado: 4800,
    oportunidade:
      "Possui e-mail e site, mas telefone não localizado. Pode ser priorizada para abordagem por e-mail e LinkedIn.",
  },
  {
    id: "agrovet-shop",
    fantasia: "AgroVet Shop",
    razao: "AgroVet Comércio de Produtos Agropecuários Ltda",
    cnpj: "18.450.310/0001-61",
    cidade: "Dourados",
    estado: "MS",
    bairro: "Jardim Água Boa",
    cnae: "4771-7/04",
    cnaesSecundarios: "Comércio varejista de produtos veterinários",
    segmento: "Lojas",
    porte: "ME",
    capital: 18000,
    abertura: "2026-03-05",
    situacao: "Ativa",
    matriz: "Matriz",
    filiais: 0,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Hayel Bon Faker, 4040",
    cep: "79813-000",
    telefone: "(67) 3427-7721",
    telefone2: "",
    whatsapp: "",
    email: "",
    site: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    googleMaps: "",
    socios: [{ nome: "Márcio Souza Ferraz", qualificacao: "Sócio administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "CNPJ",
    fonteOficial: true,
    contatoValidado: false,
    lastVerified: "2026-04-12",
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Validar telefone e sugerir presença digital",
    dono: "Ana Comercial",
    valorEstimado: 1600,
    oportunidade:
      "Empresa nova, contato básico e sem presença digital aparente. Pode ser oportunidade para agência local, com validação prévia.",
  },
  {
    id: "alpha-odonto",
    fantasia: "Alpha Odonto",
    razao: "Alpha Odonto Serviços Odontológicos Ltda",
    cnpj: "29.114.771/0001-62",
    cidade: "Cuiabá",
    estado: "MT",
    bairro: "Duque de Caxias",
    cnae: "8630-5/04",
    cnaesSecundarios: "Atividade odontológica e estética facial",
    segmento: "Clínicas",
    porte: "EPP",
    capital: 145000,
    abertura: "2018-09-24",
    situacao: "Ativa",
    matriz: "Filial",
    filiais: 2,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua Estevão de Mendonça, 980",
    cep: "78043-405",
    telefone: "(65) 3051-2220",
    telefone2: "",
    whatsapp: "(65) 99230-7704",
    email: "contato@alphaodonto.example",
    site: "https://alphaodonto.example",
    instagram: "@alphaodonto.cba",
    facebook: "facebook.com/alphaodontocba",
    linkedin: "",
    googleMaps: "Perfil no Google Maps",
    socios: [{ nome: "Lívia Moura Prado", qualificacao: "Administradora" }],
    responsavelComercial: "Atendimento Alpha Odonto",
    telefoneResponsavelPublico: "(65) 99230-7704",
    fonteContato: "Google Maps, site oficial e Instagram",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: "2026-06-22",
    status: "Respondeu",
    ultimaInteracao: "Pediu exemplos de campanhas",
    proximaAcao: "Enviar estudo de caso",
    dono: "Carla Hunter",
    valorEstimado: 4600,
    oportunidade:
      "Clínica com estrutura comercial provável e canais fortes. Boa prioridade para campanhas de agendamento e remarketing.",
  },
  {
    id: "prime-maquinas",
    fantasia: "Prime Máquinas",
    razao: "Prime Máquinas e Equipamentos Ltda",
    cnpj: "50.784.991/0001-27",
    cidade: "São Paulo",
    estado: "SP",
    bairro: "Mooca",
    cnae: "4663-0/00",
    cnaesSecundarios: "Manutenção de máquinas industriais",
    segmento: "Serviços profissionais",
    porte: "EPP",
    capital: 260000,
    abertura: "2013-12-01",
    situacao: "Suspensa",
    matriz: "Matriz",
    filiais: 1,
    natureza: "Sociedade Empresária Limitada",
    endereco: "Rua da Mooca, 3100",
    cep: "03165-000",
    telefone: "(11) 2695-4431",
    telefone2: "",
    whatsapp: "",
    email: "contato@primemaquinas.example",
    site: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    googleMaps: "",
    socios: [{ nome: "Otávio Ramos Telles", qualificacao: "Sócio administrador" }],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Base parceira com uso permitido",
    fonteOficial: false,
    contatoValidado: false,
    contatoAntigo: true,
    lastVerified: "2025-11-14",
    status: "Perdido",
    ultimaInteracao: "Lead pausado por situação cadastral",
    proximaAcao: "Revisar em nova verificação",
    dono: "Bruno SDR",
    valorEstimado: 0,
    oportunidade:
      "Situação cadastral suspensa reduz a prioridade. Manter em observação e validar antes de qualquer ação comercial.",
  },
];

const highPotentialSegments = [
  "Clínicas",
  "Empresas de estética",
  "Contabilidades",
  "Imobiliárias",
  "Empresas de energia solar",
  "Empresas de tecnologia",
  "Construtoras",
  "Academias",
  "Empresas de crédito PJ",
  "Seguros empresariais",
  "Serviços profissionais",
];

const lowPotentialSegments = ["Restaurantes"];

const state = {
  companies: seedCompanies.map(enrichCompany),
  resultIds: [],
  filters: {},
  sort: "final",
  api: {
    checked: false,
    connected: false,
    status: null,
    config: null,
    error: "",
  },
  generatedMessages: {},
  savedLists: [
    {
      id: "clinicas-campo-grande",
      nome: "Clínicas em Campo Grande",
      ids: ["vita-campo"],
      createdAt: "2026-06-27",
      filters: "Cidade: Campo Grande, Segmento: Clínicas",
    },
    {
      id: "sem-site",
      nome: "Empresas sem site",
      ids: ["legal-norte", "bella-forma", "oficina-turbo", "sabor-raiz", "agrovet-shop"],
      createdAt: "2026-06-27",
      filters: "Sem site, com contato comercial",
    },
    {
      id: "score-80",
      nome: "Score Final acima de 80",
      ids: ["solar-max", "nexa-tech", "casa-nova", "pantanal-build", "credito-agil"],
      createdAt: "2026-06-27",
      filters: "Score Final >= 80",
    },
  ],
  history: [
    "Empresas de estética em Dourados com WhatsApp",
    "CNAE 8630 em Campo Grande",
    "Capital social acima de R$ 100 mil em MT",
    "Empresas sem presença digital aparente",
  ],
};

state.resultIds = state.companies.map((company) => company.id);

window.addEventListener("hashchange", render);
document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("change", handleChange);
document.addEventListener("dragstart", handleDragStart);
document.addEventListener("dragover", handleDragOver);
document.addEventListener("drop", handleDrop);

render();
bootstrapApi();

async function bootstrapApi() {
  try {
    const [health, config] = await Promise.all([apiRequest("/api/health"), apiRequest("/api/config")]);
    state.api = {
      checked: true,
      connected: true,
      status: health,
      config,
      error: "",
    };
    render();
  } catch (error) {
    state.api = {
      checked: true,
      connected: false,
      status: null,
      config: null,
      error: error.message || "Backend indisponível",
    };
  }
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 8000);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || `Falha na API ${path}`);
  }
  return data;
}

async function apiSearchCompanies(filters) {
  return apiRequest("/api/leads/search", {
    method: "POST",
    body: JSON.stringify({ filters }),
  });
}

async function apiLookupCnpj(cnpj) {
  return apiRequest(`/api/cnpj/${cleanPhone(cnpj)}`);
}

async function apiGenerateMessage(company, channel, offer) {
  return apiRequest("/api/approach/generate", {
    method: "POST",
    timeout: 18000,
    body: JSON.stringify({ company, channel, offer }),
  });
}

async function apiSyncCrm(leads) {
  return apiRequest("/api/crm/sync", {
    method: "POST",
    body: JSON.stringify({ leads }),
  });
}

async function apiPrepareWhatsapp(company, message = "") {
  return apiRequest("/api/whatsapp/contact", {
    method: "POST",
    body: JSON.stringify({ company, phone: company?.whatsapp || company?.telefone, message }),
  });
}

async function apiSaveStatus(company) {
  if (!state.api.connected) return;
  try {
    await apiRequest("/api/runtime/status", {
      method: "POST",
      body: JSON.stringify({ id: company.id, cnpj: company.cnpj, status: company.status }),
    });
  } catch {
    // Status local continua funcionando mesmo sem persistência remota.
  }
}

async function apiEnrichContacts(company) {
  return apiRequest("/api/contacts/enrich", {
    method: "POST",
    body: JSON.stringify({ company }),
  });
}

function enrichCompany(company) {
  const next = normalizeIncomingCompany(company);
  next.idadeMeses = monthsSince(next.abertura);
  next.tempoMercado = formatCompanyAge(next.idadeMeses);
  next.presencaDigital = Boolean(next.site || next.instagram || next.facebook || next.linkedin || next.googleMaps);
  next.scoreContato = calcContactScore(next);
  next.scorePotencial = calcPotentialScore(next);
  next.scoreFinal = Math.round(next.scorePotencial * 0.6 + next.scoreContato * 0.4);
  next.classContato = contactClass(next.scoreContato);
  next.classPotencial = potentialClass(next.scorePotencial);
  next.classFinal = finalClass(next.scoreFinal);
  next.acaoRecomendada = recommendedAction(next);
  next.mensagemSugerida = makeMessage(next, "whatsapp", "trafego");
  next.contatos = makeContacts(next);
  next.sinaisPositivos = [
    next.situacao === "Ativa" ? "Empresa ativa" : "",
    next.capital >= 100000 ? "Capital social acima de R$ 100 mil" : "",
    next.idadeMeses >= 60 ? "Mais de 5 anos de mercado" : "",
    next.site ? "Site oficial localizado" : "",
    next.instagram ? "Instagram empresarial localizado" : "",
    next.whatsapp ? "WhatsApp comercial disponível" : "",
    next.email ? "E-mail empresarial disponível" : "",
    next.filiais > 1 ? "Possui mais de uma filial" : "",
  ].filter(Boolean).length;
  return next;
}

function monthsSince(dateText) {
  if (!dateText) return 0;
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  const now = new Date("2026-06-27T00:00:00");
  return Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth());
}

function formatCompanyAge(months) {
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} anos e ${rest} meses` : `${years} anos`;
}

function normalizeIncomingCompany(company = {}) {
  const safe = { ...company };
  const idSource = safe.id || safe.cnpj || safe.razao || safe.fantasia || `lead-${Date.now()}`;
  return {
    id: String(idSource).replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `lead-${Date.now()}`,
    fantasia: safe.fantasia || safe.nomeFantasia || safe.name || safe.razao || "Empresa localizada",
    razao: safe.razao || safe.razaoSocial || safe.razao_social || safe.fantasia || "Razão social não informada",
    cnpj: safe.cnpj || "",
    cidade: safe.cidade || safe.city || "",
    estado: safe.estado || safe.uf || safe.state || "",
    bairro: safe.bairro || "",
    cnae: safe.cnae || safe.cnaePrincipal || "",
    cnaesSecundarios: safe.cnaesSecundarios || safe.secondaryCnaes || "",
    segmento: safe.segmento || safe.segment || safe.cnaeDescricao || "Segmento CNPJ",
    porte: safe.porte || safe.size || "Não informado",
    capital: Number(safe.capital || safe.capitalSocial || 0),
    abertura: safe.abertura || safe.dataAbertura || "",
    situacao: safe.situacao || safe.situacaoCadastral || "Ativa",
    matriz: safe.matriz || safe.matrizFilial || "Matriz",
    filiais: Number(safe.filiais || 0),
    natureza: safe.natureza || safe.naturezaJuridica || "",
    endereco: safe.endereco || "",
    cep: safe.cep || "",
    telefone: safe.telefone || safe.phone || "",
    telefone2: safe.telefone2 || safe.phone2 || "",
    whatsapp: safe.whatsapp || "",
    email: safe.email || "",
    site: safe.site || safe.website || "",
    instagram: safe.instagram || "",
    facebook: safe.facebook || "",
    linkedin: safe.linkedin || "",
    googleMaps: safe.googleMaps || safe.maps || "",
    socios: Array.isArray(safe.socios) ? safe.socios : [],
    responsavelComercial: safe.responsavelComercial || "",
    telefoneResponsavelPublico: safe.telefoneResponsavelPublico || "",
    fonteContato: safe.fonteContato || safe.source || "API configurada",
    fonteOficial: safe.fonteOficial ?? true,
    contatoValidado: safe.contatoValidado ?? true,
    contatoAntigo: Boolean(safe.contatoAntigo),
    telefoneDuplicadoInvalido: Boolean(safe.telefoneDuplicadoInvalido),
    lastVerified: safe.lastVerified || new Date().toISOString().slice(0, 10),
    status: safe.status || "Novo lead",
    ultimaInteracao: safe.ultimaInteracao || "Sem contato",
    proximaAcao: safe.proximaAcao || "Validar contatos e priorizar abordagem",
    dono: safe.dono || "Equipe Comercial",
    valorEstimado: Number(safe.valorEstimado || 0),
    oportunidade: safe.oportunidade || safe.analiseOportunidade || "Empresa localizada via API. Enriquecer contatos e presença digital antes da abordagem.",
  };
}

function calcContactScore(company) {
  let score = 0;
  if (company.telefone) score += 20;
  else score -= 30;
  if (company.whatsapp) score += 25;
  else score -= 10;
  if (company.email) score += 15;
  else score -= 10;
  if (company.site) score += 10;
  if (company.instagram) score += 10;
  if (company.socios?.length) score += 15;
  if (company.responsavelComercial) score += 10;
  if (company.contatoValidado) score += 10;
  if (company.fonteOficial) score += 15;
  const channels = [company.telefone, company.telefone2, company.whatsapp, company.email, company.site, company.instagram].filter(Boolean).length;
  if (channels > 1) score += 10;
  if (!company.fonteOficial) score -= 20;
  if (company.contatoAntigo) score -= 10;
  if (company.telefoneDuplicadoInvalido) score -= 15;
  return clamp(score);
}

function calcPotentialScore(company) {
  let score = 0;
  if (company.situacao === "Ativa") score += 15;
  else score -= 40;
  if (company.capital > 100000) score += 15;
  else if (company.capital > 50000) score += 10;
  else if (company.capital < 30000) score -= 10;
  if (company.idadeMeses > 60) score += 15;
  else if (company.idadeMeses > 24) score += 10;
  else if (company.idadeMeses < 6) score -= 10;
  if (company.porte === "ME") score += 8;
  if (company.porte === "EPP") score += 12;
  if (company.porte === "Demais") score += 15;
  if (company.telefone) score += 8;
  if (company.email) score += 8;
  if (company.site) score += 10;
  if (company.instagram) score += 8;
  if (highPotentialSegments.includes(company.segmento)) score += 15;
  if (company.matriz === "Matriz") score += 5;
  if (company.filiais > 1) score += 10;
  if (!company.telefone && !company.email) score -= 15;
  if (lowPotentialSegments.includes(company.segmento)) score -= 10;
  if (!company.presencaDigital) score -= 5;
  return clamp(score);
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreLevel(score) {
  if (score >= 71) return "high";
  if (score >= 41) return "mid";
  return "low";
}

function contactClass(score) {
  if (score >= 71) return "contato forte";
  if (score >= 41) return "contato médio";
  return "contato fraco";
}

function potentialClass(score) {
  if (score >= 71) return "alto potencial";
  if (score >= 41) return "médio potencial";
  return "baixo potencial";
}

function finalClass(score) {
  if (score >= 71) return "lead quente";
  if (score >= 41) return "lead morno";
  return "lead frio";
}

function trustBySource(source, fallback = "Média confiança") {
  const high = ["CNPJ", "Site oficial", "Página de contato oficial", "Google Maps", "Google Business Profile", "WhatsApp oficial"];
  if (high.some((item) => source.includes(item))) return "Alta confiança";
  const mid = ["Instagram", "Facebook", "LinkedIn", "Catálogo", "Cartão digital"];
  if (mid.some((item) => source.includes(item))) return "Média confiança";
  return fallback;
}

function makeContacts(company) {
  const contacts = [];
  if (company.telefone) {
    contacts.push({
      tipo: "Telefone da empresa",
      valor: company.telefone,
      fonte: company.fonteContato.includes("CNPJ") ? "Dados públicos do CNPJ" : company.googleMaps ? "Google Maps" : "Site oficial",
      confianca: company.fonteOficial ? "Alta confiança" : "Média confiança",
      verificado: company.lastVerified,
      categoria: "Empresa",
    });
  }
  if (company.telefone2) {
    contacts.push({
      tipo: "Telefone secundário da empresa",
      valor: company.telefone2,
      fonte: "Dados públicos do CNPJ",
      confianca: "Alta confiança",
      verificado: company.lastVerified,
      categoria: "Empresa",
    });
  }
  if (company.whatsapp) {
    contacts.push({
      tipo: "WhatsApp comercial",
      valor: company.whatsapp,
      fonte: company.site ? "Site oficial" : company.instagram ? "Instagram da empresa" : "Google Maps",
      confianca: company.site || company.googleMaps ? "Alta confiança" : "Média confiança",
      verificado: company.lastVerified,
      categoria: "WhatsApp comercial",
    });
  }
  if (company.email) {
    contacts.push({
      tipo: "E-mail empresarial",
      valor: company.email,
      fonte: company.site ? "Site oficial" : "Dados públicos do CNPJ",
      confianca: company.site ? "Alta confiança" : "Média confiança",
      verificado: company.lastVerified,
      categoria: "E-mail",
    });
  }
  if (company.site) {
    contacts.push({
      tipo: "Site oficial",
      valor: company.site,
      fonte: "Site oficial da empresa",
      confianca: "Alta confiança",
      verificado: company.lastVerified,
      categoria: "Empresa",
    });
  }
  if (company.instagram) {
    contacts.push({
      tipo: "Instagram da empresa",
      valor: company.instagram,
      fonte: "Instagram da empresa",
      confianca: "Média confiança",
      verificado: company.lastVerified,
      categoria: "Empresa",
    });
  }
  company.socios.forEach((socio) => {
    contacts.push({
      tipo: "Nome do sócio/administrador",
      valor: `${socio.nome} (${socio.qualificacao})`,
      fonte: "Dados públicos do CNPJ",
      confianca: "Alta confiança",
      verificado: company.lastVerified,
      categoria: "Responsável público",
    });
  });
  if (company.responsavelComercial) {
    contacts.push({
      tipo: "Possível responsável comercial",
      valor: company.responsavelComercial,
      fonte: company.site ? "Site oficial" : company.instagram ? "Instagram da empresa" : "Dado público vinculado à empresa",
      confianca: trustBySource(company.fonteContato),
      verificado: company.lastVerified,
      categoria: "Responsável público",
    });
  }
  if (company.telefoneResponsavelPublico) {
    contacts.push({
      tipo: "Telefone público do responsável",
      valor: company.telefoneResponsavelPublico,
      fonte: company.site ? "Site oficial" : company.instagram ? "Instagram da empresa" : "Fonte pública vinculada à empresa",
      confianca: company.site ? "Alta confiança" : "Média confiança",
      verificado: company.lastVerified,
      categoria: "Responsável público",
    });
  }
  return contacts;
}

function recommendedAction(company) {
  if (company.situacao !== "Ativa") return "Não priorizar antes de nova verificação cadastral";
  if (!company.telefone && company.email) return "Abordar por e-mail empresarial e validar telefone";
  if (company.whatsapp && company.scoreFinal >= 71) return "Abordar primeiro por WhatsApp comercial";
  if (!company.presencaDigital) return "Oferecer presença digital básica e validação de Google Maps";
  if (!company.site) return "Oferecer site, landing page e captação local";
  if (company.linkedin) return "Abordar por e-mail e LinkedIn";
  return "Enviar mensagem consultiva e acompanhar no CRM";
}

function routeInfo() {
  const rawHash = location.hash.replace(/^#\/?/, "") || "landing";
  const [withoutAnchor, anchor] = rawHash.split("#");
  const [path] = withoutAnchor.split("?");
  const [route, id] = path.split("/");
  return { route, id, anchor };
}

function render() {
  document.body.classList.remove("menu-open");
  const { route, id, anchor } = routeInfo();
  if (["landing", "login", "cadastro", "privacidade", "termos"].includes(route)) {
    app.innerHTML = renderPublic(route, id);
  } else {
    app.innerHTML = renderShell(route, id);
  }
  afterRender(route, id, anchor);
}

function renderPublic(route) {
  const view = {
    landing: renderLanding,
    login: renderLogin,
    cadastro: renderSignup,
    privacidade: renderPrivacy,
    termos: renderTerms,
  }[route]();
  return `
    <div class="public-frame">
      ${publicNav()}
      ${view}
      ${footer()}
    </div>
  `;
}

function publicNav() {
  return `
    <nav class="public-nav">
      <a class="brand" href="#/landing" aria-label="LeadScore Empresas">
        <span class="brand-mark">LS</span>
        <span>LeadScore Empresas</span>
      </a>
      <div class="public-links">
        <a href="#/landing#como-funciona">Como funciona</a>
        <a href="#/landing#scores">Scores</a>
        <a href="#/landing#planos">Planos</a>
        <a href="#/termos">Termos</a>
      </div>
      <div class="public-links">
        <a class="btn ghost" href="#/login">Entrar</a>
        <a class="btn primary" href="#/cadastro">Começar agora</a>
      </div>
    </nav>
  `;
}

function renderLanding() {
  return `
    <header class="hero">
      <canvas id="heroCanvas" class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-content">
        <span class="hero-eyebrow">Inteligência comercial B2B com dados públicos</span>
        <h1><span>Encontre empresas</span> <span>com alto potencial</span> <span>de compra</span> <span>e o contato certo</span> <span>para começar a vender.</span></h1>
        <p>O LeadScore Empresas ajuda agências, vendedores B2B e consultorias a encontrar empresas ativas, segmentadas por cidade, CNAE, porte, capital social, presença digital e qualidade dos contatos disponíveis.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#/cadastro">Começar agora</a>
          <a class="btn" href="#/dashboard">Ver demonstração</a>
        </div>
      </div>
      <div class="hero-strip" aria-label="Indicadores do sistema">
        <div class="hero-stat"><strong>0-100</strong><span>Score de Potencial</span></div>
        <div class="hero-stat"><strong>0-100</strong><span>Score de Contato</span></div>
        <div class="hero-stat"><strong>60/40</strong><span>Score Final do Lead</span></div>
      </div>
    </header>

    <section id="como-funciona" class="section compact">
      <div class="section-header">
        <div>
          <h2>Como funciona</h2>
          <p>Quatro passos para sair da lista fria e chegar em leads com prioridade comercial clara.</p>
        </div>
      </div>
      <div class="grid cols-4">
        ${feature("1", "Pesquise empresas", "Escolha cidade, estado, CNAE, porte, capital social, segmento e situação cadastral.")}
        ${feature("2", "Veja o score", "Classifique empresas por potencial comercial e qualidade dos contatos disponíveis.")}
        ${feature("3", "Encontre o melhor contato", "Visualize telefone da empresa, WhatsApp comercial, e-mail, site, redes sociais e responsáveis públicos quando disponíveis.")}
        ${feature("4", "Aborde e acompanhe", "Gere uma mensagem personalizada, envie pelo melhor canal e acompanhe no CRM.")}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>Para quem é</h2>
          <p>Feito para times que vendem para empresas e precisam priorizar mercado com critério.</p>
        </div>
      </div>
      <div class="grid cols-4">
        ${["Agências de marketing", "Gestores de tráfego", "Vendedores B2B", "Consultorias", "Empresas de software", "Contabilidades", "Crédito PJ", "Energia solar"].map((item, index) => feature(String(index + 1).padStart(2, "0"), item, "Busque segmentos, cidades e sinais comerciais para montar listas acionáveis.")).join("")}
      </div>
    </section>

    <section id="scores" class="section">
      <div class="section-header">
        <div>
          <h2>Scores para decidir a próxima ação</h2>
          <p>O sistema combina potencial econômico estimado com qualidade dos contatos. Nunca trata o resultado como faturamento real.</p>
        </div>
        <a class="btn dark" href="#/dashboard">Abrir dashboard</a>
      </div>
      <div class="grid cols-3">
        ${scoreExplain("Score de Potencial", "0 a 100", "Porte, capital social, tempo de mercado, situação cadastral, segmento, matriz/filial e presença digital.")}
        ${scoreExplain("Score de Contato", "0 a 100", "Telefone da empresa, WhatsApp comercial, e-mail, site, Instagram, fonte, validação recente e confiança.")}
        ${scoreExplain("Score Final", "60% + 40%", "Combina 60% do Score de Potencial e 40% do Score de Contato para classificar lead frio, morno ou quente.")}
      </div>
    </section>

    <section class="section compact">
      <div class="section-header">
        <div>
          <h2>Busca de contatos com fonte e confiança</h2>
          <p>Separe contato empresarial de contato de responsável público, sempre com origem, data de verificação e nível de confiança.</p>
        </div>
      </div>
      <div class="grid cols-3">
        ${feature("C", "Contato empresarial", "Telefone da empresa, WhatsApp comercial, e-mail empresarial, site e redes sociais da empresa.")}
        ${feature("R", "Responsável público", "Nome do sócio/administrador, responsável comercial e telefone público quando houver fonte permitida.")}
        ${feature("F", "Fonte permitida", "CNPJ, site oficial, Google Maps, Instagram, Facebook, LinkedIn, catálogos públicos, bases parceiras e dados manuais.")}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>CRM integrado</h2>
          <p>Envie leads qualificados para um funil simples e acompanhe abordagem, tarefas, notas, motivo de perda e valor estimado.</p>
        </div>
        <a class="btn primary" href="#/crm">Ver CRM</a>
      </div>
      <div class="grid cols-3">
        ${feature("N", "Novo lead", "Receba empresas priorizadas por score final e contato disponível.")}
        ${feature("A", "Abordagem", "Gere mensagens para WhatsApp, e-mail, ligação, Instagram ou LinkedIn.")}
        ${feature("V", "Venda", "Movimente o funil até proposta, cliente fechado ou perdido.")}
      </div>
    </section>

    <section id="planos" class="section compact">
      <div class="section-header">
        <div>
          <h2>Planos</h2>
          <p>Estrutura pronta para venda recorrente com consultas mensais e recursos por nível.</p>
        </div>
      </div>
      ${renderPlansGrid()}
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>Depoimentos fictícios</h2>
          <p>Exemplos de como diferentes operações poderiam usar a plataforma.</p>
        </div>
      </div>
      <div class="grid cols-3">
        ${testimonial("Diretora de agência", "Conseguimos montar listas de clínicas sem site e priorizar quem já tinha WhatsApp comercial.")}
        ${testimonial("Vendedor B2B", "O Score Final ajuda a decidir quem abordar primeiro sem depender de achismo.")}
        ${testimonial("Consultoria", "As fontes de contato e os avisos legais deixam a prospecção mais organizada e responsável.")}
      </div>
    </section>

    <section class="section compact">
      <div class="section-header">
        <div>
          <h2>Perguntas frequentes</h2>
        </div>
      </div>
      <div class="grid cols-2">
        ${faq("O sistema mostra faturamento real da empresa?", "Não. O LeadScore trabalha com estimativas de potencial comercial baseadas em dados públicos e sinais de mercado.")}
        ${faq("O sistema promete contato não público de sócios?", "Não. Ele organiza contatos empresariais e contatos públicos de responsáveis apenas quando a fonte for pública, permitida, manual ou fornecida pelo titular.")}
        ${faq("Posso exportar leads?", "Sim. A exportação CSV inclui scores, classificação, dados da empresa, fonte, confiança e mensagem sugerida.")}
        ${faq("Dá para integrar com CRM externo?", "A estrutura Enterprise prevê API e integração com CRMs externos em uma evolução do produto.")}
      </div>
    </section>

    <section class="section compact">
      <div class="grid">
        ${legalBlock()}
      </div>
    </section>
  `;
}

function renderLogin() {
  return `
    <section class="auth-page">
      <div class="auth-visual">
        <canvas id="heroCanvas" aria-hidden="true"></canvas>
        <div>
          <h1>Entre para priorizar os melhores leads da sua operação.</h1>
          <p>Acesse dashboard, buscas, listas salvas, CRM e geração de abordagem.</p>
        </div>
      </div>
      <form class="auth-card" data-auth-form>
        <div>
          <h2>Login</h2>
          <p>Use qualquer e-mail para entrar na demonstração.</p>
        </div>
        <div class="field"><label>E-mail</label><input type="email" required value="comercial@leadscore.example"></div>
        <div class="field"><label>Senha</label><input type="password" required value="123456"></div>
        <button class="btn primary" type="submit">Entrar no sistema</button>
        <a href="#/cadastro">Criar uma conta</a>
      </form>
    </section>
  `;
}

function renderSignup() {
  return `
    <section class="auth-page">
      <div class="auth-visual">
        <canvas id="heroCanvas" aria-hidden="true"></canvas>
        <div>
          <h1>Comece com dados fictícios e evolua para APIs reais.</h1>
          <p>Estrutura pronta para conectar CNPJ, WhatsApp, CRM e enriquecimento permitido.</p>
        </div>
      </div>
      <form class="auth-card" data-auth-form>
        <div>
          <h2>Cadastro</h2>
          <p>Crie sua conta de demonstração.</p>
        </div>
        <div class="field"><label>Nome</label><input required value="Equipe Comercial"></div>
        <div class="field"><label>E-mail</label><input type="email" required value="vendas@empresa.example"></div>
        <div class="field"><label>Plano</label><select><option>Pro</option><option>Básico</option><option>Agência</option><option>Enterprise</option></select></div>
        <button class="btn primary" type="submit">Criar conta</button>
        <a href="#/login">Já tenho conta</a>
      </form>
    </section>
  `;
}

function renderShell(route, id) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="toolbar">
          <button class="btn icon mobile-toggle" data-action="toggle-menu" title="Abrir menu">☰</button>
          <a class="brand" href="#/dashboard"><span class="brand-mark">LS</span><span>LeadScore Empresas</span></a>
        </div>
        <div class="app-user">
          <span class="pill high">Pro</span>
          <span>Equipe Comercial</span>
          <a class="btn small" href="#/landing">Landing</a>
        </div>
      </header>
      <div class="app-layout">
        ${sidebar(route)}
        <main class="main">
          ${renderRoute(route, id)}
        </main>
      </div>
    </div>
  `;
}

function sidebar(active) {
  const groups = [
    {
      label: "Operação",
      links: [
        ["dashboard", "Dashboard"],
        ["busca", "Busca de empresas"],
        ["resultados", "Resultados"],
        ["crm", "CRM de leads"],
        ["listas", "Listas salvas"],
      ],
    },
    {
      label: "Inteligência",
      links: [
        ["contatos", "Contatos encontrados"],
        ["gerador", "Gerador de abordagem"],
        ["exportacoes", "Exportações"],
        ["historico", "Histórico de buscas"],
      ],
    },
    {
      label: "Conta",
      links: [
        ["planos", "Planos e assinatura"],
        ["configuracoes", "Configurações"],
        ["equipe", "Usuários/equipe"],
        ["privacidade", "Política de privacidade"],
        ["termos", "Termos de uso"],
      ],
    },
  ];
  return `
    <aside class="sidebar">
      ${groups
        .map(
          (group) => `
          <div class="nav-group">
            <div class="nav-label">${group.label}</div>
            ${group.links
              .map(
                ([key, label]) => `
                <a class="nav-link ${active === key ? "active" : ""}" href="#/${key}">
                  <span class="nav-dot"></span>
                  <span>${label}</span>
                </a>`
              )
              .join("")}
          </div>`
        )
        .join("")}
    </aside>
  `;
}

function renderRoute(route, id) {
  const routes = {
    dashboard: renderDashboard,
    busca: renderSearch,
    resultados: renderResults,
    empresa: () => renderCompany(id),
    contatos: renderContacts,
    crm: renderCrm,
    listas: renderLists,
    gerador: renderGenerator,
    planos: renderPlansPage,
    configuracoes: renderSettings,
    equipe: renderTeam,
    exportacoes: renderExports,
    historico: renderHistory,
    privacidade: renderPrivacy,
    termos: renderTerms,
  };
  return (routes[route] || renderDashboard)();
}

function pageTitle(title, description, actions = "") {
  return `
    <div class="page-title">
      <div>
        <h1>${title}</h1>
        <p>${description}</p>
        ${state.api.checked ? `<p>${apiStatusPill()}</p>` : ""}
      </div>
      ${actions ? `<div class="title-actions">${actions}</div>` : ""}
    </div>
  `;
}

function apiStatusPill() {
  if (!state.api.connected) {
    return `<span class="pill low">APIs offline: usando demo local</span>`;
  }
  const providers = state.api.status?.providers || {};
  const plan = state.api.status?.plan;
  return `<span class="pill high">APIs conectadas</span> <span class="pill neutral">Plano: ${plan?.name || "Agência"}</span> <span class="pill neutral">Busca: ${providers.leadSearch || "n/d"}</span> <span class="pill neutral">CNPJ: ${providers.cnpj || "n/d"}</span> <span class="pill neutral">IA: ${providers.ai || "n/d"}</span> <span class="pill neutral">CRM: ${providers.crm || "n/d"}</span>`;
}

function apiStatusCard() {
  if (!state.api.checked) {
    return `<div class="card pad"><h3>Status das APIs</h3><p>Verificando conexão com o backend...</p></div>`;
  }
  if (!state.api.connected) {
    return `<div class="card pad"><h3>Status das APIs</h3><p>Backend não conectado. Abra pelo servidor Node para usar APIs reais; enquanto isso, a demonstração local continua funcionando.</p><p><strong>Erro:</strong> ${state.api.error}</p></div>`;
  }
  const providers = state.api.status?.providers || {};
  const configured = state.api.config?.configured || {};
  const national = state.api.config?.national || {};
  const plan = state.api.config?.plan || state.api.status?.plan || {};
  return `
    <div class="card pad">
      <h3>Status das APIs</h3>
      <div class="info-grid" style="margin-top:12px">
        ${infoItem("Busca por empresas", providers.leadSearch)}
        ${infoItem("Base nacional", national.available ? `${national.records || "muitos"} registros` : "não importada")}
        ${infoItem("Consulta CNPJ", providers.cnpj)}
        ${infoItem("Enriquecimento", providers.contacts)}
        ${infoItem("IA de abordagem", providers.ai)}
        ${infoItem("CRM", providers.crm)}
        ${infoItem("WhatsApp", providers.whatsapp)}
        ${infoItem("Plano ativo", `${plan.name || "Agência"} · até ${plan.maxSearchResults || 2000} resultados por busca`)}
      </div>
      <p style="margin-top:12px">Configurado: base nacional ${yesNo(national.available)}, busca parceira ${yesNo(configured.partnerLeadSearch)}, CNPJ parceiro ${yesNo(configured.partnerCnpj)}, enriquecimento ${yesNo(configured.contactEnrichment)}, OpenAI ${yesNo(configured.openAi)}, CRM webhook ${yesNo(configured.crmWebhook)}, WhatsApp Cloud ${yesNo(configured.whatsappCloud)}.</p>
    </div>
  `;
}

function renderDashboard() {
  const companies = state.companies;
  const metrics = [
    ["Total de empresas encontradas", companies.length, "+16 demo"],
    ["Leads com alto potencial", companies.filter((c) => c.scorePotencial >= 71).length, "prioridade"],
    ["Leads com médio potencial", companies.filter((c) => c.scorePotencial >= 41 && c.scorePotencial <= 70).length, "nutrir"],
    ["Leads com baixo potencial", companies.filter((c) => c.scorePotencial <= 40).length, "validar"],
    ["Empresas com contato forte", companies.filter((c) => c.scoreContato >= 71).length, "alta confiança"],
    ["Telefone/WhatsApp", companies.filter((c) => c.telefone || c.whatsapp).length, "canais diretos"],
    ["Empresas com e-mail", companies.filter((c) => c.email).length, "abordagem formal"],
    ["Sem presença digital aparente", companies.filter((c) => !c.presencaDigital).length, "oportunidade"],
    ["Empresas novas no mês", companies.filter((c) => c.idadeMeses <= 4).length, "monitorar"],
    ["Leads enviados ao CRM", companies.filter((c) => c.status !== "Novo lead").length, "em funil"],
  ];
  return `
    ${pageTitle("Dashboard", "Visão geral da base de demonstração, scores, contatos, listas e funil.", `
      <a class="btn primary" href="#/busca">Nova busca</a>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    `)}
    <section class="metric-grid">
      ${metrics.map(([label, value, help]) => `<div class="metric"><span>${label}</span><strong>${value}</strong><small>${help}</small></div>`).join("")}
    </section>
    <section style="margin-top:16px">
      ${apiStatusCard()}
    </section>
    <section class="panel-grid">
      <div class="card chart-card">
        <header><h3>Distribuição dos scores</h3><span class="pill neutral">Score de Potencial e Contato</span></header>
        <div class="chart-row">
          <div class="chart-box"><canvas id="potentialChart"></canvas></div>
          <div class="chart-box"><canvas id="contactChart"></canvas></div>
        </div>
      </div>
      <div class="card mini-list">
        <header><h3>Últimas buscas realizadas</h3><a href="#/historico">Ver histórico</a></header>
        ${state.history.slice(0, 5).map((item) => `<div class="list-row"><strong>${item}</strong><span>Atualizado em 27/06/2026</span></div>`).join("")}
      </div>
    </section>
    <section class="panel-grid">
      <div class="card chart-card">
        <header><h3>Distribuições comerciais</h3><span class="pill neutral">Cidade, segmento, porte e situação</span></header>
        <div class="chart-row">
          <div class="chart-box"><canvas id="cityChart"></canvas></div>
          <div class="chart-box"><canvas id="segmentChart"></canvas></div>
        </div>
        <div class="chart-row">
          <div class="chart-box"><canvas id="sizeChart"></canvas></div>
          <div class="chart-box"><canvas id="statusChart"></canvas></div>
        </div>
      </div>
      <div class="card mini-list">
        <header><h3>Listas salvas</h3><a href="#/listas">Abrir listas</a></header>
        ${state.savedLists.map((list) => `<div class="list-row"><strong>${list.nome}</strong><span>${list.ids.length} empresas · ${list.filters}</span></div>`).join("")}
      </div>
    </section>
  `;
}

function renderSearch() {
  const segments = unique(state.companies.map((c) => c.segmento));
  return `
    ${pageTitle("Busca de empresas", "Use filtros avançados por dados públicos, presença digital, contatos e scores.", `
      <button class="btn" data-action="clear-filters">Limpar filtros</button>
      <button class="btn primary" data-action="search-submit-proxy">Pesquisar</button>
    `)}
    <form id="cnpjLookupForm" class="card pad" style="margin-bottom:16px">
      <div class="section-header" style="margin:0 0 14px;width:100%">
        <div>
          <h2>Consulta real de CNPJ</h2>
          <p>Digite um CNPJ para buscar dados públicos cadastrais via API e adicionar o lead à base.</p>
        </div>
      </div>
      <div class="toolbar">
        <div class="field" style="min-width:min(380px,100%);flex:1">
          <label for="cnpjLookup">CNPJ</label>
          <input id="cnpjLookup" name="cnpj" placeholder="00.000.000/0000-00" inputmode="numeric">
        </div>
        <button class="btn primary" type="submit">Consultar CNPJ</button>
      </div>
    </form>
    <form id="searchForm" class="card pad">
      <div class="form-grid">
        ${selectField("Estado", "estado", ["BR", ...brazilStates])}
        ${inputField("Cidade", "cidade", "Ex.: Campo Grande, São Paulo, Goiânia")}
        ${inputField("Bairro", "bairro", "Ex.: Centro")}
        ${inputField("CNAE principal", "cnae", "Ex.: 8630")}
        ${inputField("CNAEs secundários", "cnaeSecundarios", "Ex.: consultoria")}
        ${selectField("Palavra-chave do segmento", "segmento", segments)}
        ${selectField("Porte da empresa", "porte", ["ME", "EPP", "Demais"])}
        ${inputField("Capital social mínimo", "capitalMin", "Ex.: 50000", "number")}
        ${inputField("Capital social máximo", "capitalMax", "Ex.: 500000", "number")}
        ${selectField("Tempo de abertura", "tempo", ["Menos de 6 meses", "6 a 24 meses", "2 a 5 anos", "Mais de 5 anos"])}
        ${selectField("Situação cadastral", "situacao", ["Ativa", "Suspensa", "Inapta", "Baixada"])}
        ${selectField("Matriz ou filial", "matriz", ["Matriz", "Filial"])}
        ${inputField("Score de Potencial mínimo", "scorePotencialMin", "Ex.: 71", "number")}
        ${inputField("Score de Contato mínimo", "scoreContatoMin", "Ex.: 71", "number")}
        ${inputField("Limite de resultados", "limit", "Ex.: 500", "number")}
      </div>
      <div class="check-grid">
        ${checkboxField("Empresas com telefone", "telefone")}
        ${checkboxField("Empresas com WhatsApp", "whatsapp")}
        ${checkboxField("Empresas com e-mail", "email")}
        ${checkboxField("Empresas com site", "site")}
        ${checkboxField("Empresas com Instagram", "instagram")}
        ${checkboxField("Empresas com Google Maps", "googleMaps")}
        ${checkboxField("Empresas sem presença digital", "semDigital")}
        ${checkboxField("Empresas com nome de sócio/administrador", "socio")}
        ${checkboxField("Empresas com contato forte", "contatoForte")}
        ${checkboxField("Empresas com alto Score de Potencial", "altoPotencial")}
        ${checkboxField("Empresas com alto Score de Contato", "altoContato")}
      </div>
      <div class="toolbar" style="margin-top:16px">
        <button class="btn primary" type="submit">Pesquisar empresas</button>
        <button class="btn" type="button" data-action="save-list">Salvar lista atual</button>
        <button class="btn" type="button" data-action="export-csv">Exportar dados</button>
        <button class="btn" type="button" data-action="send-current-crm">Enviar leads para CRM</button>
      </div>
    </form>
    <section class="card pad" style="margin-top:16px">
      <h3>Critérios usados nos scores</h3>
      <p>O Score de Potencial considera situação ativa, capital social, tempo de mercado, porte, contatos, presença digital, segmento, matriz e filiais. O Score de Contato considera telefone empresarial, WhatsApp comercial, e-mail, site, Instagram, sócios/administradores, responsável comercial, fonte oficial, validação recente e múltiplos canais.</p>
    </section>
  `;
}

function renderResults() {
  const rows = currentResults();
  return `
    ${pageTitle("Resultado de pesquisa", `${rows.length} empresas encontradas com os filtros atuais.`, `
      <a class="btn" href="#/busca">Editar filtros</a>
      <button class="btn" data-action="sort-potential">Ordenar por Potencial</button>
      <button class="btn" data-action="sort-contact">Ordenar por Contato</button>
      <button class="btn" data-action="save-list">Salvar lista</button>
      <button class="btn primary" data-action="export-csv">Exportar CSV</button>
    `)}
    ${rows.length ? leadsTable(rows) : `<div class="card empty-state"><div><h3>Nenhum resultado encontrado</h3><p>Ajuste os filtros ou limpe a busca para voltar à base completa.</p></div></div>`}
  `;
}

function leadsTable(rows) {
  return `
    <section class="table-card">
      <header>
        <h3>Tabela de leads</h3>
        <div class="toolbar">
          <button class="btn small" data-action="send-current-crm">Enviar lista para CRM</button>
          <button class="btn small" data-action="bulk-message">Gerar abordagem em massa</button>
        </div>
      </header>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Potencial</th>
              <th>Contato</th>
              <th>Final</th>
              <th>Classificação</th>
              <th>Nome fantasia</th>
              <th>Razão social</th>
              <th>CNPJ</th>
              <th>Segmento/CNAE</th>
              <th>Cidade</th>
              <th>Estado</th>
              <th>Bairro</th>
              <th>Porte</th>
              <th>Capital social</th>
              <th>Tempo</th>
              <th>Situação</th>
              <th>Matriz/filial</th>
              <th>Sócio/administrador</th>
              <th>Qualificação</th>
              <th>Telefone</th>
              <th>Telefone 2</th>
              <th>WhatsApp</th>
              <th>E-mail</th>
              <th>Site</th>
              <th>Instagram</th>
              <th>Google Maps</th>
              <th>Telefone público do responsável</th>
              <th>Fonte</th>
              <th>Confiança</th>
              <th>Status</th>
              <th>Ação recomendada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(leadRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function leadRow(company) {
  const socio = company.socios[0] || { nome: "", qualificacao: "" };
  return `
    <tr>
      <td>${scoreBadge(company.scorePotencial)}</td>
      <td>${scoreBadge(company.scoreContato)}</td>
      <td>${scoreBadge(company.scoreFinal)}</td>
      <td><span class="pill ${scoreLevel(company.scoreFinal)}">${company.classFinal}</span></td>
      <td><strong>${company.fantasia}</strong></td>
      <td>${company.razao}</td>
      <td>${company.cnpj}</td>
      <td>${company.segmento}<br><span class="pill neutral">${company.cnae}</span></td>
      <td>${company.cidade}</td>
      <td>${company.estado}</td>
      <td>${company.bairro}</td>
      <td>${company.porte}</td>
      <td>${money(company.capital)}</td>
      <td>${company.tempoMercado}</td>
      <td><span class="pill ${company.situacao === "Ativa" ? "high" : "low"}">${company.situacao}</span></td>
      <td>${company.matriz}</td>
      <td>${socio.nome}</td>
      <td>${socio.qualificacao}</td>
      <td>${company.telefone || "Não localizado"}</td>
      <td>${company.telefone2 || "Não localizado"}</td>
      <td>${company.whatsapp || "Não localizado"}</td>
      <td>${company.email || "Não localizado"}</td>
      <td>${company.site || "Não localizado"}</td>
      <td>${company.instagram || "Não localizado"}</td>
      <td>${company.googleMaps || "Não localizado"}</td>
      <td>${company.telefoneResponsavelPublico || "Quando encontrado em fonte pública"}</td>
      <td>${company.fonteContato}</td>
      <td>${trustBySource(company.fonteContato, company.fonteOficial ? "Alta confiança" : "Baixa confiança")}</td>
      <td>
        <select class="status-select" data-action="change-status" data-id="${company.id}">
          ${crmStages.map((stage) => `<option ${stage === company.status ? "selected" : ""}>${stage}</option>`).join("")}
        </select>
      </td>
      <td>${company.acaoRecomendada}</td>
      <td>
        <div class="row-actions">
          <a class="btn small" href="#/empresa/${company.id}">Detalhes</a>
          <button class="btn small" data-action="copy-phone" data-id="${company.id}">Copiar telefone</button>
          <button class="btn small" data-action="copy-email" data-id="${company.id}">Copiar e-mail</button>
          <button class="btn small" data-action="open-wa" data-id="${company.id}">Abrir WhatsApp</button>
          <button class="btn small" data-action="message-company" data-id="${company.id}">Gerar abordagem</button>
          <button class="btn small" data-action="send-company-crm" data-id="${company.id}">Enviar CRM</button>
        </div>
      </td>
    </tr>
  `;
}

function renderCompany(id) {
  const company = findCompany(id) || currentResults()[0] || state.companies[0];
  const socioList = company.socios.map((s) => `${s.nome} · ${s.qualificacao}`).join("<br>");
  return `
    ${pageTitle("Página individual da empresa", "Detalhes cadastrais, sinais comerciais, contatos encontrados e sugestão de abordagem.", `
      <a class="btn" href="#/resultados">Voltar aos resultados</a>
      <button class="btn" data-action="enrich-company" data-id="${company.id}">Enriquecer contatos</button>
      <button class="btn primary" data-action="message-company" data-id="${company.id}">Gerar abordagem</button>
    `)}
    <section class="detail-grid">
      <div class="profile-head">
        <span class="pill high">${company.classFinal}</span>
        <h2>${company.fantasia}</h2>
        <p>${company.razao} · ${company.cnpj}</p>
        <div class="score-triplet">
          <div class="score-tile"><strong>${company.scorePotencial}</strong><span>Score de Potencial</span></div>
          <div class="score-tile"><strong>${company.scoreContato}</strong><span>Score de Contato</span></div>
          <div class="score-tile"><strong>${company.scoreFinal}</strong><span>Score Final</span></div>
        </div>
      </div>
      <div class="card pad">
        <h3>Análise automática da oportunidade</h3>
        <p>${company.oportunidade}</p>
        <div class="legal-notice" style="margin-top:12px">${LEGAL_SCORE}</div>
      </div>
    </section>
    <section class="detail-grid" style="margin-top:16px">
      <div class="card pad">
        <h3>Dados da empresa</h3>
        <div class="info-grid" style="margin-top:12px">
          ${infoItem("Situação cadastral", company.situacao)}
          ${infoItem("Data de abertura", dateBR(company.abertura))}
          ${infoItem("Idade da empresa", company.tempoMercado)}
          ${infoItem("CNAE principal", company.cnae)}
          ${infoItem("CNAEs secundários", company.cnaesSecundarios)}
          ${infoItem("Natureza jurídica", company.natureza)}
          ${infoItem("Porte", company.porte)}
          ${infoItem("Capital social", money(company.capital))}
          ${infoItem("Endereço completo", `${company.endereco}, ${company.bairro}, ${company.cidade}/${company.estado}, CEP ${company.cep}`)}
          ${infoItem("Matriz ou filial", company.matriz)}
          ${infoItem("Sócios/administradores", socioList)}
          ${infoItem("Quantidade de sinais positivos", company.sinaisPositivos)}
        </div>
      </div>
      <div class="card pad">
        <h3>Canais e presença digital</h3>
        <div class="info-grid" style="margin-top:12px">
          ${infoItem("Telefone da empresa", company.telefone || "Não localizado")}
          ${infoItem("Telefone secundário", company.telefone2 || "Não localizado")}
          ${infoItem("WhatsApp comercial", company.whatsapp || "Não localizado")}
          ${infoItem("E-mail empresarial", company.email || "Não localizado")}
          ${infoItem("Site", company.site || "Não localizado")}
          ${infoItem("Instagram", company.instagram || "Não localizado")}
          ${infoItem("Facebook", company.facebook || "Não localizado")}
          ${infoItem("LinkedIn", company.linkedin || "Não localizado")}
          ${infoItem("Google Maps", company.googleMaps || "Não localizado")}
        </div>
      </div>
    </section>
    <section class="card pad" style="margin-top:16px">
      <div class="page-title" style="margin-bottom:14px">
        <div>
          <h1>Contatos Encontrados</h1>
          <p>Contato empresarial e responsáveis públicos separados por tipo, fonte, data de verificação e nível de confiança.</p>
        </div>
        <div class="title-actions">
          <button class="btn" data-action="validate-contact" data-id="${company.id}">Validar contato</button>
          <button class="btn" data-action="report-contact" data-id="${company.id}">Reportar contato incorreto</button>
        </div>
      </div>
      ${contactsList(company)}
    </section>
    <section class="card pad" style="margin-top:16px">
      <h3>Sugestão de abordagem comercial</h3>
      <p class="generator-output">${company.mensagemSugerida}</p>
    </section>
  `;
}

function contactsList(company) {
  return `
    <div class="contact-list">
      ${company.contatos
        .map(
          (contact) => `
          <div class="contact-row">
            <div><strong>${contact.tipo}</strong><span>${contact.categoria}</span></div>
            <strong>${contact.valor}</strong>
            <span>${contact.fonte}</span>
            <span>${dateBR(contact.verificado)} · ${contact.confianca}</span>
            <div class="row-actions">
              <button class="btn small" data-action="copy-value" data-value="${escapeAttr(contact.valor)}">Copiar</button>
              <button class="btn small" data-action="open-contact-wa" data-value="${escapeAttr(contact.valor)}">WhatsApp</button>
              <button class="btn small" data-action="message-company" data-id="${company.id}">Gerar abordagem</button>
              <button class="btn small" data-action="mark-primary" data-id="${company.id}">Principal</button>
            </div>
          </div>`
        )
        .join("")}
    </div>
  `;
}

function renderContacts() {
  const rows = currentResults();
  return `
    ${pageTitle("Contatos encontrados", "Visão consolidada de telefones, WhatsApp comercial, e-mails, redes e responsáveis públicos.", `
      <button class="btn" data-action="export-csv">Exportar contatos</button>
      <a class="btn primary" href="#/resultados">Abrir tabela</a>
    `)}
    <section class="card pad">
      <div class="contact-list">
        ${rows
          .flatMap((company) =>
            company.contatos.map(
              (contact) => `
              <div class="contact-row">
                <div><strong>${company.fantasia}</strong><span>${contact.tipo}</span></div>
                <strong>${contact.valor}</strong>
                <span>${contact.fonte}</span>
                <span>${dateBR(contact.verificado)} · ${contact.confianca}</span>
                <div class="row-actions">
                  <a class="btn small" href="#/empresa/${company.id}">Empresa</a>
                  <button class="btn small" data-action="copy-value" data-value="${escapeAttr(contact.valor)}">Copiar</button>
                  <button class="btn small" data-action="validate-contact" data-id="${company.id}">Validar</button>
                </div>
              </div>`
            )
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCrm() {
  return `
    ${pageTitle("CRM de leads", "Funil visual para acompanhar abordagem, tarefas, notas, perdas e oportunidades.", `
      <a class="btn" href="#/resultados">Adicionar leads</a>
      <button class="btn primary" data-action="export-csv">Exportar funil</button>
    `)}
    <section class="kanban">
      ${crmStages.map((stage) => crmColumn(stage)).join("")}
    </section>
  `;
}

function crmColumn(stage) {
  const rows = state.companies.filter((company) => company.status === stage);
  return `
    <div class="kanban-column" data-stage="${stage}">
      <header><h3>${stage}</h3><span class="pill neutral">${rows.length}</span></header>
      ${rows.map(crmCard).join("")}
    </div>
  `;
}

function crmCard(company) {
  return `
    <article class="lead-card" draggable="true" data-id="${company.id}">
      <h4>${company.fantasia}</h4>
      <p>${company.cidade}/${company.estado} · ${company.segmento}</p>
      <div class="lead-meta">
        <span class="pill ${scoreLevel(company.scorePotencial)}">P ${company.scorePotencial}</span>
        <span class="pill ${scoreLevel(company.scoreContato)}">C ${company.scoreContato}</span>
        <span class="pill ${scoreLevel(company.scoreFinal)}">F ${company.scoreFinal}</span>
      </div>
      <p><strong>Telefone:</strong> ${company.telefone || "Não localizado"} · <strong>WhatsApp:</strong> ${company.whatsapp || "Não localizado"}</p>
      <p><strong>E-mail:</strong> ${company.email || "Não localizado"}</p>
      <p><strong>Última interação:</strong> ${company.ultimaInteracao}</p>
      <p><strong>Próxima ação:</strong> ${company.proximaAcao}</p>
      <p><strong>Responsável:</strong> ${company.dono}</p>
      <p><strong>Valor estimado:</strong> ${money(company.valorEstimado)}</p>
      <div class="row-actions">
        <a class="btn small" href="#/empresa/${company.id}">Detalhes</a>
        <button class="btn small" data-action="add-note" data-id="${company.id}">Nota</button>
        <button class="btn small" data-action="message-company" data-id="${company.id}">Abordagem</button>
      </div>
    </article>
  `;
}

function renderLists() {
  return `
    ${pageTitle("Listas salvas", "Organize buscas recorrentes e campanhas por segmento, score, cidade e presença digital.", `
      <button class="btn primary" data-action="save-list">Salvar lista atual</button>
    `)}
    <section class="grid cols-3">
      ${state.savedLists.map(listCard).join("")}
      ${[
        "Escritórios de advocacia em MS",
        "Empresas de estética com alto potencial",
        "Empresas com capital social acima de R$ 100 mil",
        "Leads para tráfego pago",
        "Leads para venda de software",
        "Empresas com WhatsApp comercial",
        "Empresas sem presença digital",
      ]
        .map((name) => `<div class="card pad"><h3>${name}</h3><p>Modelo sugerido para criação rápida de lista.</p><button class="btn small" data-action="create-template-list" data-name="${escapeAttr(name)}">Criar</button></div>`)
        .join("")}
    </section>
  `;
}

function listCard(list) {
  return `
    <article class="card pad">
      <h3>${list.nome}</h3>
      <p>${list.ids.length} empresas · Criada em ${dateBR(list.createdAt)}</p>
      <p><strong>Filtros:</strong> ${list.filters}</p>
      <div class="toolbar" style="margin-top:12px">
        <button class="btn small" data-action="open-list" data-id="${list.id}">Abrir</button>
        <button class="btn small" data-action="export-list" data-id="${list.id}">Exportar</button>
        <button class="btn small" data-action="list-to-crm" data-id="${list.id}">Abrir no CRM</button>
        <button class="btn small" data-action="bulk-list-message" data-id="${list.id}">Abordagem em massa</button>
      </div>
    </article>
  `;
}

function renderGenerator() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const selectedId = params.get("company") || currentResults()[0]?.id || state.companies[0].id;
  const company = findCompany(selectedId) || state.companies[0];
  const channel = params.get("channel") || "whatsapp";
  const offer = params.get("offer") || "trafego";
  const message = state.generatedMessages[messageCacheKey(company.id, channel, offer)] || makeMessage(company, channel, offer);
  return `
    ${pageTitle("Gerador de abordagem", "Crie mensagens personalizadas para WhatsApp, e-mail, ligação, Direct do Instagram e LinkedIn.", `
      <button class="btn" data-action="copy-message">Copiar mensagem</button>
      <a class="btn primary" href="#/crm">Acompanhar no CRM</a>
    `)}
    <section class="detail-grid">
      <form id="generatorForm" class="card pad">
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="field">
            <label>Empresa</label>
            <select name="company">${state.companies.map((item) => `<option value="${item.id}" ${item.id === company.id ? "selected" : ""}>${item.fantasia} · ${item.cidade}/${item.estado}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label>Canal</label>
            <select name="channel">
              ${["whatsapp", "email", "ligacao", "instagram", "linkedin"].map((item) => `<option value="${item}" ${item === channel ? "selected" : ""}>${channelLabel(item)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Tipo de oferta</label>
            <select name="offer">
              ${Object.entries(offerLabels).map(([key, label]) => `<option value="${key}" ${key === offer ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="toolbar" style="margin-top:16px">
          <button class="btn primary" type="submit">Gerar mensagem</button>
          <button class="btn" type="button" data-action="open-wa" data-id="${company.id}">Abrir WhatsApp</button>
        </div>
      </form>
      <div class="card pad">
        <h3>Mensagem sugerida</h3>
        <p id="generatedMessage" class="generator-output">${message}</p>
      </div>
    </section>
  `;
}

function renderPlansPage() {
  return `
    ${pageTitle("Planos e assinatura", "Estrutura comercial para transformar a plataforma em venda recorrente.", `
      <a class="btn primary" href="#/cadastro">Contratar plano</a>
    `)}
    ${renderPlansGrid()}
  `;
}

function renderSettings() {
  return `
    ${pageTitle("Configurações", "Preferências de busca, fontes permitidas, exportação, LGPD e integrações futuras.")}
    <section style="margin-bottom:16px">
      ${apiStatusCard()}
    </section>
    <section class="grid cols-2">
      <div class="card pad">
        <h3>Fontes permitidas</h3>
        <div class="check-grid" style="grid-template-columns:1fr">
          ${["Dados públicos do CNPJ", "Site oficial da empresa", "Página de contato", "Google Maps", "Instagram da empresa", "Facebook da empresa", "LinkedIn da empresa", "Cartão digital público", "Catálogos empresariais públicos", "Bases parceiras com uso permitido", "Dados inseridos manualmente pelo usuário"].map((label) => checkboxField(label, slug(label), true)).join("")}
        </div>
      </div>
      <div class="card pad">
        <h3>Integrações preparadas</h3>
        <div class="info-grid" style="margin-top:12px">
          ${infoItem("API de CNPJ", "Pronto para conectar")}
          ${infoItem("CRM externo", "Pipedrive, HubSpot, RD Station")}
          ${infoItem("WhatsApp", "Link direto e automação futura")}
          ${infoItem("Enriquecimento", "Bases parceiras com uso permitido")}
          ${infoItem("Exportação", "CSV com avisos legais")}
          ${infoItem("LGPD", "Finalidade legítima, transparência e opt-out")}
        </div>
      </div>
    </section>
  `;
}

function renderTeam() {
  const users = [
    ["Ana Comercial", "Admin", "ana@leadscore.example", "Ativa"],
    ["Bruno SDR", "Vendas", "bruno@leadscore.example", "Ativo"],
    ["Carla Hunter", "Prospecção", "carla@leadscore.example", "Ativa"],
  ];
  return `
    ${pageTitle("Usuários/equipe", "Gestão de usuários do plano, responsáveis por atendimento e permissões.", `
      <button class="btn primary" data-action="mock">Adicionar usuário</button>
    `)}
    <section class="table-card">
      <header><h3>Equipe</h3><span class="pill neutral">3 usuários do plano Pro</span></header>
      <div class="table-scroll">
        <table style="min-width:720px">
          <thead><tr><th>Nome</th><th>Perfil</th><th>E-mail</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${users.map((user) => `<tr><td><strong>${user[0]}</strong></td><td>${user[1]}</td><td>${user[2]}</td><td><span class="pill high">${user[3]}</span></td><td><button class="btn small" data-action="mock">Editar</button></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderExports() {
  const rows = currentResults();
  return `
    ${pageTitle("Exportações", "Gere CSV com scores, classificação, contatos, fonte, confiança, status no CRM e mensagem sugerida.", `
      <button class="btn primary" data-action="export-csv">Exportar CSV agora</button>
    `)}
    <section class="grid cols-2">
      <div class="card pad">
        <h3>Campos exportados</h3>
        <p>${exportHeaders().join(", ")}.</p>
      </div>
      <div class="card pad">
        <h3>Resumo da exportação atual</h3>
        <div class="info-grid" style="margin-top:12px">
          ${infoItem("Empresas", rows.length)}
          ${infoItem("Leads quentes", rows.filter((c) => c.scoreFinal >= 71).length)}
          ${infoItem("Com WhatsApp comercial", rows.filter((c) => c.whatsapp).length)}
          ${infoItem("Com e-mail", rows.filter((c) => c.email).length)}
        </div>
      </div>
    </section>
    <section class="card pad" style="margin-top:16px">
      <h3>Aviso legal de exportação</h3>
      ${legalBlock()}
    </section>
  `;
}

function renderHistory() {
  return `
    ${pageTitle("Histórico de buscas", "Consultas recentes, filtros usados e acesso rápido aos resultados.")}
    <section class="card pad">
      ${state.history.map((item, index) => `<div class="list-row"><strong>${item}</strong><span>${index + 1} · 27/06/2026 · <button class="btn small" data-action="open-history" data-index="${index}">Abrir resultados</button></span></div>`).join("")}
    </section>
  `;
}

function renderPrivacy() {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Política de privacidade</h2>
          <p>Diretrizes para uso responsável de dados públicos, contatos empresariais e informações inseridas pelo usuário.</p>
        </div>
      </div>
      <div class="grid">
        <div class="card pad legal-text">
          <p>O LeadScore Empresas foi desenhado para organizar dados públicos empresariais, contatos comerciais e sinais de mercado para fins de prospecção B2B, respeitando finalidade legítima, transparência e boas práticas de comunicação.</p>
          <p>Dados inseridos manualmente pelo usuário devem ter origem permitida e finalidade compatível com a operação comercial. Cada contato deve manter fonte, data de verificação, tipo e nível de confiança.</p>
          ${legalBlock()}
          <p>O titular de dados ou empresa contatada deve poder solicitar correção, remoção ou opt-out dos fluxos de comunicação mantidos pelo usuário.</p>
        </div>
      </div>
    </section>
  `;
}

function renderTerms() {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Termos de uso</h2>
          <p>Regras de utilização, limites dos scores, fontes permitidas e responsabilidade do usuário.</p>
        </div>
      </div>
      <div class="grid">
        <div class="card pad legal-text">
          <p>O LeadScore Empresas é uma plataforma de inteligência comercial para prospecção B2B. Os dados de demonstração deste protótipo são fictícios.</p>
          ${legalBlock()}
          <p>O usuário não deve usar a plataforma para práticas abusivas, disparo sem critério, ocultação de identidade, contato fora de finalidade legítima ou tratamento incompatível com LGPD.</p>
          <p>Contatos devem ser classificados como empresa, WhatsApp comercial, e-mail, responsável público ou dado manual, sempre com fonte e nível de confiança.</p>
          <p>É proibido apresentar os scores como informação fiscal, contábil, financeira oficial ou garantia de capacidade de compra.</p>
        </div>
      </div>
    </section>
  `;
}

function afterRender(route, id, anchor) {
  if (document.getElementById("heroCanvas")) initHeroCanvas("heroCanvas");
  if (route === "dashboard") drawDashboardCharts();
  if (anchor) {
    window.requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: "start" }));
  }
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "toggle-menu") document.body.classList.toggle("menu-open");
  if (action === "search-submit-proxy") document.getElementById("searchForm")?.requestSubmit();
  if (action === "clear-filters") {
    state.filters = {};
    state.resultIds = state.companies.map((company) => company.id);
    showToast("Filtros limpos. Base completa disponível nos resultados.");
    location.hash = "#/resultados";
  }
  if (action === "sort-potential") {
    state.sort = "potential";
    state.resultIds = currentResults().sort((a, b) => b.scorePotencial - a.scorePotencial).map((c) => c.id);
    render();
  }
  if (action === "sort-contact") {
    state.sort = "contact";
    state.resultIds = currentResults().sort((a, b) => b.scoreContato - a.scoreContato).map((c) => c.id);
    render();
  }
  if (action === "export-csv") exportCsv(currentResults(), "leadscore-empresas.csv");
  if (action === "save-list") saveCurrentList();
  if (action === "send-current-crm") {
    const leads = currentResults();
    leads.forEach((company) => {
      if (company.status === "Novo lead") company.status = "Contatado";
    });
    await syncLeadsWithCrm(leads);
    render();
  }
  if (action === "send-company-crm") {
    const company = findCompany(target.dataset.id);
    if (company) company.status = "Contatado";
    await syncLeadsWithCrm(company ? [company] : []);
    render();
  }
  if (action === "copy-phone") copyCompanyField(target.dataset.id, "telefone");
  if (action === "copy-email") copyCompanyField(target.dataset.id, "email");
  if (action === "copy-value") copyText(target.dataset.value || "");
  if (action === "open-wa") await openWhatsApp(findCompany(target.dataset.id));
  if (action === "open-contact-wa") await openWhatsAppValue(target.dataset.value || "");
  if (action === "message-company") location.hash = `#/gerador?company=${target.dataset.id || currentResults()[0]?.id || state.companies[0].id}`;
  if (action === "bulk-message") {
    const first = currentResults()[0] || state.companies[0];
    location.hash = `#/gerador?company=${first.id}&offer=trafego&channel=whatsapp`;
    showToast("Use o gerador para adaptar a mensagem e aplicar em massa na lista.");
  }
  if (action === "copy-message") copyText(document.getElementById("generatedMessage")?.textContent || "");
  if (action === "validate-contact") showToast("Contato marcado como verificado recentemente na demonstração.");
  if (action === "enrich-company") await enrichCompanyContacts(target.dataset.id);
  if (action === "report-contact") showToast("Contato reportado para revisão.");
  if (action === "mark-primary") showToast("Contato definido como principal para este lead.");
  if (action === "add-note") showToast("Nota adicionada ao histórico do lead na demonstração.");
  if (action === "open-list") {
    const list = state.savedLists.find((item) => item.id === target.dataset.id);
    if (list) {
      state.resultIds = list.ids;
      location.hash = "#/resultados";
    }
  }
  if (action === "export-list") {
    const list = state.savedLists.find((item) => item.id === target.dataset.id);
    if (list) exportCsv(list.ids.map(findCompany).filter(Boolean), `${slug(list.nome)}.csv`);
  }
  if (action === "list-to-crm") {
    const list = state.savedLists.find((item) => item.id === target.dataset.id);
    if (list) {
      list.ids.map(findCompany).filter(Boolean).forEach((company) => {
        if (company.status === "Novo lead") company.status = "Contatado";
      });
      await syncLeadsWithCrm(list.ids.map(findCompany).filter(Boolean));
      location.hash = "#/crm";
    }
  }
  if (action === "bulk-list-message") {
    const list = state.savedLists.find((item) => item.id === target.dataset.id);
    const first = list?.ids.map(findCompany).filter(Boolean)[0] || state.companies[0];
    location.hash = `#/gerador?company=${first.id}`;
  }
  if (action === "create-template-list") {
    const name = target.dataset.name;
    state.savedLists.push({
      id: slug(name),
      nome: name,
      ids: state.companies.slice(0, 5).map((company) => company.id),
      createdAt: "2026-06-27",
      filters: "Modelo de lista criado na demonstração",
    });
    showToast("Lista modelo criada.");
    render();
  }
  if (action === "mock") showToast("Ação simulada no protótipo.");
  if (action === "open-history") {
    state.resultIds = state.companies.map((company) => company.id);
    location.hash = "#/resultados";
  }
}

async function handleSubmit(event) {
  if (event.target.matches("[data-auth-form]")) {
    event.preventDefault();
    location.hash = "#/dashboard";
    return;
  }
  if (event.target.id === "searchForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    const filters = Object.fromEntries(form.entries());
    document.querySelectorAll("#searchForm input[type='checkbox']").forEach((input) => {
      filters[input.name] = input.checked;
    });
    state.filters = filters;
    let results = [];
    let source = "demo local";
    if (state.api.connected) {
      try {
        const response = await apiSearchCompanies(filters);
        if (Array.isArray(response.companies) && response.companies.length) {
          const incoming = response.companies.map(enrichCompany);
          mergeCompanies(incoming);
          results = incoming;
          source = response.source || "API";
        } else {
          results = filterCompanies(filters);
          source = response.notice || "API sem base configurada; usando demo local";
        }
      } catch (error) {
        results = filterCompanies(filters);
        source = `API indisponível; usando demo local (${error.message})`;
      }
    } else {
      results = filterCompanies(filters);
    }
    state.resultIds = results.map((company) => company.id);
    state.history.unshift(historyLabel(filters, results.length));
    state.history = state.history.slice(0, 8);
    showToast(`${results.length} empresas encontradas. Fonte: ${source}.`);
    location.hash = "#/resultados";
  }
  if (event.target.id === "cnpjLookupForm") {
    event.preventDefault();
    const cnpj = new FormData(event.target).get("cnpj");
    await lookupAndAddCnpj(cnpj);
  }
  if (event.target.id === "generatorForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    await generateMessageFromApi(form.get("company"), form.get("channel"), form.get("offer"));
  }
}

function handleChange(event) {
  if (event.target.matches("[data-action='change-status']")) {
    const company = findCompany(event.target.dataset.id);
    if (company) {
      company.status = event.target.value;
      showToast(`Status atualizado: ${company.fantasia} agora está em ${company.status}.`);
      apiSaveStatus(company);
    }
  }
}

function handleDragStart(event) {
  const card = event.target.closest(".lead-card");
  if (!card) return;
  event.dataTransfer.setData("text/plain", card.dataset.id);
}

function handleDragOver(event) {
  if (event.target.closest(".kanban-column")) event.preventDefault();
}

function handleDrop(event) {
  const column = event.target.closest(".kanban-column");
  if (!column) return;
  event.preventDefault();
  const id = event.dataTransfer.getData("text/plain");
  const company = findCompany(id);
  if (company) {
    company.status = column.dataset.stage;
    showToast(`${company.fantasia} movido para ${company.status}.`);
    render();
  }
}

function filterCompanies(filters) {
  return state.companies.filter((company) => {
    if (filters.estado && filters.estado !== "BR" && company.estado !== filters.estado) return false;
    if (filters.cidade && !contains(company.cidade, filters.cidade)) return false;
    if (filters.bairro && !contains(company.bairro, filters.bairro)) return false;
    if (filters.cnae && !contains(`${company.cnae} ${company.cnaesSecundarios}`, filters.cnae)) return false;
    if (filters.cnaeSecundarios && !contains(company.cnaesSecundarios, filters.cnaeSecundarios)) return false;
    if (filters.segmento && company.segmento !== filters.segmento) return false;
    if (filters.porte && company.porte !== filters.porte) return false;
    if (filters.capitalMin && company.capital < Number(filters.capitalMin)) return false;
    if (filters.capitalMax && company.capital > Number(filters.capitalMax)) return false;
    if (filters.tempo && !matchesAge(company.idadeMeses, filters.tempo)) return false;
    if (filters.situacao && company.situacao !== filters.situacao) return false;
    if (filters.matriz && company.matriz !== filters.matriz) return false;
    if (filters.scorePotencialMin && company.scorePotencial < Number(filters.scorePotencialMin)) return false;
    if (filters.scoreContatoMin && company.scoreContato < Number(filters.scoreContatoMin)) return false;
    if (filters.telefone && !company.telefone) return false;
    if (filters.whatsapp && !company.whatsapp) return false;
    if (filters.email && !company.email) return false;
    if (filters.site && !company.site) return false;
    if (filters.instagram && !company.instagram) return false;
    if (filters.googleMaps && !company.googleMaps) return false;
    if (filters.semDigital && company.presencaDigital) return false;
    if (filters.socio && !company.socios.length) return false;
    if (filters.contatoForte && company.scoreContato < 71) return false;
    if (filters.altoPotencial && company.scorePotencial < 71) return false;
    if (filters.altoContato && company.scoreContato < 71) return false;
    return true;
  });
}

function mergeCompanies(companies) {
  companies.forEach((company) => {
    const index = state.companies.findIndex((item) => item.id === company.id || (item.cnpj && company.cnpj && item.cnpj === company.cnpj));
    if (index >= 0) {
      state.companies[index] = { ...state.companies[index], ...company };
    } else {
      state.companies.unshift(company);
    }
  });
}

async function lookupAndAddCnpj(cnpj) {
  if (!state.api.connected) {
    showToast("Abra o app pelo servidor Node para consultar CNPJ real via API.");
    return;
  }
  try {
    showToast("Consultando CNPJ em fonte pública...");
    const response = await apiLookupCnpj(cnpj);
    const company = enrichCompany(response.company);
    mergeCompanies([company]);
    state.resultIds = [company.id];
    showToast(`${company.fantasia} adicionada à base via ${response.provider || response.source}.`);
    location.hash = `#/empresa/${company.id}`;
  } catch (error) {
    showToast(`Não foi possível consultar o CNPJ: ${error.message}`);
  }
}

async function syncLeadsWithCrm(leads) {
  if (!leads.length) return;
  if (!state.api.connected) {
    showToast(`${leads.length} lead(s) marcados no CRM local do navegador.`);
    return;
  }
  try {
    const response = await apiSyncCrm(leads);
    showToast(`${response.count || leads.length} lead(s) enviados ao CRM. Fonte: ${response.source}.`);
  } catch (error) {
    showToast(`CRM externo indisponível. Mantive no funil local: ${error.message}`);
  }
}

async function enrichCompanyContacts(id) {
  const company = findCompany(id);
  if (!company) return;
  if (!state.api.connected) {
    showToast("Backend não conectado. Mantendo contatos já encontrados na demonstração.");
    return;
  }
  try {
    const response = await apiEnrichContacts(company);
    if (response.company) {
      const enriched = enrichCompany({ ...company, ...response.company });
      mergeCompanies([enriched]);
    }
    showToast(response.contacts?.length ? `${response.contacts.length} contato(s) retornados pela API de enriquecimento.` : response.notice || "Nenhum novo contato retornado.");
    render();
  } catch (error) {
    showToast(`Enriquecimento indisponível: ${error.message}`);
  }
}

async function generateMessageFromApi(companyId, channel, offer) {
  const company = findCompany(companyId) || state.companies[0];
  const key = messageCacheKey(company.id, channel, offer);
  const fallback = makeMessage(company, channel, offer);
  location.hash = `#/gerador?company=${company.id}&channel=${channel}&offer=${offer}`;

  if (!state.api.connected) {
    state.generatedMessages[key] = fallback;
    showToast("Backend offline. Mensagem gerada pelo template local.");
    render();
    return;
  }

  try {
    showToast("Gerando abordagem pela API...");
    const response = await apiGenerateMessage(company, channel, offerLabels[offer] || offer);
    state.generatedMessages[key] = response.message || fallback;
    showToast(`Mensagem gerada. Fonte: ${response.source}.`);
    render();
  } catch (error) {
    state.generatedMessages[key] = fallback;
    showToast(`IA indisponível. Usei template local: ${error.message}`);
    render();
  }
}

function messageCacheKey(companyId, channel, offer) {
  return `${companyId}|${channel}|${offer}`;
}

function matchesAge(months, label) {
  if (label === "Menos de 6 meses") return months < 6;
  if (label === "6 a 24 meses") return months >= 6 && months <= 24;
  if (label === "2 a 5 anos") return months > 24 && months <= 60;
  if (label === "Mais de 5 anos") return months > 60;
  return true;
}

function historyLabel(filters, count) {
  const parts = [];
  if (filters.segmento) parts.push(filters.segmento);
  if (filters.cidade) parts.push(filters.cidade);
  if (filters.estado) parts.push(filters.estado);
  if (filters.whatsapp) parts.push("com WhatsApp");
  if (filters.semDigital) parts.push("sem presença digital");
  if (filters.altoPotencial) parts.push("alto potencial");
  return `${parts.length ? parts.join(" · ") : "Busca ampla"} (${count} empresas)`;
}

function saveCurrentList() {
  const name = prompt("Nome da lista salva:", "Nova lista de prospecção");
  if (!name) return;
  const ids = currentResults().map((company) => company.id);
  state.savedLists.unshift({
    id: `${slug(name)}-${Date.now()}`,
    nome: name,
    ids,
    createdAt: "2026-06-27",
    filters: state.history[0] || "Filtros atuais",
  });
  showToast(`Lista "${name}" salva com ${ids.length} empresas.`);
  render();
}

function currentResults() {
  const ids = state.resultIds.length ? state.resultIds : state.companies.map((company) => company.id);
  return ids.map(findCompany).filter(Boolean);
}

function findCompany(id) {
  return state.companies.find((company) => company.id === id);
}

function makeMessage(company, channel, offerKey) {
  const offer = offerLabels[offerKey] || "soluções comerciais";
  const digital = company.presencaDigital
    ? "vi que vocês já têm alguns canais digitais ativos"
    : "percebi que há oportunidade para fortalecer a presença digital";
  const opportunity = company.site
    ? "melhorar a captação e o acompanhamento dos contatos comerciais"
    : "criar uma estrutura simples para transformar buscas locais em oportunidades comerciais";

  if (channel === "email") {
    return `Assunto: Ideia rápida para ${company.fantasia}\n\nOlá, tudo bem?\n\nEncontrei a ${company.fantasia} em uma busca por empresas de ${company.segmento} em ${company.cidade}/${company.estado}. ${digital} e notei espaço para ${opportunity}.\n\nTrabalho com ${offer} para empresas B2B e negócios locais. Posso te enviar uma análise curta com 2 ou 3 oportunidades práticas para a ${company.fantasia}?\n\nObrigado.`;
  }
  if (channel === "ligacao") {
    return `Roteiro de ligação:\n\nOlá, tudo bem? Aqui é da equipe comercial. Encontrei a ${company.fantasia} em uma análise de empresas de ${company.segmento} em ${company.cidade}. A ligação é rápida: eu queria validar se faz sentido enviar uma ideia sobre ${offer} para melhorar ${opportunity}. Quem seria a melhor pessoa para receber essa análise?`;
  }
  if (channel === "instagram") {
    return `Olá, tudo bem? Encontrei a ${company.fantasia} buscando empresas de ${company.segmento} em ${company.cidade}. Vi uma oportunidade para ${offer} e captação local. Posso mandar uma análise rápida com algumas ideias para vocês?`;
  }
  if (channel === "linkedin") {
    return `Olá. Vi que a ${company.fantasia} atua em ${company.cidade}/${company.estado} no segmento de ${company.segmento}. Tenho trabalhado com ${offer} para empresas com perfil parecido e identifiquei uma oportunidade de ${opportunity}. Posso compartilhar uma análise breve?`;
  }
  return `Olá, tudo bem? Vi que a ${company.fantasia} atua em ${company.cidade} no segmento de ${company.segmento}. ${digital}, mas também existem oportunidades para ${opportunity}. Trabalho ajudando empresas locais com ${offer} e atendimento comercial. Posso te mostrar rapidamente uma ideia?`;
}

function exportCsv(rows, filename) {
  const headers = exportHeaders();
  const lines = [headers.join(";")].concat(
    rows.map((company) =>
      [
        company.scorePotencial,
        company.scoreContato,
        company.scoreFinal,
        company.classFinal,
        company.razao,
        company.fantasia,
        company.cnpj,
        company.cidade,
        company.estado,
        company.bairro,
        company.segmento,
        company.cnae,
        company.porte,
        money(company.capital),
        company.situacao,
        company.socios[0]?.nome || "",
        company.telefone,
        company.telefone2,
        company.whatsapp,
        company.email,
        company.site,
        company.instagram,
        company.googleMaps,
        company.telefoneResponsavelPublico,
        company.fonteContato,
        trustBySource(company.fonteContato, company.fonteOficial ? "Alta confiança" : "Baixa confiança"),
        company.status,
        company.mensagemSugerida,
      ]
        .map(csvCell)
        .join(";")
    )
  );
  const blob = new Blob([`\ufeff${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV gerado com dados fictícios e campos de score, fonte e confiança.");
}

function exportHeaders() {
  return [
    "Score de Potencial",
    "Score de Contato",
    "Score Final",
    "Classificação",
    "Razão social",
    "Nome fantasia",
    "CNPJ",
    "Cidade",
    "Estado",
    "Bairro",
    "Segmento",
    "CNAE",
    "Porte",
    "Capital social",
    "Situação cadastral",
    "Nome do sócio/administrador",
    "Telefone da empresa",
    "Telefone secundário",
    "WhatsApp comercial",
    "E-mail",
    "Site",
    "Instagram",
    "Google Maps",
    "Telefone público do responsável, quando encontrado",
    "Fonte do telefone",
    "Nível de confiança",
    "Status no CRM",
    "Mensagem sugerida",
  ];
}

function drawDashboardCharts() {
  const companies = state.companies;
  drawDonut("potentialChart", "Score de Potencial", [
    ["Alto", companies.filter((c) => c.scorePotencial >= 71).length, "#0f9f6e"],
    ["Médio", companies.filter((c) => c.scorePotencial >= 41 && c.scorePotencial <= 70).length, "#d98d16"],
    ["Baixo", companies.filter((c) => c.scorePotencial <= 40).length, "#d94b4b"],
  ]);
  drawDonut("contactChart", "Score de Contato", [
    ["Forte", companies.filter((c) => c.scoreContato >= 71).length, "#0f9f6e"],
    ["Médio", companies.filter((c) => c.scoreContato >= 41 && c.scoreContato <= 70).length, "#d98d16"],
    ["Fraco", companies.filter((c) => c.scoreContato <= 40).length, "#d94b4b"],
  ]);
  drawBars("cityChart", "Leads por cidade", countBy(companies, "cidade"));
  drawBars("segmentChart", "Leads por segmento", countBy(companies, "segmento"));
  drawBars("sizeChart", "Empresas por porte", countBy(companies, "porte"));
  drawBars("statusChart", "Situação cadastral", countBy(companies, "situacao"));
}

function drawDonut(id, title, data) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  const cx = width / 2;
  const cy = height / 2 + 8;
  const radius = Math.min(width, height) / 3.2;
  const total = data.reduce((sum, item) => sum + item[1], 0) || 1;
  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#12324a";
  ctx.font = "800 16px system-ui";
  ctx.fillText(title, 12, 22);
  data.forEach(([label, value, color]) => {
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.lineWidth = 28;
    ctx.strokeStyle = color;
    ctx.stroke();
    start += angle;
  });
  ctx.fillStyle = "#061724";
  ctx.font = "900 28px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(String(total), cx, cy + 7);
  ctx.font = "700 12px system-ui";
  ctx.fillStyle = "#66788a";
  ctx.fillText("leads", cx, cy + 27);
  ctx.textAlign = "left";
  data.forEach(([label, value, color], index) => {
    const x = 14 + index * Math.max(90, width / 3.3);
    const y = height - 20;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 10, 10, 10);
    ctx.fillStyle = "#334455";
    ctx.font = "700 12px system-ui";
    ctx.fillText(`${label}: ${value}`, x + 16, y);
  });
}

function drawBars(id, title, counts) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map((item) => item[1]), 1);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#12324a";
  ctx.font = "800 16px system-ui";
  ctx.fillText(title, 12, 22);
  const chartTop = 42;
  const barHeight = Math.max(18, (height - 70) / Math.max(entries.length, 1) - 8);
  entries.forEach(([label, value], index) => {
    const y = chartTop + index * (barHeight + 8);
    const barWidth = ((width - 150) * value) / max;
    ctx.fillStyle = "#e8f2ff";
    ctx.fillRect(118, y, width - 142, barHeight);
    ctx.fillStyle = index % 2 === 0 ? "#0f9f6e" : "#184768";
    ctx.fillRect(118, y, barWidth, barHeight);
    ctx.fillStyle = "#334455";
    ctx.font = "700 12px system-ui";
    ctx.fillText(shortLabel(label, 14), 12, y + barHeight * 0.68);
    ctx.fillText(String(value), 124 + barWidth, y + barHeight * 0.68);
  });
}

function initHeroCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (heroAnimationFrame) cancelAnimationFrame(heroAnimationFrame);
  if (heroResizeHandler) window.removeEventListener("resize", heroResizeHandler);
  const ctx = canvas.getContext("2d");
  let points = [];
  let mouse = { x: 0.75, y: 0.35 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = Array.from({ length: Math.max(32, Math.floor(rect.width / 32)) }, (_, index) => ({
      x: (index * 73) % rect.width,
      y: (index * 131) % rect.height,
      vx: ((index % 5) - 2) * 0.08,
      vy: ((index % 7) - 3) * 0.06,
      score: 40 + ((index * 17) % 60),
    }));
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#061724";
    ctx.fillRect(0, 0, rect.width, rect.height);
    points.forEach((point) => {
      point.x += point.vx + (mouse.x * rect.width - point.x) * 0.0006;
      point.y += point.vy + (mouse.y * rect.height - point.y) * 0.0004;
      if (point.x < -20) point.x = rect.width + 20;
      if (point.x > rect.width + 20) point.x = -20;
      if (point.y < -20) point.y = rect.height + 20;
      if (point.y > rect.height + 20) point.y = -20;
    });
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.globalAlpha = (150 - dist) / 360;
          ctx.strokeStyle = "#8bd8be";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.score > 70 ? 4.4 : 2.8, 0, Math.PI * 2);
      ctx.fillStyle = point.score > 70 ? "#14b982" : point.score > 50 ? "#86bdf4" : "#d98d16";
      ctx.fill();
    });
    heroAnimationFrame = requestAnimationFrame(draw);
  }

  resize();
  heroResizeHandler = resize;
  window.addEventListener("resize", heroResizeHandler, { passive: true });
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  });
  draw();
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function renderPlansGrid() {
  return `
    <div class="plan-grid">
      ${plans
        .map(
          (plan) => `
          <article class="plan-card ${plan.featured ? "featured" : ""}">
            <div>
              <h3>${plan.name}</h3>
              <p>${plan.description}</p>
            </div>
            <div class="price">${plan.price}${plan.period ? `<small>${plan.period}</small>` : ""}</div>
            <ul class="feature-list">${plan.features.map((featureItem) => `<li>${featureItem}</li>`).join("")}</ul>
            <a class="btn ${plan.featured ? "primary" : ""}" href="#/cadastro">Escolher plano</a>
          </article>`
        )
        .join("")}
    </div>
  `;
}

function legalBlock() {
  return `
    <div class="legal-notice">${LEGAL_SCORE}</div>
    <div class="legal-notice">${LEGAL_CONTACT}</div>
    <div class="legal-notice">${LEGAL_USER}</div>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <a class="brand" href="#/landing"><span class="brand-mark">LS</span><span>LeadScore Empresas</span></a>
        <p>${LEGAL_SCORE}</p>
        <p>${LEGAL_CONTACT}</p>
        <p>${LEGAL_USER}</p>
        <p><a href="#/privacidade">Política de privacidade</a> · <a href="#/termos">Termos de uso</a></p>
      </div>
    </footer>
  `;
}

function feature(icon, title, text) {
  return `<article class="card pad feature"><span class="feature-icon">${icon}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function scoreExplain(title, value, text) {
  return `<article class="card pad feature"><span class="pill high">${value}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function testimonial(role, text) {
  return `<article class="card pad"><h3>${role}</h3><p>“${text}”</p></article>`;
}

function faq(question, answer) {
  return `<article class="card pad"><h3>${question}</h3><p>${answer}</p></article>`;
}

function inputField(label, name, placeholder = "", type = "text") {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${state.filters[name] || ""}"></div>`;
}

function selectField(label, name, options) {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}">
        <option value="">Todos</option>
        ${options.map((option) => `<option value="${option}" ${state.filters[name] === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
  `;
}

function checkboxField(label, name, checked = false) {
  const isChecked = checked || state.filters[name];
  return `<label class="check"><input type="checkbox" name="${name}" ${isChecked ? "checked" : ""}>${label}</label>`;
}

function infoItem(label, value) {
  return `<div class="info-item"><span>${label}</span><strong>${value || "Não localizado"}</strong></div>`;
}

function scoreBadge(score) {
  return `<span class="score ${scoreLevel(score)}">${score}</span>`;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function contains(value, search) {
  return normalize(value).includes(normalize(search));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function dateBR(value) {
  if (!value) return "Não informado";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

function shortLabel(label, max) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function channelLabel(channel) {
  const labels = {
    whatsapp: "WhatsApp",
    email: "E-mail",
    ligacao: "Ligação",
    instagram: "Direct do Instagram",
    linkedin: "LinkedIn",
  };
  return labels[channel] || channel;
}

function yesNo(value) {
  return value ? "sim" : "não";
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeAttr(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function copyCompanyField(id, field) {
  const company = findCompany(id);
  const value = company?.[field];
  if (!value) {
    showToast("Campo não localizado para este lead.");
    return;
  }
  copyText(value);
}

function copyText(value) {
  if (!value) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(value).then(() => showToast("Copiado para a área de transferência."));
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
  showToast("Copiado para a área de transferência.");
}

async function openWhatsApp(company) {
  if (!company?.whatsapp && !company?.telefone) {
    showToast("Nenhum WhatsApp ou telefone localizado para este lead.");
    return;
  }
  const message = state.generatedMessages[messageCacheKey(company.id, "whatsapp", "trafego")] || company.mensagemSugerida || "";
  if (state.api.connected) {
    try {
      const response = await apiPrepareWhatsapp(company, message);
      if (response.link) {
        window.open(response.link, "_blank");
        return;
      }
      showToast(response.message || "WhatsApp processado pela API.");
      return;
    } catch (error) {
      showToast(`API WhatsApp indisponível; abrindo link direto. ${error.message}`);
    }
  }
  const phone = cleanPhone(company.whatsapp || company.telefone);
  window.open(`https://wa.me/55${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`, "_blank");
}

async function openWhatsAppValue(value) {
  const phone = cleanPhone(value);
  if (phone.length < 10) {
    showToast("Este contato não parece ser um telefone.");
    return;
  }
  window.open(`https://wa.me/55${phone}`, "_blank");
}

function cleanPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}
