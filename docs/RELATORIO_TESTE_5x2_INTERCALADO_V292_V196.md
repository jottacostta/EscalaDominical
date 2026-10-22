# Relatório de teste — distribuição intercalada de folgas 5×2

**Data:** 21/10/2026
**PR:** [#108 — Área experimental 5×2 V292/V196](https://github.com/jottacostta/EscalaDominical/pull/108)
**Branch:** `manus/teste-5x2-config`
**Validade:** exclusivamente experimental; não é homologação operacional, jurídica ou trabalhista.

## Objetivo

Verificar, nos dois aplicativos, se a área 🧪 de teste 5×2 apresenta uma distribuição preferencialmente intercalada das duas folgas semanais, mostra o resultado corretamente e permanece isolada da escala oficial.

O ensaio foi feito pela interface com Playwright/Chromium headless, usando os dados fictícios versionados:

- Setores: `testes/dados/setores_frente_de_loja_50.txt` — 50 pessoas;
- Encarregados: `testes/dados/encarregados_15_pares.txt` — 32 pessoas.

Foram testados setembro/2026, outubro/2026, dezembro/2026 e janeiro/2027. Em cada cenário foram carregados os dados, escolhido o mês pelo fluxo normal, aberto o cartão de Configurações, habilitado o ensaio e acionado **Simular**.

## Métrica

O resultado público dos dois ensaios registra `separada`/`paresSeparados` e `ultimo-recurso` por combinação **pessoa-semana**. Portanto, as contagens abaixo não significam semanas-calendário distintas: são o número de pessoas avaliadas em cada uma das cinco semanas do mês.

- Setores: 50 pessoas × 5 semanas = 250 combinações e 500 folgas;
- Encarregados: 32 pessoas × 5 semanas = 160 combinações e 320 folgas.

`separada` significa que as duas folgas ficaram em dias diferentes, priorizando a distribuição intercalada. `ultimo-recurso` significa que a combinação consecutiva foi usada porque não havia alternativa separada aceita pelas restrições do ensaio.

## Setores V292

| Mês | Pessoas | Semanas | Folgas | Intercaladas | Último recurso | Erros | Avisos |
|---|---:|---:|---:|---:|---:|---:|---:|
| 09/2026 | 50 | 5 | 500 | 243 (97,2%) | 7 (2,8%) | 0 | 11 |
| 10/2026 | 50 | 5 | 500 | 236 (94,4%) | 14 (5,6%) | 0 | 18 |
| 12/2026 | 50 | 5 | 500 | 235 (94,0%) | 15 (6,0%) | 0 | 19 |
| 01/2027 | 50 | 5 | 500 | 220 (88,0%) | 30 (12,0%) | 0 | 34 |

A interface mostrou em todos os cenários o cartão de teste, checkbox, botão habilitado, resumo quantitativo, lista expansível por pessoa/semana e a mensagem de teste concluído. A queda da proporção intercalada em janeiro foi registrada como aumento do fallback, sem erro de auditoria; não deve ser confundida com falha do ensaio.

## Encarregados V196

| Mês | Pessoas | Semanas | Folgas | Intercaladas | Último recurso | Erros | Domingos |
|---|---:|---:|---:|---:|---:|---:|---|
| 09/2026 | 32 | 5 | 320 | 160 (100%) | 0 | 0 | Fora do ensaio; política oficial 2×1 |
| 10/2026 | 32 | 5 | 320 | 160 (100%) | 0 | 0 | Fora do ensaio; política oficial 2×1 |
| 12/2026 | 32 | 5 | 320 | 160 (100%) | 0 | 0 | Fora do ensaio; política oficial 2×1 |
| 01/2027 | 32 | 5 | 320 | 160 (100%) | 0 | 0 | Fora do ensaio; política oficial 2×1 |

A interface mostrou em todos os cenários o cartão, checkbox, botão, resumo e lista com as 32 pessoas. Nenhuma folga experimental caiu em domingo e o resultado confirmou que os domingos continuam submetidos à política oficial 2×1.

## Isolamento verificado

Nos dois aplicativos, em cada mês:

- **Simular** não alterou equipe, escala oficial, domingos, feriados, histórico, Excel, `localStorage`, `sessionStorage` ou os bancos oficiais observados;
- **Limpar** removeu somente o resultado experimental e deixou o ensaio sem aplicação oficial;
- o resultado público passou a `null` depois de limpar;
- **Recarregar** não restaurou a habilitação nem o resultado do ensaio;
- não houve `pageerror` nem `console.error` nos cenários.

## Limitações encontradas

1. O resultado é uma métrica pessoa-semana, não uma contagem de semanas-calendário. Não usar diretamente os números acima para declarar cobertura mensal.
2. O ensaio não valida jornada de 42h/40h, minutos pagos, intervalo, feriados trabalhados, cobertura por função/turno, continuidade entre meses ou conformidade jurídica.
3. No Encarregados, o recarregamento normal do aplicativo regrava o rascunho oficial `escala_enc_rascunho_v1`, alterando timestamp, etapa e mês padrão para novembro/2026. Isso ocorre durante o boot, não durante **Simular** ou **Limpar**, não restaura o resultado experimental e é uma limitação preexistente da persistência da interface.
4. No Setores, a necessidade de fallback aumentou para 12% em janeiro/2027. O comportamento foi classificado como último recurso e não apresentou erro de auditoria, mas deve ser investigado antes de qualquer uso operacional.

## Conclusão

A área experimental apresenta a preferência esperada por duas folgas intercaladas: entre 88% e 97,2% das combinações pessoa-semana no Setores e 100% no Encarregados, nos cenários testados. A interface é compreensível, mostra o resultado e mantém o ensaio isolado da escala oficial. Os resultados servem para orientar a próxima investigação do motor real; não autorizam ativar o 5×2 oficial nem afirmar conformidade de jornada.

**Assinado: Manus**
