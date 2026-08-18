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

function getMonthFromQuestion(question: string): number | null {
  const questionLower = question.toLowerCase();
  const months: Record<string, number> = {
    janeiro: 0,
    jan: 0,
    fevereiro: 1,
    fev: 1,
    março: 2,
    mar: 2,
    abril: 3,
    abr: 3,
    maio: 4,
    mai: 4,
    junho: 5,
    jun: 5,
    julho: 6,
    jul: 6,
    agosto: 7,
    ago: 7,
    setembro: 8,
    set: 8,
    outubro: 9,
    out: 9,
    novembro: 10,
    nov: 10,
    dezembro: 11,
    dez: 11,
  };

  for (const [monthName, monthNumber] of Object.entries(months)) {
    if (questionLower.includes(monthName)) return monthNumber;
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

export async function handleAskKommo(kommoAPI: KommoAPI, question: string): Promise<McpToolResult> {
  const startTime = Date.now();
  const questionLower = question.toLowerCase();

  let leadsArray: KommoLead[];
  const isCacheHit = isCacheValid();
  if (isCacheHit) {
    leadsArray = getCacheData();
  } else {
    leadsArray = await kommoAPI.getAllLeads();
    setCacheData(leadsArray);
  }

  const semanticAnalysis = analyzeSemantics(question);
  const temporalFilter = detectTemporalFilter(questionLower);
  const category = getCategoryFromQuestion(question);
  const month = getMonthFromQuestion(question);

  let response = '';
  const insights: string[] = [];
  const suggestions: string[] = [];

  if (
    questionLower.includes('venda') ||
    questionLower.includes('vendas') ||
    questionLower.includes('fechado') ||
    questionLower.includes('ganho')
  ) {
    let salesLeads = leadsArray.filter((lead) => {
      const status = lead.status?.toString().toLowerCase() || '';
      const isClosedStatus =
        status.includes('fechado') || status.includes('ganho') || status.includes('concluído');
      return isClosedStatus || (lead.price || 0) > 0;
    });

    if (temporalFilter) {
      const { start, end } = getDateRange(temporalFilter);
      salesLeads = salesLeads.filter((lead) => {
        const updatedAt = new Date(lead.updated_at * 1000);
        return updatedAt >= start && updatedAt <= end;
      });
    }

    if (category) {
      salesLeads = salesLeads.filter((lead) => (lead.name || '').toLowerCase().includes(category));
    }

    const totalSales = salesLeads.length;
    const totalValue = salesLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);
    const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;

    response = `💰 **Análise de Vendas**\n\n`;
    response += `📊 **Total de vendas:** ${totalSales}\n`;
    response += `💵 **Valor total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    response += `📈 **Ticket médio:** R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    if (temporalFilter)
      response += `\n⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
    if (month !== null) response += `\n📅 **Mês:** ${monthNames[month]} de ${currentYear}\n`;
    if (category) response += `\n🏷️ **Categoria:** ${category}\n`;
  } else if (
    category === 'contatos' ||
    questionLower.includes('contato') ||
    questionLower.includes('cliente')
  ) {
    const filteredLeads = filterLeadsByPeriod(leadsArray, temporalFilter, month);
    const contacts = await kommoAPI.getContacts({ limit: 250 });
    const contactsArray = contacts._embedded?.contacts || [];
    const leadsWithContactInfo = filteredLeads.filter((lead) =>
      contactsArray.some(
        (contact) =>
          contact.name &&
          lead.name &&
          contact.name.toLowerCase().includes(lead.name.toLowerCase().split(' ')[0]),
      ),
    );

    response = `📞 **Análise de Contatos**\n\n`;
    response += `📊 **Total de leads:** ${filteredLeads.length}\n`;
    response += `👥 **Leads com contatos:** ${leadsWithContactInfo.length}\n`;
    if (temporalFilter)
      response += `⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
  } else if (questionLower.includes('lead') || questionLower.includes('leads')) {
    let filteredLeads = filterLeadsByPeriod(leadsArray, temporalFilter, month);
    if (category) {
      filteredLeads = filteredLeads.filter((lead) =>
        (lead.name || '').toLowerCase().includes(category),
      );
    }

    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

    response = `📋 **Análise de Leads**\n\n`;
    response += `📊 **Total de leads:** ${totalLeads}\n`;
    response += `💵 **Valor total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    if (temporalFilter)
      response += `\n⏰ **Período:** ${periodNames[temporalFilter] || temporalFilter}\n`;
    if (category) response += `\n🏷️ **Categoria:** ${category}\n`;
  } else if (
    questionLower.includes('ajuda') ||
    questionLower.includes('help') ||
    questionLower.includes('comandos')
  ) {
    response = `🤖 **Como posso ajudar você:**\n\n`;
    insights.push('📊 Pergunte sobre leads criados hoje, ontem ou este mês');
    insights.push('💰 Solicite valores totais, médias e faturamento');
    insights.push('🔄 Analise funis de vendas e conversões');
    suggestions.push('"Quantos leads foram criados hoje?"');
    suggestions.push('"Quantas vendas tivemos este mês?"');
  } else {
    const totalLeads = leadsArray.length;
    const totalValue = leadsArray.reduce((sum, lead) => sum + (lead.price || 0), 0);
    response = `🤔 Entendi sua mensagem: "${question}"\n\n`;
    response += `📊 **Resumo geral:**\n`;
    response += `• Total de leads: ${totalLeads}\n`;
    response += `• Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    response += `💡 **Sugestões:**\n`;
    response += `• "Quantos leads foram criados hoje?"\n`;
    response += `• "Quantas vendas tivemos este mês?"\n`;
    suggestions.push('Pergunte sobre vendas específicas');
    suggestions.push('Analise leads por período');
  }

  if (insights.length > 0) {
    response += `\n\n🔍 **Insights:**\n`;
    insights.forEach((insight) => {
      response += `• ${insight}\n`;
    });
  }
  if (suggestions.length > 0) {
    response += `\n\n💡 **Sugestões:**\n`;
    suggestions.forEach((suggestion) => {
      response += `• ${suggestion}\n`;
    });
  }

  const cacheStatus = isCacheHit ? '✅ Cache ativo' : '🔄 Dados atualizados';
  const responseTime = (Date.now() - startTime) / 1000;
  response += `\n\n⚡ **Performance:** ${cacheStatus} (${responseTime.toFixed(2)}s)`;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            agent_response: {
              response,
              metadata: {
                total_leads_analyzed: leadsArray.length,
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
