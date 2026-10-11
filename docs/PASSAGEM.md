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
| Escala de Setores | `Escala_de_Setores_V231.html` | `setores/index.html` (cópia idêntica) |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_V165.html` | `encarregados/index.html` (cópia idêntica) |

- **Testes no GitHub:** `.github/workflows/testes.yml` roda a suíte rápida e a do ano inteiro em todo PR, push no `main` e nos branches `chatgpt/**`. O resultado aparece na aba **Checks** do PR.
- **PR #27 aberta:** [ChatGPT] Setores V231 — empréstimo entre setores (branch `chatgpt/setores-v231-funcionario-emprestado`); checks em execução na última consulta. Não mesclar sem autorização explícita.
- **Branches antigos:** `chatgpt/teste-integracao` está **desatualizado, não faça merge**. A V228 dele deixa marcar o 3º domingo seguido: o bloqueio procurava `Nome:`, mas o aviso é `dd/mm/aaaa: Nome ficaria em 3 domingos…`. As boas ideias dele já entraram no `main` (PR #19). Pode ser apagado pelo dono do projeto.
- **Próximo número de versão:** Setores **V232**, Encarregados **V166**.

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
- **Conferência de teste que nunca falha:** nunca compare um valor com ele mesmo (ex.: `x.length === x.length`).
- **Aba Grupos dos Encarregados:** está escondida; nos testes, clique só se `isVisible()`.
- **Virada do mês:** `trabalhoDomingo[dia]` só tem os domingos DESTE mês. Nunca use `trabalhoDomingo[outraData.getDate()]` para um dia de outro mês (lê o dia de mesmo número deste mês). Use `domingoForaDoMesTrabalhado` (V229).
- **`auditarDescansosSimulados` vazia de propósito:** a capacidade de folgas por dia/turno é META, não trava (comentários em `limiteFolgaRespeitadoNaData` e `turnoFolgaValidoNaData`). Não “conserte” fazendo ela acusar erro sem o dono pedir.

---

## 5. Diário (mais novo primeiro)

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
- **GitHub Actions:** aparece o aviso "Node.js 20 is deprecated". Funciona, mas um dia vale trocar `node-version: 20` por `22` no workflow.
- ~~Investigar a auditoria ao vivo da V228~~ — **feito na V229** (resultado de cada item no Diário).
- **Transformar as propostas de `docs/PROPOSTAS_ESTRESSE_SETORES.md` em testes de verdade** em `testes/rodar.js`, uma prioridade por PR.
  - Comece pelos **testes de mutação**: quebrar uma regra de propósito (ex.: marcar o 3º domingo seguido direto nos dados) e conferir que o verificador acusa.
  - O `rodar.js` já tem um verificador independente das regras dos **domingos** (quem não pode trabalhar, liderança, pessoa repetida, 3 domingos seguidos) dentro de `testarSetores`/`testarEncarregados`. Os feriados, o 6×1 e as folgas compensatórias **ainda não** têm verificador próprio: são as lacunas de maior valor. Amplie o verificador existente, não crie outro.
  - Só crie versão nova do app se um teste achar um defeito.
- **Branch `chatgpt/teste-integracao`:** desatualizado (veja a seção 1).
