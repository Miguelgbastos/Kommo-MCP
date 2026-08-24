# Manutenção do projeto

## Mantenedor atual

- [Miguel G. Bastos](https://github.com/Miguelgbastos)

## Revisão de contribuições

- Pull Requests devem ser pequenos, focados e passar pela CI.
- Mudanças incompatíveis precisam ser discutidas em uma issue antes do PR.
- Aprovação considera segurança, compatibilidade MCP, qualidade dos testes e
  impacto sobre usuários existentes.
- Não há garantia de prazo para revisão; disponibilidade é voluntária.

## Releases

O projeto usa Versionamento Semântico e mantém as mudanças em `CHANGELOG.md`.
Uma release deve possuir tag assinada ou verificável, notas de versão, CI verde
e instruções para qualquer migração necessária.

Antes de criar uma tag `v*`:

1. valide a matriz em `docs/COMPATIBILITY.md` com uma conta Kommo de teste;
2. confirme que a versão da tag coincide com `package.json`;
3. configure `NPM_TOKEN` no ambiente Actions — a release falha se ele estiver ausente;
4. execute `npm pack --dry-run` e revise o conteúdo do pacote;
5. confirme a publicação npm, as tags GHCR exata/minor/latest e o SBOM;
6. execute um smoke test instalando os artefatos publicados do zero.

## Decisões e segurança

Decisões públicas ocorrem em Issues e Discussions. Vulnerabilidades seguem o
canal privado descrito em `SECURITY.md`.
