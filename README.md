# Kommo MCP Server

Servidor [MCP](https://modelcontextprotocol.io) (Model Context Protocol) para integração com o [Kommo CRM](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores). Expõe tools, resources e prompts para clientes MCP (Cursor, Claude, etc.).

<a href="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP/badge" alt="Kommo CRM Server MCP server" />
</a>

## 🚀 Funcionalidades
## Funcionalidades

- **Protocolo MCP**: Lifecycle (initialize / initialized), transporte Streamable HTTP, validação de headers (`MCP-Protocol-Version`, `MCP-Session-Id`)
- **Tools**: Leads, contatos, empresas, tarefas, relatório de vendas, criação de lead, motivos da perda, fixar/desafixar notas, Salesbot (run/stop)
- **Resources**: Relatório de vendas, pipelines, motivos da perda de leads
- **Prompts**: Templates para análise de vendas e resumo de leads
- **ask_kommo**: Interface conversacional (perguntas em linguagem natural sobre vendas, leads, contatos)
- **Segurança**: Validação de Origin, bind em localhost por default, autenticação opcional

## Pré-requisitos

- Node.js 20+
- Docker (opcional)
- Token de acesso do Kommo (integração privada ou OAuth2)

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

**Variáveis opcionais:**

| Variável | Descrição | Default |
|----------|-----------|---------|
| `MCP_HOST` | Host de binding | `127.0.0.1` |
| `MCP_ALLOWED_ORIGINS` | Origens permitidas (separadas por vírgula) | — |
| `MCP_AUTH_TOKEN` | Se definido, exige `Authorization: Bearer` ou `X-API-Key` no `/mcp` | — |

## Execução

**Desenvolvimento:**
```bash
npm install
npm run build
npm start
```

**Docker:**
```bash
docker build -t kommo-mcp-server .
docker run -d -p 3001:3001 --name kommo-mcp-server kommo-mcp-server
```

O servidor sobe em `http://127.0.0.1:3001` (ou `MCP_HOST:PORT`).

## Endpoints

- **MCP**: `POST http://localhost:3001/mcp` — JSON-RPC (initialize, tools/list, tools/call, resources/list, resources/read, prompts/list, prompts/get)
- **Health**: `GET http://localhost:3001/health`

## Ferramentas MCP

| Tool | Descrição |
|------|-----------|
| `get_leads` | Listar leads (limit, page) |
| `create_lead` | Criar lead (name, price, status_id) |
| `get_sales_report` | Relatório de vendas (dateFrom, dateTo) |
| `get_contacts` | Listar contatos |
| `get_companies` | Listar empresas |
| `get_tasks` | Listar tarefas |
| `get_loss_reasons` | Listar motivos da perda de leads (API 2026) |
| `pin_note` | Fixar nota (entity_type, note_id) |
| `unpin_note` | Desafixar nota (entity_type, note_id) |
| `run_salesbot` | Iniciar Salesbot (entity_id, entity_type) |
| `stop_salesbot` | Parar Salesbot (bot_id) |
| `ask_kommo` | Perguntas em linguagem natural sobre o CRM |

## Resources

- `kommo://reports/sales` — Relatório de vendas (último mês)
- `kommo://pipelines` — Lista de pipelines
- `kommo://loss_reasons` — Motivos da perda de leads

## Exemplos de uso

**1. Inicializar sessão MCP (obrigatório para clientes conformes):**
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

**3. Pergunta conversacional:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"ask_kommo","arguments":{"question":"quantas vendas tivemos este mês?"}}}'
```

**4. Motivos da perda de leads:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_loss_reasons","arguments":{}}}'
```

## Documentação

- [docs/MCP_EVOLUCAO.md](docs/MCP_EVOLUCAO.md) — Plano de evolução e conformidade MCP
- [docs/KOMMO_API_EVOLUCAO.md](docs/KOMMO_API_EVOLUCAO.md) — Evoluções da API Kommo e benefícios para o MCP

## Migração opcional para o SDK MCP

O servidor implementa o protocolo MCP manualmente. Para migrar para o SDK oficial (`@modelcontextprotocol/sdk`): use `Server` e `SSEServerTransport` de `@modelcontextprotocol/sdk/server` (e `server/sse`), monte o transport no Express e registre handlers com `setRequestHandler`, delegando à mesma lógica de negócio (KommoAPI em `src/kommo-api.ts`).

## Licença

MIT
