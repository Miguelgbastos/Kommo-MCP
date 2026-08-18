# Changelog

Todas as alterações relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
- `SECURITY.md` com política de divulgação responsável.
- `CHANGELOG.md` dedicado (extraído do README).
- Templates de issue (bug report, feature request) e template de Pull Request.
- Workflow de CI (`.github/workflows/ci.yml`) rodando build, typecheck, lint e format check.
- `.editorconfig`, configuração de ESLint e Prettier.
- Arquivo `.dockerignore`.
- Testes de integração do lifecycle, sessões, autenticação, Origin e schemas.
- Testes unitários dos handlers de leitura e escrita com cliente Kommo simulado.
- Validação JSON Schema dos argumentos de todas as tools.
- Expiração e encerramento explícito de sessões MCP.
- `ROADMAP.md` e `MAINTAINERS.md`.

### Modificado

- `CONTRIBUTING.md` reescrito e alinhado à estrutura real do projeto.
- `LICENSE`: titular corrigido para o autor real do projeto.
- `package.json`: `author`, `repository`, `bugs`, `homepage`, `engines.node` e novos scripts (`typecheck`, `lint`, `format`).
- `Dockerfile`: deixou de copiar `.env` para dentro da imagem; healthcheck migrado para Node (não requer `curl`); ajustado `NODE_ENV`, `PORT` e `MCP_HOST` como env padrão.
- `README.md`: badges, seção de integração com clientes MCP (Cursor/Claude), troubleshooting e links para políticas da comunidade.
- Dependências de produção atualizadas e vulnerabilidades conhecidas corrigidas.
- CI passa a reprovar lint/formatação, executar testes e auditar dependências.
- Servidor exige autenticação quando exposto fora de interfaces loopback.

### Removido

- `GITHUB_UPDATE_INSTRUCTIONS.md` (documento interno que não deveria estar no repositório público).
- Entrada `.dockerignore` do `.gitignore` (o `.dockerignore` agora é versionado).
- Dependência antiga e não utilizada do SDK MCP.

## [2.0.0]

### Adicionado

- Arquitetura modular (separação em `src/mcp/`, `src/ask-kommo.ts`).
- 11 novas tools: `get_account`, `get_lead`, `update_lead`, `move_lead`,
  `get_pipelines`, `get_dashboard`, `create_task`, `get_users`,
  `get_loss_reason`, `get_notes`, `add_note`.
- 2 novos resources: `kommo://dashboard`, `kommo://account`.
- 2 novos prompts: `analise_pipeline`, `motivos_perda`.
- API de notas: listar e criar notas.

### Modificado

- Remoção de valores hardcoded e código duplicado.
- `env.example` sanitizado (sem tokens reais).

[Unreleased]: https://github.com/Miguelgbastos/Kommo-MCP/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Miguelgbastos/Kommo-MCP/releases/tag/v2.0.0
