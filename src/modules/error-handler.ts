/**
 * Error Handler Module
 * Implements MCP-compliant error handling with proper status codes and formatting
 */

export interface MCPError {
  code: number;
  message: string;
  data?: Record<string, any>;
}

export class MCPErrorHandler {
  static readonly ERROR_CODES = {
    // JSON-RPC 2.0 errors
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,

    // Server errors
    SERVER_ERROR_START: -32099,
    SERVER_ERROR_END: -32000,

    // Custom errors
    AUTHENTICATION_ERROR: 1001,
    VALIDATION_ERROR: 1002,
    NOT_FOUND: 1003,
    RATE_LIMIT_ERROR: 1004,
    SERVICE_UNAVAILABLE: 1005,
    TIMEOUT_ERROR: 1006,
  };

  static parseError(message: string): MCPError {
    return {
      code: this.ERROR_CODES.PARSE_ERROR,
      message,
    };
  }

  static invalidRequest(message: string): MCPError {
    return {
      code: this.ERROR_CODES.INVALID_REQUEST,
      message,
    };
  }

  static methodNotFound(method: string): MCPError {
    return {
      code: this.ERROR_CODES.METHOD_NOT_FOUND,
      message: `Method not found: ${method}`,
    };
  }

  static invalidParams(message: string, details?: Record<string, any>): MCPError {
    return {
      code: this.ERROR_CODES.INVALID_PARAMS,
      message,
      data: details,
    };
  }

  static internalError(message: string, details?: Record<string, any>): MCPError {
    return {
      code: this.ERROR_CODES.INTERNAL_ERROR,
      message,
      data: details,
    };
  }

  static authenticationError(message: string): MCPError {
    return {
      code: this.ERROR_CODES.AUTHENTICATION_ERROR,
      message,
    };
  }

  static validationError(message: string, details?: Record<string, any>): MCPError {
    return {
      code: this.ERROR_CODES.VALIDATION_ERROR,
      message,
      data: details,
    };
  }

  static notFound(resource: string): MCPError {
    return {
      code: this.ERROR_CODES.NOT_FOUND,
      message: `Resource not found: ${resource}`,
    };
  }

  static rateLimitError(retryAfter?: number): MCPError {
    return {
      code: this.ERROR_CODES.RATE_LIMIT_ERROR,
      message: 'Rate limit exceeded',
      data: retryAfter ? { retryAfter } : undefined,
    };
  }

  static serviceUnavailable(message?: string): MCPError {
    return {
      code: this.ERROR_CODES.SERVICE_UNAVAILABLE,
      message: message || 'Service unavailable',
    };
  }

  static timeoutError(message?: string): MCPError {
    return {
      code: this.ERROR_CODES.TIMEOUT_ERROR,
      message: message || 'Request timeout',
    };
  }

  /**
   * Format error for MCP response
   */
  static formatResponse(error: MCPError, id: string | number) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: error.code,
        message: error.message,
        ...(error.data && { data: error.data }),
      },
    };
  }

  /**
   * Format error result with isError flag (for tool results)
   */
  static formatToolError(message: string, details?: Record<string, any>) {
    return {
      isError: true,
      message,
      ...(details && { details }),
    };
  }

  /**
   * Convert standard errors to MCP errors
   */
  static fromStandardError(error: any): MCPError {
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return this.validationError(error.message);
      }
      if (error.message.includes('timeout')) {
        return this.timeoutError(error.message);
      }
      if (error.message.includes('not found')) {
        return this.notFound(error.message);
      }
    }

    return this.internalError(error?.message || 'An unexpected error occurred');
  }
}
