import { KommoAPI, type KommoLead } from './kommo-api.js';
import type { McpToolResult } from './mcp/types.js';

const currentYear = new Date().getFullYear();

interface CacheEntry {
  data: KommoLead[];
  timestamp: number;
  expiresAt: number;
}

const leadsCache: CacheEntry = { data: [], timestamp: 0, expiresAt: 0 };
const CACHE_DURATION = 5 * 60 * 1000;

interface SemanticAnalysis {
  intent: string;
  entities: Array<{ type: string; value: string; confidence: number }>;
  context: string;
  confidence: number;
}

function isCacheValid(): boolean {
  return Date.now() < leadsCache.expiresAt && leadsCache.data.length > 0;
}

function setCacheData(data: KommoLead[]): void {
  leadsCache.data = data;
  leadsCache.timestamp = Date.now();
  leadsCache.expiresAt = Date.now() + CACHE_DURATION;
}

function getCacheData(): KommoLead[] {
  return leadsCache.data;
}

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
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setFullYear(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'year':
      start.setFullYear(currentYear, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(currentYear, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_year':
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

function getCategoryFromQuestion(question: string): string | null {
  const questionLower = question.toLowerCase();
  const categories: Record<string, string[]> = {
    tráfego: [
      'trafego',
      'tráfego',
      'traffic',
      'ads',
      'anúncios',
      'facebook',
      'google',
      'instagram',
    ],
    design: ['design', 'logo', 'identidade', 'visual', 'criativo'],
    marketing: ['marketing', 'digital', 'social', 'redes sociais', 'conteúdo'],
    suporte: ['suporte', 'atendimento', 'help', 'ajuda', 'técnico'],
    contatos: [
      'contato',
      'contatos',
      'telefone',
      'telefones',
      'nome',
      'nomes',
      'cliente',
      'clientes',
    ],
    status: [
      'status',
      'estado',
      'situação',
      'situacao',
      'andamento',
      'fechado',
      'perdido',
      'ganho',
    ],
    valores: ['valor', 'valores', 'preço', 'preco', 'ticket', 'faturamento', 'receita'],
    origem: ['origem', 'fonte', 'canal', 'utm', 'facebook', 'google', 'instagram'],
    produtos: ['produto', 'produtos', 'item', 'items', 'serviço', 'servico', 't-shirt', 'camiseta'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => questionLower.includes(keyword))) {
      return category;
    }
  }
  return null;
}

/** Match month names as whole words so "marketing"/"mais"/"setor" are not months. */
export function getMonthFromQuestion(question: string): number | null {
  const questionLower = question.toLowerCase();
  const months: Array<[string, number]> = [
    ['janeiro', 0],
    ['fevereiro', 1],
    ['março', 2],
    ['abril', 3],
    ['maio', 4],
    ['junho', 5],
    ['julho', 6],
    ['agosto', 7],
    ['setembro', 8],
    ['outubro', 9],
    ['novembro', 10],
    ['dezembro', 11],
    ['jan', 0],
    ['fev', 1],
    ['mar', 2],
    ['abr', 3],
    ['mai', 4],
    ['jun', 5],
    ['jul', 6],
    ['ago', 7],
    ['set', 8],
    ['out', 9],
    ['nov', 10],
    ['dez', 11],
  ];

  for (const [monthName, monthNumber] of months) {
    const pattern = new RegExp(`(^|[^\\p{L}])${monthName}([^\\p{L}]|$)`, 'u');
    if (pattern.test(questionLower)) return monthNumber;
  }
  return null;
}

function analyzeSemantics(question: string): SemanticAnalysis {
  const questionLower = question.toLowerCase();
  const entities: SemanticAnalysis['entities'] = [];
  let intent = 'general_query';
  let confidence = 0.8;

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

  if (questionLower.includes('hoje'))
    entities.push({ type: 'date', value: 'today', confidence: 0.95 });
  if (questionLower.includes('ontem'))
    entities.push({ type: 'date', value: 'yesterday', confidence: 0.95 });
  if (questionLower.includes('semana'))
    entities.push({ type: 'date', value: 'week', confidence: 0.9 });
  if (questionLower.includes('mês') || questionLower.includes('mes'))
    entities.push({ type: 'date', value: 'month', confidence: 0.9 });
  if (questionLower.includes('ano'))
    entities.push({ type: 'date', value: 'year', confidence: 0.9 });
  if (questionLower.includes('vendas'))
    entities.push({ type: 'metric', value: 'sales', confidence: 0.9 });
  if (questionLower.includes('leads'))
    entities.push({ type: 'metric', value: 'leads', confidence: 0.9 });

  return { intent, entities, context: 'sales_analysis', confidence };
}

function detectTemporalFilter(questionLower: string): string | null {
  if (questionLower.includes('hoje')) return 'today';
  if (questionLower.includes('ontem')) return 'yesterday';
  if (questionLower.includes('semana passada') || questionLower.includes('semana anterior'))
    return 'last_week';
  if (questionLower.includes('mês passado') || questionLower.includes('mes passado'))
    return 'last_month';
  if (questionLower.includes('ano passado') || questionLower.includes('ano anterior'))
    return 'last_year';
  if (questionLower.includes('esta semana')) return 'week';
  if (questionLower.includes('este mês') || questionLower.includes('este mes')) return 'month';
  if (questionLower.includes('este ano')) return 'year';
  if (questionLower.includes('semana')) return 'week';
  if (questionLower.includes('mês') || questionLower.includes('mes')) return 'month';
  if (questionLower.includes('ano')) return 'year';
  return null;
}

const periodNames: Record<string, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Esta semana',
  last_week: 'Semana passada',
  month: 'Este mês',
  last_month: 'Mês passado',
  year: 'Este ano',
  last_year: 'Ano passado',
};

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function filterLeadsByPeriod(
  leads: KommoLead[],
  temporalFilter: string | null,
  month: number | null,
): KommoLead[] {
  let filtered = leads;
  if (temporalFilter) {
    const { start, end } = getDateRange(temporalFilter);
    filtered = filtered.filter((lead) => {
      const createdAt = new Date(lead.created_at * 1000);
      return createdAt >= start && createdAt <= end;
    });
  }
  if (month !== null) {
    filtered = filtered.filter((lead) => {
      const createdAt = new Date(lead.created_at * 1000);
      return createdAt.getMonth() === month && createdAt.getFullYear() === currentYear;
    });
  }
  return filtered;
}

function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type AskCitation =
  | {
      type: 'lead';
      id: number;
      name: string;
      price: number;
      status_id: number;
      pipeline_id: number;
      created_at: number;
    }
  | {
      type: 'contact';
      id: number;
      name: string;
      created_at: number;
    };

function buildLeadCitations(leads: KommoLead[], limit = 5): AskCitation[] {
  return leads.slice(0, limit).map((lead) => ({
    type: 'lead' as const,
    id: lead.id,
    name: lead.name,
    price: lead.price ?? 0,
    status_id: lead.status_id,
    pipeline_id: lead.pipeline_id,
    created_at: lead.created_at,
  }));
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function isSalesQuestion(questionLower: string): boolean {
  return (
    questionLower.includes('venda') ||
    questionLower.includes('vendas') ||
    questionLower.includes('fechado') ||
    questionLower.includes('ganho')
  );
}

function filterSalesLeads(
  leads: KommoLead[],
  temporalFilter: string | null,
  month: number | null,
  category: string | null,
): KommoLead[] {
  let salesLeads = leads.filter((lead) => lead.status_id === 142);

  if (temporalFilter) {
    const { start, end } = getDateRange(temporalFilter);
    salesLeads = salesLeads.filter((lead) => {
      if (lead.closed_at === undefined) return false;
      const closedAt = new Date(lead.closed_at * 1000);
      return closedAt >= start && closedAt <= end;
    });
  }

  if (month !== null) {
    salesLeads = salesLeads.filter((lead) => {
      if (lead.closed_at === undefined) return false;
      const closedAt = new Date(lead.closed_at * 1000);
      return closedAt.getMonth() === month && closedAt.getFullYear() === currentYear;
    });
  }

  if (category) {
    salesLeads = salesLeads.filter((lead) => (lead.name || '').toLowerCase().includes(category));
  }

  return salesLeads;
}

/**
 * Sales filter by closed_at, so they need the full cached lead list.
 * Lead/contact questions can use created_at server-side filters.
 */
async function loadLeadsForQuestion(
  kommoAPI: KommoAPI,
  temporalFilter: string | null,
  month: number | null,
  mode: 'sales' | 'created_at',
): Promise<{ leads: KommoLead[]; cacheHit: boolean; queryPlan: string[] }> {
  const queryPlan: string[] = [];

  if (mode === 'sales') {
    const cacheHit = isCacheValid();
    if (cacheHit) {
      queryPlan.push('cache de leads em memória (vendas filtram closed_at localmente)');
      return { leads: getCacheData(), cacheHit: true, queryPlan };
    }
    queryPlan.push('getAllLeads (vendas: um fetch + filtro local por closed_at/categoria)');
    const leads = await kommoAPI.getAllLeads();
    setCacheData(leads);
    return { leads, cacheHit: false, queryPlan };
  }

  if (month !== null) {
    const start = new Date(currentYear, month, 1);
    const end = new Date(currentYear, month + 1, 0);
    queryPlan.push(
      `listLeads created_from=${toYmd(start)} created_to=${toYmd(end)} (mês ${monthNames[month]})`,
    );
    const leads = await kommoAPI.getAllLeadsMatching({
      createdFrom: toYmd(start),
      createdTo: toYmd(end),
    });
    return { leads, cacheHit: false, queryPlan };
  }

  if (temporalFilter) {
    const { start, end } = getDateRange(temporalFilter);
    queryPlan.push(
      `listLeads created_from=${toYmd(start)} created_to=${toYmd(end)} (${temporalFilter})`,
    );
    const leads = await kommoAPI.getAllLeadsMatching({
      createdFrom: toYmd(start),
      createdTo: toYmd(end),
    });
    return { leads, cacheHit: false, queryPlan };
  }

  const cacheHit = isCacheValid();
  if (cacheHit) {
    queryPlan.push('cache de leads em memória');
    return { leads: getCacheData(), cacheHit: true, queryPlan };
  }

  queryPlan.push('getAllLeads (sem filtro temporal)');
  const leads = await kommoAPI.getAllLeads();
  setCacheData(leads);
  return { leads, cacheHit: false, queryPlan };
}

export async function handleAskKommo(kommoAPI: KommoAPI, question: string): Promise<McpToolResult> {
  const startTime = Date.now();
  const questionLower = question.toLowerCase();
  const semanticAnalysis = analyzeSemantics(question);
  const temporalFilter = detectTemporalFilter(questionLower);
  const category = getCategoryFromQuestion(question);
  const month = getMonthFromQuestion(question);
  const salesQuestion = isSalesQuestion(questionLower);

  const {
    leads: leadsArray,
    cacheHit: isCacheHit,
    queryPlan,
  } = await loadLeadsForQuestion(
    kommoAPI,
    temporalFilter,
    month,
    salesQuestion ? 'sales' : 'created_at',
  );

  let response = '';
  const insights: string[] = [];
  const suggestions: string[] = [];
  let citations: AskCitation[];
  let analyzedLeads: KommoLead[];

  if (salesQuestion) {
    const salesLeads = filterSalesLeads(leadsArray, temporalFilter, month, category);
    analyzedLeads = salesLeads;
    citations = buildLeadCitations(salesLeads);
    const totalSales = salesLeads.length;
    const totalValue = salesLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);
    const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;
    queryPlan.push('filtro local status_id=142 + closed_at/categoria');
    response = `**Análise de Vendas**\n\n`;
    response += `**Total de vendas:** ${totalSales}\n`;
    response += `**Valor total:** R$ ${formatMoney(totalValue)}\n`;
    response += `**Ticket médio:** R$ ${formatMoney(averageTicket)}\n`;
    if (temporalFilter)
      response += `\n**Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
    if (month !== null) response += `\n**Mês:** ${monthNames[month]} de ${currentYear}\n`;
    if (category) response += `\n**Categoria:** ${category}\n`;
    if (citations.length > 0) {
      response += `\n**Exemplos citados:**\n`;
      for (const citation of citations) {
        if (citation.type === 'lead') {
          response += `• lead #${citation.id} ${citation.name} — R$ ${formatMoney(citation.price)}\n`;
        }
      }
    }
  } else if (
    category === 'contatos' ||
    questionLower.includes('contato') ||
    questionLower.includes('cliente')
  ) {
    queryPlan.push('getContacts limit=250');
    const filteredLeads = filterLeadsByPeriod(leadsArray, temporalFilter, month);
    const contacts = await kommoAPI.getContacts({ limit: 250 });
    const contactsArray = contacts._embedded?.contacts || [];
    analyzedLeads = filteredLeads;
    citations = [
      ...buildLeadCitations(filteredLeads),
      ...contactsArray.slice(0, 5).map((contact): AskCitation => ({
        type: 'contact',
        id: contact.id,
        name: contact.name,
        created_at: contact.created_at,
      })),
    ];
    response = `**Análise de Contatos**\n\n`;
    response += `**Total de leads no recorte:** ${filteredLeads.length}\n`;
    response += `**Contatos retornados:** ${contactsArray.length}\n`;
    if (temporalFilter)
      response += `**Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
  } else if (questionLower.includes('lead') || questionLower.includes('leads')) {
    let filteredLeads = leadsArray;
    if (category) {
      filteredLeads = filteredLeads.filter((lead) =>
        (lead.name || '').toLowerCase().includes(category),
      );
    }
    analyzedLeads = filteredLeads;
    citations = buildLeadCitations(filteredLeads);
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);
    response = `**Análise de Leads**\n\n`;
    response += `**Total de leads:** ${totalLeads}\n`;
    response += `**Valor total:** R$ ${formatMoney(totalValue)}\n`;
    if (temporalFilter)
      response += `\n**Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
    if (category) response += `\n**Categoria:** ${category}\n`;
    if (citations.length > 0) {
      response += `\n**Exemplos citados:**\n`;
      for (const citation of citations) {
        if (citation.type === 'lead') {
          response += `• lead #${citation.id} ${citation.name} — R$ ${formatMoney(citation.price)}\n`;
        }
      }
    }
  } else if (
    questionLower.includes('ajuda') ||
    questionLower.includes('help') ||
    questionLower.includes('comandos')
  ) {
    response = `**Como posso ajudar você:**\n\n`;
    insights.push('Pergunte sobre leads criados hoje, ontem ou este mês');
    insights.push('Solicite valores totais, médias e faturamento');
    insights.push('Analise funis de vendas e conversões');
    suggestions.push('"Quantos leads foram criados hoje?"');
    suggestions.push('"Quantas vendas tivemos este mês?"');
    citations = [];
    analyzedLeads = [];
  } else {
    const totalLeads = leadsArray.length;
    const totalValue = leadsArray.reduce((sum, lead) => sum + (lead.price || 0), 0);
    analyzedLeads = leadsArray;
    citations = buildLeadCitations(leadsArray);
    response = `Entendi sua mensagem: "${question}"\n\n`;
    response += `**Resumo geral:**\n`;
    response += `• Total de leads: ${totalLeads}\n`;
    response += `• Valor total: R$ ${formatMoney(totalValue)}\n\n`;
    response += `**Sugestões:**\n`;
    response += `• "Quantos leads foram criados hoje?"\n`;
    response += `• "Quantas vendas tivemos este mês?"\n`;
    suggestions.push('Pergunte sobre vendas específicas');
    suggestions.push('Analise leads por período');
  }

  if (insights.length > 0) {
    response += `\n\n**Insights:**\n`;
    insights.forEach((insight) => {
      response += `• ${insight}\n`;
    });
  }
  if (suggestions.length > 0) {
    response += `\n\n**Sugestões:**\n`;
    suggestions.forEach((suggestion) => {
      response += `• ${suggestion}\n`;
    });
  }

  const cacheStatus = isCacheHit ? 'Cache ativo' : 'Dados atualizados';
  const responseTime = (Date.now() - startTime) / 1000;
  response += `\n\n**Performance:** ${cacheStatus} (${responseTime.toFixed(2)}s)`;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            agent_response: {
              response,
              citations,
              query_plan: queryPlan,
              metadata: {
                total_leads_analyzed: analyzedLeads.length,
                temporal_filter: temporalFilter,
                category_filter: category,
                month_filter: month,
                cache_hit: isCacheHit,
                response_time_seconds: responseTime,
                ai_analysis: semanticAnalysis,
                timestamp: new Date().toISOString(),
              },
            },
            user_message: question,
          },
          null,
          2,
        ),
      },
    ],
  };
}
