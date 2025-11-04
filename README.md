# Kommo MCP Server

Servidor MCP (Model Context Protocol) para integração com o Kommo CRM.

<a href="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP/badge" alt="Kommo CRM Server MCP server" />
</a>

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

- **MCP**: `http://localhost:3001/mcp`
- **Health**: `http://localhost:3001/health`

## 🔧 Ferramentas Disponíveis

- `ask_kommo`: Interface conversacional para perguntas sobre dados
- `get_leads`: Buscar leads com filtros
- `get_contacts`: Buscar contatos
- `get_companies`: Buscar empresas
- `get_tasks`: Buscar tarefas

## 📊 Exemplos de Uso

```bash
# Perguntas sobre vendas
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "ask_kommo", "arguments": {"question": "quantas vendas tivemos em maio?"}}}'
```

## 📝 Licença

MIT