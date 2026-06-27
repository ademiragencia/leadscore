#!/usr/bin/env node
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { nationalDir, nationalStatus } from "../server/national-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));

const files = collectFiles(args);
if (!files.length) {
  console.error([
    "Uso:",
    "  node scripts/import-receita-estabelecimentos.js --dir C:\\\\receita\\\\2026-01\\\\extraido --municipios C:\\\\receita\\\\Municipios.csv",
    "  node scripts/import-receita-estabelecimentos.js --file C:\\\\receita\\\\Estabelecimentos0.csv --municipios C:\\\\receita\\\\Municipios.csv",
    "",
    "Este importador usa o layout oficial de Estabelecimentos da Receita Federal.",
    "Ele cria shards JSONL em data/national-leads por UF.",
  ].join("\n"));
  process.exit(1);
}

const outDir = nationalDir(rootDir);
await mkdir(outDir, { recursive: true });

const municipios = args.municipios ? await loadMunicipios(path.resolve(args.municipios), args.encoding || "latin1") : new Map();
const writers = new Map();
let records = 0;
let skipped = 0;

for (const file of files) {
  console.log(`Importando ${file}`);
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding: args.encoding || "latin1" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line, ";");
    const company = normalizeEstabelecimento(fields, municipios);
    if (!company.cnpj || !company.estado) {
      skipped += 1;
      continue;
    }
    const uf = company.estado.toUpperCase();
    if (!writers.has(uf)) {
      writers.set(uf, createWriteStream(path.join(outDir, `${uf}.jsonl`), { flags: "a", encoding: "utf8" }));
    }
    writers.get(uf).write(`${JSON.stringify(company)}\n`);
    records += 1;
  }
}

await Promise.all(
  [...writers.values()].map(
    (writer) =>
      new Promise((resolve, reject) => {
        writer.end(resolve);
        writer.on("error", reject);
      })
  )
);

const manifest = {
  importedAt: new Date().toISOString(),
  records,
  skipped,
  source: "Receita Federal - Estabelecimentos",
  files: files.length,
  dir: outDir,
};
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(JSON.stringify({ manifest, status: nationalStatus(rootDir) }, null, 2));

function collectFiles(options) {
  if (options.file) return [path.resolve(options.file)].filter(existsSync);
  if (!options.dir) return [];
  const dir = path.resolve(options.dir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /^Estabelecimentos.*\.csv$/i.test(file) || /^K.*\.ESTABELE/i.test(file))
    .map((file) => path.join(dir, file));
}

async function loadMunicipios(file, encoding) {
  const map = new Map();
  if (!existsSync(file)) return map;
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line, ";");
    const code = digits(fields[0]);
    const name = titleCase(fields[1] || "");
    if (code && name) map.set(code, name);
  }
  return map;
}

function normalizeEstabelecimento(fields, municipios) {
  const base = fields[0] || "";
  const ordem = fields[1] || "";
  const dv = fields[2] || "";
  const cnpj = `${base}${ordem}${dv}`;
  const uf = fields[19] || "";
  const municipioCode = digits(fields[20] || "");
  const city = municipios.get(municipioCode) || municipioCode;
  const phone1 = joinPhone(fields[21], fields[22]);
  const phone2 = joinPhone(fields[23], fields[24]);
  const email = normalizeEmail(fields[27] || "");
  const cnae = fields[11] || "";
  const fantasia = clean(fields[4]);

  return {
    id: `receita-${digits(cnpj)}`,
    fantasia: fantasia || "Nome fantasia não informado",
    razao: fantasia || "Razão social disponível no arquivo Empresas",
    cnpj: formatCnpj(cnpj),
    cidade: city,
    estado: uf,
    bairro: titleCase(fields[17] || ""),
    cnae,
    cnaesSecundarios: fields[12] || "",
    segmento: cnae ? `CNAE ${cnae}` : "",
    porte: "",
    capital: 0,
    abertura: normalizeDate(fields[10] || ""),
    situacao: situacaoLabel(fields[5]),
    matriz: fields[3] === "1" ? "Matriz" : "Filial",
    filiais: 0,
    natureza: "",
    endereco: [titleCase(fields[13] || ""), titleCase(fields[14] || ""), fields[15]].filter(Boolean).join(" "),
    cep: fields[18] || "",
    telefone: phone1,
    telefone2: phone2,
    whatsapp: "",
    email,
    site: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    googleMaps: "",
    socios: [],
    responsavelComercial: "",
    telefoneResponsavelPublico: "",
    fonteContato: "Dados públicos do CNPJ - Receita Federal",
    fonteOficial: true,
    contatoValidado: true,
    lastVerified: new Date().toISOString().slice(0, 10),
    status: "Novo lead",
    ultimaInteracao: "Sem contato",
    proximaAcao: "Enriquecer contatos e priorizar abordagem",
    dono: "Equipe Comercial",
    valorEstimado: 0,
    oportunidade: "Empresa localizada na base pública de CNPJ. Enriquecer contatos e presença digital para priorização comercial.",
  };
}

function parseArgs(items) {
  const out = {};
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i].startsWith("--")) continue;
    const key = items[i].slice(2);
    const value = items[i + 1];
    if (!value || value.startsWith("--")) out[key] = true;
    else {
      out[key] = value;
      i += 1;
    }
  }
  return out;
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

function clean(value) {
  return String(value || "").trim();
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCnpj(value) {
  const cnpj = digits(value);
  if (cnpj.length !== 14) return String(value || "");
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function joinPhone(ddd, phone) {
  const raw = `${digits(ddd)}${digits(phone)}`;
  if (raw.length < 10) return "";
  return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return email.includes("@") ? email : "";
}

function normalizeDate(value) {
  const raw = digits(value);
  if (raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function situacaoLabel(value) {
  const map = {
    "01": "Nula",
    "02": "Ativa",
    "03": "Suspensa",
    "04": "Inapta",
    "08": "Baixada",
  };
  return map[String(value || "").padStart(2, "0")] || value || "";
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
