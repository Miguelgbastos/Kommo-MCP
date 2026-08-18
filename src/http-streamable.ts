import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { KommoAPI } from './kommo-api.js';
import { MCP_TOOLS } from './mcp/tool-definitions.js';
import { MCP_RESOURCES } from './mcp/resources.js';
import { MCP_PROMPTS } from './mcp/prompts.js';
import { createKommoMcpServer } from './mcp/server.js';

dotenv.config();

const MODERN_MCP_PROTOCOL_VERSION = '2026-07-28';
const SERVER_VERSION = '3.0.0';

interface AppOptions {
  kommoAPI?: KommoAPI;
  authToken?: string;
  allowedOrigins?: string[];
  logLevel?: string;
}

export function validateRuntimeConfig(env: NodeJS.ProcessEnv = process.env): string[] {
  const issues: string[] = [];
  if (!env.KOMMO_BASE_URL) issues.push('KOMMO_BASE_URL is required');
  else {
    try {
      const url = new URL(env.KOMMO_BASE_URL);
      if (url.protocol !== 'https:') issues.push('KOMMO_BASE_URL must use HTTPS');
    } catch {
      issues.push('KOMMO_BASE_URL must be a valid URL');
    }
  }
  if (!env.KOMMO_ACCESS_TOKEN) issues.push('KOMMO_ACCESS_TOKEN is required');
  if (env.KOMMO_TIMEZONE) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: env.KOMMO_TIMEZONE }).format();
    } catch {
      issues.push('KOMMO_TIMEZONE must be a valid IANA timezone');
    }
  }
  return issues;
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

function jsonRpcError(code: number, message: string) {
  return { jsonrpc: '2.0', id: null, error: { code, message } };
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
  const configIssues = options.kommoAPI ? [] : validateRuntimeConfig();
  const kommoAPI =
    options.kommoAPI ??
    new KommoAPI({
      baseUrl: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
      accessToken: process.env.KOMMO_ACCESS_TOKEN || '',
      timeoutMs: Number(process.env.KOMMO_TIMEOUT_MS) || 15_000,
      maxRetries: Number(process.env.KOMMO_MAX_RETRIES) || 3,
      timezone: process.env.KOMMO_TIMEZONE,
    });
  const logger = {
    error: (message: string, error?: unknown) => {
      if (logLevel !== 'silent')
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
    },
  };

  function originAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    return (
      configuredOrigins.includes(origin) ||
      (configuredOrigins.length === 0 && isLoopbackOrigin(origin))
    );
  }

  const mcpHandler = createMcpHandler(() => createKommoMcpServer(kommoAPI), {
    legacy: 'reject',
    onerror: (error) => logger.error('MCP request failed', error),
  });
  const nodeHandler = toNodeHandler(mcpHandler, {
    onerror: (error) => logger.error('MCP adapter failed', error),
  });

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, originAllowed(origin));
      },
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'MCP-Protocol-Version',
        'Authorization',
        'X-API-Key',
      ],
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: SERVER_VERSION,
      protocol_version: MODERN_MCP_PROTOCOL_VERSION,
      tools_count: MCP_TOOLS.length,
      resources_count: MCP_RESOURCES.length,
      prompts_count: MCP_PROMPTS.length,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  app.get('/ready', (_req, res) => {
    if (configIssues.length > 0) {
      res.status(503).json({ status: 'not_ready', issues: configIssues });
      return;
    }
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  });

  app.use('/mcp', (req, res, next) => {
    if (!originAllowed(req.header('origin'))) {
      res.status(403).json(jsonRpcError(-32000, 'Origin not allowed'));
      return;
    }
    if (authToken) {
      const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      const apiKey = req.header('x-api-key');
      if (!safeTokenEquals(bearer || apiKey, authToken)) {
        res.status(401).json(jsonRpcError(-32001, 'Unauthorized'));
        return;
      }
    }
    next();
  });

  app.all('/mcp', (req, res) => void nodeHandler(req, res));

  return app;
}

export function startServer(): void {
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.MCP_HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !process.env.MCP_AUTH_TOKEN) {
    throw new Error('MCP_AUTH_TOKEN is required when MCP_HOST is not a loopback address');
  }
  const configIssues = validateRuntimeConfig();
  if (configIssues.length > 0) throw new Error(configIssues.join('; '));
  createApp().listen(port, host, () =>
    console.log(`Kommo MCP Server listening on http://${host}:${port}`),
  );
}

export const MCP_PROTOCOL_VERSION = MODERN_MCP_PROTOCOL_VERSION;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startServer();
