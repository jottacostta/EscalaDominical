# Orquestração de agentes e integração segura

Use este playbook quando a tarefa envolver dois ou mais aplicativos, vários agentes, branches isoladas, versões concorrentes ou uma suíte longa.

## 1. Dividir o trabalho

- Separar por responsabilidade verificável: uma regra, um aplicativo, uma falha ou uma camada documental por unidade.
- Para dois aplicativos, designar um agente para cada app. Não substituir essa divisão por um único teste monolítico quando o objetivo é comparar resultados.
- Evitar que duas unidades editem o mesmo arquivo sem coordenação. Se a sobreposição for inevitável, reservar a integração dos conflitos para o agente pai.
- Registrar para cada unidade: branch, worktree, arquivos permitidos, resultado esperado, comando de teste e formato de entrega.
- Quando a tarefa for grande, criar issues formais no repositório e vincular branch, agente e dependências.

## 2. Isolar os agentes

1. Atualizar `origin/main` e confirmar que a árvore de trabalho está limpa.
2. Congelar um snapshot WIP somente quando houver trabalho local autorizado que precise ser preservado.
3. Criar uma branch e um worktree por unidade, todos a partir da mesma base. Usar nomes descritivos e caminhos distintos.
4. Pedir a cada agente para reproduzir o caso, alterar o mínimo, rodar teste focal e devolver: causa, arquivos, commit, testes, limitações e risco residual.
5. Não permitir que um agente faça merge da branch de outro, resete trabalho alheio ou publique dados reais.

## 3. Contrato de entrega do agente

Considerar uma unidade pronta somente quando ela informar:

- commit identificável e branch publicada, se a publicação foi autorizada;
- lista de arquivos alterados e escopo compatível com a tarefa;
- resultado antes/depois ou reprodução determinística;
- teste focal executado e resultado;
- falhas preexistentes, limitações e qualquer conflito com outra unidade.

Preservar commits WIP se ainda forem úteis para diagnóstico, mas não os tratar como aprovados sem revisão do agente pai.

## 4. Integrar sem perder trabalho

1. Fazer `fetch --all --prune` novamente antes da integração.
2. Criar uma branch/worktree de integração a partir da `origin/main` mais recente.
3. Inspecionar a genealogia e o diff de cada entrega. Separar commits duplicados, commits-base e mudanças únicas.
4. Usar `cherry-pick` para unidades independentes; usar merge controlado quando a relação de dependência precisar permanecer explícita.
5. Ao resolver conflitos, compor manualmente código, testes e documentação. Nunca escolher automaticamente um lado se isso apagar uma regra, um teste ou uma assinatura.
6. Manter os aplicativos separados. Se houver versões monolíticas numeradas, promover cada app com seu próprio número, arquivar a versão anterior e copiar a nova para o `index.html` fixo.
7. Atualizar no mesmo conjunto a versão visível, o histórico interno, o CHANGELOG, o README, a passagem de bastão e os testes. Preservar referências antigas como histórico, mas corrigir o estado atual.

## 5. Validar por aplicativo e em conjunto

- Designar um agente independente para testar exclusivamente cada aplicativo alterado.
- Conferir sintaxe JavaScript, `git diff --check`, ausência de marcadores de conflito, igualdade entre versão atual e cópia fixa e ausência de arquivos sensíveis.
- Executar o teste focal de cada aplicativo com log separado.
- Executar depois a suíte rápida integrada e, quando o motor ou calendário mudou, a suíte completa anual.
- Se uma suíte longa ficar silenciosa, verificar processo, CPU, log e artefatos antes de reiniciar. Não interpretar silêncio como falha nem como aprovação.
- Comparar a conclusão do CI com o SHA atual do PR; um check verde de outro SHA não aprova o commit novo.

## 6. Publicar e aguardar o gate

- Abrir uma PR por assunto integrado, com “O que muda”, “Testes” e “Para quem continuar”.
- Não mesclar uma PR só porque ela foi criada ou porque o usuário pediu a publicação. Mesclar apenas com pedido explícito e todos os checks obrigatórios verdes no head atual.
- Se outra PR tocar o mesmo app ou os mesmos documentos, parar e combinar a ordem com o dono: aguardar a PR, empilhar conscientemente ou publicar uma correção separada que será rebaseada.
- Após cada novo push, consultar novamente checks, SHA, estado de merge e conflitos.

## 7. Recuperar uma base que mudou

Quando a `main` ou uma PR dependente avançar:

1. buscar as referências remotas;
2. rebasear a branch de trabalho sobre a base correta;
3. resolver cada conflito preservando o estado mais novo e a mudança solicitada;
4. repetir validações e testes focais;
5. fazer push com `--force-with-lease` somente na própria branch;
6. atualizar a PR e aguardar novos checks.

Nunca usar um check antigo para justificar merge de um head diferente.

## Checklist final

- [ ] trabalho separado por responsabilidade e aplicativo;
- [ ] cada agente entregou commit, escopo e teste;
- [ ] integração feita sobre a `main` atual;
- [ ] versões e cópias fixas conferidas;
- [ ] documentação ativa atualizada sem reescrever histórico;
- [ ] teste focal por app e suíte integrada concluídos;
- [ ] PR aponta para a base correta e tem corpo assinado;
- [ ] checks do último SHA estão verdes;
- [ ] merge ainda depende de autorização explícita.
