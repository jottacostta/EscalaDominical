# Modelo de dados — EscalaDominical

**Status:** modelo lógico inicial. Confirmar nomes, tipos e chaves nos validadores e serializadores antes de alterar dados.

## Premissas
Os apps funcionam localmente; não presumir um banco central. Os dois aplicativos podem ter esquemas diferentes. Históricos JSON permitem guardar e transportar os dados que a versão suporta. Nunca incluir dados reais de funcionários em commits ou testes públicos.

## Entidades lógicas
- **Funcionário:** matrícula, nome, cargo/função, turno, setor/subsetor, horário, folga fixa, situação e data de admissão são campos citados na documentação operacional. Obrigatoriedade e códigos devem ser confirmados no código.
- **Configuração da escala:** mês/ano, setor, domingos, balanço, feriados, regime, modo de geração, cobertura, liderança e horários, conforme cada app.
- **Seleção:** pessoas escaladas por data, horários, decisões manuais e confirmações pertinentes.
- **Histórico mensal:** pode incluir escala, equipe, configurações e dados adicionais suportados pela versão. Estrutura exata requer leitura do serializador.
- **Memória local do Gabriel:** eventos confiáveis que podem ser preservados conforme o código; não incluir senhas ou campos ocultos.

## Persistência
Armazenamento do navegador guarda estado local. Histórico JSON é arquivo explícito para guardar/restaurar. Importação de planilha ocorre localmente; a leitura documentada não executa macros/fórmulas. Exportações dependem das funções da versão.

## Integridade
Validar campos obrigatórios, datas, horários, códigos e duplicidades. Preferir matrícula para identidade; testar nomes iguais ou parcialmente sobrepostos. Em empréstimos, preservar as regras de origem/destino e evitar identidades duplicadas conflitantes. Não sobrescrever dados recentes silenciosamente ao restaurar.

## Privacidade
Manter proteção do `.gitignore` para `*.xlsx` e `Historico_*.json`. Usar somente dados fictícios em testes, relatórios e screenshots. Não registrar credenciais nem enviar dados para serviços externos.

## Pendência de mapeamento físico
Criar tabela por app com chave de armazenamento, esquema, campos, produtor/consumidor, validação, migração e testes. Rastrear chamadas de `localStorage`, guardar/abrir histórico e validadores; não inventar chaves ou tipos.
