import { z } from 'zod';

// MCP Protocol Schemas
export const MCPVersionSchema = z.enum(['2.0', '2.1']);

export const ToolInputSchema = z.record(z.any());

export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.any()).optional(),
});

export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.record(z.any()).optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});

// Kommo API Schemas
export const LeadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'in_progress', 'won', 'lost']).optional(),
  value: z.number().optional(),
});

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'in_progress', 'won', 'lost']).optional(),
  value: z.number().positive().optional(),
});

export const ContactSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  domain: z.string().optional(),
});

// Tool Request Schemas
export const ListLeadsParamsSchema = z.object({
  status: z.enum(['new', 'in_progress', 'won', 'lost']).optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const CreateLeadParamsSchema = CreateLeadSchema;

export const GetContactsParamsSchema = z.object({
  lead_id: z.number().optional(),
  company_id: z.number().optional(),
  limit: z.number().int().positive().default(50),
});

export const GetAnalyticsParamsSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  metric: z.enum(['leads', 'revenue', 'conversion_rate']).optional(),
});

// Session Schema
export const MCPSessionSchema = z.object({
  sessionId: z.string().uuid(),
  createdAt: z.date(),
  lastActivity: z.date(),
  expiresAt: z.date(),
  clientInfo: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

export type MCPVersion = z.infer<typeof MCPVersionSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type MCPSession = z.infer<typeof MCPSessionSchema>;
