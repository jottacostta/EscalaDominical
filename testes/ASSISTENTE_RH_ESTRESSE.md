# Plano de estresse — Assistente RH (Setores V262 e Encarregados V176)

**Objetivo:** reproduzir o comportamento atual de aprendizado/importação antes de propor uma correção. Este plano não autoriza alterar o algoritmo nem fazer merge; primeiro registre evidências e apresente a recomendação ao gerente.

## Contexto técnico confirmado no código revisado

- O Assistente RH não é um modelo de aprendizado de máquina. Ele registra contagens e preferências e gera dicas por regras.
- Setores usa `localStorage` com a chave `escalaSetores.v262Assistente`; Encarregados usa `enc.v176Assistente`.
- Em ambos, a junção de `esc`, `rec` e `ace` usa `Math.max(local, importado)`. Setores também combina `hor` por máximo; no trecho examinado de Encarregados, `hor` não era combinado.
- Em ambos, o campo mensal `dm` só é copiado quando o mês ainda não existe localmente.
- Reimportar o mesmo histórico parece idempotente para os contadores, mas a combinação de históricos independentes pode descartar observações.
- A simulação isolada já reproduzida com dados fictícios demonstrou que contadores 5 e 4 são consolidados como 5, não 9; o mesmo ocorre com 1 e 3 (resultado 3, não 4). Isso confirma perda potencial quando os valores representam observações independentes. Ainda é preciso verificar no fluxo real se esses dados têm semântica de contador cumulativo, réplica ou evento independente.
- A execução completa no navegador não foi realizada nessa análise. Não declarar os cenários abaixo aprovados sem rodá-los.

## Regras para a simulação

1. Use apenas nomes, matrículas, setores, datas e horários fictícios.
2. Execute os mesmos cenários separadamente nos dois aplicativos.
3. Antes de alterar código, identifique o caminho real: ação na tela → evento → função → armazenamento/histórico → importação/junção → dica exibida.
4. Registre para cada cenário: estado inicial, ação, resultado esperado, resultado observado, console, chave de armazenamento e arquivo/trecho relevante.
5. Separe **confirmado**, **provável** e **não confirmado**. Se um teste não puder ser executado, marque-o como não executado.
6. Não substitua `Math.max` por soma sem definir antes a semântica dos dados e uma estratégia de deduplicação. Somar uma réplica importada duas vezes duplicaria o aprendizado.
7. Não altere os arquivos dos aplicativos nem proponha versão nova antes de entregar o diagnóstico reproduzível. Não faça merge.

## Matriz de estresse

| ID | Cenário | Procedimento | Critério de avaliação |
|---|---|---|---|
| ARH-01 | Reimportação idêntica | Exportar um histórico fictício e importá-lo 10 vezes | Contagens e dicas não podem crescer apenas por reimportar a mesma informação |
| ARH-02 | Históricos independentes | Criar dois históricos com observações diferentes para a mesma pessoa fictícia e juntar | Determinar se o merge perde observações; não presumir que soma é correta sem identidade de evento |
| ARH-03 | Importação em ordem inversa | Juntar A→B e depois B→A em cópias limpas | Verificar se o resultado depende da ordem; documentar diferenças em `dm` e horários |
| ARH-04 | Mês conflitante | Mesma chave mensal com valores diferentes em cada origem | Registrar qual valor prevalece, se há aviso e se o comportamento está de acordo com a origem autoritativa |
| ARH-05 | Muitos fragmentos | Consolidar 20 fragmentos fictícios com sobreposição e sem sobreposição | Comparar contagens esperadas, resultado real, duplicação e perda |
| ARH-06 | Grande volume | Gerar 1.000 eventos fictícios para várias pessoas, meses e tipos | Sem travamento; contagens e tempo de resposta registrados |
| ARH-07 | Dados repetidos e parciais | Importar histórico completo, parcial e repetido em ordens variadas | Resultado consistente, sem apagar informação válida nem contar duplicatas |
| ARH-08 | JSON malformado | Importar arquivo truncado, JSON inválido e objeto sem `assistente` | Mensagem compreensível; estado atual preservado; sem erro não tratado |
| ARH-09 | Esquema inesperado | Importar contagens negativas, strings, `null`, arrays e meses inválidos | Dados rejeitados ou normalizados de forma segura; nenhum contador corrompido |
| ARH-10 | Persistência rápida | Fazer alterações e fechar/recarregar imediatamente, inclusive antes de 300 ms | Verificar se a última ação persiste ou se há janela real de perda |
| ARH-11 | Troca de mês/ano | Aprender, mudar mês/ano e aprender novamente rapidamente | Cada observação deve ser atribuída ao mês correto |
| ARH-12 | Eventos rápidos | Marcar/desmarcar, aceitar/rejeitar e gerar escala em sequência rápida | Sem contagens duplicadas, dados obsoletos ou seleção incorreta |
| ARH-13 | Diferença entre apps | Repetir cenários de horário e aceitação em Setores e Encarregados | Explicar diferenças intencionais e identificar inconsistências |
| ARH-14 | Qualidade das dicas | Construir histórico em que a preferência mais frequente não seja a escolha adequada no caso atual | Dica deve ser apresentada como sugestão, não como regra; registrar precisão e falsos positivos |
| ARH-15 | Estado vazio e restauração | Limpar armazenamento de teste, restaurar histórico e recarregar | Aprendizado restaurado corretamente e sem depender do dispositivo anterior |

## Como testar

- Primeiro, inspecione `testes/rodar.js` e os seletores/eventos já existentes. Reutilize a infraestrutura atual; não crie outro workflow de CI.
- Acrescente testes automatizados reproduzíveis para ambos os HTMLs, preferencialmente começando por ARH-01 a ARH-05 e ARH-08 a ARH-11.
- Os testes devem falhar de verdade diante de uma regressão e comparar resultados esperados independentes dos resultados calculados.
- Rode `cd testes && npm test`. Se o ambiente permitir, rode também `npm run test:completo`; registre explicitamente qualquer bloqueio de navegador/ambiente.
- Use o CI da PR como verificação complementar, não como substituto de relatar o que foi executado localmente.
- Não inclua históricos reais, nomes reais, matrículas reais ou arquivos de RH no repositório.

## Entrega esperada do Claude

1. Tabela com resultado por ID: passou, falhou, não executado.
2. Evidência reproduzível para cada falha, incluindo os dois aplicativos.
3. Explicação da semântica de `esc`, `rec`, `ace`, `hor` e `dm`: contador cumulativo, evento independente, fotografia mensal ou preferência.
4. Proposta de política de merge: identidade de evento, deduplicação, regra de conflito mensal, validação de esquema e migração retrocompatível.
5. Sugestão de melhoria priorizada por risco e impacto, sem implementá-la nesta etapa.
6. Depois da revisão conjunta, aguardar autorização do gerente para alterar o algoritmo.

**Assinado: ChatGPT**
