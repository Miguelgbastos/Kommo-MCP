/**
 * MCP Handler Module
 * Implements Model Context Protocol lifecycle, tools, and resources
 */

import { v4 as uuidv4 } from 'uuid';
import { MCPSessionSchema, MCPSession } from './validators.js';
import { MCPErrorHandler } from './error-handler.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface Capability {
  tools?: ToolDefinition[];
  resources?: ResourceDefinition[];
  prompts?: any[];
}

export class MCPHandler {
  private sessions: Map<string, MCPSession> = new Map();
  private sessionTimeout: number;
  private tools: ToolDefinition[] = [];
  private resources: ResourceDefinition[] = [];

  constructor(sessionTimeout: number = 30 * 60 * 1000) {
    // 30 minutes default
    this.sessionTimeout = sessionTimeout;
    this.startSessionCleanup();
  }

  /**
   * Initialize a new MCP session
   */
  initializeSession(clientInfo?: { name?: string; version?: string }): string {
    const sessionId = uuidv4();
    const now = new Date();

    const session: MCPSession = {
      sessionId,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.sessionTimeout),
      clientInfo,
    };

    // Validate session schema
    try {
      MCPSessionSchema.parse(session);
    } catch (error) {
      throw MCPErrorHandler.validationError('Invalid session data');
    }

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Register a tool
   */
  registerTool(tool: ToolDefinition): void {
    if (!tool.name || !tool.description) {
      throw new Error('Tool must have name and description');
    }

    const existingIndex = this.tools.findIndex((t) => t.name === tool.name);
    if (existingIndex >= 0) {
      this.tools[existingIndex] = tool;
    } else {
      this.tools.push(tool);
    }
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: ToolDefinition[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Get all tools
   */
  getTools(): ToolDefinition[] {
    return this.tools;
  }

  /**
   * Get tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.find((t) => t.name === name);
  }

  /**
   * Register a resource
   */
  registerResource(resource: ResourceDefinition): void {
    const existingIndex = this.resources.findIndex((r) => r.uri === resource.uri);
    if (existingIndex >= 0) {
      this.resources[existingIndex] = resource;
    } else {
      this.resources.push(resource);
    }
  }

  /**
   * Get all resources
   */
  getResources(): ResourceDefinition[] {
    return this.resources;
  }

  /**
   * Get capabilities
   */
  getCapabilities(): Capability {
    return {
      tools: this.tools,
      resources: this.resources,
    };
  }

  /**
   * Get server info
   */
  getServerInfo(): Record<string, any> {
    return {
      name: 'Kommo MCP Server',
      version: '2.1',
      protocol_version: '2.1',
      capabilities: this.getCapabilities(),
      implementation: {
        name: 'kommo-mcp-server',
        version: '0.1.0',
      },
    };
  }

  /**
   * Clean up expired sessions
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now > session.expiresAt) {
          this.sessions.delete(sessionId);
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * End session
   */
  endSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

// Singleton instance
export const mcpHandler = new MCPHandler();
