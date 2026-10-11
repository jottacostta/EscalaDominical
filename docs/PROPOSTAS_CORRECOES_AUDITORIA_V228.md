# Proposta técnica — auditoria ao vivo da Escala de Setores V228

**Objetivo:** entregar ao Claude uma lista priorizada de investigações e correções para a auditoria da escala manual/mista. Este documento é uma proposta de trabalho, não uma afirmação de que todos os riscos descritos já foram reproduzidos.

## Responsabilidade e fluxo de trabalho

- **Responsável pela implementação:** Claude.
- **Responsável por integrar no `main`:** Claude, depois de revisar o diff, executar os testes e verificar os checks obrigatórios.
- **Papel deste PR do ChatGPT:** registrar achados de leitura do código e critérios de aceitação. Não implementar correções no HTML nem criar a V229 neste PR.
- Claude deve partir do `main` atualizado, verificar se há trabalho concorrente, reproduzir cada hipótese antes de corrigir e manter as regras de negócio existentes.
- Se um cenário não reproduzir defeito, documentar o resultado e não alterar o comportamento apenas por precaução.
- Nenhuma alteração deve ser integrada ao `main` por este PR. O Claude deve fazer sua própria revisão e conduzir o merge quando estiver satisfeito com os testes.

## Achados para investigar

### P1 — Consistência do estado usado pelo bloqueio da marcação

**Local:** bloco V227/V228 no final de `Escala_de_Setores_V228.html`, especialmente `ultimo`, `auditar()`, `rodar()` e o listener `change` (aprox. linhas 12.253–12.300).

O bloqueio compara os erros atuais (`res.r`) com o snapshot anterior (`ultimo.r`). A rotina reaudita em várias mudanças, mas é necessário comprovar que o snapshot é invalidado/recalculado nas transições de setor, mês, modo manual/misto e restauração de estado.

**Testes de aceitação:**
- marcar e desmarcar rapidamente em vários domingos;
- alternar mês, setor e modo sem recarregar a página;
- restaurar/limpar uma seleção e tentar provocar a mesma violação novamente;
- confirmar que uma marcação inválida é revertida, que a mensagem corresponde à pessoa/regra certa e que as demais seleções permanecem intactas;
- confirmar que nomes sobrepostos (ex.: “Ana Silva” e “Ana Silva Souza”) não cruzam os avisos.

### P1 — Auditoria 6×1 nas fronteiras do mês

**Local:** `auditarProtecao6x1Simulada(sel, mapa)`, aprox. linhas 6.641–6.660.

A rotina percorre sete dias antes e depois do mês, mas trata domingos externos ao mês como dias não trabalhados. Para dias úteis externos, infere trabalho principalmente a partir da folga fixa. Isso pode divergir da escala real, embora ainda seja necessário reproduzir o impacto em cenários controlados.

**Testes de aceitação:**
- sequência que começa no fim do mês anterior e termina no início do mês atual;
- sequência que começa no fim do mês atual e termina no início do seguinte;
- dezembro/janeiro e fevereiro/março, inclusive ano bissexto;
- comparação com um verificador independente, usando escala/histórico fictício dos dias adjacentes;
- quando não houver dados adjacentes suficientes, não presumir silenciosamente um resultado que dependa desses dados.

Só corrigir se o teste demonstrar divergência. Preservar as regras de negócio aprovadas pelo projeto.

### P1 — Associação de avisos aos domingos

**Local:** `domsDe(texto)`, `window.v228DomsDe`, aprox. linhas 12.241–12.252.

A associação interpreta o texto do aviso: data no início, intervalo de datas ou nome da pessoa. A primeira estratégia confere mês e ano, mas não valida explicitamente se o dia existe e corresponde a um domingo da escala. O intervalo também precisa de cobertura de fronteira entre meses e anos.

**Testes de aceitação:**
- data válida de domingo, data de dia útil e dia impossível (por exemplo, 31/02);
- data de outro mês/ano;
- período que cruza mês e ano;
- aviso sem data associado a pessoa selecionada em zero, um e vários domingos;
- nomes iguais ou parcialmente sobrepostos;
- item de aviso sempre navega para o cartão correto; se não houver correspondência segura, não deve apontar para um domingo arbitrário.

Avaliar se os avisos podem usar metadados estruturados (regra, pessoa, data inicial/final) em vez de depender apenas do texto apresentado. Não é necessário fazer uma refatoração ampla para resolver casos isolados.

### P1 — Verificar a efetividade de `auditarDescansosSimulados(mapa)`

**Local:** aprox. linhas 6.620–6.639, chamada por `auditarSelecaoAntesDaGeracao()`.

A função percorre datas e monta um mapa de pessoas com folga fixa, DSR e compensação de feriado, mas termina retornando `erros` sem adicionar ocorrências a essa lista. Isso indica que essa rotina específica não gera erros atualmente. Outras verificações de descanso existem no código, então não se deve concluir que toda validação de folga esteja ausente.

**Testes de aceitação:**
- identificar qual conflito essa função deveria detectar, consultando as regras/documentação do projeto;
- criar um caso válido e um caso inválido com dados fictícios;
- demonstrar que o verificador independente detecta o conflito e que a auditoria do app o reporta;
- conferir que a correção não duplica mensagens já emitidas por outras funções nem muda regras aprovadas.

Se a função for redundante ou intencionalmente inativa, documentar essa conclusão em vez de inventar uma nova regra.

### P2 — Classificação de avisos

**Local:** expressão regular `PEND` e função `auditar()`, aprox. linhas 12.226–12.239.

A distinção entre “regra quebrada” e “falta completar” depende de correspondência textual. “Cobertura funcional insuficiente”, por exemplo, entra na categoria de pendência. Confirmar se essa apresentação é coerente com o bloqueio de geração e com a linguagem usada para o encarregado.

**Critério de aceitação:** cada tipo de aviso tem uma categoria intencional, explicação compreensível e indicação inequívoca se bloqueia a geração. Alterar a classificação só depois de definir o comportamento esperado com exemplos de teste.

### P2 — Custo dos observadores e auditorias repetidas

**Local:** camadas V223/V224 e bloco V227/V228; a auditoria agenda atualizações em eventos e também por intervalo quando a página está visível.

Medir antes de otimizar: registrar duração e frequência da auditoria com equipe fictícia grande, durante marcações rápidas, alternância de mês e redesenho dos cartões.

**Critério de aceitação:** sem erros de JavaScript, sem perda de seleção e sem regressão visual/funcional; se houver gargalo mensurável, reduzir trabalho redundante sem eliminar atualizações necessárias.

## Plano de execução recomendado

1. Reproduzir cada hipótese em teste isolado, sem alterar o HTML.
2. Acrescentar testes de regressão a `testes/rodar.js` e ampliar o verificador independente existente, em vez de criar outro verificador concorrente.
3. Priorizar P1; tratar P2 somente após estabelecer critérios de aceitação.
4. Executar `cd testes && npm test` e `npm run test:completo` conforme os scripts do projeto; verificar o check **Testes** no GitHub.
5. Se algum teste confirmar defeito no app, implementar a menor correção possível em nova versão, seguindo `AGENTS.md`: preservar a versão anterior, atualizar a cópia publicada, histórico de versões, `CHANGELOG.md`, `README.md` e `docs/PASSAGEM.md`.
6. Claude revisa o diff, registra o resultado dos testes e **é responsável por decidir e executar o merge no `main`** após todos os checks exigidos ficarem verdes.

## Fora do escopo deste PR

- Alterar regras trabalhistas ou regras de negócio por inferência.
- Refatorar o HTML inteiro.
- Criar a V229 sem teste que demonstre a necessidade.
- Usar dados reais de funcionários, planilhas do RH ou históricos reais nos testes.

Assinado: ChatGPT
