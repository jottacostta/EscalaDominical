# EscalaDominical
Projeto escala de setores — Supermercados Guanabara.

Cada arquivo `.html` é o app completo: é só abrir no navegador (funciona sem internet).

**Endereços fixos (GitHub Pages)** — cada gestão usa só o seu link, que sempre abre a versão mais nova:

- Escala de Setores: https://jottacostta.github.io/EscalaDominical/setores/
- Escala de Encarregados: https://jottacostta.github.io/EscalaDominical/encarregados/

A cada versão nova, troque o nome do arquivo em `setores/index.html` ou `encarregados/index.html` (3 lugares).

| Arquivo | O que é |
|---|---|
| `Escala_de_Setores_V217.html` | **Versão atual** da Escala de Setores |
| `Escala_2x1_encarregados_V161.html` | **Versão atual** da Escala de Encarregados |
| [`versoes_anteriores/`](versoes_anteriores/) | versões anteriores (V204–V216 e V150–V160), guardadas para comparação |
| [`CHANGELOG.md`](CHANGELOG.md) | o que mudou em cada versão |
| [`testes/`](testes/) | testes automáticos com dados fictícios (`cd testes && npm install && npm test`) |

O histórico de mudanças de cada versão também fica no comentário `HISTÓRICO DE VERSÕES` no topo de cada arquivo.

O histórico de cada mês é guardado em `Historico_<Setor>_<mês>_<ano>.json` (ex.: `Historico_Frente_de_Loja_11_2026.json`). No mês seguinte, abra esse arquivo em ⋮ → Abrir histórico guardado. Na Escala de Setores, ⋮ → Relatório do ano (por pessoa) junta esses arquivos e mostra quantos domingos e feriados cada pessoa trabalhou.

**Privacidade:** a planilha do RH e os históricos têm dados de funcionários. Não coloque esses arquivos no repositório (o `.gitignore` já bloqueia `*.xlsx` e `Historico_*.json`).
