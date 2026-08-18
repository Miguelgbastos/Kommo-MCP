import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { KommoAPI } from '../kommo-api.js';
import { MCP_TOOLS } from './tool-definitions.js';
import { executeTool } from './tool-handlers.js';
import { MCP_RESOURCES, readResource } from './resources.js';
import { MCP_PROMPTS, getPromptMessages } from './prompts.js';

export function createKommoMcpServer(kommoAPI: KommoAPI): McpServer {
  const server = new McpServer({
    name: 'kommo-mcp-server',
    version: '2.0.0',
    description: 'MCP Server for Kommo CRM integration',
  });

  for (const tool of MCP_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: fromJsonSchema<Record<string, unknown>>(tool.inputSchema),
      },
      async (args) => executeTool(kommoAPI, tool.name, args),
    );
  }

  for (const resource of MCP_RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: resource.mimeType,
            text: await readResource(kommoAPI, uri.href),
          },
        ],
      }),
    );
  }

  for (const prompt of MCP_PROMPTS) {
    const shape = Object.fromEntries(
      prompt.arguments.map((argument) => [
        argument.name,
        argument.required ? z.string() : z.string().optional(),
      ]),
    );
    server.registerPrompt(
      prompt.name,
      {
        description: prompt.description,
        argsSchema: z.object(shape),
      },
      async () => ({ messages: getPromptMessages(prompt.name) }),
    );
  }

  return server;
}
