import Ajv, { type ValidateFunction } from 'ajv';
import { MCP_TOOLS } from './tool-definitions.js';

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = new Map<string, ValidateFunction>(
  MCP_TOOLS.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]),
);

type ValidationResult =
  | { ok: true; arguments: Record<string, unknown> }
  | { ok: false; unknownTool: boolean; message: string };

export function validateToolArguments(name: string, input: unknown): ValidationResult {
  const validator = validators.get(name);
  if (!validator) return { ok: false, unknownTool: true, message: `Unknown tool: ${name}` };
  const args = input === undefined ? {} : input;
  if (typeof args !== 'object' || args === null || Array.isArray(args) || !validator(args)) {
    const detail = validator.errors
      ?.map((error) => `${error.instancePath || '/'} ${error.message}`)
      .join('; ');
    return {
      ok: false,
      unknownTool: false,
      message: `Invalid tool arguments${detail ? `: ${detail}` : ''}`,
    };
  }
  return { ok: true, arguments: args as Record<string, unknown> };
}
