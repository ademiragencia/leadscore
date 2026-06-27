#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { importCsvToNationalIndex, nationalStatus } from "../server/national-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const args = parseArgs(process.argv.slice(2));

if (!args.file) {
  console.error([
    "Uso:",
    "  node scripts/import-national-leads.js --file caminho/empresas.csv",
    "",
    "Opções:",
    "  --delimiter ;",
    "  --encoding utf8",
    "  --uf BR",
    "  --source \"Receita Federal / Base parceira\"",
    "",
    "O CSV deve ter cabeçalhos como:",
    "  cnpj;razao;fantasia;cidade;estado;bairro;cnae;segmento;porte;capital;abertura;situacao;telefone;whatsapp;email;site;instagram;socio",
  ].join("\n"));
  process.exit(1);
}

const inputFile = path.resolve(args.file);
if (!existsSync(inputFile)) {
  console.error(`Arquivo não encontrado: ${inputFile}`);
  process.exit(1);
}

console.log(`Importando base nacional: ${inputFile}`);
const manifest = await importCsvToNationalIndex(rootDir, inputFile, {
  delimiter: args.delimiter || ";",
  encoding: args.encoding || "utf8",
  uf: args.uf || "BR",
  source: args.source || inputFile,
});

console.log(JSON.stringify({ manifest, status: nationalStatus(rootDir) }, null, 2));

function parseArgs(items) {
  const out = {};
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = items[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}
