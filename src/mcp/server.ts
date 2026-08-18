import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import axios from 'axios';
import { z } from 'zod';
import { KommoAPI } from '../kommo-api.js';
import { MCP_TOOLS } from './tool-definitions.js';
import { executeTool } from './tool-handlers.js';
import { MCP_RESOURCES, readResource } from './resources.js';
import { MCP_PROMPTS, getPromptMessages } from './prompts.js';

const WRITE_TOOLS = new Set([
  'create_lead',
  'update_lead',
  'move_lead',
  'create_task',
  'add_note',
  'pin_note',
  'unpin_note',
  'run_salesbot',
  'stop_salesbot',
]);

function safeToolError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      status === 401
        ? 'A autenticação com o Kommo falhou.'
        : status === 403
          ? 'A credencial não possui permissão para esta operação.'
          : status === 404
            ? 'O recurso solicitado não foi encontrado no Kommo.'
            : status === 429
              ? 'O limite de requisições do Kommo foi atingido. Tente novamente mais tarde.'
              : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
                ? 'A requisição ao Kommo excedeu o tempo limite.'
                : 'A API do Kommo não conseguiu concluir a operação.';
    return { content: [{ type: 'text' as const, text: message }], isError: true };
  }
  return {
    content: [{ type: 'text' as const, text: 'Erro interno ao executar a tool.' }],
    isError: true,
  };
}

export function createKommoMcpServer(kommoAPI: KommoAPI): McpServer {
  const server = new McpServer({
    name: 'kommo-mcp-server',
    version: '3.0.0',
    description: 'MCP Server for Kommo CRM integration',
  });

  for (const tool of MCP_TOOLS) {
    const isWrite = WRITE_TOOLS.has(tool.name);
    const schema = isWrite
      ? {
          ...tool.inputSchema,
          properties: {
            ...((tool.inputSchema.properties as Record<string, unknown> | undefined) ?? {}),
            confirm: {
              type: 'boolean',
              description: 'Confirma explicitamente a operação de escrita quando exigido.',
            },
          },
        }
      : tool.inputSchema;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: fromJsonSchema<Record<string, unknown>>(schema),
        annotations: {
          readOnlyHint: !isWrite,
          destructiveHint: isWrite,
          idempotentHint: !isWrite || tool.name === 'pin_note' || tool.name === 'unpin_note',
          openWorldHint: true,
        },
      },
      async (args) => {
        if (isWrite && process.env.MCP_CONFIRM_WRITES === 'true' && args.confirm !== true) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Esta operação exige confirm=true porque MCP_CONFIRM_WRITES está ativo.',
              },
            ],
            isError: true,
          };
        }
        const toolArgs = { ...args };
        delete toolArgs.confirm;
        try {
          return await executeTool(kommoAPI, tool.name, toolArgs);
        } catch (error) {
          return safeToolError(error);
        }
      },
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
        contents: await (async () => {
          try {
            return [
              {
                uri: uri.href,
                mimeType: resource.mimeType,
                text: await readResource(kommoAPI, uri.href),
              },
            ];
          } catch {
            throw new Error('Não foi possível carregar este resource do Kommo.');
          }
        })(),
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
