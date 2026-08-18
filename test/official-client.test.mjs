import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createApp } from '../dist/http-streamable.js';

async function verifyDiscovery(url) {
  const client = new Client(
    { name: 'kommo-mcp-modern-test', version: '1.0.0' },
    { versionNegotiation: { mode: { pin: '2026-07-28' } } },
  );
  const transport = new StreamableHTTPClientTransport(url);

  try {
    await client.connect(transport);
    assert.equal(client.getProtocolEra(), 'modern');
    assert.equal(client.getServerVersion()?.name, 'kommo-mcp-server');

    const [{ tools }, { resources }, { prompts }] = await Promise.all([
      client.listTools(),
      client.listResources(),
      client.listPrompts(),
    ]);

    assert.equal(tools.length, 23);
    assert.equal(resources.length, 5);
    assert.equal(prompts.length, 4);
  } finally {
    await client.close();
  }
}

test('official MCP client discovers capabilities with protocol 2026-07-28', async (context) => {
  const server = createApp({ logLevel: 'silent' }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const url = new URL(`http://127.0.0.1:${address.port}/mcp`);

  await verifyDiscovery(url);
});
