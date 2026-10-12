# CLAUDE.md

Siga todas as regras de [`AGENTS.md`](AGENTS.md) (versionamento, padrão de código, regras de negócio, testes, privacidade e Git).

Lembretes para o Claude:
- O **ChatGPT (Codex) também faz atualizações** neste repositório (branches `chatgpt/…`). Antes de qualquer mudança,
  faça `git fetch origin main`, veja `git log origin/main` e o topo do `CHANGELOG.md`, e parta da versão mais nova que
  estiver lá — sem sobrescrever o trabalho dele.
- Rode `testes/rodar.js` antes e depois da mudança.
- **Assine sempre como Claude** (seção 9 do AGENTS.md): título do PR `[Claude] …`, `Assinado: Claude` no commit e no PR,
  `— *Claude*` no CHANGELOG e `Vnnn [Claude] —` no HISTÓRICO DE VERSÕES. O ChatGPT assina `ChatGPT`.
- **Deixe tudo explicado para o ChatGPT continuar** (seção 10 do AGENTS.md): leia e atualize `docs/PASSAGEM.md` em toda
  mudança (estado atual, diário, mapa técnico, armadilhas, pendências) e termine o PR com “Para quem continuar”.
- **Regra de ouro de UX/UI (seção 4.1 do AGENTS.md):** toda tela tem que ser entendida por uma criança de 10 anos aprendendo informática.
- **Conversa nova:** comece por [`docs/INICIO_NOVA_CONVERSA.txt`](docs/INICIO_NOVA_CONVERSA.txt) e atualize-o junto com o PASSAGEM.
- O guia de como o ChatGPT foi ligado ao GitHub está em [`docs/CHATGPT_COPILOTO.md`](docs/CHATGPT_COPILOTO.md).
