# Diagnóstico técnico — Fase 2 do motor 5×2

**Responsável:** ChatGPT (Subencarregado)  
**Base examinada:** main em `f8f90d78593bfa61cafb9923fbce6ed3d3a60f80`  
**Apps:** Setores V285; Encarregados V189  
**Estado:** diagnóstico inicial; sem alteração de comportamento de produção.

## Conclusão executiva

A infraestrutura V274 **não implementa o regime 5×2 completo**. Ela persiste a configuração e expõe `maxSeguidos()`, que limita a sequência de dias trabalhados. Configurar o limite para cinco não garante dois repousos em cada semana, nem uma média mensal de repousos, nem controla jornada semanal. O resumo de V274 também descreve apenas o limite de dias consecutivos.

Os dois aplicativos são HTMLs monolíticos com camadas JavaScript versionadas. O motor existente está fortemente orientado à escala de domingos, feriados, DSR, cobertura e histórico; não há evidência, na camada V274, de um calendário diário completo de presença/ausência capaz de impor 5 dias de trabalho + 2 repousos a cada pessoa. Portanto, não é seguro ativar 5×2 mudando somente configuração, texto do Gabriel ou o limite de sequência.

## Evidências verificadas

1. `maxSeguidosTrab()` consulta `window.v274Regime.maxSeguidos()` e usa 6 como fallback.
2. V274 mantém `ativo`, `regime`, `maxSeguidos`, `vigenciaInicio` e `definidoEm` em `localStorage`; o padrão é desligado e 6×1.
3. O histórico exporta o regime como metadado, mas esse registro não cria nem valida dois dias de descanso.
4. `docs/PLANO_5x2.md` inclui CCT compensatória mensal, continuidade entre meses e adaptação de “3 domingos seguidos”; essas regras ainda precisam ser conectadas a um motor de datas de descanso, não apenas a `maxSeguidosTrab()`.
5. Os testes existentes verificam principalmente escala dominical, feriados, DSR compensatório, histórico e restrições operacionais. A suíte precisa de um verificador independente para os descansos semanais 5×2 e a jornada semanal.

## Decisão técnica recomendada

**Não ligar o 5×2 em produção ainda.** Desenvolver primeiro uma função pura de validação de calendário, sem dependência do DOM, e integrá-la ao motor apenas após definir qual entidade representa o trabalho diário em cada aplicativo.

### Contrato mínimo do validador

Entrada por funcionário e intervalo de datas:
- dias efetivamente escalados para trabalho;
- repousos semanais e exceções justificadas;
- data de início/fim do intervalo, incluindo dias adjacentes ao mês;
- regime selecionado e eventual regime compensatório mensal documentado;
- restrições preexistentes de folga fixa, setor, afastamento/emprestado e cobertura.

Saída:
- `valid` booleano;
- violações estruturadas com código, datas e explicação;
- totais semanais e por período mensal;
- sem corrigir ou alterar automaticamente a escala.

### Matriz obrigatória de testes

1. Cinco dias de trabalho e dois repousos na semana: válido.
2. Seis dias de trabalho e um repouso em semana comum: inválido no 5×2 estrito.
3. Cinco dias seguidos de trabalho com dois repousos separados: verificar regra semanal, não apenas sequência.
4. Sequência que atravessa domingo/mês/ano: nenhuma semana pode desaparecer no recorte.
5. Última semana do mês e primeira semana seguinte: a validação deve considerar dias fora do mês visível.
6. Repouso fixo e restrições setoriais incompatíveis: apontar conflito; não mover folga silenciosamente.
7. Afastado/emprestado: aplicar política explicitamente definida, sem contar indisponibilidade como repouso trabalhista automaticamente.
8. Edição manual que cria violação: sinalizar sem sobrescrever a escolha.
9. Histórico exportado/importado e recarga: preservar regime e calendário; abrir histórico não deve ativar regime por si só.
10. Regime compensatório mensal: somente aceitar com configuração explícita e validação dos limites por semana e mês definidos pela regra coletiva.
11. Regressão: 6×1 desligado deve preservar os resultados anteriores.
12. Ambos os aplicativos devem produzir a mesma classificação para calendários equivalentes, respeitando diferenças funcionais.

## Sequência de implementação

1. Confirmar com o diagnóstico da Fase 1 a fonte real de dados diários e as regras de CCT aplicáveis.
2. Criar validador puro e testes unitários determinísticos.
3. Integrar a validação à geração e à edição manual, sem alterar o algoritmo dominical antes de testes.
4. Acrescentar opção configurável somente quando a validação estiver ativa e a interface explicar as regras.
5. Rodar `cd testes && npm test` e a bateria completa de 12 meses; exigir CI verde em ambos os apps.
6. Revisão independente e autorização do gerente antes de merge.

## Limite deste diagnóstico

Este documento não é parecer jurídico nem certifica a interpretação da EC/CCT. Os limites de jornada, datas de vigência e exceções coletivas precisam de validação jurídica e do instrumento coletivo aplicável antes de serem codificados como regra universal.
