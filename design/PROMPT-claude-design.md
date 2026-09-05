# Prompt para o Claude Design — redesenho da Airbnb Calc

Cole o texto abaixo no Claude Design e anexe `airbnb-calc-snapshot.html` (snapshot estático, todas as abas abertas, números reais) e, se quiser, `../airbnb-calc.html` (o app funcional).

---

Você vai redesenhar a interface de uma calculadora de investimento em imóveis para Airbnb/short-stay no Brasil. O app é **um único arquivo HTML**, sem servidor, sem build, sem CDN. O anexo `airbnb-calc-snapshot.html` é um snapshot estático com todas as seções visíveis de uma vez e dados reais preenchidos (1 apartamento de R$ 500 mil em São Paulo). No app real, as seções são abas.

## Quem usa e para quê

Um investidor pessoa física, sozinho, decidindo se compra um apto, uma casa ou um terreno para construir casas e alugar por diária. Ele preenche premissas (preço, ITBI, cartório, obra, diária média, ocupação, comissão da administradora, caseiro CLT, suprimentos por limpeza) e lê o veredito: CAPEX total, resultado do ano 1, payback, ocupação de equilíbrio, caixa mês a mês e P&L de 1 a 10 anos. Ele volta ao app várias vezes, muda uma premissa e olha o veredito de novo.

## O que está fraco hoje (na ordem que mais incomoda)

1. **Hierarquia dos KPIs é plana.** Nove cards iguais. O veredito (resultado ano 1, payback, equilíbrio) deveria dominar; CAPEX, receita e OPEX são contexto; reserva e caixa final são secundários.
2. **Alertas empilham em cima de tudo.** Erros bloqueantes e avisos informativos ("impostos = 0%, fale com o contador") têm o mesmo peso visual e empurram os KPIs para baixo.
3. **Tabela de unidades tem 12 inputs de ocupação numa linha.** Fica ilegível e não cabe no mobile. Precisa de outra forma de editar sazonalidade (mini-grid jan–dez, ou "flat" em destaque e 12 meses como detalhe expansível).
4. **Fluxo de caixa é uma tabela de 17 colunas.** O usuário quer ver: quando o caixa fica negativo, quanto de buraco, quando recupera. O gráfico atual é um SVG cru sem eixos nem rótulos.
5. **CAPEX é só tabela.** Falta um breakdown visual (barra empilhada por categoria: aquisição, cartório, obra, mobiliário, equipamentos, contingência) e destaque do "custo burocrático" (ITBI + cartório em % do preço).
6. **Suprimentos precisam contar uma história.** A aba existe para mostrar que limpeza e reposição abatem da diária. Hoje são três cards; deveria ser algo como "diária R$ 350 → líquida após suprimentos R$ 284 → líquida após admin e plataforma R$ …", em cascata.
7. **Defaults rotulados** ("estimativa, não tabela oficial", "confirme com o contador") estão em texto cinza miúdo. Precisam ser visíveis sem gritar.
8. **Toolbar e abas são genéricas.** Cenário conservador/base/otimista deveria ficar perto do veredito, não num canto da toolbar.
9. **Mobile** empilha, mas as tabelas viram scroll horizontal sem pista visual de que há mais colunas.
10. **Impressão** não foi pensada: o usuário quer imprimir um resumo de uma página para levar a uma conversa.

## Restrições que não podem quebrar

- **Um arquivo HTML.** CSS inline no `<style>`, nada de framework, fonte do sistema ou Google Fonts com fallback. Sem imagens externas.
- **Preserve todos os `id`, `data-k`, `data-t`, `data-p`, `data-flat`, `data-del`, `data-c`, `data-t` das abas e as classes `on`, `hide`, `neg`, `mark`, `tot`, `pct`, `s`, `w`.** O JavaScript do app se liga por esses atributos. Você pode mudar layout, ordem, wrappers, classes novas, mas não renomear nem remover esses ganchos. Se precisar de um wrapper novo, adicione por fora.
- As tabelas editáveis (CAPEX, unidades, suprimentos, rollout) são **geradas por JS via `innerHTML`**. Se você mudar a estrutura delas no snapshot, descreva a mudança como um template para eu portar ao gerador, em vez de contar com o HTML estático.
- Idioma pt-BR, números com separador de milhar, moeda BRL.
- Tema claro é o principal. Dark mode é bem-vindo via `prefers-color-scheme`, mas opcional.
- Nada de "renda passiva garantida", nada de vender administradora. Tom direto, números na frente.
- Sem gráficos por biblioteca: SVG inline ou CSS.

## O que quero de volta

1. **Um HTML redesenhado** partindo do snapshot, com a mesma informação, mantendo os ganchos acima.
2. **Um sistema de tokens** no `:root` (cores, espaçamento, tipografia, raio) que eu consiga copiar para o app real.
3. **Uma lista curta de mudanças estruturais** que exigem mexer no JS (por exemplo: "a tabela de unidades virou cards com grid 12 meses; template abaixo").
4. **Uma versão de impressão** (`@media print`) que caiba em uma página A4: nome do projeto, premissas principais, KPIs, gráfico de caixa, P&L anual.

## Critérios de aceite

- Em 5 segundos dá para dizer se o projeto se paga e em quanto tempo.
- Erro bloqueante é inconfundível; aviso informativo não compete com os KPIs.
- A ocupação mensal pode ser editada em tela de 375 px de largura.
- O gráfico de caixa tem eixo de tempo (anos), linha do zero e marca o mês em que o caixa fica negativo e o mês de payback.
- A aba Suprimentos mostra a cascata da diária bruta até a líquida.
- Nenhum `id` ou `data-*` original foi removido.
