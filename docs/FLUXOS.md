# Fluxos do usuário — EscalaDominical

**Status:** roteiro geral inicial; rótulos e exceções devem ser conferidos na versão atual antes de servir como manual.

## Fluxo geral
1. Abrir o endereço correto para a gestão.
2. Carregar/conferir equipe.
3. Consultar o mês anterior quando aplicável.
4. Configurar domingos e balanços quando aplicável.
5. Conferir feriados.
6. Gerar a escala ou usar o modo manual/misto disponível.
7. Ler avisos, corrigir conflitos e completar pendências.
8. Confirmar horários ou decisões quando solicitado.
9. Guardar histórico e exportar conforme a interface.

A ordem e os recursos podem variar entre os apps; não presumir que uma opção exista nos dois.

## Equipe
Entrada: equipe existente ou arquivo/importação suportada. Conferir nome, matrícula, cargo, turno, setor, horário, folga e situação. Casos de teste: arquivo vazio/malformado, campos ausentes, matrícula repetida, nomes parecidos, afastamento e empréstimo.

## Mês anterior, domingos e balanço
Conferir o histórico correto e as sequências entre meses. Configurar os domingos do mês e o balanço conforme as regras existentes. Não inferir dias anteriores sem dados suficientes.

## Feriados
Conferir quem trabalha e as folgas compensatórias, incluindo prazo e datas elegíveis. Se não houver data válida, informar a impossibilidade sem inventar uma data.

## Geração
- Automática: app seleciona conforme as regras e configurações.
- Manual: usuário escolhe pessoas e a auditoria valida conforme comportamento implementado.
- Mista: combina decisões manuais e automáticas; identificar quais dados exigem confirmação.

## Gabriel / Assistente RH
Identificar intenção; determinar quais dados estão disponíveis; responder com fatos verificados; separar regras de informações da tela; pedir esclarecimento quando necessário; admitir quando não sabe. Não afirmar que leu arquivo ou executou ação sem evidência.

## Histórico e exportação
Guardar após conferir a escala. Ao restaurar, validar mês/setor e integridade; testar quais configurações são preservadas. Não dizer “salvo” se a operação falhou.

## Fluxos de erro
Importação inválida → explicar como corrigir. Dados incompletos → indicar o que falta. Regra quebrada → explicar e bloquear quando necessário. Histórico incompatível → não sobrescrever silenciosamente. Gabriel incerto → não inventar.

## Pendência
Transformar cada fluxo em teste com pré-condições, dados fictícios, passos, esperado e observado. Este mapa não substitui testes nem manuais ilustrados.
