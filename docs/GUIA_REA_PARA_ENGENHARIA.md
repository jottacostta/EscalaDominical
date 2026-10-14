# Como usar o REA para investigar o EscalaDominical

**Objetivo:** orientar Claude e outros agentes a aproveitar o método do [REA — Reverse Engineer Anything](https://github.com/morluto/rea) para investigar o comportamento real do sistema antes de alterar código.

Este documento é uma proposta de método de trabalho. **Não significa que o REA já foi instalado, integrado ou executado neste repositório.** Antes de adotar ferramentas do projeto, confira a documentação atual, os requisitos, as permissões e a compatibilidade com o ambiente.

## 1. Por que isso pode ajudar

O EscalaDominical tem dois aplicativos HTML/JavaScript separados e muitas regras acumuladas ao longo das versões. Uma mudança pequena pode afetar a geração da escala, a escala manual, a auditoria, o histórico ou a interface.

O valor do REA para nós é a abordagem de engenharia reversa: seguir o caminho que o programa realmente executa, encontrar as dependências e sustentar conclusões com evidências — em vez de deduzir a causa pelo nome de uma função ou reescrever uma área inteira.

## 2. Quando usar

Use esta abordagem quando houver:
- defeito que não foi explicado pela primeira leitura do código;
- diferença entre o resultado esperado e o resultado real;
- comportamento que mudou entre versões;
- regra de negócio espalhada por várias funções ou camadas;
- risco de uma correção afetar outra tela, exportação ou histórico;
- pedido para reproduzir uma funcionalidade de referência.

Para ajustes simples e bem localizados, uma investigação proporcional é suficiente. Não transforme toda tarefa pequena em uma auditoria extensa.

## 3. Roteiro obrigatório de investigação

### Etapa A — entender o contexto
1. Ler `AGENTS.md`, `docs/INICIO_NOVA_CONVERSA.txt`, o topo do `CHANGELOG.md` e `docs/PASSAGEM.md`.
2. Conferir a versão atual de cada aplicativo e os PRs abertos.
3. Identificar se o pedido afeta Setores, Encarregados ou ambos.
4. Registrar o comportamento esperado com base no pedido e nas regras documentadas.

### Etapa B — rastrear o comportamento real
1. Localizar a tela, o evento ou o botão que inicia o fluxo.
2. Seguir as chamadas de função até o ponto em que a decisão é tomada.
3. Identificar dados de entrada, variáveis globais, armazenamento local e campos do histórico envolvidos.
4. Verificar se camadas de versões posteriores envolvem ou substituem funções antigas.
5. Localizar regras semelhantes, auditorias e testes já existentes antes de criar outra implementação.

### Etapa C — produzir evidências
Separar as conclusões em:
- **Confirmado:** observado no código e/ou reproduzido por teste.
- **Provável:** há evidências parciais, mas falta reproduzir ou validar.
- **Não confirmado:** hipótese ainda sem evidência suficiente.
- **Descartado:** hipótese investigada e não sustentada.

Não apresentar hipótese como causa comprovada. Se não for possível executar o aplicativo, declarar essa limitação.

### Etapa D — propor a menor correção
Antes de editar, apresentar:
- causa identificada ou hipóteses restantes;
- arquivos e funções envolvidos;
- regras e recursos que podem ser afetados;
- alteração mínima recomendada;
- testes que confirmarão a correção.

Não reescrever nem reformatar o HTML inteiro. Respeitar as regras de versão, assinatura, privacidade e documentação de `AGENTS.md`.

### Etapa E — validar
1. Criar ou ajustar um teste que falhe antes da correção e passe depois, quando viável.
2. Cobrir o fluxo afetado e possíveis regressões relacionadas.
3. Executar `cd testes && npm test`; para alterações no motor da escala, executar também `npm run test:completo`.
4. Conferir os Checks da PR no GitHub e relatar o resultado real.
5. Não declarar teste aprovado se não tiver sido executado ou se o resultado não estiver disponível.
6. Abrir PR; **não fazer merge sem autorização explícita do dono**.

## 4. Exemplo aplicado ao projeto

**Situação:** uma pessoa que deveria aparecer na escala manual não aparece.

Investigação recomendada:
1. Conferir os dados fictícios usados para reproduzir o caso e a situação/aptidão da pessoa.
2. Rastrear como a tela monta a lista de candidatos.
3. Seguir as chamadas até as regras de elegibilidade e a auditoria.
4. Conferir se a regra é aplicada também no modo automático e no modo misto.
5. Verificar se o resultado é afetado por folga fixa, afastamento, jovem aprendiz, setor, função ou sequência de domingos.
6. Criar um teste que demonstre o caso e proteja o comportamento correto.
7. Só depois propor a alteração mínima.

Este exemplo é ilustrativo; não afirma que exista atualmente esse defeito.

## 5. Mapa de impacto para conferir

Ao rastrear uma funcionalidade, considere apenas os pontos pertinentes ao caso:

- **Interface:** evento, botão, modal, etapa e mensagens ao usuário.
- **Motor da escala:** seleção de candidatos, distribuição, cobertura por função/turno.
- **Auditoria:** geração automática, escala manual e escala mista.
- **Dados:** equipe, setor, folgas, horários, preferências e situação.
- **Persistência:** salvamento automático, `localStorage`, projeto e histórico JSON.
- **Saídas:** tabela, impressão/PDF, Excel, texto para WhatsApp e relatórios.
- **Continuidade:** transição entre meses, históricos anteriores e regras de domingos.
- **Testes e documentação:** cobertura automatizada, `CHANGELOG.md`, `README.md` e `docs/PASSAGEM.md`.

Não presuma que todos os pontos estão ligados. Confirme as ligações no código.

## 6. Como avaliar uma possível adoção técnica do REA

Antes de instalar ou integrar qualquer componente do REA:
1. Ler o README e a licença do repositório original.
2. Verificar requisitos, forma de execução, integrações externas e permissões.
3. Confirmar se funciona com HTML/JavaScript local e com as ferramentas disponíveis ao agente.
4. Avaliar riscos de segurança, privacidade e envio de código ou dados para serviços externos.
5. Fazer uma prova de conceito isolada, sem dados reais de funcionários e sem modificar os aplicativos.
6. Comparar o resultado com a investigação manual e com os testes existentes.
7. Adotar apenas se trouxer benefício comprovado e não conflitar com as regras do EscalaDominical.

**Não adicionar o REA como dependência do aplicativo por padrão.** O sistema precisa continuar funcionando offline e sem depender de serviços externos.

## 7. Formato sugerido para o relatório de diagnóstico

Para cada problema, apresentar:

- **Comportamento observado:**
- **Comportamento esperado:**
- **Evidências no código/testes:**
- **Causa:** confirmada, provável ou ainda desconhecida.
- **Caminho de execução:** eventos e funções relevantes.
- **Impactos possíveis:** telas, regras, dados e saídas afetadas.
- **Correção mínima proposta:**
- **Testes necessários e resultado:**
- **Limitações e pontos não verificados:**

## 8. Limites e regras que continuam valendo

O REA complementa o processo do projeto; não substitui:
- as regras de negócio em `AGENTS.md`;
- a inspeção das versões atuais e dos PRs abertos;
- o requisito de versão nova para qualquer mudança no aplicativo;
- os testes automatizados e a verificação dos Checks;
- a proteção de dados reais de RH;
- a assinatura de autoria de cada assistente;
- a documentação e passagem de bastão;
- a autorização do dono para merge.

**Conclusão:** use o REA como inspiração e possível ferramenta de investigação. Primeiro entenda, rastreie e prove; depois proponha a menor mudança possível. A instalação ou integração fica para uma avaliação separada, baseada em uma prova de conceito.
