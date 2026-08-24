# Kommo MCP Server

An open-source Model Context Protocol server for Kommo CRM. It exposes 23 tools,
5 resources and 4 prompts for leads, contacts, companies, tasks, pipelines,
reports, notes, Salesbot and loss reasons.

The server supports MCP `2026-07-28`, stateless compatibility with the 2025
protocol family, Streamable HTTP and local stdio.

## Local installation

Requires Node.js 20 or newer.

```bash
npm install -g kommo-mcp-server@3.0.0
```

Configure your MCP client to run:

```json
{
  "mcpServers": {
    "kommo": {
      "command": "kommo-mcp-server",
      "env": {
        "KOMMO_BASE_URL": "https://your-account.kommo.com",
        "KOMMO_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

For Docker, remote HTTP deployment, the complete tool catalog and security
guidance, read the [Portuguese documentation](README.md).

## Safety

Remote deployments require an MCP authentication token and TLS termination.
Set `MCP_CONFIRM_WRITES=true` to require explicit confirmation for tools that
modify CRM data. API calls are coordinated at no more than six requests per
second per process, and write requests are never retried automatically.

See [SECURITY.md](SECURITY.md) for private vulnerability reporting and
[CONTRIBUTING.md](CONTRIBUTING.md) to contribute.

MIT licensed.
