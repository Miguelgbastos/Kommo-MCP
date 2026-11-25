import {
  KommoAPI,
  type KommoCompany,
  type KommoContact,
  type KommoEntityType,
  type KommoLead,
  type KommoTask,
  type LeadOrderField,
  type SortDirection,
} from '../kommo-api.js';
import { handleAskKommo } from '../ask-kommo.js';
import type { McpToolResult } from './types.js';

function textResult(data: unknown): McpToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string): McpToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

function isEntityType(value: unknown): value is KommoEntityType {
  return value === 'leads' || value === 'contacts' || value === 'companies';
}

export async function executeTool(
  kommoAPI: KommoAPI,
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<McpToolResult> {
  switch (name) {
    case 'get_account':
      return textResult(await kommoAPI.getAccount());

    case 'get_leads': {
      return textResult(
        await kommoAPI.listLeads({
          limit: (args?.limit as number) || 250,
          page: (args?.page as number) || 1,
          query: args?.query as string | undefined,
          orderBy: args?.order_by as LeadOrderField | undefined,
          orderDirection: args?.order_dir as SortDirection | undefined,
          createdFrom: args?.created_from as string | undefined,
          createdTo: args?.created_to as string | undefined,
          updatedFrom: args?.updated_from as string | undefined,
          updatedTo: args?.updated_to as string | undefined,
          pipelineId: args?.pipeline_id as number | undefined,
          statusId: args?.status_id as number | undefined,
          responsibleUserId: args?.responsible_user_id as number | undefined,
          withParam: args?.with as string | undefined,
        }),
      );
    }

    case 'get_lead': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getLead(id));
    }

    case 'create_lead': {
      const name = args?.name;
      if (typeof name !== 'string') return errorResult('Requer name (texto).');
      const createData: Partial<KommoLead> = { name };
      if (typeof args?.price === 'number') createData.price = args.price;
      if (typeof args?.status_id === 'number') createData.status_id = args.status_id;
      if (typeof args?.pipeline_id === 'number') createData.pipeline_id = args.pipeline_id;
      return textResult(await kommoAPI.createLead(createData));
    }

    case 'update_lead': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      const updateData: Partial<KommoLead> = {};
      if (typeof args?.name === 'string') updateData.name = args.name;
      if (typeof args?.price === 'number') updateData.price = args.price;
      if (typeof args?.status_id === 'number') updateData.status_id = args.status_id;
      if (typeof args?.pipeline_id === 'number') updateData.pipeline_id = args.pipeline_id;
      if (typeof args?.loss_reason_id === 'number') updateData.loss_reason_id = args.loss_reason_id;
      return textResult(await kommoAPI.updateLead(id, updateData));
    }

    case 'move_lead': {
      const leadId = args?.lead_id as number;
      const statusId = args?.status_id as number;
      const pipelineId = args?.pipeline_id as number | undefined;
      if (typeof leadId !== 'number' || typeof statusId !== 'number') {
        return errorResult('Requer lead_id e status_id (números).');
      }
      if (pipelineId) {
        return textResult(await kommoAPI.moveLeadToPipeline(leadId, pipelineId, statusId));
      }
      return textResult(await kommoAPI.moveLeadToStatus(leadId, statusId));
    }

    case 'get_pipelines': {
      const pipelineId = args?.pipeline_id as number | undefined;
      if (pipelineId) {
        const [pipeline, statuses] = await Promise.all([
          kommoAPI.getPipeline(pipelineId),
          kommoAPI.getLeadStatuses(pipelineId),
        ]);
        return textResult({ pipeline, statuses });
      }
      return textResult(await kommoAPI.getPipelines());
    }

    case 'get_sales_report': {
      const now = new Date();
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const dateFrom = (args?.dateFrom as string) || monthAgo.toISOString().slice(0, 10);
      const dateTo = (args?.dateTo as string) || now.toISOString().slice(0, 10);
      return textResult(await kommoAPI.getSalesReport(dateFrom, dateTo));
    }

    case 'get_dashboard':
      return textResult(await kommoAPI.getDashboardData());

    case 'get_contacts': {
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(
        await kommoAPI.getContacts({
          limit,
          page,
          ...(typeof args?.query === 'string' ? { query: args.query } : {}),
        }),
      );
    }

    case 'get_contact': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getContact(id));
    }

    case 'create_contact': {
      const name = args?.name;
      if (typeof name !== 'string') return errorResult('Requer name (texto).');
      const createData: Partial<KommoContact> = { name };
      if (typeof args?.first_name === 'string') createData.first_name = args.first_name;
      if (typeof args?.last_name === 'string') createData.last_name = args.last_name;
      if (typeof args?.responsible_user_id === 'number') {
        createData.responsible_user_id = args.responsible_user_id;
      }
      return textResult(await kommoAPI.createContact(createData));
    }

    case 'update_contact': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      const updateData: Partial<KommoContact> = {};
      if (typeof args?.name === 'string') updateData.name = args.name;
      if (typeof args?.first_name === 'string') updateData.first_name = args.first_name;
      if (typeof args?.last_name === 'string') updateData.last_name = args.last_name;
      if (typeof args?.responsible_user_id === 'number') {
        updateData.responsible_user_id = args.responsible_user_id;
      }
      return textResult(await kommoAPI.updateContact(id, updateData));
    }

    case 'get_companies': {
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(
        await kommoAPI.getCompanies({
          limit,
          page,
          ...(typeof args?.query === 'string' ? { query: args.query } : {}),
        }),
      );
    }

    case 'get_company': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getCompany(id));
    }

    case 'create_company': {
      const name = args?.name;
      if (typeof name !== 'string') return errorResult('Requer name (texto).');
      const createData: Partial<KommoCompany> = { name };
      if (typeof args?.responsible_user_id === 'number') {
        createData.responsible_user_id = args.responsible_user_id;
      }
      return textResult(await kommoAPI.createCompany(createData));
    }

    case 'update_company': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      const updateData: Partial<KommoCompany> = {};
      if (typeof args?.name === 'string') updateData.name = args.name;
      if (typeof args?.responsible_user_id === 'number') {
        updateData.responsible_user_id = args.responsible_user_id;
      }
      return textResult(await kommoAPI.updateCompany(id, updateData));
    }

    case 'get_tasks': {
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(await kommoAPI.getTasks({ limit, page }));
    }

    case 'get_task': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getTask(id));
    }

    case 'create_task': {
      const text = args?.text as string;
      const entityId = args?.entity_id as number;
      const entityType = args?.entity_type;
      const completeTill = args?.complete_till as number;
      if (
        !text ||
        typeof entityId !== 'number' ||
        !isEntityType(entityType) ||
        typeof completeTill !== 'number'
      ) {
        return errorResult(
          'Requer text, entity_id, entity_type (leads|contacts|companies) e complete_till.',
        );
      }
      return textResult(
        await kommoAPI.createTask({
          text,
          entity_id: entityId,
          entity_type: entityType,
          complete_till: completeTill,
          ...(typeof args?.responsible_user_id === 'number'
            ? { responsible_user_id: args.responsible_user_id }
            : {}),
        }),
      );
    }

    case 'update_task': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      const updateData: Partial<KommoTask> = {};
      if (typeof args?.text === 'string') updateData.text = args.text;
      if (typeof args?.complete_till === 'number') updateData.complete_till = args.complete_till;
      if (typeof args?.is_completed === 'boolean') updateData.is_completed = args.is_completed;
      if (typeof args?.responsible_user_id === 'number') {
        updateData.responsible_user_id = args.responsible_user_id;
      }
      return textResult(await kommoAPI.updateTask(id, updateData));
    }

    case 'search_entities': {
      const query = args?.query;
      if (typeof query !== 'string' || !query.trim()) {
        return errorResult('Requer query (texto).');
      }
      const entityTypes = Array.isArray(args?.entity_types)
        ? (args.entity_types.filter(
            (value): value is 'leads' | 'contacts' | 'companies' =>
              value === 'leads' || value === 'contacts' || value === 'companies',
          ) as Array<'leads' | 'contacts' | 'companies'>)
        : (['leads', 'contacts', 'companies'] as const);
      if (entityTypes.length === 0) {
        return errorResult('entity_types deve incluir leads, contacts e/ou companies.');
      }
      const limit = typeof args?.limit === 'number' ? args.limit : 25;
      return textResult(await kommoAPI.searchEntities(query.trim(), [...entityTypes], limit));
    }

    case 'link_entities': {
      const entityType = args?.entity_type;
      const entityId = args?.entity_id as number;
      const toEntityType = args?.to_entity_type;
      const toEntityId = args?.to_entity_id as number;
      if (
        !isEntityType(entityType) ||
        typeof entityId !== 'number' ||
        (toEntityType !== 'leads' && toEntityType !== 'contacts' && toEntityType !== 'companies') ||
        typeof toEntityId !== 'number'
      ) {
        return errorResult(
          'Requer entity_type, entity_id, to_entity_type (leads|contacts|companies) e to_entity_id.',
        );
      }
      return textResult(
        await kommoAPI.linkEntities(entityType, entityId, [
          {
            to_entity_id: toEntityId,
            to_entity_type: toEntityType,
            ...(typeof args?.is_main === 'boolean' ? { metadata: { is_main: args.is_main } } : {}),
          },
        ]),
      );
    }

    case 'get_users':
      return textResult(await kommoAPI.getUsers());

    case 'get_loss_reasons':
      return textResult(await kommoAPI.getLossReasons());

    case 'get_loss_reason': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getLossReason(id));
    }

    case 'get_notes': {
      const entityType = args?.entity_type;
      const entityId = args?.entity_id as number;
      if (!isEntityType(entityType) || typeof entityId !== 'number') {
        return errorResult('Requer entity_type (leads|contacts|companies) e entity_id (número).');
      }
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(await kommoAPI.getNotes(entityType, entityId, { limit, page }));
    }

    case 'add_note': {
      const entityType = args?.entity_type;
      const entityId = args?.entity_id as number;
      const text = args?.text as string;
      if (!isEntityType(entityType) || typeof entityId !== 'number' || !text) {
        return errorResult('Requer entity_type, entity_id e text.');
      }
      const noteType = (args?.note_type as string) || 'common';
      return textResult(
        await kommoAPI.createNote(entityType, entityId, {
          note_type: noteType,
          params: { text },
        }),
      );
    }

    case 'pin_note': {
      const entityType = args?.entity_type;
      const noteId = args?.note_id as number;
      if (!isEntityType(entityType) || typeof noteId !== 'number') {
        return errorResult('Requer entity_type (leads|contacts|companies) e note_id (número).');
      }
      return textResult(await kommoAPI.pinNote(entityType, noteId));
    }

    case 'unpin_note': {
      const entityType = args?.entity_type;
      const noteId = args?.note_id as number;
      if (!isEntityType(entityType) || typeof noteId !== 'number') {
        return errorResult('Requer entity_type (leads|contacts|companies) e note_id (número).');
      }
      return textResult(await kommoAPI.unpinNote(entityType, noteId));
    }

    case 'run_salesbot': {
      const botId = args?.bot_id as number;
      const entityId = args?.entity_id as number;
      const entityType = args?.entity_type;
      if (typeof botId !== 'number' || typeof entityId !== 'number' || entityType !== 'leads') {
        return errorResult('Requer bot_id, entity_id (números) e entity_type="leads".');
      }
      return textResult(await kommoAPI.runSalesbot(botId, entityId, entityType));
    }

    case 'stop_salesbot': {
      const botId = args?.bot_id as number;
      const entityId = args?.entity_id as number;
      const entityType = args?.entity_type;
      if (typeof botId !== 'number' || typeof entityId !== 'number' || entityType !== 'leads') {
        return errorResult('Requer bot_id, entity_id (números) e entity_type="leads".');
      }
      return textResult(await kommoAPI.stopSalesbot(botId, entityId, entityType));
    }

    case 'ask_kommo':
      return handleAskKommo(kommoAPI, (args?.question as string) || '');

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
