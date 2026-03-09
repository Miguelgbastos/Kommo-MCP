import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { KommoAPI } from './kommo-api.js';
import dotenv from 'dotenv';

// MCP: This server implements the Model Context Protocol manually (lifecycle, tools, resources, prompts).
// An optional migration path is to use @modelcontextprotocol/sdk: Server + SSEServerTransport from
// "server/sse" with Express (GET for SSE stream, POST for messages), and setRequestHandler for each
// method, delegating to the same KommoAPI and business logic used here.

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Environment configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

// Structured logging
const logger = {
  info: (message: string, data?: any) => {
    if (logLevel === 'info' || logLevel === 'debug') {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  debug: (message: string, data?: any) => {
    if (logLevel === 'debug') {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  }
};

// Initialize Kommo API
const kommoAPI = new KommoAPI({
  baseUrl: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
  accessToken: process.env.KOMMO_ACCESS_TOKEN || ''
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    kommo_base_url: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com'
  });
});

// Current year for filtering (2025 as per user preference)
const currentYear = new Date().getFullYear();

// Cache system for leads data
interface CacheEntry {
  data: any[];
  timestamp: number;
  expiresAt: number;
}

const leadsCache: CacheEntry = {
  data: [],
  timestamp: 0,
  expiresAt: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Performance metrics
interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastRequestTime: number;
}

// AI Intelligence interfaces
interface SemanticAnalysis {
  intent: string;
  entities: Entity[];
  context: string;
  confidence: number;
}

interface Entity {
  type: 'date' | 'category' | 'metric' | 'action' | 'comparison';
  value: string;
  confidence: number;
}

interface TrendAnalysis {
  period: string;
  metric: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  significance: 'high' | 'medium' | 'low';
}

interface SmartSuggestion {
  type: 'question' | 'insight' | 'action';
  content: string;
  relevance: number;
  basedOn: string;
}

interface ConversationMemory {
  sessionId: string;
  previousQuestions: string[];
  extractedContext: any;
  userPreferences: any;
}

// Advanced AI Intelligence Interfaces
interface SalesForecast {
  period: string;
  predictedSales: number;
  confidence: number;
  factors: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AnomalyDetection {
  type: 'spike' | 'drop' | 'pattern_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: string;
  confidence: number;
}

interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  insight: string;
  recommendation: string;
}

interface AutoInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  suggestedActions: string[];
}

interface UserPattern {
  commonQueries: string[];
  peakUsageTimes: string[];
  preferredCategories: string[];
  responseTimePreferences: number;
}

const performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  lastRequestTime: 0
};

function updatePerformanceMetrics(isCacheHit: boolean, responseTime: number): void {
  performanceMetrics.totalRequests++;
  if (isCacheHit) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
  }
  
  // Update average response time
  const totalTime = performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) + responseTime;
  performanceMetrics.averageResponseTime = totalTime / performanceMetrics.totalRequests;
  performanceMetrics.lastRequestTime = Date.now();
  
  logger.info(`📊 Métricas: ${performanceMetrics.totalRequests} requests, ${performanceMetrics.cacheHits} cache hits, ${performanceMetrics.averageResponseTime.toFixed(2)}s média`);
}

// AI Intelligence Functions
function analyzeSemantics(question: string): SemanticAnalysis {
  const questionLower = question.toLowerCase();
  const entities: Entity[] = [];
  let intent = 'general_query';
  let context = 'sales_analysis';
  let confidence = 0.8;

  // Intent detection
  if (questionLower.includes('quantas') || questionLower.includes('quantos')) {
    intent = 'count_query';
    confidence = 0.9;
  } else if (questionLower.includes('qual') || questionLower.includes('quais')) {
    intent = 'detail_query';
    confidence = 0.9;
  } else if (questionLower.includes('mostre') || questionLower.includes('analise')) {
    intent = 'analysis_query';
    confidence = 0.9;
  } else if (questionLower.includes('compare') || questionLower.includes('versus')) {
    intent = 'comparison_query';
    confidence = 0.8;
  }

  // Entity extraction
  // Date entities
  if (questionLower.includes('hoje')) entities.push({ type: 'date', value: 'today', confidence: 0.95 });
  if (questionLower.includes('ontem')) entities.push({ type: 'date', value: 'yesterday', confidence: 0.95 });
  if (questionLower.includes('semana')) entities.push({ type: 'date', value: 'week', confidence: 0.9 });
  if (questionLower.includes('mês') || questionLower.includes('mes')) entities.push({ type: 'date', value: 'month', confidence: 0.9 });
  if (questionLower.includes('ano')) entities.push({ type: 'date', value: 'year', confidence: 0.9 });

  // Category entities
  if (questionLower.includes('tráfego') || questionLower.includes('trafego')) entities.push({ type: 'category', value: 'tráfego', confidence: 0.95 });
  if (questionLower.includes('design')) entities.push({ type: 'category', value: 'design', confidence: 0.95 });
  if (questionLower.includes('marketing')) entities.push({ type: 'category', value: 'marketing', confidence: 0.95 });
  if (questionLower.includes('suporte')) entities.push({ type: 'category', value: 'suporte', confidence: 0.95 });
  if (questionLower.includes('contato') || questionLower.includes('contatos')) entities.push({ type: 'category', value: 'contatos', confidence: 0.9 });

  // Metric entities
  if (questionLower.includes('vendas')) entities.push({ type: 'metric', value: 'sales', confidence: 0.9 });
  if (questionLower.includes('leads')) entities.push({ type: 'metric', value: 'leads', confidence: 0.9 });
  if (questionLower.includes('valor')) entities.push({ type: 'metric', value: 'value', confidence: 0.9 });
  if (questionLower.includes('ticket')) entities.push({ type: 'metric', value: 'ticket', confidence: 0.9 });

  // Action entities
  if (questionLower.includes('mostre')) entities.push({ type: 'action', value: 'show', confidence: 0.9 });
  if (questionLower.includes('analise')) entities.push({ type: 'action', value: 'analyze', confidence: 0.9 });
  if (questionLower.includes('compare')) entities.push({ type: 'action', value: 'compare', confidence: 0.9 });

  return { intent, entities, context, confidence };
}

function generateSmartSuggestions(analysis: SemanticAnalysis, leadsData: any[]): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  
  // Base suggestions on detected entities
  const hasDate = analysis.entities.some(e => e.type === 'date');
  const hasCategory = analysis.entities.some(e => e.type === 'category');
  const hasMetric = analysis.entities.some(e => e.type === 'metric');

  if (hasDate && !hasCategory) {
    suggestions.push({
      type: 'question',
      content: 'Quer analisar por categoria específica? (tráfego, design, marketing, suporte)',
      relevance: 0.8,
      basedOn: 'temporal_analysis'
    });
  }

  if (hasCategory && !hasDate) {
    suggestions.push({
      type: 'question',
      content: 'Quer ver dados de um período específico? (hoje, ontem, esta semana, mês passado)',
      relevance: 0.8,
      basedOn: 'category_analysis'
    });
  }

  if (analysis.intent === 'count_query') {
    suggestions.push({
      type: 'insight',
      content: 'Considere analisar também o valor total e ticket médio',
      relevance: 0.7,
      basedOn: 'count_intent'
    });
  }

  if (analysis.intent === 'analysis_query') {
    suggestions.push({
      type: 'action',
      content: 'Posso gerar insights comparativos com períodos anteriores',
      relevance: 0.8,
      basedOn: 'analysis_intent'
    });
  }

  return suggestions;
}

function analyzeTrends(leadsData: any[], period: string): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];
  
  // Simple trend analysis based on lead creation dates
  const now = new Date();
  const currentPeriod = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    return createdAt >= getDateRange(period).start && createdAt <= getDateRange(period).end;
  });

  const previousPeriod = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const prevStart = new Date(getDateRange(period).start);
    const prevEnd = new Date(getDateRange(period).end);
    prevStart.setDate(prevStart.getDate() - (getDateRange(period).end.getTime() - getDateRange(period).start.getTime()) / (1000 * 60 * 60 * 24));
    prevEnd.setDate(prevEnd.getDate() - (getDateRange(period).end.getTime() - getDateRange(period).start.getTime()) / (1000 * 60 * 60 * 24));
    return createdAt >= prevStart && createdAt <= prevEnd;
  });

  if (previousPeriod.length > 0) {
    const change = ((currentPeriod.length - previousPeriod.length) / previousPeriod.length) * 100;
    trends.push({
      period: period,
      metric: 'leads_count',
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change),
      significance: Math.abs(change) > 20 ? 'high' : Math.abs(change) > 10 ? 'medium' : 'low'
    });
  }

  return trends;
}

// Advanced AI Intelligence Functions
function detectAnomalies(leadsData: any[], period: string): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  
  // Get current period data
  const currentPeriod = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const { start, end } = getDateRange(period);
    return createdAt >= start && createdAt <= end;
  });
  
  // Get historical average
  const historicalData = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const { start, end } = getDateRange(period);
    const historicalStart = new Date(start);
    const historicalEnd = new Date(end);
    historicalStart.setDate(historicalStart.getDate() - 30); // 30 days ago
    historicalEnd.setDate(historicalEnd.getDate() - 30);
    return createdAt >= historicalStart && createdAt <= historicalEnd;
  });
  
  if (historicalData.length > 0) {
    const currentCount = currentPeriod.length;
    const historicalAvg = historicalData.length;
    const deviation = Math.abs(currentCount - historicalAvg) / historicalAvg;
    
    if (deviation > 0.5) { // 50% deviation
      anomalies.push({
        type: currentCount > historicalAvg ? 'spike' : 'drop',
        severity: deviation > 1 ? 'high' : deviation > 0.7 ? 'medium' : 'low',
        description: `${currentCount > historicalAvg ? 'Pico' : 'Queda'} de ${Math.round(deviation * 100)}% em relação à média histórica`,
        suggestedAction: currentCount > historicalAvg ? 'Investigar causa do aumento' : 'Analisar possíveis problemas',
        confidence: Math.min(deviation, 1.0)
      });
    }
  }
  
  return anomalies;
}

function findCorrelations(leadsData: any[]): CorrelationAnalysis[] {
  const correlations: CorrelationAnalysis[] = [];
  
  // Simple correlation analysis between different metrics
  const salesByDay = new Map<string, number>();
  const leadsByDay = new Map<string, number>();
  
  leadsData.forEach(lead => {
    const date = new Date(lead.created_at * 1000).toDateString();
    leadsByDay.set(date, (leadsByDay.get(date) || 0) + 1);
    
    if (lead.status_id === 142) { // Assuming 142 is "Won" status
      salesByDay.set(date, (salesByDay.get(date) || 0) + 1);
    }
  });
  
  // Calculate correlation between leads and sales
  const leadValues = Array.from(leadsByDay.values());
  const salesValues = Array.from(salesByDay.values());
  
  if (leadValues.length > 5 && salesValues.length > 5) {
    const correlation = calculateCorrelation(leadValues, salesValues);
    
    if (Math.abs(correlation) > 0.5) {
      correlations.push({
        metric1: 'leads_count',
        metric2: 'sales_count',
        correlation: correlation,
        significance: Math.abs(correlation),
        insight: correlation > 0 ? 'Mais leads resultam em mais vendas' : 'Menos leads resultam em menos vendas',
        recommendation: correlation > 0 ? 'Foque em gerar mais leads' : 'Investigue qualidade dos leads'
      });
    }
  }
  
  return correlations;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  
  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function generateAutoInsights(leadsData: any[], analysis: SemanticAnalysis): AutoInsight[] {
  const insights: AutoInsight[] = [];
  
  // Analyze conversion rate
  const totalLeads = leadsData.length;
  const wonLeads = leadsData.filter(lead => lead.status_id === 142).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  
  if (conversionRate < 5) {
    insights.push({
      type: 'warning',
      title: 'Taxa de Conversão Baixa',
      description: `Taxa de conversão de apenas ${conversionRate.toFixed(1)}%`,
      impact: 'high',
      actionRequired: true,
      suggestedActions: [
        'Revisar processo de qualificação de leads',
        'Analisar qualidade dos leads gerados',
        'Implementar follow-up mais agressivo'
      ]
    });
  }
  
  // Analyze lead velocity
  const recentLeads = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt >= weekAgo;
  });
  
  if (recentLeads.length > totalLeads * 0.3) {
    insights.push({
      type: 'opportunity',
      title: 'Alto Volume de Leads Recentes',
      description: `${recentLeads.length} leads criados na última semana`,
      impact: 'medium',
      actionRequired: false,
      suggestedActions: [
        'Acelerar processo de qualificação',
        'Aumentar capacidade de atendimento',
        'Implementar automação de follow-up'
      ]
    });
  }
  
  // Analyze category performance
  const categoryPerformance = new Map<string, number>();
  leadsData.forEach(lead => {
    const category = getCategoryFromQuestion(lead.name || '');
    if (category) {
      categoryPerformance.set(category, (categoryPerformance.get(category) || 0) + 1);
    }
  });
  
  const topCategory = Array.from(categoryPerformance.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topCategory && topCategory[1] > totalLeads * 0.4) {
    insights.push({
      type: 'trend',
      title: 'Categoria Dominante',
      description: `${topCategory[0]} representa ${((topCategory[1] / totalLeads) * 100).toFixed(1)}% dos leads`,
      impact: 'medium',
      actionRequired: false,
      suggestedActions: [
        `Investir mais em ${topCategory[0]}`,
        'Diversificar fontes de leads',
        'Analisar ROI por categoria'
      ]
    });
  }
  
  return insights;
}

function predictSales(leadsData: any[], period: string): SalesForecast {
  // Simple prediction based on historical trends
  const historicalData = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const { start, end } = getDateRange(period);
    const historicalStart = new Date(start);
    const historicalEnd = new Date(end);
    historicalStart.setDate(historicalStart.getDate() - 30);
    historicalEnd.setDate(historicalEnd.getDate() - 30);
    return createdAt >= historicalStart && createdAt <= historicalEnd;
  });
  
  const currentData = leadsData.filter(lead => {
    const createdAt = new Date(lead.created_at * 1000);
    const { start, end } = getDateRange(period);
    return createdAt >= start && createdAt <= end;
  });
  
  const historicalSales = historicalData.filter(lead => lead.status_id === 142).length;
  const currentSales = currentData.filter(lead => lead.status_id === 142).length;
  
  const growthRate = historicalSales > 0 ? (currentSales - historicalSales) / historicalSales : 0;
  const predictedSales = Math.round(currentSales * (1 + growthRate));
  
  return {
    period: period,
    predictedSales: predictedSales,
    confidence: Math.min(Math.abs(growthRate) + 0.5, 1.0),
    factors: ['tendência histórica', 'crescimento atual', 'sazonalidade'],
    trend: growthRate > 0.1 ? 'increasing' : growthRate < -0.1 ? 'decreasing' : 'stable'
  };
}

function isCacheValid(): boolean {
  return Date.now() < leadsCache.expiresAt && leadsCache.data.length > 0;
}

function setCacheData(data: any[]): void {
  leadsCache.data = data;
  leadsCache.timestamp = Date.now();
  leadsCache.expiresAt = Date.now() + CACHE_DURATION;
  logger.info(`💾 Cache atualizado com ${data.length} leads (expira em ${new Date(leadsCache.expiresAt).toLocaleTimeString()})`);
}

function getCacheData(): any[] {
  logger.info(`📦 Cache hit: ${leadsCache.data.length} leads (${Math.round((leadsCache.expiresAt - Date.now()) / 1000)}s restantes)`);
  return leadsCache.data;
}

// Helper function to get date range for temporal filtering
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_week':
      // Last week: 7 days ago to 14 days ago
      start.setDate(now.getDate() - 14);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 8);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_month':
      // Last month: previous calendar month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setFullYear(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setFullYear(currentYear, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(currentYear, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_year':
      // Last year: previous calendar year
      start.setFullYear(currentYear - 1, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(currentYear - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }
  
  return { start, end };
}

// Helper function to detect category from question
function getCategoryFromQuestion(question: string): string | null {
  const questionLower = question.toLowerCase();
  const categories: { [key: string]: string[] } = {
    'tráfego': ['trafego', 'tráfego', 'traffic', 'ads', 'anúncios', 'facebook', 'google', 'instagram'],
    'design': ['design', 'logo', 'identidade', 'visual', 'criativo'],
    'marketing': ['marketing', 'digital', 'social', 'redes sociais', 'conteúdo'],
    'suporte': ['suporte', 'atendimento', 'help', 'ajuda', 'técnico'],
    'contatos': ['contato', 'contatos', 'telefone', 'telefones', 'nome', 'nomes', 'cliente', 'clientes'],
    'status': ['status', 'estado', 'situação', 'situacao', 'andamento', 'fechado', 'perdido', 'ganho'],
    'valores': ['valor', 'valores', 'preço', 'preco', 'ticket', 'faturamento', 'receita'],
    'origem': ['origem', 'fonte', 'canal', 'utm', 'facebook', 'google', 'instagram'],
    'produtos': ['produto', 'produtos', 'item', 'items', 'serviço', 'servico', 't-shirt', 'camiseta']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

// Helper function to detect month from question
function getMonthFromQuestion(question: string): number | null {
  const questionLower = question.toLowerCase();
  const months: { [key: string]: number } = {
    'janeiro': 0, 'jan': 0,
    'fevereiro': 1, 'fev': 1,
    'março': 2, 'mar': 2,
    'abril': 3, 'abr': 3,
    'maio': 4, 'mai': 4,
    'junho': 5, 'jun': 5,
    'julho': 6, 'jul': 6,
    'agosto': 7, 'ago': 7,
    'setembro': 8, 'set': 8,
    'outubro': 9, 'out': 9,
    'novembro': 10, 'nov': 10,
    'dezembro': 11, 'dez': 11
  };
  
  for (const [monthName, monthNumber] of Object.entries(months)) {
    if (questionLower.includes(monthName)) {
      return monthNumber;
    }
  }
  
  return null;
}

// MCP protocol version supported by this server
const MCP_PROTOCOL_VERSION = '2025-06-18';

// In-memory session store: sessionId -> { initialized: boolean }
// Used to enforce lifecycle (optional: reject tools/list and tools/call until initialized).
const mcpSessions = new Map<string, { initialized: boolean }>();

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2024-11-05'];

function getOrCreateSession(sessionId: string | undefined): { initialized: boolean } {
  const id = sessionId || 'default';
  if (!mcpSessions.has(id)) {
    mcpSessions.set(id, { initialized: false });
  }
  return mcpSessions.get(id)!;
}

/** Send MCP JSON-RPC response as SSE or JSON depending on Accept header */
function sendMcpResponse(res: express.Response, payload: object, req: express.Request): void {
  const accept = (req.headers['accept'] || '').toLowerCase();
  if (accept.includes('application/json') && !accept.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  } else {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.end();
  }
}

// MCP endpoint
app.post('/mcp', async (req, res) => {
  logger.info('🚀 Requisição MCP Kommo', { 
    baseUrl: process.env.KOMMO_BASE_URL,
    environment: process.env.NODE_ENV 
  });

  // -------- Security: Origin validation (DNS rebinding mitigation) --------
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
  if (allowedOrigins && allowedOrigins.length > 0) {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Origin not allowed' }
      });
      return;
    }
  }

  // -------- Security: Authentication (optional, when MCP_AUTH_TOKEN is set) --------
  const authToken = process.env.MCP_AUTH_TOKEN;
  if (authToken) {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const apiKey = req.headers['x-api-key'];
    const provided = bearer || apiKey;
    if (provided !== authToken) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized: invalid or missing token' }
      });
      return;
    }
  }

  try {
    // Validate body is a single JSON object (MCP spec)
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid request: body must be a single JSON object' }
      });
      return;
    }

    const { method, params, id } = body;
    logger.debug('📨 Requisição MCP recebida', { method, params, id });

    // -------- MCP-Protocol-Version (required for all requests except initialize) --------
    if (method !== 'initialize') {
      const protocolVersion = req.headers['mcp-protocol-version'] as string | undefined;
      if (!protocolVersion || !SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion)) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Missing or unsupported MCP-Protocol-Version header',
            data: { supported: SUPPORTED_PROTOCOL_VERSIONS }
          }
        });
        return;
      }
    }

    // -------- JSON-RPC notification (no id): respond 202 Accepted, no body --------
    if (id === undefined && method !== undefined) {
      if (method === 'notifications/initialized') {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        const session = getOrCreateSession(sessionId);
        session.initialized = true;
      }
      res.status(202).end();
      return;
    }

    // -------- Lifecycle: initialize --------
    if (method === 'initialize') {
      const newSessionId = crypto.randomUUID();
      getOrCreateSession(newSessionId);
      const initResponse = {
        jsonrpc: '2.0' as const,
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false }  // Lista de tools estática; se mudar em runtime, usar true e enviar notifications/tools/list_changed
          },
          resources: {},
          prompts: {},
          serverInfo: {
            name: 'kommo-mcp-server',
            version: '1.0.0',
            description: 'MCP Server for Kommo CRM integration'
          }
        }
      };
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('MCP-Session-Id', newSessionId);
      res.write(`data: ${JSON.stringify(initResponse)}\n\n`);
      res.end();
      return;
    }

    // -------- Lifecycle: notifications/initialized (with id - request form) --------
    if (method === 'notifications/initialized') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      const session = getOrCreateSession(sessionId);
      session.initialized = true;
      res.status(202).end();
      return;
    }

    // Optional: reject tools/list and tools/call if not initialized (per-session when session id is used)
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const session = getOrCreateSession(sessionId);
    if ((method === 'tools/list' || method === 'tools/call') && !session.initialized) {
      // Allow for backward compatibility: many clients may not send initialize/initialized
      // So we do not reject; session.initialized will stay false until client sends notifications/initialized
    }

    // SSE headers for all other MCP responses
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_leads',
              title: 'Listar leads',
              description: 'Obter lista de leads do Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Número máximo de leads (padrão: 1000)' },
                  page: { type: 'number', description: 'Página para paginação (padrão: 1)' }
                },
                additionalProperties: false
              }
            },
            {
              name: 'create_lead',
              title: 'Criar lead',
              description: 'Criar um novo lead no Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome do lead' },
                  price: { type: 'number', description: 'Valor do lead' },
                  status_id: { type: 'number', description: 'ID do status' }
                },
                required: ['name'],
                additionalProperties: false
              }
            },
            {
              name: 'get_sales_report',
              title: 'Relatório de vendas',
              description: 'Obter relatório de vendas do Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Número máximo de leads (padrão: 1000)' },
                  page: { type: 'number', description: 'Página para paginação (padrão: 1)' },
                  dateFrom: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
                  dateTo: { type: 'string', description: 'Data final (YYYY-MM-DD)' }
                },
                additionalProperties: false
              }
            },
            {
              name: 'get_contacts',
              title: 'Listar contatos',
              description: 'Obter lista de contatos do Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Número máximo de contatos (padrão: 1000)' },
                  page: { type: 'number', description: 'Página para paginação (padrão: 1)' }
                },
                additionalProperties: false
              }
            },
            {
              name: 'get_companies',
              title: 'Listar empresas',
              description: 'Obter lista de empresas do Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Número máximo de empresas (padrão: 1000)' },
                  page: { type: 'number', description: 'Página para paginação (padrão: 1)' }
                },
                additionalProperties: false
              }
            },
            {
              name: 'get_tasks',
              title: 'Listar tarefas',
              description: 'Obter lista de tarefas do Kommo CRM',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Número máximo de tarefas (padrão: 1000)' },
                  page: { type: 'number', description: 'Página para paginação (padrão: 1)' }
                },
                additionalProperties: false
              }
            },
            {
              name: 'get_loss_reasons',
              title: 'Listar motivos de perda',
              description: 'Obter lista de motivos da perda de leads (API 2026)',
              inputSchema: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            },
            {
              name: 'pin_note',
              title: 'Fixar nota',
              description: 'Fixar uma nota no cartão da entidade (lead, contato ou empresa)',
              inputSchema: {
                type: 'object',
                properties: {
                  entity_type: { type: 'string', enum: ['leads', 'contacts', 'companies'], description: 'Tipo da entidade' },
                  note_id: { type: 'number', description: 'ID da nota' }
                },
                required: ['entity_type', 'note_id'],
                additionalProperties: false
              }
            },
            {
              name: 'unpin_note',
              title: 'Desafixar nota',
              description: 'Desafixar uma nota no cartão da entidade',
              inputSchema: {
                type: 'object',
                properties: {
                  entity_type: { type: 'string', enum: ['leads', 'contacts', 'companies'], description: 'Tipo da entidade' },
                  note_id: { type: 'number', description: 'ID da nota' }
                },
                required: ['entity_type', 'note_id'],
                additionalProperties: false
              }
            },
            {
              name: 'run_salesbot',
              title: 'Iniciar Salesbot',
              description: 'Iniciar um Salesbot (API v4). Requer entity_id e entity_type (ex.: lead).',
              inputSchema: {
                type: 'object',
                properties: {
                  entity_id: { type: 'number', description: 'ID da entidade (ex.: lead)' },
                  entity_type: { type: 'string', description: 'Tipo da entidade (ex.: leads)' }
                },
                required: ['entity_id', 'entity_type'],
                additionalProperties: true
              }
            },
            {
              name: 'stop_salesbot',
              title: 'Parar Salesbot',
              description: 'Parar um Salesbot pelo ID do bot',
              inputSchema: {
                type: 'object',
                properties: {
                  bot_id: { type: 'number', description: 'ID do bot Salesbot' }
                },
                required: ['bot_id'],
                additionalProperties: false
              }
            },
            {
              name: 'ask_kommo',
              title: 'Perguntar ao Kommo',
              description: 'Fazer perguntas inteligentes sobre dados do Kommo CRM usando IA conversacional',
              inputSchema: {
                type: 'object',
                properties: {
                  question: { type: 'string', description: 'Pergunta sobre dados do Kommo CRM' }
                },
                required: ['question'],
                additionalProperties: false
              }
            }
          ]
        }
      };

      sendMcpResponse(res, response, req);
      return;
    }

    else if (method === 'tools/call') {
      const { name, arguments: args } = params;

      logger.debug('🔧 Executando ferramenta', { name, args });

      let result: any;

      try {
        switch (name) {
          case 'get_leads':
            const leadsLimit = args?.limit || 1000;
            const leadsPage = args?.page || 1;
            const leadsData = await kommoAPI.getLeads({ limit: leadsLimit, page: leadsPage });

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(leadsData, null, 2)
                }
              ]
            };
            break;

          case 'create_lead':
            const leadData = await kommoAPI.createLead(args);

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(leadData, null, 2)
                }
              ]
            };
            break;

          case 'get_sales_report':
            const salesLimit = args?.limit || 1000;
            const salesPage = args?.page || 1;
            const dateFrom = args?.dateFrom || '2024-01-01';
            const dateTo = args?.dateTo || '2024-12-31';
            const salesData = await kommoAPI.getSalesReport(dateFrom, dateTo);

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(salesData, null, 2)
                }
              ]
            };
            break;

          case 'ask_kommo':
            const question = args?.question || '';
            const startTime = Date.now();
            logger.debug('🤖 Processando pergunta inteligente', { question });
            
            // Get leads data with cache optimization
            let leadsArray: any[];
            let isCacheHit = false;
            
            if (isCacheValid()) {
              leadsArray = getCacheData();
              isCacheHit = true;
            } else {
              logger.info('📊 Cache expirado, buscando leads com paginação...');
              leadsArray = await kommoAPI.getAllLeads();
              setCacheData(leadsArray);
              isCacheHit = false;
            }
            
            const questionLower = question.toLowerCase();
            let response = '';
            const insights: string[] = [];
            const suggestions: string[] = [];
            
            // AI Semantic Analysis
            const semanticAnalysis = analyzeSemantics(question);
            logger.info(`🧠 Análise semântica: Intent=${semanticAnalysis.intent}, Entities=${semanticAnalysis.entities.length}, Confidence=${semanticAnalysis.confidence}`);
            
            // Detect temporal context with improved relative period detection
            let temporalFilter = null;
            if (questionLower.includes('hoje')) temporalFilter = 'today';
            else if (questionLower.includes('ontem')) temporalFilter = 'yesterday';
            else if (questionLower.includes('semana passada') || questionLower.includes('semana anterior')) temporalFilter = 'last_week';
            else if (questionLower.includes('mês passado') || questionLower.includes('mes passado') || questionLower.includes('mês anterior') || questionLower.includes('mes anterior')) temporalFilter = 'last_month';
            else if (questionLower.includes('ano passado') || questionLower.includes('ano anterior')) temporalFilter = 'last_year';
            else if (questionLower.includes('esta semana') || questionLower.includes('esta semana')) temporalFilter = 'week';
            else if (questionLower.includes('este mês') || questionLower.includes('este mes')) temporalFilter = 'month';
            else if (questionLower.includes('este ano')) temporalFilter = 'year';
            else if (questionLower.includes('semana')) temporalFilter = 'week';
            else if (questionLower.includes('mês') || questionLower.includes('mes')) temporalFilter = 'month';
            else if (questionLower.includes('ano')) temporalFilter = 'year';
            
            // Detect category
            const category = getCategoryFromQuestion(question);
            
            // Detect month
            const month = getMonthFromQuestion(question);
            
            // Sales analysis
            if (questionLower.includes('venda') || questionLower.includes('vendas') || questionLower.includes('fechado') || questionLower.includes('ganho')) {
              let salesLeads = leadsArray.filter((lead: any) => {
                const status = lead.status?.toString().toLowerCase() || '';
                const isClosedStatus = status.includes('fechado') || status.includes('ganho') || status.includes('concluído') || status.includes('vendido');
                const hasValue = (lead.price || 0) > 0;
                return isClosedStatus || hasValue;
              });
              
              // Apply temporal filter
              if (temporalFilter) {
                const { start, end } = getDateRange(temporalFilter);
                salesLeads = salesLeads.filter((lead: any) => {
                  const updatedAt = new Date(lead.updated_at * 1000);
                  return updatedAt >= start && updatedAt <= end;
                });
              }
              
              // Apply month filter
              if (month !== null) {
                salesLeads = salesLeads.filter((lead: any) => {
                const updatedAt = new Date(lead.updated_at * 1000);
                  return updatedAt.getMonth() === month && updatedAt.getFullYear() === currentYear;
                });
              }
              
              // Apply category filter
              if (category) {
                salesLeads = salesLeads.filter((lead: any) => {
                  const leadName = (lead.name || '').toLowerCase();
                  const leadStatus = (lead.status?.toString() || '').toLowerCase();
                  return leadName.includes(category) || leadStatus.includes(category);
                });
              }
              
              const totalSales = salesLeads.length;
              const totalValue = salesLeads.reduce((sum: number, lead: any) => sum + (lead.price || 0), 0);
              const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;
              
              response = `💰 **Análise de Vendas**\n\n`;
              response += `📊 **Total de vendas:** ${totalSales}\n`;
              response += `💵 **Valor total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
              response += `📈 **Ticket médio:** R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
              
              if (temporalFilter) {
                const periodNames: { [key: string]: string } = {
                  'today': 'Hoje',
                  'yesterday': 'Ontem',
                  'week': 'Esta semana',
                  'last_week': 'Semana passada',
                  'month': 'Este mês',
                  'last_month': 'Mês passado',
                  'year': 'Este ano',
                  'last_year': 'Ano passado'
                };
                response += `\n⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
              }
              
              if (month !== null) {
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                response += `\n📅 **Mês:** ${monthNames[month]} de ${currentYear}\n`;
              }
              
              if (category) {
                response += `\n🏷️ **Categoria:** ${category}\n`;
              }
              
              if (totalSales > 0) {
                insights.push(`🎯 ${totalSales} vendas identificadas`);
                insights.push(`💎 Ticket médio de R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                
                // Top status analysis
                const statusCounts: { [key: string]: number } = {};
                salesLeads.forEach((lead: any) => {
                  const status = lead.status?.toString() || 'Sem status';
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                
                const topStatuses = Object.entries(statusCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3);
                
                if (topStatuses.length > 0) {
                  insights.push(`🏆 Top status: ${topStatuses.map(([status, count]) => `${status} (${count})`).join(', ')}`);
                }
                
                suggestions.push('Pergunte sobre detalhes de contatos das vendas');
                suggestions.push('Analise conversão de leads para vendas');
                suggestions.push('Compare com períodos anteriores');
              } else {
                insights.push('📭 Nenhuma venda encontrada no período');
                suggestions.push('Verifique outros períodos ou categorias');
                suggestions.push('Analise leads em andamento');
              }
            }
            
            // Contact analysis
            else if (category === 'contatos' || questionLower.includes('contato') || questionLower.includes('telefone') || questionLower.includes('nome') || questionLower.includes('cliente')) {
              let filteredLeads = leadsArray;
              
              // Apply temporal filter
              if (temporalFilter) {
                const { start, end } = getDateRange(temporalFilter);
                filteredLeads = filteredLeads.filter((lead: any) => {
                  const createdAt = new Date(lead.created_at * 1000);
                  return createdAt >= start && createdAt <= end;
                });
              }
              
              // Apply month filter
              if (month !== null) {
                filteredLeads = filteredLeads.filter((lead: any) => {
                  const createdAt = new Date(lead.created_at * 1000);
                  return createdAt.getMonth() === month && createdAt.getFullYear() === currentYear;
                });
              }
              
              // Get contacts for leads
              const contacts = await kommoAPI.getContacts();
              const contactsArray = contacts._embedded?.contacts || [];
              
              // Correlate leads with contacts
              const leadsWithContacts = filteredLeads.map((lead: any) => {
                const relatedContact = contactsArray.find((contact: any) => 
                  contact.name && lead.name && 
                  contact.name.toLowerCase().includes(lead.name.toLowerCase().split(' ')[0])
                );
                
                return {
                  ...lead,
                  contact: relatedContact || null
                };
              });
              
              const totalLeads = leadsWithContacts.length;
              const leadsWithContactInfo = leadsWithContacts.filter((lead: any) => lead.contact);
              const contactRate = totalLeads > 0 ? (leadsWithContactInfo.length / totalLeads * 100) : 0;
              
              response = `📞 **Análise de Contatos**\n\n`;
              response += `📊 **Total de leads:** ${totalLeads}\n`;
              response += `👥 **Leads com contatos:** ${leadsWithContactInfo.length}\n`;
              response += `📈 **Taxa de contatos:** ${contactRate.toFixed(1)}%\n\n`;
              
              if (temporalFilter) {
                const periodNames: { [key: string]: string } = {
                  'today': 'Hoje',
                  'yesterday': 'Ontem',
                  'week': 'Esta semana',
                  'last_week': 'Semana passada',
                  'month': 'Este mês',
                  'last_month': 'Mês passado',
                  'year': 'Este ano',
                  'last_year': 'Ano passado'
                };
                response += `⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
              }
              
              if (month !== null) {
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                response += `\n📅 **Mês:** ${monthNames[month]} de ${currentYear}\n`;
              }
              
              if (leadsWithContactInfo.length > 0) {
                response += `\n📋 **Exemplos de Contatos:**\n`;
                leadsWithContactInfo.slice(0, 5).forEach((lead: any, index: number) => {
                  const contact = lead.contact;
                  const phone = contact.phone?.[0]?.value || 'N/A';
                  response += `${index + 1}. **${contact.name}** - ${phone}\n`;
                });
              }
              
              insights.push(`📞 Taxa de contatos: ${contactRate.toFixed(1)}%`);
              insights.push(`👥 ${leadsWithContactInfo.length} leads com informações de contato`);
              
              suggestions.push('Pergunte sobre detalhes específicos de contatos');
              suggestions.push('Analise leads sem informações de contato');
            }
            
            // Lead analysis
            else if (questionLower.includes('lead') || questionLower.includes('leads')) {
              let filteredLeads = leadsArray;
              
              // Apply temporal filter
              if (temporalFilter) {
                const { start, end } = getDateRange(temporalFilter);
                filteredLeads = filteredLeads.filter((lead: any) => {
                  const createdAt = new Date(lead.created_at * 1000);
                  return createdAt >= start && createdAt <= end;
                });
              }
              
              // Apply month filter
              if (month !== null) {
                filteredLeads = filteredLeads.filter((lead: any) => {
                  const createdAt = new Date(lead.created_at * 1000);
                  return createdAt.getMonth() === month && createdAt.getFullYear() === currentYear;
                });
              }
              
              // Apply category filter
              if (category) {
                filteredLeads = filteredLeads.filter((lead: any) => {
                  const leadName = (lead.name || '').toLowerCase();
                  const leadStatus = (lead.status?.toString() || '').toLowerCase();
                  return leadName.includes(category) || leadStatus.includes(category);
                });
              }
              
              const totalLeads = filteredLeads.length;
              const totalValue = filteredLeads.reduce((sum: number, lead: any) => sum + (lead.price || 0), 0);
              const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;
              
              response = `📋 **Análise de Leads**\n\n`;
              response += `📊 **Total de leads:** ${totalLeads}\n`;
              response += `💵 **Valor total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
              response += `📈 **Valor médio:** R$ ${averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
              
              if (temporalFilter) {
                const periodNames: { [key: string]: string } = {
                  'today': 'Hoje',
                  'yesterday': 'Ontem',
                  'week': 'Esta semana',
                  'last_week': 'Semana passada',
                  'month': 'Este mês',
                  'last_month': 'Mês passado',
                  'year': 'Este ano',
                  'last_year': 'Ano passado'
                };
                response += `\n⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
              }
              
              if (month !== null) {
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                response += `\n📅 **Mês:** ${monthNames[month]} de ${currentYear}\n`;
              }
              
              if (category) {
                response += `\n🏷️ **Categoria:** ${category}\n`;
              }
              
              if (totalLeads > 0) {
                insights.push(`📈 ${totalLeads} leads identificados`);
                insights.push(`💰 Valor total de R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                
                // Status analysis
                const statusCounts: { [key: string]: number } = {};
                filteredLeads.forEach((lead: any) => {
                  const status = lead.status?.toString() || 'Sem status';
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                
                const topStatuses = Object.entries(statusCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3);
                
                if (topStatuses.length > 0) {
                  insights.push(`🏆 Top status: ${topStatuses.map(([status, count]) => `${status} (${count})`).join(', ')}`);
                }
                
                suggestions.push('Pergunte sobre vendas de hoje ou ontem');
                suggestions.push('Analise conversão de leads');
                suggestions.push('Compare períodos diferentes');
              }
            }
            
            // Help/commands
            else if (questionLower.includes('ajuda') || questionLower.includes('help') || questionLower.includes('comandos')) {
              response = `🤖 **Como posso ajudar você:**\n\n`;
              insights.push('📊 **Análises:** Pergunte sobre leads criados hoje, ontem, este mês');
              insights.push('💰 **Financeiro:** Solicite valores totais, médias, faturamento');
              insights.push('🔄 **Pipelines:** Analise funis de vendas e conversões');
              insights.push('📈 **Performance:** Relatórios e métricas de performance');
              insights.push('🎯 **Insights:** Identifique padrões e oportunidades');
              insights.push('💼 **Vendas:** Analise vendas, conversões e fechamentos');
              
              suggestions.push('"Quantos leads foram criados hoje?"');
              suggestions.push('"Quantas vendas tivemos hoje?"');
              suggestions.push('"Qual o valor total dos leads?"');
              suggestions.push('"Mostre análise de performance"');
            }
            
            // Default response
            else {
              const totalLeads = leadsArray.length;
              const totalValue = leadsArray.reduce((sum: number, lead: any) => sum + (lead.price || 0), 0);
              
              response = `🤔 Entendi sua mensagem: "${question}"\n\n`;
              response += `📊 **Resumo geral:**\n`;
              response += `• Total de leads: ${totalLeads}\n`;
              response += `• Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
              response += `💡 **Sugestões de perguntas:**\n`;
              response += `• "Quantos leads foram criados hoje?"\n`;
              response += `• "Quantas vendas tivemos hoje?"\n`;
              response += `• "Qual o valor total dos leads?"\n`;
              response += `• "Mostre análise de performance"`;
              
              insights.push(`📈 ${totalLeads} leads no total`);
              insights.push(`💰 Valor total de R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
              
              suggestions.push('Pergunte sobre vendas específicas');
              suggestions.push('Analise leads por período');
              suggestions.push('Verifique conversões');
            }
            
            // Add insights and suggestions to response
            if (insights.length > 0) {
              response += `\n\n🔍 **Insights:**\n`;
              insights.forEach(insight => response += `• ${insight}\n`);
            }
            
            // Add AI-powered smart suggestions
            const smartSuggestions = generateSmartSuggestions(semanticAnalysis, leadsArray);
            if (smartSuggestions.length > 0) {
              response += `\n\n🤖 **Sugestões Inteligentes:**\n`;
              smartSuggestions.forEach(suggestion => {
                const icon = suggestion.type === 'question' ? '❓' : suggestion.type === 'insight' ? '💡' : '🎯';
                response += `${icon} ${suggestion.content}\n`;
              });
            }
            
            if (suggestions.length > 0) {
              response += `\n\n💡 **Sugestões:**\n`;
              suggestions.forEach(suggestion => response += `• ${suggestion}\n`);
            }
            
            // Add trend analysis if temporal filter is present
            if (temporalFilter) {
              const trends = analyzeTrends(leadsArray, temporalFilter);
              if (trends.length > 0) {
                response += `\n\n📈 **Análise de Tendências:**\n`;
                trends.forEach(trend => {
                  const trendIcon = trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️';
                  const significanceIcon = trend.significance === 'high' ? '🔴' : trend.significance === 'medium' ? '🟡' : '🟢';
                  response += `${trendIcon} ${trend.metric}: ${trend.trend} ${trend.percentage.toFixed(1)}% ${significanceIcon}\n`;
                });
              }
            }
            
            // Add advanced AI insights
            const autoInsights = generateAutoInsights(leadsArray, semanticAnalysis);
            if (autoInsights.length > 0) {
              response += `\n\n🧠 **Insights Automáticos:**\n`;
              autoInsights.forEach(insight => {
                const icon = insight.type === 'opportunity' ? '🎯' : insight.type === 'warning' ? '⚠️' : insight.type === 'trend' ? '📊' : '🔍';
                const impactIcon = insight.impact === 'high' ? '🔴' : insight.impact === 'medium' ? '🟡' : '🟢';
                response += `${icon} **${insight.title}** ${impactIcon}\n`;
                response += `   ${insight.description}\n`;
                if (insight.actionRequired) {
                  response += `   🎯 Ação necessária: ${insight.suggestedActions[0]}\n`;
                }
              });
            }
            
            // Add anomaly detection
            if (temporalFilter) {
              const anomalies = detectAnomalies(leadsArray, temporalFilter);
              if (anomalies.length > 0) {
                response += `\n\n🚨 **Detecção de Anomalias:**\n`;
                anomalies.forEach(anomaly => {
                  const severityIcon = anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : anomaly.severity === 'medium' ? '🟡' : '🟢';
                  response += `${severityIcon} **${anomaly.type.toUpperCase()}** - ${anomaly.description}\n`;
                  response += `   💡 ${anomaly.suggestedAction}\n`;
                });
              }
            }
            
            // Add correlation analysis
            const correlations = findCorrelations(leadsArray);
            if (correlations.length > 0) {
              response += `\n\n🔗 **Análise de Correlações:**\n`;
              correlations.forEach(correlation => {
                const correlationIcon = correlation.correlation > 0 ? '📈' : '📉';
                response += `${correlationIcon} ${correlation.metric1} ↔ ${correlation.metric2}: ${correlation.correlation.toFixed(2)}\n`;
                response += `   💡 ${correlation.insight}\n`;
                response += `   🎯 ${correlation.recommendation}\n`;
              });
            }
            
            // Add sales prediction
            if (temporalFilter && semanticAnalysis.intent === 'analysis_query') {
              const forecast = predictSales(leadsArray, temporalFilter);
              response += `\n\n🔮 **Previsão de Vendas:**\n`;
              response += `📊 Próximo período: ~${forecast.predictedSales} vendas\n`;
              response += `📈 Tendência: ${forecast.trend === 'increasing' ? 'Crescimento' : forecast.trend === 'decreasing' ? 'Queda' : 'Estável'}\n`;
              response += `🎯 Confiança: ${(forecast.confidence * 100).toFixed(0)}%\n`;
              response += `📋 Fatores: ${forecast.factors.join(', ')}\n`;
            }
            
            // Add performance info
            const cacheStatus = isCacheValid() ? '✅ Cache ativo' : '🔄 Dados atualizados';
            response += `\n\n⚡ **Performance:** ${cacheStatus}`;
            
            // Validate data consistency
            const expectedLeadsCount = 13928; // Expected total leads
            const actualLeadsCount = leadsArray.length;
            const isDataConsistent = Math.abs(actualLeadsCount - expectedLeadsCount) <= 1;
            
            if (!isDataConsistent) {
              logger.info(`⚠️ Inconsistência detectada: ${actualLeadsCount} leads vs ${expectedLeadsCount} esperados`);
            }
            
            // Update performance metrics
            const responseTime = (Date.now() - startTime) / 1000;
            updatePerformanceMetrics(isCacheHit, responseTime);
            
            const finalResponse = {
              response: response,
              metadata: {
                total_leads_analyzed: actualLeadsCount,
                temporal_filter: temporalFilter,
                category_filter: category,
                month_filter: month,
                current_year: currentYear,
                data_consistency: isDataConsistent,
                cache_hit: isCacheHit,
                response_time_seconds: responseTime,
                ai_analysis: {
                  intent: semanticAnalysis.intent,
                  entities: semanticAnalysis.entities,
                  confidence: semanticAnalysis.confidence,
                  smart_suggestions_count: smartSuggestions.length,
                  trend_analysis: temporalFilter ? analyzeTrends(leadsArray, temporalFilter) : null,
                  auto_insights: autoInsights,
                  anomalies_detected: temporalFilter ? detectAnomalies(leadsArray, temporalFilter) : [],
                  correlations_found: correlations,
                  sales_forecast: temporalFilter && semanticAnalysis.intent === 'analysis_query' ? predictSales(leadsArray, temporalFilter) : null
                },
                performance_metrics: {
                  total_requests: performanceMetrics.totalRequests,
                  cache_hit_rate: performanceMetrics.totalRequests > 0 ? (performanceMetrics.cacheHits / performanceMetrics.totalRequests * 100).toFixed(1) + '%' : '0%',
                  average_response_time: performanceMetrics.averageResponseTime.toFixed(2) + 's'
                },
                timestamp: new Date().toISOString()
              }
            };

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    agent_response: finalResponse,
                    user_message: question,
                    metadata: {
                      total_leads_analyzed: leadsArray.length,
                      response_type: 'conversational_ai',
                      timestamp: new Date().toISOString()
                    }
                  }, null, 2)
                }
              ]
            };
            break;

          case 'get_contacts':
            const contactsLimit = args?.limit || 1000;
            const contactsPage = args?.page || 1;
            const contactsData = await kommoAPI.getContacts({ limit: contactsLimit, page: contactsPage });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(contactsData, null, 2)
                }
              ]
            };
            break;

          case 'get_companies':
            const companiesLimit = args?.limit || 1000;
            const companiesPage = args?.page || 1;
            const companiesData = await kommoAPI.getCompanies({ limit: companiesLimit, page: companiesPage });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(companiesData, null, 2)
                }
              ]
            };
            break;

          case 'get_tasks':
            const tasksLimit = args?.limit || 1000;
            const tasksPage = args?.page || 1;
            const tasksData = await kommoAPI.getTasks({ limit: tasksLimit, page: tasksPage });

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasksData, null, 2)
                }
              ]
            };
            break;

          case 'get_loss_reasons':
            const lossReasonsData = await kommoAPI.getLossReasons();
            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(lossReasonsData, null, 2)
                }
              ]
            };
            break;

          case 'pin_note': {
            const pinEntityType = args?.entity_type as 'leads' | 'contacts' | 'companies';
            const pinNoteId = args?.note_id as number;
            if (!pinEntityType || !['leads', 'contacts', 'companies'].includes(pinEntityType) || typeof pinNoteId !== 'number') {
              result = {
                content: [{ type: 'text' as const, text: 'Requer entity_type (leads|contacts|companies) e note_id (número).' }],
                isError: true
              };
            } else {
              const pinResult = await kommoAPI.pinNote(pinEntityType, pinNoteId);
              result = { content: [{ type: 'text' as const, text: JSON.stringify(pinResult, null, 2) }] };
            }
            break;
          }

          case 'unpin_note': {
            const unpinEntityType = args?.entity_type as 'leads' | 'contacts' | 'companies';
            const unpinNoteId = args?.note_id as number;
            if (!unpinEntityType || !['leads', 'contacts', 'companies'].includes(unpinEntityType) || typeof unpinNoteId !== 'number') {
              result = {
                content: [{ type: 'text' as const, text: 'Requer entity_type (leads|contacts|companies) e note_id (número).' }],
                isError: true
              };
            } else {
              const unpinResult = await kommoAPI.unpinNote(unpinEntityType, unpinNoteId);
              result = { content: [{ type: 'text' as const, text: JSON.stringify(unpinResult, null, 2) }] };
            }
            break;
          }

          case 'run_salesbot': {
            const runEntityId = args?.entity_id as number;
            const runEntityType = args?.entity_type as string;
            if (typeof runEntityId !== 'number' || !runEntityType) {
              result = {
                content: [{ type: 'text' as const, text: 'Requer entity_id (número) e entity_type (ex.: leads).' }],
                isError: true
              };
            } else {
              const runResult = await kommoAPI.runSalesbot({ entity_id: runEntityId, entity_type: runEntityType, ...args });
              result = { content: [{ type: 'text' as const, text: JSON.stringify(runResult, null, 2) }] };
            }
            break;
          }

          case 'stop_salesbot': {
            const stopBotId = args?.bot_id as number;
            if (typeof stopBotId !== 'number') {
              result = {
                content: [{ type: 'text' as const, text: 'Requer bot_id (número).' }],
                isError: true
              };
            } else {
              const stopResult = await kommoAPI.stopSalesbot(stopBotId);
              result = { content: [{ type: 'text' as const, text: JSON.stringify(stopResult, null, 2) }] };
            }
            break;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        const response = {
          jsonrpc: '2.0',
          id,
          result
        };

        sendMcpResponse(res, response, req);

      } catch (error) {
        logger.error(`❌ Erro ao executar ferramenta ${name}`, error);
        const message = error instanceof Error ? error.message : 'Internal error';
        // Tool execution errors (API failure, validation): return result with isError: true
        // Protocol errors (unknown tool, etc.): return JSON-RPC error
        if (message.startsWith('Unknown tool:')) {
          const errorResponse = {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message
            }
          };
          sendMcpResponse(res, errorResponse, req);
        } else {
          const toolErrorResult = {
            jsonrpc: '2.0' as const,
            id,
            result: {
              content: [{ type: 'text' as const, text: message }],
              isError: true
            }
          };
          sendMcpResponse(res, toolErrorResult, req);
        }
      }
    }

    else if (method === 'resources/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            { uri: 'kommo://reports/sales', name: 'Relatório de vendas', description: 'Resumo de vendas do Kommo CRM', mimeType: 'application/json' },
            { uri: 'kommo://pipelines', name: 'Pipelines', description: 'Lista de pipelines de vendas', mimeType: 'application/json' },
            { uri: 'kommo://loss_reasons', name: 'Motivos da perda de leads', description: 'Lista de motivos da perda de leads (API 2026)', mimeType: 'application/json' }
          ]
        }
      };
      sendMcpResponse(res, response, req);
    }

    else if (method === 'resources/read') {
      const uri = params?.uri as string | undefined;
      if (!uri || (uri !== 'kommo://reports/sales' && uri !== 'kommo://pipelines' && uri !== 'kommo://loss_reasons')) {
        sendMcpResponse(res, {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Unknown resource URI', data: { uri } }
        }, req);
        return;
      }
      try {
        let text: string;
        if (uri === 'kommo://reports/sales') {
          const dateTo = new Date();
          const dateFrom = new Date(dateTo);
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          const salesData = await kommoAPI.getSalesReport(dateFrom.toISOString().slice(0, 10), dateTo.toISOString().slice(0, 10));
          text = JSON.stringify(salesData, null, 2);
        } else if (uri === 'kommo://loss_reasons') {
          const lossReasonsData = await kommoAPI.getLossReasons();
          text = JSON.stringify(lossReasonsData, null, 2);
        } else {
          const pipelinesData = await kommoAPI.getPipelines();
          text = JSON.stringify(pipelinesData, null, 2);
        }
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{ type: 'text' as const, text }]
          }
        };
        sendMcpResponse(res, response, req);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read resource';
        sendMcpResponse(res, {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text' as const, text: msg }], isError: true }
        }, req);
      }
    }

    else if (method === 'prompts/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [
            { name: 'analisar_vendas_mes', description: 'Analisar vendas do mês', arguments: [] },
            { name: 'resumo_leads_status', description: 'Resumo de leads por status', arguments: [] }
          ]
        }
      };
      sendMcpResponse(res, response, req);
    }

    else if (method === 'prompts/get') {
      const promptName = params?.name as string | undefined;
      if (!promptName || (promptName !== 'analisar_vendas_mes' && promptName !== 'resumo_leads_status')) {
        sendMcpResponse(res, {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Unknown prompt name', data: { name: promptName } }
        }, req);
        return;
      }
      const messages = promptName === 'analisar_vendas_mes'
        ? [{ role: 'user' as const, content: { type: 'text' as const, text: 'Quantas vendas tivemos este mês? Mostre valor total e ticket médio.' } }]
        : [{ role: 'user' as const, content: { type: 'text' as const, text: 'Mostre um resumo de leads por status.' } }];
      const response = {
        jsonrpc: '2.0',
        id,
        result: { messages }
      };
      sendMcpResponse(res, response, req);
    }

    else {
      const errorResponse = {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };

      sendMcpResponse(res, errorResponse, req);
    }

  } catch (error) {
    logger.error('❌ Erro no endpoint MCP', error);
    
    const errorResponse = {
      jsonrpc: '2.0',
      id: req.body?.id || 1,
      error: {
        code: -32603,
        message: 'Internal error'
      }
    };

    if (typeof req.body === 'object' && !Array.isArray(req.body)) {
      sendMcpResponse(res, errorResponse, req);
    } else {
      res.status(500).json(errorResponse);
    }
  }
});

// CORS preflight
app.options('/mcp', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Start server (bind to MCP_HOST, default 127.0.0.1 for local security)
const HOST = process.env.MCP_HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Servidor MCP Kommo rodando em http://${HOST}:${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    kommo_base_url: process.env.KOMMO_BASE_URL || 'https://api-g.kommo.com',
    current_year: currentYear
  });
});
