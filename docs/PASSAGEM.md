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
| Escala de Setores | `Escala_de_Setores_V228.html` | `setores/index.html` (cópia idêntica) |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_V165.html` | `encarregados/index.html` (cópia idêntica) |

- **Testes no GitHub:** `.github/workflows/testes.yml` roda a suíte rápida e a do ano inteiro em todo PR, push no `main` e nos branches `chatgpt/**`. O resultado aparece na aba **Checks** do PR.
- **PRs abertos:** nenhum.
- **Branches antigos:** `chatgpt/teste-integracao` está **desatualizado, não faça merge**. A V228 dele deixa marcar o 3º domingo seguido: o bloqueio procurava `Nome:`, mas o aviso é `dd/mm/aaaa: Nome ficaria em 3 domingos…`. As boas ideias dele já entraram no `main` (PR #19). Pode ser apagado pelo dono do projeto.
- **Próximo número de versão:** Setores **V229**, Encarregados **V166**.

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

---

## 5. Diário (mais novo primeiro)

Modelo de entrada:
```
### AAAA-MM-DD — <App Vnnn ou "Documentação"> — <título curto> — <Claude|ChatGPT>
- **O que mudou e por quê:** …
- **Onde no código:** bloco /* ═════ Vnnn ═════ */, funções …, chaves localStorage …, campos do histórico …
- **Como foi testado:** npm test (resultado), check do GitHub, teste manual …
- **Para continuar:** o que ficou faltando, ideias, cuidados.
```

### 2026-10-11 — Documentação — passagem de bastão — Claude
- **O que mudou e por quê:** o dono pediu que toda mudança fique explicada para o outro assistente continuar. Foram criados este arquivo e a regra 10 do `AGENTS.md`. O `testes/rodar.js` agora confere se este arquivo cita a versão atual de cada app.
- **Para continuar:** em toda mudança, siga "Como atualizar" no topo deste arquivo.

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
- **Branch `chatgpt/teste-integracao`:** desatualizado (veja a seção 1).
