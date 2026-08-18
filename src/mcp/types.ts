import type { CallToolResult } from '@modelcontextprotocol/server';

export type McpToolResult = CallToolResult;

export interface McpToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
