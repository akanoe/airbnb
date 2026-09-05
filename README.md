# Airbnb Calc

Calculadora de investimento em imóvel para Airbnb / short-stay no Brasil. Um único arquivo HTML, sem servidor, sem build, sem framework.

Abra `airbnb-calc.html` no navegador. O estado fica no `localStorage` e pode ser exportado e importado como JSON (`schema: airbnb-calc.v1`).

## O que calcula

- CAPEX (compra ou terreno, ITBI, cartório, obra, mobiliário, equipamentos, contingência)
- OPEX recorrente (administradora, plataforma, impostos, condomínio, IPTU, utilidades, seguro, caseiro CLT)
- Suprimentos por checkout ou por noite ocupada, abatidos da diária
- Caixa mês a mês, P&L de 1 a 10 anos, payback, ROI, ocupação de equilíbrio, três cenários de ocupação

Quatro tipos de projeto: apartamento, casa, terreno, terreno + N casas.

## Pastas

| Caminho | O que é |
|---|---|
| `airbnb-calc.html` | O app. Motor de cálculo entre `/*ENGINE-START*/` e `/*ENGINE-END*/`. |
| `fixture-g2.json` | Caso de referência (1 apto de R$ 500 mil) usado nos testes. |
| `gauntlet.mjs` | Testes G1–G6 do motor. Rode `node gauntlet.mjs`. |
| `design_handoff_airbnb_calc_redesign/` | Handoff do redesign (README, notas para o JS, CSS, tokens). |
| `design/` | Prompt de briefing, snapshot estático e versão anterior ao redesign. |

## O que este app não é

Não é PMS nem channel manager: não sincroniza com Airbnb. Não é contabilidade fiscal: ITBI, cartório, encargos CLT e impostos são defaults editáveis, não alíquotas oficiais. Não substitui cartório, contador ou orçamento de obra.
