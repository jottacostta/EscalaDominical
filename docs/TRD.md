# TRD — Arquitetura e requisitos técnicos

**Status:** mapa inicial. Confirmar nomes e limites das funções no código antes de refatorar.

## Arquitetura
- Repositório: `jottacostta/EscalaDominical`.
- Apps separados e autocontidos em HTML: `Escala_de_Setores_V280.html` e `Escala_2x1_encarregados_V187.html` na `main` consultada.
- `setores/index.html` e `encarregados/index.html` são cópias das versões atuais e sustentam os endereços fixos.
- A experiência normal deve continuar offline; não adicionar dependência externa sem autorização.

## Camadas lógicas
1. Interface: etapas, cartões, formulários, avisos e diálogos.
2. Estado: equipe, setor/mês, escolhas, configurações e estado restaurado.
3. Motor: geração e regras específicas de cada app.
4. Auditoria/confirmação: regras quebradas, pendências e decisões necessárias.
5. Persistência/exportação: armazenamento local, histórico JSON e saídas suportadas.
6. Gabriel/Assistente RH: lógica local que responde com base nas funções e dados disponíveis; não é autoridade para validar escala.
7. Testes automatizados e CI.

Este mapa é conceitual. O mapa detalhado de funções e dependências ainda precisa ser rastreado no código.

## Versionamento e distribuição
Toda mudança de app gera versão nova, histórico interno, entrada no CHANGELOG, atualização do README, arquivo antigo em `versoes_anteriores/` e cópia idêntica no endereço fixo. Conferir nome, `<title>`, rodapé e histórico. Não fazer merge sem pedido explícito.

## Testes
Usar dados fictícios. Executar `testes/rodar.js` antes/depois e as suítes pertinentes conforme `AGENTS.md`. Check antigo não valida SHA novo. Não declarar bateria do Gabriel aprovada sem relatório vinculado ao SHA final.

## Método
Seguir o caminho real do evento até a função decisora; identificar wrappers e estado; separar fatos de hipóteses; corrigir o mínimo; testar efeitos relacionados; registrar o que não foi verificado. Não reformar os HTMLs extensos.

## Pendências técnicas
Mapear funções reais do motor, auditoria, armazenamento, importação/exportação e Gabriel nos dois apps. Documentar dependências e decisões arquiteturais a partir de evidência do código.
