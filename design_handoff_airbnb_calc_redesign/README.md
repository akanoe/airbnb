# Handoff: redesign da calculadora de investimento Airbnb / short-stay

## Overview
Redesign completo da interface de uma calculadora de viabilidade para compra de imóvel
destinado a locação por diária (Airbnb / short-stay) no Brasil. O usuário é um investidor
pessoa física que preenche premissas (preço, ITBI, cartório, obra, diária média, ocupação,
comissão da administradora, caseiro CLT, suprimentos) e lê um veredito: se o projeto se paga
e em quanto tempo.

O redesign resolve dez problemas do app atual, na ordem de prioridade dada pelo cliente:
hierarquia dos KPIs, peso dos alertas, edição de sazonalidade, leitura do fluxo de caixa,
breakdown de CAPEX, cascata de suprimentos, visibilidade dos defaults, posição do seletor
de cenário, fluidez em telas estreitas e impressão em uma página A4.

## About the Design Files
Os arquivos deste pacote são **referências de design em HTML** — protótipos que mostram
a aparência e o comportamento pretendidos, não código de produção para copiar cru.

Atenção ao contexto deste caso, que é diferente do handoff típico: o app real **já é**
um único arquivo HTML sem build, sem framework e sem CDN, e essa é uma restrição do
cliente que não pode ser quebrada. Portanto a tarefa **não** é recriar o design em React
ou similar. A tarefa é:

1. Substituir o bloco `<style>` do app real pelo de `estilo-completo.css`.
2. Portar a marcação estática (topbar, veredito, cartões, blocos novos) do
   `airbnb-calc-redesign.html`.
3. Adaptar os **geradores de innerHTML** do JS existente aos novos templates —
   isso está especificado item por item em `NOTAS-PARA-O-JS.md`, que é o documento
   mais importante deste pacote para quem vai implementar.

Se em algum momento o app migrar para um framework, o mesmo README serve: os tokens e as
medidas abaixo são a fonte de verdade.

### Restrições que não podem quebrar
- Um único arquivo HTML. CSS no `<style>`, sem framework, sem CDN, sem imagens externas.
  (A única exceção introduzida é o `<link>` do Google Fonts para Anton e DM Sans, com
  fallback de sistema já declarado nos tokens — se o cliente quiser zero rede, remova o
  `<link>` e a pilha de fallback assume.)
- Preservar todos os `id`, `data-k`, `data-t`, `data-p`, `data-flat`, `data-del`, `data-c`
  e as classes `on hide neg mark tot pct s w`. O JS do app se liga por esses ganchos.
  **Nenhum foi removido neste redesign.** Wrappers novos foram adicionados sempre por fora.
- pt-BR, separador de milhar, moeda BRL.
- Sem gráficos por biblioteca: SVG inline ou CSS.
- Tom direto, números na frente. Nada de "renda passiva garantida", nada de vender
  administradora.

## Fidelity
**High-fidelity.** Cores, tipografia, espaçamento, raios e estados finais. Os números
exibidos correspondem ao caso do snapshot (1 apartamento de R$ 500 mil em São Paulo:
CAPEX R$ 602.500, receita bruta ano 1 R$ 75.600, resultado ano 1 R$ 25.884, payback
não ocorre em 5 anos, ocupação de equilíbrio 25%).

> O arquivo de design é um **snapshot**: no app real as seções são abas, aqui todas
> aparecem empilhadas para revisão. Isso é feito por um bloco de CSS explicitamente
> marcado `/* SNAPSHOT */` no fim da folha, com `section.tab{display:block!important}`
> e um rótulo `::before` com o id da seção. **Remova esse bloco ao portar** — a regra
> real de abas (`section.tab{display:none}` / `.on{display:block}`) já está acima dele.

## Screens / Views

### 1. Barra de navegação (`.topbar`) — persistente
**Propósito:** identidade, troca de seção e troca de tema.
**Layout:** flex de uma única linha, sempre; `min-height: 58px` (52px abaixo de 520px);
fundo `--bar` (#070607 no claro, #000 no escuro); texto `--on-dark` (#ffffff).
Três filhos: marca (`flex: 0 0 auto`), abas (`flex: 1 1 0%; min-width: 0`),
botão de tema (`flex: 0 0 auto`). Os divisores entre eles são **pontilhados**
(`1.5px dotted rgba(255,255,255,.34)`) — assinatura do sistema visual.

**Componentes:**
- **Marca** (`a.brand`): símbolo SVG de checkmark angular 26×26 em Ember (#fc5000,
  `stroke-width: 3.4`, `stroke-linecap: square`) + wordmark "airbnb calc" em Anton 22px,
  lowercase, `letter-spacing: .02em`. Padding lateral `clamp(12px, 2.4vw, 28px)`.
- **Abas** (`nav.tabs#tabs` > `button[data-t]`): DM Sans 500, 13px, cor
  `rgba(255,255,255,.72)`; padding lateral `clamp(12px, 1.6vw, 20px)` (14px no mobile);
  borda direita pontilhada em cada botão. Ativa (`.on`): cor Ember + barra inferior
  `::after` de 3px em Ember. Hover: branco + `rgba(255,255,255,.06)` de fundo.
  A faixa rola na horizontal (`overflow-x: auto`, scrollbar oculta) com **fade de máscara
  de 28px na borda direita** indicando que há mais abas — não quebra em duas linhas
  em nenhuma largura.
  Nove abas: Projeto, CAPEX, Operação, Demanda, Suprimentos, Risco & rollout,
  Fluxo de caixa, Fórmulas, JSON.
- **Botão de tema** (`button.themebtn#btnTheme`): ícone de sol 16×16 (stroke 2,
  linecap round) + rótulo `#themeLabel` que alterna "Escuro" / "Claro".
  `aria-pressed` reflete o estado. Abaixo de 720px o rótulo some e fica só o ícone.

### 2. Cabeçalho do projeto (`header`)
**Layout:** flex wrap, largura `min(1280px, 100%)`, padding `24px var(--gutter) 12px`.
**Componentes:** `h1#hNome` em Anton `clamp(30px, 4vw, 44px)`; `.sub` com
`span.pill#hTipo` (chip Sulfur #f5f28e, tinta Obsidian, uppercase 11.5px,
`border-radius: 800px`) e `#hCidade` em cinza; toolbar de botões-pílula à direita
(Exportar JSON, Importar JSON, Resetar em Ember, **Imprimir resumo em `.primary`**);
`.meta` em linha própria, 11.5px cinza: "airbnb-calc.v1 · roda 100% no browser ·
dados ficam no seu navegador".

### 3. Alertas (`#alerts`)
Erro bloqueante e aviso informativo deixam de ter o mesmo peso — critério de aceite.
- **`.alert.erro`**: ocupa 100% da largura, fundo **#000000**, texto branco,
  borda esquerda de **8px em Ember**, `border-radius: 10px`, padding `14px 24px`,
  15px. O rótulo "Erro" é Anton 20px em Ember, uppercase.
- **`.alert.aviso`**: chip de uma linha, fundo Sulfur, tinta Obsidian, 11.5px,
  `border-radius: 800px`, padding `5px 14px`. Vários avisos fluem lado a lado.
- `#alerts:empty{display:none}` — sem alerta, zero espaço ocupado.
- **Ordem de emissão: erros primeiro, avisos depois.**

### 4. Veredito (`.verdict`) — o bloco que resolve o critério "5 segundos"
**Layout:** cartão `--paper` (#f7f6f2), `border-radius: 20px`,
padding `clamp(18px, 3.2vw, 40px)`.
- **`.verdict-top`**: eyebrow "Veredito · horizonte de 5 anos" à esquerda,
  eyebrow "Cenário de ocupação" + `.seg#segCenario` à direita; borda inferior pontilhada.
  O seletor de cenário (Conservador / Base / Otimista, `button[data-c]`) **saiu da toolbar
  e passou a viver aqui**, ao lado do número que ele muda. `.seg` é uma cápsula
  (`border-radius: 800px`, padding 3px, borda 1.5px) e o item `.on` é uma pílula Ember
  com tinta Obsidian.
- **`.verdict-line#veredito`**: frase em linguagem direta, `clamp(16px, 1.6vw, 20px)`,
  `max-width: 70ch`, `text-wrap: pretty`. Bolinha de 12px antes: Ember quando não há
  payback, Obsidian (`.ok`) quando há. Os `<b>` são grifados em Sulfur com tinta
  **fixada em Obsidian** (`--color-obsidian`) para sobreviver ao tema escuro.
  Texto atual: "Com estas premissas o projeto **não se paga em 5 anos**: sobra R$ 25.884
  por ano sobre um CAPEX de R$ 602.500 — **4,3% ao ano**, ou 23 anos de retorno no
  ritmo atual."
- **`.kpis#kpis`**: grid de 12 colunas, gap 24px, com **três níveis de hierarquia
  obtidos por `nth-child`** — o gerador atual do JS não precisa mudar:
  - **Herói** (5º, 6º, 7º = resultado ano 1, payback, ocupação de equilíbrio):
    `grid-column: span 4`, `order: -1`, valor em Anton **48px**, separados por
    divisor vertical pontilhado.
  - **Contexto** (1º–4º = CAPEX, receita bruta, taxas, OPEX): `span 3`, `order: 0`,
    valor `clamp(20px, 2.1vw, 26px)`, borda superior pontilhada.
  - **Secundário** (8º, 9º = reserva sugerida, caixa fim do horizonte): `span 6`,
    `order: 1`, vira linha de texto — rótulo em peso normal e valor em DM Sans 15px.
  - `.v.neg` pinta o valor em Ember.
  - Classes explícitas `.kpi.hero` / `.kpi.ctx` / `.kpi.mini` existem como alternativa
    caso a ordem de emissão mude.

### 5. CAPEX (`#tab-capex`)
- **`.stack`**: barra empilhada de 44px, `border-radius: 800px`, uma `<span>` por
  categoria com `width` em %. Cores de dado: aquisição Obsidian, ITBI+cartório **Ember**,
  obra **Plasma #524ae9**, mobiliário **Sulfur**, equipamentos #a8a5a0.
- **`.legend`**: grid `minmax(min(100%, 240px), 1fr)`; cada item é bolinha de 12px +
  rótulo + `<em>` com o % + `<b>` com o valor alinhado à direita, tudo `nowrap`,
  com borda inferior pontilhada.
- **`.callout`** — destaque do custo burocrático: bloco **Ember** com tinta Obsidian,
  `border-radius: 10px`, padding `clamp(18px, 3.2vw, 40px)`. Número "4,5%" em Anton
  `clamp(30px, 4vw, 44px)` + explicação de que R$ 22.500 em ITBI (3%) e cartório (1,5%)
  saem do caixa e não viram imóvel nem receita.
- Abaixo: dois campos de % (`itbi_pct`, `cartorio_pct`), o botão de recalcular,
  a tabela `#tblCapex` e um `.def` com os defaults rotulados.

### 6. Operação, Demanda, Risco
Formulários em `.grid` (`minmax(min(100%, 220px), 1fr)`, gap 16px). Cada campo é
`label.f`: rótulo uppercase 11.5px cinza + input **pílula** (`border-radius: 100px`,
borda 1.5px `--line-2`, fundo transparente, padding `10px 16px`, DM Sans 500 15px);
hover escurece a borda para `--ink`.

**Defaults rotulados** (`.def`) — antes eram cinza miúdo, agora são visíveis sem gritar:
bloco com borda superior pontilhada, prefixo `::before` "PREMISSA EDITÁVEL —" em
**Ember uppercase 11.5px**, e cada valor default grifado em Sulfur. Presentes em:
assistente de obra (R$/m² por padrão, contingência), CAPEX (ITBI e cartório),
operação (admin, plataforma, impostos), caseiro CLT (encargos 1,8×),
demanda (noites, estadia média) e risco (multiplicadores, reserva).

### 7. Unidades (`#tblUnidades`) — de tabela para cards
Era uma tabela com 12 inputs de ocupação em uma linha, ilegível e sem caber no mobile.
Agora é `div.units` (grid `minmax(min(100%, 340px), 1fr)`) de `.unit`:
cartão com borda 1.5px e `border-radius: 20px`.
- **`.unit-top`**: nome da unidade como input Anton `clamp(20px, 2.1vw, 26px)` com borda
  transparente que aparece no hover (edição in-place) + botão circular 38×38 de remover.
- **`.unit-grid`**: tipologia, m², abre no mês, ADR — `minmax(min(100%, 104px), 1fr)`.
- **`.flatbox`**: o campo **Ocupação** em destaque (Anton `clamp(24px, 2.6vw, 32px)`,
  `data-flat`), que aplica o mesmo % aos 12 meses, com a explicação ao lado.
- **`details.mdet`**: "Sazonalidade mês a mês" recolhido; o marcador é um "›" Ember que
  rotaciona 90°. Dentro, `.mgrid` de **6 colunas** (3 no mobile) com os 12 inputs
  `data-p="unidades.I.occupancy_mensal.N"` centralizados —
  **editável em 375px de largura**, critério de aceite atendido.

### 8. Suprimentos (`#tab-suprimentos`) — cascata
Critério de aceite: mostrar a diária bruta até a líquida.
`ol.casc`, uma `<li>` por passo, grid de 3 colunas
(`minmax(160px, 1.1fr)` / `minmax(0, 3fr)` / 116px). No mobile a barra passa para a
linha de baixo (`grid-column: 1/-1; order: 3`).
- Subtotal (`.step`, `.final`): barra sólida Obsidian, largura = valor ÷ ADR;
  valor em Anton `clamp(20px, 2.1vw, 26px)` nos `.final`.
- Dedução (`.cut`): texto e valor em Ember, barra **hachurada** ancorada à direita
  (`repeating-linear-gradient(135deg, var(--acc) 0 4px, var(--acc-wash) 4px 9px)`).
- Passos: R$ 350,00 (ADR) → −66,00 suprimentos → 284,00 → −70,00 admin (20%)
  → −10,50 plataforma (3%) → −0,00 impostos → **203,50 líquida ao host**
  → −83,33 OPEX fixo rateado → **120,17 sobra por noite ocupada**.
- Fecho: "Cada R$ 100 de diária deixa R$ 34 no bolso com as premissas atuais."
- Os três cards de resumo (`#suprResumo`) passaram a usar `.kpi.mini`.

### 9. Fluxo de caixa (`#tab-fluxo`)
- **Gráfico `svg#chart`**: `viewBox="0 0 1000 300"`, sem `preserveAspectRatio="none"`
  (o texto não distorce mais), `width: 100%; height: auto`, dentro de `.chartwrap`
  (`--paper-2`, `border-radius: 20px`). Área de plot x 64→980, y 22→252.
  Contém, e isto é critério de aceite: **eixo de tempo em anos** (ticks a cada 12 meses,
  rótulo "Ano n" centrado no mês n·12−6), **linha do zero** pontilhada (`2 5`),
  gridlines a cada R$ 200 mil com rótulo, **área do buraco** em `--bad-2`,
  linha do caixa em Obsidian `stroke-width: 2.5`, e **marcadores** do mês em que o caixa
  fica negativo (círculo Ember + tracejado vertical + label "Mês 0 · caixa fica negativo ·
  buraco R$ -602.500") e do payback (aqui, "Payback não ocorre no horizonte de 5 anos").
  Os labels ficam ancorados **abaixo da linha do zero** para nunca colidir com a curva.
  Legenda `.chart-key` abaixo.
- **Tabela mês a mês**: a de 17 colunas ganhou `#cbCols` — "Mostrar só as colunas
  essenciais", ligado por padrão, **CSS puro** via `body:has(#cbCols:checked)`
  escondendo as colunas 2,3,4,6..13. Primeira coluna `position: sticky`.
  O wrapper `.tw` tem **sombras de rolagem** (gradientes `background-attachment: local`)
  que aparecem só quando há conteúdo cortado — a pista visual que faltava — mais a
  dica textual `.tw-hint`.
- **P&L anual** `#tblAnos` sem alteração estrutural.

### 10. Fórmulas e JSON
Cartões de texto. `pre.formulas` em mono 13px/1.7. `textarea#jsonArea` com
`border-radius: 20px` e fundo transparente.

## Interactions & Behavior
- **Abas**: `button[data-t]` alterna `.on` e mostra a `section.tab` correspondente
  (lógica já existente no app).
- **Tema**: `#btnTheme` escreve `data-theme="light"|"dark"` no `<html>`, persiste em
  `localStorage['airbnb-calc.theme']` e atualiza `#themeLabel` e `aria-pressed`.
  Sem preferência salva, segue `prefers-color-scheme`. É o único JS do arquivo de design.
- **Cenário**: `button[data-c]` recalcula e repinta KPIs, frase do veredito, gráfico e
  tabelas.
- **Sazonalidade**: `data-flat` preenche os 12 meses; se os meses divergirem, o campo
  fica vazio com `placeholder="misto"` e o `<details>` deve vir aberto.
- **Hover**: bordas de input escurecem para `--ink`; botões idem; `tbody tr:hover`
  recebe `--paper-2`.
- **Foco**: `outline: 2px solid var(--acc); outline-offset: 2px` em tudo que é focável.
- **Sem animações** além do "›" do `<details>` (`transform .12s`) — decisão deliberada:
  ferramenta de cálculo, não vitrine.
- **Responsivo** (largura de página `min(1280px, 100%)`, gutter `clamp(12px, 3vw, 40px)`):
  - **≤1000px**: KPIs herói vão para `span 6` (o primeiro ocupa `span 12`), contexto
    para `span 6`, divisores verticais viram horizontais.
  - **≤900px**: legenda do CAPEX em coluna única.
  - **≤720px**: tudo em `span 12`; `.mgrid` em 3 colunas; `.grid` em coluna única;
    barra da cascata em linha própria; rótulo do botão de tema oculto.
  - **≤520px**: wordmark oculto, só o símbolo da marca; topbar 52px.
  - A barra de navegação **nunca quebra em duas linhas** em nenhuma largura.

## State Management
Nenhum estado novo. O app mantém o objeto `airbnb-calc.v1` em localStorage e recalcula
tudo a cada input. O redesign adiciona apenas:
- `localStorage['airbnb-calc.theme']` → `"light" | "dark"` (ausente = segue o sistema);
- o estado nativo de `<details class="mdet">` (aberto/fechado, não persistido);
- `#cbCols` (checkbox, não persistido) — se quiser persistir, é um par de linhas.

## Design Tokens
Todos no `:root`, prontos para copiar (`tokens.css` traz só esse bloco).
Sistema **Caldera**: fogo de forja sobre calcário quente.

**Paleta base**
| Token | Hex |
|---|---|
| `--color-ember` | #fc5000 |
| `--color-plasma` | #524ae9 |
| `--color-sulfur` | #f5f28e |
| `--color-limestone` | #f7f6f2 |
| `--color-pumice` | #e2e2df |
| `--color-obsidian` | #070607 |
| `--color-chalk` | #ffffff |

**Semânticas (tema claro)**
`--bg` #e2e2df · `--paper` #f7f6f2 · `--paper-2` #efeeea · `--paper-3` #e7e6e1 ·
`--ink` #070607 · `--ink-2` #3d3b39 · `--mut` #6f6c68 · `--on-dark` #ffffff ·
`--bar` #070607 · `--acc` Ember · `--acc-ink` Obsidian · `--acc-wash` rgba(252,80,0,.12) ·
`--bad` Ember · `--bad-2` rgba(252,80,0,.13) · `--bad-3` rgba(252,80,0,.45) ·
`--warn` Obsidian · `--warn-2` Sulfur · `--pos` Obsidian

**Semânticas (tema escuro, `[data-theme="dark"]` + `prefers-color-scheme`)**
`--bg` #0d0c0c · `--paper` #161514 · `--paper-2` #1d1b1a · `--paper-3` #242120 ·
`--ink` #f4f2ee · `--ink-2` #cfcbc4 · `--mut` #95908a · `--bar` #000000 ·
`--cat-aquisicao` #f4f2ee · `--cat-equip` #6b6864 · `--pos` #f4f2ee.
Ember e Sulfur **não mudam** nos dois temas — por isso todo elemento com fundo Sulfur
(`.pill`, `.alert.aviso`, `.verdict-line b`, `.def b`) **fixa a tinta em
`--color-obsidian`**; se você criar um elemento novo sobre Sulfur, faça o mesmo.

**Traços** `--line` rgba(7,6,7,.14) · `--line-2` rgba(7,6,7,.24) ·
`--line-3` rgba(7,6,7,.42) · `--dot` `1.5px dotted rgba(7,6,7,.34)` (o pontilhado é
assinatura do sistema: use-o em divisores, nunca linha cheia).

**Cores de dado** `--cat-aquisicao` Obsidian · `--cat-cartorio` Ember ·
`--cat-obra` Plasma · `--cat-mobiliario` Sulfur · `--cat-equip` #a8a5a0.
Sugestões para as demais categorias: projeto `--acc-wash`, contingência `--warn`,
outros `--mut`.

**Espaçamento** `--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 24 · `--s6` 40 ·
`--s7` 64px. Fluidos: `--pad-card` `clamp(18px, 3.2vw, 40px)` ·
`--gutter` `clamp(12px, 3vw, 40px)` · `--page` 1280px.

**Raio** `--r-small` 16 · `--r-medium` 20 · `--r-card` 20 · `--r-input` 100 ·
`--r-pill` 800px. Regra prática: **nada retangular** — input e botão são pílula,
cartão é 20px. Duas exceções pedidas: `.alert.erro` e `.callout` a **10px**.

**Tipografia**
- `--f-display`: **Anton**, fallback `"PP Neue Corp Compact", "Bebas Neue",
  "Arial Narrow", Impact, sans-serif`. Só em números-herói, títulos e valores finais.
- `--f-ui`: **DM Sans 500**, fallback `Inter, Manrope, system-ui, -apple-system,
  "Segoe UI", Roboto, sans-serif`. Todo o corpo. **Peso 500 é o normal do sistema** —
  não use 400 em UI.
- `--f-mono`: `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`.
- Escala: `--t-3xl` `clamp(38px, 6.4vw, 72px)` (KPI herói usa **48px** fixo) ·
  `--t-2xl` `clamp(30px, 4vw, 44px)` · `--t-xl` `clamp(24px, 2.6vw, 32px)` ·
  `--t-l` `clamp(20px, 2.1vw, 26px)` · `--t-m` 15px · `--t-s` 13px · `--t-xs` 11.5px.
- `--lh-tight` .94 (display) · `--lh` 1.5 (corpo) ·
  `--track` .06em (uppercase) · `--track-d` .02em (display).
- Numerais **tabulares** no `body` (`font-variant-numeric: tabular-nums`) — obrigatório
  para as tabelas alinharem.

**Sombras** nenhuma. Profundidade vem de superfície + pontilhado.

## Assets
Nenhuma imagem externa. Dois SVGs inline desenhados à mão, ambos `currentColor`
e `stroke`, sem fill:
- símbolo da marca — checkmark angular, `viewBox="0 0 26 26"`;
- ícone do tema — sol, `viewBox="0 0 24 24"`.
Fontes por `<link>` do Google Fonts (Anton 400, DM Sans 500) com fallback de sistema
declarado nos tokens; remover o `<link>` degrada de forma limpa.

## Impressão (`@media print`) — entrega pedida
Uma página A4 retrato, margem 10mm, para levar a uma conversa. O bloco `@media print`
reescreve os tokens (tipografia menor, superfícies em branco, raios em 0) em vez de
sobrescrever regra por regra.
Aparece: cabeçalho do projeto, veredito completo (frase + KPIs), grade de premissas
principais, gráfico de caixa, P&L anual e um rodapé de ressalva
("estimativa gerada no navegador… confirme com contador, cartório e orçamento de obra").
Desaparece: topbar, abas, botões, notas, avisos, `<details>`, legenda do gráfico e a
tabela mês a mês.

⚠️ **Pendência para quem implementar:** o bloco `.p-only.p-prem` (grade de premissas
da impressão) está **estático** no arquivo de design. No app real ele precisa ser
populado por JS com os valores atuais das premissas. Está registrado como item 10 em
`NOTAS-PARA-O-JS.md`.

## Files
| Arquivo | O que é |
|---|---|
| `airbnb-calc-redesign.html` | O design completo. Abra no browser. Snapshot com todas as seções visíveis. |
| `NOTAS-PARA-O-JS.md` | **Leia antes de codar.** Os 11 pontos em que a estrutura mudou e o JS precisa acompanhar, com template de markup em cada um. |
| `estilo-completo.css` | O bloco `<style>` inteiro, extraído. Substitui o do app real. |
| `tokens.css` | Só o `:root` + temas, para copiar isolado. |

## Critérios de aceite (do cliente) e onde foram atendidos
1. **Em 5 segundos dá para dizer se o projeto se paga e em quanto tempo** — `.verdict`:
   frase em linguagem direta + três KPIs herói em Anton 48px.
2. **Erro bloqueante é inconfundível; aviso não compete com os KPIs** — `.alert.erro`
   preto com barra Ember de 8px vs. `.alert.aviso` como chip de uma linha.
3. **Ocupação mensal editável em 375px** — `.mgrid` em 3 colunas dentro do `<details>`.
4. **Gráfico com eixo de anos, linha do zero e marcas de caixa negativo e payback** —
   `svg#chart`.
5. **Suprimentos mostra a cascata da diária bruta até a líquida** — `ol.casc`, 9 passos.
6. **Nenhum `id` ou `data-*` original removido** — verificado; ganchos preservados,
   wrappers adicionados por fora.
