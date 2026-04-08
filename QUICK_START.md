# Quick Start - Kommo MCP Dashboard & Improvements

Guia rápido para começar a usar o dashboard e as melhorias implementadas.

## 1. Setup Inicial (5 minutos)

### Backend

```bash
# Clone/faça pull do repositório
git clone https://github.com/Miguelgbastos/Kommo-MCP.git
cd Kommo-MCP

# Instale as dependências (incluindo as novas)
npm install zod uuid

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores de KOMMO_BASE_URL e KOMMO_ACCESS_TOKEN

# Rode o servidor
npm run dev
# Servidor rodando em http://localhost:3001
```

### Frontend Dashboard

```bash
# Em outro terminal, vá para o diretório web
cd web

# Instale as dependências
npm install

# Rode o dashboard
npm run dev
# Dashboard rodando em http://localhost:3000
```

## 2. Testar o Dashboard (2 minutos)

1. Abra `http://localhost:3000` no navegador
2. Você verá:
   - Status do servidor MCP
   - Lista de tools disponíveis
   - Tabela de leads
   - Ações rápidas

## 3. Usar os Novos Módulos no Seu Código

### Validar Requests com Zod

```typescript
import { CreateLeadSchema, MCPErrorHandler } from './modules/index.js';

// No seu handler
try {
  const validatedData = CreateLeadSchema.parse(req.body.params);
  // Usar validatedData
} catch (error) {
  const mcpError = MCPErrorHandler.validationError('Dados inválidos');
  res.json(MCPErrorHandler.formatResponse(mcpError, req.body.id));
}
```

### Usar Cache

```typescript
import { cacheManager } from './modules/index.js';

// Armazenar
cacheManager.set('leads:status-new', data, 5 * 60 * 1000);

// Recuperar
const cached = cacheManager.get('leads:status-new');

// Invalidar padrão
cacheManager.invalidatePattern(/^leads:/);
```

### Gerenciar Sessões MCP

```typescript
import { mcpHandler } from './modules/index.js';

// Iniciar sessão
const sessionId = mcpHandler.initializeSession({
  name: 'Cursor',
  version: '0.11.0'
});

// Validar sessão
if (mcpHandler.validateSession(sessionId)) {
  // Sessão válida
}

// Terminar sessão
mcpHandler.endSession(sessionId);
```

### Análise de IA

```typescript
import { aiIntelligence } from './modules/index.js';

// Análise semântica
const analysis = aiIntelligence.analyzeSemantics('Quantos leads novos?');
console.log(analysis.intent);  // 'general_query'

// Trends
const trends = aiIntelligence.analyzeTrends([10, 12, 15, 18]);
console.log(trends.trend);  // 'increasing'

// Predictions
const pred = aiIntelligence.predict([10, 12, 15, 18], 'next_week');
console.log(pred.predictedValue);  // ~22
```

## 4. Testar com cURL

### Inicializar Sessão

```bash
curl -X POST http://localhost:3001/init \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "clientInfo": {"name": "Cursor", "version": "0.11.0"}
    }
  }'
```

### Listar Tools (precisa do Session-Id do passo anterior)

```bash
curl -X POST http://localhost:3001/tools/list \
  -H "Content-Type: application/json" \
  -H "MCP-Session-Id: YOUR_SESSION_ID_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

## 5. Documentação Detalhada

| Arquivo | Conteúdo |
|---------|----------|
| `IMPLEMENTATION_SUMMARY.md` | Resumo completo do projeto |
| `docs/IMPROVEMENTS.md` | Detalhes técnicos das melhorias |
| `docs/MCP_2.1_COMPLIANCE.md` | Guia de conformidade MCP 2.1 |
| `docs/INTEGRATION_EXAMPLE.ts` | Código completo de integração |
| `web/README.md` | Instruções do dashboard |

## 6. Estrutura de Arquivos Criados

### Backend Modules
```
src/modules/
├── validators.ts              # Zod schemas
├── cache-manager.ts           # Cache system
├── error-handler.ts           # Error handling
├── mcp-handler.ts             # MCP lifecycle
├── ai-intelligence.ts         # AI analysis
├── validation-middleware.ts   # Express middleware
└── index.ts                   # Centralized exports
```

### Frontend Dashboard
```
web/
├── app/(dashboard)/
│   ├── page.tsx              # Home dashboard
│   ├── tools/page.tsx        # Tools explorer
│   ├── leads/page.tsx        # Leads management
│   ├── reports/page.tsx      # Reports
│   ├── resources/page.tsx    # Resources
│   └── settings/page.tsx     # Settings
├── components/
│   ├── layout/               # Navbar, Sidebar
│   ├── dashboard/            # Dashboard components
│   ├── tools/                # Tools components
│   └── leads/                # Leads components
└── globals.css               # Theme tokens
```

## 7. Checklist de Validação

- [ ] Backend rodando em http://localhost:3001
- [ ] Frontend rodando em http://localhost:3000
- [ ] Dashboard carregando sem erros
- [ ] Módulos importando corretamente
- [ ] Zod validando schemas
- [ ] Cache funcionando
- [ ] Sessões sendo gerenciadas
- [ ] Errors em formato MCP

## 8. Próximos Passos

### Curto Prazo
1. Conectar dashboard ao backend real
2. Implementar teste de tools funcional
3. Adicionar CRUD de leads real

### Médio Prazo
1. Rate limiting
2. Structured logging com Winston
3. Testes automatizados

### Longo Prazo
1. Resources endpoint
2. Prompts endpoint
3. Gráficos de analytics
4. Predictions de vendas

## 9. Troubleshooting

### "Module not found: zod"
```bash
npm install zod uuid
```

### "Connection refused" no dashboard
- Verificar se backend está rodando em 3001
- Verificar CORS em `.env`

### "Invalid Session-Id"
- Session-Id expira após 30 minutos (configurável em `.env`)
- Inicializar nova sessão com `/init`

## 10. Suporte

Para mais detalhes:
1. Leia `docs/IMPROVEMENTS.md` para entender as melhorias
2. Veja `docs/MCP_2.1_COMPLIANCE.md` para conformidade
3. Consulte `docs/INTEGRATION_EXAMPLE.ts` para exemplos de código

---

**Pronto para começar!** 🚀

Execute os 4 comandos abaixo e você terá tudo funcionando:

```bash
# Terminal 1: Backend
npm install zod uuid && npm run dev

# Terminal 2: Frontend
cd web && npm install && npm run dev

# Terminal 3: Testar com cURL
curl -X POST http://localhost:3001/init ...
```
