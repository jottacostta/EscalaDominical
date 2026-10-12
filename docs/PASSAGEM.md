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
| Escala de Setores | `Escala_de_Setores_V235.html` | `setores/index.html` (cópia idêntica) |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_V165.html` | `encarregados/index.html` (cópia idêntica) |

- **Testes no GitHub:** `.github/workflows/testes.yml` roda a suíte rápida e a do ano inteiro em todo PR, push no `main` e nos branches `chatgpt/**`. O resultado aparece na aba **Checks** do PR.
- **PRs abertos:** o PR do Claude com a Setores V235 (simulação de estresse das sugestões). Depois do merge: nenhum.
- **Branches antigos do ChatGPT** (todos já incorporados ao `main` ou com PR fechado): `chatgpt/teste-integracao`, `chatgpt/propostas-*`, `chatgpt/setores-filtro-escala-manual`, `chatgpt/setores-v231-…`, `chatgpt/setores-v232-…`, `chatgpt/sugestoes-escala-manual` e os dois `chatgpt/setores-v233-…`. **Não use nenhum deles.** O Claude não consegue apagar branches deste ambiente; o dono pode apagá-los no GitHub (aba **Branches** → 🗑️).
- **Próximo número de versão:** Setores **V236**, Encarregados **V166**.

---

## 2. Mapa técnico — Escala de Setores (`Escala_de_Setores_Vnnn.html`, ~12,3 mil linhas)

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

**Armazenamento no aparelho:** chaves `localStorage` começam com `escalaSetores.` (ex.: `escalaSetores.v183` = cópia de cada setor/mês, `escalaSetores.quadroERP` = quadro da loja). O espaço é limitado (V216 libera sozinho).

## 3. Mapa técnico — Escala 2×1 de Encarregados (`Escala_2x1_encarregados_Vnnn.html`, ~7,7 mil linhas)

- Mesmo padrão de camadas.
- `gerar()`: gera o mês. Ela chama `autoGrupos()` sozinha, porque o passo "Grupos" foi retirado na V162: a aba fica escondida e `gotoStep` pula o índice 2.
- `montarEscalaFeriados()` começa com `aplicarBloqueioFolgaFeriado()`. `bloqueioFolgaFeriado(i, dt)`: folga fixa/DSR no dia do feriado impede trabalhar, com a exceção da segunda-feira.
- Ganchos: `v156CopiarFeriado`, `v159SyncPrazo` (prazo 20/30 dias), `v161MarcarGuardado`, `v163AbrirCard` (cartões clicáveis).

---

## 4. Armadilhas conhecidas (já aconteceram — não repita)

- **Procurar a pessoa num aviso:** os avisos têm formatos diferentes (`dd/mm/aaaa: Nome ficaria…`, `Nome: sequência…`, `dd/mm/aaaa: Nome: folga fixa a definir…`). Não exija `Nome:`. Use a função `cita` da V228, que também separa nomes parecidos ("Ana Silva" × "Ana Silva Souza").
- **Desfazer uma marcação na escala à mão:** não clique de novo no checkbox, porque o cartão pode ter sido redesenhado. Mexa direto em `selecaoManualDomingo` / `horariosManuaisDomingo` e chame `renderSelecaoDomingosGeracao()`.
- **Índices do histórico ("snapshot")** se referem ao setor daquele snapshot, não ao setor aberto.
- **Data de admissão** vem em dois formatos (`AAAA-MM-DD` do ERP e `dd/mm/aaaa` do Equipe.txt). Normalize, senão aparece "NaN anos".
- **Abrir o histórico num aparelho novo:** troque primeiro o setor da tela para o setor do arquivo, senão o app prepara o mês seguinte.
- **"A definir"** não pode virar terça ao salvar o Editar equipe nem ao reimportar o ERP.
- **Script Python que gera a versão:** dentro de string com aspas simples, use `""` no JS, não `''`.
- **Link do site mostra versão antiga:** é o cache do navegador (Ctrl+F5).
- **Versão HTML divergente do nome do arquivo:** a V231 foi publicada com nome V231 e histórico V231, mas o `<title>` e o rodapé ainda diziam V230. Isso passou porque os testes verificavam a cópia publicada e a passagem de bastão, mas não os metadados visíveis do app. Agora `testes/rodar.js` confere separadamente nome, `<title>`, rodapé e primeira entrada do histórico; não considerar versão concluída sem essas quatro verificações e a igualdade com `setores/index.html`.
- **Conferência de teste que nunca falha:** nunca compare um valor com ele mesmo (ex.: `x.length === x.length`).
- **Aba Grupos dos Encarregados:** está escondida; nos testes, clique só se `isVisible()`.
- **Virada do mês:** `trabalhoDomingo[dia]` só tem os domingos DESTE mês. Nunca use `trabalhoDomingo[outraData.getDate()]` para um dia de outro mês (lê o dia de mesmo número deste mês). Use `domingoForaDoMesTrabalhado` (V229).
- **`auditarDescansosSimulados` vazia de propósito:** a capacidade de folgas por dia/turno é META, não trava (comentários em `limiteFolgaRespeitadoNaData` e `turnoFolgaValidoNaData`). Não “conserte” fazendo ela acusar erro sem o dono pedir.

---

## 5. Diário (mais novo primeiro)

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

Modelo de entrada:
```
### AAAA-MM-DD — <App Vnnn ou "Documentação"> — <título curto> — <Claude|ChatGPT>
- **O que mudou e por quê:** …
- **Onde no código:** bloco /* ═════ Vnnn ═════ */, funções …, chaves localStorage …, campos do histórico …
- **Como foi testado:** npm test (resultado), check do GitHub, teste manual …
- **Para continuar:** o que ficou faltando, ideias, cuidados.
```

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
  - V165: rolagem do menu;
  - V164: folga fixa bloqueia feriado;
  - V163: cartões clicáveis;
  - V162: sem passo Grupos.

O detalhe de cada versão está no `CHANGELOG.md`.

---

## 6. Pendências e ideias (atualize ao resolver ou criar)

- **Manutenção e ADM Geral** (dados reais) mostram aviso de capacidade no domingo. O aviso é legítimo: falta gente apta, não é defeito.
- **Encarregados — folga de feriado "sem data"** com o prazo de 20 dias: em meses com muitos feriados (ex.: outubro), algumas folgas ficam sem data possível. O app avisa. Com 30 dias (CLT) não acontece. Uma ideia seria sugerir automaticamente a troca de prazo.
- ~~GitHub Actions com Node 20~~ — trocado para **Node 22** na limpeza de 12/10/2026.
- ~~Investigar a auditoria ao vivo da V228~~ — **feito na V229** (resultado de cada item no Diário).
- **Transformar as propostas de `docs/PROPOSTAS_ESTRESSE_SETORES.md` em testes de verdade** em `testes/rodar.js`, uma prioridade por PR.
  - Comece pelos **testes de mutação**: quebrar uma regra de propósito (ex.: marcar o 3º domingo seguido direto nos dados) e conferir que o verificador acusa.
  - O `rodar.js` já tem um verificador independente das regras dos **domingos** (quem não pode trabalhar, liderança, pessoa repetida, 3 domingos seguidos) dentro de `testarSetores`/`testarEncarregados`. Os feriados, o 6×1 e as folgas compensatórias **ainda não** têm verificador próprio: são as lacunas de maior valor. Amplie o verificador existente, não crie outro.
  - Só crie versão nova do app se um teste achar um defeito.
- ~~V233 — revisão das sugestões~~ — feita: escolhida a #31, melhorada na V234 (ver Diário).
- **Revisar as telas atuais com a regra de ouro (seção 4.1 do AGENTS.md):** começar pela escala à mão (passo 2 ④), que acumulou muitas camadas (filtros, sugestões, auditoria, folga no cartão) e é a parte mais usada.
- **Apagar os branches antigos do ChatGPT** no GitHub (lista na seção 1) — só o dono consegue.
- **Sugestões da escala à mão (V235):** alguns cliques levaram 2–4 s em setores pequenos (Salgado, Padaria, Cozinha), provavelmente no salvamento automático depois de aceitar — investigar. Na Frente de Loja cada toque leva ~1–2 s, porque cada candidato roda a auditoria do mês inteiro. Se precisar de mais velocidade: auditar só a pessoa testada (3 domingos seguidos, folga fixa no domingo, 6×1) em vez do mês todo.
