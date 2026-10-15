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
    await p.evaluate(() => window.v266Horarios?.confirmar?.());   /* V266: confirma o horário de domingo antes de guardar */ const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnHistorico')]);
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
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 247){   // V247: otimizações têm que dar exatamente o mesmo resultado
    const r = await p.evaluate(() => {
      const out = { dom: 0, fer: 0, difDom: 0, difFer: 0, copia: true, chave: 0, difChave: 0, pode: 0, difPode: 0 };
      for(let a = 2025; a <= 2030; a++) for(let m = 0; m < 12; m++){
        const x = domingosDoMes(a, m), y = domingosDoMes.__v247orig(a, m); out.dom++; if(JSON.stringify(x) !== JSON.stringify(y)) out.difDom++;
        const f = feriados(a, m), g = feriados.__v247orig(a, m); out.fer++; if(JSON.stringify(f) !== JSON.stringify(g)) out.difFer++;
      }
      { const x = domingosDoMes(2027, 9); x.push(99); const f = feriados(2027, 9); f[31] = 'teste'; if(domingosDoMes(2027, 9).includes(99) || feriados(2027, 9)[31]) out.copia = false; }   // mexer no resultado não estraga a cópia guardada
      const ano = +$('ano').value, mes = +$('mes').value;
      equipe.forEach((f, i) => { out.chave++; const c = ehLiderancaDomingo(f) ? '' : normalizeStr(f.cargo || '').replace(/\s+/g, ' '); if(chaveFuncaoDistribuicao(i) !== c) out.difChave++; });
      for(let d = 1; d <= 28; d += 3){ const dt = new Date(ano, mes, d); equipe.forEach((f, i) => { out.pode++;   // regra antiga: já folga no dia → true; senão “limite respeitado” → true
        const ex = folgasDetalhadasNaData(dt, ''), antigo = ex.some(x => x.i === i) ? true : limiteFolgaRespeitadoNaData(i, dt, '');
        if(candidatoPodeReceberDSRPorTurno(i, dt, '') !== antigo) out.difPode++; }); }
      // auditoria 6×1 da escala à mão: comparada com a conta antiga (V246), com um 7º dia forçado
      const antiga = (sel, mapa) => { const erros = []; const inicio = new Date(ano, mes, 1); inicio.setDate(inicio.getDate() - 7); const fim = new Date(ano, mes + 1, 0); fim.setDate(fim.getDate() + 7);
        equipe.forEach((f, i) => { let seq = 0, ini = null; for(let dt = new Date(inicio); dt <= fim; dt.setDate(dt.getDate() + 1)){ let t;
          if(dt.getDay() === 0){ if(dt.getMonth() !== mes || dt.getFullYear() !== ano) t = domingoForaDoMesTrabalhado(i, dt); else t = (sel[dt.getDate()] || []).includes(i); }
          else if((mapa[chaveData(dt)] || []).some(x => x.i === i)) t = false;
          else if(dt.getMonth() === mes && dt.getFullYear() === ano && feriados(ano, mes)[dt.getDate()]) t = (trabalhoFeriado[dt.getDate()] || []).includes(i);
          else t = !folgaFixaAtivaNaData(i, dt);
          if(t){ if(!seq) ini = new Date(dt); seq++; if(seq >= 7){ erros.push(`${f.nome}: sequência de 7 dias trabalhados de ${ini.toLocaleDateString('pt-BR')} a ${dt.toLocaleDateString('pt-BR')}; escala incompatível com a proteção 6×1.`); break; } } else seq = 0; } });
        return erros; };
      const sel = JSON.parse(JSON.stringify(trabalhoDomingo || {})), mapa = JSON.parse(JSON.stringify(descansosDomingo || {}));
      const a1 = JSON.stringify(auditarProtecao6x1Simulada(sel, mapa)), b1 = JSON.stringify(antiga(sel, mapa));
      const mapa2 = {}; const sel2 = {}; domingosDoMes(ano, mes).forEach(d => sel2[d] = equipe.map((f, i) => i));   // todos em todos os domingos e sem DSR → muitos 7 dias
      const forc = equipe.filter(f => !ehLiderancaDomingo(f)).slice(0, 3), bkFF = forc.map(f => [f.folgaFixa, f.folgaPendente]);   // 3 pessoas com folga fixa no domingo e escaladas em todos → 7 dias com certeza (antes dependia do estado deixado por outros testes)
      let a2, b2; try{ forc.forEach(f => { f.folgaFixa = 0; f.folgaPendente = false; }); a2 = auditarProtecao6x1Simulada(sel2, mapa2); b2 = antiga(sel2, mapa2); }
      finally{ forc.forEach((f, k) => { f.folgaFixa = bkFF[k][0]; if(bkFF[k][1] === undefined) delete f.folgaPendente; else f.folgaPendente = bkFF[k][1]; }); }
      out.audit = a1 === b1 && JSON.stringify(a2) === JSON.stringify(b2) && a2.length > 0; out.nAud = a2.length;
      out.fundo = window.v247DomMudou('teste-v247') === true && window.v247DomMudou('teste-v247') === false;   // sem mudança na tela, a rotina de fundo não roda de novo
      return out;
    });
    ok(!r.difDom && !r.difFer && r.copia, `V247: domingos e feriados guardados = conta original (${r.dom} meses; diferenças: ${r.difDom + r.difFer}; cópia protegida: ${r.copia ? 'sim' : 'não'})`);
    ok(!r.difChave && !r.difPode, `V247: chave do cargo (${r.chave}) e “pode receber folga no dia” (${r.pode}) iguais à conta antiga (diferenças: ${r.difChave + r.difPode})`);
    ok(r.audit, `V247: auditoria 6×1 da escala à mão igual à conta antiga, inclusive com ${r.nAud} avisos forçados`);
    ok(r.fundo, 'V247: rotinas de fundo só rodam de novo quando a tela muda');
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 248){   // V248: folga da liderança também em feriado (ex.: antes seg 26/10 → depois seg 02/11 Finados)
    const r = await p.evaluate(() => {
      const bk = { a: $('ano').value, m: $('mes').value, lm: JSON.stringify(liderancaManualDomingo || {}), tf: JSON.stringify(trabalhoFeriado || {}) };
      const out = {};
      try{
        $('ano').value = '2026'; $('mes').value = '10';
        const pos = opcoesDsrLider(1, 'pos').map(chaveData);
        out.temFeriado = pos.includes('2026-11-02') && pos.length === 6;
        const i = equipe.findIndex(f => ehLiderancaDomingo(f));
        liderancaManualDomingo = { '1': { mais: [i], dsr: { [String(i)]: { ant: '2026-10-26', pos: '2026-11-02' } } } };
        trabalhoFeriado = { 2: equipe.map((f, k) => k) };
        aplicarFolgasFixasNosFeriados();
        out.folgaNoFeriado = !trabalhoFeriado[2].includes(i) && trabalhoFeriado[2].length > 0;
      } finally { $('ano').value = bk.a; $('mes').value = bk.m; liderancaManualDomingo = JSON.parse(bk.lm); trabalhoFeriado = JSON.parse(bk.tf); }
      return out;
    });
    ok(r.temFeriado && r.folgaNoFeriado, `V248: folga da liderança pode cair em feriado (02/11 na lista: ${r.temFeriado ? 'sim' : 'não'}) e quem folga no feriado sai da lista de quem trabalha nele (${r.folgaNoFeriado ? 'sim' : 'não'})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 249){   // V249: desfazer folga no domingo escolhida por engano na escala à mão
    const r = await p.evaluate(async () => {
      const espera = ms => new Promise(ok => setTimeout(ok, ms));
      const bk = { modo: $('modoGeracao').value, eq: JSON.stringify(equipe.map(f => [f.folgaFixa, !!f.folgaPendente, !!f.folgaDefinida])) };
      const out = {};
      const i = equipe.findIndex(f => String(f.situacao || 'A').toUpperCase() === 'A' && !ehLiderancaDomingo(f) && !window.v157Regras?.bloqueioDomingo?.(f));
      const f = equipe[i];
      try{
        $('modoGeracao').value = 'manual';
        window.v225DefinirFolga(i, '0');   // escolheu domingo (por engano)
        renderSelecaoDomingosGeracao(); await espera(150);
        const ch = document.querySelector(`#selecaoDomingosManual input[type=checkbox][data-func="${i}"]`);
        out.apagado = !!ch && ch.disabled;
        const sel = ch?.closest('.dom-func')?.querySelector('.v249-dom select');
        out.temLista = !!sel;
        sel.value = '3'; sel.dispatchEvent(new Event('change', { bubbles: true })); await espera(150);
        const ch2 = document.querySelector(`#selecaoDomingosManual input[type=checkbox][data-func="${i}"]`);
        out.trocou = Number(f.folgaFixa) === 3 && !f.folgaPendente && !!ch2 && !ch2.disabled && !window.v222DomManual.tem(f);
        out.semCaixa = !ch2?.closest('.dom-func')?.querySelector('.v249-dom');
        window.v225DefinirFolga(i, '0'); renderSelecaoDomingosGeracao(); await espera(150);
        const sel3 = document.querySelector(`#selecaoDomingosManual input[data-func="${i}"]`)?.closest('.dom-func')?.querySelector('.v249-dom select');
        sel3.value = ''; sel3.dispatchEvent(new Event('change', { bubbles: true })); await espera(150);
        window.v221Normalizar?.();
        out.aDefinir = !!f.folgaPendente && Number(f.folgaFixa) !== 0 && !window.v222DomManual.tem(f);
      } finally {
        window.v222DomManual.marcar(f, false);
        JSON.parse(bk.eq).forEach(([ff, pend, def], k) => { const x = equipe[k]; x.folgaFixa = ff; if(pend) x.folgaPendente = true; else delete x.folgaPendente; if(def) x.folgaDefinida = true; else delete x.folgaDefinida; });
        $('modoGeracao').value = bk.modo; renderSelecaoDomingosGeracao();
      }
      return out;
    });
    ok(r.apagado && r.temLista && r.trocou && r.semCaixa && r.aDefinir, `V249: folga no domingo por engano pode ser desfeita na escala à mão (apagada: ${r.apagado}, lista: ${r.temLista}, trocou para quarta: ${r.trocou}, caixa some: ${r.semCaixa}, “a definir”: ${r.aDefinir})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 250){   // V250: folga da liderança no lugar da folga fixa e sem 7 dias seguidos
    const r = await p.evaluate(() => {
      const bk = { a: $('ano').value, m: $('mes').value, lm: JSON.stringify(liderancaManualDomingo || {}), tf: JSON.stringify(trabalhoFeriado || {}) };
      const i = equipe.findIndex(f => ehLiderancaDomingo(f)), f = equipe[i], bkF = [f.folgaFixa, f.folgaPendente];
      const out = {};
      try{
        $('ano').value = '2026'; $('mes').value = '10'; trabalhoFeriado = {}; f.folgaFixa = 2; f.folgaPendente = false;
        liderancaManualDomingo = { '1': { mais: [i], dsr: { [String(i)]: { ant: '2026-10-28', pos: '2026-11-05' } } } };   // caso do print do dono
        out.substitui = !folgaFixaAtivaNaData(i, new Date(2026, 9, 27)) && !folgaFixaAtivaNaData(i, new Date(2026, 10, 3)) && folgaFixaAtivaNaData(i, new Date(2026, 10, 10));
        const h = htmlDsrLider(1);
        out.aviso = h.includes('v250-aviso') && h.includes('7 dias seguidos (de qui 29/10 a qua 04/11)');
        const box = document.createElement('div'); box.innerHTML = h;
        const op = (lado, v) => box.querySelector(`select[data-lado="${lado}"] option[value="${v}"]`);
        out.bloqueia = op('pos', '2026-11-06').disabled && op('pos', '2026-11-07').disabled && !op('pos', '2026-11-04').disabled && !op('ant', '2026-10-30').disabled;
        liderancaManualDomingo['1'].dsr[String(i)] = { ant: '2026-10-27', pos: '2026-11-03' };   // “Usar a folga fixa”
        out.fixaOk = !htmlDsrLider(1).includes('v250-aviso') && v250Sequencia(i, 1, '', '').n < 7;
        liderancaManualDomingo['1'].dsr[String(i)] = { ant: '2026-10-28', pos: '2026-11-05' };
        out.semMexer = JSON.stringify(liderancaManualDomingo['1'].dsr[String(i)]) === JSON.stringify({ ant: '2026-10-28', pos: '2026-11-05' });
      } finally { $('ano').value = bk.a; $('mes').value = bk.m; liderancaManualDomingo = JSON.parse(bk.lm); trabalhoFeriado = JSON.parse(bk.tf); f.folgaFixa = bkF[0]; if(bkF[1] === undefined) delete f.folgaPendente; else f.folgaPendente = bkF[1]; }
      return out;
    });
    ok(r.substitui && r.aviso && r.bloqueia && r.fixaOk && r.semMexer, `V250: folga da liderança no lugar da folga fixa (${r.substitui}), aviso dos 7 dias seguidos (${r.aviso}), dias proibidos bloqueados (${r.bloqueia}), folga fixa sem aviso (${r.fixaOk}), conferir não muda a escolha (${r.semMexer})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 251){   // V251: equipe separada por função (só arrumação na tela)
    const r = await p.evaluate(async () => {
      renderEquipe(); await new Promise(o => setTimeout(o, 150)); window.v251Agrupar?.();   // espera dentro da página (no computador ocupado a espera de fora chegava antes da arrumação)
      const L = document.getElementById('equipeLista');
      const cabs = [...L.querySelectorAll(':scope > .v251-cab')], rows = [...L.querySelectorAll(':scope > .person')];
      const fnDe = f => String(window.v251Funcao ? window.v251Funcao(f.cargo) : f.cargo || '').trim().toUpperCase();   // V255: agrupa pela função (sem A/B)
      const funcoes = new Set(equipe.map(fnDe));
      const soma = cabs.reduce((t, c) => t + Number((c.querySelector('span')?.textContent.match(/\d+/) || [0])[0]), 0);
      const ordemIgual = rows.every((r, k) => r.querySelector('b')?.textContent.trim() === String(equipe[k].nome || '').toUpperCase());
      const juntos = rows.every((r, k) => Number(r.style.order) > 0 && fnDe(equipe[k]) === fnDe(equipe[rows.findIndex(x => x.style.order === r.style.order)]));
      const visual = [...L.children].sort((a, b) => Number(a.style.order) - Number(b.style.order));
      const liderPrimeiro = ehLiderancaDomingo(equipe[rows.indexOf(visual.find(x => x.classList.contains('person')))]);
      return { cabs: cabs.length, funcoes: funcoes.size, soma, n: equipe.length, ordemIgual, juntos, liderPrimeiro };
    });
    ok(r.cabs === r.funcoes && r.soma === r.n && r.ordemIgual && r.juntos && r.liderPrimeiro, `V251: equipe separada por função (${r.cabs} títulos para ${r.funcoes} funções, ${r.soma} de ${r.n} pessoas, lideranças primeiro: ${r.liderPrimeiro}, ordem guardada igual: ${r.ordemIgual})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 252){   // V252: triângulo para fechar as listas + liderança em dupla
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(o => setTimeout(o, ms)), out = {};
      const bk = { modo: $('modoGeracao').value, lm: JSON.stringify(liderancaManualDomingo || {}), hm: JSON.stringify(horariosManuaisDomingo || {}) };
      try{
        $('modoGeracao').value = 'manual'; renderSelecaoDomingosGeracao(); await w(200);
        const c = document.querySelector('#selecaoDomingosManual .dom-card');
        out.temSeta = !!c.querySelector('.dom-head .v252-seta') && !!document.getElementById('selecaoDomingosManual').previousElementSibling?.classList.contains('v252-barra');
        c.querySelector('.v252-seta').click(); await w(30);
        out.fecha = c.classList.contains('v252-rec') && getComputedStyle(c.querySelector('.dom-funcs')).display === 'none';
        renderSelecaoDomingosGeracao(); await w(200);
        const c2 = document.querySelector('#selecaoDomingosManual .dom-card'); out.lembra = c2.classList.contains('v252-rec');
        c2.querySelector('.v252-seta').click(); out.abre = !c2.classList.contains('v252-rec');
        await w(120); const hf = c2.querySelector('.dom-funcs > .v226-fn');   // função dentro do domingo
        if(hf){ hf.click(); await w(30); const n1 = c2.querySelectorAll('.dom-func.v252-oculto').length; hf.click(); await w(30); out.abre = out.abre && n1 > 0 && c2.querySelectorAll('.dom-func.v252-oculto').length === 0; }
        renderEquipe();   // espera a lista se agrupar (antes: 150 ms fixos — às vezes o GitHub ainda não tinha agrupado e o teste falhava sem defeito no app)
        const ate = async (f, ms = 2000, agrupar = false) => { for(let t = 0; t < ms; t += 50){ if(agrupar){ try{ window.v251Agrupar?.(); }catch(e){} } if(f()) return true; await w(50); } return !!f(); };
        await ate(() => document.querySelector('#equipeLista .v251-cab .v252-seta') && document.querySelectorAll('#equipeLista .person').length, 2000, true); await w(100);
        const cab = document.querySelector('#equipeLista .v251-cab'); cab.querySelector('.v252-seta').click();
        await ate(() => document.querySelectorAll('#equipeLista .person.v252-oculto').length > 0, 1000);
        const fechados = document.querySelectorAll('#equipeLista .person.v252-oculto').length; (cab.isConnected ? cab : document.querySelector('#equipeLista .v251-cab')).click();
        await ate(() => document.querySelectorAll('#equipeLista .v252-oculto').length === 0, 1000);
        out.grupo = fechados > 0 && fechados < equipe.length && document.querySelectorAll('#equipeLista .v252-oculto').length === 0;
        liderancaManualDomingo = { __ref: refLideranca() }; renderLiderancaDomingo(); await w(100);
        const doms = domingosDoMes(+$('ano').value, +$('mes').value), bal = balancoDoMes(+$('ano').value, +$('mes').value);
        const k = doms.findIndex((d, n) => d !== bal && doms[n + 1] !== undefined && doms[n + 1] !== bal);
        const inp = document.querySelector(`[data-v208-busca="${doms[k]}"]`);
        if(inp){ inp.focus(); inp.dispatchEvent(new Event('input')); await w(50); inp.closest('.lider-row').querySelector('.v208-op')?.click(); await w(100); }
        const i0 = lideresSelecionadosDomingo(doms[k])[0];
        out.dupla = i0 !== undefined && lideresSelecionadosDomingo(doms[k + 1]).includes(i0) && /também foi colocado/.test(document.querySelector('.v252-lid-msg')?.textContent || '');
        const m = window.v252Copiar(doms[k + 1], i0); out.terceiro = !!m && !m.ok && /3º domingo seguido/.test(m.t);
      } finally { $('modoGeracao').value = bk.modo; liderancaManualDomingo = JSON.parse(bk.lm); horariosManuaisDomingo = JSON.parse(bk.hm); renderSelecaoDomingosGeracao(); renderLiderancaDomingo(); }
      return out;
    });
    ok(r.temSeta && r.fecha && r.lembra && r.abre && r.grupo, `V252: triângulo fecha e abre o domingo da escala à mão (${r.fecha}/${r.abre}), lembra depois de redesenhar (${r.lembra}) e fecha o grupo de função (${r.grupo})`);
    ok(r.dupla && r.terceiro, `V252: liderança escolhida vai junto para o domingo seguinte (${r.dupla}) e o app diz o motivo quando não pode (3º domingo seguido: ${r.terceiro})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 253){   // V253: Frente de Loja “Por cargo” — operadoras em 3 horários na sugestão
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(o => setTimeout(o, ms)), out = {};
      const bk = { mc: $('modoCobertura').value, mg: $('modoGeracao').value, cf: JSON.stringify(coberturaFuncao || {}), sel: JSON.stringify(selecaoManualDomingo || {}), eq: equipe.map(f => [f.horario, f.turno]) };
      try{
        const fns = funcoesDoSetor(), op = fns.find(f => /operador/.test(f.chave) && /caixa/.test(f.chave));
        op.ids.slice(0, 6).forEach(i => { equipe[i].horario = '10:00 AS 18:20'; equipe[i].turno = 'ABERTURA'; });   // 6 intermediárias (10h) nos dados fictícios
        $('modoCobertura').value = 'funcao'; $('modoCobertura').dispatchEvent(new Event('change', { bubbles: true })); await w(100);
        await w(300); coberturaFuncao.base = {}; funcoesDoSetor().forEach(f => coberturaFuncao.base[f.chave] = 0); coberturaFuncao.base[op.chave] = 9; coberturaFuncao.dom = {};   // as funções de agora (depois da troca de modo)
        $('modoGeracao').value = 'manual'; selecaoManualDomingo = {};
        const d = domingosDoMes(+$('ano').value, +$('mes').value).find(x => x !== balancoDoMes(+$('ano').value, +$('mes').value));
        const vagas = window.v234Sugestoes.vagasDoDia(d), c = window.v234Sugestoes.candidatosDoDia(d, vagas).slice(0, vagas).map(x => x.i);
        const n = { ab: 0, in: 0, fe: 0, outro: 0 }; c.forEach(i => { if(chaveFuncaoDistribuicao(i) !== op.chave) n.outro++; else n[window.v253Faixa(i, d)]++; });
        out.n = n; out.vagas = vagas; out.metas = funcoesDoSetor().map(f => f.chave + ':' + qtdFuncao(f.chave, isoDomingo(+$('ano').value, +$('mes').value, d))).join(', ');
        out.outros = c.filter(i => chaveFuncaoDistribuicao(i) !== op.chave).map(i => chaveFuncaoDistribuicao(i) || '(sem função)').join(', ');
        out.resumo = /9 neste domingo = 3 abertura .* \+ 3 intermediária \(10h\) .* \+ 3 fechamento/.test((window.v253Resumo(d) || '').replace(/<[^>]+>/g, ''));
      } finally {
        bk.eq.forEach(([h, t], k) => { equipe[k].horario = h; equipe[k].turno = t; });
        coberturaFuncao = JSON.parse(bk.cf); selecaoManualDomingo = JSON.parse(bk.sel); $('modoGeracao').value = bk.mg;
        $('modoCobertura').value = bk.mc; $('modoCobertura').dispatchEvent(new Event('change', { bubbles: true }));
      }
      return out;
    });
    ok(r.vagas === 9 && r.n.ab === 3 && r.n.in === 3 && r.n.fe === 3 && !r.n.outro && r.resumo, `V253: Frente de Loja “Por cargo” com 9 operadoras → a sugestão traz 3 abertura + 3 intermediária (10h) + 3 fechamento (${JSON.stringify(r.n)}; vagas ${r.vagas}; resumo no cartão: ${r.resumo}${r.n.outro ? '; metas ' + r.metas + '; outros ' + r.outros : ''})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 255){   // V255: função sem A/B e grupo Jovem aprendiz
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(o => setTimeout(o, ms)), out = {};
      const ops = equipe.map((f, i) => i).filter(i => /OPERADOR/.test(equipe[i].cargo)).slice(-3), bk = ops.map(i => equipe[i].cargo);
      try{
        equipe[ops[0]].cargo = 'PROMOTOR DE VENDAS A'; equipe[ops[1]].cargo = 'PROMOTOR DE VENDAS B'; equipe[ops[2]].cargo = 'APRENDIZ EM SERV SUPERMERCADOS';
        renderEquipe(); await w(150); window.v251Agrupar?.();
        const cabs = [...document.querySelectorAll('#equipeLista > .v251-cab')].sort((a, b) => Number(a.style.order) - Number(b.style.order)).map(c => c.querySelector('b').textContent.trim());
        out.cabs = cabs.join(' | ');
        out.promotor = cabs.filter(t => /PROMOTOR/.test(t)).length === 1 && document.querySelector('#equipeLista > .v251-cab[data-v252-grupo*="PROMOTOR"]')?.textContent.includes('2 pessoas');
        out.aprendizFim = /JOVEM APRENDIZ/.test(cabs[cabs.length - 1] || '');
        out.chave = chaveFuncaoDistribuicao(ops[0]) === chaveFuncaoDistribuicao(ops[1]) && !/ [ab]$/.test(chaveFuncaoDistribuicao(ops[0]));
      } finally { ops.forEach((i, k) => { equipe[i].cargo = bk[k]; }); renderEquipe(); }
      return out;
    });
    ok(r.promotor && r.aprendizFim && r.chave, `V255: Promotor de vendas A e B no mesmo grupo (${r.promotor}) e na mesma função do “Por cargo” (${r.chave}); Jovem aprendiz num grupo no fim (${r.aprendizFim}) — ${r.cabs}`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 256){   // V256: cartão Jovem Aprendiz (aprendizes saem do ADM Geral)
    const r = await p.evaluate(() => {
      const ap = { matricula: '99901', nome: 'TESTE APRENDIZ', cargo: 'APRENDIZ EM SERV SUPERMERCADOS', setor: 'ADM Geral', situacao: 'A', turno: 'ABERTURA', horario: '08:00-12:00', folgaFixa: 0 };
      const ot = { matricula: '99902', nome: 'TESTE PROMOTOR', cargo: 'PROMOTOR DE VENDAS A', setor: 'ADM Geral', situacao: 'A', turno: 'ABERTURA', horario: '08:00-16:20', folgaFixa: 2 };
      const out = { card: !!GRUPOS_SETOR.find(g => g.id === 'Jovem Aprendiz'), opcao: [...$('setorSelecionado').options].some(o => o.value === 'Jovem Aprendiz') };
      out.ap = pertenceAoGrupo(ap, 'Jovem Aprendiz') && !pertenceAoGrupo(ap, 'ADM Geral');
      out.ot = pertenceAoGrupo(ot, 'ADM Geral') && !pertenceAoGrupo(ot, 'Jovem Aprendiz');
      return out;
    });
    ok(r.card && r.opcao && r.ap && r.ot, `V256: cartão “Jovem Aprendiz” (${r.card}/${r.opcao}); o aprendiz sai do ADM Geral e entra nele (${r.ap}); o promotor continua no ADM Geral (${r.ot})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 257){   // V257: nome do setor no arquivo Excel
    const r = await p.evaluate(() => { const bk = [$('mes').value, $('setorSelecionado').value]; try{ $('mes').value = '2'; $('setorSelecionado').value = 'Frente de Loja'; const a = nomeArquivoExcel(); $('setorSelecionado').value = 'Açougue'; return [a, nomeArquivoExcel()]; } finally { $('mes').value = bk[0]; $('setorSelecionado').value = bk[1]; } });
    ok(/^Escala_Frente_de_Loja_Marco_\d{4}\.xlsx$/.test(r[0]) && /^Escala_Acougue_Marco_\d{4}\.xlsx$/.test(r[1]), `V257: o arquivo Excel leva o nome do setor (${r.join(', ')})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 258){   // V258: promotor = 1 por domingo
    const r = await p.evaluate(() => {
      const ops = equipe.map((f, i) => i).filter(i => /OPERADOR/.test(equipe[i].cargo)).slice(-3), bk = ops.map(i => equipe[i].cargo), out = {};
      try{
        ops.forEach((i, k) => { equipe[i].cargo = 'PROMOTOR DE VENDAS ' + (k ? 'B' : 'A'); });
        const ativos = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]) && !ehLiderancaDomingo(equipe[i]));
        const doms = domingosDoMes(+$('ano').value, +$('mes').value);
        const metas = calcularMetasDistribuicaoFuncoes(doms, ativos), mp = Object.entries(metas).find(([k]) => /promotor/.test(k))?.[1];
        out.motor = !!mp && mp.porDomingo.every(q => q.total === 1);
        const fn = funcoesDoSetor().find(f => /promotor/.test(f.chave)); out.porCargo = !!fn && qtdFuncaoPadrao(fn) === 1;
        const mc = $('modoCobertura').value; $('modoCobertura').value = '50';
        out.alvo = alvoCoberturaAtual() === Math.max(1, 1 + Math.round((ativos.length - 3) / 2)); $('modoCobertura').value = mc;
        const c = ativos.find(i => !ops.includes(i)), bkc = equipe[c].cargo; equipe[c].cargo = 'CARTAZISTA';   // cartazista não trabalha domingo
        out.cartaz = window.v157Regras.bloqueioDomingo(equipe[c]) && !/APRENDIZ/.test(equipe[c].cargo); equipe[c].cargo = bkc;
      } finally { ops.forEach((i, k) => { equipe[i].cargo = bk[k]; }); }
      return out;
    });
    ok(r.motor && r.porCargo && r.alvo && r.cartaz, `V258: promotor = 1 por domingo no automático (${r.motor}), no “Por cargo” (${r.porCargo}) e na conta da escala à mão (${r.alvo}); cartazista sem domingo (${r.cartaz})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 259){   // V259: aviso “Por grupos” só com 6 pessoas ou mais
    const r = await p.evaluate(() => {
      const mc = $('modoCobertura').value, bk = equipe, out = {};
      try{
        $('modoCobertura').value = 'grupos'; atualizarModoCobertura(); out.grande = !document.getElementById('v259AvisoGrupos');
        equipe = bk.filter(f => !foraDom(f) && !ehLiderancaDomingo(f)).slice(0, 4); window.v259AvisoGrupos();
        out.pequeno = /pelo menos 6 pessoas/.test(document.getElementById('v259AvisoGrupos')?.textContent || '') && /tem 4/.test(document.getElementById('v259AvisoGrupos').textContent);
        equipe = bk; $('modoCobertura').value = '50'; atualizarModoCobertura(); out.some = !document.getElementById('v259AvisoGrupos');
      } finally { equipe = bk; $('modoCobertura').value = mc; atualizarModoCobertura(); }
      return out;
    });
    ok(r.grande && r.pequeno && r.some, `V259: “Por grupos” avisa quando o setor tem menos de 6 pessoas (setor grande sem aviso: ${r.grande}; com 4: ${r.pequeno}; some em outro modo: ${r.some})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 260){   // V260: sem a frase “Bloquear o domingo…” na importação
    const html = require('fs').readFileSync(APP_SETORES, 'utf8');
    ok(!/Bloquear o domingo<\/b> de \$\{aprend\}/.test(html) && /aprendizes:!\$\$\('erpOpAprendiz'\)\|\|/.test(html), 'V260: a importação não mostra mais “Bloquear o domingo…” e continua bloqueando o domingo de aprendiz e cartazista');
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 262){   // V262: Assistente RH (aprende e dá dicas; vai no histórico)
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(o => setTimeout(o, ms)), out = {}, A = window.v262Assistente;
      const bk = { mg: $('modoGeracao').value, sel: JSON.stringify(selecaoManualDomingo || {}), hor: JSON.stringify(horariosManuaisDomingo || {}) };
      try{
        out.botao = !!document.getElementById('v262Botao');
        $('modoGeracao').value = 'manual'; renderSelecaoDomingosGeracao(); await w(250);
        const i = equipe.findIndex(f => /OPERADOR/.test(f.cargo) && !foraDom(f)), f = equipe[i], pk = String(f.matricula).replace(/^0+/, '');
        const sk = norm($('setorSelecionado').value), antes = JSON.parse(JSON.stringify(A.dados().setores[sk]?.pessoas?.[pk] || { esc: 0, hor: {} }));
        const ch = document.querySelector(`#selecaoDomingosManual input[type=checkbox][data-func="${i}"]`);
        ch.checked = true; ch.dispatchEvent(new Event('change', { bubbles: true })); await w(100);
        const p1 = A.dados().setores[sk].pessoas[pk]; out.aprendeEscolha = p1.esc === (antes.esc || 0) + 1;
        p1.hor = { '07:20-16:00': 5 }; p1.dm = { '2000-01': 1, '2000-02': 1 };
        const doms = domingosDoMes(+$('ano').value, +$('mes').value); selecaoManualDomingo = {}; doms.slice(0, 3).forEach(d => { selecaoManualDomingo[String(d)] = [i]; });
        horariosManuaisDomingo[String(doms[0])] = { [String(i)]: '12:00-20:40' };
        const L = A.dicas(false).map(x => x.txt).join(' | ');
        out.dicaMedia = /3<\/b> domingo\(s\) este mês/.test(L); out.dicaHorario = /costuma dar <b>07:20-16:00/.test(L);
        out.historico = !!window.v147MontarProjeto?.().assistente?.dados?.pessoas?.[pk];
        const n = A.juntar({ setor: sk, dados: { meses: { '1999-12': 'historico' }, pessoas: { [pk]: { dm: { '1999-12': 2 } } } } });
        out.junta = n >= 2 && A.dados().setores[sk].pessoas[pk].dm['1999-12'] === 2 && A.dados().setores[sk].meses['1999-12'] === 'historico';
      } finally { $('modoGeracao').value = bk.mg; selecaoManualDomingo = JSON.parse(bk.sel); horariosManuaisDomingo = JSON.parse(bk.hor); renderSelecaoDomingosGeracao(); }
      return out;
    });
    ok(r.botao && r.aprendeEscolha && r.dicaMedia && r.dicaHorario && r.historico && r.junta, `V262: Assistente RH — botão (${r.botao}), aprende a escolha (${r.aprendeEscolha}), dica de domingos acima da média (${r.dicaMedia}) e do horário de costume (${r.dicaHorario}), vai no histórico (${r.historico}) e junta o histórico aberto (${r.junta})`);
  }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 263){   // V263: prévia das folgas mostra os domingos antes de gerar
    const r = await p.evaluate(() => {
      const out = {}, card = $('feriadosCard');
      const bk = { mg: $('modoGeracao').value, td: JSON.stringify(trabalhoDomingo || {}), sel: JSON.stringify(selecaoManualDomingo || {}), hor: JSON.stringify(horariosManuaisDomingo || {}), lid: JSON.stringify(liderancaManualDomingo || {}), disp: card.style.display, sempre: window.__v247PreviaSempre };
      try{
        window.__v247PreviaSempre = true; card.style.display = '';
        const d = domingosDoMes(+$('ano').value, +$('mes').value)[0];
        const livres = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]) && !lideresDoRegistro(liderancaManualDomingo?.[String(d)]).includes(i));
        const a = livres[0], b = livres[1];
        const cel = i => { const t = $('previaTabelaFolgas'); const k = [...t.querySelectorAll('thead th')].findIndex(h => h.innerHTML.startsWith(d + '<br>')); return t.querySelectorAll('tbody tr')[i]?.children[k]?.textContent.trim(); };
        trabalhoDomingo = {}; selecaoManualDomingo = { [String(d)]: [a] }; horariosManuaisDomingo = { [String(d)]: { [String(a)]: '07:00-15:20' } };
        $('modoGeracao').value = 'manual'; renderPreviaFolgasFeriado(true);
        out.manual = cel(a) === '07:00-15:20' && cel(b) === 'FOLGA DOM';
        $('modoGeracao').value = 'motor'; renderPreviaFolgasFeriado(true);
        out.auto = cel(a) === '—' && cel(b) === '—';
        trabalhoDomingo = { [String(d)]: [a] }; renderPreviaFolgasFeriado(true);   // depois de gerar: vale a escala gerada
        out.gerado = cel(a) !== 'FOLGA DOM' && cel(a) !== '—' && cel(b) === 'FOLGA DOM';
      } finally { $('modoGeracao').value = bk.mg; trabalhoDomingo = JSON.parse(bk.td); selecaoManualDomingo = JSON.parse(bk.sel); horariosManuaisDomingo = JSON.parse(bk.hor); liderancaManualDomingo = JSON.parse(bk.lid); card.style.display = bk.disp; window.__v247PreviaSempre = bk.sempre; try{ renderPreviaFolgasFeriado(true); }catch(e){} }
      return out;
    });
    ok(r.manual && r.auto && r.gerado, `V263: prévia das folgas mostra os domingos antes de gerar (à mão: escolhido com o horário e o resto “FOLGA DOM”: ${r.manual}; automático: “—”: ${r.auto}; depois de gerar, a escala gerada: ${r.gerado})`);
  }
  { const ordem = await p.$$eval('.stepper .step', b => b.filter(x => getComputedStyle(x).display !== 'none' && !x.classList.contains('config-step-hidden')).map(x => x.querySelector('b').textContent.trim()));
    if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 238) ok(ordem.join(' → ') === 'Equipe → Mês passado → Domingos → Feriados → Gerar', 'Setores: passos na ordem ' + ordem.join(' → ')); }
  if(+path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 245){   // V245: consertos da investigação de erros
    const r = await p.evaluate(() => {
      const ano = +$('ano').value, mes = +$('mes').value, fer = feriados(ano, mes), out = { cand: 0, naFixa: 0 };
      // (1) a folga de feriado nunca é sugerida no dia da folga fixa (a pessoa perderia a folga do feriado)
      Object.keys(fer).map(Number).forEach(d => equipe.forEach((f, i) => candidatosFolgaFeriado(i, d).forEach(c => { out.cand++; if(temFolgaNormalNoDia(i, c.data)) out.naFixa++; })));
      // (2) resumo do mês: o balanço é exceção e fica no lugar — 1º, 2º e 4º domingos com o 3º de balanço (sem trabalhar nele) NÃO são “3 seguidos”
      const doms = domingosDoMes(ano, mes), bk = JSON.stringify(trabalhoDomingo), item = bal => conformidadeMesSet(mes, ano, bal).itens.find(x => /2 domingos seguidos/.test(x.t))?.d || '';
      const i = equipe.findIndex((f, k) => !foraDom(f) && !ehLiderancaDomingo(f) && !historicoManual(k).ultimo && !historicoManual(k).penultimo), nome = equipe[i].nome;
      try{
        trabalhoDomingo = {}; doms.forEach(d => trabalhoDomingo[d] = []); [0, 1, 3].forEach(k => trabalhoDomingo[doms[k]].push(i));
        out.falso = item(doms[2]).includes(nome);
        trabalhoDomingo = {}; doms.forEach(d => trabalhoDomingo[d] = []); [0, 1, 2].forEach(k => trabalhoDomingo[doms[k]].push(i));
        out.real = item(0).includes(nome);   // sem balanço no meio continua acusado
      } finally { trabalhoDomingo = JSON.parse(bk); }
      return out;
    });
    ok(r.cand > 0 && r.naFixa === 0, `V245: folga de feriado nunca no dia da folga fixa (${r.cand} datas possíveis, ${r.naFixa} na folga fixa)`);
    ok(!r.falso && r.real, `V245: resumo do mês — balanço no meio interrompe a sequência (aviso falso: ${r.falso ? 'sim' : 'não'}); 3 domingos seguidos de verdade continua acusado (${r.real ? 'sim' : 'não'})`);
  }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
}

/* V246/V175 — datas de balanço sem arquivo de texto: quadro com janeiro, março, junho e setembro, guardado no aparelho e no histórico.
   Fluxo real: escolhe o domingo no quadro → gera a escala de março → 📦 Guardar histórico do mês (arquivo JSON de verdade) →
   abre esse arquivo em um aparelho novo (contexto limpo) e confere; e num aparelho onde março está “Sem balanço”, o arquivo não desfaz. */
async function testarBalancos(browser, app, nome, v, chave){
  console.log(`\n▶ ${nome} — datas de balanço (📦 quadro de janeiro, março, junho e setembro)`);
  const setores = nome === 'Setores', box = '#' + v + 'Balancos';
  const abrir = async p => { await p.goto('file://' + app); await p.waitForTimeout(1500);
    if(setores){ await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300); }
    else { await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300); } };
  const escolher = (p, m, d) => p.evaluate(([box, m, d]) => { const s = document.querySelector(box + ` [data-balmes="${m}"]`); s.value = String(d || ''); s.dispatchEvent(new Event('change', { bubbles: true })); }, [box, m, d]);
  const estado = (p, a) => p.evaluate(([ch, a]) => ({ db: datasBalanco.map(b => `${b.d}/${b.m + 1}/${b.a}`), st: JSON.parse(localStorage.getItem(ch) || '[]'), mar: balancoDoMes(a, 2), jun: balancoDoMes(a, 5), set: balancoDoMes(a, 8) }), [chave, a]);
  const { p, erros, ctx } = await novaPagina(browser);
  await abrir(p);
  ok(await p.locator(box + ' [data-balmes]').count() === 4 && await p.evaluate(() => document.querySelector('[data-upload="arquivoBalanco"]')?.style.display === 'none'), 'o quadro tem janeiro, março, junho e setembro, e a caixa do arquivo .txt saiu da tela');
  const ano = await p.evaluate(() => +document.getElementById('ano').value);
  const [dMar, dJun, dSet] = await p.evaluate(a => [2, 5, 8].map(m => domingosDoMes(a, m)), ano);
  // (1) o .txt antigo ainda abre pelo quadro e as datas entram no aparelho (setembro; outubro aparece em “Também guardado”)
  const txt = path.join(require('os').tmpdir(), `balancos_${v}.txt`); fs.writeFileSync(txt, `${String(dSet[1]).padStart(2, '0')}/09/${ano}\n${String(domingosDoMes2(ano, 9)[0]).padStart(2, '0')}/10/${ano}\n`);
  await p.setInputFiles('#arquivoBalanco', txt); await p.waitForTimeout(1200);
  let e = await estado(p, ano);
  const outras = await p.evaluate(box => document.querySelector(box + ' .balx-outras')?.textContent || '', box);
  ok(e.set === dSet[1] && e.st.some(b => b.m === 8 && b.d === dSet[1]) && /10\//.test(outras), `arquivo .txt antigo: setembro (${e.set}) entra no quadro e fica guardado; outubro aparece em “Também guardado”`);
  // (2) escolher e “Sem balanço”
  await escolher(p, 2, dMar[1]); await p.waitForTimeout(300); e = await estado(p, ano);
  ok(e.mar === dMar[1] && e.st.some(b => b.m === 2 && b.d === dMar[1]), `escolher o domingo ${dMar[1]}/03 guarda no aparelho (balanço de março: ${e.mar})`);
  await escolher(p, 5, dJun[0]); await escolher(p, 5, ''); await p.waitForTimeout(300); e = await estado(p, ano);
  ok(!e.jun && e.st.some(b => b.m === 5 && b.d === 0), `“Sem balanço” tira a data de junho (balanço de junho: ${e.jun || 'nenhum'})`);
  // (3) gera março e guarda o histórico de verdade
  if(setores) await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt'));
  else await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt'));
  await p.waitForTimeout(2500);
  await mudarMes(p, 2, ano); await p.waitForTimeout(900);
  await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); (window.v45GotoStep || window.v80GotoStep)?.(5, false); document.getElementById('btnGerar').click(); });
  for(let w = 0; w < 240; w++){ await p.waitForTimeout(250); if(await p.evaluate(() => Object.values(trabalhoDomingo || {}).some(a => a && a.length))) break; }
  await p.waitForTimeout(800);
  await p.evaluate(() => window.v266Horarios?.confirmar?.());   /* V266: confirma o horário de domingo antes de guardar */ const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.getElementById('btnHistorico').click())]);
  const arq = path.join(require('os').tmpdir(), `teste_bal_${v}_` + dl.suggestedFilename()); await dl.saveAs(arq);
  const j = JSON.parse(fs.readFileSync(arq, 'utf8')), dbJ = j?.planejamento?.datasBalanco;
  ok(Array.isArray(dbJ) && dbJ.some(b => b.d === dMar[1] && b.m === 2 && b.a === ano) && dbJ.some(b => b.d === dSet[1] && b.m === 8) && !dbJ.some(b => b.m === 5), `o histórico guardado (${dl.suggestedFilename()}) leva as datas de balanço: março ${dMar[1]} e setembro ${dSet[1]}, junho não`);
  ok(Object.values(j?.resultado?.trabalhoDomingo || {}).some(a => a && a.length > 3) || !!j?.resultado?.trabalhoDomingo?.[dMar[1]], 'a escala de março guardada tem o domingo de balanço com a equipe');
  await ctx.close();
  // (4) aparelho novo: abrir o histórico traz as datas e grava no aparelho
  { const { p, erros: er2, ctx } = await novaPagina(browser); await abrir(p);
    await p.setInputFiles('#arquivoProjetoJSON', arq); await p.waitForTimeout(3000);
    const e2 = await estado(p, ano), sel = await p.evaluate(box => document.querySelector(box + ' [data-balmes="2"]')?.value, box);
    ok(e2.mar === dMar[1] && e2.set === dSet[1] && e2.st.some(b => b.m === 2 && b.d === dMar[1]) && +sel === dMar[1], `aparelho novo: abrir o histórico traz março (${e2.mar}) e setembro (${e2.set}), guarda no aparelho e mostra no quadro`);
    await p.reload(); await p.waitForTimeout(2500);
    ok((await estado(p, ano)).mar === dMar[1], 'aparelho novo: depois de recarregar, o balanço de março continua');
    ok(!er2.length, 'aparelho novo: sem erro de JavaScript' + (er2.length ? ': ' + er2[0] : '')); await ctx.close(); }
  // (5) aparelho onde março está “Sem balanço”: abrir o histórico não desfaz essa escolha
  { const { p, ctx } = await novaPagina(browser); await abrir(p);
    await escolher(p, 2, dMar[0]); await escolher(p, 2, ''); await p.waitForTimeout(300);
    await p.setInputFiles('#arquivoProjetoJSON', arq); await p.waitForTimeout(3000);
    const e3 = await estado(p, ano);
    ok(!e3.mar && e3.set === dSet[1], `aparelho com março “Sem balanço”: o histórico não desfaz (março: ${e3.mar || 'nenhum'}) e traz setembro (${e3.set})`);
    await ctx.close(); }
  fs.unlinkSync(arq); fs.unlinkSync(txt);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
}
function domingosDoMes2(a, m){ const out = []; for(let d = 1; d <= 31; d++){ const x = new Date(a, m, d); if(x.getMonth() !== m) break; if(x.getDay() === 0) out.push(d); } return out; }

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
    await p.evaluate(() => window.v266Horarios?.confirmar?.());   /* V266: confirma o horário de domingo antes de guardar */ const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnHistorico')]);
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
  if(+path.basename(APP_ENC).match(/V(\d+)\.html$/)[1] >= 174){   // V174: consertos da investigação de erros
    const r = await p.evaluate(() => {
      const ano = +$('ano').value, mes = +$('mes').value, bal = balancoDoMes(ano, mes), out = {};
      // (1) virada do mês: a folga da semana do ÚLTIMO domingo do mês passado (cai neste mês) aparece e conta no 6×1
      const L = new Date(ano, mes, 0); L.setDate(L.getDate() - L.getDay());
      const pos = f => { const x = new Date(L); x.setDate(L.getDate() + diaDsrDe(f)); return x; };
      const i = equipe.findIndex(f => !inativo(f) && Number(f.folgaFixa) >= 1 && Number(f.folgaFixa) <= 6 && pos(f).getMonth() === mes);
      const dt = pos(equipe[i]), cu = $('hist_ult_' + i), era = cu.checked;
      try{
        cu.checked = true; out.com = ehDescansoAssociado(i, dt) && statusDiaEnc(i, dt, mes, ano, bal) === 'dsr' && window.v174.domingoForaDoMes(i, L);
        cu.checked = false; out.sem = window.v174.dsrDoMesPassado(i, dt) || window.v174.domingoForaDoMes(i, L);
      } finally { cu.checked = era; }
      out.dia = chaveData(dt);
      // (2) mês com balanço: a busca do motor olha o mês passado (último domingo + 1º + 2º = 3 seguidos), o balanço continua exceção
      const doms = domingosDoMes(ano, mes), cp = $('hist_pen_' + i), bk = [cp.checked, cu.checked];
      try{
        cp.checked = false; cu.checked = true;
        const parc = {}; doms.forEach(d => parc[d] = []); parc[doms[0]] = [i]; parc[doms[1]] = [i];
        out.barra = !todosNormaisRespeitamTresConsecutivos(doms, 0, parc);
        out.excecao = todosNormaisRespeitamTresConsecutivos(doms, doms[1], parc);
      } finally { cp.checked = bk[0]; cu.checked = bk[1]; }
      // (3) resumo do mês: 1º, 2º e 4º domingos com o 3º de balanço (sem trabalhar nele) não são “3 seguidos”
      const bkT = JSON.stringify(trabalhoDomingo), k = equipe.findIndex((f, j) => !foraDom(f) && !historicoManual(j).ultimo && !historicoManual(j).penultimo), nome = equipe[k].nome;
      const item = b => conformidadeMes(mes, ano, b).itens.find(x => /2 domingos seguidos/.test(x.t))?.d || '';
      try{
        trabalhoDomingo = {}; doms.forEach(d => trabalhoDomingo[d] = []); [0, 1, 3].forEach(n => trabalhoDomingo[doms[n]].push(k));
        out.falso = item(doms[2]).includes(nome);
        trabalhoDomingo = {}; doms.forEach(d => trabalhoDomingo[d] = []); [0, 1, 2].forEach(n => trabalhoDomingo[doms[n]].push(k));
        out.real = item(0).includes(nome);
      } finally { trabalhoDomingo = JSON.parse(bkT); }
      return out;
    });
    ok(r.com && !r.sem, `V174: virada do mês — quem trabalhou o último domingo do mês passado tem a folga da semana em ${r.dia} (com: ${r.com ? 'sim' : 'não'}; sem ter trabalhado: ${r.sem ? 'sim' : 'não'})`);
    ok(r.barra && r.excecao, `V174: mês com balanço — o motor barra último domingo do mês passado + 1º + 2º (${r.barra ? 'barra' : 'deixa'}); com o 2º sendo balanço é exceção (${r.excecao ? 'deixa' : 'barra'})`);
    ok(!r.falso && r.real, `V174: resumo do mês — balanço no meio interrompe a sequência (aviso falso: ${r.falso ? 'sim' : 'não'}); 3 seguidos de verdade continua acusado (${r.real ? 'sim' : 'não'})`);
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
async function testarTurnoEditor(browser, app){   // V254: turno vazio vem do horário; aviso com o nome; ficha marcada e aberta
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 254) return;
  console.log('\n▶ Setores — Editar equipe: turno pelo horário e aviso com o nome');
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(1800);
  await p.evaluate(() => { abrirEditorEquipe(true); }); await p.waitForTimeout(700);
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(o => setTimeout(o, ms)), out = {};
    let msg = ''; const t = window.showToast; window.showToast = (m, ...a) => { msg += String(m) + '\n'; return t?.(m, ...a); };
    const rows = [...document.querySelectorAll('#equipeEditorRows .editor-row')];
    const a = rows[10], b = rows[12], nomeA = a.querySelector('.ed-nome').value, nomeB = b.querySelector('.ed-nome').value;
    a.querySelector('.ed-turno').value = ''; a.querySelector('.ed-horario').value = '2ª4ª5ª6ªe3ªcurso 13:00as 17:00';
    b.querySelector('.ed-turno').value = ''; b.querySelector('.ed-horario').value = '';
    document.getElementById('btnSalvarEquipe').click(); await w(700);
    out.nome = msg.includes(nomeB + ': escolha o turno') && !/Linha \d+:/.test(msg) && !msg.includes(nomeA + ':');
    out.marcada = b.classList.contains('v254-erro') && (!b.classList.contains('emp-card') || b.classList.contains('open')) && !a.classList.contains('v254-erro');
    out.turnoA = a.querySelector('.ed-turno').value;
    b.querySelector('.ed-horario').value = '08:00-12:00'; msg = '';
    document.getElementById('btnSalvarEquipe').click(); await w(700);
    const l = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe);
    out.salvou = l.find(f => f.nome === nomeA)?.turno === 'FECHAMENTO' && l.find(f => f.nome === nomeB)?.turno === 'ABERTURA';
    window.showToast = t; return out;
  });
  ok(r.turnoA === 'FECHAMENTO' && r.salvou, `turno vazio vem do horário escrito diferente (“curso 13:00 as 17:00” → ${r.turnoA}) e fica guardado (${r.salvou})`);
  ok(r.nome && r.marcada, `o aviso traz o nome da pessoa (${r.nome}) e a ficha dela fica marcada e aberta (${r.marcada})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}
async function testarCopiaLogo(browser, app){   // V261: tocar na logo baixa uma cópia do app (link escondido)
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 261) return;
  console.log('\n▶ Setores — cópia do app pela logo');
  const html = fs.readFileSync(app); const http = require('http');
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const ctx = await browser.newContext({ acceptDownloads: true }); const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(e.message));
  try{
    await p.goto(`http://127.0.0.1:${srv.address().port}/setores/`); await p.waitForTimeout(1500);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.evaluate(() => (document.querySelector('img.v202-logo') || document.querySelector('img.brand-logo')).click())]);
    const f = path.join(require('os').tmpdir(), 'copia_logo_' + Date.now() + '.html'); await dl.saveAs(f);
    const igual = fs.readFileSync(f).equals(html); fs.unlinkSync(f);
    ok(/^Escala_de_Setores_V\d+\.html$/.test(dl.suggestedFilename()) && igual, `tocar na logo baixa a cópia do app (${dl.suggestedFilename()}, igual ao original: ${igual})`);
    ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  } finally { await ctx.close(); srv.close(); }
}
async function testarEncAssistente(browser){   // V176: Assistente RH também nos Encarregados
  if(+path.basename(APP_ENC).match(/V(\d+)\.html$/)[1] < 176) return;
  console.log('\n▶ Encarregados — 🤖 Assistente RH');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_ENC); await p.waitForTimeout(1200);
  await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1800);
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(o => setTimeout(o, ms)), out = {}, A = window.v262Assistente;
    out.botao = !!document.getElementById('v262Botao') && !!A && !!window.v167Api;
    const i = equipe.findIndex(f => !foraDom(f)), f = equipe[i], pk = String(f.matricula || '').replace(/^0+/, '') || ('N:' + String(f.nome).trim().toUpperCase());
    const s = A.dados().setores.encarregados = A.dados().setores.encarregados || { pessoas: {}, meses: {} };
    s.pessoas[pk] = { nome: f.nome, esc: 0, rec: 0, ace: 0, hor: {}, dm: { '2000-01': 1, '2000-02': 1 } };
    const doms = domingosDoMes(+$('ano').value, +$('mes').value), bk = JSON.stringify(trabalhoDomingo || {});
    trabalhoDomingo = {}; doms.slice(0, 3).forEach(d => { trabalhoDomingo[d] = [i]; });
    out.dicaMedia = A.dicas(false).some(x => /3<\/b> domingo\(s\) este mês/.test(x.txt));
    out.aprendeMes = A.aprenderMes('teste') && s.pessoas[pk].dm[`${$('ano').value}-${String(+$('mes').value + 1).padStart(2, '0')}`] === 3;
    trabalhoDomingo = JSON.parse(bk);
    out.exporta = !!A.exportar()?.dados?.pessoas?.[pk];
    out.junta = A.juntar({ setor: 'encarregados', dados: { meses: { '1999-12': 'historico' }, pessoas: { [pk]: { dm: { '1999-12': 2 } } } } }) >= 2;
    document.getElementById('v262Botao').click(); await w(300); out.painel = !document.getElementById('v262Painel').hidden;
    return out;
  });
  ok(r.botao && r.dicaMedia && r.aprendeMes && r.exporta && r.junta && r.painel, `Assistente RH nos Encarregados — botão (${r.botao}), painel (${r.painel}), dica de domingos acima da média (${r.dicaMedia}), aprende o mês (${r.aprendeMes}), vai no histórico (${r.exporta}) e junta o histórico aberto (${r.junta})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
async function testarEncPrevia(browser){   // V177: prévia das folgas mostra os domingos antes de gerar
  if(+path.basename(APP_ENC).match(/V(\d+)\.html$/)[1] < 177) return;
  console.log('\n▶ Encarregados — prévia das folgas com os domingos');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_ENC); await p.waitForTimeout(1200);
  await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const out = {}, card = $('feriadosCard'), V = window.v167; card.style.display = '';
    const a = +$('ano').value, m = +$('mes').value, bal = balancoDoMes(a, m), d = domingosDoMes(a, m).find(x => x !== bal);
    trabalhoDomingo = {};
    const cel = i => { const t = $('previaTabelaFolgas'); const k = [...t.querySelectorAll('thead th')].findIndex(h => h.innerHTML.startsWith(d + '<br>')); return t.querySelectorAll('tbody tr')[i]?.children[k]?.textContent.trim(); };
    V.definirModo('manual');
    const livres = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]));
    const x = livres.find(i => V.marcar(i, d, true) && (V.sel()[d] || []).includes(i));
    const y = livres.find(i => i !== x && !(V.sel()[d] || []).includes(i));
    out.marcou = x !== undefined && y !== undefined;
    renderPreviaFolgasFeriado(true); out.manual = cel(x) === 'DOM' && cel(y) === 'FOLGA DOM';
    V.definirModo('misto'); renderPreviaFolgasFeriado(true); out.misto = cel(x) === 'DOM' && cel(y) === '—';
    V.definirModo('auto'); renderPreviaFolgasFeriado(true); out.auto = cel(x) === '—' && cel(y) === '—';
    trabalhoDomingo = { [d]: [y] }; renderPreviaFolgasFeriado(true); out.gerado = cel(y) === 'DOM' && cel(x) === 'FOLGA DOM';
    trabalhoDomingo = {};
    return out;
  });
  ok(r.marcou && r.manual && r.misto && r.auto && r.gerado, `V177: prévia das folgas mostra os domingos antes de gerar (à mão: ${r.manual}; misto: ${r.misto}; automático “—”: ${r.auto}; depois de gerar: ${r.gerado})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
async function testarAssistenteRobusto(browser, app, nome, abrir){   // V263/V177: testes ARH-09 e ARH-10 do ChatGPT (PR #60)
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 263 : 177)) return;
  console.log(`\n▶ ${nome} — 🤖 Assistente RH: dado estragado e fechar logo depois de marcar`);
  const enc = nome !== 'Setores', LS = enc ? 'enc.v176Assistente' : 'escalaSetores.v262Assistente';
  const nova = async () => { const o = await novaPagina(browser); await o.p.goto('file://' + app); await o.p.waitForTimeout(1200); await abrir(o.p); return o; };
  { const { p, erros } = await nova();
    const r = await p.evaluate(enc => { const A = window.v262Assistente, D = A.dados(), sk = enc ? 'encarregados' : (norm($('setorSelecionado').value || '') || 'setor');
      const mk = pes => ({ v: 1, setor: sk, dados: { meses: { '2026-13': 'x', 'lixo': 'x', '2026-01': 'g' }, pessoas: pes } });
      A.juntar(mk({ T1: { esc: 2, rec: 1, ace: 1, hor: { '07:00-15:20': 2 }, dm: { '2026-01': 1 } } }));
      let erro = ''; try{ A.juntar(mk({ T1: { esc: 'abc', ace: [7], rec: -5, hor: { '07:00-15:20': 'x', 'lixo': 9 }, dm: { '2026-13': 3, '2026-02': -1, '2026-03': 'x' } }, T2: null, T3: { esc: 4 } })); }catch(e){ erro = e.message; }
      const s = D.setores[sk], t1 = s.pessoas.T1;
      return { erro, esc: t1.esc, ace: t1.ace, rec: t1.rec, hor: t1.hor['07:00-15:20'], horLixo: 'lixo' in t1.hor, dmRuim: ['2026-13', '2026-02', '2026-03'].filter(k => k in t1.dm), t3: s.pessoas.T3?.esc, mesesRuins: ['2026-13', 'lixo'].filter(k => k in s.meses), t2: 'T2' in s.pessoas }; }, enc);
    ok(!r.erro && r.esc === 2 && r.ace === 1 && r.rec === 1 && (enc || r.hor === 2) && !r.horLixo && !r.dmRuim.length && r.t3 === 4 && !r.mesesRuins.length && !r.t2,
      `ARH-09: histórico com dado estragado não apaga nem corrompe (erro: ${r.erro || 'nenhum'}; esc ${r.esc}/2, ace ${r.ace}/1, rec ${r.rec}/1${enc ? '' : `, horário ${r.hor}/2`}; meses inválidos aceitos: ${r.mesesRuins.length + r.dmRuim.length}; pessoa vazia pulada e a seguinte entra: ${!r.t2 && r.t3 === 4})`);
    ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
    await p.close(); }
  { const { p } = await nova();
    await p.evaluate(LS => localStorage.removeItem(LS), LS); await p.waitForTimeout(400);
    const pk = await p.evaluate(enc => { const i = equipe.findIndex(f => !foraDom(f)), inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = true;
      if(enc){ inp.dataset.p = String(i); inp.dataset.d = '7'; document.body.appendChild(inp); }
      else { inp.dataset.dom = '7'; inp.dataset.func = String(i); document.getElementById('selecaoDomingosManual').appendChild(inp); }
      inp.dispatchEvent(new Event('change', { bubbles: true })); inp.remove();
      const f = equipe[i]; return String(f.matricula || '').trim().replace(/^0+/, '') || ('N:' + String(f.nome || '').trim().toUpperCase()); }, enc);
    await p.waitForTimeout(30); await p.reload(); await p.waitForTimeout(600);
    const exato = await p.evaluate(([LS, pk]) => { const x = JSON.parse(localStorage.getItem(LS) || 'null'); if(!x) return null; const out = { pk: null, outros: 0 };
      Object.values(x.setores).forEach(s => Object.entries(s.pessoas).forEach(([k, q]) => { if(k === pk) out.pk = q.esc; else out.outros += q.esc || 0; })); return out; }, [LS, pk]);
    ok(exato && exato.pk === 1 && exato.outros === 0, `ARH-10/16: a marcação guardada é da pessoa certa (dela: ${exato?.pk}; das outras: ${exato?.outros})`);
    const n = await p.evaluate(LS => { const x = JSON.parse(localStorage.getItem(LS) || 'null'); let n = 0; if(x) Object.values(x.setores).forEach(s => Object.values(s.pessoas).forEach(q => n += q.esc || 0)); return n; }, LS);
    ok(n === 1, `ARH-10: marcar e fechar o app logo em seguida (30 ms) não perde a marcação (guardado: ${n})`);
    await p.close(); }
}
/* ARH-16 a ARH-24 — cenários novos do parecer do ChatGPT no PR #60 (tarefa de testes separada, decisão do gerente).
   Tudo com dados fictícios. Pessoas “Z…” ficam fora da equipe para o aprenderMes não interferir. */
async function testarAssistenteEstresse(browser, app, nome, abrir){
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 263 : 177)) return;
  console.log(`\n▶ ${nome} — 🤖 Assistente RH: estresse ARH-16 a ARH-24`);
  const enc = nome !== 'Setores', LS = enc ? 'enc.v176Assistente' : 'escalaSetores.v262Assistente';
  const nova = async () => { const o = await novaPagina(browser); await o.p.goto('file://' + app); await o.p.waitForTimeout(1200); await abrir(o.p); return o; };
  /* funções de apoio dentro da página: setor, chave da pessoa, marcar alguém pelo evento real, ler o que está gravado */
  const APOIO = enc => { window.__enc = enc;
    window.__sk = () => enc ? 'encarregados' : (norm(document.getElementById('setorSelecionado').value || '') || 'setor');
    window.__pk = i => { const f = equipe[i]; return String(f.matricula || '').trim().replace(/^0+/, '') || ('N:' + String(f.nome || '').trim().toUpperCase()); };
    window.__marcar = i => { const inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = true;
      if(enc){ inp.dataset.p = String(i); inp.dataset.d = '7'; document.body.appendChild(inp); } else { inp.dataset.dom = '7'; inp.dataset.func = String(i); document.getElementById('selecaoDomingosManual').appendChild(inp); }
      inp.dispatchEvent(new Event('change', { bubbles: true })); inp.remove(); };
    window.__gravado = (LS, pk) => { const x = JSON.parse(localStorage.getItem(LS) || 'null'); return x?.setores?.[__sk()]?.pessoas?.[pk]?.esc ?? null; };
    window.__mk = pes => ({ v: 1, setor: __sk(), dados: { meses: {}, pessoas: pes } });
    window.__esconder = sim => { if(sim) Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); else delete document.visibilityState; };
  };
  const { p, erros } = await nova(); await p.evaluate(APOIO, enc);
  // ARH-16 — a contagem vai para a pessoa exata; ninguém mais muda
  { const r = await p.evaluate(async LS => { const w = ms => new Promise(o => setTimeout(o, ms)), A = window.v262Assistente, D = A.dados();
      const ii = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i])), i = ii[1], pk = __pk(i);
      const antes = {}; Object.entries(D.setores[__sk()]?.pessoas || {}).forEach(([k, q]) => { antes[k] = q.esc; });
      __marcar(i); await w(450);
      const pes = D.setores[__sk()].pessoas, mudou = Object.entries(pes).filter(([k, q]) => k !== pk && q.esc !== antes[k]).map(([k]) => k);
      return { dela: pes[pk].esc - (antes[pk] || 0), mudou: mudou.length, gravado: __gravado(LS, pk) === pes[pk].esc }; }, LS);
    ok(r.dela === 1 && !r.mudou && r.gravado, `ARH-16: marcar uma pessoa soma 1 só nela (dela: +${r.dela}; outras que mudaram: ${r.mudou}; gravado igual: ${r.gravado})`); }
  // ARH-17 — cada evento de saída grava sozinho; repetir não aumenta contador
  { const r = await p.evaluate(LS => { const A = window.v262Assistente, D = A.dados(), i = equipe.findIndex(f => !foraDom(f)), pk = __pk(i), out = {};
      __marcar(i); const esperado = D.setores[__sk()].pessoas[pk].esc;
      __esconder(true); document.dispatchEvent(new Event('visibilitychange')); __esconder(false); out.vis = __gravado(LS, pk) === esperado;
      __marcar(i); const esp2 = D.setores[__sk()].pessoas[pk].esc;
      window.dispatchEvent(new Event('pagehide')); out.page = __gravado(LS, pk) === esp2;
      for(let k = 0; k < 5; k++){ __esconder(true); document.dispatchEvent(new Event('visibilitychange')); __esconder(false); window.dispatchEvent(new Event('pagehide')); }
      out.repetido = __gravado(LS, pk) === esp2 && D.setores[__sk()].pessoas[pk].esc === esp2;
      // “visível” não grava nada (só “escondido” grava)
      __marcar(i); document.dispatchEvent(new Event('visibilitychange')); out.visivelNaoGrava = __gravado(LS, pk) === esp2;
      return out; }, LS);
    ok(r.vis && r.page && r.repetido && r.visivelNaoGrava, `ARH-17: só “visibilitychange” (escondido) grava na hora: ${r.vis}; só “pagehide” grava na hora: ${r.page}; 5 saídas seguidas não aumentam nada: ${r.repetido}; voltar a ficar visível não grava: ${r.visivelNaoGrava}`); }
  // ARH-18 — gravar na hora perto do fim da espera (290 ms) e marcar de novo: fica o estado mais novo
  { const r = await p.evaluate(async LS => { const w = ms => new Promise(o => setTimeout(o, ms)), D = window.v262Assistente.dados(), i = equipe.findIndex(f => !foraDom(f)), pk = __pk(i);
      await w(400); __marcar(i); await w(290); window.dispatchEvent(new Event('pagehide')); const meio = __gravado(LS, pk);
      __marcar(i); const novo = D.setores[__sk()].pessoas[pk].esc; await w(30); await w(400);
      return { meio, novo, fim: __gravado(LS, pk) }; }, LS);
    ok(r.fim === r.novo && r.meio === r.novo - 1, `ARH-18: gravar na hora aos 290 ms (${r.meio}) e marcar de novo: no fim fica o mais novo (${r.fim} = ${r.novo}), a espera antiga não volta atrás`); }
  // ARH-19 — pessoa vazia no começo, no meio e no fim
  { const r = await p.evaluate(() => { const A = window.v262Assistente, D = A.dados(); let erro = '';
      try{ A.juntar(__mk({ Z0: null, ZA: { esc: 1 }, Z1: null, ZB: { esc: 2 }, Z2: 'texto', ZC: { esc: 3 }, Z3: [1], Z4: null })); }catch(e){ erro = e.message; }
      const ps = D.setores[__sk()].pessoas; return { erro, a: ps.ZA?.esc, b: ps.ZB?.esc, c: ps.ZC?.esc, lixo: ['Z0', 'Z1', 'Z2', 'Z3', 'Z4'].filter(k => k in ps).length }; });
    ok(!r.erro && r.a === 1 && r.b === 2 && r.c === 3 && !r.lixo, `ARH-19: pessoa vazia/estragada no começo, no meio e no fim é pulada e as válidas entram (erro: ${r.erro || 'nenhum'}; válidas ${r.a}/${r.b}/${r.c}; estragadas aceitas: ${r.lixo})`); }
  // ARH-20 — limites de formato (mês, horário, número)
  { const r = await p.evaluate(() => { const A = window.v262Assistente, D = A.dados();
      A.juntar(__mk({ ZL: { esc: 3, rec: 1, ace: 2, hor: { '07:00-15:20': 2 }, dm: { '2026-05': 1 } } }));
      A.juntar(__mk({ ZL: { esc: Infinity, rec: -1, ace: '9', hor: { '24:00-25:00': 5, '12:60-13:00': 5, '7:00-15:20': 5, '07:00-15:20': NaN, '23:00-07:00': 4 },
        dm: { '2026-00': 1, '2026-13': 1, '2026-1': 1, '2026-12': 2, '2026-05': 9, '2026-06': Infinity } } }));
      const q = D.setores[__sk()].pessoas.ZL; return { esc: q.esc, rec: q.rec, ace: q.ace, hor: Object.keys(q.hor).sort(), hor0700: q.hor['07:00-15:20'], dm: q.dm }; });
    const horOk = enc ? true : JSON.stringify(r.hor) === JSON.stringify(['07:00-15:20', '23:00-07:00']) && r.hor0700 === 2;
    const dmOk = JSON.stringify(Object.keys(r.dm).sort()) === JSON.stringify(['2026-05', '2026-12']) && r.dm['2026-05'] === 1 && r.dm['2026-12'] === 2;
    ok(r.esc === 3 && r.rec === 1 && r.ace === 2 && horOk && dmOk, `ARH-20: limites — infinito, negativo e número em texto ignorados (esc ${r.esc}/3, rec ${r.rec}/1, ace ${r.ace}/2)` + (enc ? '' : `; horários aceitos: ${r.hor.join(', ')} (só 07:00-15:20 e 23:00-07:00)`) + `; meses aceitos: ${Object.keys(r.dm).sort().join(', ')} (só 2026-05 e 2026-12; o 2026-05 que já existia fica ${r.dm['2026-05']})`); }
  // ARH-23 — histórico grande com lixo intercalado: todas as válidas entram; tempo de juntar + gravar
  { const r = await p.evaluate(LS => { const A = window.v262Assistente, D = A.dados(), pes = {}, lixos = [null, 'x', [1], 7, { esc: 'abc' }];
      for(let k = 0; k < 1000; k++) pes['ZG' + k] = k % 2 ? lixos[k % 5] : { esc: k % 9, ace: 1, dm: { '2026-01': k % 4 } };
      const t = performance.now(); let erro = ''; try{ A.juntar(__mk(pes)); }catch(e){ erro = e.message; } window.dispatchEvent(new Event('pagehide')); const ms = performance.now() - t;
      const ps = D.setores[__sk()].pessoas; let validas = 0, ruins = 0; for(let k = 0; k < 1000; k++){ const q = ps['ZG' + k]; if(k % 2 === 0){ if(q && q.esc === k % 9) validas++; } else if(q && !(q.esc === 0 && !q.ace)) ruins++; }
      const x = JSON.parse(localStorage.getItem(LS) || 'null'); return { erro, validas, ruins, ms, gravou: !!x?.setores?.[__sk()]?.pessoas?.ZG998 }; }, LS);
    ok(!r.erro && r.validas === 500 && !r.ruins && r.gravou && r.ms < 3000, `ARH-23: 1.000 pessoas com lixo intercalado — válidas que entraram: ${r.validas}/500; estragadas com valor: ${r.ruins}; juntar + gravar: ${r.ms.toFixed(0)} ms; gravado: ${r.gravou}`); }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
  // ARH-21 — aparelho com o aprendizado gravado estragado
  { const { p, erros } = await nova();
    await p.evaluate(LS => localStorage.setItem(LS, '{"setores":{estragado'), LS); await p.reload(); await p.waitForTimeout(1200); await abrir(p); await p.evaluate(APOIO, enc);
    const r = await p.evaluate(async LS => { const w = ms => new Promise(o => setTimeout(o, ms)), i = equipe.findIndex(f => !foraDom(f)), pk = __pk(i);
      const vazio = !Object.values(window.v262Assistente.dados().setores).some(s => Object.keys(s.pessoas || {}).length);   /* a gaveta vazia do setor pode existir; pessoas não */ __marcar(i); await w(450);
      let valido = false; try{ JSON.parse(localStorage.getItem(LS)); valido = true; }catch(e){} return { vazio, valido, esc: __gravado(LS, pk) }; }, LS);
    ok(r.vazio && r.valido && r.esc === 1 && !erros.length, `ARH-21: aprendizado gravado estragado — o app abre sem erro (${!erros.length}), começa vazio (${r.vazio}) e volta a gravar certo (JSON válido: ${r.valido}; esc ${r.esc})`);
    // ARH-24 — sair da página e voltar (cache do navegador ou recarga): nada se perde nem conta 2 vezes
    const pessoas = d => { const out = {}; Object.entries((d && d.setores) || {}).forEach(([k, s]) => Object.entries(s.pessoas || {}).forEach(([pk, q]) => { out[k + '|' + pk] = JSON.stringify([q.esc, q.rec, q.ace, q.hor, q.dm]); })); return JSON.stringify(Object.keys(out).sort().map(k => [k, out[k]])); };
    const antes = pessoas(await p.evaluate(LS => JSON.parse(localStorage.getItem(LS) || 'null'), LS));
    await p.goto('about:blank'); await p.waitForTimeout(300); await p.goBack(); await p.waitForTimeout(1500);
    const dep = await p.evaluate(LS => ({ ls: JSON.parse(localStorage.getItem(LS) || 'null'), d: window.v262Assistente ? JSON.parse(JSON.stringify(window.v262Assistente.dados())) : null }), LS);
    const lsIgual = pessoas(dep.ls) === antes, dIgual = pessoas(dep.d) === antes;
    ok(lsIgual && dIgual && antes !== '[]', `ARH-24: sair do app e voltar não perde nem dobra o aprendizado (pessoas e contagens gravadas iguais: ${lsIgual}; na memória iguais: ${dIgual})`);
    await p.close(); }
  // ARH-22 — ida e volta pelo histórico de verdade: gera → 📦 Guardar histórico → abre em aparelho limpo → guarda de novo → compara
  { const { p, ctx } = await nova(); await p.evaluate(APOIO, enc);
    await p.evaluate(() => window.v262Assistente.juntar(__mk({ ZR: { nome: 'TESTE IDA E VOLTA', esc: 7, rec: 2, ace: 3, hor: { '07:00-15:20': 4 }, dm: { '2026-02': 2 } } })));
    const gerarEGuardar = async (p, rot) => {
      await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); (window.v45GotoStep || window.v80GotoStep)?.(5, false); document.getElementById('btnGerar').click(); });
      for(let w = 0; w < 240; w++){ await p.waitForTimeout(250); if(await p.evaluate(() => Object.values(trabalhoDomingo || {}).some(a => a && a.length))) break; }
      await p.waitForTimeout(800);
      await p.evaluate(() => window.v266Horarios?.confirmar?.());   /* V266: confirma o horário de domingo antes de guardar */ const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.getElementById('btnHistorico').click())]);
      const arq = path.join(require('os').tmpdir(), `teste_arh22_${nome}_${rot}_` + dl.suggestedFilename()); await dl.saveAs(arq); return arq; };
    const arq1 = await gerarEGuardar(p, '1'); await ctx.close();
    const j1 = JSON.parse(fs.readFileSync(arq1, 'utf8'));
    const { p: p2, erros: er2, ctx: ctx2 } = await novaPagina(browser); await p2.goto('file://' + app); await p2.waitForTimeout(1200);
    await p2.evaluate(LS => localStorage.removeItem(LS), LS); await abrir(p2); await p2.evaluate(APOIO, enc);
    await p2.setInputFiles('#arquivoProjetoJSON', arq1); await p2.waitForTimeout(3500);
    const arq2 = await gerarEGuardar(p2, '2'); const j2 = JSON.parse(fs.readFileSync(arq2, 'utf8'));
    const z1 = j1?.assistente?.dados?.pessoas?.ZR, z2 = j2?.assistente?.dados?.pessoas?.ZR;
    const igual = !!z1 && !!z2 && JSON.stringify(z1) === JSON.stringify(z2);
    const pessoas1 = Object.keys(j1?.assistente?.dados?.pessoas || {}).length, pessoas2 = Object.keys(j2?.assistente?.dados?.pessoas || {}).length;
    ok(igual && pessoas2 >= pessoas1 && !er2.length, `ARH-22: ida e volta pelo 📦 histórico — o arquivo leva o aprendizado (${!!z1}); aberto num aparelho limpo e guardado de novo, a pessoa de teste volta igual (${igual}) e ninguém some (${pessoas1} → ${pessoas2} pessoas)`);
    await ctx2.close(); fs.unlinkSync(arq1); fs.unlinkSync(arq2); }
}
const abrirSetoresFL = async p => { await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300); await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(2500); };
const abrirEnc15 = async p => { await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300); await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1800); };
/* V265/V178 — 💬 Pergunte ao Assistente RH: mini chat sem internet nos dois apps */
async function testarChatAssistente(browser, app, nome, abrir){
  const v = +path.basename(app).match(/V(\d+)\.html$/)[1];
  if(v < (nome === 'Setores' ? 265 : 178)) return;
  console.log(`\n▶ ${nome} — 💬 Pergunte ao Assistente RH (mini chat)`);
  const enc = nome !== 'Setores';
  const { p, erros } = await novaPagina(browser); await p.goto('file://' + app); await p.waitForTimeout(1200); await abrir(p); await p.waitForTimeout(1200);
  const r = await p.evaluate(async enc => { const w = ms => new Promise(o => setTimeout(o, ms)), C = window.v265Chat, out = {};
    let rede = 0; const f0 = window.fetch, x0 = XMLHttpRequest.prototype.open; window.fetch = (...a) => { rede++; return f0(...a); }; XMLHttpRequest.prototype.open = function(){ rede++; return x0.apply(this, arguments); };
    const d = domingosDoMes(+$('ano').value, +$('mes').value), cont = {}; equipe.forEach(f => { const k = f.nome.split(' ')[0]; cont[k] = (cont[k] || 0) + 1; });
    const livres = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]) && cont[equipe[i].nome.split(' ')[0]] === 1);
    let x;
    if(enc){ window.v167.definirModo('manual'); x = livres.find(i => window.v167.marcar(i, d[0], true) && (window.v167.sel()[d[0]] || []).includes(i)); if(x !== undefined) window.v167.marcar(x, d[1], true); }
    else { const s = $('modoGeracao'); s.value = 'manual'; s.dispatchEvent(new Event('change', { bubbles: true })); await w(300);
      x = livres.find(i => !ehLiderancaDomingo(equipe[i])); selecaoManualDomingo[String(d[0])] = [x]; selecaoManualDomingo[String(d[1])] = [x]; }
    const pn = equipe[x].nome.split(' ')[0], cheio = equipe[x].nome.split(' ').slice(0, 2).join(' ');
    const txt = h => String(h).replace(/<[^>]+>/g, '');
    out.quem = txt(C.responder(`quem trabalha no domingo ${d[0]}?`)).includes(pn);
    out.quantos = /: 2 domingo/.test(txt(C.responder(`quantos domingos ${cheio} fez?`)));
    const pq = C.responder(`por que ${pn} não pode no domingo ${d[2]}?`); out.porque = pq.includes('❌'); out.porqueTxt = txt(pq).slice(0, 160);
    out.regra = txt(C.responder('como funciona o 6x1')).includes('6 dias seguidos');
    out.feriado = /Feriados de|Não há feriado/.test(txt(C.responder('tem feriado esse mês?')));
    out.naoEntendi = txt(C.responder('xpto qwerty')).includes('Não entendi');
    out.falta = /falta/i.test(txt(C.responder('o que falta?')));
    if(enc) out.regraEnc = txt(C.responder('regras do domingo')).includes('3 pessoas'); else out.regraEnc = true;
    // tela: abrir, aba Perguntar, escrever e enviar
    C.abrirChat(); await w(300); const inp = document.getElementById('v265Txt'); out.aba = !!inp && !document.querySelector('.v265-chat').hidden && document.querySelector('#v262Painel .lista').hidden;
    inp.value = 'o que falta?'; inp.form.requestSubmit(); await w(200);
    const msgs = [...document.querySelectorAll('#v265Msgs .v265-msg')]; out.tela = msgs.length >= 2 && msgs[msgs.length - 2].classList.contains('eu') && msgs[msgs.length - 1].classList.contains('bot');
    document.querySelector('.v265-abas [data-aba="dicas"]').click(); await w(100); out.voltaDicas = !document.querySelector('#v262Painel .lista').hidden && document.querySelector('.v265-chat').hidden;
    out.rede = rede; window.fetch = f0; XMLHttpRequest.prototype.open = x0;
    return out; }, enc);
  ok(r.quem && r.quantos && r.porque, `chat responde com os dados da tela: quem trabalha no domingo (${r.quem}), quantos domingos a pessoa fez (${r.quantos}), por que não pode no 3º domingo seguido (${r.porque}: “${r.porqueTxt}”)`);
  ok(r.regra && r.feriado && r.falta && r.regraEnc && r.naoEntendi, `chat responde regras, feriados e o que falta, e avisa quando não entende (6×1: ${r.regra}; feriados: ${r.feriado}; o que falta: ${r.falta}${enc ? `; regras do domingo: ${r.regraEnc}` : ''}; não entendi: ${r.naoEntendi})`);
  ok(r.aba && r.tela && r.voltaDicas, `tela: aba 💬 Perguntar abre o chat (${r.aba}), escrever e enviar mostra pergunta e resposta (${r.tela}), aba 💡 Dicas volta (${r.voltaDicas})`);
  ok(r.rede === 0, `o chat não usa a internet (pedidos de rede: ${r.rede})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
/* V266 — ⏰ horário de domingo: no Automático, depois de gerar, o usuário confere e confirma (obrigatório) */
async function testarHorarioDomingoAuto(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 266) return;
  console.log('\n▶ Setores — ⏰ confirmar o horário de domingo (escala automática)');
  const { p, erros } = await novaPagina(browser); await p.goto('file://' + app); await p.waitForTimeout(1200); await abrirSetoresFL(p);
  await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); const s = $('modoGeracao'); s.value = 'motor'; s.dispatchEvent(new Event('change', { bubbles: true })); try{ if(liderVarias()) definirLiderVarias(true, 2); sugerirLiderancaDomingo(); }catch(e){} });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.v45GotoStep?.(5, false); document.getElementById('btnGerar').click(); });
  for(let w = 0; w < 160; w++){ await p.waitForTimeout(250); if(await p.evaluate(() => Object.values(trabalhoDomingo || {}).some(a => a && a.length))) break; }
  await p.waitForTimeout(1500);
  const a = await p.evaluate(() => { const P = v266Horarios.pendentes(); const n = Object.values(P).reduce((t, l) => t + l.length, 0), tot = Object.values(trabalhoDomingo).reduce((t, l) => t + l.length, 0);
    return { precisa: v266Horarios.precisa(), conf: v266Horarios.confirmado(), quadro: !!document.querySelector('#v266Horarios:not([hidden])'), selects: document.querySelectorAll('#v266Horarios select').length, n, tot }; });
  ok(a.precisa && !a.conf && a.quadro && a.selects === a.n && a.n === a.tot, `depois de gerar no Automático aparece o quadro “⏰ Horário de domingo” com uma lista de horário para cada pessoa escalada (${a.selects} de ${a.tot}), ainda sem confirmar`);
  let baixou = 0; p.on('download', () => baixou++);
  await p.evaluate(() => document.getElementById('btnExcel').click()); await p.evaluate(() => document.getElementById('btnHistorico').click()); await p.waitForTimeout(1200);
  ok(baixou === 0, `sem confirmar, “Baixar planilha” e “Guardar histórico” não baixam nada (baixados: ${baixou})`);
  const t = await p.evaluate(() => { const s = document.querySelector('#v266Horarios select'), d = +s.dataset.v266D, i = +s.dataset.v266I; const nova = [...s.options].find(o => o.value && o.value !== s.value).value;
    s.value = nova; s.dispatchEvent(new Event('change', { bubbles: true })); return { d, i, nova, agora: String(horarioDomingoSelecionado(d, i)).split('-')[0], manual: !!horarioManualSelecionado(d, i) }; });
  await p.waitForTimeout(600);
  const naTabela = await p.evaluate(h => document.getElementById('tabelaEscala').innerText.includes(h), t.nova);
  ok(t.agora === t.nova && !t.manual && naTabela, `trocar o horário no quadro vale na hora (${t.nova}) e aparece na tabela do mês (${naTabela})`);
  await p.click('#v266Confirmar'); await p.waitForTimeout(400);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), p.evaluate(() => document.getElementById('btnHistorico').click())]);
  let j = null; if(dl){ const arq = path.join(require('os').tmpdir(), 'teste_v266_' + dl.suggestedFilename()); await dl.saveAs(arq); j = JSON.parse(fs.readFileSync(arq, 'utf8')); fs.unlinkSync(arq); }
  const noArquivo = JSON.stringify(j || {}).includes(`"${t.i}":"${t.nova}-`);
  ok(!!dl && noArquivo, `depois de “✅ Confirmei”, o histórico baixa e leva o horário trocado (${!!dl}; horário no arquivo: ${noArquivo})`);
  await p.evaluate(() => document.getElementById('btnGerar').click());
  for(let w = 0; w < 40; w++){ await p.waitForTimeout(250); if(!(await p.evaluate(() => v266Horarios.confirmado()))) break; }
  ok(!(await p.evaluate(() => v266Horarios.confirmado())), 'gerar de novo pede nova confirmação');
  // escala à mão: o horário já é do usuário — o quadro não aparece
  const m = await p.evaluate(() => { const bk = { mg: $('modoGeracao').value, sel: JSON.stringify(selecaoManualDomingo), hor: JSON.stringify(horariosManuaisDomingo), td: JSON.stringify(trabalhoDomingo) };
    const d = Object.keys(trabalhoDomingo)[0], l = trabalhoDomingo[d]; horariosManuaisDomingo = {}; trabalhoDomingo = { [d]: l }; horariosManuaisDomingo[d] = Object.fromEntries(l.map(i => [String(i), '07:00-15:20']));
    const r = v266Horarios.precisa(); horariosManuaisDomingo = JSON.parse(bk.hor); trabalhoDomingo = JSON.parse(bk.td); return r; });
  ok(m === false, 'quem já tem horário dado à mão não entra no quadro (escala à mão não precisa confirmar)');
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
/* V267 — ⏰ horário por função no “Por cargo”: 3×06:50, 1×07:45, 3×12:00 */
async function testarHorarioPorFuncao(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 267) return;
  console.log('\n▶ Setores — ⏰ horário por função no “Por cargo”');
  const { p, erros } = await novaPagina(browser); await p.goto('file://' + app); await p.waitForTimeout(1200); await abrirSetoresFL(p);
  const k = await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); const s = $('modoCobertura'); s.value = 'funcao'; s.dispatchEvent(new Event('change', { bubbles: true })); renderConfigFuncao();
    return funcoesDoSetor().find(f => /operador/.test(f.chave)).chave; });
  // pela tela: adicionar 3 horários e acertar as quantidades
  const tela = await p.evaluate(async k => { const w = ms => new Promise(o => setTimeout(o, ms)), q = sel => document.querySelector(`[data-v267-fn="${k}"] ${sel}`);
    for(let n = 0; n < 3; n++){ q('[data-v267-add]').click(); await w(60); }
    const lins = () => [...document.querySelectorAll(`[data-v267-fn="${k}"] [data-v267-j]`)];
    const set = (j, h, n) => { const l = lins()[j]; const s = l.querySelector('[data-v267-h]'); s.value = h; s.dispatchEvent(new Event('change')); const l2 = lins()[j], inp = l2.querySelector('[data-v267-n]'); inp.value = String(n); inp.dispatchEvent(new Event('change')); };
    set(0, '06:50', 3); set(1, '07:45', 1); set(2, '12:00', 3);
    return { linhas: lins().length, base: qtdFuncaoBase(k), slots: window.v267HorFuncao.slots(k).join(','), resumo: q('summary').textContent.trim() }; }, k);
  ok(tela.linhas === 3 && tela.base === 7 && tela.slots === '06:50,06:50,06:50,07:45,12:00,12:00,12:00', `pela tela: 3 às 06:50, 1 às 07:45 e 3 às 12:00 — a quantidade da função vira ${tela.base} (“${tela.resumo}”)`);
  const guardado = await p.evaluate(k => { const all = JSON.parse(localStorage.getItem('escalaSetores.coberturaFuncao') || '{}'); return JSON.stringify(Object.values(all).map(c => c.hor?.[k]).find(Boolean) || null); }, k);
  ok(/06:50/.test(guardado) && /12:00/.test(guardado), 'a divisão fica guardada no aparelho (e vai no histórico do mês)');
  await p.evaluate(() => { try{ if(liderVarias()) definirLiderVarias(true, 2); sugerirLiderancaDomingo(); }catch(e){} window.v45GotoStep?.(5, false); document.getElementById('btnGerar').click(); });
  for(let w = 0; w < 160; w++){ await p.waitForTimeout(250); if(await p.evaluate(() => Object.values(trabalhoDomingo || {}).some(a => a && a.length))) break; }
  await p.waitForTimeout(1200);
  const r = await p.evaluate(k => { const bal = balancoDoMes(+$('ano').value, +$('mes').value), out = [];
    Object.keys(trabalhoDomingo).map(Number).filter(d => d !== bal).forEach(d => { const ps = trabalhoDomingo[d].filter(i => chaveFuncaoDistribuicao(i) === k && !ehLiderancaDomingo(equipe[i]));
      const hs = ps.map(i => String(horarioDomingoSelecionado(d, i)).split('-')[0]).sort();
      const cedo = ps.filter(i => String(horarioDomingoSelecionado(d, i)).startsWith('06:50')).map(i => horarioHabitualInicio(i) ?? 999), tarde = ps.filter(i => String(horarioDomingoSelecionado(d, i)).startsWith('12:00')).map(i => horarioHabitualInicio(i) ?? 999);
      out.push({ d, hs: hs.join(','), ordem: !cedo.length || !tarde.length || Math.max(...cedo) <= Math.min(...tarde) }); });
    return out; }, k);
  const certos = r.filter(x => x.hs === '06:50,06:50,06:50,07:45,12:00,12:00,12:00');
  ok(r.length && certos.length === r.length, `ao gerar, cada domingo tem 3 às 06:50, 1 às 07:45 e 3 às 12:00 (${certos.length}/${r.length} domingos)` + (certos.length < r.length ? ' — ' + JSON.stringify(r.filter(x => !certos.includes(x))[0]) : ''));
  ok(r.every(x => x.ordem), 'quem começa mais cedo no dia a dia fica com o horário mais cedo');
  // guardar tudo no histórico e abrir num aparelho limpo (pedido do dono)
  const t = await p.evaluate(() => { const s = document.querySelector('#v266Horarios select'), d = +s.dataset.v266D, i = +s.dataset.v266I; s.value = [...s.options].find(o => o.value && o.value !== s.value).value; s.dispatchEvent(new Event('change', { bubbles: true }));
    v266Horarios.confirmar(); return { d, mat: equipe[i].matricula, h: horarioDomingoSelecionado(d, i) }; });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.getElementById('btnHistorico').click())]);
  const arq = path.join(require('os').tmpdir(), 'teste_v267_' + dl.suggestedFilename()); await dl.saveAs(arq);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
  { const { p, erros } = await novaPagina(browser); await p.goto('file://' + app); await p.waitForTimeout(1200); await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
    await p.setInputFiles('#arquivoProjetoJSON', arq); await p.waitForTimeout(4000);
    const v = await p.evaluate(([k, t]) => { const i = equipe.findIndex(f => String(f.matricula) === String(t.mat));
      return { hor: window.v267HorFuncao.slots(k).join(','), h: i >= 0 ? horarioDomingoSelecionado(t.d, i) : '', conf: v266Horarios.confirmado() }; }, [k, t]);
    ok(v.hor === '06:50,06:50,06:50,07:45,12:00,12:00,12:00' && v.h === t.h && v.conf, `histórico guardado e aberto num aparelho limpo: volta a divisão por horário (${!!v.hor}), o horário de domingo de cada pessoa (${v.h} = ${t.h}) e a confirmação (${v.conf})`);
    ok(!erros.length, 'aparelho limpo: sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
    await p.close(); }
  fs.unlinkSync(arq);
}
/* V268 — 🤖 Assistente na tela inicial: a dica diz o setor e o “Ir até lá” sai da tela inicial (print do dono) */
async function testarAssistenteTelaInicial(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 268) return;
  console.log('\n▶ Setores — 🤖 Assistente: “Ir até lá” a partir da tela inicial');
  const { p, erros } = await novaPagina(browser); await p.goto('file://' + app); await p.waitForTimeout(1200); await abrirSetoresFL(p);
  await p.evaluate(() => { document.querySelectorAll('.settings-backdrop').forEach(x => x.hidden = true); const s = $('modoGeracao'); s.value = 'manual'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(400);
  for(const tela of ['homeSetores', 'inicioSetor']){
    await p.evaluate(t => { if(t === 'homeSetores') abrirHomeSetores(); else window.abrirInicioSetor('Frente de Loja'); window.v262Assistente.abrir(); }, tela);
    await p.waitForTimeout(800);
    const dica = await p.evaluate(() => { const d = [...document.querySelectorAll('#v262Painel .v262-dica')].find(x => /faltam/i.test(x.textContent)); return d ? d.textContent.replace(/\s+/g, ' ') : ''; });
    await p.evaluate(() => { const b = [...document.querySelectorAll('#v262Painel .v262-dica button')].find(x => /Ir até lá/.test(x.textContent)); b && b.click(); });
    await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({ cobre: $('homeSetores').classList.contains('on') || $('inicioSetor').classList.contains('on'), passo3: !!document.querySelector('.step-panel.active #selecaoDomingosManual, .step-panel.active #selecaoDomingosMista') }));
    ok(/Frente de Loja · \w+\/\d{4}/.test(dica) && /\(domingo \d{2}\/\d{2}\)/.test(dica), `${tela === 'homeSetores' ? 'escolher o setor' : 'início do setor'}: a dica diz o setor, o mês e o domingo (“${dica.slice(0, 70)}…”)`);
    ok(!st.cobre && st.passo3, `${tela === 'homeSetores' ? 'escolher o setor' : 'início do setor'}: “Ir até lá” sai da tela inicial e abre o passo 3 Domingos (tela inicial fechada: ${!st.cobre}; passo 3: ${st.passo3})`);
  }
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
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
    const lista0 = () => (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe);
    const folgas0 = JSON.stringify(lista0().map(x => [x.matricula, Number(x.folgaFixa), !!x.folgaPendente]));
    const mostraFolga = [...document.querySelectorAll('#equipeEditorRows .editor-row')].every((row, k) => { const x = equipe[k], v = row.querySelector('.ed-folga')?.value; return !x || (x.folgaPendente ? v === '' : Number(v) === Number(x.folgaFixa)); });
    salvarEquipeEditor(); await new Promise(z => setTimeout(z, 800));
    const folgasIguais = folgas0 === JSON.stringify(lista0().map(x => [x.matricula, Number(x.folgaFixa), !!x.folgaPendente]));
    const f = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe).find(x => String(x.matricula) === String(mat));
    // data impossível é recusada
    abrirEditorEquipe(true); await new Promise(z => setTimeout(z, 600));
    const c2 = document.querySelector('#equipeEditorRows .ed-admissao'); const volta = c2.value; c2.value = '31/02/2015';
    let msg = ''; const a = window.alert; window.alert = m => { msg = String(m); }; const t = window.showToast; window.showToast = m => { msg = msg || String(m); };
    try{ salvarEquipeEditor(); }finally{ window.alert = a; window.showToast = t; }
    const f2 = (window.todasEquipes && todasEquipes.length ? todasEquipes : equipe).find(x => String(x.matricula) === String(mat));
    return { mat, mostra, livre, mascara, salvo: f && f.admissao, volta, recusou: /não é válida/.test(msg), manteve: f2 && f2.admissao, mostraFolga, folgasIguais };
  });
  ok(!r.semCampo && r.livre && /^\d{2}\/\d{2}\/\d{4}$|^$/.test(r.mostra), `o campo aceita digitação e mostra dd/mm/aaaa (${r.mostra || 'vazio'})`);
  ok(r.mascara === '05/03/1998' && r.salvo === '1998-03-05', `digitando 05031998 vira 05/03/1998 e fica guardada (${r.salvo})`);
  ok(r.volta === '05/03/1998' && r.recusou && r.manteve === '1998-03-05', 'ao abrir de novo mostra 05/03/1998; 31/02/2015 é recusada e a data certa continua');
  if(nome !== 'Setores' || +path.basename(APP_SETORES).match(/V(\d+)\.html$/)[1] >= 251)   // V251: o editor do Setores mostrava Terça para todos (desde a V231)
    ok(r.mostraFolga && r.folgasIguais, `o editor mostra a folga fixa certa de cada pessoa (${r.mostraFolga}) e salvar sem mexer não troca nenhuma folga (${r.folgasIguais})`);
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
  const semMudar=await p.evaluate(()=>equipe.length===3 && equipe[0].folgaFixa===5 && equipe[1].folgaFixa===2 && equipe[2].folgaFixa===5);
  ok(semMudar,'o aviso não altera as folgas cadastradas');
  ok(!erros.length,'sem erro de JavaScript'+(erros.length?': '+erros[0]:''));
  await p.context().close();
}

/* V244 — o alerta só aparece quando mais da metade do horário folga; feriado fora; cartão enxuto depois dos números */
async function testarFolgasHorarioEnxuto(browser, app){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < 244) return;
  console.log('\n▶ Setores — alerta de folgas por horário enxuto (V244)');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + app); await p.waitForTimeout(1200);
  await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300);
  await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(1800);
  await p.evaluate(() => { v45GotoStep(5, false); document.getElementById('btnGerar').click(); }); await p.waitForTimeout(3500);
  const r = await p.evaluate(() => { const c = document.querySelector('#painelMes .v243-folgas-card'), cards = [...document.querySelectorAll('#painelMes .pm-card')];
    return { tem: !!c, pos: cards.indexOf(c), itens: document.querySelectorAll('#painelMes .v243-folgas-item').length, alt: c ? c.getBoundingClientRect().height : 0, fer: (window.v243FolgasHorario.auditar(ultimaEscala.ano, ultimaEscala.mes, ultimaEscala.bal) || []).some(a => a.pessoas.some(x => /feriado/.test(x.status))) }; });
  ok(r.tem && r.pos === 1, 'o cartão “Folgas por horário” vem logo depois dos números do mês');
  ok(!r.fer, 'a folga no feriado não entra na conta');
  ok(r.alt < 400, `com a escala normal da Frente de Loja o cartão fica curto (${r.itens} aviso(s), ${Math.round(r.alt)} px)`);
  const m = await p.evaluate(() => {
    const base = equipe.slice(0, 5).map((f, i) => ({ ...f, nome: 'T' + i, horario: '08:00 AS 16:20', folgaFixa: i < 2 ? 5 : 3, situacao: 'A' }));
    equipe = base; todasEquipes = base.map(f => ({ ...f })); trabalhoDomingo = {}; trabalhoFeriado = {}; folgasCompensatorias = {}; descansosDomingo = {};
    const a1 = v243FolgasHorario.auditar(2027, 9, balancoDoMes(2027, 9)).filter(a => a.data === '2027-10-01').length;   // 2 de 5 na sexta: não avisa
    equipe[2].folgaFixa = 5; const a2 = v243FolgasHorario.auditar(2027, 9, balancoDoMes(2027, 9)).find(a => a.data === '2027-10-01');   // 3 de 5: avisa
    return { a1, a2: a2 && { q: a2.quantidade, t: a2.total, ficam: a2.ficam } };
  });
  ok(m.a1 === 0 && m.a2 && m.a2.q === 3 && m.a2.t === 5 && m.a2.ficam === 2, `2 de 5 de folga não avisa; 3 de 5 avisa e diz que ficam 2 (${JSON.stringify(m)})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
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
  try{ await testarSetores(browser); await testarEncarregados(browser); if(/V(\d+)\.html$/.test(APP_ENC) && +APP_ENC.match(/V(\d+)\.html$/)[1] >= 167) await testarEncManual(browser); if(+APP_SETORES.match(/V(\d+)\.html$/)[1] >= 269) await testarSetoresAlternada(browser); await testarGabriel(browser, APP_SETORES, 'Setores', abrirSetoresFL, 270); await testarGabriel(browser, APP_ENC, 'Encarregados', abrirEnc15, 179); await testarApk(browser, APP_SETORES, 'Setores'); await testarApk(browser, APP_ENC, 'Encarregados'); await testarAdmissao(browser, APP_SETORES, 'Setores', 'setores_frente_de_loja_50.txt'); await testarTurnoEditor(browser, APP_SETORES); await testarCopiaLogo(browser, APP_SETORES); await testarEncAssistente(browser); await testarEncPrevia(browser); await testarAssistenteEstresse(browser, APP_SETORES, 'Setores', abrirSetoresFL); await testarAssistenteEstresse(browser, APP_ENC, 'Encarregados', abrirEnc15); await testarChatAssistente(browser, APP_SETORES, 'Setores', abrirSetoresFL); await testarChatAssistente(browser, APP_ENC, 'Encarregados', abrirEnc15); await testarHorarioDomingoAuto(browser, APP_SETORES); await testarHorarioPorFuncao(browser, APP_SETORES); await testarAssistenteTelaInicial(browser, APP_SETORES); await testarAssistenteRobusto(browser, APP_SETORES, 'Setores', async p => { await p.click('#comeceFechar').catch(() => {}); await p.click('[data-home-setor="Frente de Loja"]'); await p.waitForTimeout(400); await p.click('.is-abrir'); await p.waitForTimeout(300); await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'setores_frente_de_loja_50.txt')); await p.waitForTimeout(2500); }); await testarAssistenteRobusto(browser, APP_ENC, 'Encarregados', async p => { await p.click('.hero-cta').catch(() => {}); await p.waitForTimeout(300); await p.setInputFiles('#arquivoTxt', path.join(DADOS, 'encarregados_15_pares.txt')); await p.waitForTimeout(1800); }); await testarPorCargo(browser, APP_SETORES); await testarLiderTurno(browser, APP_SETORES); await testarAdmissao(browser, APP_ENC, 'Encarregados', 'encarregados_15_pares.txt'); await testarSemTxt(browser, APP_SETORES, 'Setores', 'setores_frente_de_loja_50.txt'); await testarFolgasMesmoHorario(browser, APP_SETORES); await testarFolgasHorarioEnxuto(browser, APP_SETORES); await testarSemTxt(browser, APP_ENC, 'Encarregados', 'encarregados_15_pares.txt');
       if(+APP_SETORES.match(/V(\d+)\.html$/)[1] >= 246) await testarBalancos(browser, APP_SETORES, 'Setores', 'v246', 'escalaSetores.v246Balancos');
       if(+APP_ENC.match(/V(\d+)\.html$/)[1] >= 175) await testarBalancos(browser, APP_ENC, 'Encarregados', 'v175', 'enc.v175Balancos'); }
  catch(e){ console.error('\n❌ O teste parou: ' + e.message); falhas++; }
  finally{ await browser.close(); }
  console.log(`\n${falhas ? '❌ ' + falhas + ' falha(s)' : '✅ Tudo certo'} — ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(falhas ? 1 : 0);
})();

async function testarSetoresAlternada(browser){   // V269: escala Manual FORA do par 2×1 — o Assistente pergunta “ciente e se responsabiliza?”
  console.log('\n▶ Setores — ✋ escala manual fora do 2×1 (ciente e se responsabiliza)');
  const { p, erros } = await novaPagina(browser);
  await p.goto('file://' + APP_SETORES); await p.waitForTimeout(1200); await abrirSetoresFL(p); await p.waitForTimeout(800);
  await p.evaluate(() => { window.v206IrParaManual(); selecaoManualDomingo = {}; const m = $('modoGeracao'); m.value = 'manual'; m.dispatchEvent(new Event('change', { bubbles: true })); renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(900);
  const info = await p.evaluate(() => { const ano = +$('ano').value, mes = +$('mes').value, bal = balancoDoMes(ano, mes), doms = domingosDoMes(ano, mes).filter(d => d !== bal), alvo = alvoCoberturaAtual(), folga = window.v258Folga?.() || 0;
    const livres = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]) && !ehLiderancaDomingo(equipe[i]) && Number(equipe[i].folgaFixa) !== 0 && !historicoManual(i).ultimo && !historicoManual(i).penultimo);
    return { doms, alvo, folga, livres }; });
  const [d0, d1, d2] = info.doms, alvo = info.alvo, minimo = Math.max(1, alvo - info.folga);
  ok(info.doms.length >= 3 && info.livres.length >= alvo * 2, `cenário: ${info.doms.length} domingos, meta ${alvo} por domingo, ${info.livres.length} pessoas livres`);
  const A = info.livres.slice(0, alvo), B = info.livres.slice(alvo, alvo * 2), ultimaB = B[B.length - 1];
  // domingo 1 completo com A; domingo 2 com OUTRAS pessoas (B), faltando só a última
  await p.evaluate(([d0, d1, A, B]) => { selecaoManualDomingo = {}; selecaoManualDomingo[d0] = A.slice(); selecaoManualDomingo[d1] = B.slice(0, B.length - 1); renderSelecaoDomingosGeracao(); }, [d0, d1, A, B]); await p.waitForTimeout(700);
  const antes = await p.evaluate(d => window.v269Alt.quebras().filter(x => x.d === d).length, d1);
  ok(antes === 0 && (await p.evaluate(() => !document.getElementById('v269Alt'))), 'domingos montados sem a mão do encarregado (como as sugestões do app) não perguntam nada');
  // 1) pela tela: a última pessoa de B completa o domingo → o Assistente pergunta
  await p.evaluate(d => document.querySelector(`#selecaoDomingosManual [data-geracao-dom="${d}"]`)?.scrollIntoView(), d1); await p.waitForTimeout(250);
  await p.click(`#selecaoDomingosManual input[data-dom="${d1}"][data-func="${ultimaB}"]`); await p.waitForTimeout(1200);
  const dlg = await p.evaluate(() => { const d = document.getElementById('v269Dlg'); return d ? { txt: d.innerText, foco: document.activeElement?.id } : null; });
  ok(!!dlg && /diferente da regra 2×1/.test(dlg.txt) && /ciente e se responsabiliza/.test(dlg.txt) && /3 domingos seguidos/.test(dlg.txt), `o Assistente abre a pergunta “Você está ciente e se responsabiliza?” (${antes} apontadas antes de fechar o domingo)`);
  ok(dlg && dlg.foco === 'v269Nao', 'o foco começa no “Não, quero voltar” (o jeito seguro)');
  ok(await p.evaluate(([d, A]) => window.v269Alt.quebras().filter(x => x.d === d).length >= A.length && A.every(i => window.v269Alt.quebras().some(x => x.d === d && x.i === i)), [d1, A]), 'todas as pessoas do domingo 1 que ficaram de fora do domingo 2 são apontadas');
  ok(await p.evaluate(() => !(window.v227Auditar?.() || { r: [] }).r.some(t => /3 domingos consecutivos/.test(t))), 'ficar fora do par NÃO é erro 🔴 (nenhum aviso de 3 domingos seguidos)');
  // 2) “Não” desfaz a marcação
  await p.click('#v269Nao'); await p.waitForTimeout(700);
  ok(!(await p.evaluate(d => selecaoManualDomingo[d], d1)).map(Number).includes(ultimaB) && !(await p.$('#v269Dlg')) && (await p.evaluate(() => window.v269Alt.pendentes().length)) === 0, '“Não”: a pessoa marcada volta, a janela fecha e nada fica assumido');
  // 3) Esc também é “não”; “Sim” mantém
  await p.click(`#selecaoDomingosManual input[data-dom="${d1}"][data-func="${ultimaB}"]`); await p.waitForTimeout(1200);
  ok(!!(await p.$('#v269Dlg')), 'marcar de novo abre a pergunta de novo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  ok(!(await p.evaluate(d => selecaoManualDomingo[d], d1)).map(Number).includes(ultimaB), 'Esc também vale como “Não”');
  await p.click(`#selecaoDomingosManual input[data-dom="${d1}"][data-func="${ultimaB}"]`); await p.waitForTimeout(1200);
  await p.click('#v269Sim'); await p.waitForTimeout(800);
  const sim = await p.evaluate(d => ({ marcado: selecaoManualDomingo[d].length, pend: window.v269Alt.pendentes().length, caixa: document.getElementById('v269Alt')?.innerText || '' }), d1);
  ok(sim.marcado === B.length && sim.pend === 0 && /fora do 2×1, com a sua responsabilidade/.test(sim.caixa), `“Sim”: a marcação fica e o quadro 🟠 mostra a responsabilidade (“${sim.caixa.slice(0, 70).replace(/\n/g, ' ')}…”)`);
  // 4) Gerar: barrado sem resposta; liberado (não barrado por ESTA regra) com resposta
  await p.evaluate(() => document.querySelector('#v269Alt [data-v269="desfazer"]').click()); await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.v269Alt.pendentes().length > 0), 'sem resposta, a pergunta volta a ficar pendente');
  await p.evaluate(() => document.getElementById('btnGerar').click()); await p.waitForTimeout(1200);
  const gate = await p.evaluate(() => ({ v: document.getElementById('validacao').innerText, dlg: !!document.getElementById('v269Dlg'), gerou: Object.values(trabalhoDomingo || {}).some(a => a && a.length) }));
  ok(/Ainda não dá para gerar/.test(gate.v) && /diferente da regra 2×1/.test(gate.v) && gate.dlg && !gate.gerou, 'sem a resposta, o 🚀 Gerar não gera e abre a pergunta');
  await p.click('#v269Sim'); await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById('btnGerar').click()); await p.waitForTimeout(1800);
  ok(await p.evaluate(() => !/diferente da regra 2×1/.test(document.getElementById('validacao').innerText) && !document.getElementById('v269Dlg')), 'com a resposta “sim”, o Gerar não é mais barrado por esta regra (as outras regras continuam valendo)');
  // 5) 3 domingos seguidos continua proibido (auditoria ao vivo desfaz a marcação)
  const tres = await p.evaluate(([d0, d1, d2, i]) => { selecaoManualDomingo[d0] = [...new Set([...(selecaoManualDomingo[d0] || []), i])]; selecaoManualDomingo[d1] = [...new Set([...(selecaoManualDomingo[d1] || []), i])]; selecaoManualDomingo[d2] = (selecaoManualDomingo[d2] || []).filter(x => x !== i); renderSelecaoDomingosGeracao(); return true; }, [d0, d1, d2, A[0]]);
  await p.waitForTimeout(700);
  await p.evaluate(d => document.querySelector(`#selecaoDomingosManual [data-geracao-dom="${d}"]`)?.scrollIntoView(), d2); await p.waitForTimeout(250);
  const cb = await p.$(`#selecaoDomingosManual input[data-dom="${d2}"][data-func="${A[0]}"]`);
  if(cb){ await cb.click({ force: true }).catch(() => {}); await p.waitForTimeout(1400); }
  ok(tres && !(await p.evaluate(([d, i]) => (selecaoManualDomingo[d] || []).map(Number).includes(i), [d2, A[0]])), '3 domingos seguidos continua proibido: marcar a mesma pessoa no 3º domingo é recusado');
  await p.evaluate(() => { const o = document.getElementById('v269Dlg'); o?.remove(); });
  // 6) histórico e recarregar
  await p.evaluate(([d0, d1, A, B]) => { selecaoManualDomingo = {}; selecaoManualDomingo[d0] = A.slice(); selecaoManualDomingo[d1] = B.slice(); renderSelecaoDomingosGeracao(); window.v269Alt.pendentes().forEach(x => window.v269Alt.responder(x.d, true, [])); }, [d0, d1, A, B]); await p.waitForTimeout(1500);
  const hist = await p.evaluate(() => ({ arr: estadoFinalMes?.v269Alt, ls: localStorage.getItem('escalaSetores.v269Alt') }));
  ok(Array.isArray(hist.arr) && hist.arr.length > 0 && hist.arr.every(a => a.key && a.mes && a.nome && a.quando) && !!hist.ls, `o histórico do mês leva as respostas (estadoFinalMes.v269Alt: ${hist.arr?.length})`);
  const salvo = await p.evaluate(() => JSON.parse(localStorage.getItem('escalaSetores.v269Alt')));
  await p.evaluate(() => { localStorage.removeItem('escalaSetores.v269Alt'); });
  await p.evaluate(h => { const e = window.v269Alt.estado(); Object.keys(e).forEach(k => delete e[k]); estadoFinalMes = estadoFinalMes || {}; estadoFinalMes.v269Alt = h.map(x => ({ ...x, quando: '2026-10-01T10:00:00.000Z' })); }, hist.arr); await p.evaluate(() => window.v269Alt.sincronizar()); await p.waitForTimeout(300);   // aparelho limpo abrindo o arquivo de histórico (o app também sincroniza sozinho a cada segundo)
  ok(await p.evaluate(([d1]) => window.v269Alt.quebras().some(x => x.d === d1) && window.v269Alt.pendentes().length === 0, [d1]), 'abrir o histórico restaura as respostas (nada volta a ficar pendente)');
  await p.evaluate(() => { estadoFinalMes.v269Alt = [{ key: 'x'.repeat(200), mes: 'a' }, null, { key: 5 }, { key: '7|ok', mes: 'lixo|2099-1', nome: 'Fulano' }]; window.v269Alt.sincronizar(); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => Object.keys(window.v269Alt.estado()['lixo|2099-1'] || {}).join() === '7|ok' && !Object.values(window.v269Alt.estado()).some(m => Object.keys(m).some(k => k.length > 60))), 'lixo no campo do histórico é ignorado sem erro');
  // 7) fora do modo Manual não aparece nada
  await p.evaluate(() => { const m = $('modoGeracao'); m.value = 'motor'; m.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(1300);
  ok(await p.evaluate(() => window.v269Alt.quebras().length === 0 && !document.getElementById('v269Alt')), 'no modo Automático a regra não se aplica (nada é perguntado)');
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}

/* V270/V179 — 🤖 Gabriel: nome, saudação sem duplicar, PNL (abreviações, erros, contexto, dúvida) e datas */
async function testarGabriel(browser, app, nome, abrir, versaoMin){
  if(+path.basename(app).match(/V(\d+)\.html$/)[1] < versaoMin) return;
  console.log(`\n▶ ${nome} — 🤖 Gabriel (nome, saudação, conversa e datas)`);
  const enc = nome !== 'Setores', SAUD = 'Olá! Eu sou o Gabriel, seu assistente virtual de RH. Como posso ajudar hoje?';
  const { p, erros } = await novaPagina(browser);
  let rede = 0; p.on('request', r => { if(!/^file:|^data:|^blob:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) rede++; });   // (as fontes do Google já faziam parte do app)
  await p.goto('file://' + app); await p.waitForTimeout(2200);
  // 1) saudação automática ao abrir (sem o usuário escrever nada) e sem duplicar
  const b1 = await p.evaluate(() => ({ n: document.querySelectorAll('#v270Balao').length, txt: document.getElementById('v270Balao')?.innerText || '', botao: !!document.getElementById('v262Botao') }));
  ok(b1.n === 1 && b1.txt.includes(SAUD) && b1.botao, `ao abrir o app o Gabriel se apresenta sozinho, uma vez só: “${b1.txt.replace(/\n/g, ' ').slice(0, 80)}…”`);
  await p.evaluate(() => { for(const t of ['visibilitychange', 'focus', 'online']) window.dispatchEvent(new Event(t)); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.querySelectorAll('#v270Balao').length) === 1, 'voltar à página / trocar de aba não cria outro balão');
  await p.evaluate(() => document.querySelector('#v270Balao .x').click()); await p.waitForTimeout(200);
  await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.querySelectorAll('#v270Balao').length) === 0, 'depois de fechar o balão, voltar à página não o abre de novo');
  await abrir(p); await p.waitForTimeout(1200);
  const chat = async () => p.evaluate(async () => { const w = ms => new Promise(o => setTimeout(o, ms)); window.v265Chat.abrirChat(); await w(300);
    const m = [...document.querySelectorAll('#v265Msgs .v265-msg')]; return { saud: document.querySelectorAll('#v265Msgs .v270-saudacao').length, primeiro: m[0]?.classList.contains('v270-saudacao'), txt: m[0]?.innerText || '', n: m.length }; });
  let c1 = await chat();
  ok(c1.saud === 1 && c1.primeiro && c1.txt === SAUD, 'a 1ª mensagem do chat é a saudação do Gabriel, sem ninguém escrever');
  const c2 = await p.evaluate(async () => { const w = ms => new Promise(o => setTimeout(o, ms)); const f = document.querySelector('.v265-form'), i = document.getElementById('v265Txt');
    for(const q of ['oi', 'o que falta?', 'qual é o seu nome?']){ i.value = q; f.requestSubmit(); await w(150); }
    document.querySelector('.v265-abas [data-aba="dicas"]').click(); await w(100); document.querySelector('.v265-abas [data-aba="chat"]').click(); await w(200);
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await w(200);
    const m = [...document.querySelectorAll('#v265Msgs .v265-msg')]; return { saud: document.querySelectorAll('#v265Msgs .v270-saudacao').length, n: m.length, ult: m[m.length - 1].classList.contains('bot') }; });
  ok(c2.saud === 1 && c2.n === 1 + 6 && c2.ult, `depois de conversar e trocar de aba, a saudação continua uma só (${c2.saud}) e a conversa tem as 6 mensagens (${c2.n - 1})`);
  await p.reload(); await p.waitForTimeout(2200);
  ok(await p.evaluate(() => document.querySelectorAll('#v270Balao').length) === 1, 'ao recarregar o app o Gabriel se apresenta de novo (uma vez)');
  await abrir(p); await p.waitForTimeout(1200); c1 = await chat();
  ok(c1.saud === 1 && c1.n <= 2 && !(await p.$('#v265Msgs .v265-msg.eu')), 'depois de recarregar o chat começa com uma única saudação (e nenhuma pergunta antiga)');
  ok(await p.evaluate(() => document.querySelectorAll('#v270Balao').length) === 0, 'com o painel do Gabriel aberto (por qualquer caminho) o balão sai da frente');

  // 2) identidade e capacidades
  const R = await p.evaluate(({ enc }) => { const C = window.v265Chat, t = h => String(h).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ''), out = {};
    const nomes = ['qual é o seu nome?', 'Como você se chama?', 'quem é você?', 'quem é vc', 'qual seu nome', 'qaul é seu nmoe?', 'como vc se chama', 'Se apresente'];
    out.nomes = nomes.map(q => [q, /Gabriel/.test(t(C.responder(q)))]);
    out.meu = /Meu nome é Gabriel/.test(t(C.responder('qual é o meu nome?')));
    const faz = t(C.responder('o que você sabe fazer?')); out.faz = faz; out.faz2 = /Gabriel/.test(t(C.responder('no que você pode me ajudar?')));
    out.malu = nomes.concat(['o que você sabe fazer?']).some(q => /MaLu/i.test(t(C.responder(q))));
    out.sabe = t(C.responder('você sabe quem trabalha no domingo?')); return out; }, { enc });
  ok(R.nomes.every(x => x[1]), 'responde que se chama Gabriel (com abreviações e erros de digitação): ' + R.nomes.filter(x => !x[1]).map(x => x[0]).join('; '));
  ok(!R.meu && !R.malu, '“qual é o MEU nome?” não é a pergunta sobre o Gabriel, e o nome MaLu não aparece');
  ok(/o que eu sei fazer/i.test(R.faz) && R.faz2 && !/auditoria|machine learning|treinad|aprendizado de máquina|planilha inteira/i.test(R.faz), 'a lista “o que você sabe fazer?” só cita o que existe de verdade');
  ok(!/o que eu sei fazer/i.test(R.sabe), '“você sabe quem trabalha no domingo?” continua sendo pergunta da escala, não da lista de capacidades');

  // 3) montar um cenário (domingos escalados) e datas pelo relógio do aparelho
  const cen = await p.evaluate(({ enc }) => { const A = +$('ano').value, M = +$('mes').value; const uniq = {}; equipe.forEach(f => { const k = f.nome.split(' ')[0]; uniq[k] = (uniq[k] || 0) + 1; });
    const livres = equipe.map((f, i) => i).filter(i => !foraDom(equipe[i]) && uniq[equipe[i].nome.split(' ')[0]] === 1 && (enc || !ehLiderancaDomingo(equipe[i])));
    return { A, M, livres, total: equipe.length }; }, { enc });
  ok(cen.livres.length >= 6, `cenário: ${cen.total} pessoas, ${cen.livres.length} com primeiro nome único`);
  const escalar = (d, ids) => p.evaluate(({ d, ids, enc }) => { if(enc){ window.v167.definirModo('manual'); const sel = window.v167.sel()[d] || []; sel.slice().forEach(i => window.v167.desmarcar(i, d));
      const pool = equipe.map((f, i) => i); for(const t of ['enc', 'sub', null]){ for(const i of pool){ const S = window.v167.sel()[d] || []; if(S.length >= 3) break; if(S.includes(i) || (t && equipe[i].tipo !== t)) continue; if(window.v167.marcar(i, d, true)) break; } }
      return window.v167.sel()[d].slice(); }
    const s = $('modoGeracao'); s.value = 'manual'; s.dispatchEvent(new Event('change', { bubbles: true })); selecaoManualDomingo[String(d)] = ids.slice(); return ids.slice(); }, { d, ids, enc });
  const relogio = (y, m, d, h = 14, mi = 35) => p.evaluate(([y, m, d, h, mi]) => { window.v270Gabriel.relogio = () => new Date(y, m, d, h, mi, 0); }, [y, m, d, h, mi]);
  const perg = qs => p.evaluate(qs => { const C = window.v265Chat, t = h => String(h).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ''); return qs.map(q => t(C.responder(q))); }, qs);
  // hoje = quinta 15/10/2026; escala aberta = outro mês
  await relogio(2026, 9, 15);
  let r = await perg(['Que dia é hoje?', 'data de hoje', 'hoje é que dia?', 'qual a data de hoje', 'que dia é hj', 'que dia da semana é hoje?', 'que horas são?', 'Que dia é hoje, segundo o app, no mês da escala?']);
  ok(r.slice(0, 6).every(x => /quinta-feira, 15 de outubro de 2026/.test(x)), 'Que dia é hoje? (e variações) usa a data do aparelho: ' + r[0].slice(0, 70));
  ok(/14:35/.test(r[6]), 'Que horas são? usa a hora do aparelho: ' + r[6]);
  await mudarMes(p, 9, 2026); await p.waitForTimeout(600); r = await perg(['que dia é hoje?']);
  ok(/deste mês/.test(r[0]), 'com a escala aberta no mês de hoje, o Gabriel diz que é deste mês');
  await mudarMes(p, 10, 2026); await p.waitForTimeout(600); r = await perg(['que dia é hoje?']);
  ok(/15 de outubro de 2026/.test(r[0]) && /não é o mês de hoje/.test(r[0]) && /novembro de 2026/.test(r[0]), 'com a escala aberta em outro mês, não confunde a data de hoje com o mês da escala');
  // último domingo DENTRO da escala aberta (hoje = quarta 18/11/2026 → domingo 15/11)
  const ids = cen.livres.slice(0, 3);
  const quem = await escalar(15, ids);
  await relogio(2026, 10, 18);
  const nm = i => p.evaluate(i => equipe[i].nome.split(' ')[0], i);
  const nomesQ = await Promise.all(quem.map(nm));
  r = await perg(['Quem está escalado no último domingo?', 'Quem trabalhou no último domingo?', 'Quem folgou no último domingo?', 'qm esta escalado no ult dom', 'quem folgou no ultimo domigo?']);
  const todosAtivos = await p.evaluate(() => equipe.filter(f => String(f.situacao || 'A').trim().toUpperCase() === 'A').length);
  ok(nomesQ.every(x => r[0].includes(x)) && /Escalados/.test(r[0]) && /planejado/.test(r[0]) && /15\/11\/2026/.test(r[0]), 'ESCALADOS no último domingo: lista quem está na escala e diz que é o planejado (' + r[0].slice(0, 90) + '…)');
  ok(/não tenho registro de presença/i.test(r[1]) && nomesQ.every(x => r[1].includes(x)), 'TRABALHOU: avisa que o app não tem ponto/presença e só mostra o planejado');
  const fol = r[2].match(/\((\d+)\):/);
  ok(/não estavam escalados/.test(r[2]) && fol && +fol[1] === todosAtivos - quem.length && !nomesQ.some(x => new RegExp('(^|[ ,])' + x + '([ ,.]|$)').test(r[2].split('Fonte')[0].split('escalados')[1] || '')), `FOLGOU: lista quem NÃO estava escalado (${fol && fol[1]} = ${todosAtivos} - ${quem.length})`);
  ok(r[0] !== r[1] && r[1] !== r[2] && r[0] !== r[2], 'as 3 perguntas sobre o último domingo têm respostas diferentes');
  ok(/Escalados/.test(r[3]) && /não estavam escalados/.test(r[4]), 'abreviações e erro de digitação (“qm”, “ult dom”, “domigo”) são entendidos');
  ok(/Hoje \(aparelho\)/.test(r[0]) && /mais recente que já passou/.test(r[0]), 'a resposta mostra de onde veio a data (hoje, pelo aparelho) e como “último domingo” foi entendido');
  // hoje é domingo
  await relogio(2026, 10, 15);
  r = await perg(['quem estava escalado no último domingo?', 'quem trabalha hoje?']);
  ok(/08\/11\/2026/.test(r[0]) && /Hoje é domingo/.test(r[0]), 'se hoje é domingo, “último domingo” é o anterior (08/11) e o Gabriel avisa');
  ok(nomesQ.every(x => r[1].includes(x)) && /15\/11\/2026/.test(r[1]), '“quem trabalha hoje?” num domingo mostra a escala de hoje');
  await relogio(2026, 10, 18); r = await perg(['quem trabalha hoje?']);
  ok(/não é domingo/.test(r[0]), '“quem trabalha hoje?” fora do domingo explica que hoje não é domingo');
  // último domingo = último do mês passado (passo 2)
  await mudarMes(p, 11, 2026); await p.waitForTimeout(800);
  const hist = await p.evaluate(ids => { const dsNov = domingosDoMes(2026, 10), ult = dsNov[dsNov.length - 1]; ids.forEach(i => { const c = document.getElementById('hist_ult_' + i); if(c){ c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } }); return { ult, ok: ids.every(i => historicoManual(i).ultimo) }; }, quem);
  await relogio(2026, 11, 2); r = await perg(['quem trabalhou no último domingo?', 'quem está escalado no último domingo?']);
  ok(hist.ok && nomesQ.every(x => r[0].includes(x)) && /passo 2/.test(r[0]) && new RegExp(String(hist.ult) + '/11/2026').test(r[0]) && /não tenho registro de presença/i.test(r[0]), 'último domingo do mês passado: usa o passo 2 (Mês passado) e continua avisando que não é registro de ponto');
  // fora do período
  await relogio(2027, 2, 10); r = await perg(['quem está escalado no último domingo?', 'quem folgou no último domingo?']);
  ok(r.every(x => /Não tenho a escala do domingo 07\/03\/2027/.test(x) && /não invento dados/.test(x)) && !nomesQ.some(x => r[0].includes(x)), 'domingo fora do que o app guarda: diz a limitação e não inventa ninguém');
  // "último domingo do mês" continua sendo a pergunta antiga da escala aberta
  await mudarMes(p, 10, 2026); await p.waitForTimeout(600); await relogio(2026, 10, 18);
  r = await perg(['quem trabalha no último domingo do mês?']);
  ok(!/mais recente que já passou/.test(r[0]), '“último domingo do mês” não é confundido com “último domingo passado”');

  // 4) conversa: abreviações, erros de digitação, contexto e dúvida
  const alvo = await p.evaluate(ids => { const i = ids[0]; return { i, pn: equipe[i].nome.split(' ')[0], nome: equipe[i].nome }; }, cen.livres.slice(3, 4));
  const outro = await p.evaluate(i => ({ i, pn: equipe[i].nome.split(' ')[0] }), cen.livres[4]);
  const limpo = x => x.replace(/^Entendi: “[^”]*”\.\s*/, '');
  r = await perg([`por que ${alvo.pn} não pode no domingo 8?`, `pq ${alvo.pn} nao pode no domigo 8`, `por que ${alvo.pn} não pode no domingo 8`.toUpperCase(), `quantos domingos ${alvo.pn} fez?`, `qnts dom ${alvo.pn} fez`]);
  ok(limpo(r[0]) === limpo(r[1]) && limpo(r[0]) === limpo(r[2]) && r[0].includes('08/11'), 'abreviações e erro de digitação dão a MESMA resposta da pergunta escrita certa');
  ok(/Entendi/.test(r[1]) && !/Entendi/.test(r[0]), 'quando corrige uma palavra, o Gabriel mostra como entendeu');
  ok(limpo(r[3]) === limpo(r[4]), '“qnts dom … fez” = “quantos domingos … fez”');
  // contexto
  const ctxR = await perg([`por que ${alvo.pn} não pode no domingo 8?`, 'e no domingo 15?', `e ${outro.pn}?`, 'quantos domingos ela fez?']);
  ok(ctxR[1].includes(alvo.nome) && /15\/11/.test(ctxR[1]) && !/08\/11/.test(ctxR[1]), '“e no domingo 15?” continua a pergunta anterior sobre a mesma pessoa');
  ok(ctxR[2].includes(await p.evaluate(i => equipe[i].nome, outro.i)), '“e a <outra pessoa>?” repete a pergunta para a outra pessoa');
  ok(ctxR[3].includes(await p.evaluate(i => equipe[i].nome, outro.i)) && /domingo\(s\)/.test(ctxR[3]), '“quantos domingos ela fez?” usa a última pessoa da conversa');
  r = await perg(['e no domingo 15?']); ok(true, 'continuação sem contexto não quebra');
  await p.evaluate(() => window.v270Gabriel.reset());
  r = await perg(['e no domingo 15?', 'quantos domingos ela fez?']);
  ok(!r[0].includes(alvo.nome) && !r[1].includes(alvo.nome), 'sem contexto (conversa nova) o Gabriel não inventa de quem é a continuação');
  // erro de digitação no nome → pergunta antes
  const typo = alvo.pn.length > 3 ? alvo.pn.slice(0, 1) + alvo.pn.slice(2, 3) + alvo.pn.slice(1, 2) + alvo.pn.slice(3) : alvo.pn + 'x';
  r = await perg([`quantos domingos ${typo} fez?`]);
  ok(/Você quis dizer/.test(r[0]) && r[0].toLowerCase().includes(alvo.nome.toLowerCase()) && !/domingo\(s\) em/.test(r[0]), `nome parecido (“${typo}”): o Gabriel PERGUNTA em vez de chutar`);
  r = await perg(['sim']);
  ok(r[0].includes(alvo.nome) && /domingo\(s\) em/.test(r[0]), 'responder “sim” confirma e a pergunta é respondida para a pessoa certa');
  await perg([`quantos domingos ${typo} fez?`]); r = await perg(['não']);
  ok(/Escreva o nome como está/.test(r[0]), 'responder “não” pede o nome certo e não responde nada errado');
  // nomes repetidos
  const dup = await p.evaluate(() => { const c = {}; equipe.forEach((f, i) => { const k = f.nome.split(' ')[0]; (c[k] = c[k] || []).push(i); }); const k = Object.keys(c).find(x => c[x].length >= 2);
    if(k) return { k, ids: c[k].slice(0, 2), fake: false }; const [a, b] = [equipe[0], equipe[1]]; const o = [a.nome, b.nome]; const sob = (a.nome.split(' ')[1] || 'SILVA'); a.nome = 'REPETIDA ' + sob; b.nome = 'REPETIDA ' + sob + 'ZZ'; window.__nomesOrig = o; return { k: 'REPETIDA', ids: [0, 1], fake: true }; });
  r = await perg([`quantos domingos a ${dup.k} fez?`]);
  ok(/mais de uma pessoa/.test(r[0]) && /1/.test(r[0]) && /2/.test(r[0]), 'nome repetido: o Gabriel lista as opções numeradas em vez de escolher uma');
  const nomes2 = await p.evaluate(ids => ids.map(i => equipe[i].nome), dup.ids);
  r = await perg(['2']);
  ok(r[0].includes(nomes2[1]) && /domingo\(s\) em/.test(r[0]), 'responder “2” escolhe a 2ª pessoa e a pergunta original é respondida');
  await perg([`quantos domingos a ${dup.k} fez?`]); r = await perg([nomes2[0].split(' ').slice(1).join(' ').toLowerCase()]);
  ok(r[0].includes(nomes2[0]) || /Você quis|mais de uma/.test(r[0]), 'responder com o sobrenome escolhe a pessoa (ou volta a perguntar, nunca chuta)');
  if(dup.fake) await p.evaluate(() => { equipe[0].nome = window.__nomesOrig[0]; equipe[1].nome = window.__nomesOrig[1]; });

  // 5) robustez e segurança
  const rob = await p.evaluate(() => { const C = window.v265Chat, out = { erros: [], tipos: true }; const f = typeof fetch === 'function'; const antes = JSON.stringify([typeof selecaoManualDomingo === 'undefined' ? null : selecaoManualDomingo, trabalhoDomingo, equipe.map(x => [x.nome, x.folgaFixa]), window.v167 ? window.v167.sel() : null]);
    const lixo = ['', '   ', null, undefined, 123, {}, [], 'a'.repeat(5000), '<img src=x onerror=alert(1)>', '😀😀😀', 'quem '.repeat(500), '\u0000‮', "'; DROP TABLE x;--", '%s%d%n', 'constructor', '__proto__', 'toString', 'hasOwnProperty', '1e999', '((((', '\\', 'e e e e e e e e', 'ele ela dele', '99999999999999999999'];
    lixo.forEach((q, k) => { try{ const r = C.responder(q); if(typeof r !== 'string') out.tipos = false; if(/<img|<script/i.test(r)) out.erros.push('html solto #' + k); }catch(e){ out.erros.push('#' + k + ' ' + e.message); } });
    const t0 = performance.now(); for(let k = 0; k < 150; k++) C.responder(['quem trabalha no domingo 8?', 'pq nao pode', 'qnts dom fez', 'que dia é hoje?', 'quem folgou no último domingo?', 'xpto qwerty asdf ghjk'][k % 6]); out.ms = Math.round(performance.now() - t0);
    const depois = JSON.stringify([typeof selecaoManualDomingo === 'undefined' ? null : selecaoManualDomingo, trabalhoDomingo, equipe.map(x => [x.nome, x.folgaFixa]), window.v167 ? window.v167.sel() : null]); out.igual = antes === depois;
    const n0 = String.prototype.normalize; String.prototype.normalize = function(){ throw new Error('quebrou'); }; try{ out.queda = typeof C.responder('oi') === 'string'; }catch(e){ out.queda = false; } finally{ String.prototype.normalize = n0; }
    return out; });
  ok(!rob.erros.length && rob.tipos, 'entradas estranhas (vazio, null, objeto, 5000 letras, HTML, emoji, constructor/__proto__…) nunca dão erro e sempre voltam texto' + (rob.erros.length ? ': ' + rob.erros.join(', ') : ''));
  ok(rob.ms < 3000, `150 perguntas seguidas em ${rob.ms} ms`);
  ok(rob.igual, 'conversar com o Gabriel não muda a escala, a equipe nem as marcações (só leitura)');
  ok(rob.queda, 'se algo falhar por dentro, o chat ainda devolve uma resposta (nada de erro na tela)');
  ok(rede === 0, `o Gabriel não usa a internet (pedidos de rede: ${rede})`);
  ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
  await p.close();
}
