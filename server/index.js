import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nationalStatus, searchNationalLeads } from "./national-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "outputs");
const runtimeDir = path.join(rootDir, "work");
const runtimeFile = path.join(runtimeDir, "leadscore-runtime.json");

loadEnv();

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

const runtime = await loadRuntime();

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, {
      ok: false,
      error: "internal_error",
      message: "Erro interno na API LeadScore.",
      detail: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LeadScore Empresas rodando em http://${HOST}:${PORT}`);
});

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, healthPayload());
  }

  if (url.pathname === "/api/config" && req.method === "GET") {
    return sendJson(res, 200, publicConfig());
  }

  if (url.pathname === "/api/national/status" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, national: nationalStatus(rootDir) });
  }

  if (url.pathname === "/api/leads/search" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await searchLeads(body.filters || {}));
  }

  if (url.pathname.startsWith("/api/cnpj/") && req.method === "GET") {
    const cnpj = url.pathname.replace("/api/cnpj/", "");
    return sendJson(res, 200, await lookupCnpj(cnpj));
  }

  if (url.pathname === "/api/contacts/enrich" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await enrichContacts(body.company));
  }

  if (url.pathname === "/api/approach/generate" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await generateApproach(body));
  }

  if (url.pathname === "/api/crm/sync" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await syncCrm(body.leads || []));
  }

  if (url.pathname === "/api/whatsapp/contact" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await prepareWhatsapp(body));
  }

  if (url.pathname === "/api/runtime/status" && req.method === "POST") {
    const body = await readJson(req);
    return sendJson(res, 200, await saveLeadStatus(body));
  }

  return serveStatic(url, res);
}

async function searchLeads(filters) {
  const entitlement = planEntitlement();
  const effectiveFilters = {
    ...filters,
    limit: Math.min(Number(filters.limit || entitlement.maxSearchResults), entitlement.maxSearchResults),
  };
  const national = nationalStatus(rootDir);
  if (national.available && !process.env.FORCE_PARTNER_LEADS_API) {
    const response = await searchNationalLeads(rootDir, effectiveFilters);
    return {
      ...response,
      plan: entitlement.public,
      provider: "Base nacional local",
      notice: response.message,
    };
  }

  if (process.env.PARTNER_LEADS_API_URL) {
    const partnerResponse = await partnerPost(process.env.PARTNER_LEADS_API_URL, { filters: effectiveFilters }, "PARTNER_LEADS_API_KEY");
    const companies = normalizeCompanies(partnerResponse.companies || partnerResponse.data || partnerResponse.results || []);
    return {
      ok: true,
      source: "partner_leads_api",
      provider: safeHost(process.env.PARTNER_LEADS_API_URL),
      companies: companies.slice(0, entitlement.maxSearchResults),
      total: Math.min(companies.length, entitlement.maxSearchResults),
      plan: entitlement.public,
      notice: "Resultados retornados pela API parceira configurada.",
    };
  }

  return {
    ok: true,
    source: "browser_demo_fallback",
    companies: [],
    total: 0,
    plan: entitlement.public,
    notice: "A base nacional ainda não foi importada e nenhuma API parceira foi configurada. O navegador usará a base demo local.",
    nextStep: "Importe a base nacional com npm.cmd run import:receita-estab ou configure PARTNER_LEADS_API_URL e PARTNER_LEADS_API_KEY.",
  };
}

async function lookupCnpj(rawCnpj) {
  const cnpj = digits(rawCnpj);
  if (cnpj.length !== 14) {
    return {
      ok: false,
      error: "invalid_cnpj",
      message: "Informe um CNPJ com 14 dígitos.",
    };
  }

  const provider = process.env.CNPJ_PROVIDER || "brasilapi";

  if (provider === "partner" && process.env.PARTNER_CNPJ_API_URL) {
    const endpoint = process.env.PARTNER_CNPJ_API_URL.replace("{cnpj}", cnpj);
    const data = await partnerGet(endpoint, "PARTNER_CNPJ_API_KEY");
    return {
      ok: true,
      source: "partner_cnpj_api",
      provider: safeHost(endpoint),
      company: normalizeCompany(data),
    };
  }

  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "LeadScoreEmpresas/1.0 contato-comercial",
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      error: "cnpj_lookup_failed",
      provider: "brasilapi",
      message: data.message || "Não foi possível consultar este CNPJ agora.",
    };
  }

  return {
    ok: true,
    source: "brasilapi",
    provider: "BrasilAPI CNPJ",
    company: normalizeBrasilApiCompany(data),
    raw: process.env.RETURN_RAW_API === "true" ? data : undefined,
  };
}

async function enrichContacts(company) {
  if (process.env.CONTACT_ENRICHMENT_API_URL) {
    const providerResponse = await partnerPost(process.env.CONTACT_ENRICHMENT_API_URL, { company }, "CONTACT_ENRICHMENT_API_KEY");
    return {
      ok: true,
      source: "contact_enrichment_api",
      provider: safeHost(process.env.CONTACT_ENRICHMENT_API_URL),
      contacts: providerResponse.contacts || providerResponse.data || [],
      company: normalizeCompany(providerResponse.company || company),
    };
  }

  return {
    ok: true,
    source: "local_contact_rules",
    contacts: [],
    notice: "Sem API de enriquecimento configurada. Mantendo contatos públicos já disponíveis na empresa.",
    nextStep: "Configure CONTACT_ENRICHMENT_API_URL para bases parceiras com uso permitido.",
  };
}

async function generateApproach(body) {
  const company = body.company || {};
  const channel = body.channel || "whatsapp";
  const offer = body.offer || "soluções comerciais";

  if (process.env.OPENAI_API_KEY) {
    const prompt = [
      "Gere uma abordagem comercial B2B em português do Brasil.",
      "Use tom profissional, consultivo e direto.",
      "Não prometa faturamento real, dados fiscais oficiais ou telefone pessoal privado.",
      "Use apenas termos como potencial comercial, contato empresarial e fonte pública quando aplicável.",
      "",
      `Canal: ${channel}`,
      `Oferta: ${offer}`,
      `Empresa: ${company.fantasia || company.nomeFantasia || company.razao || "empresa"}`,
      `Segmento: ${company.segmento || company.cnae || "segmento informado"}`,
      `Cidade/UF: ${company.cidade || ""}/${company.estado || ""}`,
      `Porte: ${company.porte || "não informado"}`,
      `Presença digital: ${company.presencaDigital ? "possui sinais digitais" : "sem presença digital aparente"}`,
      `Oportunidade: ${company.oportunidade || company.analiseOportunidade || "melhorar captação e atendimento comercial"}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        temperature: 0.5,
        max_output_tokens: 520,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        ok: true,
        source: "openai",
        model: data.model || process.env.OPENAI_MODEL || "configured_model",
        message: extractOpenAiText(data),
      };
    }

    return {
      ok: true,
      source: "template_fallback",
      warning: data.error?.message || "OpenAI indisponível. Mensagem gerada pelo template local.",
      message: templateApproach(company, channel, offer),
    };
  }

  return {
    ok: true,
    source: "template_fallback",
    message: templateApproach(company, channel, offer),
    nextStep: "Configure OPENAI_API_KEY para geração com IA em produção.",
  };
}

async function syncCrm(leads) {
  const normalized = normalizeCompanies(leads);

  if (process.env.CRM_WEBHOOK_URL) {
    const response = await partnerPost(process.env.CRM_WEBHOOK_URL, { leads: normalized }, "CRM_WEBHOOK_KEY");
    return {
      ok: true,
      source: "crm_webhook",
      provider: safeHost(process.env.CRM_WEBHOOK_URL),
      count: normalized.length,
      response,
    };
  }

  runtime.crm = runtime.crm || [];
  const now = new Date().toISOString();
  normalized.forEach((lead) => {
    runtime.crm.push({ ...lead, syncedAt: now });
  });
  await persistRuntime();

  return {
    ok: true,
    source: "local_runtime_store",
    count: normalized.length,
    notice: "Sem CRM_WEBHOOK_URL configurado. Leads gravados no runtime local para demonstração.",
  };
}

async function prepareWhatsapp(body) {
  const phone = digits(body.phone || body.company?.whatsapp || body.company?.telefone || "");
  const message = body.message || "";

  if (!phone) {
    return {
      ok: false,
      error: "missing_phone",
      message: "Nenhum telefone comercial foi informado.",
    };
  }

  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && body.send === true) {
    const version = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
    const response = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.startsWith("55") ? phone : `55${phone}`,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      source: "whatsapp_cloud_api",
      response: data,
      message: response.ok ? "Mensagem enviada pela API oficial do WhatsApp Cloud." : data.error?.message || "Falha ao enviar WhatsApp.",
    };
  }

  return {
    ok: true,
    source: "wa_me_link",
    link: `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    notice: "API oficial do WhatsApp não configurada ou envio automático não solicitado. Use o link comercial.",
  };
}

async function saveLeadStatus(body) {
  const id = body.id || body.cnpj;
  if (!id) {
    return { ok: false, error: "missing_id", message: "Informe id ou CNPJ do lead." };
  }

  runtime.status = runtime.status || {};
  runtime.status[id] = {
    status: body.status,
    updatedAt: new Date().toISOString(),
  };
  await persistRuntime();
  return { ok: true, id, status: body.status };
}

function healthPayload() {
  const national = nationalStatus(rootDir);
  const entitlement = planEntitlement();
  return {
    ok: true,
    app: "LeadScore Empresas",
    environment: process.env.NODE_ENV || "development",
    providers: {
      cnpj: process.env.CNPJ_PROVIDER || "brasilapi",
      leadSearch: national.available ? "national_jsonl_index" : process.env.PARTNER_LEADS_API_URL ? "partner" : "browser_demo_fallback",
      contacts: process.env.CONTACT_ENRICHMENT_API_URL ? "partner" : "local_contact_rules",
      ai: process.env.OPENAI_API_KEY ? "openai" : "template_fallback",
      crm: process.env.CRM_WEBHOOK_URL ? "webhook" : "local_runtime_store",
      whatsapp: process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID ? "whatsapp_cloud_api" : "wa_me_link",
    },
    legal: {
      noRevenueClaim: true,
      noPrivatePhoneClaim: true,
      lgpdReminder: true,
    },
    plan: entitlement.public,
  };
}

function publicConfig() {
  const health = healthPayload();
  const national = nationalStatus(rootDir);
  return {
    ok: true,
    providers: health.providers,
    configured: {
      partnerLeadSearch: Boolean(process.env.PARTNER_LEADS_API_URL),
      partnerCnpj: Boolean(process.env.PARTNER_CNPJ_API_URL),
      contactEnrichment: Boolean(process.env.CONTACT_ENRICHMENT_API_URL),
      openAi: Boolean(process.env.OPENAI_API_KEY),
      crmWebhook: Boolean(process.env.CRM_WEBHOOK_URL),
      whatsappCloud: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    },
    national,
    plan: health.plan,
  };
}

function planEntitlement() {
  const level = String(process.env.PLAN_LEVEL || "agency").toLowerCase();
  const levels = {
    basic: { name: "Básico", maxSearchResults: 100, monthlyQueries: 500, exportEnabled: true, enrichmentEnabled: false },
    pro: { name: "Pro", maxSearchResults: 500, monthlyQueries: 3000, exportEnabled: true, enrichmentEnabled: true },
    agency: { name: "Agência", maxSearchResults: 2000, monthlyQueries: 15000, exportEnabled: true, enrichmentEnabled: true },
    enterprise: { name: "Enterprise", maxSearchResults: 10000, monthlyQueries: null, exportEnabled: true, enrichmentEnabled: true },
  };
  const selected = levels[level] || levels.agency;
  return {
    ...selected,
    public: {
      level,
      name: selected.name,
      maxSearchResults: selected.maxSearchResults,
      monthlyQueries: selected.monthlyQueries,
      exportEnabled: selected.exportEnabled,
      enrichmentEnabled: selected.enrichmentEnabled,
    },
  };
}

async function partnerGet(url, keyName) {
  const headers = { accept: "application/json" };
  if (process.env[keyName]) headers.authorization = `Bearer ${process.env[keyName]}`;
  const response = await fetch(url, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Falha ao consultar ${safeHost(url)}`);
  return data;
}

async function partnerPost(url, payload, keyName) {
  const headers = { accept: "application/json", "content-type": "application/json" };
  if (process.env[keyName]) headers.authorization = `Bearer ${process.env[keyName]}`;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Falha ao consultar ${safeHost(url)}`);
  return data;
}

function normalizeBrasilApiCompany(data) {
  const cnae = data.cnae_fiscal ? String(data.cnae_fiscal) : "";
  const socios = Array.isArray(data.qsa)
    ? data.qsa.map((item) => ({
        nome: item.nome_socio || item.nome || "",
        qualificacao: item.qualificacao_socio || item.qualificacao || "Sócio/administrador",
      }))
    : [];

  return normalizeCompany({
    id: `cnpj-${digits(data.cnpj)}`,
    fantasia: data.nome_fantasia || data.razao_social,
    razao: data.razao_social,
    cnpj: formatCnpj(data.cnpj),
    cidade: titleCase(data.municipio),
    estado: data.uf,
    bairro: titleCase(data.bairro),
    cnae,
    cnaesSecundarios: Array.isArray(data.cnaes_secundarios)
      ? data.cnaes_secundarios.map((item) => item.descricao || item.codigo).join(", ")
      : "",
    segmento: data.cnae_fiscal_descricao || "Segmento CNPJ",
    porte: normalizePorte(data.porte),
    capital: Number(data.capital_social || 0),
    abertura: data.data_inicio_atividade,
    situacao: titleCase(data.descricao_situacao_cadastral || data.situacao_cadastral || ""),
    matriz: data.descricao_identificador_matriz_filial || "Matriz",
    natureza: data.natureza_juridica || data.codigo_natureza_juridica || "",
    endereco: [data.logradouro, data.numero, data.complemento].filter(Boolean).join(", "),
    cep: data.cep,
    telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : "",
    telefone2: data.ddd_telefone_2 ? `(${data.ddd_telefone_2.slice(0, 2)}) ${data.ddd_telefone_2.slice(2)}` : "",
    whatsapp: "",
    email: data.email || "",
    site: "",
    instagram: "",
    googleMaps: "",
    socios,
    fonteContato: "Dados públicos do CNPJ via BrasilAPI",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: new Date().toISOString().slice(0, 10),
    oportunidade: "Empresa localizada em consulta pública de CNPJ. Enriquecer presença digital e contatos comerciais antes de priorizar abordagem.",
  });
}

function normalizeCompanies(items) {
  return items.map(normalizeCompany).filter((item) => item.razao || item.fantasia || item.cnpj);
}

function normalizeCompany(input = {}) {
  const company = {
    id: input.id || input.cnpj || input.documento || cryptoSafeId(input.razao || input.fantasia || "lead"),
    fantasia: input.fantasia || input.nomeFantasia || input.nome_fantasia || input.name || input.razao || input.razao_social || "",
    razao: input.razao || input.razaoSocial || input.razao_social || input.legalName || input.fantasia || "",
    cnpj: input.cnpj ? formatCnpj(input.cnpj) : "",
    cidade: input.cidade || input.city || "",
    estado: input.estado || input.uf || input.state || "",
    bairro: input.bairro || input.district || "",
    cnae: input.cnae || input.cnaePrincipal || input.cnae_fiscal || "",
    cnaesSecundarios: input.cnaesSecundarios || input.secondaryCnaes || "",
    segmento: input.segmento || input.segment || input.cnaeDescricao || input.cnae_fiscal_descricao || "",
    porte: normalizePorte(input.porte || input.size),
    capital: Number(input.capital || input.capitalSocial || input.capital_social || 0),
    abertura: input.abertura || input.dataAbertura || input.data_inicio_atividade || "",
    situacao: titleCase(input.situacao || input.situacaoCadastral || input.descricao_situacao_cadastral || ""),
    matriz: input.matriz || input.matrizFilial || input.descricao_identificador_matriz_filial || "Matriz",
    filiais: Number(input.filiais || 0),
    natureza: input.natureza || input.naturezaJuridica || input.natureza_juridica || "",
    endereco: input.endereco || input.address || "",
    cep: input.cep || "",
    telefone: input.telefone || input.phone || "",
    telefone2: input.telefone2 || input.phone2 || "",
    whatsapp: input.whatsapp || "",
    email: input.email || "",
    site: input.site || input.website || "",
    instagram: input.instagram || "",
    facebook: input.facebook || "",
    linkedin: input.linkedin || "",
    googleMaps: input.googleMaps || input.maps || "",
    socios: Array.isArray(input.socios)
      ? input.socios
      : Array.isArray(input.qsa)
        ? input.qsa.map((item) => ({ nome: item.nome_socio || item.nome || "", qualificacao: item.qualificacao_socio || item.qualificacao || "" }))
        : [],
    responsavelComercial: input.responsavelComercial || input.commercialOwner || "",
    telefoneResponsavelPublico: input.telefoneResponsavelPublico || "",
    fonteContato: input.fonteContato || input.source || "API configurada",
    fonteOficial: input.fonteOficial ?? true,
    contatoValidado: input.contatoValidado ?? true,
    lastVerified: input.lastVerified || new Date().toISOString().slice(0, 10),
    status: input.status || "Novo lead",
    ultimaInteracao: input.ultimaInteracao || "Sem contato",
    proximaAcao: input.proximaAcao || "Validar contatos e priorizar abordagem",
    dono: input.dono || "Equipe Comercial",
    valorEstimado: Number(input.valorEstimado || 0),
    oportunidade: input.oportunidade || input.analiseOportunidade || "",
  };
  return company;
}

function templateApproach(company, channel, offer) {
  const name = company.fantasia || company.nomeFantasia || company.razao || "sua empresa";
  const city = company.cidade ? ` em ${company.cidade}` : "";
  const segment = company.segmento || "seu segmento";
  const digital = company.presencaDigital || company.site || company.instagram
    ? "vi que vocês já têm alguns sinais digitais ativos"
    : "percebi uma oportunidade para fortalecer a presença digital";

  if (channel === "email") {
    return `Assunto: Ideia rápida para ${name}\n\nOlá, tudo bem?\n\nEncontrei a ${name} em uma busca por empresas de ${segment}${city}. ${digital} e acredito que exista espaço para melhorar a captação e o atendimento comercial.\n\nTrabalho com ${offer}. Posso te enviar uma análise curta com 2 ou 3 oportunidades práticas?\n\nObrigado.`;
  }

  if (channel === "ligacao") {
    return `Olá, tudo bem? Encontrei a ${name} em uma análise de empresas de ${segment}${city}. Queria validar quem cuida da parte comercial para enviar uma ideia rápida sobre ${offer} e captação de oportunidades.`;
  }

  return `Olá, tudo bem? Encontrei a ${name} em uma busca por empresas de ${segment}${city}. ${digital} e vi oportunidade para melhorar captação e atendimento comercial com ${offer}. Posso te mostrar rapidamente uma ideia?`;
}

function extractOpenAiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim() || "Não foi possível gerar a mensagem.";
}

async function serveStatic(url, res) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(publicDir, pathname));
  if (!filePath.startsWith(publicDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  const finalPath = existsSync(filePath) ? filePath : path.join(publicDir, "index.html");
  res.writeHead(200, {
    "content-type": contentType(finalPath),
    "cache-control": process.env.NODE_ENV === "production" && !finalPath.endsWith("index.html") ? "public, max-age=3600" : "no-store",
  });
  createReadStream(finalPath).pipe(res);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    ...corsHeaders(),
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,accept",
  };
}

function sendText(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

function loadEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

async function loadRuntime() {
  try {
    if (!existsSync(runtimeFile)) return {};
    return JSON.parse(await readFile(runtimeFile, "utf8"));
  } catch {
    return {};
  }
}

async function persistRuntime() {
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(runtimeFile, JSON.stringify(runtime, null, 2), "utf8");
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCnpj(value) {
  const cnpj = digits(value);
  if (cnpj.length !== 14) return String(value || "");
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function normalizePorte(value) {
  const raw = String(value || "").toUpperCase();
  if (raw.includes("EPP")) return "EPP";
  if (raw.includes("ME") || raw.includes("MICRO")) return "ME";
  if (raw.includes("DEMAIS") || raw.includes("GRANDE") || raw.includes("MEDIO") || raw.includes("MÉDIO")) return "Demais";
  return value || "Não informado";
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function safeHost(rawUrl) {
  try {
    return new URL(rawUrl).host;
  } catch {
    return "configured_provider";
  }
}

function cryptoSafeId(value) {
  return String(value || "lead")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
