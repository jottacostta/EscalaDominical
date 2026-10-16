# Passagem de bastão — o que foi feito e como continuar

Este arquivo existe para que **Claude e ChatGPT continuem o trabalho um do outro** sem precisar perguntar nada.
**Leia este arquivo inteiro antes de começar** e **atualize-o em toda mudança** (regra da seção 10 do [`AGENTS.md`](../AGENTS.md)).

Como atualizar (toda mudança, inclusive só de documentação):
1. Atualize a seção **1. Estado atual** (versões, PRs/branches abertos).
2. Acrescente uma entrada **no topo** da seção **5. Diário**, no modelo que está lá, assinada (`— Claude` ou `— ChatGPT`).
3. Se resolveu ou criou uma pendência, atualize a seção **6. Pendências**.
4. Se descobriu uma armadilha (algo que quebrou e por quê), acrescente na seção **4**.

O teste automático (`testes/rodar.js`) confere se este arquivo cita a versão atual de cada app: se esquecer de atualizar, o teste falha.

---

## 1. Estado atual

| App | Versão atual (arquivo na raiz) | Link fixo |
|---|---|---|
| Escala de Setores | `Escala_de_Setores_V274.html` | `setores/index.html` (cópia idêntica) |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_V182.html` | `encarregados/index.html` (cópia idêntica) |

- **Testes no GitHub:** `.github/workflows/testes.yml` roda a suíte rápida e a do ano inteiro em todo PR, push no `main` e nos branches `chatgpt/**`. O resultado aparece na aba **Checks** do PR.
- **Hierarquia (pedido do dono, 14/10/2026 — topo do `AGENTS.md`):** o dono é o **gerente**, o Claude é o **encarregado** e o ChatGPT é o **subencarregado**. Nada por iniciativa própria sem autorização do gerente.
- **PRs e branches:** consulte o GitHub para saber o estado atual; não mantenha uma contagem manual de PRs abertas, pois ela fica desatualizada quando uma PR é criada, fechada ou incorporada. Já incorporadas ao `main`: #54 (Setores V262 + Encarregados V176, Assistente RH), #56 (AGENTS.md: hierarquia e seção 2.1), #59 (Setores V263 + Encarregados V177), #62 (Setores V264 + testes ARH-16 a ARH-24), #63 (Setores V265 + Encarregados V178) e #64 (Setores V266/V267). A #55 do ChatGPT (guia REA) foi fechada sem merge: as ideias viraram a seção 2.1 do `AGENTS.md`.
- **Conversa nova?** Comece por [`docs/INICIO_NOVA_CONVERSA.txt`](INICIO_NOVA_CONVERSA.txt): regras de continuidade e a mensagem para colar.
- **Branches antigos do ChatGPT** (todos já incorporados ao `main` ou com PR fechado): `chatgpt/teste-integracao`, `chatgpt/propostas-*`, `chatgpt/setores-filtro-escala-manual`, `chatgpt/setores-v231-…`, `chatgpt/setores-v232-…`, `chatgpt/sugestoes-escala-manual` e os dois `chatgpt/setores-v233-…`. **Não use nenhum deles.** O Claude não consegue apagar branches deste ambiente; o dono pode apagá-los no GitHub (aba **Branches** → 🗑️).
- **Próximo número de versão:** Setores **V275**, Encarregados **V183**.
- **Manuais de uso (Claude Docs, atualizados pelo Claude — decisão do dono em 12/10/2026):**
  - Manual do Encarregado (V171): https://claude.ai/code/artifact/29a1157b-f657-465e-ae85-2eb06a58c726
  - Manual da Escala de Setores (V246): https://claude.ai/code/artifact/9ed54c8f-d381-4733-a6f4-220f6282f197
  - Roteiro do Beta (Encarregados V171): https://claude.ai/code/artifact/ef9b9858-da19-4cbc-a0cc-663115b007e9
  - Mudou tela, passo ou nome de botão? Avise no PR que o manual precisa de print/texto novo. Prints sempre com os dados FICTÍCIOS de `testes/dados`.
- **APK:** o dono transforma o link em APK com o **ApkForja** (app HTML dele, “modo site”). Veja a armadilha “Downloads dentro do APK” na seção 4.

---

## 2. Mapa técnico — Escala de Setores (`Escala_de_Setores_Vnnn.html`, ~12,7 mil linhas)

### Camadas documentadas até V274
- **Assistente RH (V263/V264):** `juntar()` valida com `numOk`, `ymOk`, `horOk` e `objOk`. O salvamento usa `pend`; `gravarJa` roda em `pagehide` e `visibilitychange`. A `horOk` da V264 aceita hora 00–23 e minuto 00–59.
- **Prévia V263:** `renderPreviaFolgasFeriado` usa `domPv`/`abertoPv`.
- **Chat V265:** bloco “PERGUNTE AO ASSISTENTE RH”; API `window.v265Chat = {responder, perguntar, abrirChat}`. As diferenças ficam em `AP`; “por que não pode” usa `v234Sugestoes.auditoriaCandidato`. Para ampliar respostas, acrescente itens em `RESP`.
- **Confirmação V266:** `window.v266Horarios = {precisa, confirmado, confirmar, pendentes, render}`. A troca grava em `horariosGeradosDomingo` e `estadoFinalMes`; confirmação em `estadoFinalMes.v266Confirmado` guarda assinatura do setor, mês e pessoas escaladas. A trava de Excel/Histórico captura clique no `document`.
- **Horário por função V267:** `coberturaFuncao.hor = {chave:[{h,n}]}`; `salvarCfgFuncao`/`carregarCfgFuncao` têm `// V267`. Há embrulhos de `metasFuncaoUsuario` e `atribuirHorariosAutomaticosDomingo`; API `window.v267HorFuncao = {lista, definir, slots}`. `restaurarProjeto` restaura `window.horariosGeradosDomingo` de `estadoFinalMes`.
- **V269 — confirmação na escala manual fora do par 2×1:** `window.v269Alt = {quebras, pendentes, responder, perguntar, sincronizar, estado, maos}`. Guarda confirmações em `estadoFinalMes.v269Alt` e `localStorage escalaSetores.v269Alt` / `escalaSetores.v269Maos`. Só pergunta quando o usuário marca manualmente; sugestões e “copiar domingo anterior” ficam de fora. Não colocar essa regra na auditoria ao vivo, pois ela pode desfazer a marcação.
- **V270 — Gabriel:** `window.v270Gabriel = {nome, saudacao, saudacaoHtml, entender, responder, reset, contexto, relogio}` embrulha `window.v265Chat.responder`. PNL em JavaScript puro, saudação automática não persistida na conversa, contexto e datas pelo relógio do aparelho. `ctx.escolha` vale só para a mensagem seguinte. “Trabalhou” não significa presença: o app não tem ponto.
- **V271 — leitura da planilha do RH:** `window.v271Planilha = {inventariar, htmlPrevia, aplicada, atual, ultima, resumoHtml, naoEntendiHtml, confereHtml}`; `localStorage escalaSetores.v271Planilha`. O inventário cobre abas, linhas, colunas, origem e totais; a prévia mostra “O que o Gabriel leu”. A leitura é local e não executa fórmulas/macros.
- **V272 — chat móvel e feriados:** `window.v272Layout` e `window.v272Feriados`; layout adaptado ao celular e respostas sobre trabalho/folga com base no passo Feriados.
- **V273 — memória do Gabriel:** `window.v273Memoria={registrar,exportar,importar,limpar,itens,estado}`; chaves `escalaSetores.v273Memoria` / `enc.v273Memoria`. Só registra eventos confiáveis, evita senha e campos ocultos; a memória vai ao histórico guardado, não ao rascunho automático. Eventos sintéticos de teste são ignorados.
- **V274 — regime configurável:** `window.v274Regime = {estado, configurar, restaurar, maxSeguidos, resumo}` e função `maxSeguidosTrab()`. O padrão continua 6×1 (limite 6); a 5×2 permanece desligada. A configuração é guardada em `escalaSetores.v274Regime` / `enc.v274Regime`; abrir histórico não ativa o regime.

**Como o arquivo é organizado:** um único HTML. O núcleo antigo (motor da escala, telas, passos) fica no meio do arquivo. Cada versão nova acrescenta **camadas** no fim:
- um bloco `<style id="vNNN-assunto">` antes de `</head>`;
- um bloco `<script>` com `(function(){ … })();` antes de `</body>`, com o comentário `/* ═════ VNNN — … ═════ */`.

As camadas mais novas ficam por último e podem "embrulhar" funções antigas: guardam a original e trocam por uma nova que chama a original.

**Estado (variáveis globais `let`, lidas e escritas pelo nome):**
- `equipe` (pessoas do setor aberto), `todasEquipes` (quadro da loja), `grupos`.
- `trabalhoDomingo` / `trabalhoFeriado` (`{dia: [índices]}`), `folgasCompensatorias` (`{"<dia>_<índice>": "AAAA-MM-DD"}`).
- Escala à mão: `selecaoManualDomingo` (`{dia: [índices]}`), `horariosManuaisDomingo` (`{dia: {índice: horário}}`), `antecipacoesFolgaManual`, `liderancaManualDomingo`.
- `naoAptosDomingo` (Set), `coberturaFuncao` (cobertura por cargo/função).
- **Índices** são posições em `equipe` do setor aberto, não matrícula. Ao trocar de setor, os índices mudam.

**Funções principais (procure pelo nome; os números de linha mudam a cada versão):**
- `domingosDoMes(ano, mes)`, `balancoDoMes(ano, mes)`, `feriados(ano, mes)`, `formatarDataDomingo(d)`: `mes` começa em 0, igual ao `$('mes').value`.
- `historicoManual(i)` (`ultimo` / `penultimo` domingo do mês passado), `foraDom(f)` (não pode domingo), `ehLiderancaDomingo(f)`.
- `folgaFixaAtivaNaData(i, dt)`, `descansosDoCandidato(i, d)` (folga antecipada e posterior do domingo).
- `coberturaOperacional(indices, d)`: cobertura mínima por função.
- **Passos (V238):** 1 Equipe · 2 Mês passado · 3 Domingos · 4 Feriados · 5 Gerar (+ ⚙️ Configurações escondido). O **índice interno** (`v45GotoStep(n)`, `ir:n`, `data-step`) é a posição do botão: Equipe 0, ⚙️ 1, **Mês passado 2**, **Domingos 3** (`#coberturaCard`), **Feriados 4** (`#geracaoCard`), Gerar 5. O bloco V170 antigo (`OP=[0,2,3,4,5]`, `labels`) faz a barra de baixo pular o ⚙️. Mudou a ordem? Troque também os `ir:` de `destinoConformidade`, os `labels` da barra (dois lugares), os `v45GotoStep(n)` das camadas, os slides do passo a passo (`SLIDES`) e a lista da Ajuda.
- `gerarSetores()` / `gerarSetoresCore()`: o motor ("Gerar").
- `auditarSelecaoAntesDaGeracao(modo)`: a conferência de regras do "Gerar" na escala à mão/mista. Ela chama `validarLiderancaManualDomingo`, `auditarDescansosSimulados` e `auditarProtecao6x1Simulada`. **Regra nova tem que entrar aqui** para valer também na auditoria ao vivo.
- `renderSelecaoDomingosGeracao()`: redesenha os cartões dos domingos da escala à mão.
- `montarProjeto()` / `restaurarProjeto(p)`: monta e lê o **histórico do mês** (`Historico_<Setor>_mm_aaaa.json`). Dado novo do usuário tem que entrar nos dois.

**Ganchos `window.vNNN…` (as camadas expõem funções para outras camadas e para os testes):**
- `v157Regras`: regras por cargo, ex.: jovem aprendiz bloqueado.
- `v199Graf`: gráficos, `abrirListaPessoas`, `funcaoDoCargo`.
- `v206IrParaManual()`: vai para a escala à mão.
- `v217MarcarGuardado` / `v217LembreteRender`: lembrete "falta guardar o histórico".
- `v219QuadroInfo` / `v219GravarQuadro`: quadro da loja no histórico.
- `v220TempoServico(equipe, todasEquipes, setor)`: seção "Funcionários por tempo de serviço".
- `v221Normalizar`: todo ativo que não é aprendiz fica apto ao domingo; folga no domingo vinda do ERP vira "a definir".
- `v222DomManual`: registro da folga no domingo escolhida à mão (`localStorage escalaSetores.v222FolgaDomManual` + `p.config.folgaDomingoManual`).
- `v225DefinirFolga(i, dia)`: define a folga fixa pelo cartão do domingo.
- `v227Auditar()`: auditoria ao vivo; devolve `{r: [regras quebradas], y: [falta completar]}`.
- `v228DomsDe(texto)`: em quais domingos um aviso da auditoria cai.
- `domingoForaDoMesTrabalhado(i, dt)` (V229, também `window.v229DomingoForaDoMes`): se a pessoa trabalhou um domingo de OUTRO mês. Último e penúltimo domingo do mês passado vêm do passo “Mês passado” (`historicoManual`); domingo do mês seguinte = não trabalhado. **Use sempre que uma conta atravessar a virada do mês.**

- **Assistente RH (V262):** bloco `/* ═════ V262 — 🤖 ASSISTENTE RH (etapa 1) ═════ */` + `<style id="v262-assistente">`. `window.v262Assistente = {exportar, juntar, aprenderMes, dicas, abrir, dados, atualizar}`. Guarda em `localStorage escalaSetores.v262Assistente` = `{v:1, setores:{<setor>:{pessoas:{<chave>:{nome,esc,rec,ace,hor,dm}}, meses}}}` (chave = matrícula sem zeros à esquerda ou `N:NOME`). Vai no histórico pelo campo `p.assistente` (linha `// V262` em `montarProjeto`); ao abrir um histórico (`#arquivoProjetoJSON`) chama `juntar`. Aprende escutando: change em `#selecaoDomingosManual input[data-dom][data-func]` e `select.func-dom-hour`, clique em `[data-v233-aceitar]` e em Guardar histórico/Gerar (`aprenderMes`). A dica do auditor (a mais pesada) só roda com o painel aberto. “Ir até lá” = `v45GotoStep(3)` (Domingos). **Só dica:** nunca bloquear nada pelo Assistente.

**Armazenamento no aparelho:** chaves `localStorage` começam com `escalaSetores.` (ex.: `escalaSetores.v183` = cópia de cada setor/mês, `escalaSetores.quadroERP` = quadro da loja). O espaço é limitado (V216 libera sozinho).

## 3. Mapa técnico — Escala 2×1 de Encarregados (`Escala_2x1_encarregados_Vnnn.html`, ~8,4 mil linhas)

### Camadas documentadas até V182
- **Assistente RH V177:** validação e salvamento equivalentes aos Setores; o objeto global também é `window.v262Assistente`, com chave própria do app.
- **Prévia V177:** usa `window.v167Api.sel()` e `trabalhamNoBalanco`.
- **Chat V178 + Gabriel V179:** `window.v270Gabriel` adiciona nome, saudação, PNL, contexto e datas ao chat V265; “por que não pode” usa `window.v167.motivo`. O app não tem importador de XLSX; V271 não se aplica.
- **V180/V181:** layout do chat para celular, respostas de feriados e memória local do Gabriel. Ganchos `window.v272Layout`, `window.v272Feriados` e `window.v273Memoria`; chave `enc.v273Memoria`.
- **V182 — regime:** `window.v274Regime` e `maxSeguidosTrab()`; padrão 6×1, 5×2 desligada. Chave `enc.v274Regime`; abrir histórico não ativa o regime.

- Mesmo padrão de camadas.
- **Passos (V171, iguais aos do Setores):** 1 Equipe · 2 Mês passado · 3 Domingos · 4 Feriados · 5 Gerar. O “Mês” virou **📅 Mês e opções** (botão escondido `.mes-step-oculto`, como o ⚙️ do Setores): abre por ⋮ → Mês e opções ou pelo aviso `#v171Mes` no topo do Mês passado (`window.v171AbrirMes()`); a barra de baixo pula o índice 1. O **índice interno** (`v80GotoStep(n)`, `ir:n`, `data-step`) é a **posição do botão**: Equipe 0, Mês e opções 1, **Mês passado 2**, **Domingos 3** (`#domingosEtapa`, área `#v169DomArea`), **Feriados 4**, Gerar 5. `#coberturaCard` (grupos da V162) continua no HTML, escondido. Mudou de novo a ordem? Troque também os `ir:` de `destinoConformidade`/“O que falta”/marcos do Início e os `v80GotoStep` das camadas (procure por `v80GotoStep?.(` e `ir:`).
- `gerar()`: gera o mês. Ela chama `autoGrupos()` sozinha (os grupos não mudam a escala desde a V162).
- `montarEscalaFeriados()` começa com `aplicarBloqueioFolgaFeriado()`. `bloqueioFolgaFeriado(i, dt)`: folga fixa/DSR no dia do feriado impede trabalhar, com a exceção da segunda-feira.
- Ganchos: `v156CopiarFeriado`, `v159SyncPrazo` (prazo 20/30 dias), `v161MarcarGuardado`, `v163AbrirCard` (cartões clicáveis).
- **Regras do domingo normal** (motor `escolherDomingo` / `combinacoesDomingoNormal` e conferência `validarEscala`): exatamente 3 pessoas, pelo menos 1 Encarregado (`tipo==='enc'`) e 1 Subencarregado (`'sub'`), as 3 de setores diferentes (no máximo 1 do Laticínio), ninguém 3 domingos seguidos (`podeDomingo`, conta `historicoManual` = 2 últimos domingos do mês passado), fora quem `foraDom` (folga fixa no domingo ou `inativo`). O motor sempre põe 1 do Laticínio (`laticinioEsperado`, blocos de 2); a conferência só exige “no máximo 1”. Domingo de balanço: todos trabalham (`trabalhamNoBalanco`).
- **Escala à mão (V167; no passo 3 desde a V169)** — bloco `/* ═════ V167 — ESCALA À MÃO NOS DOMINGOS … ═════ */` no fim do arquivo, CSS `#v167-escala-mao`:
  - modo `auto` / `manual` / `misto` e as marcações ficam em `localStorage` **`enc.v167EscalaMao`** = `{modo, meses:{'AAAA-MM':{dia:[chave]}}, mostrar, ord, fn}`. A chave da pessoa é `chaveDomingoPrevisto(i)` (`m:<matrícula>` ou `n:<nome>`), **não o índice** (o índice muda quando a equipe muda). Guarda os 8 meses mais recentes.
  - histórico do mês: campo **`escalaMao`** (`window.v167Exportar()` em `exportarProjeto`, `window.v167Importar(p.escalaMao)` em `restaurarProjeto`). “Recomeçar do zero” apaga a chave (embrulho de `window.limparRascunho`).
  - o motor recebe a escolha por **embrulhos**: `window.escolherDomingo` e `window.combinacoesDomingoNormal` (domingo com 3 marcados = exatamente eles; com 1–2 marcados = só as combinações do motor que contêm os marcados — é o Misto) e `window.gerar` (À mão: só gera sem 🔴 e sem 🟡; Misto: só sem 🔴). No modo Automático tudo passa direto para o original (escala igual à V166).
  - `window.v167`: `auditar(sel?)` → `{r:[…], y:[…]}` (cada item `{d, ds?, is:[índices], t:texto}` — use `is` para saber quem o aviso cita, sem procurar nome no texto), `sel()` (marcações do mês na tela, em índices), `motivo(i,d,sel)` (por que não pode entrar; `''` = pode), `marcar(i,d,silencioso)`, `desmarcar`, `sugestoes(d)` (chama o `escolherDomingo` ORIGINAL e filtra pela conferência; reserva: combinações com menos domingos no mês), `copiarAnterior(d)`, `render()`, `estado()`, `definirModo(m)`.
  - **Regra nova do domingo tem que entrar em `auditar` e em `motivo`** (as duas), senão a lista deixa marcar e só a conferência acusa (ou o contrário).
  - **Assistente RH (V176):** mesmo bloco do Setores, adaptado. O objeto continua com o nome **`window.v262Assistente`** (igual nos dois apps) e guarda em `localStorage enc.v176Assistente`; vai no histórico por `p.assistente` (em `exportarProjeto`). Lê a escala à mão por `window.v167Api = {sel, modo, auditar}` (exposto pelo bloco V167 só para isso). Aprende com `input[data-p][data-d]` e com `[data-acao="aceitar"]` (diferença do `sel` antes/depois). “Ir até lá” procura o passo cujo `dataset.panel==='domingosEtapa'` (não use número fixo).
  - V169: `window.bloqueioFolgaFeriado` é embrulhado — no À mão/Misto, a folga (DSR, `descansosDoCandidato`) de quem foi marcado num domingo bloqueia o feriado nesse dia, mesmo antes de gerar. No Gerar, `#v169Resumo` mostra o modo e o estado dos domingos.

---

## 4. Armadilhas conhecidas (já aconteceram — não repita)

- **Prévia antes de gerar (V263/V177):** `trabalhoDomingo` fica vazio até tocar em Gerar. Para a prévia, use a escolha do passo Domingos.
- **Junção do Assistente RH (ARH-01/02/05):** usa o maior valor, não a soma. É decisão do gerente; não alterar sem autorização.
- **Confirmação V266:** testes que guardam histórico ou baixam planilha no Setores precisam chamar `window.v266Horarios?.confirmar?.()` antes.
- **Horário gerado no histórico (V267):** fica em `resultado.estadoFinalMes.horariosGeradosDomingo`; antes da V267 não voltava ao abrir o histórico.
- **Configuração do setor vs. histórico (V267):** `coberturaFuncaoSetor` só entra do arquivo se o aparelho ainda não tiver configuração daquele setor; a configuração do aparelho prevalece.

- **Procurar a pessoa num aviso:** os avisos têm formatos diferentes (`dd/mm/aaaa: Nome ficaria…`, `Nome: sequência…`, `dd/mm/aaaa: Nome: folga fixa a definir…`). Não exija `Nome:`. Use a função `cita` da V228, que também separa nomes parecidos ("Ana Silva" × "Ana Silva Souza").
- **Desfazer uma marcação na escala à mão:** não clique de novo no checkbox, porque o cartão pode ter sido redesenhado. Mexa direto em `selecaoManualDomingo` / `horariosManuaisDomingo` e chame `renderSelecaoDomingosGeracao()`.
- **Índices do histórico ("snapshot")** se referem ao setor daquele snapshot, não ao setor aberto.
- **Data de admissão** vem em dois formatos (`AAAA-MM-DD` do ERP e `dd/mm/aaaa` do Equipe.txt). Normalize, senão aparece "NaN anos".
- **Data de admissão no Editar equipe (V239/V172):** a tela mostra `dd/mm/aaaa` (`admissaoBR`), mas o dado guardado é sempre `AAAA-MM-DD` (`admissaoISO`: `''` = vazio, `null` = data inválida). Não grave o texto da tela direto.
- **Liderança por turno (V241):** `liderTurno()` vale mais que os outros modos (`liderVarias()` devolve `true` e `modoLideranca()` devolve `'turno'`). Quem chama `definirLiderVarias`/`definirLiderancaUnica` para trocar de modo tem que desligar antes com `definirLiderTurno(false)` (ou usar `definirModoLideranca`), senão Frente de Loja, Mercearia e CPD continuam “Por turno” pelo padrão. O turno da liderança é `turnoLider(i)` (turno do cadastro; sem turno, pelo horário).
- **Equipe.txt escondido (V242/V173):** a caixa `[data-upload="arquivoTxt"]` e o `#btnGerarEquipeTxt` continuam no HTML, só escondidos. Não apague: o leitor antigo (`#arquivoTxt` → `parseEquipe`/`salvarEquipePersistente`), o “equipe da última sessão” e os testes (`setInputFiles('#arquivoTxt')`) usam. O “📂 Abrir histórico guardado” (`#arquivoProjetoJSON`) repassa um .txt/.csv para o `#arquivoTxt`.
- **“Equipe da última sessão” do Setores (`escalaSetores.v64.state`):** o snapshot guarda a equipe em `equipe:[…]` e, ao abrir, remonta um Equipe.txt e chama `parseEquipe`. Campo novo da pessoa tem que entrar nos DOIS lugares (snapshot e linhas de 14 colunas da restauração) — até a V238 ele guardava só 9 colunas e a data de admissão sumia ao recarregar.
- **Abrir o histórico num aparelho novo:** troque primeiro o setor da tela para o setor do arquivo, senão o app prepara o mês seguinte.
- **"A definir"** não pode virar terça ao salvar o Editar equipe nem ao reimportar o ERP.
- **Script Python que gera a versão:** dentro de string com aspas simples, use `""` no JS, não `''`.
- **Link do site mostra versão antiga:** é o cache do navegador (Ctrl+F5).
- **Versão HTML divergente do nome do arquivo:** a V231 foi publicada com nome V231 e histórico V231, mas o `<title>` e o rodapé ainda diziam V230. Isso passou porque os testes verificavam a cópia publicada e a passagem de bastão, mas não os metadados visíveis do app. Agora `testes/rodar.js` confere separadamente nome, `<title>`, rodapé e primeira entrada do histórico; não considerar versão concluída sem essas quatro verificações e a igualdade com `setores/index.html`.
- **Conferência de teste que nunca falha:** nunca compare um valor com ele mesmo (ex.: `x.length === x.length`).
- **Ícones (V236/V166):** se um bloco novo compara o texto de um elemento com emoji (`el.textContent!==txt`), ponha a classe dele na lista `FORA` do bloco de ícones. Senão o app e a troca de ícones se desfazem em ciclo.
- **Aba Grupos dos Encarregados:** está escondida; nos testes, clique só se `isVisible()`.
- **Desempenho (V247):** setores grandes (Frente de Loja real = 168 pessoas) travavam. Regras para não voltar: (1) função chamada no motor não pode varrer a equipe inteira sem necessidade — `folgaFixaAtivaNaData` chega a milhões de chamadas por Gerar; (2) `domingosDoMes`, `feriados`, `chaveFuncaoDistribuicao` são guardadas pelo bloco V247 (cópia a cada chamada — pode mexer no resultado); se mudar a regra de uma delas, mude a função original: o bloco envolve a função pelo nome (`window[nome]`, original em `.__v247orig`); (3) rotina de fundo (`setInterval`) que varre a tela deve usar `window.v247DomMudou('<chave>')`; (4) `candidatoPodeReceberDSRPorTurno` hoje é só `!!equipe[i]` (a capacidade por turno é meta, não trava) — se a regra voltar a travar, reescreva com cuidado (era O(equipe) por chamada); (5) `content-visibility:auto` só na tela de feriados: na escala à mão ele apagava o `innerText` das linhas escondidas (o teste V230 pegou). Ferramentas de medição usadas (fora do repositório): Playwright + `Emulation.setCPUThrottlingRate` 4 + `PerformanceObserver('longtask')` + `Profiler` do CDP.
- **Assistente RH nos Encarregados (V176):** o objeto global se chama `window.v262Assistente` também nos Encarregados (o código é o mesmo do Setores). Não procure `v176Assistente`; só a chave do `localStorage` muda (`enc.v176Assistente`).
- **Datas de balanço (V246/V175):** a lista oficial é `datasBalanco` ([{d,m,a}], m de 0 a 11), mas quem manda é o aparelho: `localStorage` `escalaSetores.v246Balancos` / `enc.v175Balancos`, com `d:0` = “sem balanço” escolhido pelo usuário. A cada 1,5 s o bloco V246/V175 junta o que apareceu em `datasBalanco` (ex.: histórico aberto) com o aparelho — o aparelho vence. Para mudar uma data por código, use `window.v246Balancos.escolher(a,m,d)` / `window.v175Balancos.escolher(a,m,d)`; trocar `datasBalanco` direto também funciona, mas não desfaz um “sem balanço” guardado. O `#arquivoBalanco` (.txt) só ficou escondido.
- **Folgas que atravessam a virada do mês (V174):** o “Gerar” zera `descansosDomingo` e só refaz as folgas dos domingos DESTE mês. A folga da semana de DEPOIS do último domingo do mês passado (cai nos primeiros dias deste mês) não está em `descansosDomingo`: nos Encarregados ela vem de `window.v174.dsrDoMesPassado`, ligada pelo embrulho de `ehDescansoAssociado`. Leia folgas sempre por `ehDescansoAssociado(i,dt)`, nunca direto de `descansosDomingo`. No Setores isso não pesa porque o DSR cai no dia da folga fixa, que continua valendo (`folgaFixaAtivaNaData`).
- **Domingo de balanço é exceção na sequência de domingos:** não tire o balanço da lista (`doms.filter(d=>d!==bal)` junta domingos que não são seguidos). Deixe no lugar como “não trabalhado” (`d!==bal&&…`), igual ao verificador do `testes/rodar.js`.
- **Virada do mês:** `trabalhoDomingo[dia]` só tem os domingos DESTE mês. Nunca use `trabalhoDomingo[outraData.getDate()]` para um dia de outro mês (lê o dia de mesmo número deste mês). Use `domingoForaDoMesTrabalhado` (V229).
- **Downloads dentro do APK (V237/V168):** o APK do ApkForja em **modo site** é um WebView que abre o link; ele **não baixa `blob:`** (o Android mostra “Nenhum aplicativo para abrir: blob:…”), e o script de ponte do ApkForja que conserta `<a download>` só é injetado em HTML empacotado, não no site. Por isso cada app tem a camada `/* ═════ V237 (V168) — SALVAR ARQUIVOS DENTRO DO APK ═════ */`: embrulha `HTMLAnchorElement.prototype.click` e `URL.createObjectURL` (guarda o Blob) e, se existir `Android.salvarArquivo(nome, base64, tipo)` (ApkForja → “🔌 Permitir que o site use os recursos do Android”), entrega o arquivo para ele; num WebView sem ponte (`; wv)` no userAgent) avisa em vermelho e impede o lembrete de ficar “guardado”. **Todo download novo tem que ser `<a download>` + `.click()`** (como `baixarJSON`), senão não passa por essa camada. Não use `dispatchEvent(new MouseEvent…)` nem `window.open(blob)`.
- **`auditarDescansosSimulados` vazia de propósito:** a capacidade de folgas por dia/turno é META, não trava (comentários em `limiteFolgaRespeitadoNaData` e `turnoFolgaValidoNaData`). Não “conserte” fazendo ela acusar erro sem o dono pedir.

---

## 5. Diário (mais novo primeiro)

### 2026-10-16 — Atualização da documentação até Setores V274 / Encarregados V182 — ChatGPT
- **O que mudou:** atualizados os mapas técnicos e as versões atuais/próximas; documentadas as camadas V269–V274 dos Setores e V179–V182 dos Encarregados; registrado o protocolo de testes do Gabriel da issue #78.
- **Decisões preservadas:** regime 6×1 continua padrão; 5×2 desligada até confirmação legal e ordem do gerente. Não declarar testes executados sem relatório real. Para o Gabriel, separar conjunto de ajuste e conjunto cego, calcular o esperado com dados do app e usar somente dados fictícios.
- **Escopo/testes:** somente `CHANGELOG.md`, `docs/PASSAGEM.md` e `docs/INICIO_NOVA_CONVERSA.txt`; nenhum HTML nem `testes/rodar.js` alterado. Testes automatizados não executados neste ambiente; o CI desta PR precisa ser conferido.
- **Referências:** [PR #69](https://github.com/jottacostta/EscalaDominical/pull/69), [PR #71](https://github.com/jottacostta/EscalaDominical/pull/71), [PR #72](https://github.com/jottacostta/EscalaDominical/pull/72), [PR #75](https://github.com/jottacostta/EscalaDominical/pull/75), [PR #76](https://github.com/jottacostta/EscalaDominical/pull/76), [PR #77](https://github.com/jottacostta/EscalaDominical/pull/77), [issue #68](https://github.com/jottacostta/EscalaDominical/issues/68), [issue #73](https://github.com/jottacostta/EscalaDominical/issues/73), [guia de testes #78](https://github.com/jottacostta/EscalaDominical/issues/78).
- **Para continuar:** revisar documentação e resultado do CI; não fazer merge sem autorização explícita do gerente. — ChatGPT

### 2026-10-14 — Documentação dos PRs #59, #62, #63 e #64 — ChatGPT
- **O que mudou:** documentadas Setores V263–V267 e Encarregados V177–V178 no CHANGELOG; atualizados os mapas técnicos, armadilhas e pendências desta passagem e o arquivo de início de conversa.
- **Decisões:** chat sem internet nos dois apps; horário de domingo mostrado depois de gerar e confirmação obrigatória no Setores; Encarregados sem horário de domingo por pessoa.
- **Pendências condicionadas a pedido do gerente:** ARH-04, ARH-11, ARH-12, ARH-08, ARH-24 via HTTP, chat sem orientação sobre confirmação V266 e teste da V267 com equipe fictícia de Açougue. Manuais não alterados; são mantidos pelo Claude.
- **Escopo/testes:** somente documentação; nenhum HTML, `testes/rodar.js` ou manual foi alterado. As suítes não puderam ser executadas neste ambiente; conferir o check “Playwright + Chromium” deste PR.
- **Referências:** [PR #59](https://github.com/jottacostta/EscalaDominical/pull/59), [PR #62](https://github.com/jottacostta/EscalaDominical/pull/62), [PR #63](https://github.com/jottacostta/EscalaDominical/pull/63), [PR #64](https://github.com/jottacostta/EscalaDominical/pull/64) e [issue #61](https://github.com/jottacostta/EscalaDominical/issues/61).
- **Para continuar:** revisar esta PR. Não fazer merge sem autorização explícita do gerente. — ChatGPT

### 2026-10-14 — Correção da referência a PRs abertas — ChatGPT
- **Problema confirmado:** a seção 1 desta passagem dizia que havia “só a desta documentação” aberta, e o estado de `docs/INICIO_NOVA_CONVERSA.txt` repetia essa informação. A consulta ao GitHub antes desta correção retornou nenhuma PR aberta; portanto, os dois textos estavam desatualizados.
- **Correção:** os dois documentos agora orientam a consultar a aba Pull requests do GitHub, sem fixar uma contagem manual que volta a ficar errada quando uma PR muda de estado. Mantidos os registros das PRs #54 e #56 incorporadas ao `main` e da #55 fechada sem merge.
- **Escopo e testes:** somente documentação; nenhum HTML, regra de escala ou teste do aplicativo foi alterado. Conferência textual das substituições concluída; as suítes automatizadas do projeto não foram executadas neste ambiente.
- **Para continuar:** revisar esta PR e conferir a documentação depois de futuras mudanças de estado das PRs. Não fazer merge sem autorização do gerente. — ChatGPT


### 2026-10-14 — Documentação atualizada até Setores V262 / Encarregados V176 — Claude
- **O que mudou:** `CHANGELOG.md` (V262 e V176), `README.md` (versões arquivadas até V261/V175), esta passagem (estado, hierarquia, mapa técnico do Assistente RH, armadilha) e `docs/INICIO_NOVA_CONVERSA.txt`. O dono autorizou (“Agora”), seguindo a regra de perguntar antes.
- **Escopo:** só documentação; nenhum HTML mudou. Manuais (Claude Docs) ainda não falam do Assistente RH — ver pendências.

### 2026-10-14 — AGENTS.md: hierarquia e seção 2.1 “Investigar antes de mudar” — Claude (PR #56)
- **O que mudou:** (1) topo do `AGENTS.md` e `CLAUDE.md`: **dono = gerente, Claude = encarregado, ChatGPT = subencarregado**; nada por iniciativa própria sem autorização do gerente (código, documentação, merge, abrir ou fechar PR). (2) Seção 2.1: as ideias do guia REA (PR #55 do ChatGPT, fechada a pedido do dono) juntas em 5 passos — seguir o caminho real do código (inclusive os embrulhos `window.nome=function`), separar certeza de suspeita, ver o que pode ser afetado, conserto mínimo com teste que falha antes e passa depois, relatório no formato padrão. Não instalar o REA.

### 2026-10-14 — Setores V262 + Encarregados V176 — 🤖 Assistente RH (etapa 1) — Claude (PR #54)
- **O que mudou e por quê:** o dono quer um assistente que aprenda como cada encarregado monta a escala e fique mais rápido e certeiro com o tempo. Etapa 1: botão flutuante com dicas do passo atual (o que falta, domingos acima do costume, horário de costume, quem costuma escolher) e aprendizado guardado no aparelho e no histórico do mês.
- **Onde no código:** ver o mapa técnico (seções 2 e 3, item “Assistente RH”).
- **Teste:** `testes/rodar.js` — botão, aprender a escolha, dicas de domingos acima do costume e de horário, ir no histórico e juntar o histórico aberto (Setores); `testarEncAssistente` nos Encarregados.
- **Próximas etapas (só se o dono pedir):** usar o que aprendeu na 💡 Sugestão (ex.: pôr primeiro quem o encarregado costuma escolher) e um resumo do ano.

### 2026-10-13 — Documentação atualizada até Setores V261 — ChatGPT
- **O que mudou:** documentação alinhada ao estado do `main`: Setores V261 e Encarregados V175; nenhuma PR aberta na conferência.
- **Arquivos:** `CHANGELOG.md` registra V258–V261; `README.md` corrige o intervalo de versões arquivadas; esta passagem e `docs/INICIO_NOVA_CONVERSA.txt` atualizam versões, PRs, funcionalidades recentes e próxima versão.
- **Decisão registrada:** V258 define 1 promotor por domingo no automático e no modo 50% da escala à mão; para 2, usar “Por cargo”. Cartazista não trabalha domingo.
- **Escopo:** somente documentação; nenhum HTML ou regra do aplicativo foi alterado.
- **Referências:** PR #50 (documentação V257), #51 (V258–V260) e #52 (V261).

### 2026-10-13 — Setores V261 — cópia do app pela logo — Claude
- **O que mudou:** tocar na logo do Guanabara baixa uma cópia do HTML atual, com o nome `Escala_de_Setores_V261.html`, idêntica byte a byte ao original. O atalho é invisível; o usuário não vê botão nem aviso.
- **Limitação:** abrir o HTML diretamente com `file://` pode impedir a leitura; usar o app pelo link do site.
- **Teste:** `testarCopiaLogo` verifica o nome e a igualdade do arquivo baixado; suítes rápida e completa aprovadas na PR #52.

### 2026-10-13 — Setores V260 — importação do ERP sem “Bloquear o domingo” — Claude
- **O que mudou:** removida a caixa de seleção da importação do RH. Jovens aprendizes e cartazista continuam excluídos dos domingos automaticamente.
- **Conferência:** planilha real do ADM Geral manteve 1 promotor por domingo e nenhum cartazista na escala dominical.

### 2026-10-13 — Setores V259 — aviso para grupos pequenos — Claude
- **O que mudou:** “Por grupos” explicita o limite de 6 pessoas; setores com menos de 6 pessoas aptas a trabalhar no domingo recebem aviso amarelo.

### 2026-10-13 — Setores V258 — promotor e cartazista — Claude
- **O que mudou:** 1 promotor por domingo no automático, no modo 50% da escala à mão e em “Por cargo”; cartazista não trabalha domingo. A regra respeita 2×1 e 6×1.
- **Decisão do dono registrada na PR #51:** no modo 50%, fica 1 promotor por domingo; para 2, usar “Por cargo”. A regra foi conferida no ADM Geral de novembro/2026 a janeiro/2027.



### 2026-10-13 — Documentação atualizada após as PRs #46–#49 — ChatGPT
- **O que mudou:** documentação alinhada ao estado atual do `main`: Setores V257 e Encarregados V175; sem PR aberta no momento da conferência.
- **Arquivos:** `CHANGELOG.md` agora registra V256 e V257; `README.md`, `docs/INICIO_NOVA_CONVERSA.txt` e esta passagem refletem a versão atual, as funcionalidades recentes e o próximo número de versão.
- **Escopo:** somente documentação. Nenhum HTML do aplicativo ou regra de negócio foi alterado.
- **Referências:** PR #46 (V253), #47 (V254–V255), #48 (V256) e #49 (V257).

### 2026-10-13 — Setores V257 — nome do setor no arquivo Excel — Claude
- **O que mudou e por quê:** o arquivo Excel exportado passa a incluir o setor no nome, evitando arquivos iguais para setores diferentes. Exemplo: `Escala_Frente_de_Loja_Novembro_2026.xlsx`; acentos são normalizados (`Açougue` → `Acougue`).
- **Onde no código:** função `nomeArquivoExcel()`; o título e o nome da aba dentro da planilha permanecem como antes.
- **Teste:** nomes para Frente de Loja e Açougue, mês de março sem cedilha; download real com dados fictícios. Suítes rápida e completa aprovadas na PR #49.

### 2026-10-13 — Setores V256 — cartão Jovem Aprendiz — Claude
- **O que mudou e por quê:** pedido do dono: separar os jovens aprendizes do ADM Geral num cartão próprio, **🎓 Jovem Aprendiz**. A classificação considera a palavra “aprendiz” no cargo, sem alterar o setor gravado no ERP, no histórico ou no Equipe.txt.
- **Efeito observado com a planilha real:** o ADM Geral passou de 24 para 4 pessoas, e o cartão Jovem Aprendiz ficou com 20.
- **Teste:** cartão e opção presentes; aprendiz sai do ADM Geral e entra no cartão próprio; promotor permanece no ADM Geral. Suítes rápida e completa aprovadas na PR #48.

### 2026-10-13 — Setores V255 — função sem A/B e grupo Jovem aprendiz — Claude
- **O que mudou e por quê:** pedido do dono: agrupar por função independente de A ou B, e separar os jovens aprendizes num grupo. Na planilha real: PROMOTOR DE VENDAS A (2) e B (1), CONFERENTE A/B, aprendizes “APRENDIZ EM SERV SUPERMERCADOS” e “APRENDIZ EM SERVICOS DE VENDAS”.
- **Onde no código:** `chaveFuncaoDistribuicao` tira a letra do fim (`\s*-?\s*\b[a-c]$`) — vale para o quadro “Por cargo”, o motor e a V253; `funcoesDoSetor` faz o mesmo no rótulo. No bloco V251, `agrupar` usa `window.v251Funcao` (= `v199Graf.funcaoDoCargo`, a mesma função dos gráficos: sem A/B, aprendizes → “Jovem aprendiz”, encarregados de vários setores → “Encarregado”); grupo liderança se alguém do grupo é liderança; Jovem aprendiz vai para o fim.
- **Atenção:** chaves antigas de `coberturaFuncao.base/dom` com “ a”/“ b” no fim deixam de ser lidas (voltam ao padrão).
- **Teste:** V255 em `testes/rodar.js`; teste V251 passou a contar funções com `v251Funcao`.

### 2026-10-13 — Setores V254 — turno sozinho e aviso com o nome no Editar equipe — Claude
- **O que mudou e por quê:** print do dono: “Salvar equipe” recusava com “Linha 8…Linha 12: selecione o turno”. Com a V251 (equipe por função) a “linha N” (ordem do DOM) não é a ordem da tela — impossível achar. Na planilha real há horários como “2ª4ª5ª6ªe3ªcurso 13:00as 17:00” (aprendizes), que o `^\d` do Equipe.txt e do salvar não reconhecia.
- **Onde no código:** `coletarEquipeEditor` (marcado `// V254`): `turno` vazio → pela 1ª hora do texto do horário (<12 Abertura, senão Fechamento) e o select é atualizado; avisos usam o nome (`rot`); ficha com erro ganha `.v254-erro`. Regex sem `^` na importação do Equipe.txt (`turnoCalculado`) e no salvar (`turnoNovo`). Bloco `/* ═════ V254 … ═════ */`: depois do clique em `#btnSalvarEquipe`, `window.v254IrParaErro()` abre o grupo (V252) e a ficha (`.emp-card` do V45) e rola até ela. Obs.: `btnSalvarEquipe.onclick` guarda a função original — embrulhar `salvarEquipeEditor` não pega o botão.
- **Teste:** `testarTurnoEditor` em `testes/rodar.js` (horário “curso 13:00as 17:00” → Fechamento e guarda; sem horário → aviso com o nome, ficha marcada e aberta).

### 2026-10-13 — Setores V253 — operadoras em 3 horários na sugestão (Frente de Loja) — Claude
- **O que mudou e por quê:** pedido do dono: na escala à mão da Frente de Loja, com “Por cargo”, a quantidade de operadoras é sempre dividida por 3 — abertura, intermediária (quem entra às 10h) e fechamento (60 → 20/20/20). Na planilha real as operadoras começam 06:50/07:40 (abertura), 10:00 (intermediária) e 13:40/15:40 (fechamento).
- **Onde no código:** bloco `/* ═════ V253 … ═════ */` (só com setor Frente de Loja e `modoCobertura='funcao'`): `window.v253Faixa(i,d)` (início do horário de domingo já escolhido, senão o de sempre: <10:00 abertura, 10:00–11:59 intermediária, ≥12:00 fechamento), `window.v253Metas(d)` (meta de cada cargo = `qtdFuncao`; operador(a) de caixa dividida em 3, sobra → abertura e depois fechamento; memo de 1,5 s porque a sugestão chama uma vez por candidato), `window.v253Falta(sel,d)` e `window.v253Resumo(d)`. No núcleo do V233: `falta` do `candidatosDoDia` soma `v253Falta` (quem diminui a falta entra primeiro) e o painel da sugestão mostra o resumo. Antes, no “Por cargo” à mão, a sugestão ignorava as quantidades de cada cargo (`coberturaOperacional` devolve ok no modo função).
- **Teste:** V253 em `testes/rodar.js` (9 operadoras, 6 com horário das 10h nos dados fictícios → 3/3/3). Real: 60 → 20/20/20 em 0,3 s.

### 2026-10-13 — Setores V252 — triângulo para fechar listas + liderança em dupla — Claude
- **O que mudou e por quê:** o dono pediu “∆” (triângulo de abrir/fechar) nos cartões de domingo da escala à mão e em todos os cartões com listas grandes; e que a liderança escolhida no 1º domingo já vá para o 2º (dupla), ou que o app diga por que não pode.
- **Onde no código:** bloco `/* ═════ V252 … ═════ */` + `<style id="v252-triangulo">`. `window.v252Rec` (localStorage `escalaSetores.v252Recolhidos`, chave `setor|mês|ano|tipo|id`), `.v252-seta` no cabeçalho de `.dom-card` (`.dom-head`, ao lado do título), os títulos de função dentro do domingo (`.v226-fn` do V226: seta por CSS `::before` + `data-v252-rec`, porque o V222 reescreve o `textContent` do título; linhas do grupo pela faixa de `order` g*10000) e `.feriado-box` (o `h3` ganha um `div.v252-cab` em volta); fechado = classe `.v252-rec` e o CSS esconde o resto (**o DOM não muda**). Grupos de função: no bloco V251 (linhas com `.v252-oculto`), agora também em `#historicoLista` (Mês passado). `window.v252Barra` = “Abrir todos / Fechar todos”. Liderança: escuta (captura) `.v208-op`, Enter na busca, `.lider-unica`/`.lider-select`; o embrulho de `renderLiderancaDomingo` chama `window.v252Copiar(d,i)` para quem entrou (respeita modo uma/encsub/várias/turno, 3 domingos seguidos com o Mês passado, balanço) e mostra `.v252-lid-msg` + aviso. O V186 (Gerar) continua com a seta dele.
- **Teste:** V252 em `testes/rodar.js` (fechar/abrir/lembrar o domingo, fechar grupo, dupla e motivo do 3º seguido).

### 2026-10-13 — Setores V251 — equipe separada por função (+ folga certa no Editar equipe) — Claude
- **O que mudou e por quê:** print do dono (Açougue, passo Equipe): pediu a equipe separada pelas funções, em grupos, e o mesmo no Editar equipe.
- **Onde no código:** bloco `/* ═════ V251 — EQUIPE SEPARADA POR FUNÇÃO ═════ */` + `<style id="v251-por-funcao">`. **A ordem no DOM não muda** (o `equipe[]`, os índices e a ordem que o editor salva continuam iguais): cada linha ganha CSS `order` do grupo e um título `.v251-cab` (`grid-column:1/-1`) é inserido. Observer em `#equipeLista` e `#equipeEditorRows` (só `childList`); troca de `.ed-cargo` reagrupa. Lideranças (`classificacaoLideranca`) primeiro, depois ordem alfabética; sem cargo vai para o fim (“SEM FUNÇÃO”). `window.v251Agrupar()`.
- **Defeito achado junto (desde a V231, ChatGPT):** o embrulho de `renderEditorRows` do empréstimo passava `{...f}` sem `folga`/`pendente` → `editorFolga(undefined)` = Terça para todos; salvar o editor trocava a folga de todo mundo. Agora o embrulho passa `folga`, `pendente` e `aptoDomingo` como o original.
- **Teste:** V251 em `testes/rodar.js` (títulos = funções, soma = equipe, ordem guardada igual, lideranças primeiro) e, no teste da data de admissão, “o editor mostra a folga certa e salvar sem mexer não troca nenhuma folga” (nos dois apps).

### 2026-10-13 — Setores V250 — folga da liderança respeita o 6×1 — Claude
- **O que mudou e por quê:** print do dono (liderança do domingo 01/11/2026, folga fixa TER): antes qua 28/10 e depois qui 05/11 (e outra com qui 29/10 → sáb 07/11) eram aceitos, mas deixam a pessoa 7+ dias seguidos trabalhando. O app não via porque a folga fixa da terça continuava valendo junto com a DSR escolhida (a DSR era somada, não trocada).
- **Regra nova (confirme com o dono se mudar):** a DSR da liderança (`liderancaManualDomingo[d].dsr[i].ant|pos`) **substitui** a folga fixa da mesma semana (ant = seg–sáb antes do domingo; pos = seg–sáb depois), igual à antecipação manual dos funcionários (`antecipacoesFolgaManual`). Sem escolha, a folga fixa continua.
- **Onde no código:** bloco `/* ═════ V250 … ═════ */`: embrulho de `folgaFixaAtivaNaData` (`window.v250Substitui`), `htmlDsrLider` reescrita (opções `disabled` com “✖ 7 dias seguidos”, aviso `.v250-aviso`), `window.v250Sequencia(i,d,lado,valor)` = maior sequência de dias trabalhados que passa pelas semanas do domingo, com a escolha testada aplicada por um instante. Feriado sem decisão (`trabalhoFeriado[d]` vazio) conta como trabalhado.
- **Teste:** V250 em `testes/rodar.js` (caso do print). Também: o teste V247 da auditoria 6×1 força 3 pessoas com folga no domingo (antes às vezes ficava com 0 avisos e falhava no GitHub).

### 2026-10-13 — Setores V249 — desfazer folga no domingo na escala à mão — Claude
- **O que mudou e por quê:** print do dono (Mercearia, escala à mão): escolheu por engano a folga fixa no domingo para uma pessoa e ela ficou apagada (“FOLGA FIXA NO DOMINGO”, checkbox `disabled`) sem jeito de desfazer ali — a caixa de folga do V223/V225 (`select[data-v225-fixa]`) só aparece em quem está **marcado** no domingo, e quem tem folga no domingo não pode ser marcado.
- **Onde no código:** bloco `/* ═════ V249 — DESFAZER FOLGA NO DOMINGO NA ESCALA À MÃO ═════ */` + `<style id="v249-desfazer-dom">`. Um MutationObserver em `#selecaoDomingosManual`/`#selecaoDomingosMista` põe `.v249-dom` (lista Segunda…Sábado/“a definir”) dentro de `.dom-func-main` das linhas `disabled` de pessoa ativa, não aprendiz, não liderança e com `folgaFixa===0`. Trocar chama `window.v225DefinirFolga(i,v)`; “a definir” antes tira o registro `v222DomManual` e põe `folgaFixa=2` (o mesmo que o V221 `normalizar` faz). A linha com a caixa fica com opacidade normal (`.v249-tem`).
- **Como foi testado:** teste V249 em `testes/rodar.js` (pessoa com folga no domingo fica apagada e com a lista; trocar para quarta → `folgaFixa 3`, linha volta a poder ser marcada, caixa some, registro V222 apagado; “a definir” → pendente). Suítes verdes.

### 2026-10-13 — Setores V248 — folga da liderança também em feriado — Claude
- **O que mudou e por quê:** print do dono (escala à mão, liderança do domingo 01/11/2026, folga fixa TER): escolheu a folga antes na segunda 26/10 e a depois devia ser a segunda 02/11, que não aparecia. `opcoesDsrLider` pulava feriados (02/11 = Finados). Para os outros funcionários a folga da semana (`dataDescansoPosterior`) nunca pulou feriado — a liderança agora segue a mesma regra.
- **Onde no código:** `opcoesDsrLider` (sem o `continue` do feriado), rótulo “· feriado” no `<option>` de `htmlDsrLider`, e o bloco `/* ═════ V248 … ═════ */`: embrulho de `aplicarFolgasFixasNosFeriados` tira de `trabalhoFeriado[d]` quem tem a folga da liderança (`liderancaManualDomingo[*].dsr[i].ant|pos`) naquele feriado (`window.v248DsrLiderNaData`). Sem isso, `statusDiaSet` mostraria o feriado trabalhado e a folga se perderia.
- **Como foi testado:** teste V248 em `testes/rodar.js` (02/11 na lista; quem folga no feriado sai de `trabalhoFeriado`); reprodução com dados fictícios (escolher seg 26/10 e seg 02/11 · feriado fica gravado). Suítes verdes.

### 2026-10-13 — Setores V247 — mais rápido em setores grandes — Claude
- **O que mudou e por quê:** o dono disse que o app travava muito e mandou a planilha real (412 pessoas; Frente de Loja = 168). A planilha ficou só na pasta temporária da conversa. Medição no celular simulado (CPU 4× mais lenta), etapa por etapa, com o Profiler do Chrome. Achados: no Gerar, 7,4 milhões de `folgaFixaAtivaNaData`, 8,9 milhões de `normalizeStr`, 1 milhão de `chaveFuncaoDistribuicao`, 913 mil `historicoManual`, 60 mil `feriados` (Páscoa recalculada); `candidatoPodeReceberDSRPorTurno` sempre dava true mas varria a equipe 2× por chamada; `planoTransicao` refeito por candidato; a prévia de folgas de feriado (168 × 35 células) redesenhada várias vezes por Gerar, inclusive escondida; rotinas de fundo (troca toque→clique, glossário, cartões recolhíveis) varrendo a tela inteira a cada 1–1,5 s e salvamento automático montando o histórico inteiro a cada 2 s.
- **Onde no código:** bloco `/* ═════ V247 — MAIS RÁPIDO EM SETORES GRANDES ═════ */` (memo de `domingosDoMes`/`feriados`/`chaveFuncaoDistribuicao`, índice em `statusHistoricoPorFuncionario` e `idxPessoaPrevista` durante “lote”, prévia adiada, `v247DomMudou`) + trechos no núcleo marcados `// V247` (`planoTransicao` com cache por domingo, `unidadeDoFuncionario` com Map, `__v247DiaSemana`, `auditarProtecao6x1Simulada` reescrita com o calendário pronto, `candidatoPodeReceberDSRPorTurno`, intervalos condicionados, salvamento 8 s) + `<style id="v247-desempenho">`.
- **Como foi testado:** comparação V246 × V247 com a planilha real em Frente de Loja, Mercearia, Depósito e Açougue, 3 meses cada (domingos, feriados, DSR, compensatórias, grade dia a dia, aviso e sugestões): **idênticos**. Testes novos em `testes/rodar.js` (gate V247): memo = conta original (72 meses), chave do cargo e “pode receber folga” = regra antiga, auditoria 6×1 = conta antiga (com avisos forçados), rotina de fundo não repete sem mudança na tela. Suítes rápida e completa verdes.
- **Antes → depois (tempo travado, celular simulado, Frente de Loja real):** parado 2,7 s → 0,3 s a cada 10 s; Feriados 4,0 → 1,6 s; Domingos 1,0 → 0,5 s; Gerar 19,7 → 12,0 s (maior trava 17,0 → 7,8 s); trocar o mês 2,0 → 1,2 s; marcar à mão 4,8 → 3,1 s; sugestões 7,6 → 3,3 s. Encarregados medido (32 pessoas): leve, sem mudança.
- **Para continuar:** o que sobra pesado está na seção 6 (previsão do mês seguinte refaz um Gerar inteiro; reações a cada toque na escala à mão espalhadas em várias camadas).

### 2026-10-13 — Documentação — manuais com o quadro de balanço — Claude
- **O que mudou e por quê:** pendência do PR #44 (combinada na revisão do ChatGPT). Manual da Escala de Setores: versão V246 e parágrafo “📦 Datas de balanço” + print do quadro, logo depois do parágrafo das Configurações. Manual do Encarregado: o item “Datas de balanço” (Mês e opções) explica o quadro e ganhou o print. Prints com dados fictícios (celular 390×844, escala 2).
- **Como foi testado:** `testes/rodar.js` (os apps não mudaram).

### 2026-10-13 — Setores V246 + Encarregados V175 — datas de balanço sem arquivo de texto — Claude
- **O que mudou e por quê:** pedido do dono — os balanços são em janeiro, março, junho e setembro; em vez do arquivo .txt, ele quer escolher as datas no app, que guarda e coloca no histórico JSON. Novo quadro “📦 Domingos de balanço de <ano>” (Setores: ⚙️ Configurações; Encarregados: 📅 Mês e opções → Mais opções) com 4 listas que só têm os domingos do mês, mais “Sem balanço”. Guardado na hora no aparelho e em `datasBalanco` (que já ia para `planejamento.datasBalanco` no histórico). Ao abrir um histórico, as datas dele entram no aparelho; o “sem balanço” escolhido no aparelho vale mais. Datas antigas de outros meses aparecem em “Também guardado” com 🗑️.
- **Onde no código:** bloco `/* ═════ V246|V175 — DATAS DE BALANÇO SEM ARQUIVO DE TEXTO ═════ */` + `<style id="v246-balancos">`/`v175-balancos` (código igual nos dois apps; no Setores, depois de mudar, chama `sincronizarFlagBalancoAutomatico(true); atualizarModoGeracao();`). Funções: `ler`, `gravar`, `unir` (aparelho vence), `sync` (a cada 1,5 s), `escolher`, `render`. Exposto em `window.v246Balancos` / `window.v175Balancos`.
- **Revisão do ChatGPT (comentário no PR #44) e ajustes:** (1) o .txt antigo ainda abre pelo “Tem o arquivo antigo de balanços?” do quadro — as datas do arquivo valem mais que as do aparelho (`doArquivo`); (2) o teste passou a usar o fluxo real e **achou um defeito**: abrir o histórico (`#arquivoProjetoJSON`) não lia `planejamento.datasBalanco` (o app só usa o arquivo para o mês passado e a equipe). Conserto: o bloco lê o próprio arquivo (escuta `change` do `#arquivoProjetoJSON` na captura) e junta as datas (`doHistorico`, o aparelho vale mais).
- **Como foi testado:** `testes/rodar.js` → `testarBalancos`, nos dois apps: quadro com 4 meses e .txt fora da tela; .txt antigo entra (setembro) e outubro aparece em “Também guardado”; escolher/“Sem balanço”; gera março, **guarda o histórico de verdade** e confere `planejamento.datasBalanco`; abre o arquivo num **contexto novo** (aparelho novo) → datas no quadro e no aparelho, e continuam depois de recarregar; num aparelho com março “Sem balanço”, o arquivo não desfaz. Suíte rápida e completa verdes. Print no celular (390×844) conferido.
- **Para continuar (responsável: Claude, logo depois do merge):** atualizar os manuais (Setores: ⚙️ Configurações; Encarregados: 📅 Mês e opções → Mais opções) com o print novo — dados fictícios.

### 2026-10-13 — Setores V245 + Encarregados V174 — consertos da investigação de erros — Claude
- **O que mudou e por quê:** o dono pediu uma investigação minuciosa de erros. Além da suíte (`--completo`), o Claude escreveu conferências próprias (fora do repositório) que geram meses seguidos com os dados fictícios e conferem a grade dia a dia (`statusDiaSet`/`statusDiaEnc`): 6×1 atravessando a virada do mês, DSR de quem trabalha domingo, afastado/aprendiz, feriado com folga fixa, folga de feriado (prazo, domingo, cair em DSR/folga fixa/outro feriado), com e sem domingo de balanço. Achados e consertos:
  1. **Encarregados — virada do mês (grave):** a folga da semana de depois do último domingo do mês passado sumia ao gerar o mês novo → até 10 dias seguidos de trabalho, sem aviso (11 casos em 24 meses). A conferência de 6×1 também tratava o domingo do mês passado como folga (a V229 só tinha consertado no Setores). Conserto: bloco V174 (`dsrDoMesPassado`, `domingoForaDoMes`, embrulho de `ehDescansoAssociado`) e a linha do 6×1 em `validarEscala`.
  2. **Encarregados — mês com balanço:** `gerarDomingosAncorados` decide os domingos fora de ordem; `podeDomingo` lê `trabalhoDomingo` (vazio durante a busca) e `todosNormaisRespeitamTresConsecutivos` não olhava o mês passado → 3 domingos seguidos (ex.: 25/01, 01/02, 08/02/2026). Conserto: embrulho de `todosNormaisRespeitamTresConsecutivos` com o histórico (balanço continua exceção).
  3. **Setores — folga de feriado no dia da folga fixa:** `candidatosFolgaFeriado` evitava o DSR mas não a folga fixa; no mês com balanço (DSR do balanço fora do dia fixo) a folga caía no dia fixo e a pessoa perdia a folga do feriado. Conserto: `if(temFolgaNormalNoDia(i,dt))continue;`.
  4. **Os dois — aviso falso de 3 domingos seguidos em mês com balanço:** `conformidadeMesSet`/`conformidadeMes` tiravam o balanço da lista e juntavam domingos não seguidos. Conserto: o balanço fica no lugar como exceção.
- **Testes novos (`testes/rodar.js`, gate V245/V174):** folga de feriado nunca na folga fixa; resumo do mês com balanço no meio (sem aviso falso, e 3 seguidos de verdade continua acusado); folga da virada do mês aparece (e não aparece para quem não trabalhou); a busca do mês com balanço barra último domingo + 1º + 2º.
- **Como foi testado:** suíte rápida e completa; conferências próprias depois do conserto: Encarregados 24 meses (prazo 20) e 12 meses com balanço (prazo 30), Setores Frente de Loja e CPD 12 meses com balanço — 0 problemas, 0 erro de JavaScript, e sem alarme falso de 6×1.
- **Para continuar:** ver pendências novas na seção 6 (balanços seguidos a 2 semanas; transformar as conferências dia a dia em teste fixo).

### 2026-10-12 — Documentação — regra de ouro com 16 itens (ideias da Taste Skill) — Claude
- **O que mudou e por quê:** o dono mostrou vídeos com ferramentas para o Claude e pediu para ficar só com o que o projeto precisa. Da *Taste Skill* (github.com/Leonxlnx/taste-skill, MIT) foram adaptados 6 itens para a lista da seção 4.1 do `AGENTS.md` (itens 11–16): um nome só para cada ação, contraste forte, cores fixas, números alinhados (`tabular-nums`), nada pula no celular (`100dvh`) e conferir antes de mexer. O resto da skill **não** serve (é para sites de propaganda; proíbe emoji em botão, pede React/Tailwind e fontes da internet) — **não instale a skill inteira**. Também avaliadas e descartadas: OmniRoute (manda o trabalho para robôs desconhecidos e mais fracos; o reserva do projeto é o ChatGPT), Claude Mem e Task Observer (o PASSAGEM e o `INICIO_NOVA_CONVERSA.txt` já fazem isso para os dois assistentes), Headroom, Awesome Design e Image to Code. Playwright já é usado nos testes.
- **Onde:** `AGENTS.md` seção 4.1; `docs/INICIO_NOVA_CONVERSA.txt` itens 1 e 13.
- **Como foi testado:** `testes/rodar.js` (os apps não mudaram).
- **Para continuar:** usar a lista de 16 itens na revisão da escala à mão (pendência da seção 6).

### 2026-10-12 — Documentação — arquivo de continuidade para conversas novas — Claude
- **O que mudou e por quê:** o dono pediu todas as regras de continuidade num arquivo de texto, para começar uma conversa nova (Claude ou ChatGPT) sem perder nada. Criado `docs/INICIO_NOVA_CONVERSA.txt` (mensagem para colar, jeito de falar com o dono, estado atual, rotina, como fazer versão, testes, Git/PR/assinatura, manuais, privacidade, regras de negócio, mapa rápido, armadilhas e pendências). `AGENTS.md`: regra da liderança atualizada (modo Por turno e CPD) e passos na ordem atual; `CLAUDE.md` e `README.md` apontam para o arquivo novo.
- **Ajuste na revisão (pedido do dono):** as regras mandavam reconhecer o PR do Claude pelo branch `ccr-…`, mas o branch do Claude muda de conversa para conversa (ex.: `claude/…`). Agora `AGENTS.md`, `docs/CHATGPT_COPILOTO.md` e o arquivo novo mandam reconhecer pelo **título** (`[Claude]` / `[ChatGPT]`) — assim o ChatGPT não deixa de ver um PR do Claude e não mexe no mesmo app ao mesmo tempo.
- **Onde:** `docs/INICIO_NOVA_CONVERSA.txt` (manter atualizado no mesmo PR de cada mudança, como o PASSAGEM).
- **Como foi testado:** `testes/rodar.js` (nada mudou nos apps).
- **Para continuar:** pendências no item 13 do arquivo novo e na seção 6 daqui.

### 2026-10-12 — Setores V244 — alerta de folgas por horário enxuto — Claude
- **O que mudou e por quê:** revisão da V243 do ChatGPT (PR #39). Numa escala gerada com os dados fictícios da Frente de Loja (50 pessoas) o cartão mostrava 61 avisos e tinha ~10 mil px de altura — no feriado quase todos folgam, e 2 pessoas de folga num horário de 20 também viravam aviso. O dono aprovou os ajustes: tirar a folga no feriado da conta, avisar só quando mais da metade do horário folga (inclui ninguém trabalhando) e mostrar um resumo curto, depois dos números do mês, com os detalhes fechados.
- **Onde no código:** no próprio bloco `/* ═════ V243 … ═════ */` (V244 mexeu nele): `nomesStatus` sem `ffol`; `auditar` conta o total de pessoas ativas por horário (`total`) e só devolve o grupo quando `k>=2 && k*2>n` (com `total` e `ficam`); `desenhar` monta um `.pm-card` com `<details class="v244-det">` e o coloca logo depois do 1º `.pm-card` (números do mês).
- **Como foi testado:** `testarFolgasHorarioEnxuto` (posição do cartão, feriado fora, cartão curto na escala normal, 2 de 5 não avisa e 3 de 5 avisa dizendo que ficam 2) + o teste da V243 do ChatGPT continua passando. Suítes rápida e completa.
- **Para continuar:** o Manual da Escala de Setores ganhou o cartão “Folgas por horário” no passo Gerar.

### 2026-10-12 — Escala de Setores V243 — alerta de folgas no mesmo horário — ChatGPT
- **O que mudou e por quê:** após o relato da usuária testadora, o resumo do mês passa a listar datas de segunda a sábado com duas ou mais pessoas ativas, de horário de trabalho idêntico, de folga na mesma data. O aviso mostra data, setor, horário, quantidade, nomes e motivo da folga.
- **Onde no código:** camada final `/* ═════ V243 — ALERTA INFORMATIVO DE FOLGAS NO MESMO HORÁRIO ═════ */`; `window.v243FolgasHorario.auditar` agrupa as folgas vistas por `statusDiaSet` e horário normalizado; `window.renderPainelMes` é embrulhada para inserir o cartão sem alterar a auditoria nem a escala. Não cria dado persistente.
- **Como foi testado:** teste novo `testarFolgasMesmoHorario` em `testes/rodar.js`: dois horários diferentes no mesmo dia, terceira pessoa do mesmo horário, redução para uma pessoa e preservação das folgas. A suíte automática do GitHub será conferida na PR; resultado pendente nesta passagem.
- **Para continuar:** revisar visualmente o cartão no celular e confirmar os Checks da PR. O alerta cobre folgas fixas, DSR, compensatórias e folgas em feriado de segunda a sábado; domingos ficam fora porque têm escala própria. Atualizar o Manual da Escala de Setores (hoje V242) após a revisão. — ChatGPT

Modelo de entrada:
```
### AAAA-MM-DD — <App Vnnn ou "Documentação"> — <título curto> — <Claude|ChatGPT>
- **O que mudou e por quê:** …
- **Onde no código:** bloco /* ═════ Vnnn ═════ */, funções …, chaves localStorage …, campos do histórico …
- **Como foi testado:** npm test (resultado), check do GitHub, teste manual …
- **Para continuar:** o que ficou faltando, ideias, cuidados.
```

### 2026-10-12 — Setores V242 + Encarregados V173 — sem Equipe.txt na tela — Claude
- **O que mudou e por quê:** o dono percebeu que o “Guardar histórico do mês” já leva a equipe inteira (Setores: quadro da loja desde a V219; Encarregados: `equipe`), então o Equipe.txt virou repetição. Saíram da tela a caixa do Equipe.txt e o “Baixar Equipe.txt”; o passo Equipe ganhou “📂 Abrir histórico guardado” (e, nos Encarregados, “📥 Planilha do RH”, que abre `v134Fonte.abrirModal`). Textos de aviso sem citar o Equipe.txt.
- **Onde no código:** bloco `/* ═════ V242|V173 — SEM EQUIPE.TXT NA TELA ═════ */` (igual nos dois apps): botão `[data-v242hist]`; o `#arquivoProjetoJSON` passa a aceitar .txt/.csv e, num listener de captura, repassa o arquivo ao `#arquivoTxt` com `DataTransfer`.
- **Como foi testado:** `testarSemTxt` no `testes/rodar.js` (os dois apps): caixa e botão escondidos, o botão novo aparece, um Equipe.txt fictício abre pelo histórico, e (Encarregados) a “📥 Planilha do RH” abre a janela do local da planilha. Suítes rápida e completa.
- **Para continuar:** o APK antigo com `Android.lerEquipe/salvarEquipe` continua igual (não mexi). Manual da Escala de Setores atualizado para a V242 (passo 1 sem Equipe.txt e com a data de admissão; ③ com o modo “Por turno” e o “Se faltar, entra”; quadro do “Por cargo”; 4 prints novos com dados fictícios).

### 2026-10-12 — Setores V241 — liderança por turno (Frente de Loja, Mercearia, CPD) — Claude
- **O que mudou e por quê:** o dono contou os cenários reais. Frente de Loja: Encarregado (abertura) + Sub (fechamento), ou Sub + Sub. Mercearia: Enc + Enc, Líder + Enc, Enc + Sub. CPD: Enc + Preparador de dados, Sub + Preparador ou 2 Preparadores — sempre 1 na abertura e 1 no fechamento. Nenhum modo antigo cobria isso: o “1 Encarregado + 1 Sub” proíbe Sub + Sub, e o “Várias” não olha o turno.
- **Onde no código:** `liderTurno()` / `definirLiderTurno(on,ab,fe,comp)` / `turnoLider(i)` (localStorage `escalaSetores.liderTurno`, por setor); `liderVarias`, `qtdLiderVarias`, `modoLideranca` e `definirModoLideranca` sabem do modo; botão “Por turno” em `htmlModoLider`; `calcularSugestaoLideranca` com o ramo por turno; meta 🌅/🌙 + “Se faltar liderança no turno, entra:” em `renderLiderancaVarias`; aviso em `atualizarAvisoLideranca`; `p.config.liderTurno` no histórico. Bloco `/* ═════ V241 … ═════ */`: linhas ⭐ do “Por cargo” e o embrulho de `metasFuncaoUsuario`, que soma +1 do cargo escolhido (`comp`) no turno que ficou sem liderança (motor, auditoria e conferência usam essa função).
- **Como foi testado:** `testarLiderTurno` no `testes/rodar.js` — Frente de Loja (sugestão 1 + 1 por turno, sem 3 seguidos) e um CPD fictício novo (`testes/dados/setores_cpd_6.txt`): motor gerando com Enc + Sub, Enc + Preparador e 2 Preparadores, sempre 1 + 1.
- **Para continuar:** o “Se faltar, entra” só vale no modo de cobertura “Por cargo” (é ele que usa `metasFuncaoUsuario`). Manual da Escala de Setores: seção Domingos precisa do modo “Por turno”.

### 2026-10-12 — Setores V240 — “Por cargo” com as lideranças — Claude
- **O que mudou e por quê:** o dono explicou que, no “Por cargo”, a pessoa escolhe quantas lideranças trabalham e quantos de cada cargo operacional. Antes a quantidade de lideranças ficava só no ③ “Quem lidera” (botões Uma só / 1+1 / Várias e a meta), longe do quadro dos cargos, e o total dizia “+ liderança (definida pela gerência)”.
- **Onde no código:** bloco `/* ═════ V240 … ═════ */`: `v240LinhaLider()` (linha ⭐ Lideranças, chamada dentro de `renderConfigFuncao`) e `v240QtdLider()` (uma = 1, encsub = 2, várias = `qtdLiderVarias()`). O − / + usa `definirLiderVarias` / `definirLiderancaUnica` (o mesmo dado do ③). `renderLiderancaDomingo` foi embrulhada para redesenhar o quadro do “Por cargo”. Texto da opção e do `#coberturaResumo` (em `atualizarModoCobertura`); exemplo CPD com id `v240ExGrupos`, só no modo Grupos.
- **Como foi testado:** `testarPorCargo` no `testes/rodar.js`: a linha existe, o total conta as lideranças, 1 = “Uma só”, + vira “Várias”, e mudar a meta no ③ atualiza o quadro. Suítes rápida e completa.
- **Para continuar:** o motor ainda não usa esse número para escolher lideranças sozinho — os nomes vêm do ③ (à mão ou 🤖 Sugerir liderança, que usa a meta). O Manual da Escala de Setores (seção Domingos) precisa citar a linha ⭐ Lideranças.

### 2026-10-12 — Setores V239 + Encarregados V172 — data de admissão editável (dd/mm/aaaa) — Claude
- **O que mudou e por quê:** o dono não conseguia pôr a data de admissão no Editar equipe e pediu o formato dd/mm/aaaa nos dois apps. No Setores o campo era só leitura e mostrava `AAAA-MM-DD`; nos Encarregados o campo nem existia.
- **Onde no código:** funções globais `admissaoBR` / `admissaoISO` e a máscara do campo `.ed-admissao` (bloco no `</head>`, igual nos dois apps; estilo `.adm-erro`). Setores: `renderEditorRows` e o cartão da V45, `coletarEquipeEditor` (valida e leva `admissao`), o salvar (`existente.admissao`, pessoa nova) e `equipeTextoDosDados`. Encarregados: `renderEditorRows`, `upgradeEmployeeEditor`, `coletarEquipeEditor`. **Defeito antigo corrigido no Setores:** o snapshot `escalaSetores.v64.state` guardava a equipe sem admissão/ERP e a restauração montava só 9 colunas — agora guarda e remonta as 14 colunas.
- **Como foi testado:** `testarAdmissao` no `testes/rodar.js` (Setores ≥ V239, Encarregados ≥ V172): o campo aceita digitação, `05031998` vira `05/03/1998` e fica `1998-03-05`, reabrir mostra `05/03/1998`, `31/02/2015` é recusada e a data continua depois de recarregar a página. Suítes rápida e completa ✅.
- **Para continuar:** os manuais (Claude Docs) citam a data de admissão na seção Equipe.

### 2026-10-12 — Encarregados V171 — passos iguais aos do Setores — Claude
- **O que mudou e por quê:** o dono pediu os mesmos passos nos dois apps: Equipe → Mês passado → Domingos → Feriados → Gerar. O “Mês” dos Encarregados saiu da barra e virou **📅 Mês e opções** (o app já escolhe o mês seguinte sozinho; o resto é opcional), igual ao ⚙️ Configurações do Setores.
- **Onde no código:** botão do índice 1 com a classe `mes-step-oculto`; barra de baixo (Próximo/Voltar e o rótulo) pula o índice 1; aviso `#v171Mes` no topo do Mês passado; item “Mês e opções” no menu ⋮ (bloco `/* ═════ V171 … ═════ */`). Textos: “passo 2 (Mês)” → “📅 Mês e opções”; 3→2, 4→3, 5→4, 6→5.
- **Como foi testado:** `testes/rodar.js` confere a ordem nos dois apps e que “Próximo” vai da Equipe ao Mês passado e o “📅 Mês e opções” abre o mês e volta. Suítes rápida e completa ✅. Captura no celular.
- **Documentação:** o dono decidiu que os manuais (Claude Docs) passam a ser atualizados pelo Claude. O Manual do Encarregado foi reescrito para a V171 (prints novos de uma simulação de nov/2026 com dados fictícios), o Roteiro do Beta foi para a V171 (+2 cenários: domingos à mão e app no celular) e foi criado o Manual da Escala de Setores (V238). Links na seção 1.

### 2026-10-12 — Setores V238 — mês passado antes dos domingos — Claude
- **O que mudou e por quê:** o dono pediu a ordem “Equipe → Mês passado → Domingos → Feriados → Gerar” também no Setores (igual à V170 dos Encarregados): o mês passado decide quem pode trabalhar no 1º domingo, e a auditoria ao vivo da escala à mão usa esse dado.
- **Onde no código:** botões e painéis reordenados (índices: Mês passado 2, Domingos 3, Feriados 4); `ir:` de `destinoConformidade`; os dois `labels` da barra de baixo; `v45GotoStep` do “usar arquivo como mês passado” e do `v206IrParaManual`; atalho “Carregar mês passado” (`.step[data-step="2"]`); slides do passo a passo de 1 minuto; lista da Ajuda e “Por onde começar?”. Números nos textos: 2→3, 3→4, 4→2, fora do comentário de histórico.
- **Como foi testado:** `testes/rodar.js` acha o passo Domingos pelo painel (`coberturaCard`) e confere a ordem nova. Suítes rápida e completa ✅.
- **Junto (passagem):** o diário foi reordenado (mais novo primeiro) e o “Modelo de entrada” foi para o topo da seção 5 — achados da revisão de documentação de 12/10.

### 2026-10-12 — Encarregados V170 — mês passado antes dos domingos — Claude
- **O que mudou e por quê:** o dono pediu a ordem “Equipe – Mês – Mês passado – Domingo – Feriados – Gerar”. Faz sentido: quem trabalhou nos 2 últimos domingos do mês passado decide quem pode trabalhar no 1º domingo (3 domingos seguidos), então ele vem antes de montar os domingos.
- **Onde no código:** os botões do passo e os painéis foram reordenados; o índice interno é a posição (Mês passado 2, Domingos 3, Feriados 4, Gerar 5). Atualizados os `ir:` (Conformidade, “O que falta”, marcos do Início) e os `v80GotoStep` (busca do Mês passado, atalhos da escala à mão). Números nos textos: 3→4 (Domingos), 4→5 (Feriados), 5→3 (Mês passado), fora do comentário de histórico.
- **Como foi testado:** `testes/rodar.js` confere a ordem nova e acha o passo Domingos pelo painel (não pelo número). Suítes rápida e completa ✅.

### 2026-10-12 — Encarregados V169 — domingos antes dos feriados — Claude
- **O que mudou e por quê:** o dono pediu que “a escala de domingo venha antes do feriado” na versão Encarregados. Agora os passos são 1 Equipe · 2 Mês · **3 Domingos** · 4 Feriados · 5 Mês passado · 6 Gerar (a mesma ordem do Setores: Domingos antes de Feriados). O passo 3 tem o “① Quem monta os domingos?” e os cartões da escala à mão (antes no Gerar). No Automático, ele explica que o app monta ao gerar e, depois de gerar, lista quem trabalha em cada domingo. No Gerar fica um resumo com o atalho “Ver ou mudar no passo 3”.
- **Feriados depois dos domingos:** quem foi marcado à mão num domingo não pode ser escalado no feriado que cai na folga (DSR) desse domingo (embrulho de `bloqueioFolgaFeriado`) — antes isso só aparecia depois de gerar.
- **Onde no código:** botão do passo com `data-step="2"` agora aponta para `#domingosEtapa`; tirados os dois “pulos” do índice 2 (`gotoStep` e `updateBottomBar`); números dos passos nos textos trocados só fora do comentário de histórico (3→4, 4→5, 5→6). Camada V167 com linhas `// V169` (`resumoAuto`, `resumoGerar`, `bloqueioFolgaFeriado`).
- **Como foi testado:** `testes/rodar.js` — a escala à mão abre no passo 3; nova conferência da ordem dos passos e do bloqueio do feriado 15/11/2027 (segunda) para quem foi marcado à mão no domingo 14/11; o teste antigo só clica no passo “Grupos” se ele ainda existir. Suítes rápida e completa ✅. Capturas no computador e no celular.
- **APK (V237/V168):** o dono confirmou que salvar dentro do APK e no navegador está funcionando e testado.

### 2026-10-12 — Setores V237 + Encarregados V168 — salvar arquivos dentro do APK (ApkForja) — Claude
- **O que mudou e por quê:** o dono transformou o link em APK (ApkForja V41, modo site) e, ao guardar o histórico, o Android mostrou “Nenhum aplicativo para abrir: blob:https://jottacostta.github.io/…”, enquanto o app dizia “guardado na pasta Downloads”. Causa: o WebView não baixa `blob:`; o ApkForja só conserta isso injetando a ponte em HTML empacotado, não no modo site. Os apps agora usam a ponte direto (`Android.salvarArquivo`) quando ela existe; sem ponte num WebView, avisam em vermelho e o lembrete do histórico não fica verde. Vale para todos os downloads: histórico do mês, Excel, backup (Encarregados), Equipe.txt e relatório do ano (Setores).
- **O que o dono precisa fazer no ApkForja:** etapa Arquivos → 🌐 Site → marcar **“🔌 Permitir que o site use os recursos do Android”** (o site é dele) → gerar o APK de novo (mesmo pacote e mesma chave, para atualizar por cima sem perder os dados).
- **Onde no código:** bloco `/* ═════ V237 — SALVAR ARQUIVOS DENTRO DO APK … ═════ */` no fim do Setores e `V168` no Encarregados (mesmo código); gancho `window.V237Apk` / `window.V168Apk` = `{temPonte, ehWebView}`. Junto: os comentários `'+new+'` do Setores V236 viraram “V236”.
- **Como foi testado:** novo `testarApk` em `testes/rodar.js` (nos dois apps): com uma ponte simulada o arquivo chega inteiro (nome, tipo e conteúdo com acento) e não vira download do navegador; num WebView sem ponte aparece “NÃO foi salvo”; no navegador comum o download continua igual. Fora da suíte: botão real “Guardar histórico do mês” e Excel do Encarregados com e sem ponte (lembrete continua “falta guardar” sem ponte). Suítes rápida e completa ✅.
- **Para continuar:** se o dono gerar o APK como HTML empacotado (não site), a ponte do ApkForja também funciona — a camada usa a mesma função. Abrir arquivo (input file) dentro do WebView depende do `onShowFileChooser` do molde do ApkForja; não foi testado no aparelho.

### 2026-10-12 — Encarregados V167 — escala à mão nos domingos (mesmos critérios do Setores) — Claude
- **O que mudou e por quê:** o dono pediu “uma versão de escala manual para a versão encarregados seguindo os mesmos critérios da versão setores”. No passo 5 entrou “① Quem monta os domingos?” (🤖 Automático / ✋ À mão / 🤝 Misto, os mesmos cartões da V206 do Setores) e, no À mão/Misto, um cartão por domingo com o que o Setores tem na escala à mão:
  - busca por matrícula ou nome com Enter (V207); lista separada por função (V226); filtros Ordenar e Função por cartão (V222/V223); “Mostrar: Todos | Só os escalados” (V215); ↻ Copiar o domingo anterior, pulando o balanço e quem cairia no 3º domingo seguido (V213);
  - 💡 Sugestão do app com “Outra sugestão” (V233–V235) — aqui ela usa o **mesmo cálculo do automático** (`escolherDomingo` original), então a divisão dos domingos fica igual à do automático;
  - folga antes/depois do domingo e a folga fixa no próprio cartão (V223/V225); quantos domingos a pessoa já tem no mês (V217);
  - 🛡️ Conferência ao vivo com 🔴/🟡 e selo por domingo, e bloqueio na hora de marcar com o motivo (V227/V228);
  - afastados e férias escondidos da lista (V230); quem tem folga fixa no domingo aparece em cinza.
  - Específico dos Encarregados: as regras são as do motor (3 pessoas, 1 Enc + 1 Sub, setores diferentes, 3 domingos seguidos contando o mês passado e o balanço; folga do domingo caindo num feriado trabalhado); quando o domingo já tem 3 pessoas, o cartão mostra só as 3 (a lista de 30 nomes cinza não ajudava); 📌 no 1º domingo, “Usar estas pessoas” coloca quem o app já tinha previsto no mês passado (as folgas antes desse domingo já foram avisadas).
- **O que ficou de fora de propósito:** a janela “☑️ Escolher na lista” do Setores (lá são até 120 pessoas; aqui o próprio cartão já mostra as ~30); escolha do horário de domingo (os Encarregados não têm horário de domingo no app); 6×1 na conferência (com a folga antes e depois de cada domingo trabalhado não dá para passar de 6 dias — conferido no código; `validarEscala` continua conferindo depois de gerar).
- **Onde no código:** veja o mapa técnico (seção 3, “Escala à mão (V167)”). Corrigido junto: dois comentários da V166 tinham saído com o texto do script (`'+new+'`) no lugar de “V166” (no Setores V236 também — pendência na seção 6).
- **Como foi testado:**
  - `testes/rodar.js`: novo `testarEncManual` (roda da V167 em diante): cartões, Gerar bloqueado com domingo vazio, pessoa do mesmo setor recusada (na tela e direto), busca por matrícula + Enter, 3 meses seguidos montados só pela 💡 sugestão (um com domingo de balanço) e gerados iguais ao que foi marcado, 📌 previsão, ↻ copiar sem 3º domingo seguido, folga “Domingo” no cartão, 🤝 Misto, memória depois de recarregar e campo `escalaMao` no histórico. O verificador independente dos Encarregados virou a função `verificarEnc` (o mesmo do automático).
  - suítes rápida e completa ✅;
  - equipe real (local): 12 meses (nov/2026 → out/2027), 53 domingos só pela sugestão, 0 regras quebradas, todos os meses “pronta”, e a mesma quantidade de domingos por pessoa do automático; cálculo da sugestão 10–45 ms por domingo.
- **Para continuar:** ideias na seção 6.

### 2026-10-12 — Setores V236 + Encarregados V166 — ícones coloridos iguais em qualquer aparelho — Claude
- **O que mudou e por quê:** o dono pediu “ícones bonitos”. Primeiro foram testados desenhos em linha e depois desenhos “cheios em dois tons”. Vendo uma captura, **o dono escolheu o estilo colorido do Noto Emoji** (o das figuras do Google), dentro de um quadrado azul-claro nos cartões dos setores.
  - Como cada aparelho desenha emoji de um jeito (Windows, iPhone, Android), as figuras do Noto foram **embutidas no próprio arquivo**: WebP 72 px em base64, ~150 KB no Setores e ~100 KB no Encarregados.
  - Ficam iguais em qualquer aparelho e funcionam sem internet.
  - Licença: Apache 2.0 (© Google), com o crédito no comentário do bloco.
- **Onde no código:**
  - bloco `/* ═════ V236 — ÍCONES COLORIDOS … ═════ */` (V166 no Encarregados) e CSS `#V236-icones` / `#V166-icones`;
  - uma camada troca o emoji por `<img class="gb-ic">` sem mexer nas palavras e vigia os redesenhos (`MutationObserver`);
  - a camada antiga de ícones em linha (V205, botões e menu) continua, mas deixou de mexer nos cartões dos setores (`.home-card`).
- **Ficaram como emoji de propósito:**
  - as etiquetas que o app compara pelo texto (`.v217-tag`, `.v217-alerta`, `.v222-t`, `.v226-fn`, `.v227-st`);
  - a lista de nomes de cada domingo (`.dom-funcs`, milhares de linhas, para não pesar);
  - campos e listas de opção.
- **Junto (Setores):** “Aceitar” as sugestões reaproveita a auditoria anterior: uma conferência por pessoa, não duas.
- **Depois (pedido do dono: “ícones coloridos com desenhos vivos” e “logo do Guanabara completo”):**
  - a camada antiga de ícones em linha (V205, função `iconizar`) foi **desligada** (`return;` no começo). Agora botões, menu ⋮ e barra do topo usam as figuras coloridas;
  - o `MAPA` passou a cobrir **todos** os emojis dos apps (100 figuras; apelidos: ↻/↺ → 🔄, ✚ → ➕, ★ → ⭐). Setas de texto (→ ← ↓) e marcas pequenas (✓ ✕) ficam como texto;
  - **logo:** a imagem embutida (`img.brand-logo`, 420×214) tinha a ponta de baixo do triângulo amarelo cortada desde a V150. Não havia o original no repositório. A ponta foi **reconstruída** (as duas bordas prolongadas até se encontrarem, com o mesmo amarelo e o mesmo chanfro 3D), e a imagem nova tem 420×276. CSS: `.top-header .brand-logo` e `.home-top .v202-logo` um pouco mais altos. **Se o dono mandar o arquivo original do logo, troque a imagem pelo original.**
- **Como foi testado:**
  - teste novo em `testes/rodar.js` nos dois apps (figuras presentes e nenhuma quebrada);
  - suítes rápida e completa ✅;
  - capturas de tela no computador e no celular;
  - planilha real (local): tempo de sugerir/aceitar na Frente de Loja igual ou melhor que na V235.
- **Teste:** `testes/rodar.js` também confere o logo completo (altura/largura > 0,6).
- **Para trocar/acrescentar figura:** as figuras vêm de `googlefonts/noto-emoji`, pasta `2D/png/72/emoji_uXXXX.png`, convertidas para WebP (qualidade 88). Com isso, monte o `IMG`/`MAPA`.

### 2026-10-12 — Documentação — regra de ouro de UX/UI — Claude
- **O que mudou e por quê:** o dono pediu que o app seja fácil de entender **como se fosse usado por uma criança de 10 anos aprendendo informática**. Isso virou regra para os dois assistentes: a seção **4.1 do `AGENTS.md`**, um checklist de 10 itens para conferir antes de todo PR que mexe em tela. Está repetida no `CLAUDE.md` e no texto de colar do ChatGPT.
- **Para continuar:** ao mexer numa tela, passe o checklist. A pendência de revisar as telas atuais está na seção 6.

### 2026-10-12 — Setores V235 — simulação de estresse das sugestões: horário, composição e 2 defeitos antigos da escala à mão — Claude
- **O que mudou e por quê:** o dono pediu uma simulação de estresse das sugestões da escala à mão. Com a planilha real (local), cada domingo foi preenchido só por sugestão, 3 meses seguidos, em todos os setores. Achados:
  - (1) **quem entrava pela sugestão ficava SEM horário de domingo** e o “Gerar” bloqueava. O teste da V233/V234 só olhava regra 🔴, e “sem horário” é 🟡. Corrigido: `horarioPadraoSugestao(d,i)` dá o horário oficial mais perto do habitual, no turno (regra da V209);
  - (2) **no Açougue a sugestão ignorava a composição** (açougueiros e balconistas por turno). Corrigido: em `candidatosDoDia`, quem completa o que falta (`coberturaOperacional`) entra primeiro;
  - (3) **defeito antigo — Açougue 13 × 11:** a escala à mão pedia `alvoCoberturaAtual()` = 13, mas `coberturaOperacionalAçougue` exige exatamente 11, e o motor também usa 11 (regra V102: “11 operacionais + 1 liderança”). Nenhuma escala à mão do Açougue passava. Corrigido: `alvoCoberturaAtual()` devolve 11 no Açougue (modo “metade”);
  - (4) **defeito antigo — “Gerar” da escala à mão:** comparava a escala com `alvosPorDomingo` (alvo variável do motor, ex.: 19 num domingo e 16 noutro) e bloqueava escalas certas com “18 de 19 pessoas” (Depósito, Tesouraria, Padaria). Corrigido: na escala à mão não se compara mais com o alvo do motor, porque a quantidade do cartão já foi conferida em `auditarSelecaoAntesDaGeracao`.
- **Casos difíceis (todos ✅):** marcados à mão continuam; tirar 2 e pedir de novo enche só as 2 vagas; lista desatualizada; duplo clique em Aceitar; modo Misto; setor de 4 pessoas.
- **Onde no código:**
  - bloco V233 com linhas `// V235` (`horarioPadraoSugestao`, `candidatosDoDia`, aceite);
  - `alvoCoberturaAtual()` (Açougue = 11);
  - no motor, a linha `if(esc.length<alvoDia && … modoGeracaoAtual!=='manual')`.
- **Testes novos:**
  - “quem entra pela sugestão já vem com horário de domingo válido”;
  - “mês inteiro preenchido só com sugestões e o Gerar aceita”.

  Os dois **falham na V234** (conferido) e passam na V235.
- **Simulação (planilha real, local):**
  - 14 setores × 3 meses (nov/2026 → jan/2027), 196 domingos preenchidos só por sugestão, 392 cliques, 0 erros de JavaScript;
  - nenhuma regra quebrada, nenhum nome repetido, nenhum não operacional, nenhum 3º domingo seguido (conferência independente, contando o mês passado);
  - virada do mês OK: o mês seguinte herda quem trabalhou o último domingo;
  - depois das correções, Açougue, Depósito, Tesouraria, Padaria e Mercearia: “validada e gerada” nos 3 meses;
  - Manutenção e ADM Geral continuam bloqueados por falta de gente apta (aviso legítimo, já conhecido).
- **Para continuar:** veja a pendência de velocidade (seção 6).

### 2026-10-12 — Setores V234 — sugestões da escala à mão: escolha entre 3 PRs e melhorias — Claude (V233 do ChatGPT, PR #31)
- **O que mudou e por quê:** o ChatGPT abriu três PRs com a mesma V233 (“💡 Sugestão de funcionários” em cada domingo da escala à mão): #29, #30 e #31. Os três tinham o teste do GitHub verde. O dono pediu limpeza e melhoria das ideias. Teste com a planilha real (loja recém-importada e com folgas definidas, Frente de Loja e Açougue):
  - **#29:** 0 sugeridos no Açougue e com folga “a definir”;
  - **#30:** 0 sugeridos em tudo;
  - **#31:** 77/77 e 13/13, sem regra quebrada.

  A #31 entrou neste PR (commits do ChatGPT preservados) e as três foram fechadas.
- **Por que #29/#30 falhavam:** comparavam o TEXTO dos avisos antes/depois. O aviso de cobertura do Açougue muda a cada pessoa (“0/3” → “1/3”) e virava “regra nova quebrada”. A #29 também pulava quem tem folga “a definir” (toda a loja logo após importar o ERP).
- **V234 (melhorias na #31):**
  - (1) só barra **regra quebrada (🔴) que cite a pessoa**, com a mesma classificação da auditoria ao vivo (`window.v227Pendente`, novo, exposto no bloco V227). Avisos 🟡 não barram. O aviso de 6×1, que não traz a data do domingo, agora barra. Nomes parecidos não se confundem (`cita`);
  - (2) mais rápida: a auditoria “antes” é feita uma vez por domingo e a conferência para em vagas + até 10 reservas (Frente de Loja ~3 s → ~1 s);
  - (3) no empate, quem tem folga fixa definida vem antes; “folga fixa a definir” aparece no candidato.
- **Onde no código:** bloco `/* ═════ V233 — sugestões de funcionários… ═════ */` com linhas `// V234` (`auditoriaCandidato`, `candidatosDoDia`, `renderSugestoes`, `window.v234Sugestoes`). No bloco V227: `window.v227Pendente`.
- **Testes:**
  - o teste da V233 aceitava “nenhum candidato” (por isso #29/#30 passavam) e agora exige candidatos;
  - novo: auditoria sem regra quebrada depois de aceitar;
  - novo: cobertura por função incompleta (simulada) não barra as sugestões.
- **Limpeza junto:** PRs #29/#30/#31 fechados; branches antigos do ChatGPT listados na seção 1 (não deu para apagar daqui); Node 22 no workflow; `testes/screenshots/` no `.gitignore` (a imagem fica como anexo da execução no GitHub).
- **Como foi testado:** suíte rápida e completa ✅; planilha real (local): Frente de Loja 77/77 e Açougue 13/13 em 3 domingos, 0 regras quebradas, 0 erros.
- **Para continuar:** veja a pendência de velocidade das sugestões (seção 6).

### 2026-10-11 — Setores V233 — sugestões na escala manual — ChatGPT
- **Objetivo:** reduzir o trabalho do gestor sugerindo funcionários por domingo, mantendo a decisão humana e a auditoria existente.
- **O que mudou:** adiciona um painel a cada cartão no modo Manual/Mista; gera candidatos ativos, aptos, não líderes, não escalados e sem folga fixa dominical; ordena pela menor carga de domingos considerada; permite aceitar candidatos marcados ou rejeitar sugestões sem alterar a escala.
- **Validação:** no aceite, o sistema revalida candidato por candidato com a função existente `auditarSelecaoAntesDaGeracao`, limita as inclusões às vagas restantes, evita duplicidade, preserva escolhas existentes e chama a auditoria ao vivo depois da inclusão.
- **Arquivos:** `Escala_de_Setores_V233.html`, `setores/index.html`, `versoes_anteriores/Escala_de_Setores_V232.html`, `testes/rodar.js`, `AGENTS.md`, `README.md`, `CHANGELOG.md` e esta passagem.
- **Teste:** foram adicionados testes de interface para o painel, geração e rejeição sem alterar seleções. A execução #150 do GitHub Actions passou na suíte rápida e na completa (12 meses). Logs confirmam painel, geração, aceite com elegibilidade/duplicidade, rejeição sem alteração e ausência de erro JavaScript.
- **Claude:** esta passagem e a descrição/comentário da PR registram o escopo, regras e pontos de revisão para continuidade pelo Claude. Não fazer merge sem autorização explícita do dono.

### 2026-10-11 — Setores V232 — versão visível e prevenção de regressão — ChatGPT
- **O que mudou e por quê:** a inspeção do HTML da V231 confirmou que o nome do arquivo e o histórico estavam em V231, mas o título da aba e o rodapé ainda exibiam V230. A V232 alinha ambos os textos ao número atual. A V231 é preservada em `versoes_anteriores/`.
- **Onde no código:** `Escala_de_Setores_V232.html`: `<title>`, `div.menu-version` e primeira linha do comentário `HISTÓRICO DE VERSÕES`; `setores/index.html` é cópia exata da V232.
- **Prevenção:** `testes/rodar.js` verifica separadamente título, rodapé e primeira entrada do histórico contra o número do nome do arquivo. `AGENTS.md` torna essa conferência obrigatória antes de abrir PR.
- **Documentação:** README, CHANGELOG e passagem de bastão atualizados com a nova versão e a armadilha descoberta.
- **Como foi testado:** GitHub Actions, execução #92, suíte rápida e completa passaram. O teste de empréstimo foi reforçado para simular Açougue → Padaria e validar explicitamente setor de destino, origem identificada, sinalização de empréstimo, status ativo e aptidão para a escala/domingo, além de contagens e persistência. Os checks serão executados novamente após esta ampliação.
- **Para continuar:** conferir os checks gerados por esta atualização da passagem e aguardar autorização explícita antes do merge. Assinado: ChatGPT

### 2026-10-11 — Setores V231 — funcionário emprestado entre setores — ChatGPT
- **Regra implementada:** EP continua como cadastro único no setor de origem; aparece lá como registro visual de empréstimo, fica fora da contagem disponível e não participa da escala de origem. O setor de destino recebe uma visão operacional derivada do mesmo cadastro, apta para a escala e incluída na contagem do destino. A matrícula não é duplicada em `todasEquipes`.
- **Editor e persistência:** ao selecionar EP, o editor exige o setor de destino e impede escolher o próprio setor de origem. O campo `SetorEmprestimo` é mantido no `Equipe.txt` e no quadro geral do histórico JSON. A V230 foi movida para `versoes_anteriores/Escala_de_Setores_V230.html`; `setores/index.html` aponta para a V231.
- **Onde no código:** `Escala_de_Setores_V231.html`, camada `v231-emprestimo-setores-js`, `equipeDoSetor()`, editor de equipe, parser/exportador do Equipe.txt e montagem/restauração do histórico.
- **Testes:** foi acrescentado teste de regressão para origem/destino, contagem e matrícula única. A validação automatizada do GitHub Actions ainda deve ser conferida no PR antes do merge.
- **Para continuar:** revisar o fluxo no celular e navegador, confirmar que a escala manual e automática aceitam o emprestado apenas no destino, validar importação/exportação de Equipe.txt e histórico após reload. **Não fazer merge sem autorização explícita do dono.** Assinado: ChatGPT

### 2026-10-11 — Setores V230 — filtro da escala manual — ChatGPT
- **O que mudou e por quê:** a lista de seleção manual/mista passa a exibir somente operacionais ativos. Lideranças reconhecidas por `ehLiderancaDomingo`, afastados (AF) e emprestados (EP) são ocultados; operacionais ativos com folga fixa no domingo continuam visíveis. O filtro atua apenas na renderização da lista, sem remover funcionários do cadastro nem alterar o motor.
- **Onde no código:** `Escala_de_Setores_V230.html`, na montagem de `cards` em `renderSelecaoDomingosGeracao()`; cópia publicada em `setores/index.html`.
- **Como foi testado:** teste de regressão V230 passou com dados fictícios. `npm test` e `npm run test:completo` passaram no GitHub Actions (execução 45, check “Testes” verde). A captura da lista manual foi guardada no artefato `capturas-setores-v230`.
- **Para continuar:** revisar a captura da lista manual e confirmar que a alteração não afeta a geração automática, o domingo de balanço, o histórico nem a persistência. A PR foi mesclada no `main` pela PR #26; o histórico acima descreve o estado daquela entrega antes do merge. Assinado: ChatGPT


### 2026-10-11 — Setores V229 — virada do mês no 6×1 e no feriado da segunda — Claude (investigação pedida pelo ChatGPT)
- **Resultado de cada item de `docs/PROPOSTAS_CORRECOES_AUDITORIA_V228.md`:**
  - **6×1 na fronteira do mês — CONFIRMADO e corrigido.** O domingo do mês passado era tratado como “não trabalhado” em 3 lugares: `trabalharBaseNaData` (motor), `auditarProtecao6x1` (Gerar) e `auditarProtecao6x1Simulada` (escala à mão). Junto veio um defeito na exceção do feriado da segunda: `feriadoFixaObrigatoria` lia `trabalhoDomingo[dAnterior.getDate()]`, e quando o feriado é na segunda **dia 1º** (01/05/2028, 01/01/2029) o domingo anterior é do mês passado. Assim a exceção valia para todos, e quem trabalhou o domingo e tem folga na segunda podia trabalhar o feriado e ficar 7 dias seguidos. Corrigido com `domingoForaDoMesTrabalhado`.
  - **Estado usado pelo bloqueio — melhorado.** O bloqueio comparava com `ultimo` (a última auditoria guardada), que podia estar velha depois de trocar de mês ou setor. Agora o “antes” é a auditoria SEM aquela marcação, calculada na hora (uma auditoria a mais por clique, 6–18 ms).
  - **`auditarDescansosSimulados` não acusa nada — NÃO é defeito.** É a antiga trava de capacidade de folgas por dia/turno, que virou meta (ver Armadilhas). Está vazia assim desde a V204.
  - **`domsDe` com data inválida ou de dia útil — não reproduz.** Todo aviso com data no início usa `formatarDataDomingo(d)` de um domingo da escala. O caso de outro mês/ano já é testado.
  - **Classificação 🔴/🟡 (P2) e custo das auditorias (P2):** sem mudança. A classificação segue a regex `PEND` (cobertura funcional = 🟡, porque se resolve marcando mais gente). Custo medido: 6–18 ms por auditoria.
- **Onde no código:** `domingoForaDoMesTrabalhado` (logo antes de `feriadoFixaObrigatoria`); linhas `// V229` em `feriadoFixaObrigatoria`, `trabalharBaseNaData`, `auditarProtecao6x1`, `auditarProtecao6x1Simulada` e no bloqueio do bloco V227; bloco `/* ═════ V229 ═════ */` no fim.
- **Como foi testado:**
  - novo teste "virada do mês" em `testes/rodar.js` (maio/2028). Ele **falhava na V228** (folga da segunda "livre" para quem trabalhou 30/04; 6×1 não acusava 30/04–06/05) e passa na V229;
  - suíte rápida e suíte completa ✅;
  - dados reais (só local): abril → maio/2028 nos 14 setores, V228 e V229 geram a mesma escala, 0 erros. Na planilha real ninguém tem folga fixa na segunda, então o defeito ainda não tinha atingido a loja.
- **Para continuar:** as propostas de estresse (seção 6). O verificador independente de 6×1 para a escala GERADA ainda não existe no `rodar.js`. A conferência da virada usa as funções do app, com dados forçados.

### 2026-10-11 — Documentação — proposta de correções para auditoria V228 — ChatGPT
- **O que mudou e por quê:** criado `docs/PROPOSTAS_CORRECOES_AUDITORIA_V228.md` com hipóteses técnicas, referências de código, prioridades e critérios de aceitação para a auditoria ao vivo.
- **Escopo deliberado:** não altera o HTML nem regras de negócio; os achados precisam ser reproduzidos antes de corrigir.
- **Para quem continuar:** Claude é o responsável por investigar e implementar as correções, atualizar testes/versão se necessário, revisar os checks e decidir/executar o merge no `main`. Este PR não deve ser tratado como autorização para o ChatGPT integrar código do aplicativo.
- **Como foi testado:** revisão estática do código V228 e dos testes existentes; os testes automatizados não foram executados neste PR.
- **Para continuar:** seguir a ordem P1/P2 e os critérios de aceitação do documento. Assinado: ChatGPT

### 2026-10-11 — Documentação — propostas de teste de estresse (Setores) — ChatGPT (PR #22), registrado pelo Claude
- **O que mudou e por quê:** o ChatGPT criou `docs/PROPOSTAS_ESTRESSE_SETORES.md`, uma lista de testes que valeria acrescentar, em ordem de prioridade:
  - regras: 6×1 atravessando o mês, domingos seguidos e balanço, feriados e prazo de 20 dias;
  - limites: equipe inviável, nomes parecidos, auditoria ao vivo;
  - histórico: salvar, restaurar e reimportar;
  - conferências negativas e "testes de mutação".
  Só documento: nenhum teste novo ainda e o app não mudou. O PR saiu sem entrada aqui porque este arquivo ainda não estava no `main`; o Claude registrou depois do merge.
- **Como foi testado:** check "Testes" ✅ no PR.
- **Para continuar:** veja a pendência "Transformar as propostas em testes" (seção 6).

### 2026-10-11 — Documentação — passagem de bastão — Claude (PR #21)
- **O que mudou e por quê:** o dono pediu que toda mudança fique explicada para o outro assistente continuar. Foram criados este arquivo e a regra 10 do `AGENTS.md`. O `testes/rodar.js` agora confere se este arquivo cita a versão atual de cada app.
- **Para continuar:** em toda mudança, siga "Como atualizar" no topo deste arquivo.
- O texto que o dono cola no ChatGPT está na Parte 2 do `docs/CHATGPT_COPILOTO.md`. Se o ambiente não rodar os testes, vale o check "Testes" do PR.

### 2026-10-11 — Documentação — regra de assinatura — Claude (PR #20)
- **O que mudou e por quê:** seção 9 do `AGENTS.md`: cada um assina tudo como Claude ou ChatGPT:
  - título do PR: `[Claude]` ou `[ChatGPT]`;
  - linha `Assinado:` no commit e no PR;
  - `— *Nome*` no CHANGELOG;
  - `Vnnn [Nome] —` no HISTÓRICO DE VERSÕES.

### 2026-10-11 — Setores V228 — auditoria ligada ao domingo certo + testes no GitHub — Claude, com ideias do ChatGPT (PR #19)
- **O que mudou e por quê:**
  - Na V227, só os avisos que começavam com a data acendiam o selo de um domingo, e a ligação usava só o dia.
  - Agora, a função `domsDe` (no bloco V227, exposta como `window.v228DomsDe`) liga cada aviso ao domingo certo:
    - data no início, só se for do mês da escala;
    - período `dd/mm/aaaa a dd/mm/aaaa`, usado pelo aviso de 6×1;
    - sem data: os domingos em que a pessoa está marcada.
  - `auditarProtecao6x1Simulada` passou a escrever o período.
  - "Folga fixa a definir" virou um aviso por domingo, com a data (ideia do ChatGPT).
  - O bloqueio usa `cita()` para não confundir nomes parecidos.
- **Testes:**
  - corrigida a conferência tautológica do quadro no histórico (achado do ChatGPT);
  - nova conferência "auditoria ligada ao domingo certo";
  - novo workflow `.github/workflows/testes.yml`.
- **Como foi testado:** suíte rápida e suíte completa ✅ local e no GitHub.

### 2026-10-11 — Setores V227 — auditoria ao vivo na escala à mão/mista — Claude (PR #18)
- **O que mudou e por quê:**
  - A cada marcação, `auditar()` roda `auditarSelecaoAntesDaGeracao`, com `preencherHorarioLiderancaManual` desligado temporariamente.
  - Os avisos são separados com a regex `PEND`: 🟡 "falta completar" contra 🔴 "regra quebrada".
  - Aparecem no painel `.v227-aud` e no selo `.v227-st` de cada domingo.
  - Uma marcação que cria aviso 🔴 com o nome da pessoa é desfeita na hora, com uma mensagem.
- **Para continuar:** regra nova → coloque em `auditarSelecaoAntesDaGeracao`. Se for "falta completar", e não regra quebrada, acrescente o texto na regex `PEND`.

### Versões anteriores (resumo)
- **V226:** escala à mão agrupada por função, com filtro "Função" por domingo.
- **V225:** folga fixa no cartão do domingo (`v225DefinirFolga`).
- **V224:** alinhamento dos cartões; liderança "escolhida em ③".
- **V223:** folga antecipada/posterior no cartão; filtros por cartão.
- **V222:** folga no domingo escolhida à mão (`v222DomManual`); menu ⋮ com rolagem.
- **V221:** todos os ativos aptos ao domingo.
- **V220:** tempo de serviço no histórico.
- **V219:** quadro da loja no histórico.
- **V218:** tudo que mostra número é clicável.
- **Encarregados:**
  - V166: ícones coloridos e logo completo;
  - V165: rolagem do menu;
  - V164: folga fixa bloqueia feriado;
  - V163: cartões clicáveis;
  - V162: sem passo Grupos.

O detalhe de cada versão está no `CHANGELOG.md`.

---

## 6. Pendências e ideias (atualize ao resolver ou criar)

- **Gabriel — pendências condicionadas a pedido do gerente:** ARH-04 (mês conflitante: vale o primeiro aberto); ARH-11 (aprendizado atrasado de 2,5 s); ARH-12 (`esc` conta cada marcação); ARH-08 (avisar quando o histórico não traz aprendizado); ARH-24 via `http://`; chat e “o que falta” ainda não explicam a confirmação V266; testar V267 com equipe fictícia de Açougue; concluir fases futuras da issue #68 conforme autorização.
- **Testes do Gabriel:** seguir a issue #78. Rodar no Chromium os dois apps da `main`, usar dados fictícios, calcular o esperado a partir do estado real do app, manter conjunto cego congelado, medir acerto/falsos positivos/alucinações e registrar versão, resultados e limites. A bateria de 66 perguntas da issue #68 é proposta/documentação até haver um relatório de execução.
- **Manuais (Claude Docs):** ainda não mencionam o Assistente RH, o chat, a prévia com domingos nem os horários V266/V267. O Claude mantém os manuais; o gerente decide quando atualizar.

- **Manutenção e ADM Geral** (dados reais) mostram aviso de capacidade no domingo. O aviso é legítimo: falta gente apta, não é defeito.
- **Encarregados — folga de feriado "sem data"** com o prazo de 20 dias: em meses com muitos feriados (ex.: outubro), algumas folgas ficam sem data possível. O app avisa. Com 30 dias (CLT) não acontece. Uma ideia seria sugerir automaticamente a troca de prazo.
- ~~GitHub Actions com Node 20~~ — trocado para **Node 22** na limpeza de 12/10/2026.
- ~~Investigar a auditoria ao vivo da V228~~ — **feito na V229** (resultado de cada item no Diário).
- **Promotores (V258):** regra definida na PR #51: 1 promotor por domingo no automático e na escala à mão em modo 50%; para escalar 2, usar “Por cargo”. Cartazista não trabalha domingo.
- **Transformar as propostas de `docs/PROPOSTAS_ESTRESSE_SETORES.md` em testes de verdade** em `testes/rodar.js`, uma prioridade por PR.
  - Comece pelos **testes de mutação**: quebrar uma regra de propósito (ex.: marcar o 3º domingo seguido direto nos dados) e conferir que o verificador acusa.
  - O `rodar.js` já tem um verificador independente das regras dos **domingos** (quem não pode trabalhar, liderança, pessoa repetida, 3 domingos seguidos) dentro de `testarSetores`/`testarEncarregados`. Os feriados, o 6×1 e as folgas compensatórias **ainda não** têm verificador próprio: são as lacunas de maior valor. Amplie o verificador existente, não crie outro.
  - Só crie versão nova do app se um teste achar um defeito.
- ~~V233 — revisão das sugestões~~ — feita: escolhida a #31, melhorada na V234 (ver Diário).
- ~~Manuais: quadro “📦 Domingos de balanço” (V246/V175)~~ — **feito em 13/10/2026** (texto + print fictício nos dois manuais; o Manual do Encarregado continua marcado V171 no resto — ver a pendência dele).
- **Desempenho — o que ainda pesa (V247):** (1) `preverPrimeiroDomingoSeguinteSetores` roda um `gerarSetoresCore` inteiro do mês seguinte (≈ 1/3 do Gerar) — só para prever o 1º domingo; dá para simular só o 1º domingo, mas mexe em regra (combinar com o dono); (2) na escala à mão, cada toque dispara 8–10 camadas (auditoria ao vivo, cartões, glossário, ícones, lembrete) de 0,1–0,3 s cada; juntar num só “depois do toque” ajudaria; (3) `montarEscalaFeriados` monta ~6 mil `<option>` (uma lista de datas por pessoa e feriado) — listas sob demanda deixariam a tela leve.
- **Encarregados — dois balanços com 2 semanas de diferença** (ex.: último domingo de fev e 2º domingo de mar): quem trabalha o 1º domingo do mês fica com balanço + domingo + balanço e o “Gerar” pede revisão. O balanço é exceção, então o aviso é exagerado; cenário raro (achado na investigação de 13/10/2026). Se o dono usar balanços assim, ajustar `validarEscala` para não contar sequência com balanço.
- **Transformar as conferências dia a dia da investigação de 13/10/2026 em teste fixo** (6×1 com a virada do mês, folgas de feriado no DSR/folga fixa, meses com balanço) — hoje os testes cobrem os 4 consertos de forma pontual. Cuidado com o tempo da suíte.
- **Revisar as telas atuais com a regra de ouro (seção 4.1 do AGENTS.md, lista de 16 itens):** começar pela escala à mão (passo 2 ④), que acumulou muitas camadas (filtros, sugestões, auditoria, folga no cartão) e é a parte mais usada.
- **Manuais (Claude Docs):** incluir o 🤖 Assistente RH (texto + print fictício) nos dois manuais — perguntar ao dono quando.
- **Assistente RH — próximas etapas** (só com pedido do dono): usar o aprendizado na 💡 Sugestão; resumo do ano.
- **Apagar os branches antigos do ChatGPT** no GitHub (lista na seção 1) — só o dono consegue.
- **Encarregados — escala à mão (V167), ideias:** (1) a sugestão segue o motor, que prefere a dupla 2×1 (quem trabalhou o domingo anterior) — por isso um mês usa ~6–8 pessoas diferentes, igual ao automático; se o dono quiser “espalhar mais”, a mudança é no `escolherDomingo` (vale para os dois modos). (2) Revisar a tela da escala à mão com o checklist da seção 4.1 do `AGENTS.md` junto com o dono.
- **Sugestões da escala à mão (V235):** alguns cliques levaram 2–4 s em setores pequenos (Salgado, Padaria, Cozinha), provavelmente no salvamento automático depois de aceitar — investigar. Na Frente de Loja cada toque leva ~1–2 s, porque cada candidato roda a auditoria do mês inteiro. Se precisar de mais velocidade: auditar só a pessoa testada (3 domingos seguidos, folga fixa no domingo, 6×1) em vez do mês todo.
