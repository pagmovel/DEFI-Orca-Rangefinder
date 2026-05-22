<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white) ![Solana](https://img.shields.io/badge/Solana-Mainnet-9945ff?style=flat-square&logo=solana&logoColor=white) ![Orca](https://img.shields.io/badge/Orca-Whirlpool-00c2a3?style=flat-square) ![Tests](https://img.shields.io/badge/testes-35%20passando-22c55e?style=flat-square) ![License](https://img.shields.io/badge/licença-MIT-gray?style=flat-square)

# DEFI - ORCA Rangefinder

**Screener de oportunidades em pools de liquidez concentrada da Orca (Solana)**

Encontra os melhores pools com TVL ≥ US$ 100k e recomenda o range de preço ideal para
maximizar fees sem sair da faixa por pelo menos 1 semana.

</div>

---

## Visão geral

Rangefinder é um dashboard de análise **somente leitura** — sem carteira, sem transações.
Ele consome a API pública da Orca, filtra pools relevantes e aplica um modelo log-normal
para recomendar ranges de liquidez concentrada com diferentes perfis de risco:

| Preset      | k    | Prob. no range |
| ----------- | ---- | -------------- |
| Conservador | 1,96 | ~95 %          |
| Balanceado  | 1,28 | ~80 %          |
| Agressivo   | 1,00 | ~68 %          |

A página de detalhe de cada pool exibe os três ranges com régua visual, eficiência de capital
e APR concentrado estimado, além de um botão direto para aportar na Orca.

## Stack

- **Next.js 16** (App Router, RSC) — fetch server-side, sem CORS
- **TypeScript 5** + Zod — validação de payload das APIs externas
- **Tailwind CSS v4** — tema terminal-quant (dark charcoal + acento aqua)
- **TanStack Table** — tabela ordenável com hints nas colunas
- **Vitest** — 35 testes unitários (volatilidade, range, scoring, orca, geckoterminal, analyze)
- Fontes: **Archivo** (display) + **IBM Plex Mono** (dados)

## Fontes de dados

| Fonte                                      | Uso                                                 | Limite                                   |
| ------------------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| `api.orca.so/v2/solana/pools`            | Lista de pools, preços, TVL, volume, histórico 7d | Sem chave, CORS aberto                   |
| `api.geckoterminal.com` (OHLCV horário) | Volatilidade melhor na página de detalhe           | Sem chave, 30 req/min — só server-side |

## Modelo matemático

```
σ = std(log-retornos) × √(periodsPerDay)          # volatilidade diária

Pa = P · e^(−k · σ · √t)                          # borda inferior do range
Pb = P · e^(+k · σ · √t)                          # borda superior

P(no range) = 2·Φ(k) − 1                          # probabilidade de permanência (t = 7 dias)

E = 1 / (1 − (Pa/Pb)^¼)                           # eficiência de capital
APR concentrado = APR base × E

Score = APR concentrado × min(1, vol7d/7 / vol24h) # penaliza picos isolados de volume
```

## Comandos

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build        # build de produção
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # 35 testes Vitest
npm run test:watch   # Vitest em watch mode

npx vitest run lib/range.test.ts      # arquivo específico
npx vitest run -t "trecho do nome"    # teste específico
```

## Estrutura

```
app/
  page.tsx                  # dashboard RSC — lista de pools + screener
  pool/[address]/page.tsx   # detalhe RSC — ranges + RangeBand + link Orca
  globals.css               # tokens de design (Tailwind v4 @theme)
  layout.tsx                # fontes, lang="pt-BR"

components/
  Screener.tsx              # wrapper client (filtragem, buildRow)
  Filters.tsx               # filtros: par, TVL, APR, preset
  ScreenerTable.tsx         # TanStack Table com hints nas colunas
  RangeBand.tsx             # régua SVG/CSS do range vs. preço atual
  SiteHeader.tsx / SiteFooter.tsx

lib/
  types.ts                  # Pool, Opportunity, RangeRecommendation, PriceSeries
  config.ts                 # MIN_TVL_USD, HORIZON_DAYS, RANGE_PRESETS
  orca.ts                   # cliente Orca API (paginação, Zod, mapOrcaPool)
  geckoterminal.ts          # OHLCV horário (server-side, graceful fallback)
  volatility.ts             # dailyVolatility — log-retornos + √(periodsPerDay)
  range.ts                  # priceToTick, recommendRange, capitalEfficiency
  scoring.ts                # stabilityFactor, opportunityScore, rankOpportunities
  analyze.ts                # buildOpportunity, screenPools
  format.ts                 # formatadores pt-BR (USD, %, preço, múltiplo)
```

## Como usar

### 1. Subir o servidor

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 2. Screener — encontrar oportunidades

A tabela carrega automaticamente todos os pools da Orca com TVL ≥ US$ 100k,
ordenados por **Score** (maior primeiro).

**Filtros disponíveis:**

| Filtro      | Exemplo        | Efeito                                                               |
| ----------- | -------------- | -------------------------------------------------------------------- |
| Par         | `SOL`        | Exibe só pools que contenham "SOL" no nome                          |
| TVL mínimo | `$500k`      | Remove pools com pouca liquidez                                      |
| APR mínimo | `50 %`       | Filtra pools com retorno concentrado abaixo do limiar                |
| Preset      | `Balanceado` | Recalcula largura de range e APR concentrado para o preset escolhido |

**Colunas — o que olhar:**

- `σ / dia` em **coral** (> 12 %) → mercado muito volátil, range precisará ser largo
- `APR concentrado` em **aqua** → retorno esperado com liquidez concentrada no preset ativo
- `Score` → métrica combinada; prefira valores altos com `σ` moderada

### 3. Detalhe do pool — escolher o range

Clique em qualquer linha para abrir a análise completa do pool.

```
http://localhost:3000/pool/<endereço-do-pool>
```

Três cards são exibidos — um por preset:

```
┌─────────────────────────────────────────┐
│ Conservador          ~95% no range      │
│  ════════▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╋════════  │
│  Largura              ±12,4%            │
│  Eficiência           3,2×              │
│  APR concentrado      187,5%            │
│  [ APORTAR NA ORCA ↗ ]                  │
└─────────────────────────────────────────┘
```

- **Régua visual** — banda colorida = range recomendado; marcador `╋` = preço atual;
  colchetes acima = amplitude observada nos últimos 7 dias
- **APORTAR NA ORCA** — abre o pool diretamente no app da Orca em nova aba,
  pronto para configurar a posição

### 4. Escolher o preset certo

```
Alta confiança, menor APR → Conservador (k = 1,96, ~95 %)
Equilíbrio risco/retorno  → Balanceado  (k = 1,28, ~80 %)  ← padrão
Máximo APR, mais rebalanceios → Agressivo (k = 1,00, ~68 %)
```

> **Regra de bolso:** se `σ / dia > 10 %`, prefira o preset Conservador.
> Ranges estreitos em ativos voláteis ficam fora da faixa rapidamente e param de gerar fees.

## Desenvolvimento

Requer Node.js ≥ 18. Clone, instale e inicie:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O primeiro carregamento pode levar alguns segundos
enquanto a API da Orca é paginada (~100+ pools).

## Deploy — cPanel (hospedagem compartilhada)

> **Pré-requisito:** o plano deve ter o recurso **"Setup Node.js App"** no cPanel.
> Sem ele, use Vercel ou Railway (deploy gratuito com `git push`).

### 1. Gerar o build localmente

```bash
npm run build
```

### 2. Criar o arquivo de entrada `server.js` na raiz do projeto

```js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(process.env.PORT || 3000);
});
```

> Este arquivo já existe no repositório — não é necessário criá-lo novamente.

### 3. Subir os arquivos via FTP/File Manager

Faça upload dos seguintes itens para a pasta do app no servidor (ex.: `public_html/defi/`):

```
.next/          ← build gerado (pasta inteira)
public/         ← assets estáticos
server.js       ← ponto de entrada Node.js
package.json
package-lock.json
```

> **Não** suba `node_modules/` — ele será instalado no servidor.

### 4. Configurar no cPanel → "Setup Node.js App"

| Campo                    | Valor                                                          |
| ------------------------ | -------------------------------------------------------------- |
| Node.js version          | 18.x ou superior                                               |
| Application mode         | Production                                                     |
| Application root         | `public_html/defi` (caminho onde os arquivos foram enviados) |
| Application URL          | Domínio ou subdomínio desejado                               |
| Application startup file | `server.js`                                                  |

1. Clique em **Create** (ou **Save**).
2. No painel da app criada, clique em **Run NPM Install** para instalar as dependências.
3. Clique em **Restart** para iniciar o servidor.


cPanel tem "Setup Node.js App" (nem todo plano inclui — verifique no painel).

---

**Passo a passo:**

**1. Criar `server.js`** na raiz do projeto:

```js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(process.env.PORT || 3000);
});
```

**2. Rodar o build localmente:**

```bash
npm run build
```

**3. Enviar via FTP/File Manager** estes arquivos:

```
.next/
public/
server.js
package.json
package-lock.json
```

**4. No cPanel → "Setup Node.js App":**

* Node.js version: **18.x** ou superior
* Application mode: **Production**
* Application root: pasta onde enviou os arquivos
* Application startup file: `server.js`
* Clique **Create**

**5. No painel do app → botão "Run NPM Install"**

**6. Clique "Start App"**

cPanel configura o proxy reverso automaticamente — seu domínio/subdomínio apontará para o app.

---

 **Se não aparecer "Setup Node.js App" no seu cPanel** , o plano não suporta Node.js. Nesse caso só Vercel/Railway resolvem.

### 5. Verificar

Acesse o domínio/subdomínio configurado. O primeiro carregamento pode levar alguns segundos enquanto a API da Orca é paginada.

> **Portas:** o cPanel gerencia o proxy automaticamente — não é necessário expor porta manualmente.

---

<div align="center">
  <sub>Análise somente leitura · Sem carteira · Sem transações · Dados ao vivo da Orca / GeckoTerminal</sub>
</div>
