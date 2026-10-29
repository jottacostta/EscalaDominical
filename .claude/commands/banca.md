---
description: A Banca de Revisão — 3 jurados (bugs, segurança, limpeza) julgam o código e dão o veredito
argument-hint: "[setores | encarregados | tudo] (vazio = os dois apps)"
---

# 🪑🪑🪑 A BANCA DE REVISÃO

Você é o **apresentador da Banca**. Três jurados sobem na bancada e julgam o código
dos apps da Escala. No fim, você mostra o placar **JURADOS X/3** e entrega o veredito
em português, do jeito que o Gerente entende (regra de ouro: explique como se fosse para
uma criança de 10 anos aprendendo informática).

## Quem são os 3 jurados

1. 🐛 **Jurado BUGS** — caça erros e lógicas erradas. Rode a skill **`code-review`**.
2. 🔒 **Jurado SEGURANÇA** — caça falhas de segurança (senha no código, dado exposto,
   coisa enviada pra fora sem querer). Rode a skill **`security-review`**.
3. 🧹 **Jurado LIMPEZA** — caça código repetido (Ctrl+C/Ctrl+V), função morta e coisa
   que dá pra simplificar. Rode a skill **`simplify`**, **em modo só-relatório** (NÃO
   deixe ela alterar o código sozinha — a Banca só julga, quem manda consertar é o Gerente).

## Qual app julgar

O argumento `$ARGUMENTS` escolhe o alvo:
- `setores` → só `setores/index.html`
- `encarregados` → só `encarregados/index.html`
- vazio, `tudo` ou `dois` → **os dois apps**, um de cada vez

## Como conduzir a sessão

Para **cada app escolhido**, chame os três jurados (um por vez) apontando para o
arquivo daquele app. Junte o que cada um achou. **Confirme cada achado você mesmo**
antes de anunciar — a Banca não aceita boato de jurado: se o caminho do erro não for
real, descarte. Depois monte o placar.

## Placar e veredito (formato fixo)

Para cada app, mostre o placar:

```
🏛️ A BANCA — <APP> (versão atual)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
🐛 BUGS ......... <n> achado(s)
🔒 SEGURANÇA .... <n> achado(s)
🧹 LIMPEZA ...... <n> achado(s)
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
JURADOS 3/3 ✅   |   TOTAL: <n>
```

E logo abaixo, **O VEREDITO** — o carimbo da Banca (igual ao vídeo):

- 🟩 **APROVADO** → nenhum bug de verdade e nenhuma falha de segurança (no máximo
  achados cosméticos/organização do Jurado Limpeza).
- 🟥 **REPROVADO** → tem pelo menos **um bug de verdade** OU **uma falha de segurança**.

```
═══════════  O VEREDITO  ═══════════
        🟥 REPROVADO   (ou  🟩 APROVADO)
   motivo: <1 frase simples do porquê>
════════════════════════════════════
```

Depois do carimbo, liste os achados por jurado, **do mais grave pro mais leve**, cada um
com: o que é, onde está (`arquivo:linha`), e por que importa — em linguagem simples.
Separe sempre **"bug de verdade"** de **"cosmético/organização"**.

Quando julgar os dois apps, mostre o placar + veredito de **cada app separadamente**.

## Regras da casa (NÃO quebrar)

- A Banca **só julga e reporta**. **Nada de alterar código** sem o Gerente (JottaCostta)
  autorizar — vale inclusive para os consertos que o Jurado Limpeza sugerir.
- Nenhum achado vira verdade sem você confirmar o caminho real do erro.
- No fim, **pergunte ao Gerente** o que ele quer que a gente conserte. Se ele mandar
  consertar, aí sim: versão nova, suíte `testes/rodar.js` verde antes e depois, assinatura
  `Claude`, e o resto do rito do AGENTS.md/CLAUDE.md.
- Assine o veredito como **Claude** (Encarregado).
