#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { KommoAPI } from './kommo-api.js';
import { createKommoMcpServer } from './mcp/server.js';
import { validateRuntimeConfig } from './http-streamable.js';

dotenv.config();

export function startStdioServer() {
  const configIssues = validateRuntimeConfig();
  if (configIssues.length > 0) throw new Error(configIssues.join('; '));

  const kommoAPI = new KommoAPI({
    baseUrl: process.env.KOMMO_BASE_URL!,
    accessToken: process.env.KOMMO_ACCESS_TOKEN!,
    timeoutMs: Number(process.env.KOMMO_TIMEOUT_MS ?? 15_000),
    maxRetries: Number(process.env.KOMMO_MAX_RETRIES ?? 3),
    timezone: process.env.KOMMO_TIMEZONE,
    requestsPerSecond: Number(process.env.KOMMO_REQUESTS_PER_SECOND ?? 6),
  });

  return serveStdio(() => createKommoMcpServer(kommoAPI), {
    legacy: 'serve',
    onerror: (error) => console.error(`[${new Date().toISOString()}] MCP stdio error`, error),
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startStdioServer();
