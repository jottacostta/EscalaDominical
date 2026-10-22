---
name: repo-review-pr-workflow
description: "Revisão, orquestração e entrega segura de mudanças em repositórios Git: inspecionar o projeto, dividir tarefas entre agentes, integrar branches e versões, executar testes por aplicativo, diagnosticar CI, publicar Pull Requests e mesclar somente quando os checks exigidos estiverem verdes. Use quando o usuário pedir revisão de repositório, correção com testes, trabalho multiagente, push/PR, monitoramento de CI ou merge condicionado à aprovação."
---

# Revisar e entregar mudanças por Pull Request

## Objetivo

Executar o ciclo completo de uma correção de repositório sem perder contexto: entender as regras do projeto, revisar o código e os testes, implementar uma mudança pequena e rastreável, validar localmente, publicar um PR, diagnosticar o CI e só mesclar quando o usuário autorizar e todos os checks obrigatórios estiverem aprovados.

Preservar a linguagem do usuário. Explicar resultados em termos claros, sem expor segredos, dados reais ou detalhes internos desnecessários.

## Fluxo coordenado

Executar, nesta ordem, o ciclo de contexto, divisão, implementação isolada, integração, validação e publicação. Para tarefas com dois aplicativos, testar cada aplicativo com uma unidade independente antes da suíte integrada. Para detalhes de worktrees, agentes, conflitos e recuperação de base, ler [references/orchestration-and-integration.md](references/orchestration-and-integration.md).

Tratar o agente pai como responsável pela integração: agentes subordinados entregam commits e evidências, mas não fazem merge entre si. Manter histórico, assinaturas, versões atuais, cópias publicadas e documentação ativa coerentes; não reescrever registros históricos para parecerem atuais.

## Regras de segurança e autorização

- Trabalhar no branch de tarefa; nunca alterar ou fazer push direto em `main`.
- Fazer `git fetch` antes de planejar quando houver remoto disponível. Verificar se o branch parte do `main` mais recente.
- Ler as instruções do repositório antes de editar: `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `README.md`, documentos em `docs/`, manifestos e workflow de CI. Usar somente os arquivos que existirem.
- Não fazer merge só porque o usuário pediu um PR. Fazer merge apenas quando houver pedido explícito para mesclar e os checks obrigatórios estiverem verdes.
- Tratar `cancelled`, `timed_out`, `failure`, `neutral`, checks ausentes ou checks ainda pendentes como não aprovados.
- Não pedir confirmação para ações já autorizadas na mensagem do usuário. Pedir confirmação somente para uma ação externa significativa não autorizada, alteração destrutiva ou decisão ambígua.
- Nunca versionar planilhas, históricos, credenciais, `.env`, dados reais de RH ou artefatos locais gerados pelos testes.
- Ao encontrar trabalho alheio no branch, parar e preservar as alterações; não sobrescrever nem resetar sem autorização.

## Fluxo principal

### 1. Estabelecer o contexto

1. Identificar o diretório ativo, o remoto e o branch:

   ```bash
   pwd
   git remote -v
   git status --short --branch
   git branch --show-current
   ```

2. Atualizar referências sem apagar trabalho local:

   ```bash
   git fetch --all --prune
   git log --oneline --decorate -15
   ```

3. Ler as regras do projeto, a documentação de passagem de bastão, o topo do changelog, o manifesto e o workflow de testes. Conferir PRs abertas quando a mudança puder colidir com trabalho existente.

4. Registrar mentalmente: versão atual de cada app, branch de origem, comandos de teste, critérios de publicação, arquivos de cópia fixa, requisitos de assinatura e pendências conhecidas.

### 2. Fazer a revisão inicial

Mapear a superfície sem imprimir dados embutidos ou arquivos sensíveis:

- listar fontes, testes, scripts, manifestos e workflows;
- localizar pontos de entrada, geração de resultado, persistência, exportação/importação e mensagens de erro;
- comparar documentação com versões e cópias realmente publicadas;
- procurar URLs, scripts externos, interpolação de entrada em HTML e arquivos sensíveis versionados;
- verificar se os testes exercitam o fluxo que o usuário quer alterar, não apenas a presença do texto.

Executar a suíte existente antes da mudança quando o tempo permitir. Separar falhas preexistentes, flakiness e falhas introduzidas. Não enfraquecer testes para obter verde.

### 3. Planejar a correção

Escolher a menor mudança que satisfaz o pedido e preservar o comportamento existente fora do caso alterado. Definir antes de editar:

- condição que deve mudar;
- comportamento que não pode regredir;
- teste de sucesso, cancelamento/recusa e dados inválidos;
- arquivos de versão, cópia fixa e documentação que precisam acompanhar a mudança.

Se o projeto usa arquivos monolíticos versionados, criar uma nova versão, arquivar a anterior e manter a cópia publicada byte a byte igual à versão atual. Não editar históricos antigos para fazê-los parecer atuais.

### 4. Implementar e testar localmente

1. Criar ou confirmar um branch de tarefa baseado no `main` mais recente. Não empilhar uma mudança nova em um branch cujo PR já foi mesclado.
2. Editar com escopo pequeno e preservar formatação e assinaturas do projeto.
3. Adicionar regressões determinísticas para a regra nova. Cobrir pelo menos o caminho normal, a recusa/cancelamento e o caso de dados incompletos ou inválidos.
4. Validar sintaxe e artefatos:

   ```bash
   git diff --check
   node --check caminho/do/teste.js
   # para HTML com JavaScript embutido, extrair cada <script> e rodar node --check
   cmp -s app-atual.html pasta-publicada/index.html
   ```

5. Executar os testes declarados pelo projeto. Para uma suíte longa, redirecionar o log e manter um marcador de saída:

   ```bash
   set -o pipefail
   npm test > /tmp/repo-test.log 2>&1
   code=$?
   echo "EXIT=$code"
   tail -100 /tmp/repo-test.log
   exit $code
   ```

   Se for necessário deixar a suíte rodando em background, acompanhar o processo e o arquivo de log. Silêncio não prova travamento: verificar processo, CPU, arquivo de saída e artefatos antes de reiniciar. Ao terminar, encerrar somente processos órfãos pertencentes à suíte.

6. Conferir `git status` e remover temporários antes de preparar o commit.

### 5. Commitar com rastreabilidade

Usar mensagem curta, explicativa e assinatura correta do agente. Para trabalho do Manus, seguir o padrão:

```text
[Manus] <mudança resumida>

<motivo, comportamento preservado e testes executados>

Assinado: Manus
```

Antes do commit, conferir o diff completo, os arquivos adicionados/arquivados e a ausência de dados reais. Após o commit, verificar `git status` e o hash criado.

### 6. Publicar o branch e abrir ou atualizar o PR

Quando o usuário autorizar push/PR:

```bash
git push -u origin <branch>
gh pr create --repo OWNER/REPO --base main --head <branch> \
  --title "[Manus] <título>" --body-file /tmp/pr-body.md
```

Usar este formato de corpo, adaptando o conteúdo:

```markdown
## O que muda

- <comportamento novo>
- <regressão evitada>

## Testes

- `<comando>` — <resultado>
- <checagem de CI ou validação adicional>

## Para quem continuar

- <pendência ou cuidado>
- Não fazer merge sem autorização do dono, quando aplicável.

Assinado: Manus
```

Verificar título, corpo, branch, base, autor visível e assinatura. Se o PR já existir, atualizar o mesmo branch/PR em vez de abrir duplicado.

### 7. Diagnosticar e acompanhar o CI

Consultar o estado do PR e dos checks:

```bash
gh pr checks <numero> --repo OWNER/REPO
gh pr view <numero> --repo OWNER/REPO \
  --json state,mergeStateStatus,reviewDecision,statusCheckRollup
```

Se houver cancelamento ou falha, comparar os eventos e commits das execuções:

```bash
gh run view <run-id> --repo OWNER/REPO --json status,conclusion,event,headBranch,headSha,startedAt,updatedAt,jobs,url
gh api repos/OWNER/REPO/actions/runs/<run-id>/jobs?per_page=100

gh run view <run-id> --repo OWNER/REPO --log > /tmp/run-<run-id>.log
```

Interpretar assim:

- `failure`: procurar a primeira asserção ou comando que falhou; corrigir e enviar novo commit.
- `timed_out`: comparar a duração com `timeout-minutes`; reduzir o escopo ou aumentar o limite justificadamente.
- `cancelled` com `✅ Tudo certo` no log: não tratar como falha de produto; verificar quem/qual evento cancelou e se o job atingiu o timeout global.
- Dois runs no mesmo SHA, um `push` e outro `pull_request`: evitar disparar nos branches de trabalho e manter `pull_request` para o PR.
- Vários commits rápidos no mesmo PR: adicionar `concurrency` com `cancel-in-progress: true` para cancelar somente execução obsoleta do mesmo PR.

Para PRs, uma configuração usual é:

```yaml
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: testes-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

Ajustar `timeout-minutes` para cobrir a suíte completa com margem, sem esconder testes presos. Depois de modificar o workflow, fazer commit e push para que o PR gere uma execução nova e não duplicada.

### 8. Gate de merge

Antes de mesclar, verificar novamente:

1. PR aberto, não rascunho e apontando para a base correta.
2. Head corresponde ao commit mais recente enviado.
3. Todos os checks obrigatórios estão `success`/`passed`; nenhum está pendente, cancelado ou falho.
4. Aprovações obrigatórias e estado de merge estão satisfeitos.
5. O usuário pediu explicitamente o merge.

Só então executar, conforme a política do repositório:

```bash
gh pr merge <numero> --repo OWNER/REPO --squash --delete-branch
```

Se qualquer check estiver cancelado, não mesclar. Informar o motivo e, se autorizado, corrigir o workflow ou solicitar uma nova execução. Após o merge, confirmar o estado do PR, o commit em `main` e a limpeza do branch remoto.

## Orquestração multiagente e integração

Usar o playbook de referência quando houver mais de um agente, aplicativo, branch, versão concorrente ou uma suíte longa. Ele define como criar worktrees isolados, formalizar o contrato de entrega, separar testes por aplicativo, integrar commits únicos, resolver conflitos sem apagar regras, rebasear quando a base mudar e conferir o SHA do CI.

Usar também o template [templates/pr-body.md](templates/pr-body.md) para manter o corpo das PRs com “O que muda”, “Testes”, “Para quem continuar” e assinatura do agente.

## Relato final

Entregar um resumo curto e verificável, nesta ordem:

1. **Resultado:** o que foi corrigido ou por que não foi possível avançar.
2. **Arquivos/commit:** branch, commit e PR, com links absolutos ou URLs úteis.
3. **Testes:** comandos e resultado; distinguir suíte rápida, completa e CI.
4. **CI:** checks verdes, pendentes, cancelados ou falhos, com causa baseada no log.
5. **Próximo passo:** merge realizado, aguardando checks, ou ação necessária do usuário.

Nunca dizer que o merge foi feito sem confirmação do comando e do estado remoto. Nunca chamar uma execução cancelada de teste aprovado apenas porque houve sucesso local.
