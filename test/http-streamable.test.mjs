import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp, validateRuntimeConfig } from '../dist/http-streamable.js';

const accept = 'application/json, text/event-stream';

function legacyInitialize() {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    },
  };
}

test('health reports the modern protocol without exposing the Kommo account URL', async () => {
  const response = await request(createApp({ logLevel: 'silent' }))
    .get('/health')
    .expect(200);
  assert.equal(response.body.status, 'healthy');
  assert.equal(response.body.protocol_version, '2026-07-28');
  assert.equal(response.body.kommo_base_url, undefined);
});

test('readiness reports missing configuration without affecting liveness', async () => {
  const app = createApp({ logLevel: 'silent' });
  const response = await request(app).get('/ready').expect(503);
  assert.equal(response.body.status, 'not_ready');
  assert.ok(response.body.issues.some((issue) => issue.includes('KOMMO_ACCESS_TOKEN')));
});

test('runtime configuration requires a valid HTTPS URL and token', () => {
  assert.deepEqual(validateRuntimeConfig({}), [
    'KOMMO_BASE_URL is required',
    'KOMMO_ACCESS_TOKEN is required',
  ]);
  assert.deepEqual(
    validateRuntimeConfig({ KOMMO_BASE_URL: 'https://example.kommo.com', KOMMO_ACCESS_TOKEN: 'x' }),
    [],
  );
});

test('rejects legacy clients and advertises the modern protocol', async () => {
  const app = createApp({ logLevel: 'silent' });
  const response = await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .send(legacyInitialize())
    .expect(400);
  assert.equal(response.body.error.code, -32022);
  assert.deepEqual(response.body.error.data.supported, ['2026-07-28']);
});

test('rejects non-JSON MCP requests', async () => {
  await request(createApp({ logLevel: 'silent' }))
    .post('/mcp')
    .set('Content-Type', 'text/plain')
    .send('not json')
    .expect(415);
});

test('blocks untrusted browser origins and enforces configured auth', async () => {
  const app = createApp({ logLevel: 'silent', authToken: 'test-secret' });
  const payload = legacyInitialize();
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
    .expect(400);
});
