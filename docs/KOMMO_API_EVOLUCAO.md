# Varedura da API Kommo e benefícios para o Kommo MCP

Análise com base na documentação e no [registro de alterações](https://pt-developers.kommo.com/changelog) da Kommo (PT). Fontes: [Kommo para desenvolvedores](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores), [Sobre a API da Kommo](https://pt-developers.kommo.com/reference/sobre-a-api-da-kommo), [Changelog](https://pt-developers.kommo.com/changelog), [Atualizações da API de Chats](https://pt-developers.kommo.com/changelog/chats-api-updates), [Recipes](https://pt-developers.kommo.com/recipes).

---

## 1. O que a Kommo oferece hoje (resumo)

| Área | Descrição | No Kommo MCP hoje? |
|------|-----------|---------------------|
| **API do CRM** | Leads, contatos, empresas, pipelines, tarefas, eventos, notas, tags, webhooks, etc. | Parcial (leads, contatos, empresas, pipelines, tarefas, eventos, status; relatórios e dashboard via métodos que podem divergir da doc) |
| **API de Chats** | Conectar canais, enviar/receber mensagens, histórico, reações, status de entrega | Não |
| **API de VoIP** | Chamadas, gravações, notificações | Não |
| **Webhooks** | Inscrição em eventos (mudança de contato, nova tarefa, etc.) | Não |
| **WEB SDK** | Widgets e modificação da interface | Não (servidor MCP não usa front) |
| **Salesbot** | Iniciar/parar bots, cenários de automação | Não |
| **Pipeline Digital** | Automação por eventos | Não |
| **Files API** | Upload/download, anexos a entidades | Não |

---

## 2. Evoluções da API em 2026 (changelog)

O [changelog](https://pt-developers.kommo.com/changelog) da Kommo usa datas relativas (“7 days ago”, “about 1 month ago”, etc.). Abaixo estão as mudanças que, em março de 2026, correspondem a **2026** (e ao fim de 2025 quando relevante).

### 2.1 Março 2026 (últimos dias)

- **Salesbot v4**
  - Endpoint para **iniciar** Salesbot atualizado para **v4**: `POST /api/v4/bots/run`.
  - **Novo**: endpoint para **parar** Salesbot: `POST /api/v4/bots/{id}/stop`.

- **Motivos da perda de leads**
  - **Novo**: [Lista de motivos da perda](https://pt-developers.kommo.com/reference/lista-de-motivos-de-perda): `GET /api/v4/leads/loss_reasons`.
  - **Novo**: [Motivo da perda por ID](https://pt-developers.kommo.com/reference/motivo-de-perda-por-id): `GET /api/v4/leads/loss_reasons/{id}`.

- **Menu (widgets)**
  - Chave `icon` descontinuada; usar `icons` (suporte a tema claro/escuro). Não impacta o MCP server atual.

### 2.2 Fevereiro 2026 (~1 mês atrás)

- **Notas**
  - **Novo**: [Fixar nota](https://pt-developers.kommo.com/reference/fixar-uma-nota): `POST /api/v4/{entity_type}/notes/{id}/pin`.
  - **Novo**: [Desafixar nota](https://pt-developers.kommo.com/reference/desafixar-uma-nota): `POST /api/v4/{entity_type}/notes/{id}/unpin`.

- **API de Chats**
  - Definição de **status de entrega** ao importar mensagem.

### 2.3 Fim de 2025 / início de 2026 (~3–4 meses atrás)

- **Documentação VoIP**: novos artigos sobre [integração de VoIP](https://pt-developers.kommo.com/docs/voip).
- **Atualizações da API de Chats** (detalhes em [changelog dedicado](https://pt-developers.kommo.com/changelog/chats-api-updates)):
  - Conexão de canais: parâmetro `is_time_window_disabled`.
  - Enviar/receber/importar mensagens: `event_type: edit_message`, `payload.message[media_duration]`, `payload.message[shared_post]`, `new_message[conversation_id]`, `sender_id`, `receiver_id`.
  - Criar novo chat: removido `user[ref_id]`.
  - Status de entrega: `delivery_status` renomeado para `status_code`; removido `msgid`.
  - Histórico de chat: `msec_timestamp`, `message[location]`, `message[contact]`.
  - Digitação: parâmetro `duration_ms`; reações: `conversation_ref_id`; webhook de digitação: `post_id`.
- **Callback `onInstall`** no `script.js` (widgets).

---

## 3. Estado atual do `kommo-api.ts`

- **Implementado**: Account, Leads (CRUD + getAllLeads), Contacts, Companies, Pipelines, Tasks, Users, Lead Events, Contact Activities, Lead Statuses, move lead (status/pipeline), getSalesReport, getLeadConversionReport, getPipelinePerformanceReport, getDashboardData, getUserPerformanceStats, getLeadAnalytics, getPipelineAnalytics, getLossReasons/getLossReason, pinNote/unpinNote, runSalesbot/stopSalesbot.
- **Não implementado** (e existente na doc/changelog):
  - **Motivos de perda**: `GET /api/v4/leads/loss_reasons`, `GET /api/v4/leads/loss_reasons/{id}`.
  - **Notas**: fixar/desafixar (`/api/v4/{entity_type}/notes/{id}/pin` e `.../unpin`). (Listar/criar/editar notas podem já existir noutros endpoints; a doc referencia “Obtendo a lista de notas”, “Adicionando notas”, etc.)
  - **Salesbot**: `POST /api/v4/bots/run`, `POST /api/v4/bots/{id}/stop`.
- **APIs não cobertas**: Chats, VoIP, Webhooks, Files (fora do escopo atual do MCP).

---

## 4. Como o Kommo MCP pode se beneficiar

### 4.1 API do CRM – endpoints novos (rápido)

| Recurso | Benefício | Ação sugerida |
|---------|-----------|----------------|
| **Motivos da perda de leads** | Relatórios e análises de “por que perdemos o lead”; preencher `loss_reason_id` com dados reais da conta. | Em `kommo-api.ts`: adicionar `getLossReasons()` e `getLossReason(id)`. No MCP: tool opcional `get_loss_reasons` e/ou recurso `kommo://loss_reasons`. |
| **Fixar/desafixar notas** | Destacar notas importantes em lead/contato/empresa. | Em `kommo-api.ts`: adicionar `pinNote(entityType, noteId)` e `unpinNote(entityType, noteId)`. No MCP: tools `pin_note` e `unpin_note` (ou uma só `update_note_pin`). |
| **Salesbot (iniciar/parar)** | Automação: a IA pode sugerir ou executar “iniciar/parar bot” para um lead. | Em `kommo-api.ts`: adicionar `runSalesbot(params)` e `stopSalesbot(botId)`. No MCP: tools `run_salesbot` e `stop_salesbot` (com cuidado de permissões e uso). |

### 4.2 Relatórios e analytics

- O projeto já chama `getSalesReport`, `getLeadConversionReport`, `getPipelinePerformanceReport`, `getDashboardData`, `getLeadAnalytics`, `getPipelineAnalytics`. Vale confirmar na [referência da API](https://pt-developers.kommo.com/reference/sobre-a-api-da-kommo) se os paths e parâmetros estão iguais (ex.: `/api/v4/leads/reports`, `/api/v4/dashboard`). Se algum endpoint tiver mudado ou sido descontinuado, ajustar em `kommo-api.ts` e nas tools MCP que os usam.

### 4.3 API de Chats (médio prazo)

- Se no futuro o MCP precisar de “conversas” (enviar mensagem, histórico, status de entrega), será outra camada: Chats API com autorização e endpoints próprios. As mudanças do changelog (status de entrega, `status_code`, novos campos em mensagens) são úteis quando implementar esse módulo.

### 4.4 Webhooks (médio/longo prazo)

- Webhooks permitem receber eventos em tempo real (novo lead, tarefa, mudança de contato). O MCP poderia expor “recursos” ou notificações MCP quando um webhook for recebido (ex.: “novo lead criado”), exigindo um servidor de destino e armazenamento de assinaturas.

### 4.5 Documentação e receitas

- [Recipes](https://pt-developers.kommo.com/recipes) (tutoriais): usar como guia para OAuth, captação de leads, etc., ao evoluir autenticação ou fluxos no MCP.
- Manter um link no README do projeto para a [documentação Kommo (PT)](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores) e para o [changelog](https://pt-developers.kommo.com/changelog).

---

## 5. Priorização sugerida

1. **Curto prazo (API CRM)**  
   - Implementar **motivos da perda** (`getLossReasons`, `getLossReason`) em `kommo-api.ts` e expor no MCP (tool ou resource).  
   - Implementar **fixar/desafixar notas** em `kommo-api.ts` e tools MCP correspondentes.

2. **Médio prazo (se fizer sentido para o produto)**  
   - Implementar **Salesbot** (run/stop) em `kommo-api.ts` e tools MCP, com documentação clara de permissões e riscos.  
   - Revisar endpoints de relatórios/dashboard/analytics contra a referência oficial.

3. **Longo prazo**  
   - Considerar Chats API (e eventualmente VoIP/Files) se o caso de uso do MCP passar a incluir mensagens e arquivos.  
   - Considerar Webhooks para eventos em tempo real.

---

## 6. Referências

- [Kommo para desenvolvedores](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores)
- [Sobre a API da Kommo](https://pt-developers.kommo.com/reference/sobre-a-api-da-kommo)
- [Changelog](https://pt-developers.kommo.com/changelog)
- [Atualizações da API de Chats](https://pt-developers.kommo.com/changelog/chats-api-updates)
- [Recipes (tutoriais)](https://pt-developers.kommo.com/recipes)
- Endpoints novos: [Lista de motivos de perda](https://pt-developers.kommo.com/reference/lista-de-motivos-de-perda), [Motivo de perda por ID](https://pt-developers.kommo.com/reference/motivo-de-perda-por-id), [Fixar nota](https://pt-developers.kommo.com/reference/fixar-uma-nota), [Desafixar nota](https://pt-developers.kommo.com/reference/desafixar-uma-nota), [Lançar Salesbots](https://pt-developers.kommo.com/reference/lancar-salesbots), [Parar Salesbot](https://pt-developers.kommo.com/reference/parar-salesbot)
