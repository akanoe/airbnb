# Mudanças que exigem mexer no JS

## 0. Barra de navegação + tema (novo)
As abas saíram do `<main>` e foram para dentro de `.topbar` (barra escura fixa no topo):
`<nav class="tabs" id="tabs">` — mesmos botões `data-t`, mesma classe `on`. Se o seu JS faz
`document.querySelector('#tabs')`, continua funcionando; se ele **recria** a fileira de abas,
emita-a dentro de `.topbar`.

O botão de tema é `#btnTheme` com rótulo `#themeLabel`. Ele escreve `data-theme="light|dark"`
no `<html>` e persiste em `localStorage['airbnb-calc.theme']`. Sem preferência salva, segue o
`prefers-color-scheme`. O script está no fim do arquivo — é o único JS do snapshot.
Se o gráfico for redesenhado por JS, redesenhe também no clique do toggle (as cores vêm de
`var(--*)`, então na prática só o `<text>` precisa de atenção se você usar cor literal).

Nenhum `id`, `data-k`, `data-p`, `data-t`, `data-flat`, `data-del`, `data-c` foi removido.
Classes `on hide neg mark tot pct s w` preservadas. O resto é CSS.

## 1. `#kpis` — hierarquia sem mudar o gerador
Não precisa mexer: o CSS reordena por `nth-child` assumindo a ordem atual
(1 CAPEX, 2 receita, 3 taxas, 4 OPEX, 5 resultado, 6 payback, 7 equilíbrio, 8 reserva, 9 caixa fim).
Se você mudar a ordem, emita as classes explícitas em vez de confiar no índice:
`<div class="kpi hero">` (veredito), `kpi ctx` (contexto), `kpi mini` (secundário).

## 2. Frase do veredito — elemento novo
`<p class="verdict-line" id="veredito">` fica **fora** de `#kpis` (para não ser sobrescrito).
Adicione `veredito.textContent = ...`. Use `class="verdict-line ok"` quando houver payback
dentro do horizonte (ponto verde) e `verdict-line` (ponto vermelho) quando não houver.

## 3. `#segCenario` mudou de lugar
Saiu da toolbar e foi para dentro do bloco `.verdict`. Mesmos botões `data-c`, mesma classe `on`.

## 4. Alertas
`#alerts` agora é `flex-wrap`. `.alert.erro` ocupa 100% da largura e grita;
`.alert.aviso` virou chip pequeno. Emita os erros **antes** dos avisos no innerHTML.
Nenhuma mudança obrigatória além disso.

## 5. Unidades: tabela → cards (gerador precisa mudar)
`#tblUnidades` agora é uma `<div class="units" id="tblUnidades">`. `innerHTML` continua funcionando.
Template por unidade `i`:

```html
<div class="unit">
  <div class="unit-top">
    <input class="w" type="text" data-p="unidades.I.nome" value="...">
    <button data-del="unidades.I" aria-label="Remover unidade">×</button>
  </div>
  <div class="unit-grid">
    <label class="f">Tipologia<select data-p="unidades.I.tipologia">…</select></label>
    <label class="f">m²<input class="s" type="number" step="any" data-p="unidades.I.m2" value="45"></label>
    <label class="f">Abre no mês<input class="s" type="number" step="1" data-p="unidades.I.abre_no_mes" value="1"></label>
    <label class="f">ADR (BRL)<input type="number" step="any" data-p="unidades.I.adr_brl" value="350"></label>
  </div>
  <div class="flatbox">
    <label class="f">Ocupação<input class="s" type="number" step="1" min="0" max="100" data-flat="I" placeholder="%" value="60"></label>
    <div class="fh">Aplica o mesmo % aos 12 meses…</div>
  </div>
  <details class="mdet">
    <summary>Sazonalidade mês a mês</summary>
    <div class="mgrid">
      <!-- 12× -->
      <label>jan<input class="s pct" type="number" step="1" min="0" max="100"
             data-p="unidades.I.occupancy_mensal.0" value="60"></label>
    </div>
  </details>
</div>
```

Detalhes: o campo `data-flat` agora vem **preenchido** com o valor quando os 12 meses são iguais
(hoje vem vazio). Se forem diferentes, deixe vazio com `placeholder="misto"` e mande o
`<details>` aberto (`<details class="mdet" open>`).

## 6. Gráfico de caixa (`#chart`) — gerador precisa mudar
Agora é `viewBox="0 0 1000 300"` **sem** `preserveAspectRatio="none"` (texto não distorce),
`width:100%;height:auto`. Área de plot: x de 64 a 980, y de 22 a 252.
Escala: `y(v) = 22 + (VMAX - v) / (VMAX - VMIN) * 230`, com VMAX/VMIN = topo/base do domínio
(arredonde para múltiplos de 100 mil, sempre incluindo o zero).
`x(m) = 64 + m / totalMeses * 916`.
Elementos a emitir, nesta ordem:
1. gridlines horizontais em múltiplos de 200 mil + rótulo `<text>` à esquerda (`text-anchor="end"`);
   a do zero com `stroke-dasharray="5 4"` e `stroke:var(--line-3)`.
2. ticks verticais a cada 12 meses + rótulo `Ano n` centrado no mês `n*12-6`, em `y = 268`.
3. `<polygon fill="var(--bad-2)">` = a linha fechada contra a linha do zero (o buraco).
4. `<polyline stroke="var(--acc)" stroke-width="2.5">` = caixa acumulado.
   Regra de folga dos rótulos: nunca posicione o `<text>` a menos de ~14px da polyline.
   Na prática, ancore os labels dos marcadores logo **abaixo da linha do zero**
   (`y = y(0) + 22`, empilhando +16px se houver dois) em vez de junto do ponto marcado.
5. marcador do **primeiro mês negativo**: `<circle r="4" fill="var(--bad)">` + linha tracejada
   vertical até a base + label `Mês N · caixa fica negativo · buraco R$ …`.
6. marcador de **payback**: mesmo padrão em `var(--acc)` com label `Payback · mês N`;
   quando não houver, o texto `Payback não ocorre no horizonte de X anos` junto à linha do zero.

## 7. Tabela mês a mês
Filtro de colunas é CSS puro (`#cbCols` + `:has()`), não precisa de JS. As colunas essenciais são
1, 5, 14, 15, 16, 17 — se você inserir/remover colunas, atualize os `nth-child` no `<style>`.
Primeira coluna é `position:sticky`.

## 8. CAPEX: barra empilhada + custo burocrático (blocos novos)
Emita a barra a partir dos totais por categoria:
`<div class="stack"><span style="width:P%;background:COR"></span>…</div>` e a legenda
`<ul class="legend"><li><i style="background:COR"></i>Rótulo<em>P%</em><b>R$ …</b></li></ul>`.
Cores por categoria: aquisicao `var(--ink)`, cartorio `var(--bad)`, obra `var(--acc)`,
mobiliario `var(--acc-3)` a 65% de opacidade, equipamentos `var(--line-3)`,
projeto `var(--acc-2)`, contingencia `var(--warn)`, outros `var(--mut)`.
O `.callout` mostra `(itbi + cartorio) / valor da linha base` em % e em R$.

## 9. Suprimentos: cascata
Bloco novo `<ol class="casc">`, uma `<li>` por passo. Classes: `cut` (dedução, barra hachurada
vermelha à direita), `step` (linha de subtotal), `final` (número em destaque).
Largura da barra `i` = valor ÷ ADR × 100 nos subtotais e valor da dedução ÷ ADR × 100 nas deduções.
Passos: ADR → −suprimentos → líquida após suprimentos → −admin → −plataforma → −impostos →
líquida ao host → −OPEX fixo rateado (opex_fixo_mes ÷ noites_ocupadas_mes) → sobra por noite.
`#suprResumo` continua existindo; os 3 cards agora usam `class="kpi mini"`.

## 10. Impressão
`@media print` já mostra só: header, veredito, KPIs, premissas, gráfico e P&L anual.
O bloco `.p-only.p-prem` (premissas) é **estático** no snapshot — no app real, popule-o por JS
com os mesmos valores das premissas principais. `#btnPrint` continua chamando `window.print()`.
