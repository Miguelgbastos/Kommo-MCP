import { KommoAPI, type KommoEntityType } from '../kommo-api.js';
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
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      const query = args?.query as string | undefined;
      return textResult(await kommoAPI.getLeads({ limit, page, ...(query ? { query } : {}) }));
    }

    case 'get_lead': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      return textResult(await kommoAPI.getLead(id));
    }

    case 'create_lead':
      return textResult(await kommoAPI.createLead(args || {}));

    case 'update_lead': {
      const id = args?.id as number;
      if (typeof id !== 'number') return errorResult('Requer id (número).');
      const { id: _id, ...updateData } = args || {};
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
      return textResult(await kommoAPI.getContacts({ limit, page }));
    }

    case 'get_companies': {
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(await kommoAPI.getCompanies({ limit, page }));
    }

    case 'get_tasks': {
      const limit = (args?.limit as number) || 250;
      const page = (args?.page as number) || 1;
      return textResult(await kommoAPI.getTasks({ limit, page }));
    }

    case 'create_task': {
      const text = args?.text as string;
      const entityId = args?.entity_id as number;
      const entityType = args?.entity_type as string;
      const completeTill = args?.complete_till as number;
      if (
        !text ||
        typeof entityId !== 'number' ||
        !entityType ||
        typeof completeTill !== 'number'
      ) {
        return errorResult('Requer text, entity_id, entity_type e complete_till.');
      }
      return textResult(
        await kommoAPI.createTask({
          text,
          entity_id: entityId,
          entity_type: entityType,
          complete_till: completeTill,
          ...(args?.responsible_user_id
            ? { responsible_user_id: args.responsible_user_id as number }
            : {}),
        }),
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
      const entityId = args?.entity_id as number;
      const entityType = args?.entity_type as string;
      if (typeof entityId !== 'number' || !entityType) {
        return errorResult('Requer entity_id (número) e entity_type (ex.: leads).');
      }
      return textResult(
        await kommoAPI.runSalesbot({ entity_id: entityId, entity_type: entityType, ...args }),
      );
    }

    case 'stop_salesbot': {
      const botId = args?.bot_id as number;
      if (typeof botId !== 'number') return errorResult('Requer bot_id (número).');
      return textResult(await kommoAPI.stopSalesbot(botId));
    }

    case 'ask_kommo':
      return handleAskKommo(kommoAPI, (args?.question as string) || '');

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
