export interface RuntimeMetrics {
  started_at: string;
  uptime_seconds: number;
  http_requests_total: number;
  http_responses_by_status: Record<string, number>;
  mcp_requests_total: number;
  mcp_rate_limited_total: number;
  mcp_unauthorized_total: number;
  mcp_forbidden_total: number;
  read_only_mode: boolean;
}

const startedAtMs = Date.now();

const state = {
  httpRequestsTotal: 0,
  httpResponsesByStatus: new Map<string, number>(),
  mcpRequestsTotal: 0,
  mcpRateLimitedTotal: 0,
  mcpUnauthorizedTotal: 0,
  mcpForbiddenTotal: 0,
};

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function recordHttpRequest(): void {
  state.httpRequestsTotal += 1;
}

export function recordHttpResponse(statusCode: number): void {
  bump(state.httpResponsesByStatus, String(statusCode));
}

export function recordMcpRequest(): void {
  state.mcpRequestsTotal += 1;
}

export function recordMcpRateLimited(): void {
  state.mcpRateLimitedTotal += 1;
}

export function recordMcpUnauthorized(): void {
  state.mcpUnauthorizedTotal += 1;
}

export function recordMcpForbidden(): void {
  state.mcpForbiddenTotal += 1;
}

export function getRuntimeMetrics(env: NodeJS.ProcessEnv = process.env): RuntimeMetrics {
  const httpResponsesByStatus: Record<string, number> = {};
  for (const [status, count] of state.httpResponsesByStatus) {
    httpResponsesByStatus[status] = count;
  }
  return {
    started_at: new Date(startedAtMs).toISOString(),
    uptime_seconds: Math.floor((Date.now() - startedAtMs) / 1000),
    http_requests_total: state.httpRequestsTotal,
    http_responses_by_status: httpResponsesByStatus,
    mcp_requests_total: state.mcpRequestsTotal,
    mcp_rate_limited_total: state.mcpRateLimitedTotal,
    mcp_unauthorized_total: state.mcpUnauthorizedTotal,
    mcp_forbidden_total: state.mcpForbiddenTotal,
    read_only_mode: env.MCP_READ_ONLY === 'true' || env.MCP_READ_ONLY === '1',
  };
}
