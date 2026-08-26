# Guia Especialista - MAGOPLAYERPRO

Este é o documento central para qualquer pessoa ou agente que precise entender,
operar ou evoluir o MAGOPLAYERPRO. Leia este guia antes de alterar o projeto.

## 1. Objetivo do sistema

O MAGOPLAYERPRO é uma plataforma de streaming/IPTV com autenticação, catálogo
de canais, filmes e séries, seleção de servidores, proxy de reprodução, painel
administrativo, suporte/chat, planos e integração de pagamentos.

O estado documentado aqui é o snapshot de produção existente no momento do
commit. A documentação deve orientar decisões sem substituir a validação no
código e no ambiente de produção.

## 2. Regras invioláveis

- Preservar login, sessão, permissões e autenticação.
- Preservar o player, o proxy de stream e o contrato das APIs consumidas pelo player.
- Preservar criação, edição, listagem e seleção de servidores.
- Não expor credenciais, tokens, `.env`, playlists ou cache de produção no Git.
- Não aplicar migrations destrutivas sem backup e confirmação explícita.
- Toda mudança sensível deve ter validação, logs e possibilidade de rollback.
- Separar sempre o contexto do usuário comum do contexto do dono/admin.

## 3. Ordem de leitura

1. `PLANO_EXECUCAO_POR_FASES_MAGOPLAYERPRO.md`
2. `DOCUMENTACAO_META_NUCLEOS_MAGOPLAYERPRO.md`
3. `DOCUMENTACAO_ESPECIALISTA.md`
4. `RELATORIO-AUDITORIA-FINAL.md`
5. `deploy/ESTADO-REAL-ALINHAMENTO-SERVIDORES-M3U-PM2.md`
6. Os checklists e planos específicos do domínio que será alterado.

## 4. Mapa técnico resumido

- Frontend e rotas: `src/routes/`.
- Componentes: `src/components/`.
- Regras de conta, catálogo, chat, pagamentos e dono: `src/lib/`.
- Endpoints públicos: `src/routes/api/public/`.
- Proxy e reprodução: `src/lib/stream-proxy.server.ts` e `src/routes/api/public/stream.ts`.
- Banco e evolução de schema: `supabase/migrations/`.
- Processos de produção: `deploy/pm2/`, `ecosystem.config.cjs` e arquivos `src/server-*.ts`.
- Documentação consolidada: este diretório.

## 5. Fluxos protegidos

Antes de qualquer alteração, testar pelo menos:

- login e manutenção da sessão;
- acesso comum e acesso do dono;
- seleção e renomeação de servidor;
- abertura de canais, filmes e séries;
- reprodução por proxy;
- criação e consulta de pagamento;
- webhook do Mercado Pago;
- isolamento do chat por usuário.

## 6. Como trabalhar com segurança

1. Identificar a fase do plano de execução relacionada à tarefa.
2. Mapear arquivos, tabelas, rotas e fluxos impactados.
3. Fazer a menor alteração possível.
4. Executar `npm run build`.
5. Revisar o diff e confirmar que nenhum segredo ou dado de runtime foi incluído.
6. Registrar a mudança na documentação ou no checklist correspondente.
7. Criar commit pequeno e descritivo.

## 7. Deploy e dados sensíveis

O código de deploy fica em `deploy/`; os documentos de deploy ficam em
`docs/especialista/deploy/`. Os diretórios `storage/` e `.storage/` são dados de
runtime e não devem ser versionados. O `.env` é local e não deve ser enviado.

Migrations devem ser aplicadas no banco correto e em ordem. Nunca usar dados
reais de produção em exemplos, commits ou documentação pública.

## 8. Critério de conclusão

Uma tarefa só está concluída quando o código, a documentação, a validação de
build e o estado do Git estiverem coerentes. Se o push para o GitHub falhar por
autenticação, manter o commit local e informar claramente o hash e o comando
necessário para concluir o envio.
