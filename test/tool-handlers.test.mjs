import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTool } from '../dist/mcp/tool-handlers.js';
import { MCP_TOOLS } from '../dist/mcp/tool-definitions.js';

function resultData(result) {
  assert.equal(result.isError, undefined);
  assert.equal(result.content.length, 1);
  return JSON.parse(result.content[0].text);
}

test('get_lead delegates the requested ID and serializes the response', async () => {
  const calls = [];
  const api = {
    async getLead(id) {
      calls.push(id);
      return { id, name: 'Lead de teste' };
    },
  };

  const result = await executeTool(api, 'get_lead', { id: 42 });

  assert.deepEqual(calls, [42]);
  assert.deepEqual(resultData(result), { id: 42, name: 'Lead de teste' });
});

test('get_leads applies pagination defaults and preserves the query', async () => {
  const calls = [];
  const api = {
    async getLeads(params) {
      calls.push(params);
      return { _embedded: { leads: [] } };
    },
  };

  await executeTool(api, 'get_leads', { query: 'Maria' });

  assert.deepEqual(calls, [{ limit: 250, page: 1, query: 'Maria' }]);
});

test('create_lead forwards only the supplied payload', async () => {
  const calls = [];
  const payload = { name: 'Novo lead', price: 1500, pipeline_id: 7 };
  const api = {
    async createLead(input) {
      calls.push(input);
      return { id: 101, ...input };
    },
  };

  const result = await executeTool(api, 'create_lead', payload);

  assert.deepEqual(calls, [payload]);
  assert.deepEqual(resultData(result), { id: 101, ...payload });
});

test('move_lead selects the pipeline operation when pipeline_id is present', async () => {
  const calls = [];
  const api = {
    async moveLeadToPipeline(leadId, pipelineId, statusId) {
      calls.push({ leadId, pipelineId, statusId });
      return { id: leadId, pipeline_id: pipelineId, status_id: statusId };
    },
  };

  const result = await executeTool(api, 'move_lead', {
    lead_id: 12,
    pipeline_id: 3,
    status_id: 8,
  });

  assert.deepEqual(calls, [{ leadId: 12, pipelineId: 3, statusId: 8 }]);
  assert.deepEqual(resultData(result), { id: 12, pipeline_id: 3, status_id: 8 });
});

test('invalid handler arguments return an MCP tool error without calling Kommo', async () => {
  const api = {
    async getLead() {
      assert.fail('Kommo must not be called for invalid arguments');
    },
  };

  const result = await executeTool(api, 'get_lead', { id: 'invalid' });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /id/);
});

test('Kommo API failures are propagated to the transport error boundary', async () => {
  const apiError = new Error('Kommo unavailable');
  const api = {
    async createLead() {
      throw apiError;
    },
  };

  await assert.rejects(() => executeTool(api, 'create_lead', { name: 'Teste' }), apiError);
});

test('every advertised tool has an executable handler', async () => {
  const validArguments = {
    get_account: {},
    get_leads: {},
    get_lead: { id: 1 },
    create_lead: { name: 'Teste' },
    update_lead: { id: 1, name: 'Teste' },
    move_lead: { lead_id: 1, status_id: 142 },
    get_pipelines: {},
    get_sales_report: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    get_dashboard: {},
    get_contacts: {},
    get_companies: {},
    get_tasks: {},
    create_task: { text: 'Teste', entity_id: 1, entity_type: 'leads', complete_till: 1 },
    get_users: {},
    get_loss_reasons: {},
    get_loss_reason: { id: 1 },
    get_notes: { entity_type: 'leads', entity_id: 1 },
    add_note: { entity_type: 'leads', entity_id: 1, text: 'Teste' },
    pin_note: { entity_type: 'leads', note_id: 1 },
    unpin_note: { entity_type: 'leads', note_id: 1 },
    run_salesbot: { bot_id: 1, entity_id: 1, entity_type: 'leads' },
    stop_salesbot: { bot_id: 1, entity_id: 1, entity_type: 'leads' },
    ask_kommo: { question: 'ajuda' },
  };
  const api = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'getAllLeads') return async () => [];
        return async () => ({});
      },
    },
  );

  for (const tool of MCP_TOOLS) {
    assert.ok(validArguments[tool.name], `missing fixture for ${tool.name}`);
    const result = await executeTool(api, tool.name, validArguments[tool.name]);
    assert.equal(result.isError, undefined, `${tool.name} returned an error`);
  }
});
