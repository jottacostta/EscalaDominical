# Plano de trabalho — EscalaDominical

**Status:** plano inicial de documentação e qualidade. Prioridades de produto e alterações de comportamento continuam sob decisão do gerente.

## Auditoria documental — 17/10/2026
A revisão confirmou que os seis pilares são mapas iniciais. Antes de marcar a documentação como concluída, confrontar cada um com os apps atuais (Setores V275 e Encarregados V183), os validadores/serializadores e `testes/rodar.js`. Registrar, por documento, evidência verificada, divergências e testes relacionados. A PR #82 foi incorporada, mas na consulta desta auditoria sua suíte completa ainda estava em execução; conferir o resultado final antes de registrar aprovação.

## Frentes
### P0 — Governança
Ler `AGENTS.md`, conferir PRs abertos e mudanças concorrentes, não sobrescrever trabalho alheio e nunca fazer merge sem autorização explícita.

### P1 — Seis pilares
- PRD: validar objetivos, usuários, requisitos e critérios de aceitação.
- TRD: conferir arquitetura no código real.
- Fluxos: transformar mapas em roteiros de teste.
- Design System: inventariar componentes e validar telas móveis/desktop.
- Modelo de dados: mapear chaves, esquemas, migrações e serialização.
- Plano: revisar prioridades com o gerente; só atribuir responsáveis e prazos quando aprovados.

### P1 — Gabriel
Testar intenções, respostas, contexto, dados disponíveis, fallback e honestidade sobre limitações. Separar conjunto de desenvolvimento e conjunto cego congelado. Medir acerto, erros, falsos positivos, perguntas sem resposta e regressões por app. Vincular relatório a versão, SHA, configuração e artefato. Não chamar o Gabriel de treinado/aprovado só porque a bateria foi executada.

### P2 — Regras da escala
Ampliar testes independentes de domingos, feriados, 6×1, folgas compensatórias, virada do mês e histórico. Priorizar cenários reproduzíveis e testes de mutação. Só alterar o app quando houver defeito reproduzido.

## Portões de conclusão
1. Resultado esperado e escopo definidos.
2. Alteração revisada.
3. Testes pertinentes passaram no SHA final.
4. Relatório informa o que foi e não foi testado.
5. Riscos e regressões conhecidos registrados.
6. Documentação afetada atualizada.
7. Publicação/merge somente com autorização do gerente.

## Riscos
Regras divergentes entre camadas, documentação obsoleta, testes tautológicos, relatórios de Gabriel sem SHA correspondente e exposição de dados reais.

## Acompanhamento
Usar estados baseados em evidência: pendente, em andamento, bloqueado, concluído. Não inventar responsáveis, datas ou percentuais; registrar dúvidas para decisão do gerente.
