# LeadScore Empresas - integrações de API

## Rodar local

```bash
npm.cmd run check
npm.cmd start
```

Acesse:

```text
http://127.0.0.1:4173
```

O app também continua abrindo por `outputs/index.html`, mas para APIs reais use o servidor Node.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha as chaves dos provedores.

Sem chaves, o sistema opera em modo seguro de demonstração:

- busca por empresas: base nacional local, se importada; caso contrário, base demo do navegador;
- consulta CNPJ individual: BrasilAPI, sem chave;
- IA: template local;
- CRM: armazenamento local em `work/leadscore-runtime.json`;
- WhatsApp: link `wa.me`;
- enriquecimento: mantém contatos já conhecidos.

## Busca Brasil inteiro

Para a ferramenta valer assinatura, a busca ampla não pode depender da base demo. Ela precisa de uma das duas fontes:

1. **Base nacional local importada:** use dados públicos de CNPJ da Receita Federal ou exportação de uma base parceira com uso permitido.
2. **API parceira:** configure `PARTNER_LEADS_API_URL` e `PARTNER_LEADS_API_KEY`.

O backend procura primeiro a base nacional em `data/national-leads` ou no diretório definido por `NATIONAL_LEADS_DIR`. Se existir índice nacional, `/api/leads/search` busca nele por UF, cidade, bairro, CNAE, segmento, porte, capital, situação, matriz/filial e contatos.

### Checklist para plano pago completo

Antes de vender como acesso completo:

- importar a base nacional ou contratar API parceira com cobertura nacional;
- manter rotina mensal de atualização da base;
- ativar enriquecimento de contatos permitido;
- configurar `OPENAI_API_KEY` para mensagens com IA;
- configurar webhook de CRM;
- configurar gateway de pagamento/assinatura;
- aplicar limites por plano no backend, não apenas no front;
- manter avisos de LGPD, opt-out e fonte de contato em exportações.

### Importar CSV já normalizado

```bash
npm.cmd run import:national -- --file C:\bases\leadscore\empresas-brasil.csv --source "Base parceira autorizada"
```

Cabeçalho recomendado:

```csv
cnpj;razao;fantasia;cidade;estado;bairro;cnae;segmento;porte;capital;abertura;situacao;telefone;telefone2;whatsapp;email;site;instagram;socio;fonte
```

### Importar Estabelecimentos da Receita Federal

Baixe e extraia os arquivos públicos de CNPJ da Receita Federal. Depois rode:

```bash
npm.cmd run import:receita-estab -- --dir C:\bases\receita\extraido --municipios C:\bases\receita\Municipios.csv
```

Esse importador usa o layout oficial de **Estabelecimentos** e indexa:

- CNPJ completo;
- nome fantasia;
- UF;
- município;
- bairro;
- CNAE principal;
- CNAEs secundários;
- situação cadastral;
- matriz ou filial;
- data de abertura;
- endereço;
- telefone;
- telefone secundário;
- e-mail.

Para capital social, razão social completa, natureza jurídica e sócios, use CSV normalizado/preparado ou uma etapa posterior de join com os arquivos **Empresas** e **Sócios**. A plataforma já aceita esses campos quando enviados pela base parceira ou por CSV normalizado.

### Status da base nacional

```bash
curl http://127.0.0.1:4173/api/national/status
```

Retorno esperado após importação:

```json
{
  "ok": true,
  "national": {
    "available": true,
    "records": 50000000,
    "mode": "national_jsonl_index"
  }
}
```

## Contrato para API parceira de busca de leads

`POST PARTNER_LEADS_API_URL`

Entrada:

```json
{
  "filters": {
    "estado": "MS",
    "cidade": "Campo Grande",
    "segmento": "Clínicas",
    "capitalMin": "50000",
    "whatsapp": true,
    "altoPotencial": true
  }
}
```

Saída esperada:

```json
{
  "companies": [
    {
      "id": "lead-123",
      "fantasia": "Empresa Exemplo",
      "razao": "Empresa Exemplo Ltda",
      "cnpj": "00.000.000/0000-00",
      "cidade": "Campo Grande",
      "estado": "MS",
      "bairro": "Centro",
      "cnae": "8630-5/03",
      "segmento": "Clínicas",
      "porte": "EPP",
      "capital": 180000,
      "abertura": "2018-04-10",
      "situacao": "Ativa",
      "telefone": "(67) 3000-0000",
      "whatsapp": "(67) 99999-0000",
      "email": "contato@empresa.example",
      "site": "https://empresa.example",
      "instagram": "@empresa",
      "socios": [{ "nome": "Nome Público", "qualificacao": "Sócio administrador" }],
      "fonteContato": "Site oficial e Google Maps",
      "fonteOficial": true,
      "contatoValidado": true
    }
  ]
}
```

## Contrato para enriquecimento de contatos

`POST CONTACT_ENRICHMENT_API_URL`

Entrada:

```json
{
  "company": {
    "cnpj": "00.000.000/0000-00",
    "fantasia": "Empresa Exemplo",
    "site": "https://empresa.example",
    "instagram": "@empresa"
  }
}
```

Saída esperada:

```json
{
  "company": {
    "whatsapp": "(67) 99999-0000",
    "email": "comercial@empresa.example",
    "responsavelComercial": "Atendimento Comercial",
    "telefoneResponsavelPublico": "(67) 99999-0000",
    "fonteContato": "Site oficial",
    "fonteOficial": true,
    "contatoValidado": true
  },
  "contacts": [
    {
      "tipo": "WhatsApp comercial",
      "valor": "(67) 99999-0000",
      "fonte": "Site oficial",
      "confianca": "Alta confiança"
    }
  ]
}
```

## Regras legais mantidas no produto

O sistema não exibe faturamento real declarado à Receita Federal. Os scores são estimativas de potencial comercial baseadas em dados públicos e sinais de mercado.

O sistema não promete telefone pessoal privado de sócios ou empresários. Telefones de responsáveis só devem aparecer quando estiverem em fonte pública, forem fornecidos pelo titular, inseridos pelo usuário ou vierem de base parceira com uso permitido.

O usuário final deve respeitar LGPD, finalidade legítima, transparência, opt-out e boas práticas de comunicação comercial.
