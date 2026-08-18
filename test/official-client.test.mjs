import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createApp } from '../dist/http-streamable.js';

async function verifyDiscovery(url, createLeadCalls) {
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
    assert.equal(tools.find((tool) => tool.name === 'get_leads')?.annotations?.readOnlyHint, true);
    assert.equal(
      tools.find((tool) => tool.name === 'create_lead')?.annotations?.destructiveHint,
      true,
    );

    const failedRead = await client.callTool({ name: 'get_account', arguments: {} });
    assert.equal(failedRead.isError, true);
    assert.equal(failedRead.content[0].text, 'Erro interno ao executar a tool.');
    assert.doesNotMatch(failedRead.content[0].text, /sensitive-token/);

    const blocked = await client.callTool({ name: 'create_lead', arguments: { name: 'Teste' } });
    assert.equal(blocked.isError, true);
    assert.match(blocked.content[0].text, /confirm=true/);

    const created = await client.callTool({
      name: 'create_lead',
      arguments: { name: 'Teste', confirm: true },
    });
    assert.equal(created.isError, undefined);
    assert.deepEqual(createLeadCalls, [{ name: 'Teste' }]);
  } finally {
    await client.close();
  }
}

test('official MCP client discovers capabilities with protocol 2026-07-28', async (context) => {
  const previousConfirmation = process.env.MCP_CONFIRM_WRITES;
  process.env.MCP_CONFIRM_WRITES = 'true';
  context.after(() => {
    if (previousConfirmation === undefined) delete process.env.MCP_CONFIRM_WRITES;
    else process.env.MCP_CONFIRM_WRITES = previousConfirmation;
  });
  const createLeadCalls = [];
  const kommoAPI = {
    async getAccount() {
      throw new Error('sensitive-token');
    },
    async createLead(input) {
      createLeadCalls.push(input);
      return { id: 1, ...input };
    },
  };
  const server = createApp({ logLevel: 'silent', kommoAPI }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const url = new URL(`http://127.0.0.1:${address.port}/mcp`);

  await verifyDiscovery(url, createLeadCalls);
});
