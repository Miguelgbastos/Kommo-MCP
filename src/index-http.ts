import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { KommoAPI } from './kommo-api.js';

// Inicializar a API do Kommo
const kommoAPI = new KommoAPI({
  baseUrl: process.env.KOMMO_BASE_URL || 'https://kommoaeonprivatelabelcombr.kommo.com',
  accessToken: process.env.KOMMO_ACCESS_TOKEN || '',
});

const server = new Server(
  {
    name: 'kommo-mcp-server',
    version: '1.0.0',
  }
);

// Tool: Get Account Information
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ===== FERRAMENTAS EXISTENTES =====
      {
        name: 'get_account_info',
        description: 'Get Kommo account information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_leads',
        description: 'Get list of leads from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of leads to return (max 250)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_contacts',
        description: 'Get list of contacts from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of contacts to return (max 250)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_companies',
        description: 'Get list of companies from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of companies to return (max 250)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_tasks',
        description: 'Get list of tasks from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of tasks to return (max 250)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_pipelines',
        description: 'Get list of pipelines from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_users',
        description: 'Get list of users from Kommo CRM',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },

      // ===== NOVAS FERRAMENTAS: GESTÃO DE EVENTOS E ATIVIDADES =====
      {
        name: 'get_lead_events',
        description: 'Get events for a specific lead',
        inputSchema: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'number',
              description: 'ID of the lead',
            },
            limit: {
              type: 'number',
              description: 'Number of events to return',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: ['lead_id'],
        },
      },
      {
        name: 'create_lead_event',
        description: 'Create a new event for a lead',
        inputSchema: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'number',
              description: 'ID of the lead',
            },
            type: {
              type: 'string',
              description: 'Type of event',
            },
            text: {
              type: 'string',
              description: 'Event description',
            },
            responsible_user_id: {
              type: 'number',
              description: 'ID of responsible user',
            },
          },
          required: ['lead_id', 'type'],
        },
      },
      {
        name: 'get_contact_activities',
        description: 'Get activities for a specific contact',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id: {
              type: 'number',
              description: 'ID of the contact',
            },
            limit: {
              type: 'number',
              description: 'Number of activities to return',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
            },
          },
          required: ['contact_id'],
        },
      },
      {
        name: 'create_contact_activity',
        description: 'Create a new activity for a contact',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id: {
              type: 'number',
              description: 'ID of the contact',
            },
            type: {
              type: 'string',
              description: 'Type of activity',
            },
            text: {
              type: 'string',
              description: 'Activity description',
            },
            responsible_user_id: {
              type: 'number',
              description: 'ID of responsible user',
            },
          },
          required: ['contact_id', 'type'],
        },
      },

      // ===== NOVAS FERRAMENTAS: GESTÃO DE STATUS E PIPELINES =====
      {
        name: 'get_lead_statuses',
        description: 'Get statuses for a specific pipeline',
        inputSchema: {
          type: 'object',
          properties: {
            pipeline_id: {
              type: 'number',
              description: 'ID of the pipeline',
            },
          },
          required: ['pipeline_id'],
        },
      },
      {
        name: 'create_lead_status',
        description: 'Create a new status for a pipeline',
        inputSchema: {
          type: 'object',
          properties: {
            pipeline_id: {
              type: 'number',
              description: 'ID of the pipeline',
            },
            name: {
              type: 'string',
              description: 'Name of the status',
            },
            color: {
              type: 'string',
              description: 'Color of the status (hex code)',
            },
            sort: {
              type: 'number',
              description: 'Sort order',
            },
          },
          required: ['pipeline_id', 'name'],
        },
      },
      {
        name: 'move_lead_to_status',
        description: 'Move a lead to a specific status',
        inputSchema: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'number',
              description: 'ID of the lead',
            },
            status_id: {
              type: 'number',
              description: 'ID of the target status',
            },
          },
          required: ['lead_id', 'status_id'],
        },
      },
      {
        name: 'move_lead_to_pipeline',
        description: 'Move a lead to a specific pipeline',
        inputSchema: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'number',
              description: 'ID of the lead',
            },
            pipeline_id: {
              type: 'number',
              description: 'ID of the target pipeline',
            },
            status_id: {
              type: 'number',
              description: 'ID of the target status (optional)',
            },
          },
          required: ['lead_id', 'pipeline_id'],
        },
      },

      // ===== NOVAS FERRAMENTAS: RELATÓRIOS E ANALYTICS =====
      {
        name: 'get_sales_report',
        description: 'Get sales report for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
          },
          required: ['date_from', 'date_to'],
        },
      },
      {
        name: 'get_lead_conversion_report',
        description: 'Get lead conversion report for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
          },
          required: ['date_from', 'date_to'],
        },
      },
      {
        name: 'get_pipeline_performance_report',
        description: 'Get pipeline performance report for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
          },
          required: ['date_from', 'date_to'],
        },
      },
      {
        name: 'get_dashboard_data',
        description: 'Get dashboard data and key metrics',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_user_performance_stats',
        description: 'Get performance statistics for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'number',
              description: 'ID of the user',
            },
            date_from: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
          },
          required: ['user_id'],
        },
      },
      {
        name: 'get_lead_analytics',
        description: 'Get analytics for a specific lead',
        inputSchema: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'number',
              description: 'ID of the lead',
            },
          },
          required: ['lead_id'],
        },
      },
      {
        name: 'get_pipeline_analytics',
        description: 'Get analytics for a specific pipeline',
        inputSchema: {
          type: 'object',
          properties: {
            pipeline_id: {
              type: 'number',
              description: 'ID of the pipeline',
            },
            date_from: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            date_to: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
          },
          required: ['pipeline_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ===== FERRAMENTAS EXISTENTES =====
      case 'get_account_info':
        const accountInfo = await kommoAPI.getAccount();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(accountInfo, null, 2),
            },
          ],
        };

      case 'get_leads':
        const leads = await kommoAPI.getLeads(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(leads, null, 2),
            },
          ],
        };

      case 'get_contacts':
        const contacts = await kommoAPI.getContacts(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };

      case 'get_companies':
        const companies = await kommoAPI.getCompanies(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(companies, null, 2),
            },
          ],
        };

      case 'get_tasks':
        const tasks = await kommoAPI.getTasks(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };

      case 'get_pipelines':
        const pipelines = await kommoAPI.getPipelines();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pipelines, null, 2),
            },
          ],
        };

      case 'get_users':
        const users = await kommoAPI.getUsers();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(users, null, 2),
            },
          ],
        };

      // ===== NOVAS FERRAMENTAS: GESTÃO DE EVENTOS E ATIVIDADES =====
      case 'get_lead_events':
        if (!args || typeof args.lead_id !== 'number') {
          throw new Error('lead_id is required and must be a number');
        }
        const leadEvents = await kommoAPI.getLeadEvents(args.lead_id, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(leadEvents, null, 2),
            },
          ],
        };

      case 'create_lead_event':
        if (!args || typeof args.lead_id !== 'number') {
          throw new Error('lead_id is required and must be a number');
        }
        const newLeadEvent = await kommoAPI.createLeadEvent(args.lead_id, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(newLeadEvent, null, 2),
            },
          ],
        };

      case 'get_contact_activities':
        if (!args || typeof args.contact_id !== 'number') {
          throw new Error('contact_id is required and must be a number');
        }
        const contactActivities = await kommoAPI.getContactActivities(args.contact_id, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(contactActivities, null, 2),
            },
          ],
        };

      case 'create_contact_activity':
        if (!args || typeof args.contact_id !== 'number') {
          throw new Error('contact_id is required and must be a number');
        }
        const newContactActivity = await kommoAPI.createContactActivity(args.contact_id, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(newContactActivity, null, 2),
            },
          ],
        };

      // ===== NOVAS FERRAMENTAS: GESTÃO DE STATUS E PIPELINES =====
      case 'get_lead_statuses':
        if (!args || typeof args.pipeline_id !== 'number') {
          throw new Error('pipeline_id is required and must be a number');
        }
        const leadStatuses = await kommoAPI.getLeadStatuses(args.pipeline_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(leadStatuses, null, 2),
            },
          ],
        };

      case 'create_lead_status':
        if (!args || typeof args.pipeline_id !== 'number') {
          throw new Error('pipeline_id is required and must be a number');
        }
        const newLeadStatus = await kommoAPI.createLeadStatus(args.pipeline_id, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(newLeadStatus, null, 2),
            },
          ],
        };

      case 'move_lead_to_status':
        if (!args || typeof args.lead_id !== 'number' || typeof args.status_id !== 'number') {
          throw new Error('lead_id and status_id are required and must be numbers');
        }
        const movedLead = await kommoAPI.moveLeadToStatus(args.lead_id, args.status_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(movedLead, null, 2),
            },
          ],
        };

      case 'move_lead_to_pipeline':
        if (!args || typeof args.lead_id !== 'number' || typeof args.pipeline_id !== 'number') {
          throw new Error('lead_id and pipeline_id are required and must be numbers');
        }
        const statusId = args.status_id && typeof args.status_id === 'number' ? args.status_id : undefined;
        const movedLeadToPipeline = await kommoAPI.moveLeadToPipeline(args.lead_id, args.pipeline_id, statusId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(movedLeadToPipeline, null, 2),
            },
          ],
        };

      // ===== NOVAS FERRAMENTAS: RELATÓRIOS E ANALYTICS =====
      case 'get_sales_report':
        if (!args || typeof args.date_from !== 'string' || typeof args.date_to !== 'string') {
          throw new Error('date_from and date_to are required and must be strings');
        }
        const salesReport = await kommoAPI.getSalesReport(args.date_from, args.date_to);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(salesReport, null, 2),
            },
          ],
        };

      case 'get_lead_conversion_report':
        if (!args || typeof args.date_from !== 'string' || typeof args.date_to !== 'string') {
          throw new Error('date_from and date_to are required and must be strings');
        }
        const conversionReport = await kommoAPI.getLeadConversionReport(args.date_from, args.date_to);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(conversionReport, null, 2),
            },
          ],
        };

      case 'get_pipeline_performance_report':
        if (!args || typeof args.date_from !== 'string' || typeof args.date_to !== 'string') {
          throw new Error('date_from and date_to are required and must be strings');
        }
        const performanceReport = await kommoAPI.getPipelinePerformanceReport(args.date_from, args.date_to);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(performanceReport, null, 2),
            },
          ],
        };

      case 'get_dashboard_data':
        const dashboardData = await kommoAPI.getDashboardData();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(dashboardData, null, 2),
            },
          ],
        };

      case 'get_user_performance_stats':
        if (!args || typeof args.user_id !== 'number') {
          throw new Error('user_id is required and must be a number');
        }
        const dateFrom = args.date_from && typeof args.date_from === 'string' ? args.date_from : undefined;
        const dateTo = args.date_to && typeof args.date_to === 'string' ? args.date_to : undefined;
        const userStats = await kommoAPI.getUserPerformanceStats(args.user_id, dateFrom, dateTo);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(userStats, null, 2),
            },
          ],
        };

      case 'get_lead_analytics':
        if (!args || typeof args.lead_id !== 'number') {
          throw new Error('lead_id is required and must be a number');
        }
        const leadAnalytics = await kommoAPI.getLeadAnalytics(args.lead_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(leadAnalytics, null, 2),
            },
          ],
        };

      case 'get_pipeline_analytics':
        if (!args || typeof args.pipeline_id !== 'number') {
          throw new Error('pipeline_id is required and must be a number');
        }
        const pipelineDateFrom = args.date_from && typeof args.date_from === 'string' ? args.date_from : undefined;
        const pipelineDateTo = args.date_to && typeof args.date_to === 'string' ? args.date_to : undefined;
        const pipelineAnalytics = await kommoAPI.getPipelineAnalytics(args.pipeline_id, pipelineDateFrom, pipelineDateTo);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pipelineAnalytics, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.log('Kommo MCP Server started with enhanced features');
