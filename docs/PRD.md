# PRD — EscalaDominical

**Status:** versão inicial; requisitos novos precisam de validação do gerente.

## Produto
Dois aplicativos HTML independentes para apoiar gestores na montagem, conferência, consulta e preservação de escalas. Funcionam localmente/offline e têm endereços fixos distintos no GitHub Pages.

- **Escala de Setores:** gestão de equipe, mês anterior, domingos, feriados, geração e conferência.
- **Escala 2×1 de Encarregados:** escala própria da gestão de encarregados, com regras e fluxo próprios.
- Os apps não devem ser fundidos.

## Usuários e necessidades
Gestores e encarregados que usam celular ou computador e precisam criar escalas confiáveis sem conhecimento de programação. A interface deve ser simples, clara e acionável.

## Objetivos
1. Aplicar regras de negócio consistentes.
2. Explicar conflitos e dados faltantes em linguagem simples.
3. Preservar os dados suportados em armazenamento local e históricos.
4. Funcionar sem depender de serviços externos em uso normal.
5. Evitar regressões por meio de testes automatizados.
6. Fazer o Gabriel responder somente com base em capacidades e dados realmente disponíveis.

## Requisitos funcionais
- Carregar e editar equipe conforme as funções disponíveis.
- Configurar mês, consultar mês anterior e informar domingos/feriados.
- Gerar escala ou usar os modos manuais/mistos existentes.
- Auditar regras, distinguir erros de pendências e solicitar confirmações necessárias.
- Guardar/restaurar histórico e exportar os formatos suportados.
- Oferecer ajuda contextual sem substituir o motor da escala ou a auditoria.

## Limites
O app não é ponto eletrônico e não comprova presença. Não presumir sincronização automática entre aparelhos. Não publicar planilhas reais, históricos reais, matrículas ou outros dados pessoais.

## Critérios de aceitação
Comportamento esperado definido; testes pertinentes executados no SHA final; falha reproduzida antes e corrigida depois quando aplicável; versões e cópias fixas coerentes; documentação afetada atualizada; limitações de teste explicitadas. Merge somente com autorização do gerente.

## Pendências
Validar prioridades e metas com o gerente; comparar os requisitos com a interface atual; mapear critérios de aceitação por regra. Este documento não cria regras de negócio novas.
