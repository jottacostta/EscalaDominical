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
npm test                 # rápido: outubro a dezembro de cada app (~1 min)
npm run test:completo    # o ano inteiro de cada app (~5 min)
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
