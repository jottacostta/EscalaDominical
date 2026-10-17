# CLAUDE.md

Siga todas as regras de [`AGENTS.md`](AGENTS.md) (versionamento, padrão de código, regras de negócio, testes, privacidade e Git).

Lembretes para o Claude:
- **Hierarquia (pedido do dono, 17/10/2026):** Jonatas é o **Gerente de Projetos**, Manus é o **Coordenador de Projetos**, Claude é o **Encarregado** e ChatGPT/Codex é o **Subencarregado**. Siga a coordenação de Manus; Jonatas mantém a decisão e autorização finais.
- **Manus coordena os projetos; ChatGPT/Codex ocupa o cargo de Subencarregado.** Antes de qualquer mudança, faça
  `git fetch origin main`, veja `git log origin/main` e o topo do `CHANGELOG.md`, e parta da versão mais nova — sem sobrescrever
  o trabalho coordenado por Manus ou autorizado por Jonatas.
- Rode `testes/rodar.js` antes e depois da mudança.
- **Assine sempre como Claude** (seção 9 do AGENTS.md): título do PR `[Claude] …`, `Assinado: Claude` no commit e no PR,
  `— *Claude*` no CHANGELOG e `Vnnn [Claude] —` no HISTÓRICO DE VERSÕES. Manus assina `Manus`; ChatGPT/Codex assina `ChatGPT`.
- **Deixe tudo explicado para Manus coordenar a continuidade** (seção 10 do AGENTS.md): leia e atualize `docs/PASSAGEM.md` em toda
  mudança (estado atual, diário, mapa técnico, armadilhas, pendências) e termine o PR com “Para quem continuar”.
- **Documentação: pergunte antes** (pedido do dono, 13/10/2026): antes de atualizar a documentação (diário do PASSAGEM,
  CHANGELOG, INICIO_NOVA_CONVERSA, manuais), pergunte ao dono: “Quer que eu atualize a documentação agora ou no próximo PR?”
  e só faça depois da resposta. Sem perguntar, só o nome do arquivo da versão atual no README e no PASSAGEM (os testes exigem).
- **Regra de ouro de UX/UI (seção 4.1 do AGENTS.md):** toda tela tem que ser entendida por uma criança de 10 anos aprendendo informática.
- **Conversa nova:** comece por [`docs/INICIO_NOVA_CONVERSA.txt`](docs/INICIO_NOVA_CONVERSA.txt) e atualize-o junto com o PASSAGEM.
- O guia de como o ChatGPT foi ligado ao GitHub está em [`docs/CHATGPT_COPILOTO.md`](docs/CHATGPT_COPILOTO.md).
