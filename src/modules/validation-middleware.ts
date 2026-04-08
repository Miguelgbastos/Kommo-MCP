/**
 * Request Validation Middleware
 * Applies Zod validation to incoming MCP requests and tool parameters
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { MCPErrorHandler } from './error-handler.js';

export class ValidationMiddleware {
  /**
   * Validate JSON-RPC request structure
   */
  static validateMCPRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { jsonrpc, method, id } = req.body;

      if (jsonrpc !== '2.0') {
        return res.status(400).json(
          MCPErrorHandler.formatResponse(
            MCPErrorHandler.invalidRequest('jsonrpc must be "2.0"'),
            id || null
          )
        );
      }

      if (!method || typeof method !== 'string') {
        return res.status(400).json(
          MCPErrorHandler.formatResponse(
            MCPErrorHandler.invalidRequest('method is required and must be string'),
            id || null
          )
        );
      }

      if (!id && id !== 0) {
        return res.status(400).json(
          MCPErrorHandler.formatResponse(
            MCPErrorHandler.invalidRequest('id is required'),
            id || null
          )
        );
      }

      next();
    } catch (error) {
      res.status(400).json(
        MCPErrorHandler.formatResponse(
          MCPErrorHandler.parseError('Invalid JSON'),
          null
        )
      );
    }
  }

  /**
   * Create validator middleware for specific schema
   */
  static validateSchema(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validated = schema.parse(req.body.params || {});
        (req as any).validatedParams = validated;
        next();
      } catch (error) {
        const id = req.body.id || null;

        if (error instanceof ZodError) {
          const details = error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          }));

          return res.status(400).json(
            MCPErrorHandler.formatResponse(
              MCPErrorHandler.invalidParams('Validation failed', {
                errors: details,
              }),
              id
            )
          );
        }

        return res.status(400).json(
          MCPErrorHandler.formatResponse(
            MCPErrorHandler.internalError('Validation error'),
            id
          )
        );
      }
    };
  }

  /**
   * Validate Session-Id header
   */
  static validateSessionId(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.headers['mcp-session-id'] as string;
    const mcpProtocolVersion = req.headers['mcp-protocol-version'] as string;

    if (!sessionId) {
      return res.status(400).json({
        error: 'MCP-Session-Id header is required',
      });
    }

    if (mcpProtocolVersion && !['2.0', '2.1'].includes(mcpProtocolVersion)) {
      return res.status(400).json({
        error: 'Unsupported MCP-Protocol-Version',
        supported: ['2.0', '2.1'],
      });
    }

    (req as any).sessionId = sessionId;
    (req as any).mcpVersion = mcpProtocolVersion || '2.1';
    next();
  }
}

export const validateMCPRequest = ValidationMiddleware.validateMCPRequest;
export const validateSchema = ValidationMiddleware.validateSchema;
export const validateSessionId = ValidationMiddleware.validateSessionId;
