import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { KommoAPI, parseRetryAfter } from '../dist/kommo-api.js';

async function withServer(context, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return `http://127.0.0.1:${address.port}`;
}

async function requestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

test('Salesbot requests follow the documented v4 payloads', async (context) => {
  const calls = [];
  const baseUrl = await withServer(context, async (request, response) => {
    calls.push({ method: request.method, url: request.url, body: await requestBody(request) });
    response.writeHead(202).end();
  });
  const api = new KommoAPI({ baseUrl, accessToken: 'test', maxRetries: 0 });

  assert.deepEqual(await api.runSalesbot(7, 42, 'leads'), { accepted: true });
  assert.deepEqual(await api.stopSalesbot(7, 42, 'leads'), { accepted: true });
  assert.deepEqual(calls, [
    {
      method: 'POST',
      url: '/api/v4/bots/run',
      body: [{ bot_id: 7, entity_id: 42, entity_type: 'leads' }],
    },
    {
      method: 'POST',
      url: '/api/v4/bots/7/stop',
      body: { entity_id: 42, entity_type: 'leads' },
    },
  ]);
});

test('GET requests retry a 429 and honor Retry-After', async (context) => {
  let attempts = 0;
  const baseUrl = await withServer(context, (_request, response) => {
    attempts += 1;
    if (attempts === 1) {
      response.writeHead(429, { 'Retry-After': '0' }).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json' }).end('{"id":1,"name":"Conta"}');
  });
  const api = new KommoAPI({ baseUrl, accessToken: 'test', maxRetries: 1 });

  assert.equal((await api.getAccount()).id, 1);
  assert.equal(attempts, 2);
  assert.equal(parseRetryAfter('2'), 2000);
});

test('pagination failures are propagated instead of returning partial totals', async (context) => {
  const baseUrl = await withServer(context, (request, response) => {
    const page = new URL(request.url, baseUrl).searchParams.get('page');
    if (page === '1') {
      response
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end('{"_embedded":{"leads":[{"id":1}]},"_links":{"next":{"href":"next"}}}');
      return;
    }
    response.writeHead(503).end();
  });
  const api = new KommoAPI({ baseUrl, accessToken: 'test', maxRetries: 0 });

  await assert.rejects(
    () => api.getAllLeads(),
    (error) => error.response?.status === 503,
  );
});

test('sales reports are calculated from documented leads, pipelines and users endpoints', async (context) => {
  const paths = [];
  const baseUrl = await withServer(context, (request, response) => {
    const url = new URL(request.url, baseUrl);
    paths.push(url.pathname);
    response.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/api/v4/leads') {
      response.end(
        JSON.stringify({
          _embedded: {
            leads: [
              {
                id: 1,
                name: 'Ganho',
                price: 100,
                status_id: 142,
                pipeline_id: 3,
                responsible_user_id: 5,
                created_at: 1767225600,
                updated_at: 1767225600,
                created_by: 5,
                closed_at: 1767225600,
              },
              {
                id: 2,
                name: 'Perdido',
                price: 50,
                status_id: 143,
                pipeline_id: 3,
                responsible_user_id: 5,
                created_at: 1767225600,
                updated_at: 1767225600,
                created_by: 5,
                closed_at: 1767225600,
              },
            ],
          },
        }),
      );
      return;
    }
    if (url.pathname === '/api/v4/leads/pipelines') {
      response.end(JSON.stringify({ _embedded: { pipelines: [{ id: 3, name: 'Vendas' }] } }));
      return;
    }
    if (url.pathname === '/api/v4/users') {
      response.end(JSON.stringify({ _embedded: { users: [{ id: 5, name: 'Ana' }] } }));
      return;
    }
    response.writeHead(404).end();
  });
  const api = new KommoAPI({ baseUrl, accessToken: 'test', maxRetries: 0 });

  const report = await api.getSalesReport('2026-01-01', '2026-01-31');
  assert.equal(report.leads.won, 1);
  assert.equal(report.leads.lost, 1);
  assert.equal(report.revenue.total, 100);
  assert.equal(report.revenue.conversion_rate, 50);
  assert.ok(paths.every((path) => !path.includes('reports') && !path.includes('dashboard')));
});
