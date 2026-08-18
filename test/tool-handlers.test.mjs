import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTool } from '../dist/mcp/tool-handlers.js';

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
