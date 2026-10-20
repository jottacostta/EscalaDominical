# Investigação e simulação — regime 5×2 em 42h e 40h

**Data:** 20/10/2026  
**Branch analisada:** `manus/5x2-config`  
**Apps:** Setores V286 e Encarregados V190  
**Objetivo:** investigar o que o código atual realmente controla e simular a distribuição de duas folgas nas fases de 42h e 40h, mantendo o domingo como política 2×1 até eventual nova CCT.

## Resultado principal

A camada V274 não implementa ainda o regime 5×2. Ela apenas centraliza o limite de dias consecutivos de trabalho. Quando desligada, mantém o limite histórico de seis dias; quando configurada para 5, passa a rejeitar sequências acima de cinco dias, mas não cria a segunda folga semanal, não calcula horas e não garante cinco dias trabalhados em cada semana.

A simulação dos 88 registros fictícios disponíveis encontrou o mesmo horário textual em todos os casos: **8h20 de presença por dia**. Repetir esse horário em cinco dias produz **41h40 por semana**. Esse resultado fica 20 minutos abaixo de 42h, mas 1h40 acima de 40h. A conclusão horária é provisória porque o cadastro não informa intervalo, minutos pagos, horas extras ou a jornada efetivamente realizada.

A distribuição das folgas pode ser a mesma nas duas fases. O que muda de 42h para 40h é a meta de minutos pagos por dia trabalhado: **8h24 por dia em cinco dias** na primeira fase e **8h00 por dia em cinco dias** na segunda.

## O que foi encontrado no código

### Regime e corte de data

Nos dois apps, `window.v274Regime` começa desligado com `regime: '6x1'` e `maxSeguidos: 6`. A função `maxSeguidosTrab()` lê esse valor e é usada por geradores, auditorias e avisos.

A camada V286/V190 expõe a seleção por data e rotula o período anterior a 16/12/2026 como 6×1 e o período posterior como 5×2. Esse dispatcher não substitui o motor antigo, não cria duas folgas e não alimenta um acumulador de horas. Portanto, o rótulo 5×2 pode aparecer sem que a escala tenha sido efetivamente gerada por um motor 5×2.

### Motor de Setores

No V286, os pontos relevantes são:

- `trabalharBaseNaData()` determina se uma pessoa trabalha em uma data usando domingo, feriado, descanso associado e folga fixa.
- `candidatoRespeita6x1()` testa uma sequência diária contra `maxSeguidosTrab()`.
- `auditarProtecao6x1()` e `auditarProtecao6x1Simulada()` rejeitam sequências acima do limite.
- `registrarDescansosDoDomingo()` registra o descanso anterior/posterior relacionado a um domingo trabalhado.
- `contarFolgasNaData()` consolida folga fixa, DSR e folga compensatória.

Essas funções trabalham com estados de trabalho/descanso por data, mas não somam minutos de jornada. O horário cadastrado é texto usado para identificar turno e escolher horários de domingo ou feriado.

### Motor de Encarregados

No V190, os pontos relevantes são:

- `trabalhaNaDataBase()` decide o estado diário considerando domingo, feriado e descanso associado.
- `validarEscala()` verifica domingos, feriados, DSR e a sequência máxima de trabalho.
- `registrarDescansosDoDomingo()` e `ehDescansoAssociado()` cuidam do par de descansos vinculado ao domingo.
- O fallback de dias úteis trata o dia como trabalho; uma segunda folga semanal independente não é materializada pelo motor.

O domingo continua sendo uma camada própria de 2×1. Isso não substitui uma regra que conte duas folgas dentro de cada semana nem uma regra que some horas.

### Regras que continuam presas ao 6×1

A auditoria encontrou mensagens, painéis e verificadores que ainda falam em 6×1 ou em sete dias consecutivos. O teste independente da V247 também compara calendários com a lógica fixa de 6×1. Apenas alterar `maxSeguidosTrab()` deixaria gerador, auditoria, mensagens e testes com interpretações diferentes.

O cálculo de capacidade de folgas de Setores também usa uma meta derivada de sete dias. Isso é uma heurística operacional do ciclo antigo, não uma validação de 5×2.

## Simulação das folgas

A simulação usou somente os dados fictícios já versionados em `testes/dados`:

- 50 pessoas de Frente de Loja;
- 6 pessoas de CPD;
- 32 pessoas no quadro de Encarregados.

Total: **88 pessoas**.

A regra simulada foi deliberadamente simples e auditável: preservar a folga atual como primeira folga, escolher uma segunda folga com menor concentração e impedir que as duas folgas fossem dias consecutivos no ciclo semanal. Essa simulação não altera o app e não pretende ser o algoritmo final de cobertura.

### Frente de Loja — 50 pessoas

A distribuição simulada de folgas ficou: domingo 15, segunda 16, terça 15, quarta 15, quinta 15, sexta 12 e sábado 12. A cobertura de trabalho correspondente ficou: domingo 35, segunda 34, terça 35, quarta 35, quinta 35, sexta 38 e sábado 38.

Exemplos de pares de folga produzidos pela heurística: domingo + terça; segunda + sábado; segunda + quarta; segunda + quinta; e segunda + sexta.

### CPD — 6 pessoas

A distribuição simulada de folgas ficou: domingo 2, segunda 2, terça 2, quarta 2, quinta 2, sexta 1 e sábado 1. A cobertura ficou: domingo 4, segunda 4, terça 4, quarta 4, quinta 4, sexta 5 e sábado 5.

O quadro pequeno mostra um risco operacional: uma distribuição matematicamente equilibrada ainda precisa respeitar cobertura mínima por função e por turno. O motor final não pode escolher folgas apenas pelo total diário.

### Encarregados — 32 pessoas

A distribuição simulada de folgas ficou: domingo 9, segunda 10, terça 10, quarta 10, quinta 10, sexta 7 e sábado 8. A cobertura ficou: domingo 23, segunda 22, terça 22, quarta 22, quinta 22, sexta 25 e sábado 24.

Nos Encarregados, a cobertura também precisa preservar a composição mínima de Encarregado e Subencarregado, além da regra de setores diferentes aos domingos. Por isso, a contagem diária não pode ser usada sozinha para aceitar uma solução.

### Verificação do limite de dias consecutivos

Pares separados como terça + quinta produzem no máximo três dias de trabalho consecutivos em uma semana. Pares como segunda + sábado podem produzir cinco dias consecutivos, mas não seis. Assim, a heurística respeita o limite de cinco dias, mas isso não prova que a escala atende 42h ou 40h.

O ponto mais importante é que **uma trava de no máximo cinco dias não garante duas folgas**. Um calendário pode ter no máximo cinco dias consecutivos e ainda distribuir apenas uma folga em uma semana, compensando com outra folga fora do período de apuração. O motor precisa contar folgas e horas por semana, não apenas o maior bloco consecutivo.

## Comparação entre 42h e 40h

### Fase de 42h

Com cinco dias trabalhados, a meta matemática é:

```text
42h ÷ 5 = 8h24 de minutos pagos por dia
```

Se os 8h20 cadastrados forem interpretados como minutos pagos, cinco dias somam 41h40 e ficam 20 minutos abaixo do teto de 42h. Essa interpretação ainda precisa ser confirmada pelo RH, porque o campo atual não distingue presença de jornada paga.

Se os 8h20 forem presença com uma hora de intervalo não pago, o tempo pago seria 7h20 por dia, ou 36h40 em cinco dias. Nesse cenário, seria necessário definir uma jornada diária maior para chegar a 42h. O app atual não tem os dados para decidir entre as duas interpretações.

### Fase de 40h

Com cinco dias trabalhados, a meta matemática é:

```text
40h ÷ 5 = 8h00 de minutos pagos por dia
```

Se os 8h20 cadastrados forem minutos pagos, o horário precisaria ser reduzido em 20 minutos por dia para chegar a 40h, ou a escala precisaria usar uma combinação explícita de jornadas menores. Se houver intervalo não pago, a alteração necessária será diferente.

Logo, a fase de 40h não é resolvida apenas trocando o limite de seis para cinco dias. É necessário modelar a duração da jornada e o intervalo.

### O que não muda entre as fases

A política de distribuição das duas folgas pode permanecer igual: duas folgas semanais não consecutivas, com cobertura equilibrada. O cálculo de horas deve ser parametrizado pela vigência:

- até 15/12/2026: motor legado 6×1;
- de 16/12/2026 a 15/12/2027: motor 5×2 com teto de 42h;
- a partir de 16/12/2027: motor 5×2 com teto de 40h.

As datas acima seguem o plano atualmente copiado em `docs/PLANO_5x2.md`. A confirmação jurídica e a parametrização final devem continuar sob responsabilidade do RH/jurídico.

## Interação com o domingo 2×1

A decisão atual é manter o domingo 2×1 até eventual nova CCT. Isso precisa ser tratado como uma regra acoplada ao motor 5×2, não como uma substituição dele. O rodízio mensal descrito no anexo fica fora desta etapa.

Na base analisada, 35 pessoas têm a folga principal em segunda ou sábado. Se a rotação quiser conceder domingo como segunda folga e, ao mesmo tempo, impedir folgas consecutivas, essas pessoas não poderão receber domingo sem deslocar a folga principal ou aceitar uma exceção. Outras 51 pessoas têm uma folga principal que permite domingo como segundo descanso não consecutivo. Duas pessoas já têm domingo como folga principal.

Esse resultado não determina a escala final. Ele mostra que o rodízio dominical precisa entrar no mesmo planejador que distribui as duas folgas. Se o domingo continuar fora do contador semanal, o sistema pode mostrar uma escala rotulada 5×2 que, na prática, tem uma combinação incompatível de domingos trabalhados, DSR e folgas.

## Dados que faltam antes da implementação

Para validar a jornada, o cadastro precisa representar pelo menos:

1. minutos pagos por jornada ou início, fim e intervalo;
2. jornada efetivamente planejada para cada data, incluindo domingos, feriados, balanço e trocas;
3. regra de intervalo pago ou não pago;
4. virada de meia-noite para horários noturnos;
5. horas extras, afastamentos e ausências;
6. semana de apuração e continuidade entre meses;
7. regra de média mensal e mínimo semanal caso a exceção de CCT seja suportada;
8. vínculo entre cobertura mínima por função/turno e cada candidato a folga.

Sem esses campos, o app deve informar que a validação horária está incompleta. Não deve inferir horas pagas apenas do texto `08:00 AS 16:20`.

## Próxima implementação segura

A implementação deve ser dividida em duas camadas:

- **Motor de folgas:** gerar duas folgas semanais, conferir no máximo cinco dias de trabalho, impedir duplicidade e integrar DSR, feriado, balanço, liderança e domingo 2×1.
- **Motor de jornada:** calcular minutos por data e por semana, parametrizar 42h e 40h por vigência, bloquear ou alertar totais acima do teto e preservar a continuidade entre meses.

Os testes devem cobrir, nos dois apps, cinco dias trabalhados e seis dias trabalhados no limite 5×2; exatamente 42h, 42h01, exatamente 40h e 40h01; virada de mês; feriado trabalhado com compensação; domingo 2×1; e a persistência da configuração após recarregar o aparelho.

Esta investigação não alterou o motor dos aplicativos. Ela produz a base para implementar o segundo motor sem declarar conformidade horária antes de existir o modelo de jornada.

## Referências

[1]: `docs/PLANO_5x2.md` — plano de ação da EC 141/2026, fases de 42h e 40h e calendário de transição.

[2]: `Escala_de_Setores_V286.html` — camada V274, funções de sequência, DSR, folga fixa, feriados e seleção dominical do app de Setores.

[3]: `Escala_2x1_encarregados_V190.html` — camada V274, motor 2×1 dominical, DSR, feriados e validação do app de Encarregados.

[4]: `testes/rodar.js` — dados fictícios, geração determinística e verificadores independentes existentes.

[5]: `testes/dados/setores_frente_de_loja_50.txt`, `testes/dados/setores_cpd_6.txt` e `testes/dados/encarregados_15_pares.txt` — quadros usados na simulação.
