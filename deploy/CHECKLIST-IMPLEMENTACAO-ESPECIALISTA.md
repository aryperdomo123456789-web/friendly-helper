# Checklist de Implementacao Especialista

Atualizado em: 2026-08-14

Este documento consolida, de forma objetiva, o que ja foi implementado no projeto com base em:

- [DOCUMENTACAO_ESPECIALISTA.md](/www/wwwroot/stream.mago-bot.com/DOCUMENTACAO_ESPECIALISTA.md)
- [deploy/DOCUMENTACAO-ESPECIALISTA.md](/www/wwwroot/stream.mago-bot.com/deploy/DOCUMENTACAO-ESPECIALISTA.md)
- [PLANO_EXECUCAO_POR_FASES_MAGOPLAYERPRO.md](/www/wwwroot/stream.mago-bot.com/PLANO_EXECUCAO_POR_FASES_MAGOPLAYERPRO.md)

Objetivo:

- manter uma trilha clara do que ja foi entregue
- evitar regressao em fluxos que ja estavam estaveis
- servir como base para a sequencia natural das proximas fases

## 1. Base Operacional E Deploy

- [x] O projeto possui entrada de producao via PM2 com `stream-mago-bot`.
- [x] O start de producao foi alinhado para o preset correto de runtime Node.
- [x] O build de producao foi validado com `node-server`, compatível com `pm2`.
- [x] O processo foi reiniciado com `--update-env` e salvo com `pm2 save`.
- [x] O dominio publico voltou a responder `200` no upstream local e no proxy do nginx.
- [x] O PM2 foi preparado para operar em multi-servicos com `main`, `player`, `payments` e `worker`.
- [x] O build de producao passou a gerar os artefatos separados de `player`, `payments` e `worker`.
- [x] As rotas publicas de stream e webhook ganharam encaminhamento interno por URL dedicada, mantendo fallback local.

Evidencias tecnicas:

- `start-pm2.sh`
- `ecosystem.config.cjs`
- `.output/nitro.json`

## 2. Identidade Centralizada

- [x] A identidade visual principal passou a usar asset local como fallback.
- [x] O manifesto do app foi ajustado para apontar para branding local.
- [x] O root da aplicacao sincroniza titulo, favicon e metatags a partir da configuracao central.
- [x] A configuracao do sistema passou a ser a fonte principal de identidade do site.

Evidencias tecnicas:

- `src/lib/config.functions.ts`
- `src/routes/__root.tsx`
- `public/manifest.webmanifest`
- `public/brand/webplayer-brand.png`

## 3. Configuracao Central Do Sistema

- [x] A aba central do painel foi estruturada como fonte de configuracao global.
- [x] Campos de marca, dominio, URL base, TMDB e XMLTV estao ligados a configuracao persistida.
- [x] O painel exibe preview visual das identidades carregadas da configuracao central.
- [x] O fluxo de edicao da central foi mantido sem alterar a regra de negocio principal.

Evidencias tecnicas:

- `src/routes/_authenticated/painel.tsx`
- `src/components/owner-panel/`
- `src/lib/types.ts`

## 4. Nucleo De Servidores

- [x] Foram adicionadas migrations para endurecer o acesso e a integridade dos servidores.
- [x] As credenciais do servidor foram tratadas com mais protecao.
- [x] A listagem administrativa passou a seguir um fluxo mais controlado.
- [x] A ordenacao/reordem de servidores foi preparada de forma centralizada.
- [x] O cache de catalogo de servidor foi introduzido para reduzir custo de leitura.
- [x] A playlist M3U de cada servidor passou a ser armazenada localmente em banco.
- [x] O catalogo passou a derivar da M3U local como primeira preferencia de leitura.
- [x] O fluxo de fallback para Xtream foi preservado para nao quebrar o player quando a playlist local nao estiver disponivel.

Evidencias tecnicas:

- `supabase/migrations/20260813004323_restrict_server_credentials.sql`
- `supabase/migrations/20260814000000_admin_list_access_users.sql`
- `supabase/migrations/20260814010000_admin_reorder_iptv_servers.sql`
- `supabase/migrations/20260814020000_unique_server_credentials_per_server.sql`
- `supabase/migrations/20260814030000_server_catalog_cache.sql`
- `supabase/migrations/20260814050000_server_m3u_cache.sql`

## 5. Nucleo De Pagamentos

- [x] Foi criado o modelo de persistencia para pagamentos.
- [x] Foi criado o modelo de eventos de pagamento.
- [x] Foi criado o modelo de auditoria para eventos sensiveis.
- [x] O webhook do Mercado Pago passou a registrar o evento recebido.
- [x] O processamento aprovado agora cria rastreio financeiro no banco.
- [x] O fluxo gera registro de auditoria em cada etapa relevante.

Evidencias tecnicas:

- `supabase/migrations/20260814040000_payments_audit.sql`
- `src/lib/payments-tracking.functions.ts`
- `src/lib/payments.functions.ts`
- `src/routes/api/public/mercadopago-webhook.ts`

## 6. Nucleo De Chat E Comprovantes

- [x] O chat ganhou classificacao de mensagem por tipo.
- [x] Comprovantes de pagamento passaram a ser registrados como mensagem propria.
- [x] Eventos de pagamento passaram a poder ser anexados na thread correta.
- [x] O chat de suporte segue compatível com o fluxo existente.

Evidencias tecnicas:

- `supabase/migrations/20260814040000_payments_audit.sql`
- `src/lib/chat.functions.ts`
- `src/routes/_authenticated/suporte.tsx`

## 7. Nucleo De Auditoria

- [x] A auditoria passou a existir como trilha persistida em banco.
- [x] Acoes sensiveis de pagamento registram contexto, origem e destino.
- [x] O fluxo de teste tambem passou a gerar auditoria.

Evidencias tecnicas:

- `supabase/migrations/20260814040000_payments_audit.sql`
- `src/lib/payments-tracking.functions.ts`
- `src/lib/test-flow.functions.ts`

## 8. Fluxos Mantidos Sem Quebra

- [x] Login e permissao foram preservados.
- [x] Player e proxy de stream foram preservados.
- [x] Regras de acesso ja existentes continuam compatíveis.
- [x] Fluxos de usuario e dono seguem separados no comportamento atual.
- [x] A separacao visual por nucleo foi aplicada com shells dedicados para usuario e administrador.
- [x] As areas administrativas de listas grandes passaram a usar paginação server-side sem alterar a operacao.
- [x] A fila de suporte administrativa também foi paginada para reduzir carga e manter a navegação previsivel.
- [x] O suporte ganhou paginação de mensagens para manter a conversa leve e previsivel.
- [x] O chat flutuante da home passou a carregar mensagens recentes de forma paginada.
- [x] O sistema manteve o comportamento de producao apos o rebuild correto.

## 9. Validacao Final Feita

- [x] `bun run build:node` concluiu com sucesso.
- [x] `player` respondeu `200` em `/healthz` no bootstrap Node dedicado.
- [x] `payments` respondeu `200` em `/healthz` no bootstrap Node dedicado.
- [x] `worker` iniciou e encerrou limpo no bootstrap Node dedicado.
- [x] `pm2 restart stream-mago-bot --update-env` foi aplicado.
- [x] `pm2 save` foi executado para persistencia do estado.
- [x] `curl http://127.0.0.1:6873/` retornou `200`.
- [x] `curl https://stream.mago-bot.com/` retornou `200`.

## 10. Proxima Sequencia Natural

- [x] Expandir a interface administrativa com shells consistentes e paginação nas listas grandes restantes.
- [x] Paginacao aplicada também na fila de suporte do dono.
- [x] Expandir o checklist para cobrir os demais nucleos do plano por fase.
- [ ] Validar, em banco real, se todas as migrations novas ja foram aplicadas no ambiente alvo.
- [x] Separar o restante das rotas por nucleo, sem alterar a logica que ja funciona.
- [x] Evoluir paginação de forma incremental nas areas que estavam mais pesadas.
- [ ] Evoluir busca e auditoria de forma incremental.

## 11. Observacao De Operacao

Este checklist registra o que esta entregue no repositorio e o que foi validado no ambiente.
Se algum item de banco ainda nao tiver sido aplicado na instancia remota, ele permanece como pendencia operacional, nao como falha de codigo.

## 12. Status Operacional Consolidado

### Entregue no codigo

- [x] Shell do usuario separado do shell do dono.
- [x] Protecao por boundary para o conteúdo das rotas internas.
- [x] Monitor global de erros em runtime com canal visual leve.
- [x] Paginação server-side nas areas administrativas grandes.
- [x] Paginação do suporte do dono.
- [x] Paginação do chat do usuario e do chat flutuante.
- [x] Identidade centralizada em configuracao local e metadados.
- [x] Correção do erro intermitente do painel causado por leitura errada de resposta paginada.
- [x] Build de producao validado com sucesso.
- [x] Restart do processo em PM2 validado.
- [x] Salvamento do estado do PM2 validado.

### Entregue na logica de negocio

- [x] Fluxo de servidor com edicao segura de credenciais.
- [x] Fluxo de usuario com criacao e edicao sem preencher senha persistente indevida.
- [x] Chat com tipos de mensagem e comprovante de pagamento.
- [x] Pagamentos com rastreio e auditoria descritos na base tecnica do projeto.
- [x] Separacao visual por nucleos sem misturar dono e usuario.
- [x] Catálogo do player com cache local por servidor e fallback para o legado Xtream.

### Ainda depende de validacao no ambiente alvo

- [ ] Confirmar que `deploy/sql/01-schema.sql` foi aplicado no banco alvo correto.
- [ ] Confirmar que `deploy/sql/02-dados-base.sql` foi aplicado apenas quando a sincronizacao da base oficial for desejada.
- [ ] Confirmar que `deploy/seed/seed-users.mjs` foi executado no banco alvo quando necessario.
- [ ] Validar em banco real as colunas de indicacao em `profiles`.
- [ ] Validar em banco real as tabelas `payments`, `payment_events`, `audit_logs` e `notifications`.
- [ ] Validar em banco real a nova tabela `iptv_server_m3u_cache` e a carga inicial das playlists por servidor.

### Ainda falta para fechar o plano por completo

- [ ] Evolucao mais ampla de realtime nas telas sensiveis ao vivo.
- [ ] Hardening final de logs tecnicos, alertas e permissões.
- [ ] Revisao final de indices e estados vazios em listas de grande volume.
- [ ] Revisao final de consistencia entre banco, webhook e UI em producao.
- [ ] Fechar a cobertura documental com um checklist por fase ainda mais detalhado, se a equipe quiser acompanhar por entrega.

### Proximo passo recomendado

1. Validar o banco remoto.
2. Fechar a fase de realtime onde realmente houver ganho operacional.
3. Consolidar o hardening final sem alterar player, login ou proxy.
