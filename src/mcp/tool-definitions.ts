import type { McpToolDefinition } from './types.js';

const entityTypeProperty = {
  type: 'string',
  enum: ['leads', 'contacts', 'companies'],
  description: 'Tipo da entidade',
};

const paginationProperties = {
  limit: { type: 'number', description: 'Número máximo de registros (padrão: 250)' },
  page: { type: 'number', description: 'Página para paginação (padrão: 1)' },
};

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_account',
    title: 'Informações da conta',
    description: 'Obter informações da conta Kommo',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_leads',
    title: 'Listar leads',
    description: 'Obter lista de leads do Kommo CRM',
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationProperties,
        query: { type: 'string', description: 'Filtro de busca (query da API)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_lead',
    title: 'Obter lead',
    description: 'Obter um lead específico pelo ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'ID do lead' } },
      required: ['id'],
      additionalProperties: false,
    },
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
        status_id: { type: 'number', description: 'ID do status' },
        pipeline_id: { type: 'number', description: 'ID do pipeline' },
      },
      required: ['name'],
      additionalProperties: true,
    },
  },
  {
    name: 'update_lead',
    title: 'Atualizar lead',
    description: 'Atualizar um lead existente (nome, valor, status, pipeline, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID do lead' },
        name: { type: 'string', description: 'Nome do lead' },
        price: { type: 'number', description: 'Valor do lead' },
        status_id: { type: 'number', description: 'ID do status' },
        pipeline_id: { type: 'number', description: 'ID do pipeline' },
        loss_reason_id: { type: 'number', description: 'ID do motivo de perda' },
      },
      required: ['id'],
      additionalProperties: true,
    },
  },
  {
    name: 'move_lead',
    title: 'Mover lead',
    description: 'Mover lead para outro status ou pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'number', description: 'ID do lead' },
        status_id: { type: 'number', description: 'ID do novo status' },
        pipeline_id: { type: 'number', description: 'ID do novo pipeline (opcional)' },
      },
      required: ['lead_id', 'status_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pipelines',
    title: 'Listar pipelines',
    description: 'Obter pipelines de vendas e seus status',
    inputSchema: {
      type: 'object',
      properties: {
        pipeline_id: {
          type: 'number',
          description: 'ID do pipeline (opcional, para obter status)',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_sales_report',
    title: 'Relatório de vendas',
    description: 'Obter relatório de vendas do Kommo CRM',
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_dashboard',
    title: 'Dashboard',
    description: 'Obter dados do dashboard do Kommo CRM',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_contacts',
    title: 'Listar contatos',
    description: 'Obter lista de contatos do Kommo CRM',
    inputSchema: {
      type: 'object',
      properties: paginationProperties,
      additionalProperties: false,
    },
  },
  {
    name: 'get_companies',
    title: 'Listar empresas',
    description: 'Obter lista de empresas do Kommo CRM',
    inputSchema: {
      type: 'object',
      properties: paginationProperties,
      additionalProperties: false,
    },
  },
  {
    name: 'get_tasks',
    title: 'Listar tarefas',
    description: 'Obter lista de tarefas do Kommo CRM',
    inputSchema: {
      type: 'object',
      properties: paginationProperties,
      additionalProperties: false,
    },
  },
  {
    name: 'create_task',
    title: 'Criar tarefa',
    description: 'Criar uma nova tarefa vinculada a lead, contato ou empresa',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto da tarefa' },
        entity_id: { type: 'number', description: 'ID da entidade vinculada' },
        entity_type: {
          type: 'string',
          description: 'Tipo da entidade (leads, contacts, companies)',
        },
        complete_till: { type: 'number', description: 'Timestamp Unix de conclusão' },
        responsible_user_id: { type: 'number', description: 'ID do usuário responsável' },
      },
      required: ['text', 'entity_id', 'entity_type', 'complete_till'],
      additionalProperties: true,
    },
  },
  {
    name: 'get_users',
    title: 'Listar usuários',
    description: 'Obter lista de usuários da conta Kommo',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_loss_reasons',
    title: 'Listar motivos de perda',
    description: 'Obter lista de motivos da perda de leads (API 2026)',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_loss_reason',
    title: 'Obter motivo de perda',
    description: 'Obter um motivo de perda específico pelo ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'ID do motivo de perda' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_notes',
    title: 'Listar notas',
    description: 'Obter notas de um lead, contato ou empresa',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: entityTypeProperty,
        entity_id: { type: 'number', description: 'ID da entidade' },
        ...paginationProperties,
      },
      required: ['entity_type', 'entity_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'add_note',
    title: 'Adicionar nota',
    description: 'Adicionar uma nota de texto a lead, contato ou empresa',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: entityTypeProperty,
        entity_id: { type: 'number', description: 'ID da entidade' },
        text: { type: 'string', description: 'Texto da nota' },
        note_type: { type: 'string', description: 'Tipo da nota (padrão: common)' },
      },
      required: ['entity_type', 'entity_id', 'text'],
      additionalProperties: false,
    },
  },
  {
    name: 'pin_note',
    title: 'Fixar nota',
    description: 'Fixar uma nota no cartão da entidade (lead, contato ou empresa)',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: entityTypeProperty,
        note_id: { type: 'number', description: 'ID da nota' },
      },
      required: ['entity_type', 'note_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'unpin_note',
    title: 'Desafixar nota',
    description: 'Desafixar uma nota no cartão da entidade',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: entityTypeProperty,
        note_id: { type: 'number', description: 'ID da nota' },
      },
      required: ['entity_type', 'note_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'run_salesbot',
    title: 'Iniciar Salesbot',
    description: 'Iniciar um Salesbot (API v4). Requer entity_id e entity_type (ex.: leads).',
    inputSchema: {
      type: 'object',
      properties: {
        bot_id: { type: 'number', description: 'ID do Salesbot' },
        entity_id: { type: 'number', description: 'ID da entidade (ex.: lead)' },
        entity_type: { type: 'string', enum: ['leads'], description: 'Tipo da entidade' },
      },
      required: ['bot_id', 'entity_id', 'entity_type'],
      additionalProperties: false,
    },
  },
  {
    name: 'stop_salesbot',
    title: 'Parar Salesbot',
    description: 'Parar um Salesbot pelo ID do bot',
    inputSchema: {
      type: 'object',
      properties: {
        bot_id: { type: 'number', description: 'ID do bot Salesbot' },
        entity_id: { type: 'number', description: 'ID do lead' },
        entity_type: { type: 'string', enum: ['leads'], description: 'Tipo da entidade' },
      },
      required: ['bot_id', 'entity_id', 'entity_type'],
      additionalProperties: false,
    },
  },
  {
    name: 'ask_kommo',
    title: 'Perguntar ao Kommo',
    description: 'Fazer perguntas inteligentes sobre dados do Kommo CRM usando IA conversacional',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Pergunta sobre dados do Kommo CRM' },
      },
      required: ['question'],
      additionalProperties: false,
    },
  },
];
