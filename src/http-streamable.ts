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
import { createKommoMcpServer, isReadOnlyMode } from './mcp/server.js';
import {
  getRuntimeMetrics,
  recordHttpRequest,
  recordHttpResponse,
  recordMcpForbidden,
  recordMcpRateLimited,
  recordMcpRequest,
  recordMcpUnauthorized,
} from './metrics.js';

dotenv.config({ quiet: true });

const MODERN_MCP_PROTOCOL_VERSION = '2026-07-28';
const SERVER_VERSION = '3.0.0';

interface AppOptions {
  kommoAPI?: KommoAPI;
  authToken?: string;
  allowedOrigins?: string[];
  allowedIps?: string[];
  trustProxy?: boolean | number | string;
  logLevel?: string;
  host?: string;
  rateLimitPerMinute?: number;
}

/** Prefer hop counts over boolean true so MCP_TRUST_PROXY=1 trusts one proxy, not the full chain. */
export function resolveTrustProxy(value: string | undefined): boolean | number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false' || normalized === '0') return false;
  const hopCount = Number(normalized);
  if (Number.isInteger(hopCount) && hopCount >= 1) return hopCount;
  return undefined;
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
  if (env.KOMMO_TIMEOUT_MS) {
    const timeoutMs = Number(env.KOMMO_TIMEOUT_MS);
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      issues.push('KOMMO_TIMEOUT_MS must be a positive integer');
    }
  }
  if (env.KOMMO_MAX_RETRIES) {
    const maxRetries = Number(env.KOMMO_MAX_RETRIES);
    if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10) {
      issues.push('KOMMO_MAX_RETRIES must be an integer between 0 and 10');
    }
  }
  if (env.KOMMO_REQUESTS_PER_SECOND) {
    const requestsPerSecond = Number(env.KOMMO_REQUESTS_PER_SECOND);
    if (!Number.isFinite(requestsPerSecond) || requestsPerSecond <= 0 || requestsPerSecond > 6) {
      issues.push('KOMMO_REQUESTS_PER_SECOND must be greater than 0 and at most 6');
    }
  }
  if (env.MCP_RATE_LIMIT_PER_MINUTE) {
    const rateLimitPerMinute = Number(env.MCP_RATE_LIMIT_PER_MINUTE);
    if (!Number.isInteger(rateLimitPerMinute) || rateLimitPerMinute <= 0) {
      issues.push('MCP_RATE_LIMIT_PER_MINUTE must be a positive integer');
    }
  }
  if (env.MCP_TRUST_PROXY !== undefined && env.MCP_TRUST_PROXY.trim() !== '') {
    if (resolveTrustProxy(env.MCP_TRUST_PROXY) === undefined) {
      issues.push('MCP_TRUST_PROXY must be true, false, 0, or a positive hop count');
    }
  }
  if (env.KOMMO_TIMEZONE) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: env.KOMMO_TIMEZONE }).format();
    } catch {
      issues.push('KOMMO_TIMEZONE must be a valid IANA timezone');
    }
  }
  return issues;
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

function normalizeIpAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  const first = address.split(',')[0]?.trim();
  if (!first) return undefined;
  if (first.startsWith('::ffff:')) return first.slice('::ffff:'.length);
  return first;
}

function parseCsvList(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []
  );
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
  const host = options.host ?? process.env.MCP_HOST ?? '127.0.0.1';
  const configuredOrigins = options.allowedOrigins ?? parseCsvList(process.env.MCP_ALLOWED_ORIGINS);
  const configuredIps = (options.allowedIps ?? parseCsvList(process.env.MCP_ALLOWED_IPS)).map(
    (ip) => normalizeIpAddress(ip) ?? ip,
  );
  const authToken = options.authToken ?? process.env.MCP_AUTH_TOKEN;
  if (!isLoopbackHost(host) && !authToken) {
    throw new Error('MCP_AUTH_TOKEN is required when MCP_HOST is not a loopback address');
  }
  const trustProxy = options.trustProxy ?? resolveTrustProxy(process.env.MCP_TRUST_PROXY) ?? false;
  const rateLimitPerMinute =
    options.rateLimitPerMinute ?? Number(process.env.MCP_RATE_LIMIT_PER_MINUTE ?? 120);
  if (!Number.isInteger(rateLimitPerMinute) || rateLimitPerMinute <= 0) {
    throw new Error('MCP_RATE_LIMIT_PER_MINUTE must be a positive integer');
  }
  const configIssues = options.kommoAPI ? [] : validateRuntimeConfig();
  const kommoAPI =
    options.kommoAPI ??
    new KommoAPI({
      baseUrl: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
      accessToken: process.env.KOMMO_ACCESS_TOKEN || '',
      timeoutMs: Number(process.env.KOMMO_TIMEOUT_MS ?? 15_000),
      maxRetries: Number(process.env.KOMMO_MAX_RETRIES ?? 3),
      timezone: process.env.KOMMO_TIMEZONE,
      requestsPerSecond: Number(process.env.KOMMO_REQUESTS_PER_SECOND ?? 6),
    });
  const logger = {
    error: (message: string, error?: unknown) => {
      if (logLevel !== 'silent')
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
    },
    warn: (message: string) => {
      if (logLevel !== 'silent') console.warn(`[${new Date().toISOString()}] WARN: ${message}`);
    },
  };

  if (!authToken) {
    logger.warn('MCP_AUTH_TOKEN is not configured; keep MCP_HOST bound to loopback only.');
  }
  if (!isLoopbackHost(host) && configuredIps.length === 0) {
    logger.warn(
      'MCP_ALLOWED_IPS is not configured for a non-loopback host; consider restricting client IPs.',
    );
  }
  if (process.env.MCP_CONFIRM_WRITES === 'false') {
    logger.warn('Write confirmation is disabled by MCP_CONFIRM_WRITES=false.');
  }
  if (isReadOnlyMode()) {
    logger.warn('MCP_READ_ONLY is enabled; write tools will be rejected.');
  }

  const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();

  function rateLimitExceeded(clientAddress: string): { limited: boolean; retryAfter: number } {
    const now = Date.now();
    for (const [address, window] of rateLimitWindows) {
      if (window.resetAt <= now) rateLimitWindows.delete(address);
    }
    const current = rateLimitWindows.get(clientAddress);
    if (!current) {
      rateLimitWindows.set(clientAddress, { count: 1, resetAt: now + 60_000 });
      return { limited: false, retryAfter: 0 };
    }
    if (current.count >= rateLimitPerMinute) {
      return { limited: true, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
    }
    current.count += 1;
    return { limited: false, retryAfter: 0 };
  }

  function originAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    return (
      configuredOrigins.includes(origin) ||
      (configuredOrigins.length === 0 && isLoopbackOrigin(origin))
    );
  }

  function clientAddressAllowed(address: string | undefined): boolean {
    if (configuredIps.length === 0) return true;
    const normalized = normalizeIpAddress(address);
    return Boolean(normalized && configuredIps.includes(normalized));
  }

  const mcpHandler = createMcpHandler(() => createKommoMcpServer(kommoAPI), {
    legacy: 'stateless',
    onerror: (error) => logger.error('MCP request failed', error),
  });
  const nodeHandler = toNodeHandler(mcpHandler, {
    onerror: (error) => logger.error('MCP adapter failed', error),
  });

  app.disable('x-powered-by');
  if (trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  }
  app.use((req, res, next) => {
    recordHttpRequest();
    res.on('finish', () => recordHttpResponse(res.statusCode));
    next();
  });
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, originAllowed(origin));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
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
      legacy_protocol_compatibility: true,
      tools_count: MCP_TOOLS.length,
      resources_count: MCP_RESOURCES.length,
      prompts_count: MCP_PROMPTS.length,
      read_only: isReadOnlyMode(),
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

  app.get('/metrics', (_req, res) => {
    res.json(getRuntimeMetrics());
  });

  app.use('/mcp', (req, res, next) => {
    recordMcpRequest();
    const clientAddress = normalizeIpAddress(req.ip || req.socket.remoteAddress) || 'unknown';
    if (!clientAddressAllowed(clientAddress)) {
      recordMcpForbidden();
      res.status(403).json(jsonRpcError(-32003, 'Client address not allowed'));
      return;
    }
    const rateLimit = rateLimitExceeded(clientAddress);
    if (rateLimit.limited) {
      recordMcpRateLimited();
      res.set('Retry-After', String(rateLimit.retryAfter));
      res.status(429).json(jsonRpcError(-32002, 'Too many requests'));
      return;
    }
    if (!originAllowed(req.header('origin'))) {
      recordMcpForbidden();
      res.status(403).json(jsonRpcError(-32000, 'Origin not allowed'));
      return;
    }
    if (authToken) {
      const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      const apiKey = req.header('x-api-key');
      if (!safeTokenEquals(bearer || apiKey, authToken)) {
        recordMcpUnauthorized();
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
  const configIssues = validateRuntimeConfig();
  if (configIssues.length > 0) throw new Error(configIssues.join('; '));
  createApp({ host }).listen(port, host, () =>
    console.log(`Kommo MCP Server listening on http://${host}:${port}`),
  );
}

export const MCP_PROTOCOL_VERSION = MODERN_MCP_PROTOCOL_VERSION;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startServer();
