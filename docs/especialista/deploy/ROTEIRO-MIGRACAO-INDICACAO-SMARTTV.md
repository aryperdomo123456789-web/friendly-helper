# Roteiro Seguro de Migração: Indicação + Smart TV

Este guia consolida o próximo passo após a estabilização do player e a implementação do endurecimento do fluxo de indicação.

## Objetivo

Aplicar somente o que é novidade e necessário para produção, preservando tudo o que já está funcionando no ambiente atual:

1. Gravar a origem real do link de indicação.
2. Garantir que o bônus seja atribuído ao dono correto do link usado.
3. Manter a navegação por controle remoto/Smart TV sem alterar a lógica de reprodução do player.

## Situação atual do sistema

- O player já está reproduzindo conteúdo.
- O layout principal e as rotas autenticadas continuam funcionando.
- O fluxo de teste grátis e indicação foi endurecido no backend.
- A navegação global por setas/Enter foi adicionada sem mexer na engine de reprodução.

## O que mudou no código

### Indicação

- A criação do usuário de teste agora grava explicitamente:
  - `referral_source_slug`
  - `referral_source_code`
  - `referral_source_url`
- O cálculo do bônus passou a priorizar a origem explícita salva no perfil.
- Se a origem explícita não existir, o sistema mantém fallback compatível com a lógica antiga.

### Smart TV

- Foi adicionado foco global com teclado remoto:
  - `ArrowUp`
  - `ArrowDown`
  - `ArrowLeft`
  - `ArrowRight`
  - `Enter`
- O player não foi reescrito nem teve o fluxo de reprodução alterado.
- Apenas a navegação e foco visual foram reforçados nos elementos interativos.

## O que precisa ser aplicado no banco

> Aplique nesta ordem para reduzir risco.

### 1. Estrutura

Rodar o arquivo:

- `deploy/sql/01-schema.sql`

Esse script adiciona as colunas e índices novos relacionados à indicação.

### 2. Base inicial

Rodar o arquivo:

- `deploy/sql/02-dados-base.sql`

Esse script mantém a base de configuração, planos, servidores e links padrão.

### 3. Seed de usuários

Rodar:

- `deploy/seed/users.json`
- `deploy/seed/seed-users.mjs`

Isso recria os usuários-base, vínculos e permissões.

## Ordem segura de execução

1. Fazer backup do banco antes de qualquer alteração.
2. Aplicar `01-schema.sql`.
3. Validar se as colunas novas existem em `profiles`.
4. Aplicar `02-dados-base.sql`.
5. Rodar o seed de usuários.
6. Subir a aplicação e testar login com:
   - `magodono`
   - `magodono123`
7. Testar um link de indicação real.
8. Confirmar que o bônus caiu no dono correto.
9. Testar navegação por controle remoto nas telas:
   - `inicio`
   - `canais`
   - `filmes`
   - `series`
   - `suporte`

## Validações que você deve conferir

### Indicação

- Ao criar um usuário via link de teste, o perfil deve guardar a origem do link.
- O bônus deve ser calculado pelo slug/origem real.
- O dono do link usado deve receber o crédito.

### Smart TV

- Setas devem mover o foco entre cards, botões e itens focáveis.
- `Enter` deve acionar o item em foco.
- O player deve continuar abrindo e reproduzindo normalmente.

### Aba do dono

- A aba do dono que cria links **não foi alterada visualmente** nesta etapa.
- O que mudou foi o comportamento por trás:
  - gravação da origem do link
  - rastreabilidade do bônus
  - retorno de dados mais completos em conta e auditoria

## Pontos de atenção

- Não recriar o player.
- Não mexer no fluxo de catálogo e reprodução que já está estável.
- Não remover os campos novos de indicação.
- Não apagar o usuário `@magodono`.

## Resultado esperado

Depois dessa migração:

- o sistema continua funcional;
- o fluxo de indicação fica auditável;
- o bônus fica amarrado ao dono correto;
- a navegação por controle remoto fica utilizável em Smart TV/Android TV;
- o ambiente fica pronto para testes ponta a ponta em produção.

