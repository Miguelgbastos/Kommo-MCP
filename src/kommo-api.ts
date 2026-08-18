import axios, { AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface KommoConfig {
  baseUrl: string;
  accessToken: string;
  timeoutMs?: number;
  maxRetries?: number;
  timezone?: string;
}

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function assertTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch {
    throw new Error(`Fuso horário inválido: ${timezone}`);
  }
}

function parseCalendarDate(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Período inválido. Use datas no formato YYYY-MM-DD.');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new Error('Período inválido. Use datas reais no formato YYYY-MM-DD.');
  }
  return { year, month, day };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function zonedStartOfDay(date: CalendarDate, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const desired = Date.UTC(date.year, date.month - 1, date.day);
  let instant = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(instant)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const adjustment = desired - represented;
    instant += adjustment;
    if (adjustment === 0) break;
  }
  return Math.floor(instant / 1000);
}

function zonedCalendarDate(instant: Date, timezone: string): CalendarDate {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return { year: parts.year, month: parts.month, day: parts.day };
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

export function parseRetryAfter(value: unknown, now = Date.now()): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const timestamp = Date.parse(String(value));
  return Number.isNaN(timestamp) ? undefined : Math.max(0, timestamp - now);
}

export type KommoQueryParams = Record<string, string | number | boolean | undefined>;

export interface KommoCustomFieldValue {
  field_id?: number;
  field_name?: string;
  field_code?: string;
  values?: Array<Record<string, unknown>>;
}

export interface KommoAccount {
  id: number;
  name: string;
  subdomain: string;
  country?: string;
  currency?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface KommoUser {
  id: number;
  name: string;
  email?: string;
  language?: string;
  rights?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KommoLead {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
  responsible_user_id: number;
  created_by: number;
  closed_at?: number;
  loss_reason_id?: number;
  source_id?: number;
  status?: string | number;
  tags?: string[];
  contacts?: KommoContact[];
  companies?: KommoCompany[];
}

export interface KommoContact {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  responsible_user_id: number;
  created_by: number;
  created_at: number;
  updated_at: number;
  custom_fields_values?: KommoCustomFieldValue[];
  tags?: string[];
  leads?: KommoLead[];
  companies?: KommoCompany[];
}

export interface KommoCompany {
  id: number;
  name: string;
  responsible_user_id: number;
  created_by: number;
  created_at: number;
  updated_at: number;
  custom_fields_values?: KommoCustomFieldValue[];
  tags?: string[];
  leads?: KommoLead[];
  contacts?: KommoContact[];
}

export interface KommoPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_unsorted_on: boolean;
  is_archive: boolean;
  account_id: number;
  _links: {
    self: {
      href: string;
    };
  };
}

export interface KommoTask {
  id: number;
  text: string;
  entity_id: number;
  entity_type: string;
  responsible_user_id: number;
  created_by: number;
  created_at: number;
  updated_at: number;
  complete_till: number;
  is_completed?: boolean;
  result?: {
    text: string;
  };
}

// Novas interfaces para Status
export interface KommoStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  pipeline_id: number;
  type: number;
  account_id: number;
}

// Motivos da perda de leads (API 2026)
export interface KommoLossReason {
  id: number;
  name: string;
  sort: number;
  is_editable?: boolean;
}

export type KommoEntityType = 'leads' | 'contacts' | 'companies';

export interface KommoNote {
  id?: number;
  entity_id?: number;
  note_type?: string;
  params?: {
    text?: string;
    [key: string]: unknown;
  };
  created_at?: number;
  updated_at?: number;
  is_pinned?: boolean;
}

// Novas interfaces para Relatórios
export interface KommoSalesReport {
  period: {
    from: string;
    to: string;
  };
  leads: {
    total: number;
    new: number;
    won: number;
    lost: number;
  };
  revenue: {
    total: number;
    average: number;
    conversion_rate: number;
  };
  performance: {
    by_user: Array<{
      user_id: number;
      user_name: string;
      leads_count: number;
      revenue: number;
    }>;
    by_pipeline: Array<{
      pipeline_id: number;
      pipeline_name: string;
      leads_count: number;
      revenue: number;
    }>;
  };
}

export interface KommoDashboardData {
  leads: {
    total: number;
    new_today: number;
    won_today: number;
    lost_today: number;
  };
  tasks: {
    total: number;
    completed_today: number;
    overdue: number;
  };
  revenue: {
    this_month: number;
    last_month: number;
    growth_percentage: number;
  };
  top_pipelines: Array<{
    id: number;
    name: string;
    leads_count: number;
    revenue: number;
  }>;
}

export class KommoAPI {
  private client: AxiosInstance;
  private configuredTimezone?: string;

  constructor(config: KommoConfig) {
    if (config.timezone) assertTimezone(config.timezone);
    this.configuredTimezone = config.timezone;
    const maxRetries = config.maxRetries ?? 3;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs ?? 15_000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    this.client.interceptors.response.use(undefined, async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) throw error;
      const request = error.config as RetryableRequestConfig;
      const method = request.method?.toUpperCase() ?? 'GET';
      const status = error.response?.status;
      const retryableMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
      const retryableFailure =
        status === 429 || status === 502 || status === 503 || status === 504 || !error.response;
      request.retryCount = request.retryCount ?? 0;
      if (!retryableMethod || !retryableFailure || request.retryCount >= maxRetries) throw error;

      request.retryCount += 1;
      const retryAfter = error.response?.headers['retry-after'];
      const retryAfterMs = parseRetryAfter(retryAfter);
      const backoffMs = Math.min(250 * 2 ** (request.retryCount - 1), 4_000);
      const jitterMs = Math.floor(Math.random() * 100);
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs ?? backoffMs + jitterMs));
      return this.client.request(request);
    });
  }

  // Account methods
  async getAccount(): Promise<KommoAccount> {
    const response = await this.client.get('/api/v4/account');
    return response.data;
  }

  private getBusinessTimezone(account: KommoAccount): string {
    const timezone = this.configuredTimezone ?? account.timezone ?? 'UTC';
    assertTimezone(timezone);
    return timezone;
  }

  // Leads methods
  async getLeads(params?: KommoQueryParams): Promise<{ _embedded: { leads: KommoLead[] } }> {
    const response = await this.client.get('/api/v4/leads', { params });
    return response.data;
  }

  async getAllLeads(params?: KommoQueryParams): Promise<KommoLead[]> {
    const allLeads: KommoLead[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 250; // API limit per page

    while (hasMore) {
      const response = await this.client.get('/api/v4/leads', {
        params: { ...params, limit, page },
      });
      const data = response.data;
      allLeads.push(...(data._embedded?.leads ?? []));
      hasMore = Boolean(data._links?.next);
      page += 1;
    }

    return allLeads;
  }

  async getAllTasks(params?: KommoQueryParams): Promise<KommoTask[]> {
    const allTasks: KommoTask[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await this.client.get('/api/v4/tasks', {
        params: { ...params, limit: 250, page },
      });
      const data = response.data;
      allTasks.push(...(data._embedded?.tasks ?? []));
      hasMore = Boolean(data._links?.next);
      page += 1;
    }
    return allTasks;
  }

  async getLead(id: number): Promise<KommoLead> {
    const response = await this.client.get(`/api/v4/leads/${id}`);
    return response.data;
  }

  async createLead(lead: Partial<KommoLead>): Promise<KommoLead> {
    const response = await this.client.post('/api/v4/leads', [lead]);
    return response.data._embedded.leads[0];
  }

  async updateLead(id: number, lead: Partial<KommoLead>): Promise<KommoLead> {
    const response = await this.client.patch(`/api/v4/leads/${id}`, lead);
    return response.data;
  }

  // Motivos da perda de leads (API 2026)
  async getLossReasons(): Promise<{ _embedded: { loss_reasons: KommoLossReason[] } }> {
    const response = await this.client.get('/api/v4/leads/loss_reasons');
    return response.data;
  }

  async getLossReason(id: number): Promise<KommoLossReason> {
    const response = await this.client.get(`/api/v4/leads/loss_reasons/${id}`);
    return response.data;
  }

  // Contacts methods
  async getContacts(
    params?: KommoQueryParams,
  ): Promise<{ _embedded: { contacts: KommoContact[] } }> {
    const response = await this.client.get('/api/v4/contacts', { params });
    return response.data;
  }

  async getContact(id: number): Promise<KommoContact> {
    const response = await this.client.get(`/api/v4/contacts/${id}`);
    return response.data;
  }

  async createContact(contact: Partial<KommoContact>): Promise<KommoContact> {
    const response = await this.client.post('/api/v4/contacts', [contact]);
    return response.data._embedded.contacts[0];
  }

  async updateContact(id: number, contact: Partial<KommoContact>): Promise<KommoContact> {
    const response = await this.client.patch(`/api/v4/contacts/${id}`, contact);
    return response.data;
  }

  // Companies methods
  async getCompanies(
    params?: KommoQueryParams,
  ): Promise<{ _embedded: { companies: KommoCompany[] } }> {
    const response = await this.client.get('/api/v4/companies', { params });
    return response.data;
  }

  async getCompany(id: number): Promise<KommoCompany> {
    const response = await this.client.get(`/api/v4/companies/${id}`);
    return response.data;
  }

  async createCompany(company: Partial<KommoCompany>): Promise<KommoCompany> {
    const response = await this.client.post('/api/v4/companies', [company]);
    return response.data._embedded.companies[0];
  }

  async updateCompany(id: number, company: Partial<KommoCompany>): Promise<KommoCompany> {
    const response = await this.client.patch(`/api/v4/companies/${id}`, company);
    return response.data;
  }

  // Pipelines methods
  async getPipelines(): Promise<{ _embedded: { pipelines: KommoPipeline[] } }> {
    const response = await this.client.get('/api/v4/leads/pipelines');
    return response.data;
  }

  async getPipeline(id: number): Promise<KommoPipeline> {
    const response = await this.client.get(`/api/v4/leads/pipelines/${id}`);
    return response.data;
  }

  // Tasks methods
  async getTasks(params?: KommoQueryParams): Promise<{ _embedded: { tasks: KommoTask[] } }> {
    const response = await this.client.get('/api/v4/tasks', { params });
    return response.data;
  }

  async getTask(id: number): Promise<KommoTask> {
    const response = await this.client.get(`/api/v4/tasks/${id}`);
    return response.data;
  }

  async createTask(task: Partial<KommoTask>): Promise<KommoTask> {
    const response = await this.client.post('/api/v4/tasks', [task]);
    return response.data._embedded.tasks[0];
  }

  async updateTask(id: number, task: Partial<KommoTask>): Promise<KommoTask> {
    const response = await this.client.patch(`/api/v4/tasks/${id}`, task);
    return response.data;
  }

  // Users methods
  async getUsers(): Promise<{ _embedded: { users: KommoUser[] } }> {
    const response = await this.client.get('/api/v4/users');
    return response.data;
  }

  async getUser(id: number): Promise<KommoUser> {
    const response = await this.client.get(`/api/v4/users/${id}`);
    return response.data;
  }

  // ===== NOVOS MÉTODOS: GESTÃO DE STATUS E PIPELINES =====

  // Status de leads
  async getLeadStatuses(pipelineId: number): Promise<{ _embedded: { statuses: KommoStatus[] } }> {
    const response = await this.client.get(`/api/v4/leads/pipelines/${pipelineId}/statuses`);
    return response.data;
  }

  async createLeadStatus(
    pipelineId: number,
    statusData: Partial<KommoStatus>,
  ): Promise<KommoStatus> {
    const response = await this.client.post(`/api/v4/leads/pipelines/${pipelineId}/statuses`, [
      statusData,
    ]);
    return response.data._embedded.statuses[0];
  }

  async updateLeadStatus(statusId: number, statusData: Partial<KommoStatus>): Promise<KommoStatus> {
    const response = await this.client.patch(
      `/api/v4/leads/pipelines/statuses/${statusId}`,
      statusData,
    );
    return response.data;
  }

  // Movimentação de leads
  async moveLeadToStatus(leadId: number, statusId: number): Promise<KommoLead> {
    const response = await this.client.patch(`/api/v4/leads/${leadId}`, { status_id: statusId });
    return response.data;
  }

  async moveLeadToPipeline(
    leadId: number,
    pipelineId: number,
    statusId?: number,
  ): Promise<KommoLead> {
    const updateData: Pick<KommoLead, 'pipeline_id'> & Partial<Pick<KommoLead, 'status_id'>> = {
      pipeline_id: pipelineId,
    };
    if (statusId) {
      updateData.status_id = statusId;
    }
    const response = await this.client.patch(`/api/v4/leads/${leadId}`, updateData);
    return response.data;
  }

  // ===== RELATÓRIOS CALCULADOS COM ENDPOINTS PÚBLICOS =====

  async getSalesReport(dateFrom: string, dateTo: string): Promise<KommoSalesReport> {
    const fromDate = parseCalendarDate(dateFrom);
    const toDate = parseCalendarDate(dateTo);
    const [account, leads, pipelinesResponse, usersResponse] = await Promise.all([
      this.getAccount(),
      this.getAllLeads(),
      this.getPipelines(),
      this.getUsers(),
    ]);
    const timezone = this.getBusinessTimezone(account);
    const from = zonedStartOfDay(fromDate, timezone);
    const toExclusive = zonedStartOfDay(addCalendarDays(toDate, 1), timezone);
    if (from >= toExclusive) {
      throw new Error('Período inválido. Use datas no formato YYYY-MM-DD.');
    }
    const created = leads.filter(
      (lead) => lead.created_at >= from && lead.created_at < toExclusive,
    );
    const closed = leads.filter(
      (lead) =>
        lead.closed_at !== undefined && lead.closed_at >= from && lead.closed_at < toExclusive,
    );
    const won = closed.filter((lead) => lead.status_id === 142);
    const lost = closed.filter((lead) => lead.status_id === 143);
    const revenue = won.reduce((sum, lead) => sum + (lead.price || 0), 0);
    const pipelineNames = new Map(
      (pipelinesResponse._embedded?.pipelines ?? []).map((pipeline) => [
        pipeline.id,
        pipeline.name,
      ]),
    );
    const userNames = new Map(
      (usersResponse._embedded?.users ?? []).map((user) => [user.id, user.name]),
    );
    const aggregate = <T extends number>(
      items: KommoLead[],
      key: (lead: KommoLead) => T,
      name: (id: T) => string,
    ) =>
      Array.from(
        items.reduce((groups, lead) => {
          const id = key(lead);
          const current = groups.get(id) ?? { count: 0, revenue: 0 };
          current.count += 1;
          current.revenue += lead.price || 0;
          groups.set(id, current);
          return groups;
        }, new Map<T, { count: number; revenue: number }>()),
      ).map(([id, values]) => ({ id, name: name(id), ...values }));
    const byUser = aggregate(
      won,
      (lead) => lead.responsible_user_id,
      (id) => userNames.get(id) ?? String(id),
    );
    const byPipeline = aggregate(
      won,
      (lead) => lead.pipeline_id,
      (id) => pipelineNames.get(id) ?? String(id),
    );

    return {
      period: { from: dateFrom, to: dateTo },
      leads: { total: created.length, new: created.length, won: won.length, lost: lost.length },
      revenue: {
        total: revenue,
        average: won.length > 0 ? revenue / won.length : 0,
        conversion_rate:
          won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0,
      },
      performance: {
        by_user: byUser.map(({ id, name, count, revenue: value }) => ({
          user_id: id,
          user_name: name,
          leads_count: count,
          revenue: value,
        })),
        by_pipeline: byPipeline.map(({ id, name, count, revenue: value }) => ({
          pipeline_id: id,
          pipeline_name: name,
          leads_count: count,
          revenue: value,
        })),
      },
    };
  }

  async getDashboardData(): Promise<KommoDashboardData> {
    const [account, leads, tasks, pipelinesResponse] = await Promise.all([
      this.getAccount(),
      this.getAllLeads(),
      this.getAllTasks(),
      this.getPipelines(),
    ]);
    const now = new Date();
    const timezone = this.getBusinessTimezone(account);
    const today = zonedCalendarDate(now, timezone);
    const todayStart = zonedStartOfDay(today, timezone);
    const monthStart = zonedStartOfDay({ ...today, day: 1 }, timezone);
    const previousMonthDate = new Date(Date.UTC(today.year, today.month - 2, 1));
    const lastMonthStart = zonedStartOfDay(
      {
        year: previousMonthDate.getUTCFullYear(),
        month: previousMonthDate.getUTCMonth() + 1,
        day: 1,
      },
      timezone,
    );
    const won = leads.filter((lead) => lead.status_id === 142);
    const revenueForPeriod = (from: number, to: number) =>
      won
        .filter(
          (lead) => lead.closed_at !== undefined && lead.closed_at >= from && lead.closed_at < to,
        )
        .reduce((sum, lead) => sum + (lead.price || 0), 0);
    const thisMonth = revenueForPeriod(monthStart, Math.floor(now.getTime() / 1000) + 1);
    const lastMonth = revenueForPeriod(lastMonthStart, monthStart);
    const pipelineNames = new Map(
      (pipelinesResponse._embedded?.pipelines ?? []).map((pipeline) => [
        pipeline.id,
        pipeline.name,
      ]),
    );
    const pipelineTotals = new Map<number, { leads_count: number; revenue: number }>();
    for (const lead of leads) {
      const current = pipelineTotals.get(lead.pipeline_id) ?? { leads_count: 0, revenue: 0 };
      current.leads_count += 1;
      if (lead.status_id === 142) current.revenue += lead.price || 0;
      pipelineTotals.set(lead.pipeline_id, current);
    }
    return {
      leads: {
        total: leads.length,
        new_today: leads.filter((lead) => lead.created_at >= todayStart).length,
        won_today: won.filter((lead) => (lead.closed_at ?? 0) >= todayStart).length,
        lost_today: leads.filter(
          (lead) => lead.status_id === 143 && (lead.closed_at ?? 0) >= todayStart,
        ).length,
      },
      tasks: {
        total: tasks.length,
        completed_today: tasks.filter((task) => task.is_completed && task.updated_at >= todayStart)
          .length,
        overdue: tasks.filter(
          (task) => !task.is_completed && task.complete_till < Math.floor(now.getTime() / 1000),
        ).length,
      },
      revenue: {
        this_month: thisMonth,
        last_month: lastMonth,
        growth_percentage: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0,
      },
      top_pipelines: Array.from(pipelineTotals, ([id, values]) => ({
        id,
        name: pipelineNames.get(id) ?? String(id),
        ...values,
      }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  // ===== NOTAS =====
  async getNotes(
    entityType: KommoEntityType,
    entityId: number,
    params?: Record<string, unknown>,
  ): Promise<{ _embedded: { notes: KommoNote[] } }> {
    const response = await this.client.get(`/api/v4/${entityType}/${entityId}/notes`, { params });
    return response.data;
  }

  async createNote(
    entityType: KommoEntityType,
    entityId: number,
    note: Partial<KommoNote>,
  ): Promise<KommoNote> {
    const response = await this.client.post(`/api/v4/${entityType}/${entityId}/notes`, [note]);
    return response.data._embedded.notes[0];
  }

  async pinNote(entityType: KommoEntityType, noteId: number): Promise<unknown> {
    const response = await this.client.post(`/api/v4/${entityType}/notes/${noteId}/pin`);
    return response.data;
  }

  async unpinNote(entityType: KommoEntityType, noteId: number): Promise<unknown> {
    const response = await this.client.post(`/api/v4/${entityType}/notes/${noteId}/unpin`);
    return response.data;
  }

  // ===== SALESBOT (API v4 2026) =====
  async runSalesbot(botId: number, entityId: number, entityType: 'leads'): Promise<unknown> {
    const response = await this.client.post('/api/v4/bots/run', [
      { bot_id: botId, entity_id: entityId, entity_type: entityType },
    ]);
    return { accepted: response.status === 202 };
  }

  async stopSalesbot(botId: number, entityId: number, entityType: 'leads'): Promise<unknown> {
    const response = await this.client.post(`/api/v4/bots/${botId}/stop`, {
      entity_id: entityId,
      entity_type: entityType,
    });
    return { accepted: response.status === 202 };
  }
}
