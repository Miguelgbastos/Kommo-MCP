# Kommo MCP Server

Servidor MCP (Model Context Protocol) para integração com o Kommo CRM.

## 🚀 Funcionalidades

- **Análise de Vendas**: Consultas sobre vendas por período e categoria
- **Análise de Leads**: Estatísticas e insights sobre leads
- **Modo Conversacional**: Interface de IA para perguntas naturais
- **Filtros Avançados**: Por data, categoria e status

## 📋 Pré-requisitos

- Node.js 20+
- Docker (opcional)
- Token de acesso do Kommo

## ⚙️ Configuração

1. Copie o arquivo de exemplo:
```bash
cp env.example .env
```

2. Configure suas credenciais no `.env`:
```
KOMMO_BASE_URL=https://seu-dominio.kommo.com
KOMMO_ACCESS_TOKEN=seu-token-aqui
```

Variáveis opcionais: **MCP_HOST** (default `127.0.0.1`), **MCP_ALLOWED_ORIGINS** (origens permitidas), **MCP_AUTH_TOKEN** (exige Bearer ou X-API-Key no `/mcp`).

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm install
npm run build
npm start
```

### Docker
```bash
docker build -t kommo-mcp-server .
docker run -d -p 3001:3001 --name kommo-mcp-server kommo-mcp-server
```

## 📡 Endpoints

- **MCP**: `http://localhost:3001/mcp` (por default escuta em `127.0.0.1`; use `MCP_HOST=0.0.0.0` para rede)
- **Health**: `http://localhost:3001/health`

## 🔧 Ferramentas Disponíveis

- `ask_kommo`: Interface conversacional para perguntas sobre dados
- `get_leads`: Buscar leads com filtros
- `get_contacts`: Buscar contatos
- `get_companies`: Buscar empresas
- `get_tasks`: Buscar tarefas
- `get_loss_reasons`: Listar motivos da perda de leads (API 2026)
- `pin_note` / `unpin_note`: Fixar ou desafixar nota em lead, contato ou empresa
- `run_salesbot` / `stop_salesbot`: Iniciar ou parar Salesbot (API v4)

Recursos MCP: `kommo://reports/sales`, `kommo://pipelines`, `kommo://loss_reasons`.

## 📊 Exemplos de Uso

```bash
# Perguntas sobre vendas
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "ask_kommo", "arguments": {"question": "quantas vendas tivemos em maio?"}}}'
```

## 📝 Licença

MIT

## Migração opcional para o SDK MCP

O servidor implementa o protocolo MCP manualmente (lifecycle, tools, resources, prompts). Para migrar para o SDK oficial (`@modelcontextprotocol/sdk`): use `Server` de `@modelcontextprotocol/sdk/server` e `SSEServerTransport` de `@modelcontextprotocol/sdk/server/sse`; monte o transport no Express (GET para o stream SSE, POST para mensagens) e registre handlers com `setRequestHandler` para cada método, delegando à mesma lógica de negócio (KommoAPI e helpers em `http-streamable.ts`).