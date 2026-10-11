# CLAUDE.md

Siga todas as regras de [`AGENTS.md`](AGENTS.md) (versionamento, padrão de código, regras de negócio, testes, privacidade e Git).

Lembretes para o Claude:
- O **ChatGPT (Codex) também faz atualizações** neste repositório (branches `chatgpt/…`). Antes de qualquer mudança,
  faça `git fetch origin main`, veja `git log origin/main` e o topo do `CHANGELOG.md`, e parta da versão mais nova que
  estiver lá — sem sobrescrever o trabalho dele.
- Rode `testes/rodar.js` antes e depois da mudança.
- **Assine sempre como Claude** (seção 9 do AGENTS.md): título do PR `[Claude] …`, `Assinado: Claude` no commit e no PR,
  `— *Claude*` no CHANGELOG e `Vnnn [Claude] —` no HISTÓRICO DE VERSÕES. O ChatGPT assina `ChatGPT`.
- O guia de como o ChatGPT foi ligado ao GitHub está em [`docs/CHATGPT_COPILOTO.md`](docs/CHATGPT_COPILOTO.md).
