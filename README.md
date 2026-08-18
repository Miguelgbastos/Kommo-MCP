# Kommo MCP Server

[![CI](https://github.com/Miguelgbastos/Kommo-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Miguelgbastos/Kommo-MCP/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Servidor [MCP](https://modelcontextprotocol.io) (Model Context Protocol) para
integração com o [Kommo CRM](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores).
Expõe **tools**, **resources** e **prompts** para clientes MCP (Cursor, Claude
Desktop, etc.).

<a href="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP/badge" alt="Kommo CRM Server MCP server" />
</a>

## Sumário

- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Início rápido](#início-rápido)
- [Configuração](#configuração)
- [Execução](#execução)
- [Integração com clientes MCP](#integração-com-clientes-mcp)
- [Endpoints](#endpoints)
- [Ferramentas MCP](#ferramentas-mcp)
- [Resources](#resources)
- [Prompts](#prompts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Exemplos de uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Segurança](#segurança)
- [Licença](#licença)

## Funcionalidades

- **Protocolo MCP v2**: lifecycle, transporte Streamable HTTP, validação de
  headers (`MCP-Protocol-Version`, `MCP-Session-Id`)
- **23 tools**: leads, contatos, empresas, tarefas, pipelines, notas,
  relatórios, dashboard, Salesbot, motivos de perda
- **5 resources**: relatório de vendas, pipelines, motivos de perda,
  dashboard, conta
- **4 prompts**: templates para análise de vendas, leads, pipelines e motivos
  de perda
- **`ask_kommo`**: interface conversacional em linguagem natural
- **Arquitetura modular**: código organizado em módulos (`kommo-api`, `mcp/`,
  `ask-kommo`)
- **Segurança**: validação de Origin, bind em localhost por default,
  autenticação opcional

## Pré-requisitos

- Node.js **20+**
- Docker (opcional)
- Token de acesso do Kommo (integração privada ou OAuth2) —
  ver [documentação do Kommo](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)

## Início rápido

```bash
git clone https://github.com/Miguelgbastos/Kommo-MCP.git
cd Kommo-MCP
npm install
cp env.example .env
# edite .env com KOMMO_BASE_URL e KOMMO_ACCESS_TOKEN
npm run build
npm start
```

O servidor sobe em `http://127.0.0.1:3001/mcp`.

## Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cp env.example .env
   ```
2. Configure no `.env`:
   ```
   KOMMO_BASE_URL=https://seu-dominio.kommo.com
   KOMMO_ACCESS_TOKEN=seu-token-aqui
   ```

### Variáveis de ambiente

| Variável                | Descrição                                                                | Default     |
| ----------------------- | ------------------------------------------------------------------------ | ----------- |
| `KOMMO_BASE_URL`        | URL da conta Kommo (`https://<subdominio>.kommo.com`)                    | —           |
| `KOMMO_ACCESS_TOKEN`    | Token de acesso (integração privada ou OAuth2)                           | —           |
| `PORT`                  | Porta HTTP do servidor MCP                                               | `3001`      |
| `MCP_HOST`              | Host de binding                                                          | `127.0.0.1` |
| `MCP_ALLOWED_ORIGINS`   | Origens permitidas (separadas por vírgula)                               | —           |
| `MCP_AUTH_TOKEN`        | Se definido, exige `Authorization: Bearer` ou `X-API-Key` no `/mcp`      | —           |
| `LOG_LEVEL`             | Nível de log                                                             | `info`      |

## Execução

**Desenvolvimento:**

```bash
npm install
npm run dev        # ts-node
# ou
npm run build && npm start
```

**Docker:**

```bash
docker build -t kommo-mcp-server .
docker run -d -p 3001:3001 \
  -e KOMMO_BASE_URL=https://seu-dominio.kommo.com \
  -e KOMMO_ACCESS_TOKEN=seu-token \
  -e MCP_HOST=0.0.0.0 \
  --name kommo-mcp-server kommo-mcp-server
```

> Em produção, considere colocar o servidor atrás de um reverse proxy com TLS
> e definir `MCP_AUTH_TOKEN` + `MCP_ALLOWED_ORIGINS`.

## Integração com clientes MCP

### Cursor

Adicione ao arquivo `~/.cursor/mcp.json` (ou nas configurações do projeto em
`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kommo": {
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

### Claude Desktop

Adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kommo": {
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

Reinicie o cliente após alterar a configuração.

## Endpoints

- **MCP**: `POST http://localhost:3001/mcp` — JSON-RPC (`initialize`,
  `tools/list`, `tools/call`, `resources/list`, `resources/read`,
  `prompts/list`, `prompts/get`)
- **Health**: `GET http://localhost:3001/health`

## Ferramentas MCP

### Conta e dashboard

| Tool            | Descrição                     |
| --------------- | ----------------------------- |
| `get_account`   | Informações da conta Kommo    |
| `get_dashboard` | Dados do dashboard            |

### Leads

| Tool          | Descrição                                                    |
| ------------- | ------------------------------------------------------------ |
| `get_leads`   | Listar leads (`limit`, `page`, `query`)                      |
| `get_lead`    | Obter lead por ID                                            |
| `create_lead` | Criar lead (`name`, `price`, `status_id`, `pipeline_id`)     |
| `update_lead` | Atualizar lead existente                                     |
| `move_lead`   | Mover lead para outro status/pipeline                        |

### Pipelines e relatórios

| Tool               | Descrição                                                     |
| ------------------ | ------------------------------------------------------------- |
| `get_pipelines`    | Listar pipelines (com status opcional por `pipeline_id`)      |
| `get_sales_report` | Relatório de vendas (`dateFrom`, `dateTo`)                    |

### Contatos, empresas e tarefas

| Tool            | Descrição                             |
| --------------- | ------------------------------------- |
| `get_contacts`  | Listar contatos                       |
| `get_companies` | Listar empresas                       |
| `get_tasks`     | Listar tarefas                        |
| `create_task`   | Criar tarefa vinculada a entidade     |
| `get_users`     | Listar usuários da conta              |

### Notas

| Tool          | Descrição                                     |
| ------------- | --------------------------------------------- |
| `get_notes`   | Listar notas de lead/contato/empresa          |
| `add_note`    | Adicionar nota de texto                       |
| `pin_note`    | Fixar nota                                    |
| `unpin_note`  | Desafixar nota                                |

### Motivos de perda e Salesbot

| Tool                | Descrição                          |
| ------------------- | ---------------------------------- |
| `get_loss_reasons`  | Listar motivos da perda de leads   |
| `get_loss_reason`   | Obter motivo de perda por ID       |
| `run_salesbot`      | Iniciar Salesbot                   |
| `stop_salesbot`     | Parar Salesbot                     |

### IA conversacional

| Tool         | Descrição                                          |
| ------------ | -------------------------------------------------- |
| `ask_kommo`  | Perguntas em linguagem natural sobre o CRM         |

## Resources

| URI                     | Descrição                            |
| ----------------------- | ------------------------------------ |
| `kommo://reports/sales` | Relatório de vendas (último mês)     |
| `kommo://pipelines`     | Lista de pipelines                   |
| `kommo://loss_reasons`  | Motivos da perda de leads            |
| `kommo://dashboard`     | Dados do dashboard                   |
| `kommo://account`       | Informações da conta                 |

## Prompts

| Nome                    | Descrição                          |
| ----------------------- | ---------------------------------- |
| `analisar_vendas_mes`   | Analisar vendas do mês             |
| `resumo_leads_status`   | Resumo de leads por status         |
| `analise_pipeline`      | Analisar performance de pipeline   |
| `motivos_perda`         | Analisar motivos de perda          |

## Estrutura do projeto

```
src/
├── kommo-api.ts             # Cliente da API Kommo
├── ask-kommo.ts             # Lógica conversacional ask_kommo
├── http-streamable.ts       # Servidor MCP HTTP
└── mcp/
    ├── types.ts             # Tipos MCP
    ├── tool-definitions.ts  # Schemas das tools
    ├── tool-handlers.ts     # Execução das tools
    ├── resources.ts         # Resources MCP
    └── prompts.ts           # Prompts MCP
```

## Exemplos de uso

**1. Inicializar sessão MCP:**

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"cli","version":"1.0.0"}}}'
```

**2. Listar ferramentas:**

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

**3. Mover lead para outro status:**

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"move_lead","arguments":{"lead_id":12345,"status_id":142}}}'
```

**4. Adicionar nota a um lead:**

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"add_note","arguments":{"entity_type":"leads","entity_id":12345,"text":"Cliente interessado no plano premium"}}}'
```

## Troubleshooting

- **`401 Unauthorized` da API do Kommo** — verifique se `KOMMO_ACCESS_TOKEN`
  está válido e se `KOMMO_BASE_URL` aponta para o subdomínio correto da sua
  conta.
- **Cliente MCP não conecta** — confirme se `MCP_HOST` permite conexões do
  cliente (`0.0.0.0` para acesso remoto) e se `MCP_ALLOWED_ORIGINS` inclui a
  origem do cliente, quando definido.
- **`403` no `/mcp`** — se `MCP_AUTH_TOKEN` estiver definido, é preciso
  enviar `Authorization: Bearer <token>` ou `X-API-Key: <token>`.
- **Docker `HEALTHCHECK` falha** — a imagem usa `node --eval` para o
  healthcheck, verifique se a porta interna corresponde a `PORT`.
- **Erros de build TypeScript** — rode `npm run typecheck` para ver mensagens
  detalhadas. Requer Node.js 20+.

## Documentação

- [docs/MCP_EVOLUCAO.md](docs/MCP_EVOLUCAO.md) — plano de evolução e
  conformidade MCP
- [docs/KOMMO_API_EVOLUCAO.md](docs/KOMMO_API_EVOLUCAO.md) — evoluções da API
  Kommo
- [Kommo para desenvolvedores](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)
- [Changelog Kommo](https://pt-developers.kommo.com/changelog)
- [CHANGELOG.md](CHANGELOG.md) deste projeto

## Contribuindo

Contribuições são muito bem-vindas! Leia o
[CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo completo e o
[Código de Conduta](CODE_OF_CONDUCT.md) para as regras da comunidade.

Sugestões rápidas:

- Abra uma [issue](https://github.com/Miguelgbastos/Kommo-MCP/issues) usando
  os templates.
- Envie um PR pequeno e focado, com descrição do que muda e por quê.
- Rode `npm run build`, `npm run typecheck` e `npm run lint` antes de
  enviar.

## Segurança

Para reportar vulnerabilidades, veja [SECURITY.md](SECURITY.md). **Não**
abra issues públicas para problemas de segurança.

## Licença

Distribuído sob a licença [MIT](LICENSE).
