import { createServer } from 'http';

const server = createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'Kommo MCP Server is running',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/mcp') {
    // Simple MCP endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: {
        tools: [
          {
            name: 'get_account_info',
            description: 'Get Kommo account information'
          },
          {
            name: 'get_leads',
            description: 'Get list of leads from Kommo CRM'
          }
        ]
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`✅ Kommo MCP Server started on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`🔑 Auth Token: kommo-mcp-token`);
});
