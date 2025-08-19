import axios, { AxiosInstance } from 'axios';

export interface KommoConfig {
  baseUrl: string;
  accessToken: string;
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
  custom_fields_values?: any[];
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
  custom_fields_values?: any[];
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
  result?: {
    text: string;
  };
}

// Novas interfaces para Eventos e Atividades
export interface KommoEvent {
  id: number;
  entity_id: number;
  entity_type: string;
  type: string;
  created_at: number;
  updated_at: number;
  created_by: number;
  responsible_user_id: number;
  text?: string;
  data?: any;
}

export interface KommoActivity {
  id: number;
  entity_id: number;
  entity_type: string;
  type: string;
  created_at: number;
  updated_at: number;
  created_by: number;
  responsible_user_id: number;
  text?: string;
  data?: any;
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

  constructor(config: KommoConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Account methods
  async getAccount(): Promise<any> {
    const response = await this.client.get('/api/v4/account');
    return response.data;
  }

  // Leads methods
  async getLeads(params?: any): Promise<{ _embedded: { leads: KommoLead[] } }> {
    const response = await this.client.get('/api/v4/leads', { params });
    return response.data;
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

  // Contacts methods
  async getContacts(params?: any): Promise<{ _embedded: { contacts: KommoContact[] } }> {
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
  async getCompanies(params?: any): Promise<{ _embedded: { companies: KommoCompany[] } }> {
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
  async getTasks(params?: any): Promise<{ _embedded: { tasks: KommoTask[] } }> {
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
  async getUsers(): Promise<{ _embedded: { users: any[] } }> {
    const response = await this.client.get('/api/v4/users');
    return response.data;
  }

  async getUser(id: number): Promise<any> {
    const response = await this.client.get(`/api/v4/users/${id}`);
    return response.data;
  }

  // ===== NOVOS MÉTODOS: GESTÃO DE EVENTOS E ATIVIDADES =====

  // Eventos de leads
  async getLeadEvents(leadId: number, params?: any): Promise<{ _embedded: { events: KommoEvent[] } }> {
    const response = await this.client.get(`/api/v4/leads/${leadId}/events`, { params });
    return response.data;
  }

  async createLeadEvent(leadId: number, eventData: Partial<KommoEvent>): Promise<KommoEvent> {
    const response = await this.client.post(`/api/v4/leads/${leadId}/events`, [eventData]);
    return response.data._embedded.events[0];
  }

  async updateLeadEvent(leadId: number, eventId: number, eventData: Partial<KommoEvent>): Promise<KommoEvent> {
    const response = await this.client.patch(`/api/v4/leads/${leadId}/events/${eventId}`, eventData);
    return response.data;
  }

  // Atividades de contatos
  async getContactActivities(contactId: number, params?: any): Promise<{ _embedded: { activities: KommoActivity[] } }> {
    const response = await this.client.get(`/api/v4/contacts/${contactId}/activities`, { params });
    return response.data;
  }

  async createContactActivity(contactId: number, activityData: Partial<KommoActivity>): Promise<KommoActivity> {
    const response = await this.client.post(`/api/v4/contacts/${contactId}/activities`, [activityData]);
    return response.data._embedded.activities[0];
  }

  async updateContactActivity(contactId: number, activityId: number, activityData: Partial<KommoActivity>): Promise<KommoActivity> {
    const response = await this.client.patch(`/api/v4/contacts/${contactId}/activities/${activityId}`, activityData);
    return response.data;
  }

  // ===== NOVOS MÉTODOS: GESTÃO DE STATUS E PIPELINES =====

  // Status de leads
  async getLeadStatuses(pipelineId: number): Promise<{ _embedded: { statuses: KommoStatus[] } }> {
    const response = await this.client.get(`/api/v4/leads/pipelines/${pipelineId}/statuses`);
    return response.data;
  }

  async createLeadStatus(pipelineId: number, statusData: Partial<KommoStatus>): Promise<KommoStatus> {
    const response = await this.client.post(`/api/v4/leads/pipelines/${pipelineId}/statuses`, [statusData]);
    return response.data._embedded.statuses[0];
  }

  async updateLeadStatus(statusId: number, statusData: Partial<KommoStatus>): Promise<KommoStatus> {
    const response = await this.client.patch(`/api/v4/leads/pipelines/statuses/${statusId}`, statusData);
    return response.data;
  }

  // Movimentação de leads
  async moveLeadToStatus(leadId: number, statusId: number): Promise<KommoLead> {
    const response = await this.client.patch(`/api/v4/leads/${leadId}`, { status_id: statusId });
    return response.data;
  }

  async moveLeadToPipeline(leadId: number, pipelineId: number, statusId?: number): Promise<KommoLead> {
    const updateData: any = { pipeline_id: pipelineId };
    if (statusId) {
      updateData.status_id = statusId;
    }
    const response = await this.client.patch(`/api/v4/leads/${leadId}`, updateData);
    return response.data;
  }

  // ===== NOVOS MÉTODOS: RELATÓRIOS E ANALYTICS =====

  // Relatórios de vendas
  async getSalesReport(dateFrom: string, dateTo: string): Promise<KommoSalesReport> {
    const response = await this.client.get('/api/v4/leads/reports', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        report_type: 'sales'
      }
    });
    return response.data;
  }

  async getLeadConversionReport(dateFrom: string, dateTo: string): Promise<any> {
    const response = await this.client.get('/api/v4/leads/reports', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        report_type: 'conversion'
      }
    });
    return response.data;
  }

  async getPipelinePerformanceReport(dateFrom: string, dateTo: string): Promise<any> {
    const response = await this.client.get('/api/v4/leads/pipelines/reports', {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    });
    return response.data;
  }

  // Dashboard data
  async getDashboardData(): Promise<KommoDashboardData> {
    const response = await this.client.get('/api/v4/dashboard');
    return response.data;
  }

  async getUserPerformanceStats(userId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    const response = await this.client.get(`/api/v4/users/${userId}/performance`, { params });
    return response.data;
  }

  // Analytics avançados
  async getLeadAnalytics(leadId: number): Promise<any> {
    const response = await this.client.get(`/api/v4/leads/${leadId}/analytics`);
    return response.data;
  }

  async getPipelineAnalytics(pipelineId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    const response = await this.client.get(`/api/v4/leads/pipelines/${pipelineId}/analytics`, { params });
    return response.data;
  }
}
