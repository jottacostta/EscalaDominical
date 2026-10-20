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

## Relatório — Fase 1 (entregue 20/10/2026)

**Diagnóstico técnico completo dos dois apps para adaptação ao regime 5×2.**

---

### 1. Infraestrutura V274 (o que já está pronto)

| Item | Setores V285 | Encarregados V189 | Status |
|------|-------------|-------------------|--------|
| `window.v274Regime` | linhas 15925–15986 | linhas 10157–10195 | ✅ Pronto |
| `maxSeguidosTrab()` | 10 chamadas (linhas 5546, 5594, 5675, 7286, 13691–15527) | 4 chamadas (4549, 4920, 9753) | ✅ Pronto |
| Padrão atual | `ativo:false`, `regime:'6x1'`, `maxSeguidos:6` | idem | ✅ Só precisa ativar |

**Conclusão:** ativar `v274Regime.configurar({ativo:true,regime:'5x2',maxSeguidos:5})` já impõe 5 dias seguidos máximo no motor. Nenhuma reescrita.

---

### 2. Maior bloqueio: `folgaFixa` é UM único dia por funcionário

O modelo de dados atual guarda **um único inteiro (0–6)** representando o dia de repouso semanal:

```js
// Setores — normalizarFolgaFixa retorna um inteiro
function normalizarFolgaFixa(valor, padrao=2){ ... return mapa[chave]; }
// Encarregados — diaDsrDe() retorna um único dia
function diaDsrDe(f){ const fixa=Number(f&&f.folgaFixa); ... return fixa; }
```

Para o 5×2, cada funcionário precisa de **dois dias de repouso por semana**. Isso exige:

| Mudança | Setores | Encarregados |
|---------|---------|--------------|
| Novo campo `folgaFixa2` no objeto funcionário | 107 chamadas a `folgaFixa` afetadas | 41 chamadas afetadas |
| `normalizarFolgaFixa` → versão dual | nova função ou extensão | usa `diaDsrDe` — mesma lógica |
| UI de cadastro de equipe | adicionar seletor "2ª folga fixa" | idem |
| Importador da planilha do RH | mapear coluna `folgaFixa2` | idem |

> **Impacto estimado: 1–2 versões por app** apenas para o modelo de dados + UI.

---

### 3. Algoritmo DSR — adaptação necessária

O algoritmo de repouso atual assume **1 dia de DSR por semana** em toda a lógica:

- `dataDescansoAnterior(d, folgaFixa)` e `dataDescansoPosterior(d, folgaFixa)` operam em **um único dia** (Encarregados, linhas 4459–4620).
- `diaDsrDe(f)` retorna **um único dia** — precisa ser estendida para retornar um par.
- `folgaFixaAtivaNaData(i, dt)` verifica apenas `f.folgaFixa === dt.getDay()` — precisa verificar também `f.folgaFixa2`.

Para o CCT (§ 2º — 2 repousos na média do mês, mínimo 1 por semana):
- O motor precisará verificar a contagem semanal de repousos, não apenas o dia fixo.
- Uma semana com apenas 1 repouso é legal se a média mensal for ≥ 2/semana.

> **Impacto estimado: 2 versões por app** para o algoritmo DSR + suporte CCT.

---

### 4. Rastreamento de horas — camada nova necessária

Os apps **não calculam horas trabalhadas por semana**. Não existem variáveis `horasSemana`, `limiteHoras` ou acumulador de jornada.

Para cumprir o art. 7º XIII da EC 141:

| Prazo | Limite | Ação no app |
|-------|--------|-------------|
| 16/12/2026 | 42h/semana | Alertar quando escala ultrapassar 42h |
| 16/12/2027 | 40h/semana | Bloquear ou alertar quando ultrapassar 40h |

A camada de horas requer:
1. Saber o **turno de cada funcionário** (já existe: campo `horario`).
2. Calcular horas trabalhadas por semana com base nos dias escalados.
3. Emitir alerta na geração e na auditoria.

> **Impacto estimado: 1–2 versões por app** para a camada de jornada + Gabriel informado.

---

### 5. Textos hardcoded "6×1" a atualizar

| App | Linha | Texto atual |
|-----|-------|-------------|
| Setores V285 | 5675 | `"escala incompatível com a proteção 6×1."` |
| Setores V285 | histórico (UI) | diversas menções a "6×1" nas versões antigas |
| Encarregados V189 | motor | mensagens equivalentes |

Esses textos devem ser condicionados ao regime ativo (`v274Regime.cfg.regime`).

---

### 6. Estimativa consolidada de versões

| Fase | Tarefa principal | Setores | Encarregados |
|------|-----------------|---------|--------------|
| 2a | Modelo de dados: `folgaFixa2` + UI | V286 | V190 |
| 2b | Motor DSR para 2 repousos/semana | V287 | V191 |
| 2c | Suporte CCT (média mensal) + 3-domingos 5×2 | V288 | V192 |
| 3a | Camada 42h/semana + alertas + Gabriel | V289 | V193 |
| 3b | Aviso tela inicial EC 141 + manuais | V290 | V194 |

**Total: 5 versões por app (10 versões no total).**
**Meta de go-live: V290 Setores / V194 Encarregados até 14/12/2026.**

---

### 7. Recomendações para Manus coordenar a Fase 2

1. **Começar pela Fase 2a** (modelo de dados): é o fundamento de tudo. ChatGPT pode executar com revisão Claude.
2. **Fase 2b em paralelo com 2c** é arriscado — implementar sequencialmente para não perder rastreabilidade.
3. **Não misturar** a regra de domingos 2×1 com a distribuição das duas folgas semanais — são motores independentes.
4. **Testar com meses reais**: Janeiro tem 5 domingos e picos de balanço — o CCT e o 5×2 precisam ser testados nesse cenário.
5. **Ativar `v274Regime` com feature flag** no início: o gerente liga/desliga na interface sem reimplantar.

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
