# EscalaDominical
Projeto escala de setores — Supermercados Guanabara.

Cada arquivo `.html` é o app completo: é só abrir no navegador (funciona sem internet).

**Endereços fixos (GitHub Pages)** — cada gestão usa só o seu link, que sempre abre a versão mais nova:

- Escala de Setores: https://jottacostta.github.io/EscalaDominical/setores/
- Escala de Encarregados: https://jottacostta.github.io/EscalaDominical/encarregados/

`setores/index.html` e `encarregados/index.html` são **cópias da versão atual** de cada app (não redirecionam), para o endereço nunca mudar. A cada versão nova, copie o arquivo novo por cima do `index.html` da pasta (o teste automático avisa se esquecer). Endereços antigos com número de versão caem no `404.html`, que leva ao endereço fixo.

| Arquivo | O que é |
|---|---|
| `Escala_de_Setores_V261.html` | **Versão atual** da Escala de Setores |
| `Escala_2x1_encarregados_V175.html` | **Versão atual** da Escala de Encarregados |
| [`versoes_anteriores/`](versoes_anteriores/) | versões anteriores (V204–V256 e V150–V174), guardadas para comparação |
| [`CHANGELOG.md`](CHANGELOG.md) | o que mudou em cada versão |
| [`docs/INICIO_NOVA_CONVERSA.txt`](docs/INICIO_NOVA_CONVERSA.txt) | regras de continuidade para começar uma conversa nova com o Claude ou o ChatGPT |
| [`testes/`](testes/) | testes automáticos com dados fictícios (`cd testes && npm install && npm test`); rodam sozinhos no GitHub em todo Pull Request (aba **Actions** / “Checks” do PR) |
| Manuais de uso (Claude Docs) | [Manual do Encarregado](https://claude.ai/code/artifact/29a1157b-f657-465e-ae85-2eb06a58c726) · [Manual da Escala de Setores](https://claude.ai/code/artifact/9ed54c8f-d381-4733-a6f4-220f6282f197) · [Roteiro do Beta](https://claude.ai/code/artifact/ef9b9858-da19-4cbc-a0cc-663115b007e9) — com prints de dados fictícios |
| [`AGENTS.md`](AGENTS.md) | regras do projeto para assistentes de IA (ChatGPT/Codex e Claude) |
| [`docs/PASSAGEM.md`](docs/PASSAGEM.md) | **passagem de bastão** entre Claude e ChatGPT: estado atual, mapa do código, armadilhas, diário e pendências |
| [`docs/CHATGPT_COPILOTO.md`](docs/CHATGPT_COPILOTO.md) | passo a passo para ligar o ChatGPT ao GitHub e trabalhar em dupla com o Claude |

O histórico de mudanças de cada versão também fica no comentário `HISTÓRICO DE VERSÕES` no topo de cada arquivo.

O histórico de cada mês é guardado em `Historico_<Setor>_<mês>_<ano>.json` (ex.: `Historico_Frente_de_Loja_11_2026.json`). No mês seguinte, abra esse arquivo em ⋮ → Abrir histórico guardado. Na Escala de Setores o arquivo leva também o quadro da loja inteira (com tempo de serviço e situação) e a seção “Funcionários por tempo de serviço” daquele mês (setor e loja): aberto num aparelho novo, tudo volta. Na Escala de Setores, ⋮ → Relatório do ano (por pessoa) junta esses arquivos e mostra quantos domingos e feriados cada pessoa trabalhou.

**Privacidade:** a planilha do RH e os históricos têm dados de funcionários. Não coloque esses arquivos no repositório (o `.gitignore` já bloqueia `*.xlsx` e `Historico_*.json`).

**Créditos:** as figuras coloridas dos apps são do [Noto Emoji](https://github.com/googlefonts/noto-emoji) (© Google, licença Apache 2.0), embutidas nos arquivos para funcionar sem internet.