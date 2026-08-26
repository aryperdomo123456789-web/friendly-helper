# Documentacao Especialista - Deploy e Garantia de Funcionamento

Este arquivo complementa a documentacao principal e deixa explicita a garantia operacional do MAGOPLAYERPRO.

## Garantia de identidade local

A marca visual principal do sistema eh servida localmente pelo proprio dominio:

- `public/brand/webplayer-brand.png`
- fallback interno de favicon/logo apontando para o mesmo ativo local

Isso reduz dependencia de rede externa e acelera o carregamento da tela inicial, favicon e imagem de compartilhamento.

## Garantia de funcionamento independente

O sistema continua funcional mesmo sem a URL remota da imagem, porque:

- o logo padrao foi alterado para um asset local
- a home e o shell usam o mesmo fallback local
- o manifesto do app tambem aponta para o arquivo local
- as rotas do player continuam usando proxy interno e nao dependem da imagem externa para reproduzir conteudo

## Ordem segura do banco

1. Rodar `deploy/sql/01-schema.sql`.
2. Validar as novas colunas e indices de indicacao em `profiles`.
3. Rodar `deploy/sql/02-dados-base.sql`.
4. Rodar `deploy/seed/seed-users.mjs` com `deploy/seed/users.json`.
5. Subir a aplicacao e validar login, donos, links e suporte.

## Observacao importante

Se o banco ainda nao tiver os novos campos de indicacao, o app pode abrir, mas o bonus e a rastreabilidade da origem nao ficam completos.

## Guias complementares

- `CHECKLIST-MIGRACAO-SQL-FINAL.md`
- `VARREDURA-DEPLOY-SEGURA.md`
