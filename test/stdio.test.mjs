import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('stdio transport serves local MCP clients', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/stdio.js'],
    env: {
      ...process.env,
      KOMMO_BASE_URL: 'https://example.kommo.com',
      KOMMO_ACCESS_TOKEN: 'test-token',
      LOG_LEVEL: 'silent',
    },
  });
  const client = new Client({ name: 'stdio-test', version: '1.0.0' });

  try {
    await client.connect(transport);
    assert.equal(client.getProtocolEra(), 'legacy');
    const { tools } = await client.listTools();
    assert.equal(tools.length, 23);
  } finally {
    await client.close();
  }
});
