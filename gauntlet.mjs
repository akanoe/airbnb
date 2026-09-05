// Gauntlet G1/G2/G3/G4/G4b/G6 sobre o engine extraído de airbnb-calc.html. Uso: node gauntlet.mjs
// G5 (UX) é checado no browser; aqui só a parte estática.
import { readFileSync } from "node:fs";
import vm from "node:vm";
const html = readFileSync(new URL("./airbnb-calc.html", import.meta.url), "utf8");
const engine = html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(engine + "\nthis.calc=calc;this.validate=validate;this.defaults=defaults;this.merge=merge;this.equilibrio=equilibrio;this.gerarObra=gerarObra;this.aplicarPct=aplicarPct;this.capexTotal=capexTotal;", ctx);
const { calc, validate, defaults, merge, equilibrio, gerarObra, aplicarPct, capexTotal } = ctx;
const fixture = JSON.parse(readFileSync(new URL("./fixture-g2.json", import.meta.url), "utf8"));
const clone = o => JSON.parse(JSON.stringify(o));
const results = [];
const check = (id, name, ok, evidence) => results.push({ id, name, ok: !!ok, evidence });
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const finiteDeep = (o, path = "") => { for (const [k, v] of Object.entries(o)) { if (typeof v === "number" && !Number.isFinite(v)) return path + k; if (v && typeof v === "object") { const r = finiteDeep(v, path + k + "."); if (r) return r; } } return null; };
const F = () => merge(defaults(), fixture);

// ---- G1 Schema
{
  const mini = { schema: "airbnb-calc.v1", projeto: { tipo: "casa" }, capex: [{ id: "compra", categoria: "aquisicao", valor_brl: 100 }] };
  const e1 = validate(mini);
  const c = calc(merge(defaults(), mini), "base");
  check("G1", "JSON mínimo (schema + projeto.tipo + capex[]) aceito e calcula", e1.length === 0 && c.kpis.capex_total === 100, `erros=${JSON.stringify(e1)} capex_total=${c.kpis.capex_total}`);
  const noSchema = clone(fixture); delete noSchema.schema;
  const noCapex = clone(fixture); delete noCapex.capex;
  const badTipo = clone(fixture); badTipo.projeto.tipo = "chacara";
  const semBase = clone(fixture); semBase.caseiros.ativo = true; delete semBase.caseiros.bonus_base;
  const suprSoMes = clone(fixture); suprSoMes.suprimentos = [{ id: "x", nome: "verba", custo_unitario: 500, por: "mes" }];
  check("G1", "sem schema rejeitado", validate(noSchema).length > 0, validate(noSchema)[0]);
  check("G1", "sem capex[] rejeitado", validate(noCapex).length > 0, validate(noCapex)[0]);
  check("G1", "tipo inválido rejeitado", validate(badTipo).length > 0, validate(badTipo)[0]);
  check("G1", "caseiro ativo sem bonus_base rejeitado", validate(semBase).length > 0, validate(semBase)[0]);
  check("G1", "suprimentos só 'mes' rejeitado", validate(suprSoMes).length > 0, validate(suprSoMes)[0]);
  const rt = JSON.parse(JSON.stringify(F()));
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => v && typeof v === "object" && !Array.isArray(v) ? keys(v, p + k + ".") : [p + k]);
  const lost = keys(fixture).filter(k => !keys(rt).includes(k));
  const diff = keys(fixture).filter(k => JSON.stringify(k.split(".").reduce((a, x) => a[x], fixture)) !== JSON.stringify(k.split(".").reduce((a, x) => a[x], rt)));
  check("G1", "export→import round-trip preserva campos e valores", lost.length === 0 && diff.length === 0, `perdidos=${JSON.stringify(lost)} diferentes=${JSON.stringify(diff)}`);
  const scripts = (html.match(/<script[\s\S]*?<\/script>/g) || []).join("\n");
  check("G1", "HTML sem backend/login/API Airbnb", !/fetch\(|XMLHttpRequest|oauth|login|senha|password|api\.airbnb|<script src=/i.test(scripts) && !/<script src=/.test(html), "grep nos <script> (texto visível diz 'sem login' de propósito)");
}

// ---- G2 Conta
{
  const c = calc(F(), "base"); const a = c.anos[0];
  const mao = {};
  mao.capex = 500000 + 15000 + 7500 + 40000 + 25000 + 15000;                // 602500
  mao.noites_mes = 30 * 0.6;                                                  // 18
  mao.receita = 12 * 350 * mao.noites_mes;                                    // 75600
  mao.checkouts_mes = mao.noites_mes / 3;                                     // 6
  mao.supr = 12 * (150 * mao.checkouts_mes + 25 * mao.checkouts_mes + 100);   // 13800
  mao.plat = 0.03 * mao.receita;                                              // 2268
  mao.admin = 0.20 * mao.receita;                                             // 15120
  mao.opex_fixo = 12 * (800 + 400 + 100 + 2400 / 12);                         // 18000
  mao.opex = mao.opex_fixo + mao.supr;                                        // 31800
  mao.resultado = mao.receita - mao.plat - mao.admin - mao.opex;              // 26412
  const ok = near(c.kpis.capex_total, mao.capex) && near(a.receita_diarias, mao.receita) && near(a.suprimentos, mao.supr) && near(a.plataforma, mao.plat) && near(a.admin, mao.admin) && a.impostos === 0 && near(a.opex_fixo, mao.opex_fixo) && near(a.opex_total, mao.opex) && near(a.resultado, mao.resultado) && a.caseiros === 0;
  check("G2", "ano 1 bate à mão (±1)", ok,
    `à mão: capex=${mao.capex} receita=12×350×18=${mao.receita} supr=12×(150×6+25×6+100)=${mao.supr} plat=3%=${mao.plat} admin=20%=${mao.admin} opex_fixo=12×1500=${mao.opex_fixo} opex_total=${mao.opex} resultado=${mao.resultado}\n      app:   capex=${c.kpis.capex_total} receita=${a.receita_diarias} supr=${a.suprimentos} plat=${a.plataforma} admin=${a.admin} imp=${a.impostos} opex_fixo=${a.opex_fixo} opex_total=${a.opex_total} caseiros=${a.caseiros} resultado=${a.resultado}`);
  check("G2", "caixa fim ano 1 = −capex + resultado", near(a.caixa_fim, -mao.capex + mao.resultado), `caixa_fim=${a.caixa_fim} esperado=${-mao.capex + mao.resultado}`);
  check("G2", "payback: 602500/2201 = 274 meses > 60 → null", c.kpis.payback_meses === null, `payback=${c.kpis.payback_meses}`);
  // equilíbrio à mão: margem por noite = 350×(1−0.03−0.20) − (175/3) = 269.5 − 58.33 = 211.17; custo fixo mês 1500+100 = 1600 → 7.58 noites → 25.3% → passo 0.5% → 25.5%
  const eq = equilibrio(F());
  check("G2", "occupancy de equilíbrio ≈ 25,5% (à mão 25,3%, passo 0,5%)", eq !== null && near(eq, 0.255, 0.006), `eq=${eq}`);
}

// ---- G3 Fidelidade
{
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  check("G3", "4 tipos no HTML", ["apartamento", "casa", "terreno", "terreno_casas"].every(t => new RegExp(`value="${t}"`).test(body)), "grep options");
  check("G3", "ITBI e cartório como linhas de CAPEX", defaults().capex.some(l => l.id === "itbi") && defaults().capex.some(l => l.id === "cartorio"), "defaults().capex ids");
  check("G3", "aba Suprimentos presente com custo por checkout/noite_ocupada + cascata", /id="tab-suprimentos"/.test(html) && /noite_ocupada/.test(html) && /id="casc"/.test(html), "grep");
  // suprimentos escalam com ocupação
  const lo = F(); lo.unidades[0].occupancy_mensal = Array(12).fill(0.3);
  const hi = F(); hi.unidades[0].occupancy_mensal = Array(12).fill(0.9);
  const sl = calc(lo).anos[0].suprimentos, sh = calc(hi).anos[0].suprimentos;
  check("G3", "suprimentos escalam com ocupação (0.3 vs 0.9)", sh > sl * 2, `supr@0.3=${sl} supr@0.9=${sh} (esperado 2100+1200 vs 6300+1200)`);
  // caseiro: 4 casas, 5 por caseiro → 1; bonus base explícita
  const s = F(); s.projeto.tipo = "terreno_casas"; s.caseiros = { ativo: true, salario_bruto_mes: 2500, encargos_mult: 1.8, casas_por_caseiro: 5, bonus_pct: 0.05, bonus_base: "liquida_pos_admin" };
  s.unidades = [1, 2, 3, 4].map(i => ({ id: "c" + i, nome: "Casa " + i, tipologia: "casa", m2: 60, abre_no_mes: 1, adr_brl: 350, occupancy_mensal: Array(12).fill(0.6) }));
  const m = calc(s).meses[0];
  const receita = 4 * 350 * 18, base = receita - 0.03 * receita - 0.20 * receita;
  const esperado = 1 * 2500 * 1.8 + 0.05 * base;
  check("G3", "caseiro: ⌈4/5⌉=1 × 2500×1.8 + 5% × líquida pós-admin", m.n_caseiros === 1 && near(m.caseiros, esperado), `n=${m.n_caseiros} custo=${m.caseiros} esperado=4500+0.05×${base}=${esperado}`);
  const s6 = clone(s); s6.unidades.push({ ...s6.unidades[0], id: "c5" }, { ...s6.unidades[0], id: "c6" });
  check("G3", "6 casas / 5 por caseiro → 2 caseiros", calc(s6).meses[0].n_caseiros === 2, `n=${calc(s6).meses[0].n_caseiros}`);
  const sb = clone(s); sb.caseiros.bonus_base = "receita_bruta";
  check("G3", "admin + bonus sobre bruta → aviso 'dupla mordida'", calc(sb).avisos.some(a => /dupla mordida/i.test(a)), JSON.stringify(calc(sb).avisos.filter(a => /dupla/i.test(a))));
  check("G3", "admin + bonus sobre líquida pós-admin → sem aviso de dupla mordida", !calc(s).avisos.some(a => /dupla mordida/i.test(a)), "ok");
  // administradora vs autogestão
  const auto = F(); auto.operacao.modelo = "autogestao";
  check("G3", "autogestão zera comissão admin", calc(auto).anos[0].admin === 0 && calc(F()).anos[0].admin === 15120, `auto=${calc(auto).anos[0].admin} admin=${calc(F()).anos[0].admin}`);
  // suprimentos na admin não duplica
  const na = F(); na.operacao.suprimentos_na_admin = true;
  const ca = calc(na).anos[0];
  check("G3", "suprimentos_na_admin: não abate (mas calcula bruto p/ exibição)", ca.suprimentos === 0 && ca.suprimentos_bruto === 13800 && near(ca.resultado, 26412 + 13800), `supr=${ca.suprimentos} bruto=${ca.suprimentos_bruto} resultado=${ca.resultado}`);
  // terreno: sem receita
  const t = F(); t.projeto.tipo = "terreno";
  const ct = calc(t).anos[0];
  check("G3", "tipo terreno: receita 0, só IPTU/outros", ct.receita_bruta === 0 && near(ct.opex_total, 2400), `receita=${ct.receita_bruta} opex=${ct.opex_total}`);
  // gerarObra
  const g = gerarObra(F()); g.obra = defaults().obra;
  const g2 = gerarObra(merge(defaults(), { projeto: { tipo: "terreno_casas" } }));
  const obraLine = g2.capex.find(l => l.id === "obra"), cont = g2.capex.find(l => l.id === "contingencia");
  const obraEsp = 4 * 60 * 3500, contEsp = 0.10 * (obraEsp + 4 * 25000 + 4 * 15000);
  check("G3", "gerarObra: obra=N×m²×R$/m², contingência 10%, unidades abrem no mês prazo+1", obraLine.valor_brl === obraEsp && cont.valor_brl === contEsp && g2.unidades.length === 4 && g2.unidades[0].abre_no_mes === 13, `obra=${obraLine.valor_brl} (esp ${obraEsp}) cont=${cont.valor_brl} (esp ${contEsp}) unid=${g2.unidades.length} abre=${g2.unidades[0].abre_no_mes}`);
  const ap = F(); ap.capex.find(l => l.id === "compra").valor_brl = 800000; aplicarPct(ap);
  check("G3", "aplicarPct: ITBI 3% e cartório 1,5% sobre a compra", ap.capex.find(l => l.id === "itbi").valor_brl === 24000 && ap.capex.find(l => l.id === "cartorio").valor_brl === 12000, `itbi=${ap.capex.find(l => l.id === "itbi").valor_brl} cart=${ap.capex.find(l => l.id === "cartorio").valor_brl}`);
}

// ---- G4 Caixa 12 meses
{
  const s = F(); s.unidades[0].abre_no_mes = 4;
  const c = calc(s);
  const pre = c.meses.slice(0, 3), pos = c.meses.slice(3, 12);
  check("G4", "meses antes de abre_no_mes=4: receita 0, OPEX só IPTU", pre.every(m => m.receita_bruta === 0 && near(m.opex_total, 200)) && pos.every(m => m.receita_diarias === 6300), `m1..3 receita=${pre.map(m => m.receita_bruta)} opex=${pre.map(m => m.opex_total)}; m4 receita=${pos[0].receita_diarias}`);
  check("G4", "CAPEX visível no mês 0 e caixa_0 = −602500", c.capex_mes0 === 602500 && near(-602500 + 200 * -3 + 2201 * 9, c.meses[11].caixa), `capex_mes0=${c.capex_mes0} caixa_m12=${c.meses[11].caixa}`);
  check("G4", "primeiro mês negativo marcado (0, sem saldo inicial)", c.kpis.primeiro_mes_negativo === 0, `primeiro_neg=${c.kpis.primeiro_mes_negativo}`);
  const s2 = F(); s2.operacao.saldo_inicial_brl = 700000;
  check("G4", "com saldo inicial 700k caixa nunca negativo; payback independe do saldo", calc(s2).kpis.primeiro_mes_negativo === null && calc(s2).kpis.payback_meses === null, `neg=${calc(s2).kpis.primeiro_mes_negativo} payback=${calc(s2).kpis.payback_meses}`);
  // obra espalhada
  const o = gerarObra(merge(defaults(), { projeto: { tipo: "terreno_casas" } }));
  const co = calc(o);
  const obraMes = (4 * 60 * 3500) / 12 + (0.1 * (840000 + 100000 + 60000)) / 12;
  check("G4", "obra espalhada em 12 meses; decor+equip no mês 12; receita 0 no ano 1", near(co.meses[0].capex, obraMes) && near(co.meses[11].capex, obraMes + 100000 + 60000) && co.anos[0].receita_bruta === 0 && co.anos[1].receita_bruta > 0, `capex_m1=${co.meses[0].capex} (esp ${obraMes}) capex_m12=${co.meses[11].capex} rec_a1=${co.anos[0].receita_bruta} rec_a2=${co.anos[1].receita_bruta}`);
  // payback positivo
  const p = F(); p.capex = [{ id: "compra", categoria: "aquisicao", valor_brl: 22010 }];
  check("G4", "payback = ⌈22010/2201⌉ = 10 meses", calc(p).kpis.payback_meses === 10, `payback=${calc(p).kpis.payback_meses}`);
}

// ---- G4b Anos 2–5
{
  const s = F(); s.rollout[1].occupancy_mult = 0.5; s.rollout[2].capex_extra_brl = 30000;
  const c = calc(s);
  check("G4b", "5 anos na tabela", c.anos.length === 5, `anos=${c.anos.length}`);
  check("G4b", "occupancy_mult 0.5 no ano 2 → receita metade", near(c.anos[1].receita_diarias, 37800), `rec_a2=${c.anos[1].receita_diarias}`);
  check("G4b", "capex_extra 30000 no ano 3 aparece no CAPEX do ano 3 e no total", near(c.anos[2].capex, 30000) && c.kpis.capex_total === 632500, `capex_a3=${c.anos[2].capex} total=${c.kpis.capex_total}`);
  const cum = c.anos.reduce((a, y) => a + y.resultado - y.capex, 0);
  check("G4b", "caixa fim ano 5 = Σ(resultado − capex)", near(c.anos[4].caixa_fim, cum), `caixa_fim=${c.anos[4].caixa_fim} soma=${cum}`);
  const h3 = F(); h3.projeto.horizonte_anos = 3;
  const h10 = F(); h10.projeto.horizonte_anos = 10;
  check("G4b", "horizonte 3 e 10 respeitados", calc(h3).anos.length === 3 && calc(h10).anos.length === 10 && calc(h10).meses.length === 120, `h3=${calc(h3).anos.length} h10=${calc(h10).anos.length}`);
}

// ---- G5 (estático)
{
  check("G5", "botões Exportar/Importar/Resetar/Imprimir presentes", /btnExport/.test(html) && /btnImport/.test(html) && /btnReset/.test(html) && /btnPrint/.test(html), "grep ids");
  check("G5", "formatação pt-BR (milhar)", /toLocaleString\("pt-BR"\)/.test(html), "grep");
  check("G5", "KPIs empilham no mobile (media query 720px → span 12)", /@media \(max-width:720px\)\{[\s\S]*?grid-column:span 12/.test(html), "grep css");
}

// ---- G6 Adversarial
{
  const cases = [];
  const z = F(); z.unidades[0].occupancy_mensal = Array(12).fill(0); cases.push(["occupancy 0", z]);
  const neg = F(); neg.unidades[0].adr_brl = -100; cases.push(["ADR negativo", neg]);
  const n0 = F(); n0.projeto.tipo = "terreno_casas"; n0.unidades = []; n0.caseiros.ativo = true; cases.push(["N casas 0 com caseiro ativo", n0]);
  const a2 = F(); a2.operacao.admin_pct = 1.5; cases.push(["admin_pct 1.5", a2]);
  const e0 = F(); e0.operacao.estada_media = 0; cases.push(["estada_media 0", e0]);
  const c0 = F(); c0.capex = []; cases.push(["capex vazio", c0]);
  const cp0 = F(); cp0.caseiros.ativo = true; cp0.caseiros.casas_por_caseiro = 0; cases.push(["casas_por_caseiro 0", cp0]);
  const nan = F(); nan.unidades[0].adr_brl = "abc"; nan.operacao.condominio_mes_brl = null; cases.push(["campos não numéricos", nan]);
  for (const [name, s] of cases) {
    let c, err = null; try { c = calc(s); } catch (e) { err = e.message; }
    const bad = c ? finiteDeep({ meses: c.meses, anos: c.anos, kpis: c.kpis }) : "exception";
    check("G6", `${name}: sem NaN/Infinity/exception`, !err && !bad, err ? `exception=${err}` : `nonfinite=${bad} resultado_a1=${c.anos[0].resultado} avisos=${JSON.stringify(c.avisos.filter(a => !/Impostos|reserva/.test(a)))}`);
  }
  { const ob = gerarObra(merge(defaults(), { projeto: { tipo: "terreno_casas" } })); const eo = equilibrio(ob);
    check("G6", "terreno_casas com obra de 12 meses → equilíbrio avalia o ano 2, não 'inviável'", eo !== null && eo < 1, `eq=${eo}`); }
  check("G6", "occupancy 0 → equilíbrio ainda calcula, payback null", equilibrio(z) !== null && calc(z).kpis.payback_meses === null, `eq=${equilibrio(z)} payback=${calc(z).kpis.payback_meses}`);
  check("G6", "ADR negativo → aviso humano", calc(neg).avisos.some(a => /ADR negativo/.test(a)), JSON.stringify(calc(neg).avisos.filter(a => /ADR/.test(a))));
  check("G6", "admin_pct 1.5 → travado em 100% + aviso", calc(a2).avisos.some(a => /acima de 100%/.test(a)) && near(calc(a2).anos[0].admin, 75600), `admin=${calc(a2).anos[0].admin} avisos=${JSON.stringify(calc(a2).avisos.filter(a => /100%/.test(a)))}`);
  check("G6", "N casas 0 + caseiro → 0 caseiros + aviso", calc(n0).anos[0].caseiros === 0 && calc(n0).avisos.some(a => /sem unidades/.test(a)), `caseiros=${calc(n0).anos[0].caseiros}`);
  let cut; try { JSON.parse(JSON.stringify(fixture).slice(0, 200)); cut = "parse ok?!"; } catch (e) { cut = e.message; }
  check("G6", "JSON cortado → parse falha (UI mostra 'JSON inválido (arquivo cortado…)')", cut !== "parse ok?!" && /arquivo cortado/.test(html), `parse: ${cut}`);
}

// ---- relatório
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log(`${r.ok ? "PASS" : "FAIL"} [${r.id}] ${r.name}\n      ${r.evidence}`); }
console.log(`\n${results.length - fails}/${results.length} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
