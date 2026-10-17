# Design System — EscalaDominical

**Status:** princípios iniciais extraídos das regras do projeto. Inventário de componentes e tokens precisa ser comparado com as telas reais.

## Princípios
- Interface compreensível para quem tem pouca experiência com informática.
- Português do Brasil, frases curtas e ações explícitas.
- Mensagens explicam o problema e o próximo passo.
- Dois apps continuam separados, respeitando suas diferenças.
- Priorizar celular sem prejudicar computador.

## Cores da marca
- Azul `#0047BA`
- Amarelo `#FFCC00`
- Vermelho `#E52320`

Status não pode ser comunicado apenas pela cor: usar texto/ícone que explique o significado.

## Conteúdo e componentes
Botões com verbo claro; erros separados de pendências; detalhes longos recolhidos quando isso ajuda a leitura; datas e números consistentes. Componentes a inventariar: topo/menu, etapas, cartões de equipe/domingo, busca e filtros, campos, alertas e selos de auditoria, confirmações, importação, painel Gabriel, carregamento, histórico e exportação.

## Responsividade e acessibilidade
Nada importante pode ficar fora da tela. Manter contraste, alvos de toque claros, foco visual, hierarquia consistente e textos compreensíveis. Não depender somente da cor nem provocar saltos inesperados ou perda de contexto.

## Estados a documentar
Para cada componente, registrar padrão, foco, pressionado, desabilitado, carregando, sucesso, aviso, erro, vazio e indisponibilidade. Não presumir que todos estejam implementados em todos os componentes.

## Pendências
Catalogar tipografia, espaçamentos, bordas, sombras, tamanhos e breakpoints do CSS real; relacionar componentes às telas; aplicar checklist de UX de 16 itens do `AGENTS.md`; criar capturas com dados fictícios. Antes de corrigir tela, investigar causa e validar celular/computador.
