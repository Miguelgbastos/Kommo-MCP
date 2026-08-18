# Kommo MCP Server

[![CI](https://github.com/Miguelgbastos/Kommo-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Miguelgbastos/Kommo-MCP/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Servidor [MCP](https://modelcontextprotocol.io) (Model Context Protocol) para
integração com o [Kommo CRM](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores).
Expõe **tools**, **resources** e **prompts** para clientes MCP (Cursor, Claude
Desktop, etc.).

<a href="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Miguelgbastos/Kommo-MCP/badge" alt="Kommo CRM Server MCP server" />
</a>

## Sumário

- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Início rápido](#início-rápido)
- [Configuração](#configuração)
- [Execução](#execução)
- [Integração com clientes MCP](#integração-com-clientes-mcp)
- [Endpoints](#endpoints)
- [Ferramentas MCP](#ferramentas-mcp)
- [Resources](#resources)
- [Prompts](#prompts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Exemplos de uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)
- [Documentação](#documentação)
- [Compatibilidade e suporte](#compatibilidade-e-suporte)
- [Contribuindo](#contribuindo)
- [Segurança](#segurança)
- [Licença](#licença)

## Funcionalidades

- **MCP moderno**: revisão `2026-07-28` pelo SDK oficial, sem camada de
  compatibilidade legada
- **23 tools**: leads, contatos, empresas, tarefas, pipelines, notas,
  relatórios, dashboard, Salesbot, motivos de perda
- **5 resources**: relatório de vendas, pipelines, motivos de perda,
  dashboard, conta
- **4 prompts**: templates para análise de vendas, leads, pipelines e motivos
  de perda
- **`ask_kommo`**: interface conversacional em linguagem natural
- **Arquitetura modular**: código organizado em módulos (`kommo-api`, `mcp/`,
  `ask-kommo`)
- **Segurança**: validação de Origin, validação dos argumentos das tools e
  autenticação obrigatória fora de localhost

## Pré-requisitos

- Node.js **20+**
- Docker (opcional)
- Token de acesso do Kommo (integração privada ou OAuth2) —
  ver [documentação do Kommo](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)

## Início rápido

```bash
git clone https://github.com/Miguelgbastos/Kommo-MCP.git
cd Kommo-MCP
npm install
cp env.example .env
# edite .env com KOMMO_BASE_URL e KOMMO_ACCESS_TOKEN
npm run build
npm start
```

O servidor sobe em `http://127.0.0.1:3001/mcp`.

## Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cp env.example .env
   ```
2. Configure no `.env`:
   ```
   KOMMO_BASE_URL=https://seu-dominio.kommo.com
   KOMMO_ACCESS_TOKEN=seu-token-aqui
   ```

### Variáveis de ambiente

| Variável              | Descrição                                                    | Default     |
| --------------------- | ------------------------------------------------------------ | ----------- |
| `KOMMO_BASE_URL`      | URL da conta Kommo (`https://<subdominio>.kommo.com`)        | —           |
| `KOMMO_ACCESS_TOKEN`  | Token de acesso (integração privada ou OAuth2)               | —           |
| `PORT`                | Porta HTTP do servidor MCP                                   | `3001`      |
| `MCP_HOST`            | Host de binding                                              | `127.0.0.1` |
| `MCP_ALLOWED_ORIGINS` | Origens permitidas (separadas por vírgula)                   | —           |
| `MCP_AUTH_TOKEN`      | Protege `/mcp`; obrigatório quando `MCP_HOST` não é loopback | —           |
| `LOG_LEVEL`           | Nível de log                                                 | `info`      |

## Execução

**Desenvolvimento:**

```bash
npm install
npm run dev        # ts-node
# ou
npm run build && npm start
```

**Docker:**

```bash
docker build -t kommo-mcp-server .
docker run -d -p 3001:3001 \
  -e KOMMO_BASE_URL=https://seu-dominio.kommo.com \
  -e KOMMO_ACCESS_TOKEN=seu-token \
  -e MCP_HOST=0.0.0.0 \
  -e MCP_AUTH_TOKEN=gere-um-segredo-longo \
  --name kommo-mcp-server kommo-mcp-server
```

> Em produção, coloque o servidor atrás de um reverse proxy com TLS e defina
> `MCP_AUTH_TOKEN` + `MCP_ALLOWED_ORIGINS`. O servidor se recusa a iniciar em
> um endereço não local sem `MCP_AUTH_TOKEN`.

## Integração com clientes MCP

### Cursor

Adicione ao arquivo `~/.cursor/mcp.json` (ou nas configurações do projeto em
`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kommo": {
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

### Claude Desktop

Para uma implantação remota com HTTPS, abra **Settings → Connectors → Add
connector** e informe a URL pública do endpoint, por exemplo
`https://mcp.seudominio.com/mcp`.

O Claude Desktop não conecta servidores HTTP remotos configurados diretamente
em `claude_desktop_config.json`. Esse arquivo é destinado a servidores locais
executados como processos; o Kommo MCP oferece atualmente transporte HTTP.

## Endpoints

- **MCP**: `POST http://localhost:3001/mcp` — negociação moderna via
  `server/discover`
- **Health**: `GET http://localhost:3001/health`

## Ferramentas MCP

### Conta e dashboard

| Tool            | Descrição                  |
| --------------- | -------------------------- |
| `get_account`   | Informações da conta Kommo |
| `get_dashboard` | Dados do dashboard         |

### Leads

| Tool          | Descrição                                                |
| ------------- | -------------------------------------------------------- |
| `get_leads`   | Listar leads (`limit`, `page`, `query`)                  |
| `get_lead`    | Obter lead por ID                                        |
| `create_lead` | Criar lead (`name`, `price`, `status_id`, `pipeline_id`) |
| `update_lead` | Atualizar lead existente                                 |
| `move_lead`   | Mover lead para outro status/pipeline                    |

### Pipelines e relatórios

| Tool               | Descrição                                                |
| ------------------ | -------------------------------------------------------- |
| `get_pipelines`    | Listar pipelines (com status opcional por `pipeline_id`) |
| `get_sales_report` | Relatório de vendas (`dateFrom`, `dateTo`)               |

### Contatos, empresas e tarefas

| Tool            | Descrição                         |
| --------------- | --------------------------------- |
| `get_contacts`  | Listar contatos                   |
| `get_companies` | Listar empresas                   |
| `get_tasks`     | Listar tarefas                    |
| `create_task`   | Criar tarefa vinculada a entidade |
| `get_users`     | Listar usuários da conta          |

### Notas

| Tool         | Descrição                            |
| ------------ | ------------------------------------ |
| `get_notes`  | Listar notas de lead/contato/empresa |
| `add_note`   | Adicionar nota de texto              |
| `pin_note`   | Fixar nota                           |
| `unpin_note` | Desafixar nota                       |

### Motivos de perda e Salesbot

| Tool               | Descrição                        |
| ------------------ | -------------------------------- |
| `get_loss_reasons` | Listar motivos da perda de leads |
| `get_loss_reason`  | Obter motivo de perda por ID     |
| `run_salesbot`     | Iniciar Salesbot                 |
| `stop_salesbot`    | Parar Salesbot                   |

### IA conversacional

| Tool        | Descrição                                  |
| ----------- | ------------------------------------------ |
| `ask_kommo` | Perguntas em linguagem natural sobre o CRM |

## Resources

| URI                     | Descrição                        |
| ----------------------- | -------------------------------- |
| `kommo://reports/sales` | Relatório de vendas (último mês) |
| `kommo://pipelines`     | Lista de pipelines               |
| `kommo://loss_reasons`  | Motivos da perda de leads        |
| `kommo://dashboard`     | Dados do dashboard               |
| `kommo://account`       | Informações da conta             |

## Prompts

| Nome                  | Descrição                        |
| --------------------- | -------------------------------- |
| `analisar_vendas_mes` | Analisar vendas do mês           |
| `resumo_leads_status` | Resumo de leads por status       |
| `analise_pipeline`    | Analisar performance de pipeline |
| `motivos_perda`       | Analisar motivos de perda        |

## Estrutura do projeto

```
src/
├── kommo-api.ts             # Cliente da API Kommo
├── ask-kommo.ts             # Lógica conversacional ask_kommo
├── http-streamable.ts       # Servidor MCP HTTP
└── mcp/
    ├── server.ts            # Definição oficial do servidor MCP
    ├── types.ts             # Tipos MCP
    ├── tool-definitions.ts  # Schemas das tools
    ├── tool-handlers.ts     # Execução das tools
    ├── resources.ts         # Resources MCP
    └── prompts.ts           # Prompts MCP
```

## Exemplos de uso

Clientes compatíveis negociam a revisão automaticamente por `server/discover`.
Ao usar o cliente TypeScript oficial, fixe a revisão para evitar fallback
silencioso para servidores antigos:

```ts
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client(
  { name: 'minha-integracao', version: '1.0.0' },
  { versionNegotiation: { mode: { pin: '2026-07-28' } } },
);

const transport = new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3001/mcp'));

await client.connect(transport);
const { tools } = await client.listTools();
```

Clientes limitados ao lifecycle MCP de 2024/2025 recebem o erro
`-32022 Unsupported protocol version` e precisam ser atualizados.

## Troubleshooting

- **`401 Unauthorized` da API do Kommo** — verifique se `KOMMO_ACCESS_TOKEN`
  está válido e se `KOMMO_BASE_URL` aponta para o subdomínio correto da sua
  conta.
- **Cliente MCP não conecta** — confirme se `MCP_HOST` permite conexões do
  cliente (`0.0.0.0` para acesso remoto) e se `MCP_ALLOWED_ORIGINS` inclui a
  origem do cliente, quando definido.
- **`403` no `/mcp`** — se `MCP_AUTH_TOKEN` estiver definido, é preciso
  enviar `Authorization: Bearer <token>` ou `X-API-Key: <token>`.
- **Docker `HEALTHCHECK` falha** — a imagem usa `node --eval` para o
  healthcheck, verifique se a porta interna corresponde a `PORT`.
- **Erros de build TypeScript** — rode `npm run typecheck` para ver mensagens
  detalhadas. Requer Node.js 20+.

## Documentação

- [docs/MCP_EVOLUCAO.md](docs/MCP_EVOLUCAO.md) — plano de evolução e
  conformidade MCP
- [docs/KOMMO_API_EVOLUCAO.md](docs/KOMMO_API_EVOLUCAO.md) — evoluções da API
  Kommo
- [Kommo para desenvolvedores](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)
- [Changelog Kommo](https://pt-developers.kommo.com/changelog)
- [CHANGELOG.md](CHANGELOG.md) deste projeto
- [ROADMAP.md](ROADMAP.md) — prioridades e oportunidades de contribuição
- [MAINTAINERS.md](MAINTAINERS.md) — manutenção, revisão e releases

## Compatibilidade e suporte

| Componente     | Suporte atual                                  |
| -------------- | ---------------------------------------------- |
| Node.js        | 20 e 22                                        |
| Protocolo MCP  | somente `2026-07-28`                           |
| Transporte     | Streamable HTTP oficial; respostas JSON ou SSE |
| Cursor         | Configuração HTTP documentada                  |
| Claude Desktop | Conector remoto via Settings → Connectors      |
| Instalação     | Git/Docker; ainda não publicado no npm         |

Suporte comunitário ocorre por Issues e Discussions, sem garantia de tempo de
resposta. Veja as responsabilidades em [MAINTAINERS.md](MAINTAINERS.md).

## Contribuindo

Contribuições são muito bem-vindas! Leia o
[CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo completo e o
[Código de Conduta](CODE_OF_CONDUCT.md) para as regras da comunidade.

Sugestões rápidas:

- Abra uma [issue](https://github.com/Miguelgbastos/Kommo-MCP/issues) usando
  os templates.
- Envie um PR pequeno e focado, com descrição do que muda e por quê.
- Rode `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run format:check` e `npm run audit:prod` antes de enviar.

## Segurança

Para reportar vulnerabilidades, veja [SECURITY.md](SECURITY.md). **Não**
abra issues públicas para problemas de segurança.

## Licença

Distribuído sob a licença [MIT](LICENSE).
