import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { KommoAPI } from './kommo-api.js';
import { MCP_TOOLS } from './mcp/tool-definitions.js';
import { executeTool } from './mcp/tool-handlers.js';
import { MCP_RESOURCES, isKnownResource, readResource } from './mcp/resources.js';
import { MCP_PROMPTS, isKnownPrompt, getPromptMessages } from './mcp/prompts.js';
import { validateToolArguments } from './mcp/tool-validation.js';

dotenv.config();

const DEFAULT_MCP_PROTOCOL_VERSION = '2025-11-25';
const SUPPORTED_MCP_PROTOCOL_VERSIONS = [
  '2024-11-05',
  '2025-03-26',
  '2025-06-18',
  '2025-11-25',
] as const;
const SESSION_TTL_MS = 60 * 60 * 1000;

interface Session {
  initialized: boolean;
  lastSeenAt: number;
  protocolVersion: string;
}
interface AppOptions {
  kommoAPI?: KommoAPI;
  authToken?: string;
  allowedOrigins?: string[];
  logLevel?: string;
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

function safeTokenEquals(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function jsonRpcError(id: unknown, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const logLevel = options.logLevel ?? process.env.LOG_LEVEL ?? 'info';
  const configuredOrigins =
    options.allowedOrigins ??
    process.env.MCP_ALLOWED_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ??
    [];
  const authToken = options.authToken ?? process.env.MCP_AUTH_TOKEN;
  const kommoAPI =
    options.kommoAPI ??
    new KommoAPI({
      baseUrl: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
      accessToken: process.env.KOMMO_ACCESS_TOKEN || '',
    });
  const sessions = new Map<string, Session>();
  const logger = {
    debug: (message: string, data?: unknown) => {
      if (logLevel === 'debug')
        console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, data ?? '');
    },
    error: (message: string, error?: unknown) =>
      console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error),
  };

  function originAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    return (
      configuredOrigins.includes(origin) ||
      (configuredOrigins.length === 0 && isLoopbackOrigin(origin))
    );
  }

  function requireSession(req: Request, res: Response): Session | undefined {
    const sessionId = req.header('MCP-Session-Id');
    if (!sessionId) {
      res.status(400).json(jsonRpcError(req.body?.id, -32600, 'Missing MCP-Session-Id header'));
      return undefined;
    }
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json(jsonRpcError(req.body?.id, -32001, 'Session not found or expired'));
      return undefined;
    }
    session.lastSeenAt = Date.now();
    return session;
  }

  function sendMcpResponse(res: Response, payload: object, req: Request): void {
    if ((req.header('accept') ?? '').toLowerCase().includes('application/json')) {
      res.status(200).json(payload);
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.end();
  }

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        const allowed = originAllowed(origin);
        callback(null, allowed);
      },
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'MCP-Protocol-Version',
        'MCP-Session-Id',
        'Authorization',
        'X-API-Key',
      ],
      exposedHeaders: ['MCP-Session-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb', strict: true }));

  app.use('/mcp', (req, res, next) => {
    if (!originAllowed(req.header('origin'))) {
      res.status(403).json(jsonRpcError(req.body?.id, -32000, 'Origin not allowed'));
      return;
    }
    if (authToken) {
      const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      const apiKey = req.header('x-api-key');
      if (!safeTokenEquals(bearer || apiKey, authToken)) {
        res.status(401).json(jsonRpcError(req.body?.id, -32001, 'Unauthorized'));
        return;
      }
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      tools_count: MCP_TOOLS.length,
      resources_count: MCP_RESOURCES.length,
      prompts_count: MCP_PROMPTS.length,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  app.get('/mcp', (_req, res) => {
    res
      .status(405)
      .setHeader('Allow', 'POST, DELETE')
      .json(jsonRpcError(null, -32601, 'Server-initiated SSE streams are not supported'));
  });

  app.delete('/mcp', (req, res) => {
    const sessionId = req.header('MCP-Session-Id');
    if (!sessionId) {
      res.status(400).json(jsonRpcError(null, -32600, 'Missing MCP-Session-Id header'));
      return;
    }
    if (!sessions.delete(sessionId)) {
      res.status(404).json(jsonRpcError(null, -32001, 'Session not found or expired'));
      return;
    }
    res.status(204).end();
  });

  app.post('/mcp', async (req, res) => {
    const body = req.body;
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      body.jsonrpc !== '2.0' ||
      typeof body.method !== 'string'
    ) {
      res.status(400).json(jsonRpcError(body?.id, -32600, 'Invalid JSON-RPC request'));
      return;
    }
    const { method, params, id } = body;
    logger.debug('MCP request', { method, id });

    if (method === 'initialize') {
      const requestedVersion = params?.protocolVersion;
      if (
        typeof requestedVersion !== 'string' ||
        !SUPPORTED_MCP_PROTOCOL_VERSIONS.includes(
          requestedVersion as (typeof SUPPORTED_MCP_PROTOCOL_VERSIONS)[number],
        )
      ) {
        res.status(400).json(
          jsonRpcError(id, -32602, 'Unsupported protocol version', {
            supported: SUPPORTED_MCP_PROTOCOL_VERSIONS,
          }),
        );
        return;
      }
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, {
        initialized: false,
        lastSeenAt: Date.now(),
        protocolVersion: requestedVersion,
      });
      res.setHeader('MCP-Session-Id', sessionId);
      sendMcpResponse(
        res,
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: requestedVersion,
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
            serverInfo: {
              name: 'kommo-mcp-server',
              version: '2.0.0',
              description: 'MCP Server for Kommo CRM integration',
            },
          },
        },
        req,
      );
      return;
    }

    const session = requireSession(req, res);
    if (!session) return;
    if (req.header('MCP-Protocol-Version') !== session.protocolVersion) {
      res.status(400).json(
        jsonRpcError(id, -32600, 'Missing or unsupported MCP-Protocol-Version header', {
          supported: SUPPORTED_MCP_PROTOCOL_VERSIONS,
        }),
      );
      return;
    }
    if (method === 'notifications/initialized' && id === undefined) {
      session.initialized = true;
      res.status(202).end();
      return;
    }
    if (!session.initialized) {
      res.status(400).json(jsonRpcError(id, -32002, 'Session has not completed initialization'));
      return;
    }
    if (id === undefined) {
      res.status(202).end();
      return;
    }

    try {
      if (method === 'tools/list') {
        sendMcpResponse(res, { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } }, req);
        return;
      }
      if (method === 'tools/call') {
        const name = params?.name;
        if (typeof name !== 'string') {
          sendMcpResponse(res, jsonRpcError(id, -32602, 'Tool name is required'), req);
          return;
        }
        const validation = validateToolArguments(name, params?.arguments);
        if (!validation.ok) {
          sendMcpResponse(
            res,
            jsonRpcError(id, validation.unknownTool ? -32601 : -32602, validation.message),
            req,
          );
          return;
        }
        const result = await executeTool(kommoAPI, name, validation.arguments);
        sendMcpResponse(res, { jsonrpc: '2.0', id, result }, req);
        return;
      }
      if (method === 'resources/list') {
        sendMcpResponse(res, { jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } }, req);
        return;
      }
      if (method === 'resources/read') {
        const uri = params?.uri;
        if (typeof uri !== 'string' || !isKnownResource(uri)) {
          sendMcpResponse(res, jsonRpcError(id, -32602, 'Unknown resource URI', { uri }), req);
          return;
        }
        const text = await readResource(kommoAPI, uri);
        sendMcpResponse(
          res,
          {
            jsonrpc: '2.0',
            id,
            result: { contents: [{ uri, mimeType: 'application/json', text }] },
          },
          req,
        );
        return;
      }
      if (method === 'prompts/list') {
        sendMcpResponse(res, { jsonrpc: '2.0', id, result: { prompts: MCP_PROMPTS } }, req);
        return;
      }
      if (method === 'prompts/get') {
        const promptName = params?.name;
        if (typeof promptName !== 'string' || !isKnownPrompt(promptName)) {
          sendMcpResponse(
            res,
            jsonRpcError(id, -32602, 'Unknown prompt name', { name: promptName }),
            req,
          );
          return;
        }
        sendMcpResponse(
          res,
          { jsonrpc: '2.0', id, result: { messages: getPromptMessages(promptName) } },
          req,
        );
        return;
      }
      sendMcpResponse(res, jsonRpcError(id, -32601, `Method not found: ${method}`), req);
    } catch (error) {
      logger.error(`Failed to process ${method}`, error);
      const message = error instanceof Error ? error.message : 'Internal error';
      sendMcpResponse(
        res,
        {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: message }], isError: true },
        },
        req,
      );
    }
  });

  const cleanupTimer = setInterval(
    () => {
      const cutoff = Date.now() - SESSION_TTL_MS;
      for (const [id, session] of sessions) if (session.lastSeenAt < cutoff) sessions.delete(id);
    },
    5 * 60 * 1000,
  );
  cleanupTimer.unref();
  return app;
}

export function startServer(): void {
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.MCP_HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !process.env.MCP_AUTH_TOKEN) {
    throw new Error('MCP_AUTH_TOKEN is required when MCP_HOST is not a loopback address');
  }
  createApp().listen(port, host, () =>
    console.log(`Kommo MCP Server listening on http://${host}:${port}`),
  );
}

export const MCP_PROTOCOL_VERSION = DEFAULT_MCP_PROTOCOL_VERSION;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startServer();
