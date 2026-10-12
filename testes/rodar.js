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
  {   // V221: quem não está afastado é apto ao domingo (exceto jovem aprendiz) e não tem folga fixa no domingo
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => { const ap = f => { try{ return !!window.v157Regras?.bloqueioDomingo?.(f); }catch(e){ return false; } };
      const at = todasEquipes.filter(f => String(f.situacao || 'A').toUpperCase() === 'A' && !ap(f));
      return { n: at.length, foraDom: at.filter(f => foraDom(f)).length, domingo: at.filter(f => Number(f.folgaFixa) === 0).length, aDefinir: at.filter(f => f.folgaPendente).length }; });
    if(await p.evaluate(() => !!window.v221Normalizar)) ok(!r.foraDom && !r.domingo, `todos os ${r.n} ativos estão aptos ao domingo (folga no domingo virou “a definir”: ${r.aDefinir})`);
  }

  for(let m = MESES[0]; m <= MESES[1]; m++){
    await mudarMes(p, m, ANO); await p.waitForTimeout(900);
    await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); window.v45GotoStep?.([...document.querySelectorAll('.stepper .step')].findIndex(b => b.dataset.panel === 'coberturaCard'), false); }); await p.waitForTimeout(300);
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
      if(j.appVersion && Number(String(j.appVersion).replace(/\D/g, '')) >= 219) ok(q.length === nSet && q.filter(f => f.admissao).length === nSet, `histórico leva o quadro da loja: ${q.length} pessoas, ${q.filter(f => f.admissao).length} com data de admissão`); }
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
    await p.evaluate(() => { window.v206IrParaManual(); selecaoManualDomingo = {}; const m=$('modoGeracao'); if(m){m.value='manual';m.dispatchEvent(new Event('change',{bubbles:true}));} renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(900);
    // V233: cartões da escala manual oferecem sugestões e rejeitá-las não mexe na escala.
    const btnSug = p.locator('#selecaoDomingosManual .v233-sugestoes [data-v233-gerar]').first();
    const temPainelSug = await btnSug.count();
    ok(temPainelSug > 0, 'V233: painel de sugestões aparece nos cartões da escala manual');
    if(temPainelSug){
      await btnSug.click(); await p.waitForTimeout(350);
      const temListaSug = await p.locator('#selecaoDomingosManual .v233-sugestoes input[data-v233-candidato]').count();
      const semCandidatos = await p.locator('#selecaoDomingosManual .v233-sugestoes .v233-vazio').count();
      ok(temListaSug > 0, `V233/V234: gerar sugestões apresenta candidatos (${temListaSug}) — os dados fictícios têm operacionais aptos, então “nenhum” é defeito`);   // V234: antes aceitava “nenhum candidato”, e versões que não sugeriam ninguém passavam
      if(temListaSug > 0){
        const btnAceitar = p.locator('#selecaoDomingosManual .v233-sugestoes [data-v233-aceitar]').first();
        ok(await btnAceitar.count() > 0, 'V233: lista de candidatos oferece aceite explícito');
        if(await btnAceitar.count()){
          await btnAceitar.click(); await p.waitForTimeout(500);
          const verifAceite = await p.evaluate(() => {
            const selecionados=Object.entries(selecaoManualDomingo||{}).flatMap(([d,a])=>(a||[]).map(Number).map(i=>({d,i})));
            return {unicos:selecionados.length===new Set(selecionados.map(x=>x.d+':'+x.i)).size,
              elegiveis:selecionados.every(({i})=>equipe[i]&&String(equipe[i].situacao||'A').toUpperCase()==='A'&&!foraDom(equipe[i])&&!ehLiderancaDomingo(equipe[i]))};
          });
          ok(verifAceite.unicos&&verifAceite.elegiveis, 'V233: aceite mantém matrículas sem duplicidade e só deixa operacionais elegíveis selecionados');
          const aud234 = await p.evaluate(() => { const r = window.v227Auditar?.(); return r ? r.r.length : -1; });
          ok(aud234 === 0, `V234: depois de aceitar as sugestões a auditoria ao vivo não tem regra quebrada (${aud234})`);
          const semHora = await p.evaluate(() => Object.entries(selecaoManualDomingo||{}).reduce((n,[d,a]) => n + (a||[]).filter(i => !horarioManualValido(Number(d), Number(i))).length, 0));
          ok(semHora === 0, `V235: quem entra pela sugestão já vem com horário de domingo válido (${semHora} sem horário)`);   // sem horário o “Gerar” bloqueia
        }
      }
      await p.evaluate(() => { selecaoManualDomingo = {}; renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(250);
      const btnRejeitar = p.locator('#selecaoDomingosManual .v233-sugestoes [data-v233-gerar]').first();
      if(await btnRejeitar.count()){ await btnRejeitar.click(); await p.waitForTimeout(150); const rej=p.locator('#selecaoDomingosManual .v233-sugestoes [data-v233-rejeitar]').first(); if(await rej.count())await rej.click(); }
      ok(await p.evaluate(() => Object.values(selecaoManualDomingo||{}).every(a=>!a||!a.length)), 'V233: dispensar sugestões preserva a escala sem inclusões');
    }
    if(await p.evaluate(() => !!window.v234Sugestoes)){   // V234: cobertura por função (como no Açougue) não pode barrar as sugestões
      const cob = await p.evaluate(() => { const orig = coberturaOperacional; selecaoManualDomingo = {};
        coberturaOperacional = idx => ({ ok: false, faltas: ['Operacionais: ' + idx.length + '/999'] });   // aviso muda a cada pessoa (“1/999”, “2/999”…)
        try{ const bal = balancoDoMes(+$('ano').value, +$('mes').value), d = domingosDoMes(+$('ano').value, +$('mes').value).find(x => x !== bal);
          const vagas = window.v234Sugestoes.vagasDoDia(d), c = window.v234Sugestoes.candidatosDoDia(d, vagas); return { vagas, n: c.length }; }
        finally{ coberturaOperacional = orig; } });
      ok(cob.vagas > 0 && cob.n === cob.vagas, `V234: com cobertura por função incompleta (aviso “falta completar”), as sugestões enchem as vagas (${cob.n} de ${cob.vagas})`);
    }
    if(await p.evaluate(() => !!window.v234Sugestoes)){   // V235: mês inteiro só com sugestões → o “Gerar” da escala à mão aceita (horário preenchido, quantidade do cartão)
      await p.evaluate(() => { selecaoManualDomingo = {}; horariosManuaisDomingo = {}; renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(500);
      const dsTodos = await p.evaluate(() => { const bal = balancoDoMes(+$('ano').value, +$('mes').value); return domingosDoMes(+$('ano').value, +$('mes').value).filter(d => d !== bal); });
      for(const d of dsTodos){ const c = `#selecaoDomingosManual .dom-card[data-geracao-dom="${d}"]`;
        await p.click(`${c} [data-v233-gerar]`).catch(() => {}); await p.waitForTimeout(150);
        if(await p.locator(`${c} [data-v233-aceitar]`).count()){ await p.click(`${c} [data-v233-aceitar]`); await p.waitForTimeout(250); } }
      await p.evaluate(() => { window.v45GotoStep?.(5, false); document.getElementById('btnGerar').click(); }); await p.waitForTimeout(2500);
      const ger = await p.evaluate(() => (document.getElementById('validacao')?.innerText || '').replace(/\s+/g, ' ').slice(0, 160));
      ok(/validada e gerada/i.test(ger), `V235: mês inteiro preenchido só com sugestões e o “Gerar” da escala à mão aceita — “${ger.slice(0, 90)}”`);
      await p.evaluate(() => window.v45GotoStep?.([...document.querySelectorAll('.stepper .step')].findIndex(b => b.dataset.panel === 'coberturaCard'), false)); await p.waitForTimeout(300);
    }
    await p.evaluate(() => { const m=$('modoGeracao'); if(m){m.value='manual';m.dispatchEvent(new Event('change',{bubbles:true}));} selecaoManualDomingo = {}; renderSelecaoDomingosGeracao(); });
    await p.waitForTimeout(400);
    const i = await p.evaluate(() => equipe.findIndex((f, i) => !foraDom(f) && !ehLiderancaDomingo(f) && !historicoManual(i).ultimo && !historicoManual(i).penultimo));
    const doms = await p.evaluate(() => domingosDoMes(+$('ano').value, +$('mes').value).filter(d => d !== balancoDoMes(+$('ano').value, +$('mes').value)));
    for(const d of doms.slice(0, 3)){ await p.evaluate(([d, i]) => document.querySelector(`#selecaoDomingosManual input[data-dom="${d}"][data-func="${i}"]`).click(), [d, i]); await p.waitForTimeout(200); }
    const tag = await p.evaluate(([d, i]) => document.querySelector(`#selecaoDomingosManual input[data-dom="${d}"][data-func="${i}"]`).closest('.dom-func').querySelector('.v217-tag')?.textContent || '', [doms[2], i]);
    if(await p.evaluate(() => !!window.v227Auditar)){   // V227: a auditoria ao vivo não deixa marcar o 3º domingo seguido
      const marcado = await p.evaluate(([d, i]) => (selecaoManualDomingo[d] || []).map(Number).includes(i), [doms[2], i]);
      ok(!marcado, 'escala à mão: a auditoria ao vivo bloqueia o 3º domingo seguido na hora de marcar');
      const aud = await p.evaluate(() => { const r = window.v227Auditar(); return r ? r.r.length : -1; });
      ok(aud === 0, `auditoria ao vivo sem regra quebrada depois do bloqueio (${aud})`);
      if(await p.evaluate(() => !!window.v228DomsDe)){   // V228: cada aviso da auditoria vai para o domingo certo
        const lig = await p.evaluate(([d0, d1, i]) => { const nome = equipe[i].nome, dd = d => String(d).padStart(2, '0'), mm = String(+$('mes').value + 1).padStart(2, '0'), aa = +$('ano').value, f = window.v228DomsDe;
          return { semData: f(`${nome}: folga fixa a definir (escolha no cartão do domingo).`), periodo: f(`${nome}: sequência de 7 dias trabalhados de ${dd(Math.max(1, d0 - 3))}/${mm}/${aa} a ${dd(d0 + 3)}/${mm}/${aa}; escala incompatível com a proteção 6×1.`),
                   comData: f(`${dd(d1)}/${mm}/${aa}: ${nome} está sem horário de domingo.`), outroMes: f(`${dd(d1)}/${mm}/${aa + 1}: ${nome} está sem horário de domingo.`) }; }, [doms[0], doms[1], i]);
        ok(JSON.stringify(lig.semData) === JSON.stringify([doms[0], doms[1]]) && JSON.stringify(lig.periodo) === JSON.stringify([doms[0]]) && JSON.stringify(lig.comData) === JSON.stringify([doms[1]]) && !lig.outroMes.length,
           `auditoria ligada ao domingo certo (sem data → ${lig.semData}; 6×1 → ${lig.periodo}; com data → ${lig.comData}; outro mês → nenhum)`);
      }
    } else ok(/3º domingo seguido/.test(tag), 'escala à mão: 3º domingo seguido aparece em vermelho na hora de marcar');
    await p.evaluate(() => { selecaoManualDomingo = {}; const s = $('modoGeracao'); s.value = 'motor'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  }

  // V229: virada do mês — feriado na segunda-feira dia 1º (01/05/2028); o domingo de antes (30/04) é do MÊS PASSADO.
  // Quem trabalhou esse domingo (passo “Mês passado”) e tem folga fixa na segunda NÃO pode trabalhar o feriado,
  // e as conferências de 6×1 têm que contar esse domingo como trabalhado.
  await mudarMes(p, 4, 2028); await p.waitForTimeout(900);
  const vir = await p.evaluate(() => {
    const i = equipe.findIndex(f => Number(f.folgaFixa) === 1 && !foraDom(f) && !ehLiderancaDomingo(f));
    if(i < 0) return null;
    const dt = new Date(2028, 4, 1, 12), marca = v => { const c = $('hist_ult_' + i); if(c) c.checked = v; return !!c; };
    const tinha = marca(false), semDom = feriadoFixaObrigatoria(i, dt);
    marca(true); const comDom = feriadoFixaObrigatoria(i, dt);
    const tf = JSON.stringify(trabalhoFeriado), td = JSON.stringify(trabalhoDomingo);
    trabalhoFeriado[1] = [i]; trabalhoDomingo = {};   // força: trabalha o feriado e nenhum domingo de maio → 30/04 a 06/05 = 7 dias seguidos
    const nome = equipe[i].nome, pega = l => (l || []).some(t => t.startsWith(nome + ':') && /7 dias/.test(t));
    const sim = pega(auditarProtecao6x1Simulada({}, {})), motor = pega(auditarProtecao6x1({}));
    trabalhoFeriado = JSON.parse(tf); trabalhoDomingo = JSON.parse(td); marca(false);
    return { tinha, semDom, comDom, sim, motor };
  });
  if(vir){
    ok(vir.tinha, 'virada do mês: o passo “Mês passado” tem a marcação do último domingo');
    ok(vir.semDom === false && vir.comDom === true, `virada do mês: feriado 01/05/2028 (segunda) — folga fixa obrigatória só para quem trabalhou o domingo 30/04 (não trabalhou: ${vir.semDom ? 'obrigatória' : 'livre'}; trabalhou: ${vir.comDom ? 'obrigatória' : 'livre'})`);
    ok(vir.sim && vir.motor, `virada do mês: 6×1 conta o domingo do mês passado (auditoria da escala à mão: ${vir.sim ? 'acusa' : 'não acusa'}; conferência do motor: ${vir.motor ? 'acusa' : 'não acusa'} 30/04–06/05)`);
  } else ok(false, 'virada do mês: não achei pessoa com folga fixa na segunda nos dados fictícios');
  // V230: a lista manual oculta liderança, AF e EP, mas mantém ativo com folga fixa no domingo.
  {
    const resultado = await p.evaluate(() => {
      const backup = equipe.map(f => ({...f}));
      if(backup.length < 4) return {vis:{erro:'equipe fictícia insuficiente'},backup};
      equipe.splice(0,equipe.length,...backup.slice(0,4));
      equipe[0].nome='OPERACIONAL ATIVO TESTE'; equipe[0].cargo='OPERADOR DE LOJA'; equipe[0].situacao='A'; equipe[0].folgaFixa=0;
      equipe[1].nome='AFASTADO TESTE'; equipe[1].cargo='OPERADOR DE LOJA'; equipe[1].situacao='AF'; equipe[1].folgaFixa=2;
      equipe[2].nome='EMPRESTADO TESTE'; equipe[2].cargo='OPERADOR DE LOJA'; equipe[2].situacao='EP'; equipe[2].folgaFixa=2;
      equipe[3].nome='LIDERANCA TESTE'; equipe[3].cargo='ENCARREGADO'; equipe[3].situacao='A'; equipe[3].folgaFixa=2;
      window.v206IrParaManual(); const modo=$('modoGeracao'); modo.value='manual'; modo.dispatchEvent(new Event('change',{bubbles:true})); renderSelecaoDomingosGeracao();
      const txt = document.querySelector('#selecaoDomingosManual')?.innerText || '';
      return {vis:{ativo:txt.includes('OPERACIONAL ATIVO TESTE'), af:txt.includes('AFASTADO TESTE'), ep:txt.includes('EMPRESTADO TESTE'), lider:txt.includes('LIDERANCA TESTE')},backup};
    });
    fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
    await p.locator('#selecaoDomingosManual .dom-card').first().screenshot({path:path.join(__dirname,'screenshots','setores-v230-lista-manual.png')});
    ok(resultado.vis.ativo && !resultado.vis.af && !resultado.vis.ep && !resultado.vis.lider,
      `V230: lista manual mantém ativo com folga dominical e oculta AF/EP/liderança (${JSON.stringify(resultado.vis)})`);
    await p.evaluate(backup => { equipe.splice(0,equipe.length,...backup); renderSelecaoDomingosGeracao(); }, resultado.backup);
  }


  // V231: funcionário EP permanece único na origem, mas conta e escala no destino.
  {
    const r = await p.evaluate(() => {
      const backup = todasEquipes.map(f => ({...f}));
      const mat = 'TEST-EP-V231';
      const ativo = {matricula:mat,nome:'EMPRESTADO V231',cargo:'OPERADOR DE LOJA',horario:'07:40-16:00',setor:'Açougue',setorEmprestimo:'',situacao:'A',aptoDomingo:true,aptidaoId:'test-ep-v231',folgaFixa:2};
      todasEquipes.push(ativo);
      const antesOrigem = equipeDoSetor('Açougue').filter(f => String(f.situacao||'A').toUpperCase() !== 'EP').length;
      const antesDestino = equipeDoSetor('Padaria').filter(f => String(f.situacao||'A').toUpperCase() !== 'EP').length;
      const f = todasEquipes.find(x => String(x.matricula) === mat);
      f.situacao = 'EP'; f.setorEmprestimo = 'Padaria'; f.aptoDomingo = false;
      const origem = equipeDoSetor('Açougue');
      const destino = equipeDoSetor('Padaria');
      const o = origem.find(x => String(x.matricula) === mat);
      const d = destino.find(x => String(x.matricula) === mat);
      const txt = equipeTextoDosDados([{aptidaoId:f.aptidaoId,matricula:mat,nome:f.nome,cargo:f.cargo,horario:f.horario,setor:f.setor,setorEmprestimo:f.setorEmprestimo,subsetor:'',turno:'ABERTURA',folga:2,pendente:false,situacao:'EP',naoAptoDomingo:false}]);
      const linhaTxt = txt.split(/\r?\n/).find(l=>l.startsWith(mat+';')) || '';
      const projeto = window.v147MontarProjeto();
      const result = {origemEP:!!o && o.situacao === 'EP', origemBloqueada:!origem.filter(x=>String(x.matricula)===mat&&String(x.situacao||'A')!=='EP').length,
        origemContaReduzida:origem.filter(x=>String(x.situacao||'A').toUpperCase()!=='EP').length===antesOrigem-1,
        destinoSetorPadaria:!!d && d.setor === 'Padaria',
        destinoIdentificaOrigem:!!d && d.setorOrigemEmprestimo === 'Açougue' && d.emprestadoDe === 'Açougue',
        destinoMarcadoEmprestado:!!d && d.emprestado === true && d.situacaoCadastro === 'EP',
        destinoAtivoParaEscala:!!d && d.situacao === 'A',
        destinoAptoDomingo:!!d && d.aptoDomingo === true,
        destinoDisponivel:!!d && d.situacao === 'A' && d.aptoDomingo === true,
        destinoContaAumentada:destino.filter(x=>String(x.situacao||'A').toUpperCase()!=='EP').length===antesDestino+1,
        matriculaUnica:todasEquipes.filter(x=>String(x.matricula)===mat).length===1,
        equipeTxtPersiste:txt.includes('AptidaoDomingo;SetorEmprestimo')&&linhaTxt.endsWith(';Padaria'),
        historicoPersiste:projeto?.equipe?.todas?.find(x=>String(x.matricula)===mat)?.setorEmprestimo==='Padaria'};
      todasEquipes.splice(0,todasEquipes.length,...backup);
      return result;
    });
    ok(r.origemEP && r.origemBloqueada && r.origemContaReduzida && r.destinoSetorPadaria && r.destinoIdentificaOrigem && r.destinoMarcadoEmprestado && r.destinoAtivoParaEscala && r.destinoAptoDomingo && r.destinoDisponivel && r.destinoContaAumentada && r.matriculaUnica && r.equipeTxtPersiste && r.historicoPersiste,
      'V231: Açougue → Padaria; destino ativo e apto, identifica origem, contagens corretas, matrícula única e persistência TXT/histórico ('+JSON.stringify(r)+')');
  }

  if(await p.evaluate(() => !!window.gbIcones)){   // V236/V166: figuras coloridas (Noto) no lugar dos emojis (botões, menus, títulos)
    await p.waitForTimeout(300);
    const ic = await p.evaluate(() => ({ n: document.querySelectorAll('img.gb-ic').length, vazios: [...document.querySelectorAll('img.gb-ic')].filter(i => !/^data:image\/webp;base64,.{100}/.test(i.getAttribute('src') || '') || (i.complete && !i.naturalWidth)).length }));
    ok(ic.n > 10 && ic.vazios === 0, `ícones coloridos (Noto) na tela: ${ic.n} figuras, ${ic.vazios} quebradas`);
    const logo = await p.evaluate(() => { const i = document.querySelector('img.brand-logo'); return i ? { w: i.naturalWidth, h: i.naturalHeight } : null; });
    ok(logo && logo.h / logo.w > 0.6, `logo do Guanabara completo, com a ponta do triângulo (${logo ? logo.w + '×' + logo.h : 'sem logo'})`);   // a imagem antiga era cortada embaixo (420×214)
  }
  { const ordem = await p.$$eval('.stepper .step', b => b.filter(x => getComputedStyle(x).display !== 'none' && !x.classList.contains('config-step-hidden')).map(x => x.querySelector('b').textContent.trim()));
    if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 238) ok(ordem.join(' → ') === 'Equipe → Mês passado → Domingos → Feriados → Gerar', 'Setores: passos na ordem ' + ordem.join(' → ')); }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

/* ───────────────────────── Escala de Encarregados ───────────────────────── */
/* verificador independente das regras dos Encarregados (domingos, feriados e folgas de feriado) */
async function verificarEnc(p){
  return p.evaluate(() => {
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
}
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
    if(m === MESES[0] && await p.isVisible('.step[data-step="2"][data-panel="coberturaCard"]')){ await p.click('.step[data-step="2"]'); await p.waitForTimeout(400); await p.click('#btnAutoGrupos'); await p.waitForTimeout(900); }
    await p.click('.step[data-step="5"]'); await p.waitForTimeout(400);
    const antes = await p.evaluate(() => JSON.stringify(trabalhoDomingo || {}));
    await p.evaluate(() => document.getElementById('btnGerar').click());
    for(let w = 0; w < 240; w++){ await p.waitForTimeout(250); if(await p.evaluate(a => /pronta|revis|⚠️|⛔|não/i.test(document.getElementById('validacao')?.innerText || '') && JSON.stringify(trabalhoDomingo || {}) !== a, antes)) break; }
    // feriados de dia de semana: 40% da equipe trabalha e todas as sugestões de folga são aceitas
    await p.evaluate(() => { const ano = +$('ano').value, mes = +$('mes').value, fer = feriados(ano, mes); const at = equipe.map((f, i) => i).filter(i => !inativo(equipe[i]));
      Object.keys(fer).map(Number).forEach((d, k) => { if(new Date(ano, mes, d).getDay() === 0) return; trabalhoFeriado[d] = at.slice((k * 3) % Math.max(1, at.length)).concat(at).slice(0, Math.round(at.length * 0.4)); });
      montarEscalaFeriados(); gerarSugestoesFolgasFeriado(); aceitarTodasSugestoesFeriado(); });
    await p.waitForTimeout(800);
    const r = await verificarEnc(p);
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
  if(await p.evaluate(() => !!window.gbIcones)){   // V236/V166: figuras coloridas (Noto) no lugar dos emojis (botões, menus, títulos)
    await p.waitForTimeout(300);
    const ic = await p.evaluate(() => ({ n: document.querySelectorAll('img.gb-ic').length, vazios: [...document.querySelectorAll('img.gb-ic')].filter(i => !/^data:image\/webp;base64,.{100}/.test(i.getAttribute('src') || '') || (i.complete && !i.naturalWidth)).length }));
    ok(ic.n > 10 && ic.vazios === 0, `ícones coloridos (Noto) na tela: ${ic.n} figuras, ${ic.vazios} quebradas`);
    const logo = await p.evaluate(() => { const i = document.querySelector('img.brand-logo'); return i ? { w: i.naturalWidth, h: i.naturalHeight } : null; });
    ok(logo && logo.h / logo.w > 0.6, `logo do Guanabara completo, com a ponta do triângulo (${logo ? logo.w + '×' + logo.h : 'sem logo'})`);   // a imagem antiga era cortada embaixo (420×214)
  }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

/* V167 — escala à mão dos Encarregados: 3 meses seguidos montados à mão (um com domingo de balanço), Misto, bloqueios e memória */
async function testarEncManual(browser){
  console.log('\n▶ Encarregados — escala à mão (✋ À mão / 🤝 Misto)');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_ENC); await p.waitForTimeout(800);
  await p.evaluate(() => { localStorage.setItem('enc.prazoFolgaFeriado', '20'); }); await p.reload(); await p.waitForTimeout(1200);
  await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1500);
  const gerarE = async () => { const antes = await p.evaluate(() => JSON.stringify(trabalhoDomingo || {}) + document.getElementById('validacao').innerText);
    await p.evaluate(() => document.getElementById('btnGerar').click());
    for(let w = 0; w < 120; w++){ await p.waitForTimeout(150); if(await p.evaluate(a => JSON.stringify(trabalhoDomingo || {}) + document.getElementById('validacao').innerText !== a, antes)) break; }
    await p.waitForTimeout(300); return p.evaluate(() => document.getElementById('validacao').innerText); };
  // mês com balanço no penúltimo domingo (novembro)
  await p.evaluate(a => { datasBalanco.push({ d: 21, m: 10, a }); }, ANO);
  for(const m of [9, 10, 11]){
    await mudarMes(p, m, ANO); await p.waitForTimeout(900);
    await p.evaluate(() => { const k = [...document.querySelectorAll('.stepper .step')].findIndex(b => b.dataset.panel === 'domingosEtapa'); window.v80GotoStep(k >= 0 ? k : 5, false); }); await p.waitForTimeout(400);   // V169+: os domingos têm passo próprio
    if(m === 9){
      if(await p.evaluate(() => !!document.getElementById('domingosEtapa'))){
        const ordem = await p.$$eval('.stepper .step', b => b.filter(x => x.offsetParent !== null).map(x => x.querySelector('b').textContent.trim()));
        ok(ordem.join(' → ') === 'Equipe → Mês passado → Domingos → Feriados → Gerar', 'passos na ordem: ' + ordem.join(' → '));   // V171: igual ao Setores (o “Mês” virou “📅 Mês e opções”)
        if(await p.evaluate(() => !!window.v171AbrirMes)){
          const nav = await p.evaluate(async () => { const ativo = () => document.querySelector('.step-panel.active')?.id; const r = {};
            window.v80GotoStep(0, false); document.querySelector('#v80BottomBar [data-bar="primary"]').click(); await new Promise(z => setTimeout(z, 200)); r.proximo = ativo();
            window.v171AbrirMes(); await new Promise(z => setTimeout(z, 200)); r.mes = ativo();
            document.querySelector('#v80BottomBar [data-bar="primary"]').click(); await new Promise(z => setTimeout(z, 200)); r.depois = ativo(); return r; });
          ok(nav.proximo === 'historicoCard' && nav.mes === 'configCard' && nav.depois === 'historicoCard', `“Próximo” vai da Equipe ao Mês passado; “📅 Mês e opções” abre o mês e volta ao Mês passado (${JSON.stringify(nav)})`);
          await p.evaluate(() => { const k = [...document.querySelectorAll('.stepper .step')].findIndex(b => b.dataset.panel === 'domingosEtapa'); window.v80GotoStep(k, false); }); await p.waitForTimeout(300);
        }
      }
      await p.click('[data-modo="manual"]'); await p.waitForTimeout(300);
      ok(await p.$$eval('.v167-card', c => c.length) === await p.evaluate(() => domingosDoMes(+$('ano').value, +$('mes').value).length), 'escala à mão: um cartão por domingo');
      const txt = await gerarE();
      ok(/Ainda não dá para gerar/.test(txt) && await p.evaluate(() => !Object.values(trabalhoDomingo || {}).some(a => a && a.length)), 'à mão com domingo vazio: o Gerar não gera e diz o que falta');
      // marca 1 pela caixinha e tenta outra pessoa do MESMO setor (tem que ser recusada)
      const d0 = await p.evaluate(() => domingosDoMes(+$('ano').value, +$('mes').value)[0]);
      const par = await p.evaluate(() => { const i = equipe.findIndex(f => f.tipo === 'enc' && !foraDom(f) && !/latic/.test(norm(f.setor))); const j = equipe.findIndex((f, k) => k !== i && norm(f.setor) === norm(equipe[i].setor) && !foraDom(f)); return [i, j]; });
      await p.check(`#v167c${d0} input[data-p="${par[0]}"]`); await p.waitForTimeout(250);
      const dis = await p.$eval(`#v167c${d0} input[data-p="${par[1]}"]`, x => x.disabled);
      const mo = await p.evaluate(([j, d]) => v167.motivo(j, d, v167.sel()), [par[1], d0]);
      ok(dis && /mesmo setor/i.test(mo) && !(await p.evaluate(d => v167.sel()[d], d0)).includes(par[1]), `pessoa do mesmo setor fica cinza e não entra (“${mo}”)`);
      ok(await p.evaluate(([i, d]) => !v167.marcar(i, d, true) && !v167.sel()[d].includes(i), [par[1], d0]), 'marcar direto alguém do mesmo setor também é recusado');
      // busca por matrícula
      const mat = await p.evaluate(() => { const s = v167.sel(), d = domingosDoMes(+$('ano').value, +$('mes').value)[0]; const k = equipe.findIndex((f, i) => !v167.motivo(i, d, s) && !s[d].includes(i)); return [k, equipe[k].matricula]; });
      await p.fill(`[data-busca="${d0}"]`, String(mat[1])); await p.waitForTimeout(200); await p.press(`[data-busca="${d0}"]`, 'Enter'); await p.waitForTimeout(300);
      ok((await p.evaluate(d => v167.sel()[d], d0)).includes(mat[0]), 'busca pela matrícula + Enter marca a pessoa');
    }
    if(m === 10){   // 📌 o 1º domingo mostra quem foi previsto no mês passado (as folgas antes dele já foram avisadas)
      const d1 = await p.evaluate(() => domingosDoMes(+$('ano').value, +$('mes').value)[0]);
      const prev = await p.evaluate(d => { const l = indicesDaPrevisao(previsaoDoDomingo(+$('ano').value, +$('mes').value, d)); return l ? l.slice().sort() : null; }, d1);
      const btn = await p.$(`[data-acao="previsao"][data-d="${d1}"]`); if(btn){ await btn.click(); await p.waitForTimeout(250); }
      ok(prev && btn && JSON.stringify(await p.evaluate(d => v167.sel()[d].slice().sort(), d1)) === JSON.stringify(prev), '📌 1º domingo: “Usar estas pessoas” coloca quem foi previsto no mês passado');
    }
    // completa cada domingo com 💡 Sugestão do app → ✅ Colocar no domingo
    const doms = await p.evaluate(() => { const a = +$('ano').value, m = +$('mes').value, b = balancoDoMes(a, m); return domingosDoMes(a, m).filter(d => d !== b); });
    let semSug = 0;
    for(const d of doms){
      if(await p.evaluate(d => v167.sel()[d].length, d) >= 3) continue;
      await p.click(`[data-acao="sugerir"][data-d="${d}"]`); await p.waitForTimeout(150);
      const b = await p.$(`[data-acao="aceitar"][data-d="${d}"]`); if(!b){ semSug++; continue; }
      await b.click(); await p.waitForTimeout(150);
    }
    const au = await p.evaluate(() => v167.auditar());
    ok(!semSug && !au.r.length && !au.y.length, `${String(m + 1).padStart(2, '0')}/${ANO}: todos os domingos preenchidos pela 💡 sugestão, conferência ✅${semSug ? ' — sem sugestão em ' + semSug : ''}${au.r.length + au.y.length ? ' → ' + [...au.r, ...au.y].slice(0, 2).map(x => x.t).join('; ') : ''}`);
    const txt = await gerarE();
    const igual = await p.evaluate(() => { const s = v167.sel(), b = balancoDoMes(+$('ano').value, +$('mes').value); return Object.keys(s).every(d => +d === b || JSON.stringify([...s[d]].sort()) === JSON.stringify([...(trabalhoDomingo[d] || [])].map(Number).sort())); });
    const r = await verificarEnc(p);
    ok(/pronta/.test(txt) && igual && !r.viol.length, `${String(r.mes).padStart(2, '0')}/${ANO} à mão: gerada igual ao que foi marcado | domingos ${r.dom}${r.viol.length ? ' → ' + r.viol.slice(0, 3).join('; ') : ''}`);

    // V169: no passo Feriados, quem foi marcado à mão num domingo não pode trabalhar no feriado que cai na folga (DSR) desse domingo
    if(m === 10 && await p.evaluate(() => !!document.getElementById('domingosEtapa'))){
      const f = await p.evaluate(a => { const D = 14, fer = new Date(a, 10, 15);   // 15/11 (segunda, feriado) logo depois do domingo 14/11
        const bkT = trabalhoDomingo, bkD = descansosDomingo; trabalhoDomingo = {}; descansosDomingo = {};   // só a marcação à mão conta (escala ainda não gerada)
        const i = equipe.findIndex(f => Number(f.folgaFixa) === 1 && !foraDom(f)); if(i < 0){ trabalhoDomingo = bkT; descansosDomingo = bkD; return null; }
        const est = v167.estado(), k = `${a}-11`, antes = JSON.stringify(est.meses[k] || {});
        est.meses[k] = Object.assign({}, est.meses[k], { [D]: [chaveDomingoPrevisto(i)] }); const comMarca = bloqueioFolgaFeriado(i, fer);
        est.meses[k] = Object.assign({}, est.meses[k], { [D]: [] }); const semMarca = bloqueioFolgaFeriado(i, fer);
        est.meses[k] = JSON.parse(antes); trabalhoDomingo = bkT; descansosDomingo = bkD; return { comMarca, semMarca }; }, ANO);
      ok(f && /folga do domingo 14\/11/.test(f.comMarca) && !f.semMarca, `feriado 15/11 (segunda): quem foi marcado à mão no domingo 14 fica bloqueado (“${f && f.comMarca}”); sem a marcação, livre`);
    }
  }
  // ↻ copiar o domingo anterior não copia quem cairia no 3º domingo seguido
  { const res = await p.evaluate(() => { const a = +$('ano').value, m = +$('mes').value, b = balancoDoMes(a, m), ds = domingosDoMes(a, m).filter(d => d !== b);
      v167.copiarAnterior(ds[2]); const s = v167.sel(); const au = v167.auditar();
      return { r: au.r.length, tres: equipe.some((f, i) => [0, 1, 2].every(k => s[ds[k]].includes(i))) }; });
    ok(!res.r && !res.tres, '↻ Copiar o domingo anterior não cria 3 domingos seguidos'); }
  // folga fixa no domingo pelo cartão tira a pessoa dos domingos marcados
  { const r = await p.evaluate(() => { const s = v167.sel(); const d = Object.keys(s).find(k => s[k].length); const i = s[d][0]; const ant = equipe[i].folgaFixa;
      const sel = document.querySelector(`#v167c${d} select[data-ff="${i}"]`); sel.value = '0'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const fora = !Object.values(v167.sel()).some(a => a.includes(i)); equipe[i].folgaFixa = ant; return fora; });
    ok(r, 'folga fixa “Domingo” escolhida no cartão tira a pessoa dos domingos'); }
  // 🤝 Misto: marca 1 pessoa no 1º domingo de janeiro e o app completa o resto
  await mudarMes(p, 0, ANO + 1); await p.waitForTimeout(900);
  await p.click('[data-modo="misto"]'); await p.waitForTimeout(300);
  const fixo = await p.evaluate(() => { const d = domingosDoMes(+$('ano').value, +$('mes').value)[0], s = v167.sel(); const i = equipe.findIndex((f, k) => f.tipo === 'sub' && !v167.motivo(k, d, s)); v167.marcar(i, d, true); v167.render(); return [d, i]; });
  const txtM = await gerarE(); const rM = await verificarEnc(p);
  ok(/pronta/.test(txtM) && await p.evaluate(([d, i]) => (trabalhoDomingo[d] || []).map(Number).includes(i), fixo) && !rM.viol.length, `🤝 Misto: quem foi marcado entra e o app completa o resto | domingos ${rM.dom}${rM.viol.length ? ' → ' + rM.viol.slice(0, 3).join('; ') : ''}`);
  // memória: depois de recarregar a página, o modo e as marcações voltam; o histórico do mês leva a escala à mão
  const antesR = await p.evaluate(() => JSON.stringify(v167.sel()));
  await p.reload(); await p.waitForTimeout(2000);
  ok(await p.evaluate(a => v167.estado().modo === 'misto' && JSON.stringify(v167.sel()) === a, antesR), 'depois de recarregar, o modo e as pessoas marcadas continuam');
  ok(await p.evaluate(() => { const x = window.v167Exportar(); return x.modo === 'misto' && Object.keys(x.dias || {}).length > 0; }), 'o histórico do mês leva a escala à mão (campo escalaMao)');
  await p.evaluate(() => v167.definirModo('auto'));
  ok(!erros.length, 'escala à mão: sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

/* V237/V168 — APK do ApkForja (modo site): os downloads vão para Android.salvarArquivo; sem a ponte, o app avisa e não finge que salvou */
async function testarApk(browser, app, nome){
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 237 : 168)) return;
  console.log(`\n▶ ${nome} — salvar arquivos dentro do APK (ApkForja)`);
  const UA_WV = 'Mozilla/5.0 (Linux; Android 14; SM-A146B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36';
  const baixar = p => p.evaluate(() => { const b = new Blob([JSON.stringify({ teste: 'ação', n: 1 })], { type: 'application/json;charset=utf-8' }); const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = 'Historico_teste.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 500); });
  // 1) APK com a ponte ligada: o arquivo chega inteiro em Android.salvarArquivo e não vira download do navegador
  { const ctx = await browser.newContext({ userAgent: UA_WV, acceptDownloads: true }); const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept());
    await p.addInitScript(() => { window.__salvos = []; window.Android = { salvarArquivo: (n, b64, t) => { window.__salvos.push({ n, t, txt: decodeURIComponent(escape(atob(b64))) }); return 'OK'; } }; });
    let baixou = false; p.on('download', () => { baixou = true; });
    await p.goto('file://' + app); await p.waitForTimeout(1200);
    await baixar(p); await p.waitForTimeout(600);
    const s = await p.evaluate(() => window.__salvos);
    ok(s.length === 1 && s[0].n === 'Historico_teste.json' && s[0].t === 'application/json' && JSON.parse(s[0].txt).teste === 'ação' && !baixou, `com a ponte: o arquivo vai inteiro para Android.salvarArquivo (${s.length} salvo)`);
    ok(!erros.length, 'com a ponte: sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : '')); await ctx.close(); }
  // 2) APK sem a ponte: não tenta baixar (o Android mostrava “Nenhum aplicativo para abrir: blob:”) e avisa em vermelho
  { const ctx = await browser.newContext({ userAgent: UA_WV, acceptDownloads: true }); const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    let baixou = false; p.on('download', () => { baixou = true; });
    await p.goto('file://' + app); await p.waitForTimeout(1200);
    await baixar(p); await p.waitForTimeout(900);
    const t = await p.evaluate(() => document.querySelector('.toast')?.innerText || '');
    ok(!baixou && /NÃO foi salvo/.test(t), 'sem a ponte: avisa que o arquivo NÃO foi salvo, em vez de “guardado”'); await ctx.close(); }
  // 3) navegador comum: continua baixando normalmente
  { const ctx = await browser.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
    await p.goto('file://' + app); await p.waitForTimeout(1200);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), baixar(p)]);
    ok(dl && dl.suggestedFilename() === 'Historico_teste.json', 'no navegador comum o download continua igual'); await ctx.close(); }
}

/* V239/V172 — data de admissão no Editar equipe: digitada em dd/mm/aaaa, conferida e guardada */
async function testarAdmissao(browser, app, nome, dados){
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 239 : 172)) return;
  console.log(`\n▶ ${nome} — data de admissão no Editar equipe`);
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  if(nome === 'Setores'){ await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300); }
  else await p.click('.hero-cta').catch(() => {});
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, dados)); await p.waitForTimeout(1800);
  await p.evaluate(() => { abrirEditorEquipe(true); }); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    const campo = document.querySelector('#equipeEditorRows .ed-admissao'); if(!campo) return { semCampo: true };
    const mostra = campo.value, livre = !campo.readOnly;
    campo.value = ''; campo.focus(); for(const c of '05031998'){ campo.value += c; campo.dispatchEvent(new Event('input', { bubbles: true })); }
    const mascara = campo.value;
    const mat = campo.closest('.editor-row').querySelector('.ed-matricula').value;
    salvarEquipeEditor(); await new Promise(z => setTimeout(z, 800));
    const f = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe).find(x => String(x.matricula) === String(mat));
    // data impossível é recusada
    abrirEditorEquipe(true); await new Promise(z => setTimeout(z, 600));
    const c2 = document.querySelector('#equipeEditorRows .ed-admissao'); const volta = c2.value; c2.value = '31/02/2015';
    let msg = ''; const a = window.alert; window.alert = m => { msg = String(m); }; const t = window.showToast; window.showToast = m => { msg = msg || String(m); };
    try{ salvarEquipeEditor(); }finally{ window.alert = a; window.showToast = t; }
    const f2 = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe).find(x => String(x.matricula) === String(mat));
    return { mat, mostra, livre, mascara, salvo: f && f.admissao, volta, recusou: /não é válida/.test(msg), manteve: f2 && f2.admissao };
  });
  ok(!r.semCampo && r.livre && /^\d{2}\/\d{2}\/\d{4}$|^$/.test(r.mostra), `o campo aceita digitação e mostra dd/mm/aaaa (${r.mostra || 'vazio'})`);
  ok(r.mascara === '05/03/1998' && r.salvo === '1998-03-05', `digitando 05031998 vira 05/03/1998 e fica guardada (${r.salvo})`);
  ok(r.volta === '05/03/1998' && r.recusou && r.manteve === '1998-03-05', 'ao abrir de novo mostra 05/03/1998; 31/02/2015 é recusada e a data certa continua');
  // fechar e abrir o app de novo: a data continua lá (o Setores guardava a equipe sem a admissão — corrigido na V239)
  await p.waitForTimeout(1500);
  await p.reload(); await p.waitForTimeout(3000);
  const depois = await p.evaluate(m => { const l = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe); const f = l.find(x => String(x.matricula) === String(m)); return f && f.admissao; }, r.mat);
  ok(depois === '1998-03-05', `depois de recarregar a página a data continua guardada (${depois || 'vazio'})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
}

async function testarPorCargo(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 240) return;
  console.log('\n▶ Setores — “Por cargo”: quantas lideranças e quantos de cada cargo');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(1800);
  await p.evaluate(() => { v45GotoStep(3, false); const s = $('modoCobertura'); s.value = 'funcao'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600);
  // V241: a Frente de Loja começa “Por turno”; aqui o teste é da linha única (modo Várias)
  await p.evaluate(() => { if(window.liderTurno && liderTurno()) definirModoLideranca('varias'); }); await p.waitForTimeout(300);
  const ler = () => p.evaluate(() => ({ n: document.querySelector('.v240-lider [data-v240-n]')?.value, modo: modoLideranca(), total: document.querySelector('#configFuncao .alert.info')?.textContent || '' }));
  const a = await ler();
  ok(!!a.n && /liderança/.test(a.total), `o quadro do “Por cargo” tem a linha ⭐ Lideranças (${a.n}) e o total conta as lideranças`);
  await p.evaluate(() => { const v = document.querySelector('[data-v240-n]'); v.value = '1'; v.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
  const b = await ler();
  await p.click('[data-v240="1"]'); await p.click('[data-v240="1"]'); await p.waitForTimeout(300);
  const c = await ler();
  ok(b.modo === 'uma' && c.modo === 'varias' && c.n === '3' && /\b3\b liderança/.test(c.total), `1 liderança = “Uma só”; com + vira “Várias” com 3 (${b.modo} → ${c.modo} ${c.n})`);
  await p.selectOption('#v208Qtd', '5'); await p.waitForTimeout(300);
  ok((await ler()).n === '5', 'mudando a meta no ③ “Quem lidera”, o quadro do “Por cargo” acompanha');
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
}

async function testarLiderTurno(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 241) return;
  console.log('\n▶ Setores — liderança por turno (Frente de Loja e CPD)');
  const abrir = async (setor, dados) => { const { p, erros } = await novaPagina(browser);
    await p.goto('file://' + app); await p.waitForTimeout(1200);
    await p.click('#comeceFechar').catch(() => {}); await p.click(`[data-home-setor="${setor}"]`); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
    await p.setInputFiles('#arquivoTxt', path.join(DADOS, dados)); await p.waitForTimeout(1800);
    await p.evaluate(() => v45GotoStep(3, false)); await p.waitForTimeout(300); return { p, erros }; };
  const porDomingo = p => p.evaluate(() => { const doms = domingosDoMes(+$('ano').value, +$('mes').value), bal = balancoDoMes(+$('ano').value, +$('mes').value);
    return doms.filter(d => d !== bal).map(d => { const ls = lideresSelecionadosDomingo(d), todos = [...new Set([...ls, ...(trabalhoDomingo[d] || [])])];
      return { d, lA: ls.filter(i => turnoLider(i) === 'ABERTURA').length, lF: ls.filter(i => turnoLider(i) === 'FECHAMENTO').length,
        A: todos.filter(i => turnoLider(i) === 'ABERTURA').length, F: todos.filter(i => turnoLider(i) === 'FECHAMENTO').length }; }); });
  // Frente de Loja: começa em “Por turno” (1 + 1) e o 🤖 Sugerir põe 1 liderança em cada turno, de qualquer cargo
  { const { p, erros } = await abrir('Frente de Loja', 'setores_frente_de_loja_50.txt');
    const modo = await p.evaluate(() => modoLideranca());
    await p.click('#btnSugerirLideranca'); await p.waitForTimeout(500);
    const r = await porDomingo(p);
    ok(modo === 'turno' && r.every(x => x.lA === 1 && x.lF === 1), `Frente de Loja: modo “Por turno” e 1 liderança na abertura + 1 no fechamento em todo domingo (${r.map(x => x.lA + '+' + x.lF).join(' ')})`);
    ok(!(await p.evaluate(() => conflitosLideranca())).length, 'sugestão por turno sem 3 domingos seguidos');
    ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : '')); }
  // CPD: falta liderança no turno → entra Preparador de dados; sempre 1 na abertura e 1 no fechamento
  { const { p, erros } = await abrir('CPD', 'setores_cpd_6.txt');
    const T = await p.evaluate(() => { const s = $('modoCobertura'); s.value = 'funcao'; s.dispatchEvent(new Event('change', { bubbles: true })); const T = liderTurno(); coberturaFuncao.base[T.comp] = 0; salvarCfgFuncao(); return T; });
    await p.click('#btnSugerirLideranca'); await p.waitForTimeout(500);
    // um domingo sem o Sub (fechamento) → Encarregado + Preparador
    await p.evaluate(() => { const d = domingosDoMes(+$('ano').value, +$('mes').value)[0]; liderancaManualDomingo[String(d)] = { mais: lideresSelecionadosDomingo(d).filter(i => turnoLider(i) === 'ABERTURA') }; renderLiderancaDomingo(); });
    await p.evaluate(() => { const s = $('modoGeracao'); if(s){ s.value = 'motor'; s.dispatchEvent(new Event('change', { bubbles: true })); } v45GotoStep(5, false); document.getElementById('btnGerar').click(); }); await p.waitForTimeout(3000);
    const r = await porDomingo(p);
    ok(/preparador/.test(T.comp || ''), `CPD: “Se faltar liderança no turno, entra: Preparador de dados” já vem marcado (${T.comp})`);
    ok(r.every(x => x.A === 1 && x.F === 1), `CPD: todo domingo com 1 na abertura e 1 no fechamento (${r.map(x => `${x.d}:${x.lA + x.lF}lid ${x.A}+${x.F}`).join(' ')})`);
    ok(r[0].lA === 1 && r[0].lF === 0 && r.some(x => x.lA + x.lF === 0), 'CPD: Encarregado + Preparador e 2 Preparadores acontecem');
    ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : '')); }
}


/* V243 — aviso informativo quando pessoas do mesmo horário folgam na mesma data */
async function testarFolgasMesmoHorario(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 243) return;
  console.log('\n▶ Setores — alerta de folgas no mesmo horário');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  await p.click('#comeceFechar').catch(() => {});
  await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400);
  await p.click('.is-abrir'); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(1500);
  const primeiro = await p.evaluate(() => {
    const base=equipe.slice(0,3);
    if(base.length<3) return {erro:'dados de teste precisam de 3 pessoas'};
    equipe=base.map((f,i)=>({...f,nome:['Teste Fechamento A','Teste Fechamento B','Teste Abertura C'][i],
      horario:i===2?'ABERTURA':'FECHAMENTO',folgaFixa:5,situacao:'A'}));
    todasEquipes=equipe.map(f=>({...f}));
    trabalhoDomingo={}; trabalhoFeriado={}; folgasCompensatorias={}; descansosDomingo={}; ultimaEscala={}; painelDiaSel=null;
    const bal=balancoDoMes(2027,9);
    renderPainelMes(9,2027,bal);
    const ler=()=>[...document.querySelectorAll('#painelMes [data-v243-data]')].map(b=>({data:b.dataset.v243Data,horario:b.dataset.v243Horario,texto:b.innerText}));
    return {erro:'',linhas:ler()};
  });
  const dia=primeiro.linhas.find(x=>x.data==='2027-10-01'&&x.horario==='FECHAMENTO');
  ok(!primeiro.erro && !!dia && /Teste Fechamento A/.test(dia.texto) && /Teste Fechamento B/.test(dia.texto) && !/Teste Abertura C/.test(dia.texto),
    'a mesma data agrupa as duas pessoas de FECHAMENTO, sem misturar ABERTURA');
  ok(/2 pessoas/.test(dia?.texto||'') && /folga fixa/.test(dia?.texto||''),
    'o aviso informa quantidade e tipo de folga');
  const tres=await p.evaluate(()=>{
    equipe[2].horario='FECHAMENTO';
    const bal=balancoDoMes(2027,9); renderPainelMes(9,2027,bal);
    return [...document.querySelectorAll('#painelMes [data-v243-data]')].find(b=>b.dataset.v243Data==='2027-10-01'&&b.dataset.v243Horario==='FECHAMENTO')?.innerText||'';
  });
  ok(/3 pessoas/.test(tres)&&/Teste Abertura C/.test(tres),'a contagem atualiza quando uma terceira pessoa do mesmo horário folga');
  const um=await p.evaluate(()=>{
    equipe[1].folgaFixa=2; equipe[2].horario='ABERTURA';
    const bal=balancoDoMes(2027,9); renderPainelMes(9,2027,bal);
    return [...document.querySelectorAll('#painelMes [data-v243-data]')].some(b=>b.dataset.v243Data==='2027-10-01'&&b.dataset.v243Horario==='FECHAMENTO');
  });
  ok(!um,'uma pessoa sozinha de FECHAMENTO na sexta não gera alerta');
  const semMudar=await p.evaluate(()=>equipe.every(f=>typeof f.folgaFixa==='number'));
  ok(semMudar,'o aviso não altera as folgas cadastradas');
  ok(!erros.length,'sem erro de JavaScript'+(erros.length?': '+erros[0]:''));
  await p.context().close();
}

async function testarSemTxt(browser, app, nome, dados){
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 242 : 173)) return;
  console.log(`\n▶ ${nome} — sem Equipe.txt na tela`);
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  if(nome === 'Setores'){ await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300); }
  else await p.click('.hero-cta').catch(() => {});
  const vis = await p.evaluate(() => ({ caixa: !!document.querySelector('[data-upload="arquivoTxt"]')?.offsetParent, baixar: !!document.getElementById('btnGerarEquipeTxt')?.offsetParent, hist: !!document.querySelector('[data-v242hist]')?.offsetParent }));
  ok(!vis.caixa && !vis.baixar && vis.hist, 'a caixa do Equipe.txt e o “Baixar Equipe.txt” saíram; o passo Equipe tem “📂 Abrir histórico guardado”');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-v242hist]')]);
  await fc.setFiles(path.join(DADOS, dados)); await p.waitForTimeout(2000);
  const n = await p.evaluate(() => equipe.length);
  ok(n > 0, `um Equipe.txt antigo ainda abre pelo “📂 Abrir histórico guardado” (${n} pessoas)`);
  if(nome !== 'Setores'){ await p.click('[data-v173rh]'); await p.waitForTimeout(400); ok(await p.evaluate(() => !!document.querySelector('.fb-topo')), '“📥 Planilha do RH” abre a janela do local da planilha'); }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
}

(async () => {
  const t0 = Date.now();
  // os endereços fixos do site (setores/ e encarregados/) precisam ser a cópia da versão atual
  for(const [pasta, app] of [['setores', APP_SETORES], ['encarregados', APP_ENC]]){
    const idx = path.join(RAIZ, pasta, 'index.html');
    if(fs.existsSync(idx)) ok(fs.readFileSync(idx, 'utf8') === fs.readFileSync(app, 'utf8'), `${pasta}/index.html é a cópia de ${path.basename(app)}`);
  }
  // Conferência obrigatória de metadados: nome do arquivo, <title>, rodapé e histórico devem usar a mesma versão.
  {
    const m = path.basename(APP_SETORES).match(/V(\d+)\.html$/);
    const versao = m && m[1];
    const html = fs.readFileSync(APP_SETORES, 'utf8');
    ok(!!versao && html.includes('<title>Escala de Setores — V' + versao + '</title>'),
      'título HTML corresponde à versão do arquivo (' + (versao || 'não identificada') + ')');
    ok(!!versao && new RegExp('Versão V' + versao + ' · ').test(html),
      'versão visível no rodapé corresponde à versão do arquivo (' + (versao || 'não identificada') + ')');
    const hist = html.match(/<!-- HISTÓRICO DE VERSÕES[^\n]*\n([^\n]+)/);
    ok(!!versao && !!hist && new RegExp('^V' + versao + ' \\[(Claude|ChatGPT)\\] — ').test(hist[1]),
      'primeira entrada do histórico corresponde à versão do arquivo (' + (versao || 'não identificada') + ')');
  }
  // a passagem de bastão (docs/PASSAGEM.md) tem que estar em dia com as versões atuais — AGENTS.md, seção 10
  { const pas = path.join(RAIZ, 'docs', 'PASSAGEM.md'), txt = fs.existsSync(pas) ? fs.readFileSync(pas, 'utf8') : '';
    const faltam = [APP_SETORES, APP_ENC].map(a => path.basename(a)).filter(n => !txt.includes(n));
    ok(txt && !faltam.length, 'docs/PASSAGEM.md cita as versões atuais' + (faltam.length ? ' — falta: ' + faltam.join(', ') + ' (atualize a passagem de bastão)' : '')); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try{ await testarSetores(browser); await testarEncarregados(browser); if(/V(\d+)\.html$/.test(APP_ENC) && +APP_ENC.match(/V(\d+)\.html$/)[1] >= 167) await testarEncManual(browser); await testarApk(browser, APP_SETORES, 'Setores'); await testarApk(browser, APP_ENC, 'Encarregados'); await testarAdmissao(browser, APP_SETORES, 'Setores', 'setores_frente_de_loja_50.txt'); await testarPorCargo(browser, APP_SETORES); await testarLiderTurno(browser, APP_SETORES); await testarAdmissao(browser, APP_ENC, 'Encarregados', 'encarregados_15_pares.txt'); await testarSemTxt(browser, APP_SETORES, 'Setores', 'setores_frente_de_loja_50.txt'); await testarFolgasMesmoHorario(browser, APP_SETORES); await testarSemTxt(browser, APP_ENC, 'Encarregados', 'encarregados_15_pares.txt'); }
  catch(e){ console.error('\n❌ O teste parou: ' + e.message); falhas++; }
  finally{ await browser.close(); }
  console.log(`\n${falhas ? '❌ ' + falhas + ' falha(s)' : '✅ Tudo certo'} — ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(falhas ? 1 : 0);
})();
