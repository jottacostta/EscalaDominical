# Testes automáticos

Abrem a versão mais nova de cada app (a que está na raiz do repositório) num navegador sem tela, geram vários meses
seguidos e conferem as regras com um verificador próprio, independente do app.

Os dados da pasta `dados/` são **fictícios** (nomes e matrículas inventados). Nunca coloque aqui a planilha do RH nem
históricos com nomes de funcionários.

## Como rodar

```bash
cd testes
npm install
npx playwright install chromium
npm test                 # rápido: outubro a dezembro de cada app (~14 min no Sandbox; varia)
npm run test:completo    # o ano inteiro de cada app (~15 min no Sandbox; varia)
```

## O que é conferido

**Escala de Setores** (Frente de Loja, 50 pessoas, 2 lideranças por domingo)
- ninguém trabalha 3 domingos seguidos (contando o mês passado; o balanço é exceção);
- quem não pode trabalhar no domingo nunca é escalado; a liderança escalada é a escolhida; ninguém aparece repetido;
- lembrete de guardar o histórico, nome do arquivo `Historico_Frente_de_Loja_mm_aaaa.json`;
- relatório do ano soma os mesmos domingos da escala;
- escala à mão: o 3º domingo seguido aparece em vermelho na hora de marcar.

**Escala 2×1 de Encarregados** (32 pessoas)
- 3 pessoas por domingo, com pelo menos 1 Encarregado e 1 Subencarregado, de setores diferentes, no máximo 1 do Laticínio;
- ninguém trabalha 3 domingos seguidos;
- folga de feriado dentro do prazo (20 dias), nunca no domingo; no máximo 2 de folga por dia, 1 no sábado, 1 por setor;
- lembrete de guardar o histórico, nome do arquivo `Historico_Encarregados_mm_aaaa.json`.

O teste termina com `✅ Tudo certo` (código 0) ou com a lista do que falhou (código 1).


### Diálogos amplos do Gabriel

Execute `npm run test:gabriel-dialogos` para rodar apenas a bateria de diálogos. A suíte rápida (`npm test`) também executa 50 diálogos (250 turnos) em cada app usando `dialogos-gabriel.json` e dados fictícios. As respostas são testadas em sequência para preservar o contexto. A suíte confere respostas vazias, “Não entendi”, identidade/versão, encaminhamento ao subgerente administrativo, consulta de férias pelo status da equipe, estado real 6×1/5×2, erros JavaScript e preservação da equipe/escala. Os testes contrastam dúvidas internas do app, dúvidas de RH claramente externas, termos ambíguos (que pedem contexto), perguntas desconhecidas (que não devem ser encaminhadas por suposição) e a distinção entre remuneração e folga compensatória. As expectativas e contraexemplos do JSON continuam referências para revisão; ainda não formam um gabarito semântico automatizado completo.
