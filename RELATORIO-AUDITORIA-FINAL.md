# Relatório de Auditoria e Migração — WebPlayer IPTV

## Status do Projeto
- **Repositório GitHub**: [friendly-helper](https://github.com/aryperdomo123456789-web/friendly-helper)
- **Status da Compilação**: OK (TanStack Start v1)
- **Porta de Produção**: 6873 (PM2)
- **Ambiente**: Pronto para Ubuntu 22.04 / aaPanel

## Auditoria de Segurança e Código
- **Separação de Camadas**: As funções servidoras usam `supabaseAdmin` apenas em runtime do servidor, evitando vazamento de segredos para o bundle do cliente.
- **Middleware de Autenticação**: As rotas sensíveis e funções de backend usam `requireSupabaseAuth`.
- **Prevenção de Mixed Content**: O stream usa proxy para resolver URLs e manter o player estável em produção.
- **Persistência**: O sistema de notificações e suporte usa tabelas dedicadas com RLS.

## Referências para Migração (Codex)
1. **Banco de Dados**
   - `deploy/sql/01-schema.sql`
   - `deploy/sql/02-dados-base.sql`
2. **Usuários**
   - `deploy/seed/users.json`
   - `deploy/seed/seed-users.mjs`
3. **Servidor Web / Proxy**
   - `deploy/nginx.conf`
   - `deploy/ecosystem.config.cjs`
4. **Guia de Execução**
   - `CODEX-RESTAURAR.md`

## Observação Importante
A `SUPABASE_SERVICE_ROLE_KEY` não deve ser enviada via GitHub. Ela precisa ser criada no painel do Supabase e colocada direto no `.env` da VPS.
