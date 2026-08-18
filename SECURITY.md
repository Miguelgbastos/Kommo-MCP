# Política de Segurança

## Versões com suporte

Somente a versão mais recente do `main` recebe correções de segurança.

| Versão | Suporte            |
| ------ | ------------------ |
| 2.x    | :white_check_mark: |
| < 2.0  | :x:                |

## Reportando uma vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança neste projeto, **não abra
uma issue pública**. Em vez disso:

1. Utilize o
   [GitHub Security Advisories](https://github.com/Miguelgbastos/Kommo-MCP/security/advisories/new)
   para reportar em modo privado; ou
2. Caso o formulário não esteja disponível, abra apenas uma solicitação sem
   detalhes sensíveis no perfil do mantenedor para combinar um canal privado.

Inclua no relatório:

- Uma descrição clara da vulnerabilidade
- Passos para reproduzir (incluindo, se possível, um proof-of-concept)
- Impacto potencial
- Sua sugestão de correção, se houver

## Meta de resposta

O projeto buscará confirmar o recebimento em até 5 dias úteis. Esse prazo é
uma meta, não uma garantia. A correção e a divulgação serão coordenadas de
acordo com a gravidade e a disponibilidade dos mantenedores.

## Boas práticas para usuários

- Nunca comite o arquivo `.env` ou credenciais em repositórios públicos.
- Rotacione o `KOMMO_ACCESS_TOKEN` periodicamente.
- Em produção, configure `MCP_AUTH_TOKEN` e restrinja `MCP_ALLOWED_ORIGINS`.
- Não exponha o servidor MCP diretamente à internet sem uma camada de
  autenticação/proxy à sua frente.
