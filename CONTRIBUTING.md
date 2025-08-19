# Contribuindo para o Kommo MCP Server

Obrigado por considerar contribuir para o Kommo MCP Server! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### 1. Fork e Clone
1. Faça um fork do repositório
2. Clone seu fork localmente:
   ```bash
   git clone https://github.com/SEU_USUARIO/kommo-mcp.git
   cd kommo-mcp
   ```

### 2. Configuração do Ambiente
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas credenciais do Kommo
   ```

3. Compile o projeto:
   ```bash
   npm run build
   ```

### 3. Desenvolvimento
1. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. Faça suas alterações seguindo as diretrizes de código

3. Teste suas alterações:
   ```bash
   npm run build
   npm run dev
   ```

### 4. Commit e Push
1. Adicione suas alterações:
   ```bash
   git add .
   ```

2. Faça o commit com uma mensagem descritiva:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```

3. Push para sua branch:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

### 5. Pull Request
1. Crie um Pull Request no GitHub
2. Descreva suas alterações detalhadamente
3. Aguarde a revisão

## 📋 Diretrizes de Código

### TypeScript
- Use TypeScript para todo o código
- Defina interfaces para todos os tipos
- Use tipos estritos e evite `any`

### Estrutura de Arquivos
```
src/
├── index.ts          # Servidor MCP principal
├── index-http.ts     # Servidor MCP HTTP
└── kommo-api.ts      # Classe de integração com API
```

### Convenções de Nomenclatura
- **Funções**: camelCase
- **Interfaces**: PascalCase com prefixo `Kommo`
- **Constantes**: UPPER_SNAKE_CASE
- **Arquivos**: kebab-case

### Mensagens de Commit
Use o padrão Conventional Commits:
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` tarefas de manutenção

## 🧪 Testes

### Executar Testes
```bash
npm test
```

### Cobertura de Testes
```bash
npm run test:coverage
```

## 📚 Documentação

### Atualizar README
- Documente novas funcionalidades
- Atualize exemplos de uso
- Mantenha a estrutura organizada

### Comentários de Código
- Comente funções complexas
- Documente parâmetros importantes
- Use JSDoc para APIs públicas

## 🔧 Configuração do Ambiente de Desenvolvimento

### VS Code Extensions Recomendadas
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Docker

### Configurações Recomendadas
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🐛 Reportando Bugs

### Template de Bug Report
```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Comportamento Atual**
O que está acontecendo.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [ex: Ubuntu 20.04]
- Node.js: [ex: 18.0.0]
- Versão do projeto: [ex: 1.0.0]

**Informações Adicionais**
Qualquer outra informação relevante.
```

## 💡 Sugerindo Funcionalidades

### Template de Feature Request
```markdown
**Descrição da Funcionalidade**
Descrição clara da funcionalidade desejada.

**Problema que Resolve**
Qual problema esta funcionalidade resolveria.

**Solução Proposta**
Como você imagina que deveria funcionar.

**Alternativas Consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Qualquer contexto adicional.
```

## 📞 Suporte

Se você tiver dúvidas ou precisar de ajuda:
- Abra uma issue no GitHub
- Consulte a documentação
- Verifique os exemplos no README

## 🎉 Agradecimentos

Obrigado por contribuir para o Kommo MCP Server! Suas contribuições ajudam a tornar este projeto melhor para todos.
