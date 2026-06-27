# LeadScore Empresas

SaaS de inteligência comercial para prospecção B2B, com busca de empresas, scores, contatos comerciais, CRM simples, exportação CSV e gerador de abordagem.

## Proposta

O LeadScore Empresas ajuda agências, vendedores B2B, consultorias e prestadores de serviço a encontrar empresas ativas com maior potencial comercial e melhor caminho de contato.

O produto trabalha com:

- Score de Potencial;
- Score de Contato;
- Score Final do Lead;
- consulta pública de CNPJ;
- base nacional importável;
- enriquecimento de contatos por fonte permitida;
- CRM visual;
- exportação CSV;
- mensagens de abordagem com IA ou template local.

## Aviso legal

O LeadScore Empresas utiliza dados públicos e sinais de mercado para gerar estimativas de potencial comercial. O sistema não exibe faturamento real declarado à Receita Federal.

O sistema organiza contatos empresariais e informações públicas para fins de prospecção B2B. Ele não promete telefone pessoal privado de sócios ou empresários. Telefones de responsáveis só devem ser exibidos quando estiverem disponíveis em fontes públicas, fornecidos pelo próprio titular, inseridos pelo usuário ou obtidos por base parceira com uso permitido.

O usuário é responsável por utilizar os dados de forma ética, respeitando LGPD, finalidade legítima, transparência, opt-out e boas práticas de comunicação comercial.

## Rodar localmente

```bash
npm.cmd start
```

Acesse:

```text
http://127.0.0.1:4173
```

Validar sintaxe:

```bash
npm.cmd run check
```

## Configuração

Copie `.env.example` para `.env` e configure as chaves necessárias:

- `OPENAI_API_KEY` para geração de mensagens com IA;
- `PARTNER_LEADS_API_URL` para uma base parceira de busca;
- `CONTACT_ENRICHMENT_API_URL` para enriquecimento permitido;
- `CRM_WEBHOOK_URL` para integração com CRM;
- `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` para WhatsApp Cloud API;
- `PLAN_LEVEL` para limites de assinatura.

## Base nacional

O sistema está pronto para buscar no Brasil inteiro quando uma base nacional for importada.

Importar CSV normalizado:

```bash
npm.cmd run import:national -- --file C:\bases\leadscore\empresas-brasil.csv --source "Base parceira autorizada"
```

Importar Estabelecimentos da Receita Federal:

```bash
npm.cmd run import:receita-estab -- --dir C:\bases\receita\extraido --municipios C:\bases\receita\Municipios.csv
```

Consultar status:

```text
http://127.0.0.1:4173/api/national/status
```

## Estrutura

```text
outputs/                 Frontend estático
server/                  Backend Node.js e API
scripts/                 Importadores de base nacional
INTEGRACOES.md           Contratos e operação das integrações
.env.example             Variáveis de ambiente
```

## Rotas principais

- `GET /api/health`
- `GET /api/config`
- `GET /api/national/status`
- `POST /api/leads/search`
- `GET /api/cnpj/:cnpj`
- `POST /api/contacts/enrich`
- `POST /api/approach/generate`
- `POST /api/crm/sync`
- `POST /api/whatsapp/contact`

## Planos

- Básico: R$ 97/mês
- Pro: R$ 197/mês
- Agência: R$ 497/mês
- Enterprise: sob consulta

Os limites de busca são aplicados no backend via `PLAN_LEVEL`.
# leadscore
