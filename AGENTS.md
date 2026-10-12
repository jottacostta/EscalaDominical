# Regras do projeto EscalaDominical (para qualquer assistente de IA: ChatGPT/Codex, Claude e outros)

Este arquivo é lido automaticamente pelo Codex do ChatGPT em toda tarefa. **Siga tudo o que está aqui.**
Escreva sempre em **português do Brasil**, com linguagem simples (quem usa o app é gestor de loja, não programador).

## 1. O que é o projeto

Dois apps de escala do **Supermercados Guanabara**, cada um num **único arquivo HTML** (abre no navegador, funciona sem internet):

| App | Arquivo atual (raiz) | Link fixo (GitHub Pages) |
|---|---|---|
| Escala de Setores | `Escala_de_Setores_Vnnn.html` | `setores/index.html` → https://jottacostta.github.io/EscalaDominical/setores/ |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_Vnnn.html` | `encarregados/index.html` → https://jottacostta.github.io/EscalaDominical/encarregados/ |

- **Os dois apps são separados** (cada um atende uma gestão). **Nunca juntar os dois** num app só.
- Cores da marca: azul `#0047BA`, amarelo `#FFCC00`, vermelho `#E52320`.

## 2. Antes de começar qualquer mudança

1. Puxe o `main` mais recente (`git fetch origin main`) e trabalhe a partir dele.
2. Veja o que mudou desde a última vez: `git log --oneline -15 origin/main`, o topo do `CHANGELOG.md` e o **`docs/PASSAGEM.md`** (seção 10).
3. Veja se há Pull Requests abertos de outro assistente (o Claude usa branches que começam com `ccr-`).
   Se houver PR aberto mexendo no mesmo app, **espere ele entrar no main** ou combine com o dono do projeto.
4. Descubra qual é a **versão atual** de cada app pelo nome do arquivo na raiz (ex.: `Escala_de_Setores_V222.html`).

## 3. Toda mudança gera uma VERSÃO NOVA (obrigatório)

Para cada mudança num app (ex.: Setores V222 → V223):

1. **Copie** o arquivo atual para o novo número: `Escala_de_Setores_V223.html`.
2. No arquivo novo:
   - troque o número no `<title>` (ex.: `Escala de Setores — V223`);
   - troque o texto do rodapé do menu `Versão V222 · …` por `Versão V223 · <resumo curto>`;
   - **acrescente uma entrada no topo do comentário `HISTÓRICO DE VERSÕES`**, no mesmo estilo das anteriores:
     - Setores: logo abaixo da linha `HISTÓRICO DE VERSÕES (toda alteração gera nova versão)`;
     - Encarregados: logo abaixo da linha `<!-- HISTÓRICO DE VERSÕES`;
     - formato: `V223 — TÍTULO EM MAIÚSCULAS: explicação em linguagem simples…` (linhas seguintes recuadas com 7 espaços).
3. **Mova** a versão anterior para a pasta de versões antigas: `git mv Escala_de_Setores_V222.html versoes_anteriores/`.
   Na raiz fica **só a versão atual** de cada app.
4. **Copie** a versão nova por cima do link fixo: `cp Escala_de_Setores_V223.html setores/index.html`
   (ou `encarregados/index.html`). Os dois arquivos têm que ficar **idênticos** — o teste automático confere.
5. Atualize o `CHANGELOG.md` (entrada nova no topo da seção do app) e a tabela do `README.md` (nome do arquivo atual e faixa das versões anteriores).
6. Se dois assistentes criarem o mesmo número de versão ao mesmo tempo, quem entrar no `main` depois **renumera** a sua (ex.: V223 → V224).
7. **Antes de abrir a PR, confira por teste automatizado** que o número do arquivo coincide com o `<title>`, com a versão visível no rodapé e com a primeira entrada do `HISTÓRICO DE VERSÕES`. Confira também que `setores/index.html` / `encarregados/index.html` é idêntico ao arquivo atual. Não basta o nome do arquivo ou o histórico estarem certos isoladamente.

## 4. Como mexer no código

- **Não reescreva nem reformate o arquivo.** São ~12 mil linhas com muitas correções acumuladas. Mude o mínimo.
- Prefira **acrescentar** em vez de alterar:
  - CSS novo num bloco `<style id="vNNN-assunto">` logo antes de `</head>`;
  - JavaScript novo num bloco `<script>` logo antes de `</body>`, dentro de `(function(){ … })();`,
    com o comentário `/* ═════ VNNN — o que faz ═════ */`.
- Quando precisar mudar uma linha existente, troque **só aquele trecho** e deixe um comentário curto `// VNNN: motivo`.
- O estado do app fica em variáveis globais (`equipe`, `todasEquipes`, `trabalhoDomingo`, `trabalhoFeriado`,
  `folgasCompensatorias`, `selecaoManualDomingo`, `grupos`…). Os blocos novos podem lê-las pelo nome.
- Textos para o usuário: português simples, frases curtas. Use “Toque …” (no computador o app troca sozinho por “Clique …”).
- Tudo o que o usuário define tem que ser **guardado**: no aparelho (salvamento automático) e no
  **histórico do mês** (arquivo `Historico_<Setor>_mm_aaaa.json`, montado em `montarProjeto`). Se criar um dado novo,
  inclua no histórico e garanta que ele volta ao abrir o arquivo num aparelho novo.
- Depois de mexer, confira no navegador que não aparece erro de JavaScript (console) e que o menu ⋮ continua abrindo.

## 5. Regras de negócio que NÃO podem ser quebradas

**Escala de Setores**
- Ninguém trabalha **3 domingos seguidos** (conta os 2 últimos domingos do mês passado; o domingo de balanço é exceção — no balanço trabalham todos os aptos).
- **Quem está trabalhando (não afastado) é apto ao domingo.** Só não entra no domingo quem tiver a **folga fixa no domingo escolhida à mão** (no Editar equipe ou no cartão da pessoa no domingo, na escala à mão — campo “📅 Folga fixa”). A folga no domingo que vem do ERP vira “a definir”. **Jovem aprendiz** não trabalha domingo nem feriado.
- A folga fixa definida pelo usuário **nunca** é trocada por uma nova importação do ERP. “A definir” continua “a definir”.
- **Domingo é domingo, mesmo sendo feriado**: segue a escala do domingo, e quem trabalha ganha também a folga compensatória do feriado.
- Folga fixa no dia do feriado **impede** trabalhar nesse feriado (exceção: feriado na segunda logo após um domingo que a pessoa não trabalhou).
- Folga compensatória de feriado em até 20 dias corridos, de segunda a sábado, sem formar 3 ou mais dias seguidos de folga.
- No máximo 6 dias seguidos de trabalho (OJ 410 do TST).
- Liderança do domingo: uma só, 1 Encarregado + 1 Sub, ou várias (Frente de Loja e Mercearia).
- A escala à mão/mista tem **auditoria ao vivo** (mesmas regras do “Gerar”, função `auditarSelecaoAntesDaGeracao`) e **bloqueia** a marcação que quebra regra. Regra nova tem que entrar nessa auditoria. As sugestões da V233 devem revalidar elegibilidade e auditoria no momento do aceite, nunca substituir seleções existentes, e rejeitar sugestões não pode alterar a escala.

**Escala 2×1 de Encarregados**
- Domingo normal: **3 pessoas**, com pelo menos **1 Encarregado e 1 Subencarregado**, de **setores diferentes**, no máximo **1 do Laticínio**; ninguém faz 3 domingos seguidos.
- Folga de feriado: no máximo **2 pessoas de folga por dia** (contando DSR), **1 no sábado**, **1 por setor**; prazo de **20 dias (Guanabara)** ou **30 dias (CLT)**, escolhido em Mais opções; sugestões espalhadas no prazo.
- Folga fixa (ou DSR) no dia do feriado impede trabalhar nesse feriado (mesma exceção da segunda).
- Não existe mais passo de “Grupos” (os grupos não mudavam a escala).

## 6. Testes (obrigatório antes de abrir o PR)

```bash
cd testes
npm install
npx playwright install chromium
npm test                 # ~1 minuto — tem que terminar com “✅ Tudo certo”
npm run test:completo    # o ano inteiro — rode quando mexer no motor da escala
```

Se a mudança cria uma regra nova, **acrescente a conferência dela** em `testes/rodar.js`.

Os mesmos testes rodam **sozinhos no GitHub** (`.github/workflows/testes.yml`) em todo Pull Request, em todo push no `main` e nos branches `chatgpt/…` (suíte rápida e a do ano inteiro). Não crie outro workflow de testes: use esse.
Se o seu ambiente não consegue instalar o Chromium, abra o PR e confira o resultado na aba **Checks** do PR
(“Testes”): o PR só está pronto quando esse teste fica verde ✅. Diga no PR onde os testes rodaram.
Cada conferência tem que poder **falhar** de verdade (nunca compare um valor com ele mesmo).

## 7. Privacidade (obrigatório)

- **Nunca** coloque no repositório a planilha do RH (`*.xlsx`), históricos (`Historico_*.json`) ou qualquer arquivo com nomes/matrículas de funcionários reais.
- Dados de teste ficam em `testes/dados/` e são **fictícios** (nomes inventados).
- Não cole nomes de funcionários em commits, PRs ou comentários.

## 8. Git e Pull Request

- **Nunca** faça push direto no `main`. Crie um branch: `chatgpt/<assunto-curto>` (ex.: `chatgpt/filtro-por-cargo`).
- Um assunto por PR. Título no formato: `[ChatGPT] Setores V223: <o que muda>` (ou `[Claude] …` — veja a seção 9).
- Descrição do PR em português, com três partes: **O que muda**, **Testes** (o que foi testado e o resultado do `npm test`) e **Para quem continuar** (seção 10).
- Quem decide o merge é o dono do projeto. Depois do merge, o GitHub Pages atualiza o site sozinho em 1–2 minutos.

## 9. Assinatura (obrigatório) — para cada um saber o que o outro fez

Cada assistente **assina tudo o que faz** com o próprio nome: **Claude** ou **ChatGPT**.

| Onde | Como assinar (exemplo do Claude; o ChatGPT troca por “ChatGPT”) |
|---|---|
| Título do PR | começa com `[Claude]` — ex.: `[Claude] Setores V229: …` |
| Fim da descrição do PR | linha `Assinado: Claude` |
| Mensagem de commit | última linha `Assinado: Claude` |
| `CHANGELOG.md` | a entrada da versão termina com `— *Claude*` |
| `HISTÓRICO DE VERSÕES` no app | a linha da versão começa com `V229 [Claude] — …` |
| Comentário no GitHub | termina com `— Claude` |

- Antes de começar, leia as assinaturas no `git log` e no `CHANGELOG.md` para saber **quem fez o quê**.
- **Nunca** assine pelo outro nem apague a assinatura do outro. Se aproveitar uma ideia do outro, diga isso
  (ex.: “ideia do ChatGPT”).

## 10. Passagem de bastão (obrigatório) — deixe tudo explicado para o outro continuar

O arquivo [`docs/PASSAGEM.md`](docs/PASSAGEM.md) é o caderno de trabalho compartilhado entre Claude e ChatGPT.

- **Antes de começar:** leia o `docs/PASSAGEM.md` inteiro: estado atual, mapa técnico (onde fica cada coisa no código),
  armadilhas que já aconteceram, diário e pendências.
- **Em toda mudança** (app, teste ou documentação), no mesmo PR:
  1. atualize a seção **1. Estado atual** (versões, PRs/branches abertos, próximo número de versão);
  2. acrescente uma entrada **no topo** da seção **5. Diário**, no modelo de lá: o que mudou e por quê, onde no código
     (bloco `Vnnn`, funções, chaves do `localStorage`, campos do histórico), como foi testado e o que falta para continuar.
     Assine (`— Claude` ou `— ChatGPT`);
  3. atualize as **pendências** (seção 6), e as **armadilhas** (seção 4) se algo quebrou e você descobriu por quê;
  4. se criou função/gancho novo (`window.vNNN…`) ou variável global nova, acrescente no **mapa técnico** (seções 2–3).
- A descrição do PR termina com a parte **“Para quem continuar”**: o que ficou pronto, o que falta e os cuidados.
- O teste automático confere se o `docs/PASSAGEM.md` cita a versão atual de cada app.
