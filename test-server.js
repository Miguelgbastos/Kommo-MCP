import { createServer } from 'http';

const server = createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Kommo MCP Server is running' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`✅ Test server started on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
});
