# Contribuindo para o Kommo MCP Server

Obrigado por considerar contribuir! Este guia explica como propor mudanças de
forma eficiente e alinhada às convenções do projeto.

Ao participar, você concorda em seguir o nosso
[Código de Conduta](CODE_OF_CONDUCT.md).

## Sumário

- [Como posso ajudar?](#como-posso-ajudar)
- [Reportando bugs](#reportando-bugs)
- [Sugerindo funcionalidades](#sugerindo-funcionalidades)
- [Fluxo de desenvolvimento](#fluxo-de-desenvolvimento)
- [Padrões de código](#padrões-de-código)
- [Mensagens de commit](#mensagens-de-commit)
- [Enviando um Pull Request](#enviando-um-pull-request)
- [Reportando vulnerabilidades](#reportando-vulnerabilidades)

## Como posso ajudar?

Existem várias formas de contribuir, mesmo sem escrever código:

- Reportar bugs e propor melhorias em [Issues](https://github.com/Miguelgbastos/Kommo-MCP/issues).
- Melhorar a documentação (README, `docs/`, exemplos de uso).
- Testar em novos clientes MCP (Cursor, Claude, etc.) e relatar problemas.
- Traduzir a documentação.
- Adicionar novas tools/resources/prompts que exponham funcionalidades da API
  do Kommo ainda não cobertas.

## Reportando bugs

Antes de abrir uma issue, verifique se já não existe uma
[issue aberta](https://github.com/Miguelgbastos/Kommo-MCP/issues) sobre o mesmo
assunto. Use o template de bug e inclua sempre:

- Versão do Node.js e do sistema operacional
- Passos para reproduzir
- Comportamento esperado vs. observado
- Logs relevantes (com dados sensíveis removidos)

## Sugerindo funcionalidades

Use o template de feature request para descrever:

- O problema que a funcionalidade resolveria
- A solução proposta e alternativas consideradas
- Se ela requer novas chamadas à API do Kommo, cite o endpoint
  correspondente na [documentação oficial](https://pt-developers.kommo.com/docs/kommo-para-desenvolvedores).

## Fluxo de desenvolvimento

### 1. Fork e clone

```bash
git clone https://github.com/SEU_USUARIO/Kommo-MCP.git
cd Kommo-MCP
```

### 2. Instalação

Requer **Node.js 20+**.

```bash
npm install
cp env.example .env
# edite .env com KOMMO_BASE_URL e KOMMO_ACCESS_TOKEN
```

### 3. Build e execução em desenvolvimento

```bash
npm run build      # compila TypeScript
npm run dev        # executa via ts-node
npm start          # executa o servidor compilado
npm run typecheck  # apenas verificação de tipos
npm test           # build e testes automatizados
npm run audit:prod # vulnerabilidades de produção
```

Servidor disponível em `http://127.0.0.1:3001/mcp`.

### 4. Criar uma branch

```bash
git checkout -b feat/nome-curto-descritivo
```

## Padrões de código

### TypeScript

- Todo código novo deve ser em TypeScript com `strict: true`.
- Evite `any` — prefira tipos explícitos ou `unknown` com type guards.
- Defina interfaces para respostas da API do Kommo em `src/kommo-api.ts`.

### Estrutura do projeto

```
src/
├── kommo-api.ts          # Cliente HTTP da API Kommo
├── ask-kommo.ts          # Lógica conversacional do tool ask_kommo
├── http-streamable.ts    # Servidor MCP HTTP (Streamable HTTP)
└── mcp/
    ├── server.ts             # Registro oficial de tools/resources/prompts
    ├── types.ts             # Tipos internos do MCP
    ├── tool-definitions.ts  # Schemas (inputSchema) das tools
    ├── tool-handlers.ts     # Handlers de execução das tools
    ├── resources.ts         # Definição de resources MCP
    └── prompts.ts           # Definição de prompts MCP
```

Ao adicionar uma nova tool:

1. Adicione o schema em `src/mcp/tool-definitions.ts`.
2. Implemente o handler em `src/mcp/tool-handlers.ts`.
3. Se necessário, adicione o método na classe de `src/kommo-api.ts`.
4. Documente a tool na tabela do `README.md`.
5. Adicione um teste de handler e, se houver chamada HTTP nova, um teste de
   contrato em `test/kommo-api.test.mjs`.

### Formatação e lint

```bash
npm run format        # aplica Prettier
npm run format:check  # apenas verifica
npm run lint          # ESLint
```

O CI executa `typecheck`, `lint`, `format:check`, testes, auditoria de
dependências de produção e build Docker em cada Pull Request.

### Convenções de nomenclatura

- Funções e variáveis: `camelCase`
- Interfaces e tipos: `PascalCase`
- Constantes de módulo: `UPPER_SNAKE_CASE`
- Arquivos: `kebab-case.ts`

## Mensagens de commit

Adotamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` alteração apenas de documentação
- `refactor:` refatoração sem mudança de comportamento
- `chore:` tarefas de manutenção (build, deps)
- `ci:` alterações no pipeline
- `test:` inclusão/ajuste de testes

Exemplo: `feat(tools): adiciona tool get_lead_by_email`.

## Enviando um Pull Request

1. Garanta que `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run format:check` e `npm run audit:prod` passam localmente.
2. Atualize o `README.md` e o `CHANGELOG.md` (seção _Unreleased_) quando
   aplicável.
3. Descreva claramente **o que muda** e **por quê** no PR — utilize o
   template.
4. Faça referência à issue relacionada (ex.: `Closes #12`).
5. Um mantenedor revisará o PR e pode solicitar ajustes.

PRs pequenos e focados são revisados mais rápido.

## Reportando vulnerabilidades

**Não** abra issues públicas para vulnerabilidades de segurança. Siga o
processo descrito em [SECURITY.md](SECURITY.md).

---

Obrigado por ajudar a tornar o Kommo MCP Server melhor!
