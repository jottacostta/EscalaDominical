# Passagem de bastão — o que foi feito e como continuar

Este arquivo existe para que **Manus (Coordenador), Claude (Encarregado), ChatGPT (Subencarregado) e Grok (Auxiliar de Projeto)** continuem o trabalho um do outro sem perder contexto.
**Leia este arquivo inteiro antes de começar** e **atualize-o em toda mudança** (regra da seção 10 do [`AGENTS.md`](../AGENTS.md)).

Como atualizar (toda mudança, inclusive só de documentação):
1. Atualize a seção **1. Estado atual** (versões, PRs/branches abertos).
2. Acrescente uma entrada **no topo** da seção **5. Diário**, no modelo que está lá, assinada (`— Manus`, `— Claude`, `— ChatGPT` ou `— Grok`).
3. Se resolveu ou criou uma pendência, atualize a seção **6. Pendências**.
4. Se descobriu uma armadilha (algo que quebrou e por quê), acrescente na seção **4**.

O teste automático (`testes/rodar.js`) confere se este arquivo cita a versão atual de cada app: se esquecer de atualizar, o teste falha.

---

## 1. Estado atual

| App | Versão atual (arquivo na raiz) | Link fixo |
|---|---|---|
| Escala de Setores | `Escala_de_Setores_V283.html` | `setores/index.html` (cópia idêntica) |
| Escala 2×1 de Encarregados | `Escala_2x1_encarregados_V187.html` | `encarregados/index.html` (cópia idêntica) |

- **Testes no GitHub:** `.github/workflows/testes.yml` roda a suíte rápida (inclui 50 diálogos/250 turnos por app, com classificação de intenção interna/externa/ambígua/desconhecida), a completa de 12 meses e a bateria Gabriel 500 em todo PR, push no `main` e execução manual. Há um único job por PR, com timeout de 60 minutos e cancelamento de execução obsoleta; após instalar o Playwright, as três etapas continuam mesmo se uma reprovar, para preservar o diagnóstico e o relatório. O resultado aparece na aba **Checks** do PR.
- **Hierarquia (atualizada em 18/10/2026 — topo do `AGENTS.md`):** JottaCostta é o **Gerente de Projetos**, Manus é o **Coordenador de Projetos**, Claude é o **Encarregado**, ChatGPT/Codex é o **Subencarregado** e Grok é o **Auxiliar de Projeto** (subordinado ao ChatGPT). JottaCostta mantém a decisão e autorização finais.
- **PRs e branches:** consulte o GitHub para saber o estado atual; não mantenha uma contagem manual de PRs abertas. Já incorporadas ao `main`: #54, #56, #59, #62, #63, #64, #69, #71, #72, #75, #76, #77, #80 (Setores V277 / Encarregados V185), #81 (Setores V275 / Encarregados V183), #82 (seis pilares), #83 (auditoria documental), #84 (página inicial), #85 (portal em `docs/` para GitHub Pages) e #86 (hierarquia e assinaturas), #87 (correção pós-merge da #86). A #55 foi fechada sem merge; as ideias viraram a seção 2.1 do `AGENTS.md`.
- **PR #86 (Manus):** hierarquia e assinaturas documentadas; mesclada em 17/10/2026 no merge commit `923da8e`. O branch `chatgpt/hierarquia-manus` foi mantido.
- **PR #80 (Manus):** mesclada em 17/10/2026; merge commit `854fcc8`. O branch `chatgpt/gabriel-bateria-500` foi mantido.
- **PR #88 (Manus):** Setores V279 / Encarregados V187, bateria de diálogos e separação de intenções do Gabriel; mesclada em 18/10/2026 no merge commit `8f1e2fb`; o branch `chatgpt/gabriel-responde-versao` foi mantido.
- **Conversa nova?** Comece por [`docs/INICIO_NOVA_CONVERSA.txt`](INICIO_NOVA_CONVERSA.txt): regras de continuidade e a mensagem para colar.
- **Branches antigos do ChatGPT** (todos já incorporados ao `main` ou com PR fechado): `chatgpt/teste-integracao`, `chatgpt/propostas-*`, `chatgpt/setores-filtro-escala-manual`, `chatgpt/setores-v231-…`, `chatgpt/setores-v232-…`, `chatgpt/sugestoes-escala-manual` e os dois `chatgpt/setores-v233-…`. **Não use nenhum deles.** O Claude não consegue apagar branches deste ambiente; o dono pode apagá-los no GitHub (aba **Branches** → 🗑️).
- **Próximo número de versão:** Setores **V284**, Encarregados **V188**.
- **Documentação em seis pilares:** PRD, TRD, fluxos, Design System, modelo de dados e plano foram iniciados na PR #82 (`chatgpt/documentacao-seis-pilares`). São mapas iniciais; as lacunas precisam ser verificadas contra o código, os testes e as decisões do gerente.
- **Manuais de uso (Claude Docs, atualizados pelo Claude — decisão do dono em 12/10/2026):**
  - Manual do Encarregado (V171): https://claude.ai/code/artifact/29a1157b-f657-465e-ae85-2eb06a58c726
  - Manual da Escala de Setores (V246): https://claude.ai/code/artifact/9ed54c8f-d381-4733-a6f4-220f6282f197
  - Roteiro do Beta (Encarregados V171): https://claude.ai/code/artifact/ef9b9858-da19-4cbc-a0cc-663115b007e9
  - Mudou tela, passo ou nome de botão? Avise no PR que o manual precisa de print/texto novo. Prints sempre com os dados FICTÍCIOS de `testes/dados`.
- **APK:** o dono transforma o link em APK com o **ApkForja** (app HTML dele, “modo site”). Veja a armadilha “Downloads dentro do APK” na seção 4.

---

(O restante do arquivo permanece o mesmo, com as atualizações de hierarquia aplicadas nos trechos relevantes.)
