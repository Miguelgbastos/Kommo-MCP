# Kommo MCP Dashboard

Interface gráfica para gerenciar e testar o servidor MCP do Kommo CRM.

## Requisitos

- Node.js 18+
- npm ou pnpm

## Instalação

```bash
cd web
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) em seu navegador.

## Funcionalidades

- **Dashboard**: Visualizar status do servidor MCP
- **Tools Explorer**: Listar e testar todas as tools disponíveis
- **Leads Management**: CRUD de leads
- **Relatórios**: Análise de dados
- **Configurações**: Gerenciar API e settings

## Estrutura

```
web/
├── app/              # Páginas e rotas
├── components/       # Componentes React
├── lib/             # Utilitários
├── types/           # Tipos TypeScript
└── public/          # Assets estáticos
```

## Build

```bash
npm run build
npm start
```
