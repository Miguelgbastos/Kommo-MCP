# Matriz de compatibilidade

Esta matriz separa evidência automatizada de validação manual em clientes finais.

| Cliente / transporte | Protocolo | Estado | Evidência |
| --- | --- | --- | --- |
| SDK TypeScript oficial / HTTP | `2026-07-28` | Automatizado | descoberta, tools, resources, prompts e confirmação de escrita |
| SDK TypeScript oficial / HTTP | família 2025 | Automatizado | inicialização stateless e execução de tools |
| SDK TypeScript oficial / stdio | família 2025 | Automatizado | processo local, inicialização e `tools/list` |
| Cursor / stdio | automático | Pendente manual | requer versão do cliente, SO e conta Kommo de teste |
| Cursor / HTTP | automático | Pendente manual | requer versão do cliente, SO e conta Kommo de teste |
| Claude Desktop / stdio | automático | Pendente manual | requer versão do cliente, SO e conta Kommo de teste |
| Claude Desktop / conector remoto | automático | Pendente manual | requer endpoint HTTPS e conta Kommo de teste |

## Checklist manual para uma release

Registre cliente, versão, sistema operacional, commit testado e transporte. Para
cada combinação suportada, valide:

1. conexão e negociação do protocolo;
2. `tools/list`, `resources/list` e `prompts/list`;
3. uma tool somente leitura contra uma conta de teste;
4. uma escrita não destrutiva com confirmação explícita;
5. ausência de tokens e dados pessoais nos logs e mensagens de erro.

Testes automatizados do SDK não substituem essa evidência em produtos finais.
