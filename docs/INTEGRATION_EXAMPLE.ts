/**
 * Exemplo de Integração dos Módulos Kommo MCP
 * Este arquivo mostra como usar os novos módulos no servidor HTTP
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  mcpHandler,
  cacheManager,
  MCPErrorHandler,
  aiIntelligence,
  validateMCPRequest,
  validateSessionId,
  validateSchema,
  ListLeadsParamsSchema,
  CreateLeadSchema,
} from './modules/index.js';
import { KommoAPI } from './kommo-api.js';

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(validateSessionId);

const kommoAPI = new KommoAPI({
  baseUrl: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
  accessToken: process.env.KOMMO_ACCESS_TOKEN || '',
});

// Initialize MCP capabilities
mcpHandler.registerTool({
  name: 'list_leads',
  description: 'Retorna uma lista paginada de leads do CRM Kommo',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['new', 'in_progress', 'won', 'lost'],
        description: 'Status do lead',
      },
      limit: {
        type: 'number',
        description: 'Número máximo de leads',
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: 'number',
        description: 'Número de leads a pular',
        minimum: 0,
      },
    },
  },
});

mcpHandler.registerTool({
  name: 'create_lead',
  description: 'Cria um novo lead no CRM',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome do lead',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email do lead',
      },
      phone: {
        type: 'string',
        description: 'Telefone do lead',
      },
    },
    required: ['name'],
  },
});

// ==========================================
// ROTA 1: Inicializar Sessão
// ==========================================
app.post('/init', (req: Request, res: Response) => {
  try {
    const sessionId = mcpHandler.initializeSession({
      name: req.body.clientName,
      version: req.body.clientVersion,
    });

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        sessionId,
        capabilities: mcpHandler.getCapabilities(),
        serverInfo: mcpHandler.getServerInfo(),
      },
    });
  } catch (error) {
    res.json(
      MCPErrorHandler.formatResponse(
        MCPErrorHandler.fromStandardError(error),
        req.body.id
      )
    );
  }
});

// ==========================================
// ROTA 2: Listar Tools
// ==========================================
app.post('/tools/list', validateMCPRequest, (req: Request, res: Response) => {
  try {
    const tools = mcpHandler.getTools();

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools,
      },
    });
  } catch (error) {
    res.json(
      MCPErrorHandler.formatResponse(
        MCPErrorHandler.internalError('Erro ao listar tools'),
        req.body.id
      )
    );
  }
});

// ==========================================
// ROTA 3: Executar Tool (list_leads)
// ==========================================
app.post(
  '/tools/call/list_leads',
  validateMCPRequest,
  validateSchema(ListLeadsParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const params = (req as any).validatedParams;
      const cacheKey = `leads:${JSON.stringify(params)}`;

      // Verificar cache
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        return res.json({
          jsonrpc: '2.0',
          id: req.body.id,
          result: {
            isError: false,
            data: cached,
            cached: true,
          },
        });
      }

      // Buscar da API Kommo
      const leads = await kommoAPI.getLeads(params);

      // Armazenar em cache
      cacheManager.set(cacheKey, leads, 5 * 60 * 1000);

      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          isError: false,
          data: leads,
        },
      });
    } catch (error) {
      const mcpError = MCPErrorHandler.fromStandardError(error);
      const toolError = MCPErrorHandler.formatToolError(mcpError.message);

      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: toolError,
      });
    }
  }
);

// ==========================================
// ROTA 4: Executar Tool (create_lead)
// ==========================================
app.post(
  '/tools/call/create_lead',
  validateMCPRequest,
  validateSchema(CreateLeadSchema),
  async (req: Request, res: Response) => {
    try {
      const params = (req as any).validatedParams;

      // Criar lead na API Kommo
      const newLead = await kommoAPI.createLead(params);

      // Invalidar cache de leads
      cacheManager.invalidatePattern(/^leads:/);

      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          isError: false,
          data: newLead,
        },
      });
    } catch (error) {
      const mcpError = MCPErrorHandler.fromStandardError(error);
      const toolError = MCPErrorHandler.formatToolError(mcpError.message);

      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: toolError,
      });
    }
  }
);

// ==========================================
// ROTA 5: AI Analytics
// ==========================================
app.post('/ai/analyze', validateMCPRequest, (req: Request, res: Response) => {
  try {
    const { text } = req.body.params;

    const analysis = aiIntelligence.analyzeSemantics(text);

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: analysis,
    });
  } catch (error) {
    res.json(
      MCPErrorHandler.formatResponse(
        MCPErrorHandler.internalError('Erro na análise'),
        req.body.id
      )
    );
  }
});

// ==========================================
// ROTA 6: Trends e Predictions
// ==========================================
app.post('/ai/predict', validateMCPRequest, (req: Request, res: Response) => {
  try {
    const { data, timeframe } = req.body.params;

    const trends = aiIntelligence.analyzeTrends(data);
    const prediction = aiIntelligence.predict(data, timeframe);
    const anomalies = aiIntelligence.detectAnomalies(data);

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        trends,
        prediction,
        anomalies,
      },
    });
  } catch (error) {
    res.json(
      MCPErrorHandler.formatResponse(
        MCPErrorHandler.internalError('Erro na predição'),
        req.body.id
      )
    );
  }
});

// ==========================================
// ROTA 7: Health Check
// ==========================================
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcp: {
      version: '2.1',
      sessionsActive: mcpHandler.getSessionCount(),
      toolsRegistered: mcpHandler.getTools().length,
      cacheStats: cacheManager.getStats(),
    },
  });
});

export default app;
