# Plano de evolução do Kommo MCP

Plano de execução para alinhar o servidor Kommo MCP à [documentação oficial do Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro). Cada fase pode ser feita em uma ou mais PRs.

---

## Visão geral

| Fase | Nome                    | Prioridade | Depende de |
|------|-------------------------|------------|------------|
| 1    | Lifecycle (initialize)  | Alta       | —          |
| 2    | Transporte HTTP         | Alta       | Fase 1     |
| 3    | Tools (schema + erros)  | Média      | —          |
| 4    | Segurança               | Média      | —          |
| 5    | Notificações            | Baixa      | Fase 1     |
| 6    | Resources e Prompts     | Baixa      | Fase 1     |
| 7    | SDK (opcional)           | Opcional   | Fases 1–4  |

---

## Fase 1 — Lifecycle (obrigatório)

**Objetivo:** A primeira interação cliente–servidor ser o handshake de inicialização.

**Ref.:** [Lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle.md)

- [ ] **1.1** Tratar `method === 'initialize'` no `POST /mcp`.
  - Responder com `protocolVersion` (ex.: `"2025-06-18"` ou `"2025-11-25"` conforme suporte).
  - Incluir `capabilities`: ex. `{ "tools": { "listChanged": false } }` (ou `true` se Fase 5 for feita).
  - Incluir `serverInfo`: `name`, `version`, opcionalmente `description`.
- [ ] **1.2** Tratar a notificação `method === 'notifications/initialized'`.
  - Responder com HTTP 202 Accepted (sem body), quando em HTTP.
- [ ] **1.3** Garantir que nenhum outro método seja processado antes do handshake concluído (ex.: manter estado “não inicializado” até receber `initialized`; opcionalmente rejeitar outros métodos com erro até lá).

**Entregável:** Cliente pode fazer initialize → initialized e depois `tools/list` e `tools/call`.

---

## Fase 2 — Transporte Streamable HTTP

**Objetivo:** Seguir o comportamento e os headers definidos na spec para HTTP.

**Ref.:** [Transports - Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md)

- [ ] **2.1** Exigir e validar o header **`MCP-Protocol-Version`** em todas as requisições (exceto na primeira, se for o próprio `initialize`).
  - Se ausente ou versão não suportada: responder **400 Bad Request** (e opcionalmente corpo JSON-RPC error sem `id`).
- [ ] **2.2** (Opcional) Implementar sessão HTTP:
  - Na resposta ao `initialize`, enviar header **`MCP-Session-Id`** (valor único, ex.: UUID).
  - Em requisições seguintes, exigir header **`MCP-Session-Id`** e rejeitar com 400 se ausente/inválido.
  - Documentar comportamento (ex.: tempo de vida da sessão, reconexão).
- [ ] **2.3** Diferenciar tipo de mensagem no body do POST:
  - Se for JSON-RPC **request**: manter comportamento atual (processar e responder com JSON ou SSE).
  - Se for **notification** ou **response**: responder com **202 Accepted** e sem body.
- [ ] **2.4** Garantir que o corpo do POST seja um único objeto JSON-RPC (validar e rejeitar 400 se inválido).
- [ ] **2.5** Onde fizer sentido, suportar resposta única com **`Content-Type: application/json`** além de **`text/event-stream`** (conforme spec).

**Entregável:** Servidor compatível com clientes que enviam `MCP-Protocol-Version` e, se implementado, `MCP-Session-Id`.

---

## Fase 3 — Definição das Tools e erros de execução

**Objetivo:** Tools no formato da spec e erros de tool separados de erros de protocolo.

**Ref.:** [Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools.md)

### 3.A — Schema das tools

- [ ] **3.A.1** Adicionar **`title`** em cada ferramenta (nome legível para o usuário).
- [ ] **3.A.2** Revisar **`inputSchema`** de todas as tools:
  - JSON Schema válido (ex.: 2020-12).
  - Para tools sem parâmetros: `{ "type": "object", "additionalProperties": false }`.
  - `required` definido para parâmetros obrigatórios.
- [ ] **3.A.3** (Opcional) Paginação em `tools/list`: aceitar `params.cursor` e retornar `nextCursor` quando houver mais itens.

### 3.B — Erros de execução vs protocolo

- [ ] **3.B.1** Para falhas **dentro** da execução da tool (API Kommo falhou, argumento inválido, regra de negócio):
  - Responder com **`result`** (não `error`): `{ "content": [{ "type": "text", "text": "mensagem útil" }], "isError": true }`.
  - Manter status HTTP 200 para o POST (o “erro” está no conteúdo do result).
- [ ] **3.B.2** Manter erros **JSON-RPC** (`error`) apenas para: ferramenta inexistente, request malformado, erros de servidor (ex.: 500).
- [ ] **3.B.3** Documentar no código ou em ADR quando usar `isError: true` vs `error` JSON-RPC.

**Entregável:** Lista de tools com `title` e `inputSchema` corretos; erros de negócio/API retornados com `isError: true`.

---

## Fase 4 — Segurança (Streamable HTTP)

**Objetivo:** Aderir às recomendações de segurança da spec para HTTP.

**Ref.:** [Transports - Security Warning](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md), [Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices.md)

- [ ] **4.1** Validar o header **`Origin`** em todas as requisições ao endpoint MCP.
  - Se presente e inválido (ex.: lista de origens permitidas ou regra definida): responder **403 Forbidden** (body opcional).
  - Documentar quais origens são aceites (ex.: localhost, Cursor, lista configurável).
- [ ] **4.2** Em ambiente local, por configuração ou default, escutar apenas em **127.0.0.1** (não 0.0.0.0), a menos que explicitamente configurado para rede.
- [ ] **4.3** Definir e implementar autenticação para o endpoint MCP:
  - Ex.: Bearer token, API key em header, ou OAuth (conforme ambiente).
  - Rejeitar requisições não autenticadas com 401 (e documentar no README como obter/configurar o token).

**Entregável:** Servidor com validação de Origin, binding local configurável e autenticação documentada e ativa.

---

## Fase 5 — Notificações (tools/list_changed)

**Objetivo:** Suportar notificação quando a lista de tools mudar (se aplicável).

**Ref.:** [Tools - List Changed Notification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools.md)

- [ ] **5.1** Decidir se a lista de tools pode mudar em runtime (ex.: por configuração, feature flags).
  - Se **não**: manter `capabilities.tools.listChanged: false` no initialize (Fase 1) e não implementar envio.
  - Se **sim**: seguir 5.2 e 5.3.
- [ ] **5.2** No `initialize`, declarar `capabilities.tools.listChanged: true`.
- [ ] **5.3** Sempre que a lista de tools mudar, enviar ao cliente a notificação JSON-RPC: `{ "jsonrpc": "2.0", "method": "notifications/tools/list_changed" }` (no canal SSE apropriado, se usar SSE).

**Entregável:** Clientes notificados em tempo real quando as tools mudarem (se listChanged for true).

---

## Fase 6 — Resources e Prompts

**Objetivo:** Expor dados e templates via primitivos MCP além de tools.

**Ref.:** [Primitives](https://modelcontextprotocol.io/docs/learn/architecture#primitives), [Resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources.md), [Prompts](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts.md)

- [ ] **6.1** No `initialize`, declarar capacidades **`resources`** e/ou **`prompts`** conforme o que for implementado.
- [ ] **6.2** **Resources** (opcional):
  - Implementar `resources/list` e `resources/read` (ou `resources/subscribe` se suportado).
  - Ex.: recurso `kommo://reports/sales`, `kommo://pipelines`, ou schema da API.
- [ ] **6.3** **Prompts** (opcional):
  - Implementar `prompts/list` e `prompts/get`.
  - Ex.: “Analisar vendas do mês”, “Resumo de leads por status”, integrados ao fluxo do `ask_kommo` se fizer sentido.

**Entregável:** Servidor expõe Resources e/ou Prompts; clientes podem listar e usar esses primitivos.

---

## Fase 7 — Migração para o SDK oficial (opcional)

**Objetivo:** Reduzir erros de protocolo e facilitar manutenção usando o SDK.

**Ref.:** [SDKs](https://modelcontextprotocol.io/docs/sdk), [Build server - TypeScript](https://modelcontextprotocol.io/docs/develop/build-server)

- [ ] **7.1** Avaliar SDK `@modelcontextprotocol/sdk` (versão e suporte a Streamable HTTP no Node/Express).
- [ ] **7.2** Decidir estratégia: substituir toda a camada MCP pelo SDK ou apenas lifecycle + mensagens, mantendo Express para HTTP.
- [ ] **7.3** Implementar servidor (ou adaptador) usando o SDK para: initialize, initialized, tools/list, tools/call, e opcionalmente resources/prompts/notifications.
- [ ] **7.4** Manter a lógica de negócio Kommo (KommoAPI, ask_kommo, cache, etc.) em módulos separados, chamados pelo handler do SDK.
- [ ] **7.5** Remover código duplicado de parsing/roteamento JSON-RPC e testes manuais; adicionar testes de integração com cliente MCP (ex.: MCP Inspector).

**Entregável:** Servidor baseado no SDK oficial, com comportamento igual ou melhor ao atual.

---

## Cronograma sugerido (ordem de execução)

1. **Fase 1** (Lifecycle) — base para o resto.
2. **Fase 2** (Transporte HTTP) — headers e sessão.
3. **Fase 3** (Tools + erros) — pode ser feita em paralelo ou logo após 1.
4. **Fase 4** (Segurança) — pode ser feita em paralelo após 2.
5. **Fase 5** (Notificações) — depois de 1 e 2.
6. **Fase 6** (Resources/Prompts) — quando as tools estiverem estáveis.
7. **Fase 7** (SDK) — opcional; pode ser feita após 1–4 para reduzir risco.

---

## Referências

- [What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Architecture overview](https://modelcontextprotocol.io/docs/learn/architecture)
- [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)
- [Lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle.md)
- [Tools (spec)](https://modelcontextprotocol.io/specification/2025-11-25/server/tools.md)
- [Transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md)
- [Documentation index (llms.txt)](https://modelcontextprotocol.io/llms.txt)
