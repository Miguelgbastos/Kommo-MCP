# Guia de Conformidade MCP 2.1 - Kommo MCP Server

Este documento detalha a conformidade do servidor Kommo MCP com a especificação MCP (Model Context Protocol) versão 2.1.

## 1. ESTRUTURA JSON-RPC 2.0

Todos os requests e responses devem seguir a especificação JSON-RPC 2.0.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "method": "method_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Response Format - Sucesso

```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "result": {
    "data": "success_data"
  }
}
```

### Response Format - Erro

```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "details": "Optional error details"
    }
  }
}
```

## 2. HEADERS MCP

### MCP-Session-Id

**Obrigatório**: Sim (a partir de MCP 2.1)

Cada cliente deve ter uma sessão única identificada por UUID.

```
MCP-Session-Id: 550e8400-e29b-41d4-a716-446655440000
```

**Inicialização**:
```bash
curl -X POST http://localhost:3001/init \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "clientInfo": {
        "name": "Cursor",
        "version": "0.11.0"
      }
    }
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "capabilities": { ... },
    "serverInfo": { ... }
  }
}
```

### MCP-Protocol-Version

**Opcional**: Validação de versão

```
MCP-Protocol-Version: 2.1
```

Versões suportadas: `2.0`, `2.1`

## 3. CICLO DE VIDA DO PROTOCOLO

### 3.1 Inicialização

```typescript
// 1. Cliente inicia sessão
POST /mcp
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "clientInfo": {
      "name": "Cursor",
      "version": "0.11.0"
    }
  }
}

// Resposta
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "sessionId": "uuid",
    "capabilities": {
      "tools": [...],
      "resources": [...],
      "prompts": [...]
    },
    "serverInfo": {
      "name": "Kommo MCP Server",
      "version": "2.1",
      "protocol_version": "2.1"
    }
  }
}
```

### 3.2 Operações de Sessão

```typescript
// Validar sessão
GET /session/validate
Header: MCP-Session-Id: uuid

// Renovar sessão
POST /session/renew
Header: MCP-Session-Id: uuid

// Finalizar sessão
POST /session/terminate
Header: MCP-Session-Id: uuid
```

### 3.3 Terminação

```typescript
// Cliente encerra sessão
POST /mcp
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "terminate",
  "params": {}
}
```

## 4. TOOLS

### 4.1 Listar Tools

```bash
curl -X POST http://localhost:3001/tools/list \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: uuid" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "list_leads",
        "description": "Retorna lista de leads",
        "inputSchema": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": ["new", "in_progress", "won", "lost"]
            },
            "limit": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          }
        }
      }
    ]
  }
}
```

### 4.2 Chamar Tool

```bash
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: uuid" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "toolName": "list_leads",
      "toolArgs": {
        "status": "new",
        "limit": 10
      }
    }
  }'
```

**Response - Sucesso**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "isError": false,
    "data": [
      {
        "id": 1,
        "name": "João Silva",
        "status": "new"
      }
    ]
  }
}
```

**Response - Erro de Tool**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "isError": true,
    "message": "Parâmetros inválidos",
    "details": {
      "field": "status",
      "error": "Valor inválido"
    }
  }
}
```

## 5. ERROS CONFORMES MCP

### 5.1 Códigos de Erro

| Código | Nome | Uso |
|--------|------|-----|
| -32700 | Parse Error | Erro ao fazer parsing do JSON |
| -32600 | Invalid Request | Request não segue JSON-RPC 2.0 |
| -32601 | Method Not Found | Método não existe |
| -32602 | Invalid Params | Parâmetros inválidos |
| -32603 | Internal Error | Erro interno do servidor |
| 1001 | Authentication Error | Falha de autenticação |
| 1002 | Validation Error | Validação falhou |
| 1003 | Not Found | Recurso não encontrado |
| 1004 | Rate Limit Error | Limite de taxa excedido |
| 1005 | Service Unavailable | Serviço indisponível |
| 1006 | Timeout Error | Timeout na operação |

### 5.2 Erro com Detalhes

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "error": {
    "code": -32602,
    "message": "Invalid Params",
    "data": {
      "errors": [
        {
          "path": "status",
          "message": "Expected 'new' | 'in_progress' | 'won' | 'lost'",
          "code": "invalid_enum_value"
        }
      ]
    }
  }
}
```

## 6. RESOURCES (MCP 2.1)

### 6.1 Listar Resources

```bash
curl -X POST http://localhost:3001/resources/list \
  -H "MCP-Session-Id: uuid" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "resources/list"}'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [
      {
        "uri": "kommo://reports/sales",
        "name": "Sales Report",
        "description": "Relatório de vendas mensal",
        "mimeType": "application/json",
        "readOnly": true
      },
      {
        "uri": "kommo://pipelines",
        "name": "Pipelines",
        "description": "Configuração de pipelines",
        "mimeType": "application/json",
        "readOnly": true
      }
    ]
  }
}
```

### 6.2 Ler Resource

```bash
curl -X POST http://localhost:3001/resources/read \
  -H "MCP-Session-Id: uuid" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "kommo://reports/sales"
    }
  }'
```

## 7. PROMPTS (MCP 2.1)

### 7.1 Listar Prompts

```bash
curl -X POST http://localhost:3001/prompts/list \
  -H "MCP-Session-Id: uuid" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "prompts/list"}'
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "prompts": [
      {
        "name": "analyze_sales_performance",
        "description": "Analisa performance de vendas",
        "arguments": [
          {
            "name": "timeframe",
            "description": "Período de análise (week, month, quarter)"
          }
        ]
      }
    ]
  }
}
```

## 8. VALIDAÇÃO DE SESSION-ID

Todas as requests (exceto `/init`) devem incluir o header `MCP-Session-Id`.

```typescript
// Middleware de validação
export function validateSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers['mcp-session-id'] as string;
  
  if (!sessionId) {
    return res.status(400).json({
      error: 'MCP-Session-Id header is required'
    });
  }
  
  if (!mcpHandler.validateSession(sessionId)) {
    return res.status(401).json({
      error: 'Invalid or expired session'
    });
  }
  
  next();
}
```

## 9. CHECKLIST DE CONFORMIDADE

- ✅ JSON-RPC 2.0 em todos os requests/responses
- ✅ Código de erro JSON-RPC conformes (-32700 a -32603)
- ✅ Código de erro custom (1001-1006)
- ✅ Header MCP-Session-Id obrigatório
- ✅ Header MCP-Protocol-Version validado
- ✅ Tool schema com JSON Schema validado
- ✅ Resultado de tool com `isError` flag
- ✅ Error object com code, message, data
- ✅ Lifecycle: initialize → operations → terminate
- ⏳ Resources endpoint (em desenvolvimento)
- ⏳ Prompts endpoint (em desenvolvimento)

## 10. EXEMPLO COMPLETO DE FLUXO

```bash
# 1. Inicializar sessão
SESSION=$(curl -X POST http://localhost:3001/init \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {"clientInfo": {"name": "Cursor", "version": "0.11.0"}}
  }' | jq -r '.result.sessionId')

# 2. Listar tools
curl -X POST http://localhost:3001/tools/list \
  -H "MCP-Session-Id: $SESSION" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# 3. Chamar tool
curl -X POST http://localhost:3001/tools/call \
  -H "MCP-Session-Id: $SESSION" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "toolName": "list_leads",
      "toolArgs": {"status": "new"}
    }
  }'

# 4. Terminar sessão
curl -X POST http://localhost:3001/terminate \
  -H "MCP-Session-Id: $SESSION" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "terminate"}'
```

## 11. REFERÊNCIAS

- [MCP Spec 2.1](https://spec.modelcontextprotocol.io/)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [JSON Schema](https://json-schema.org/)
