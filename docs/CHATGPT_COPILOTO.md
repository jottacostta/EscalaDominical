# Como ligar o ChatGPT ao GitHub e trabalhar em dupla com o Claude

Este guia mostra como deixar o **ChatGPT** fazer atualizações no repositório **jottacostta/EscalaDominical**
seguindo o mesmo padrão do Claude. As regras do projeto estão em [`AGENTS.md`](../AGENTS.md) — o ChatGPT (Codex) lê esse
arquivo sozinho em toda tarefa.

> As telas do ChatGPT mudam com frequência. Se algum nome de menu estiver diferente (ex.: “Apps” × “Conectores” ×
> “Plugins”), procure a opção equivalente. Codex no ChatGPT exige um plano pago (Plus, Pro, Team/Business ou Enterprise).

---

## Parte 1 — Ligar o ChatGPT ao GitHub (só uma vez)

Existem duas formas. **Para fazer mudanças, use a forma A (Codex).** A forma B só serve para ler e tirar dúvidas.

### A) Codex — o ChatGPT faz a mudança e abre um Pull Request

1. Entre em **https://chatgpt.com/codex** (ou, no ChatGPT, abra **Codex** no menu lateral).
2. Toque em **Conectar ao GitHub**. Você vai para o GitHub para autorizar o app **ChatGPT / Codex**.
3. No GitHub, em **Repository access**, escolha **Only select repositories** e marque **jottacostta/EscalaDominical**.
   Toque em **Install / Authorize**.
4. De volta ao Codex, crie um **ambiente** (Environment) para o repositório:
   - Repositório: `jottacostta/EscalaDominical`, branch `main`.
   - **Acesso à internet do agente:** ligado, pelo menos durante a preparação, para instalar o navegador de teste.
   - **Script de preparação (setup)** — cole:
     ```bash
     cd testes && npm install && npx playwright install --with-deps chromium
     ```
5. Pronto. Em cada tarefa, o Codex trabalha numa cópia do repositório, roda os testes e, no fim, oferece o botão
   **Criar PR** (Pull Request). Nada vai para o `main` sem você aprovar.

Se ficar preso num “loop” de autorização: em **Configurações → Apps (Conectores) → GitHub**, toque em **Desconectar**
e conecte de novo. Repositórios novos podem levar uns 5 minutos para aparecer.

### B) ChatGPT normal com o app do GitHub — só leitura

1. No ChatGPT: **Configurações → Apps** (em algumas contas aparece como **Conectores** ou **Plugins**) → **GitHub** → **Conectar**.
2. No GitHub, autorize e escolha **jottacostta/EscalaDominical**.
3. Na conversa, ative o GitHub e peça, por exemplo: “Leia o `AGENTS.md` e o `CHANGELOG.md` do repositório
   jottacostta/EscalaDominical e me explique a regra de folga de feriado.”
   (Nesta forma o ChatGPT **lê**, mas não abre Pull Request.)

---

## Parte 2 — Como pedir uma mudança ao ChatGPT (Codex)

Comece **toda** tarefa com este texto (copie e cole) e depois descreva o que você quer:

```
Repositório jottacostta/EscalaDominical. Antes de tudo, leia o AGENTS.md e o docs/PASSAGEM.md inteiros e siga todas as regras:
- parta do main mais recente e confira se há PR aberto do Claude (branches ccr-*) mexendo no mesmo app;
- crie uma VERSÃO NOVA do app (próximo número), com a linha no HISTÓRICO DE VERSÕES, mova a versão anterior
  para versoes_anteriores/, copie a nova para setores/index.html ou encarregados/index.html e atualize
  CHANGELOG.md e README.md;
- mude o mínimo (bloco <style>/<script> novo antes de </head>/</body>), sem reformatar o arquivo;
- tudo que o usuário define tem que ficar guardado no aparelho e no histórico do mês;
- rode "cd testes && npm test" (tem que terminar com "Tudo certo"); se o seu ambiente não conseguir rodar,
  abra o PR mesmo assim e confira o teste "Testes" na aba Checks do PR: só está pronto quando ficar verde;
- nunca coloque planilha do RH, históricos ou nomes de funcionários no repositório;
- branch chatgpt/<assunto>, PR em português com "O que muda", "Testes" e "Para quem continuar";
- ASSINE TUDO como ChatGPT (seção 9 do AGENTS.md): título do PR "[ChatGPT] …", linha "Assinado: ChatGPT"
  no commit e no PR, "— *ChatGPT*" no CHANGELOG e "Vnnn [ChatGPT] —" no HISTÓRICO DE VERSÕES.
  O Claude assina "Claude": leia as assinaturas para saber quem fez o quê;
- atualize o docs/PASSAGEM.md (estado atual + entrada no Diário: o que mudou, onde no código, como testou, o que falta)
  e termine o PR com a parte "Para quem continuar", para o Claude dar continuidade.

O que eu quero agora: <descreva aqui a mudança>
```

Dicas para pedir:
- **Uma mudança por vez** (um PR por assunto). Fica mais fácil conferir e desfazer.
- Diga **em qual app** é (Setores ou Encarregados) e **em qual passo/tela**.
- Se for uma regra, dê um exemplo: “quem tem folga fixa na terça não pode trabalhar no feriado de terça”.

---

## Parte 3 — Conferir e aprovar (você)

1. Abra o PR que o Codex criou (no GitHub, aba **Pull requests**).
2. Confira na descrição:
   - o **número da versão** novo (ex.: Setores V223) e o que mudou;
   - que o **`npm test` terminou com “Tudo certo”** — ou, mais fácil, que o teste **“Testes”** na aba **Checks** do PR
     está verde ✅ (ele roda sozinho no GitHub em todo PR, mesmo quando o Codex não consegue rodar);
   - que **não** há arquivo `.xlsx` ou `Historico_*.json` na lista de arquivos alterados.
3. Para testar antes do merge: na aba **Files changed**, abra o arquivo `Escala_..._Vnnn.html` → **⋯ → View file → Raw/Download**
   e abra no navegador. (Depois do merge, use o link fixo de sempre.)
4. Se estiver tudo certo, toque em **Merge pull request**. O site atualiza em 1–2 minutos (se aparecer a versão antiga, **Ctrl+F5**).

---

## Parte 4 — Trabalhando em dupla (ChatGPT + Claude)

- **Os dois partem sempre do `main` mais recente.** Antes de começar, cada um olha o que o outro já colocou lá.
- **Não trabalhem no mesmo app ao mesmo tempo.** Se o Claude estiver com um PR aberto no Setores (branch `ccr-…`),
  deixe o ChatGPT mexer no Encarregados, ou espere o merge.
- **Número de versão:** quem entrar no `main` por último renumera a sua versão, se o número já tiver sido usado.
- **Conflito no Pull Request** (o GitHub avisa “This branch has conflicts”): peça ao assistente dono do PR para
  “trazer o main para o branch e resolver o conflito, mantendo as mudanças dos dois”, e rodar os testes de novo.
- **Quando o Claude estiver bloqueado** (sem acesso, fora do ar), o ChatGPT segue o mesmo padrão; quando o Claude voltar,
  ele lê o `CHANGELOG.md` e continua a partir da versão mais nova.

---

## Parte 5 — O que NUNCA fazer

- Push direto no `main`.
- Reescrever ou “organizar” o arquivo HTML inteiro.
- Juntar os dois apps num só.
- Subir planilha do RH, históricos ou nomes de funcionários.
- Trocar uma regra de negócio do [`AGENTS.md`](../AGENTS.md) sem o dono do projeto pedir.
