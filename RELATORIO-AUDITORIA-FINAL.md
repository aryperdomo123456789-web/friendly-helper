# Relatório de Auditoria e Migração — WebPlayer IPTV

## Status do Projeto
- **Repositório GitHub**: [friendly-helper](https://github.com/aryperdomo123456789-web/friendly-helper)
- **Status da Compilação**: OK (TanStack Start v1)
- **Porta de Produção**: 6873 (PM2)
- **Ambiente**: Pronto para Ubuntu 22.04 / aaPanel

## Auditoria de Segurança e Código
- **Separação de Camadas**: Refatoradas todas as `createServerFn` para garantir que `supabaseAdmin` seja carregado apenas no runtime do servidor (dentro dos handlers), evitando que segredos vazem para o bundle do cliente.
- **Middleware de Autenticação**: Todas as rotas sensíveis e funções de backend (Notificações, Suporte, Gestão de Usuários) agora utilizam `requireSupabaseAuth`.
- **Prevenção de Mixed Content**: Stream Proxy (`/api/public/stream`) configurado para converter HTTP em HTTPS e injetar User-Agents compatíveis (`VLC/3.0.21`).
- **Persistência**: Sistema de notificações e suporte agora salvos em tabelas dedicadas com RLS (Row Level Security) configurado.

## Referências para Migração (Codex)
Todos os arquivos necessários para restaurar o sistema em um novo ambiente estão localizados na pasta `/deploy`:

1.  **Banco de Dados**:
    - `deploy/sql/01-schema.sql`: Criação de tabelas, RLS, Grants e Funções.
    - `deploy/sql/02-dados-base.sql`: Planos, Servidores IPTV iniciais e Configurações globais.
2.  **Usuários**:
    - `deploy/seed/users.json`: Dados dos usuários atuais.
    - `deploy/seed/seed-users.mjs`: Script para importar usuários via Supabase Admin API (necessita `SERVICE_ROLE_KEY`).
3.  **Servidor Web / Proxy**:
    - `deploy/nginx.conf`: Configuração de Nginx isolada para porta 6873 com suporte a SSL e timeouts longos para stream.
    - `deploy/ecosystem.config.cjs`: Configuração do PM2 para rodar o processo Node.
4.  **Guia de Execução**:
    - `CODEX-RESTAURAR.md`: Roteiro passo a passo para o Codex restaurar o banco e subir o app.

## Observação Importante
A `SUPABASE_SERVICE_ROLE_KEY` **não deve ser enviada via GitHub**. O usuário deve criar um projeto em `supabase.com`, obter a chave no painel e configurá-la diretamente no `.env` do aaPanel.
