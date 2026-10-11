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
    await p.evaluate(() => { window.v206IrParaManual(); selecaoManualDomingo = {}; renderSelecaoDomingosGeracao(); }); await p.waitForTimeout(900);
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
        destinoDisponivel:!!d && d.situacao === 'A' && d.aptoDomingo === true,
        destinoContaAumentada:destino.filter(x=>String(x.situacao||'A').toUpperCase()!=='EP').length===antesDestino+1,
        matriculaUnica:todasEquipes.filter(x=>String(x.matricula)===mat).length===1,
        equipeTxtPersiste:txt.includes('AptidaoDomingo;SetorEmprestimo')&&linhaTxt.endsWith(';Padaria'),
        historicoPersiste:projeto?.equipe?.todas?.find(x=>String(x.matricula)===mat)?.setorEmprestimo==='Padaria'};
      todasEquipes.splice(0,todasEquipes.length,...backup);
      return result;
    });
    ok(r.origemEP && r.origemBloqueada && r.origemContaReduzida && r.destinoDisponivel && r.destinoContaAumentada && r.matriculaUnica && r.equipeTxtPersiste && r.historicoPersiste,
      'V231: empréstimo bloqueia origem, libera destino, ajusta contagens, mantém matrícula única e persiste destino no TXT/histórico ('+JSON.stringify(r)+')');
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
  try{ await testarSetores(browser); await testarEncarregados(browser); }
  catch(e){ console.error('\n❌ O teste parou: ' + e.message); falhas++; }
  finally{ await browser.close(); }
  console.log(`\n${falhas ? '❌ ' + falhas + ' falha(s)' : '✅ Tudo certo'} — ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(falhas ? 1 : 0);
})();
