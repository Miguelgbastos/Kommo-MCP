// Export all modules
export { CacheManager, cacheManager } from './cache-manager';
export { MCPHandler, mcpHandler, type ToolDefinition, type ResourceDefinition, type Capability } from './mcp-handler';
export { AIIntelligence, aiIntelligence } from './ai-intelligence';
export { MCPErrorHandler, type MCPError } from './error-handler';
export {
  MCPVersionSchema,
  ToolInputSchema,
  MCPRequestSchema,
  MCPResponseSchema,
  LeadSchema,
  CreateLeadSchema,
  ContactSchema,
  CompanySchema,
  ListLeadsParamsSchema,
  CreateLeadParamsSchema,
  GetContactsParamsSchema,
  GetAnalyticsParamsSchema,
  MCPSessionSchema,
  type MCPVersion,
  type Lead,
  type CreateLeadInput,
  type Contact,
  type Company,
  type MCPSession,
} from './validators';
