#!/usr/bin/env node
/* Testes automáticos dos dois apps (Escala de Setores e Escala 2×1 de Encarregados).
   Abre a versão mais nova de cada app num navegador sem tela (Playwright + Chromium), gera vários meses seguidos com
   dados FICTÍCIOS (pasta testes/dados) e confere as regras com um verificador independente do app.
   Uso:  node testes/rodar.js            (rápido: 3 meses de cada app + telas novas)
         node testes/rodar.js --completo (12 meses de cada app)
   Sai com código 1 se alguma regra for quebrada ou se aparecer erro de JavaScript. */
'use strict';
const fs = require('fs');
const path = require('path');

function carregarPlaywright(){
  const tentativas = ['playwright', process.env.PWPATH, path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')].filter(Boolean);
  for(const t of tentativas){ try{ return require(t); }catch(e){} }
  console.error('Playwright não encontrado. Rode antes:  cd testes && npm install && npx playwright install chromium');
  process.exit(2);
}
const { chromium } = carregarPlaywright();

const RAIZ = path.resolve(__dirname, '..');
const DADOS = path.join(__dirname, 'dados');
const COMPLETO = process.argv.includes('--completo');
const MESES = COMPLETO ? [0, 11] : [9, 11];   // outubro–dezembro tem feriado no domingo, feriados seguidos e virada de ano
const ANO = 2027;

/* versão mais nova de cada app (na raiz do repositório) */
function maisNova(prefixo){
  const v = fs.readdirSync(RAIZ).map(n => { const m = n.match(new RegExp('^' + prefixo + '(\\d+)\\.html$')); return m ? { n, v: +m[1] } : null; }).filter(Boolean).sort((a, b) => b.v - a.v)[0];
  if(!v){ console.error('Não achei ' + prefixo + '*.html na raiz do repositório.'); process.exit(2); }
  return path.join(RAIZ, v.n);
}
const APP_SETORES = maisNova('Escala_de_Setores_V');
const APP_ENC = maisNova('Escala_2x1_encarregados_V');

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✅ ' : '  ❌ ') + msg); if(!cond) falhas++; };

async function novaPagina(browser){
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  return { p, erros, ctx };
}
const mudarMes = (p, m, a) => p.evaluate(([m, a]) => {
  const A = $('ano'), M = $('mes');
  if(A.value !== String(a)){ A.value = String(a); A.dispatchEvent(new Event('change', { bubbles: true })); }
  if(M.value !== String(m)){ M.value = String(m); M.dispatchEvent(new Event('change', { bubbles: true })); }
}, [m, a]);

/* ───────────────────────── Escala de Setores ───────────────────────── */
async function testarSetores(browser){
  console.log(`\n▶ Escala de Setores — ${path.basename(APP_SETORES)}`);
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_SETORES); await p.waitForTimeout(1200);
  await p.click('#comeceFechar').catch(() => {});
  await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(1500);
  const nSet = fs.readFileSync(path.join(DADOS, 'setores_frente_de_loja_50.txt'), 'utf8').split(/\r?\n/).filter(l => /^\d+;/.test(l)).length;
  ok(await p.evaluate(() => equipe.length) === nSet, `equipe fictícia carregada (${nSet} pessoas)`);

  for(let m = MESES[0]; m <= MESES[1]; m++){
    await mudarMes(p, m, ANO); await p.waitForTimeout(900);
    await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); window.v45GotoStep?.(2, false); }); await p.waitForTimeout(300);
    await p.evaluate(() => { try{ if(liderVarias()) definirLiderVarias(true, 2); sugerirLiderancaDomingo(); }catch(e){} }); await p.waitForTimeout(300);
    for(let k = 0; k < 80; k++){
      const mais = await p.evaluate(() => { const s = [...document.querySelectorAll('select.lider-dsr')].find(s => !s.value && [...s.options].some(o => o.value)); if(!s) return false; s.value = [...s.options].find(o => o.value).value; s.dispatchEvent(new Event('change', { bubbles: true })); return true; });
      if(!mais) break;
    }
    await p.evaluate(() => window.v45GotoStep?.(5, false)); await p.waitForTimeout(300);
    const antes = await p.evaluate(() => JSON.stringify(trabalhoDomingo || {}));
    await p.evaluate(() => document.getElementById('btnGerar').click());
    for(let w = 0; w < 240; w++){ await p.waitForTimeout(250); if(await p.evaluate(a => /pronta|validada|bloquead|revis|⚠️|⛔/i.test(document.getElementById('validacao')?.innerText || '') && JSON.stringify(trabalhoDomingo || {}) !== a, antes)) break; }
    const r = await p.evaluate(() => {
      const ano = +$('ano').value, mes = +$('mes').value, doms = domingosDoMes(ano, mes), bal = balancoDoMes(ano, mes), viol = [];
      const lids = new Set(equipe.map((f, i) => i).filter(i => ehLiderancaDomingo(equipe[i])));
      doms.forEach(d => { const s = (trabalhoDomingo[d] || []).map(Number);
        s.forEach(i => { if(!equipe[i]) viol.push(`${d}: índice inválido`); else if(foraDom(equipe[i])) viol.push(`${d}: ${equipe[i].nome} não pode trabalhar no domingo`); });
        if(d !== bal){ const esc = s.filter(i => lids.has(i)).sort().join(','), esp = lideresSelecionadosDomingo(d).slice().sort().join(','); if(esc !== esp) viol.push(`${d}: liderança escalada ≠ escolhida`); }
        if(new Set(s).size !== s.length) viol.push(`${d}: pessoa repetida`); });
      equipe.forEach((f, i) => { const h = historicoManual(i); const seq = [!!h.penultimo, !!h.ultimo, ...doms.map(d => (trabalhoDomingo[d] || []).map(Number).includes(i))]; const b = doms.indexOf(bal) + 2;
        for(let k = 2; k < seq.length; k++) if(seq[k] && seq[k - 1] && seq[k - 2] && ![k, k - 1, k - 2].includes(b)) viol.push(`${f.nome}: 3 domingos seguidos`); });
      return { mes: mes + 1, dom: doms.map(d => (trabalhoDomingo[d] || []).length).join('/'), status: document.getElementById('statusBadge')?.textContent, viol };
    });
    ok(!r.viol.length, `${String(r.mes).padStart(2, '0')}/${ANO}: domingos ${r.dom} | ${r.status}${r.viol.length ? ' → ' + r.viol.slice(0, 3).join('; ') : ''}`);
  }

  // lembrete de guardar o histórico (V217)
  const lembrete = () => p.evaluate(() => { const e = document.getElementById('v217Lembrete'); return e && !e.hidden ? e.className : ''; });
  await p.waitForTimeout(1800);
  if(await p.evaluate(() => !!window.v217MarcarGuardado)){
    ok(/falta/.test(await lembrete()), 'lembrete avisa que falta guardar o histórico');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnHistorico')]);
    ok(/^Historico_Frente_de_Loja_12_2027\.json$/.test(dl.suggestedFilename()), 'nome do histórico: ' + dl.suggestedFilename());
    const arqHist = path.join(require('os').tmpdir(), 'teste_' + dl.suggestedFilename()); await dl.saveAs(arqHist);
    { const j = JSON.parse(fs.readFileSync(arqHist, 'utf8')), q = (j.loja && j.loja.quadro) || [];   // V219: o histórico leva o quadro da loja (com tempo de serviço)
      const ts = j.funcionariosPorTempoDeServico;   // V220: seção “Funcionários por tempo de serviço” guardada no arquivo
      if(j.appVersion && Number(String(j.appVersion).replace(/\D/g, '')) >= 220) ok(ts && ts.setor && ts.setor.comDataDeAdmissao === nSet && ts.loja && ts.setor.porAnosDeCasa.reduce((n, g) => n + g.quantidade, 0) === nSet, `histórico guarda “Funcionários por tempo de serviço”: ${ts?.setor?.comDataDeAdmissao} no setor, média ${ts?.setor?.tempoMedioDeCasa}`);
      if(j.appVersion && Number(String(j.appVersion).replace(/\D/g, '')) >= 219) ok(q.length === nSet && q.filter(f => f.admissao).length === q.filter(f => f.admissao).length && q.some(f => f.admissao), `histórico leva o quadro da loja: ${q.length} pessoas, ${q.filter(f => f.admissao).length} com data de admissão`); }
    await p.waitForTimeout(1800);
    ok(/ok/.test(await lembrete()), 'lembrete mostra “guardado” depois de guardar');

    // relatório do ano (V217): escala da tela + o arquivo guardado
    await p.click('#btnMenu'); await p.waitForTimeout(300); await p.click('#menuRelatorioAno'); await p.waitForTimeout(500);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#v217RelJuntar')]); await fc.setFiles(arqHist); await p.waitForTimeout(800);
    const rel = await p.evaluate(() => ({ linhas: document.querySelectorAll('.v217-rel-corpo tbody tr').length, tot: [...document.querySelectorAll('.v217-rel-corpo tbody tr')].reduce((n, tr) => n + Number(tr.querySelector('td.tot')?.textContent || 0), 0) }));
    const esperado = await p.evaluate(() => Object.values(trabalhoDomingo).reduce((n, a) => n + new Set(a).size, 0));
    ok(rel.linhas === nSet && rel.tot === esperado, `relatório do ano: ${rel.linhas} pessoas, ${rel.tot} domingos (escala: ${esperado})`);
    await p.click('#v217RelFechar');
    fs.unlinkSync(arqHist);
  }

  // escala à mão: aviso de 3 domingos seguidos (V217)
  if(await p.evaluate(() => !!window.v217AvisosManual)){
    await p.evaluate(() => { window.v206IrParaManual(); selecaoManualDomingo = {}; renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(900);
    const i = await p.evaluate(() => equipe.findIndex((f, i) => !foraDom(f) && !ehLiderancaDomingo(f) && !historicoManual(i).ultimo && !historicoManual(i).penultimo));
    const doms = await p.evaluate(() => domingosDoMes(+$('ano').value, +$('mes').value).filter(d => d !== balancoDoMes(+$('ano').value, +$('mes').value)));
    for(const d of doms.slice(0, 3)){ await p.evaluate(([d, i]) => document.querySelector(`#selecaoDomingosManual input[data-dom="${d}"][data-func="${i}"]`).click(), [d, i]); await p.waitForTimeout(200); }
    const tag = await p.evaluate(([d, i]) => document.querySelector(`#selecaoDomingosManual input[data-dom="${d}"][data-func="${i}"]`).closest('.dom-func').querySelector('.v217-tag')?.textContent || '', [doms[2], i]);
    ok(/3º domingo seguido/.test(tag), 'escala à mão: 3º domingo seguido aparece em vermelho na hora de marcar');
    await p.evaluate(() => { selecaoManualDomingo = {}; const s = $('modoGeracao'); s.value = 'motor'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

/* ───────────────────────── Escala de Encarregados ───────────────────────── */
async function testarEncarregados(browser){
  console.log(`\n▶ Escala 2×1 de Encarregados — ${path.basename(APP_ENC)}`);
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_ENC); await p.waitForTimeout(800);
  await p.evaluate(() => { localStorage.setItem('enc.prazoFolgaFeriado', '20'); localStorage.setItem('enc.v159Espalhar', '1'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1500);
  const nEnc = fs.readFileSync(path.join(DADOS, 'encarregados_15_pares.txt'), 'utf8').split(/\r?\n/).filter(l => /^\d+;/.test(l)).length;
  ok(await p.evaluate(() => equipe.length) === nEnc, `equipe fictícia carregada (${nEnc} pessoas)`);
  for(let m = MESES[0]; m <= MESES[1]; m++){
    await mudarMes(p, m, ANO); await p.waitForTimeout(900);
    // até a V161 havia o passo “Grupos” (sem efeito na escala); da V162 em diante ele não aparece mais
    if(m === MESES[0] && await p.isVisible('.step[data-step="2"]')){ await p.click('.step[data-step="2"]'); await p.waitForTimeout(400); await p.click('#btnAutoGrupos'); await p.waitForTimeout(900); }
    await p.click('.step[data-step="5"]'); await p.waitForTimeout(400);
    const antes = await p.evaluate(() => JSON.stringify(trabalhoDomingo || {}));
    await p.evaluate(() => document.getElementById('btnGerar').click());
    for(let w = 0; w < 240; w++){ await p.waitForTimeout(250); if(await p.evaluate(a => /pronta|revis|⚠️|⛔|não/i.test(document.getElementById('validacao')?.innerText || '') && JSON.stringify(trabalhoDomingo || {}) !== a, antes)) break; }
    // feriados de dia de semana: 40% da equipe trabalha e todas as sugestões de folga são aceitas
    await p.evaluate(() => { const ano = +$('ano').value, mes = +$('mes').value, fer = feriados(ano, mes); const at = equipe.map((f, i) => i).filter(i => !inativo(equipe[i]));
      Object.keys(fer).map(Number).forEach((d, k) => { if(new Date(ano, mes, d).getDay() === 0) return; trabalhoFeriado[d] = at.slice((k * 3) % Math.max(1, at.length)).concat(at).slice(0, Math.round(at.length * 0.4)); });
      montarEscalaFeriados(); gerarSugestoesFolgasFeriado(); aceitarTodasSugestoesFeriado(); });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const ano = +$('ano').value, mes = +$('mes').value, doms = domingosDoMes(ano, mes), bal = balancoDoMes(ano, mes), fer = feriados(ano, mes), viol = [], P = prazoFolgaFeriado();
      const lat = i => /latic/.test(norm(equipe[i]?.setor || ''));
      doms.forEach(d => { const s = (trabalhoDomingo[d] || []).map(Number);
        s.forEach(i => { if(!equipe[i]) viol.push(`${d}: índice inválido`); else if(inativo(equipe[i]) || foraDom(equipe[i])) viol.push(`${d}: ${equipe[i].nome} não pode trabalhar`); });
        if(d !== bal){
          if(s.length !== 3) viol.push(`${d}: ${s.length} pessoas (deveria ser 3)`);
          if(s.filter(lat).length > 1) viol.push(`${d}: mais de 1 do Laticínio`);
          if(!s.some(i => equipe[i].tipo === 'enc')) viol.push(`${d}: sem Encarregado`);
          if(!s.some(i => equipe[i].tipo === 'sub')) viol.push(`${d}: sem Subencarregado`);
          const sets = s.map(i => norm(equipe[i].setor)); if(new Set(sets).size !== sets.length) viol.push(`${d}: 2 do mesmo setor`); } });
      equipe.forEach((f, i) => { const h = historicoManual(i); const seq = [!!h.penultimo, !!h.ultimo, ...doms.map(d => (trabalhoDomingo[d] || []).map(Number).includes(i))]; const b = doms.indexOf(bal) + 2;
        for(let k = 2; k < seq.length; k++) if(seq[k] && seq[k - 1] && seq[k - 2] && ![k, k - 1, k - 2].includes(b)) viol.push(`${f.nome}: 3 domingos seguidos`); });
      const porDia = {}; let semData = 0;
      Object.keys(fer).map(Number).forEach(d => { const dtF = new Date(ano, mes, d); const trab = dtF.getDay() === 0 ? (trabalhoDomingo[d] || []) : (trabalhoFeriado[d] || []);
        if(dtF.getDay() !== 0 && typeof bloqueioFolgaFeriado === 'function') trab.forEach(i => { const mot = bloqueioFolgaFeriado(i, dtF); if(mot) viol.push(`${equipe[i].nome}: trabalha no feriado ${d} com ${mot}`); });   // V164
        trab.forEach(i => { const k = `${d}_${i}`, v = (folgasCompensatorias || {})[k]; if(!v){ semData++; return; }
          const dt = new Date(v + 'T00:00:00'), dias = Math.round((dt - dtF) / 86400000);
          if(dias < 1 || dias > P) viol.push(`folga ${k} fora do prazo (${dias} dias)`);
          if(dt.getDay() === 0) viol.push(`folga ${k} num domingo`);
          (porDia[v] = porDia[v] || []).push(i); }); });
      Object.entries(porDia).forEach(([v, l]) => { const dt = new Date(v + 'T12:00:00'), tot = contarFolgasNaData(dt, '');
        if(tot > 2) viol.push(`${v}: ${tot} de folga (máx. 2)`); if(dt.getDay() === 6 && tot > 1) viol.push(`${v}: ${tot} de folga no sábado (máx. 1)`);
        const sets = l.map(i => norm(equipe[i].setor)); if(new Set(sets).size !== sets.length) viol.push(`${v}: 2 folgas do mesmo setor`); });
      return { mes: mes + 1, dom: doms.map(d => (trabalhoDomingo[d] || []).length).join('/'), status: document.getElementById('statusBadge')?.textContent, semData, viol };
    });
    ok(!r.viol.length, `${String(r.mes).padStart(2, '0')}/${ANO}: domingos ${r.dom} | folgas de feriado sem data: ${r.semData} | ${r.status}${r.viol.length ? ' → ' + r.viol.slice(0, 3).join('; ') : ''}`);
  }
  if(await p.evaluate(() => !!window.v161MarcarGuardado)){
    await p.waitForTimeout(1800);
    const cls = () => p.evaluate(() => { const e = document.getElementById('v161Lembrete'); return e && !e.hidden ? e.className : ''; });
    ok(/falta/.test(await cls()), 'lembrete avisa que falta guardar o histórico');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnHistorico')]);
    ok(/^Historico_Encarregados_12_2027\.json$/.test(dl.suggestedFilename()), 'nome do histórico: ' + dl.suggestedFilename());
    await p.waitForTimeout(1800);
    ok(/ok/.test(await cls()), 'lembrete mostra “guardado” depois de guardar');
  }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

(async () => {
  const t0 = Date.now();
  // os endereços fixos do site (setores/ e encarregados/) precisam ser a cópia da versão atual
  for(const [pasta, app] of [['setores', APP_SETORES], ['encarregados', APP_ENC]]){
    const idx = path.join(RAIZ, pasta, 'index.html');
    if(fs.existsSync(idx)) ok(fs.readFileSync(idx, 'utf8') === fs.readFileSync(app, 'utf8'), `${pasta}/index.html é a cópia de ${path.basename(app)}`);
  }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try{ await testarSetores(browser); await testarEncarregados(browser); }
  catch(e){ console.error('\n❌ O teste parou: ' + e.message); falhas++; }
  finally{ await browser.close(); }
  console.log(`\n${falhas ? '❌ ' + falhas + ' falha(s)' : '✅ Tudo certo'} — ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(falhas ? 1 : 0);
})();
