import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../dist/http-streamable.js';

const legacyProtocol = '2025-11-25';
const accept = 'application/json, text/event-stream';

function legacyInitialize() {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: legacyProtocol,
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    },
  };
}

function parseSseData(response) {
  const data = response.text
    .split('\n')
    .find((line) => line.startsWith('data: '))
    ?.slice(6);
  assert.ok(data);
  return JSON.parse(data);
}

test('health reports the modern protocol without exposing the Kommo account URL', async () => {
  const response = await request(createApp({ logLevel: 'silent' }))
    .get('/health')
    .expect(200);
  assert.equal(response.body.status, 'healthy');
  assert.equal(response.body.protocol_version, '2026-07-28');
  assert.equal(response.body.kommo_base_url, undefined);
});

test('keeps the official stateless fallback for legacy clients', async () => {
  const app = createApp({ logLevel: 'silent' });
  const response = await request(app)
    .post('/mcp')
    .set('Accept', accept)
    .send(legacyInitialize())
    .expect(200);
  assert.equal(parseSseData(response).result.protocolVersion, legacyProtocol);
  assert.equal(response.headers['mcp-session-id'], undefined);

  await request(app).delete('/mcp').expect(405);
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
    .expect(200);
});
