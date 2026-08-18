import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../dist/http-streamable.js';

const protocol = '2025-06-18';
const accept = 'application/json, text/event-stream';

async function initializedClient(app) {
  const initialized = await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: protocol,
        capabilities: {},
        clientInfo: { name: 'test', version: '1' },
      },
    });
  assert.equal(initialized.status, 200);
  const sessionId = initialized.headers['mcp-session-id'];
  assert.ok(sessionId);
  await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('MCP-Protocol-Version', protocol)
    .set('MCP-Session-Id', sessionId)
    .send({ jsonrpc: '2.0', method: 'notifications/initialized' })
    .expect(202);
  return sessionId;
}

test('health does not expose the Kommo account URL', async () => {
  const response = await request(createApp({ logLevel: 'silent' }))
    .get('/health')
    .expect(200);
  assert.equal(response.body.status, 'healthy');
  assert.equal(response.body.kommo_base_url, undefined);
});

test('rejects unsupported protocol versions', async () => {
  const response = await request(createApp({ logLevel: 'silent' }))
    .post('/mcp')
    .set('Accept', accept)
    .send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: 'future-version' },
    })
    .expect(400);
  assert.equal(response.body.error.code, -32602);
});

test('requires a valid initialized session', async () => {
  const app = createApp({ logLevel: 'silent' });
  await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('MCP-Protocol-Version', protocol)
    .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
    .expect(400);
  const sessionId = await initializedClient(app);
  const response = await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('MCP-Protocol-Version', protocol)
    .set('MCP-Session-Id', sessionId)
    .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
    .expect(200);
  assert.ok(response.body.result.tools.length > 0);
});

test('validates tool arguments before accessing Kommo', async () => {
  const app = createApp({ logLevel: 'silent' });
  const sessionId = await initializedClient(app);
  const response = await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('MCP-Protocol-Version', protocol)
    .set('MCP-Session-Id', sessionId)
    .send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'get_lead', arguments: { id: 'not-a-number' } },
    })
    .expect(200);
  assert.equal(response.body.error.code, -32602);
});

test('blocks untrusted browser origins and enforces configured auth', async () => {
  const app = createApp({ logLevel: 'silent', authToken: 'test-secret' });
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: protocol },
  };
  await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('Origin', 'https://evil.example')
    .send(payload)
    .expect(403);
  await request(app).post('/mcp').set('Accept', accept).send(payload).expect(401);
  await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('Authorization', 'Bearer test-secret')
    .send(payload)
    .expect(200);
});

test('deletes sessions explicitly', async () => {
  const app = createApp({ logLevel: 'silent' });
  const sessionId = await initializedClient(app);
  await request(app).delete('/mcp').set('MCP-Session-Id', sessionId).expect(204);
  await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .set('MCP-Protocol-Version', protocol)
    .set('MCP-Session-Id', sessionId)
    .send({ jsonrpc: '2.0', id: 4, method: 'tools/list' })
    .expect(404);
});
