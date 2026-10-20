# Plano de Ação — EC 141/2026 (regime 5×2 obrigatório)

**Criado por:** Claude (Encarregado)
**Data:** 20/10/2026
**Para:** Manus (Coordenador de Projetos) coordenar
**Prazo legal:** 16/12/2026 (57 dias a partir da criação deste plano)
**Versões na data de criação:** Setores V285 / Encarregados V189

---

## Contexto legal

A **Emenda Constitucional nº 141, de 16 de outubro de 2026** altera o art. 7º da Constituição Federal e estabelece:

- **Inciso XV (vigência: 16/12/2026):** repouso semanal remunerado de **2 (dois) dias**, um deles preferencialmente aos domingos.
- **Inciso XIII — fase 1 (16/12/2026):** duração máxima de **42 horas semanais**.
- **Inciso XIII — fase 2 (16/12/2027):** duração máxima de **40 horas semanais**.
- **§ 2º — exceção CCT:** convenção ou acordo coletivo pode manter regime com 2 repousos **na média do mês**, garantindo pelo menos 1 repouso dentro de cada semana de trabalho.

O regime 6×1 (6 dias de trabalho, 1 de repouso) torna-se **inconstitucional a partir de 16/12/2026**, salvo cobertura por CCT nos termos do § 2º.

### Decisão operacional vigente

Até a publicação ou validação de uma nova convenção ou acordo coletivo, os domingos continuam seguindo a regra **2×1** já existente nos aplicativos. Não será implantado, nesta etapa, um novo rodízio mensal dominical. Qualquer alteração dessa política deverá ser formalizada por CCT e incorporada em uma etapa própria, sem misturá-la com a distribuição das duas folgas semanais do motor 5×2.

---

## Contexto técnico

A **V274** já implantou a infraestrutura do 5×2 em ambos os apps:

- `window.v274Regime = {estado, configurar, restaurar, maxSeguidos, resumo}` — nos dois apps
- `maxSeguidosTrab()` — respeita o limite configurado (padrão: 6 para 6×1)
- O 5×2 está **desligado por padrão** — o trabalho é ativar, completar e testar, não inventar do zero.

---

## Fases do plano

### Fase 1 — Diagnóstico completo
**Prazo:** até 31/10/2026
**Responsável:** Claude (Encarregado)

| # | Tarefa |
|---|--------|
| 1.1 | Mapear todas as funções de `window.v274Regime` nos dois apps |
| 1.2 | Listar regras que assumem 6×1 (motor da escala, validações, mensagens do Gabriel) |
| 1.3 | Identificar o que muda para o 5×2 funcionar como padrão |
| 1.4 | Verificar se a exceção CCT (§ 2º) precisa de suporte no app |
| 1.5 | Entregar relatório ao Manus com estimativa de versões necessárias |

---

### Fase 2 — Motor do 5×2
**Prazo:** até 20/11/2026
**Responsável:** ChatGPT (Subencarregado) + revisão Claude

| # | Tarefa |
|---|--------|
| 2.1 | Ativar 5×2 como padrão configurável na interface (não só no código) |
| 2.2 | Adaptar motor de escala para 2 repousos semanais |
| 2.3 | Revisar regra "3 domingos seguidos" para funcionar em 5×2 |
| 2.4 | Suporte ao CCT: opção "regime compensatório mensal" (2 repousos na média, mínimo 1/semana) |
| 2.5 | Adaptar bateria de testes existente + novos casos 5×2 em `testes/rodar.js` |

---

### Fase 3 — Jornada e avisos de transição
**Prazo:** até 05/12/2026
**Responsável:** Claude + Grok (Auxiliar)

| # | Tarefa |
|---|--------|
| 3.1 | Bloquear (ou alertar) escala que ultrapasse 42h/semana a partir de 16/12/2026 |
| 3.2 | Aviso visível na tela inicial sobre a EC 141/2026 e o prazo |
| 3.3 | Gabriel responde perguntas sobre a mudança legal e o novo regime |
| 3.4 | Atualizar manuais de uso (Encarregados e Setores) |

---

### Fase 4 — Homologação e go-live
**Prazo:** até 14/12/2026 (2 dias de margem antes do prazo legal)
**Responsável:** Manus coordena

| # | Tarefa |
|---|--------|
| 4.1 | Testes com dados fictícios cobrindo 5×2 e CCT (`testes/dados`) |
| 4.2 | CI verde em todos os PRs antes do merge |
| 4.3 | Deploy via merge no `main` (Vercel atualiza automaticamente) |
| 4.4 | Atualizar PASSAGEM.md, CHANGELOG e INICIO_NOVA_CONVERSA |

---

## Calendário

```
20/10 ─── 31/10 ─────── 20/11 ──────── 05/12 ── 14/12 ── 16/12
          Fase 1         Fase 2          Fase 3   Fase 4   ⚖️ Lei
          Diagnóstico    Motor 5×2       Avisos   Deploy   EC 141
```

---

## Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Motor precisa de reescrita profunda | Média | Fase 1 responde; se alto, escalar ao Gerente |
| Testes de 12 meses com 5×2 demoram | Alta | Paralelizar Fases 2 e 3 |
| Empresa tem CCT cobrindo 6×1 | Possível | Suporte ao CCT na Fase 2 garante compatibilidade |
| Prazo insuficiente | Baixa | 57 dias com V274 já feita é factível |

---

## Referências

- Texto completo da EC 141/2026: publicado no DOU de 16/10/2026 (Edição extra)
- Infraestrutura V274: `docs/PASSAGEM.md` — seção 2, entrada V274
- Tarefas relacionadas: #10 (5×2 Fase 1) e #11 (5×2 Fase 3) no rastreador da conversa

---

*— Claude*
