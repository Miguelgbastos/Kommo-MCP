import test from 'node:test';
import assert from 'node:assert/strict';
import { getMonthFromQuestion, handleAskKommo } from '../dist/ask-kommo.js';

test('getMonthFromQuestion ignores substrings inside other words', () => {
  assert.equal(getMonthFromQuestion('vendas de marketing'), null);
  assert.equal(getMonthFromQuestion('quero saber mais'), null);
  assert.equal(getMonthFromQuestion('leads do setor'), null);
  assert.equal(getMonthFromQuestion('vendas em maio'), 4);
  assert.equal(getMonthFromQuestion('relatório de março'), 2);
  assert.equal(getMonthFromQuestion('pipeline em set'), 8);
});

test('sales questions with period do a single getAllLeads and keep category filter', async () => {
  const calls = [];
  const now = Math.floor(Date.now() / 1000);
  const api = {
    async getAllLeads() {
      calls.push('getAllLeads');
      return [
        {
          id: 1,
          name: 'Design Premium',
          price: 1000,
          status_id: 142,
          pipeline_id: 1,
          created_at: now,
          closed_at: now,
        },
        {
          id: 2,
          name: 'Tráfego Ads',
          price: 500,
          status_id: 142,
          pipeline_id: 1,
          created_at: now,
          closed_at: now,
        },
        {
          id: 3,
          name: 'Design antigo',
          price: 200,
          status_id: 142,
          pipeline_id: 1,
          created_at: now - 90 * 24 * 3600,
          closed_at: now - 90 * 24 * 3600,
        },
      ];
    },
    async getAllLeadsMatching() {
      calls.push('getAllLeadsMatching');
      assert.fail('sales path must not page by created_at');
    },
    async getSalesReport() {
      calls.push('getSalesReport');
      assert.fail('sales path must not call getSalesReport');
    },
  };

  const result = await handleAskKommo(api, 'vendas de design este mês');
  const payload = JSON.parse(result.content[0].text);

  assert.deepEqual(calls, ['getAllLeads']);
  assert.equal(payload.agent_response.metadata.category_filter, 'design');
  assert.equal(payload.agent_response.metadata.total_leads_analyzed, 1);
  assert.equal(payload.agent_response.citations[0].type, 'lead');
  assert.equal(payload.agent_response.citations[0].id, 1);
  assert.match(payload.agent_response.response, /Total de vendas:\*\* 1/);
  assert.ok(!payload.agent_response.query_plan.some((step) => step.includes('getSalesReport')));

  // A segunda pergunta deve reutilizar o cache em memória.
  await handleAskKommo(api, 'vendas de hoje');
  assert.deepEqual(calls, ['getAllLeads']);
});
