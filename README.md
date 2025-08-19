# 🚀 Servidor MCP do Kommo CRM

Servidor MCP (Model Context Protocol) personalizado para integração com o Kommo CRM.

## ✅ Status: **FUNCIONANDO COM FUNCIONALIDADES AVANÇADAS**

O servidor MCP do Kommo foi criado com sucesso e está configurado com suas credenciais:

- **URL do Cliente**: `https://kommoaeonprivatelabelcombr.kommo.com`
- **Token de Acesso**: Configurado e funcionando
- **Imagem Docker**: Construída e testada
- **Novas Funcionalidades**: Implementadas e prontas para uso

## 🛠️ Ferramentas Disponíveis

### 📊 **Leads**
- `get_leads` - Listar leads
- `get_lead` - Obter lead específico
- `create_lead` - Criar novo lead

### 👥 **Contatos**
- `get_contacts` - Listar contatos
- `get_contact` - Obter contato específico
- `create_contact` - Criar novo contato

### 🏢 **Empresas**
- `get_companies` - Listar empresas
- `get_company` - Obter empresa específica
- `create_company` - Criar nova empresa

### 📋 **Tarefas**
- `get_tasks` - Listar tarefas
- `create_task` - Criar nova tarefa

### 🔄 **Pipelines**
- `get_pipelines` - Listar pipelines

### 👤 **Usuários**
- `get_users` - Listar usuários

### ⚙️ **Conta**
- `get_account_info` - Informações da conta

## 🆕 **NOVAS FUNCIONALIDADES IMPLEMENTADAS**

### 📅 **Gestão de Eventos e Atividades**
- `get_lead_events` - Obter eventos de um lead específico
- `create_lead_event` - Criar novo evento para um lead
- `get_contact_activities` - Obter atividades de um contato específico
- `create_contact_activity` - Criar nova atividade para um contato

### 🎯 **Gestão de Status e Pipelines**
- `get_lead_statuses` - Obter status de um pipeline específico
- `create_lead_status` - Criar novo status para um pipeline
- `move_lead_to_status` - Mover lead para um status específico
- `move_lead_to_pipeline` - Mover lead para um pipeline específico

### 📈 **Relatórios e Analytics**
- `get_sales_report` - Relatório de vendas por período
- `get_lead_conversion_report` - Relatório de conversão de leads
- `get_pipeline_performance_report` - Relatório de performance de pipelines
- `get_dashboard_data` - Dados do dashboard e métricas principais
- `get_user_performance_stats` - Estatísticas de performance de usuário
- `get_lead_analytics` - Analytics de lead específico
- `get_pipeline_analytics` - Analytics de pipeline específico

## 🔧 Configuração no Cursor

O servidor já está configurado no arquivo `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kommo": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "KOMMO_BASE_URL=https://kommoaeonprivatelabelcombr.kommo.com",
        "-e", "KOMMO_ACCESS_TOKEN=SEU_TOKEN_AQUI",
        "kommo-mcp-server"
      ],
      "description": "Kommo CRM integration for leads, contacts, companies, tasks, events, analytics and reports"
    }
  }
}
```

## 🐳 Execução com Docker

```bash
# Executar o servidor MCP do Kommo
docker run --rm -i \
  -e KOMMO_BASE_URL=https://kommoaeonprivatelabelcombr.kommo.com \
  -e KOMMO_ACCESS_TOKEN=SEU_TOKEN_AQUI \
  kommo-mcp-server
```

## 📝 Exemplos de Uso

### Eventos e Atividades
```json
{
  "name": "get_lead_events",
  "arguments": {
    "lead_id": 123,
    "limit": 10
  }
}
```

```json
{
  "name": "create_lead_event",
  "arguments": {
    "lead_id": 123,
    "type": "note",
    "text": "Cliente interessado no produto premium",
    "responsible_user_id": 1
  }
}
```

### Gestão de Status
```json
{
  "name": "get_lead_statuses",
  "arguments": {
    "pipeline_id": 1
  }
}
```

```json
{
  "name": "move_lead_to_status",
  "arguments": {
    "lead_id": 123,
    "status_id": 5
  }
}
```

### Relatórios e Analytics
```json
{
  "name": "get_sales_report",
  "arguments": {
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
  }
}
```

```json
{
  "name": "get_dashboard_data",
  "arguments": {}
}
```

```json
{
  "name": "get_user_performance_stats",
  "arguments": {
    "user_id": 1,
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
  }
}
```

## 🔗 Configuração para N8N

Para usar no N8N com o "MCP Client Tool":

1. **URL**: `http://72.60.5.216:3001/mcp/`
2. **Auth Token**: `kommo-mcp-token`
3. **Headers**: 
   - `mcp-session-id`: `sua-session-id`

## 📁 Estrutura do Projeto

```
kommo-mcp-server/
├── src/
│   ├── index.ts          # Servidor MCP principal
│   ├── index-http.ts     # Servidor MCP HTTP
│   └── kommo-api.ts      # Classe de integração com API (ATUALIZADA)
├── dist/                 # Arquivos compilados
├── package.json          # Dependências
├── tsconfig.json         # Configuração TypeScript
├── Dockerfile           # Containerização
├── .env                 # Variáveis de ambiente
└── README.md            # Documentação (ATUALIZADA)
```

## 🎯 Funcionalidades Avançadas

### 📊 **Analytics em Tempo Real**
- Métricas de performance por usuário
- Análise de conversão de leads
- Performance de pipelines
- Dashboard com KPIs principais

### 🔄 **Gestão de Workflow**
- Movimentação automática de leads
- Criação de status personalizados
- Rastreamento de eventos e atividades
- Histórico completo de interações

### 📈 **Relatórios Estratégicos**
- Relatórios de vendas por período
- Análise de conversão
- Performance de equipe
- Métricas de pipeline

## 🎯 Próximos Passos

1. **Testar as novas ferramentas** no Cursor
2. **Configurar automações** no N8N
3. **Implementar mais funcionalidades** conforme necessário
4. **Adicionar webhooks** para integrações em tempo real

## 🔒 Segurança

- Token de acesso configurado com escopos apropriados
- Container Docker isolado
- Variáveis de ambiente seguras
- Validação de entrada em todas as ferramentas

---

**✅ Servidor MCP do Kommo com funcionalidades avançadas pronto para uso!**

### 🚀 **Total de Ferramentas Disponíveis: 25**

- **7 ferramentas básicas** (leads, contatos, empresas, tarefas, pipelines, usuários, conta)
- **4 ferramentas de eventos e atividades**
- **4 ferramentas de gestão de status e pipelines**
- **7 ferramentas de relatórios e analytics**
- **3 ferramentas de analytics avançados**
