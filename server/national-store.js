import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const DEFAULT_LIMIT = 250;
const MAX_LIMIT = 2000;

export function nationalDir(rootDir) {
  return process.env.NATIONAL_LEADS_DIR
    ? path.resolve(process.env.NATIONAL_LEADS_DIR)
    : path.join(rootDir, "data", "national-leads");
}

export function nationalStatus(rootDir) {
  const dir = nationalDir(rootDir);
  const files = listJsonlFiles(dir);
  const manifest = readManifest(dir);
  return {
    available: files.length > 0,
    dir,
    files: files.length,
    records: manifest.records || 0,
    importedAt: manifest.importedAt || "",
    source: manifest.source || "",
    mode: files.length > 0 ? "national_jsonl_index" : "empty",
    message: files.length
      ? "Base nacional local pronta para busca."
      : "Base nacional ainda não importada. Use scripts/import-national-leads.js ou configure PARTNER_LEADS_API_URL.",
  };
}

export async function searchNationalLeads(rootDir, filters = {}) {
  const dir = nationalDir(rootDir);
  const files = selectFiles(dir, filters.estado);
  if (!files.length) {
    return {
      ok: true,
      available: false,
      source: "national_jsonl_index",
      companies: [],
      total: 0,
      scanned: 0,
      message: "Nenhum arquivo de índice nacional encontrado.",
    };
  }

  const limit = Math.min(Math.max(Number(filters.limit || filters.limite || DEFAULT_LIMIT), 1), MAX_LIMIT);
  const companies = [];
  let matched = 0;
  let scanned = 0;
  let stoppedByLimit = false;

  for (const file of files) {
    const rl = readline.createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      scanned += 1;
      let company;
      try {
        company = JSON.parse(line);
      } catch {
        continue;
      }
      if (!matchesFilters(company, filters)) continue;
      matched += 1;
      if (companies.length < limit) companies.push(company);
      if (companies.length >= limit && matched >= limit) {
        stoppedByLimit = true;
        rl.close();
        break;
      }
    }

    if (stoppedByLimit) break;
  }

  return {
    ok: true,
    available: true,
    source: "national_jsonl_index",
    companies,
    total: matched,
    scanned,
    limit,
    truncated: stoppedByLimit,
    message: stoppedByLimit
      ? `Retornando os ${companies.length} primeiros leads. Refine os filtros para melhorar precisão.`
      : `${companies.length} lead(s) encontrados na base nacional local.`,
  };
}

export async function importCsvToNationalIndex(rootDir, inputFile, options = {}) {
  const dir = nationalDir(rootDir);
  await mkdir(dir, { recursive: true });

  const delimiter = options.delimiter || ";";
  const source = options.source || inputFile;
  const defaultUf = options.uf || "BR";
  const headers = options.headers || null;
  const writers = new Map();
  let count = 0;
  let skipped = 0;
  let headerRow = headers;

  const rl = readline.createInterface({
    input: createReadStream(inputFile, { encoding: options.encoding || "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const columns = parseCsvLine(line, delimiter);
    if (!headerRow) {
      headerRow = columns.map((item) => normalizeHeader(item));
      continue;
    }

    const row = {};
    headerRow.forEach((header, index) => {
      row[header] = columns[index] || "";
    });

    const company = normalizeCsvCompany(row, defaultUf);
    if (!company.cnpj && !company.razao && !company.fantasia) {
      skipped += 1;
      continue;
    }

    const uf = sanitizeShard(company.estado || defaultUf);
    if (!writers.has(uf)) {
      const filePath = path.join(dir, `${uf}.jsonl`);
      writers.set(uf, createShardWriter(filePath));
    }
    writers.get(uf).write(`${JSON.stringify(company)}\n`);
    count += 1;
  }

  await Promise.all([...writers.values()].map((writer) => writer.end()));
  const manifest = {
    importedAt: new Date().toISOString(),
    records: count,
    skipped,
    source,
    dir,
  };
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

function createShardWriter(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const stream = createWriteStream(filePath, { flags: "w", encoding: "utf8" });
  return {
    write(value) {
      stream.write(value);
    },
    end() {
      return new Promise((resolve, reject) => {
        stream.end(resolve);
        stream.on("error", reject);
      });
    },
  };
}

function listJsonlFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(dir, file))
    .filter((file) => statSync(file).isFile());
}

function selectFiles(dir, uf) {
  const files = listJsonlFiles(dir);
  const state = String(uf || "").toUpperCase();
  if (!state || state === "BR" || state === "TODOS") return files;
  const exact = path.join(dir, `${sanitizeShard(state)}.jsonl`);
  return existsSync(exact) ? [exact] : files;
}

function readManifest(dir) {
  const file = path.join(dir, "manifest.json");
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function matchesFilters(company, filters) {
  if (filters.estado && filters.estado !== "BR" && normalize(company.estado) !== normalize(filters.estado)) return false;
  if (filters.cidade && !contains(company.cidade, filters.cidade)) return false;
  if (filters.bairro && !contains(company.bairro, filters.bairro)) return false;
  if (filters.cnae && !contains(`${company.cnae} ${company.cnaesSecundarios}`, filters.cnae)) return false;
  if (filters.cnaeSecundarios && !contains(company.cnaesSecundarios, filters.cnaeSecundarios)) return false;
  if (filters.segmento && !contains(company.segmento, filters.segmento)) return false;
  if (filters.porte && !contains(company.porte, filters.porte)) return false;
  if (filters.capitalMin && Number(company.capital || 0) < Number(filters.capitalMin)) return false;
  if (filters.capitalMax && Number(company.capital || 0) > Number(filters.capitalMax)) return false;
  if (filters.situacao && !contains(company.situacao, filters.situacao)) return false;
  if (filters.matriz && !contains(company.matriz, filters.matriz)) return false;
  if (filters.telefone && !company.telefone) return false;
  if (filters.whatsapp && !company.whatsapp) return false;
  if (filters.email && !company.email) return false;
  if (filters.site && !company.site) return false;
  if (filters.instagram && !company.instagram) return false;
  if (filters.googleMaps && !company.googleMaps) return false;
  if (filters.socio && !(company.socios || []).length) return false;
  return true;
}

function normalizeCsvCompany(row, defaultUf) {
  const cnpj = row.cnpj || row.documento || row.cnpj_completo || joinCnpj(row);
  const fantasia = row.fantasia || row.nome_fantasia || row.nomefantasia || row.nome || "";
  const razao = row.razao || row.razao_social || row.razaosocial || row.nome_empresarial || fantasia;
  const cidade = row.cidade || row.municipio || row.nome_municipio || "";
  const estado = (row.estado || row.uf || defaultUf || "").toUpperCase();
  const telefone = row.telefone || row.telefone1 || joinPhone(row.ddd_1 || row.ddd, row.telefone_1 || row.telefone1);
  const telefone2 = row.telefone2 || joinPhone(row.ddd_2, row.telefone_2 || row.telefone2);
  const socios = row.socio || row.socios || row.nome_socio ? [{ nome: row.socio || row.socios || row.nome_socio, qualificacao: row.qualificacao_socio || "Sócio/administrador" }] : [];

  return {
    id: `national-${digits(cnpj) || slug(`${razao}-${cidade}-${estado}`)}`,
    fantasia: fantasia || razao,
    razao,
    cnpj: formatCnpj(cnpj),
    cidade,
    estado,
    bairro: row.bairro || "",
    cnae: row.cnae || row.cnae_principal || row.cnae_fiscal || "",
    cnaesSecundarios: row.cnaes_secundarios || row.cnae_secundario || "",
    segmento: row.segmento || row.cnae_descricao || row.atividade || "",
    porte: row.porte || "",
    capital: parseMoney(row.capital || row.capital_social || row.capital_social_minimo || 0),
    abertura: normalizeDate(row.abertura || row.data_abertura || row.data_inicio_atividade || ""),
    situacao: row.situacao || row.situacao_cadastral || "Ativa",
    matriz: row.matriz || row.matriz_filial || "",
    filiais: Number(row.filiais || 0),
    natureza: row.natureza || row.natureza_juridica || "",
    endereco: row.endereco || [row.tipo_logradouro, row.logradouro, row.numero].filter(Boolean).join(" "),
    cep: row.cep || "",
    telefone,
    telefone2,
    whatsapp: row.whatsapp || row.whatsapp_comercial || "",
    email: row.email || row.email_empresarial || "",
    site: row.site || row.website || "",
    instagram: row.instagram || "",
    facebook: row.facebook || "",
    linkedin: row.linkedin || "",
    googleMaps: row.google_maps || row.googlemaps || "",
    socios,
    responsavelComercial: row.responsavel_comercial || "",
    telefoneResponsavelPublico: row.telefone_responsavel_publico || "",
    fonteContato: row.fonte || row.fonte_contato || "Base nacional importada",
    fonteOficial: truthy(row.fonte_oficial) || true,
    contatoValidado: truthy(row.contato_validado),
    lastVerified: row.data_verificacao || new Date().toISOString().slice(0, 10),
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Priorizar por score e validar canal comercial",
    dono: "Equipe Comercial",
    valorEstimado: 0,
    oportunidade: row.oportunidade || "Lead localizado na base nacional. Validar contatos e presença digital antes da abordagem.",
  };
}

function parseCsvLine(line, delimiter) {
  const out = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      out.push(value);
      value = "";
      continue;
    }
    value += char;
  }
  out.push(value);
  return out;
}

function normalizeHeader(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
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

function sanitizeShard(value) {
  return String(value || "BR").toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function joinCnpj(row) {
  const base = row.cnpj_basico || row.cnpjbase || "";
  const ordem = row.cnpj_ordem || row.cnpjordem || "";
  const dv = row.cnpj_dv || row.cnpjdv || "";
  return `${base}${ordem}${dv}`;
}

function joinPhone(ddd, phone) {
  const raw = `${digits(ddd)}${digits(phone)}`;
  if (!raw) return "";
  return raw.length >= 10 ? `(${raw.slice(0, 2)}) ${raw.slice(2)}` : raw;
}

function formatCnpj(value) {
  const cnpj = digits(value);
  if (cnpj.length !== 14) return String(value || "");
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  const normalized = String(value || "0").replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return `${raw.slice(6)}-${raw.slice(3, 5)}-${raw.slice(0, 2)}`;
  return raw;
}

function truthy(value) {
  return ["1", "true", "sim", "yes", "s"].includes(normalize(value));
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
