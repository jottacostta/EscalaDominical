# Propostas de melhoria — teste de estresse da Escala de Setores V228

## Contexto

A suíte existente exercita a Escala de Setores com uma equipe fictícia de 50 pessoas e percorre os meses configurados. O teste reportou sucesso, mas isso não demonstra, por si só, cobertura de todas as combinações de regras e interações.

Este documento separa **lacunas de cobertura** de **defeitos reproduzidos**. Nesta etapa, os itens abaixo são propostas para testes adicionais; nenhum deles é declarado como bug confirmado.

## Prioridade 1 — integridade das regras

1. **Verificação independente da proteção 6×1**
   - Expandir a escala para uma sequência diária por funcionário, incluindo os últimos dias do mês anterior e os primeiros do mês seguinte.
   - Verificar o máximo de seis dias consecutivos de trabalho sem reutilizar a mesma função ou o mesmo resultado interno do gerador como oráculo.
   - Cobrir folgas antecipadas/posteriores e casos em que a escala é manual ou mista.

2. **Domingos consecutivos e domingo de balanço**
   - Validar a sequência dos dois últimos domingos do mês anterior até todos os domingos do mês testado.
   - Testar separadamente a exceção de domingo de balanço e confirmar que ela não mascara uma violação em outros domingos.
   - Incluir fevereiro, meses com quatro/cinco domingos e transição dezembro–janeiro.

3. **Feriados e folgas compensatórias**
   - Cobrir feriado em domingo, feriado na segunda-feira, folga fixa no feriado e a exceção prevista para segunda-feira.
   - Validar o prazo máximo de 20 dias corridos, dias elegíveis para compensação e restrições de sequência de folgas.
   - Criar casos sem data compensatória viável e conferir que o app informa a impossibilidade sem atribuir data inválida.

## Prioridade 2 — cenários-limite e robustez

4. **Equipes inviáveis ou atípicas**
   - Equipe insuficiente para a cobertura mínima por função ou liderança.
   - Pessoas afastadas, jovens aprendizes, folga fixa no domingo e folga fixa ainda “a definir”.
   - Importação vazia, arquivo malformado e dados com campos opcionais ausentes.

5. **Identidade de funcionário**
   - Nomes iguais, nomes contidos em outros nomes e variações de espaços/acentos.
   - Confirmar que bloqueios e avisos apontam para a pessoa correta sem confundir funcionários.

6. **Auditoria da escala manual/mista**
   - Marcar e desmarcar rapidamente pessoas em vários domingos.
   - Alternar entre meses e setores e conferir que a auditoria ao vivo, os selos e os avisos correspondem à seleção atual.
   - Confirmar que uma tentativa inválida é bloqueada e que a seleção anterior permanece consistente.

## Prioridade 3 — persistência e histórico

7. **Salvar e restaurar**
   - Salvar histórico, abrir o JSON em contexto novo e verificar as configurações manuais e os dados de cada setor.
   - Reimportar a equipe do ERP e confirmar que escolhas manuais protegidas não são sobrescritas.
   - Testar histórico ausente, incompleto ou de versão anterior, com comportamento previsível e mensagens claras.

8. **Asserções negativas e independentes**
   - Cada teste deve falhar quando uma regra é violada; evitar comparações tautológicas ou verificar somente o texto de status.
   - Sempre que possível, validar o resultado por uma segunda implementação de referência, baseada em datas e regras explícitas.
   - Incluir testes de mutação simples: introduzir temporariamente uma violação conhecida e confirmar que o verificador a detecta.

## Estratégia de implementação sugerida

- Acrescentar os cenários gradualmente a `testes/rodar.js` e, se necessário, criar módulos auxiliares pequenos para a verificação independente.
- Usar exclusivamente dados fictícios em `testes/dados/`; nunca incluir planilhas, históricos reais, nomes ou matrículas reais.
- Executar `npm test` e `npm run test:completo`; conferir o check **Testes** no GitHub antes de considerar a mudança pronta.
- Manter o escopo inicial em testes. Só abrir uma versão nova do app se algum teste reproduzir um defeito e a correção no aplicativo for necessária.
- Não declarar um cenário como corrigido até que exista um teste reproduzível e uma execução registrada.

## Limitação desta proposta

Este arquivo documenta recomendações de cobertura. Não acrescenta ainda novos testes executáveis nem altera o HTML da V228. O PR de passagem de bastão #21 está aberto e toca em `testes/rodar.js` e na documentação de continuidade; a integração dessas propostas com a passagem deve ser concluída após a resolução desse PR, para evitar sobreposição de trabalho.

Assinado: ChatGPT
