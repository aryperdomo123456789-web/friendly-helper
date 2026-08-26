# Plano de deploy reversível, HTTPS e operação não-root — 2026-08-26

## Estado atual

A produção usa `/www/wwwroot/stream.mago-bot.com` como diretório vivo. O PM2 carrega `deploy/ecosystem.config.cjs`, que delega para `deploy/pm2/ecosystem.config.cjs` e mantém quatro processos: main na porta 6873, player na 6874, payments na 6875 e worker sem porta. Os três serviços HTTP escutam em `127.0.0.1`; o Nginx/aaPanel faz a exposição pública. Os wrappers carregam `.env` do diretório vivo e executam o Node configurado pelo aaPanel.

O risco atual é que o build e os artefatos `.output` ficam no mesmo diretório usado pelos processos. Isso permite uma janela em que o frontend aponta para chunks que ainda não existem ou mistura arquivos de builds diferentes. A auditoria observou uma janela anterior de assets ausentes/500. Os processos também executam como `root`, e a configuração PM2 aplica `max_memory_restart=512M` a todos, embora o worker já tenha ultrapassado esse limite antes de ser reiniciado.

## Sequência segura proposta

1. Fazer backup verificável do diretório editável, do dump do banco e do estado PM2. Não incluir `.env`, `storage/`, `.storage/`, logs ou playlists no backup de código; os segredos devem ser protegidos por mecanismo separado.
2. Construir em diretório de release fora do caminho vivo, usando o commit exato a publicar. Validar `npm run test:worker`, `npm run build`, existência dos quatro entrypoints e ausência de arquivos esperados ausentes.
3. Executar smoke checks locais contra o release, incluindo `/healthz` dos serviços que oferecem health check, resposta pública do domínio, assets referenciados pelo `index.html` e uma rota autenticada somente com sessão de teste autorizada.
4. Parar a publicação se qualquer check falhar. Nenhum `pm2 restart`, `reload`, `nginx -t`, `systemctl reload` ou troca de symlink deve ocorrer antes da janela aprovada.
5. Fazer a troca atômica do ponteiro `current` ou de um diretório de artefatos versionado. PM2 deve apontar para esse release imutável; o release anterior deve permanecer disponível para rollback.
6. Recarregar os serviços na ordem main/player/payments/worker somente com plano aprovado, monitorar logs e health checks, e manter o release anterior intacto até o período de observação terminar.
7. Em rollback, apontar PM2 para o release anterior, restaurar o dump somente se houver alteração de schema incompatível e repetir os smoke checks. Não usar `git reset --hard`, force push ou remoção de histórico.

## HTTPS e exposição de portas

O Nginx versionado já possui redirect de 80 para HTTPS e proxy para `127.0.0.1:6873`, com `X-Forwarded-Proto`. Antes de qualquer alteração no aaPanel, deve-se conferir o vhost efetivo, certificados, `nginx -t`, validade do certificado, HSTS em janela própria e se as portas 6873–6875 permanecem inacessíveis externamente. O worker não deve abrir porta. A administração do aaPanel deve ser restrita por firewall/allowlist conforme a política do provedor.

## Migração para operação não-root

A migração exige criar ou confirmar um usuário de serviço dedicado, atribuir somente leitura aos artefatos de código, escrita apenas em `logs/`, caches e diretórios de runtime, e proteger `.env` com modo 600 e grupo apropriado. O PM2 deve ser salvo no contexto desse usuário e testado após logout/login. A sequência deve começar por um processo de staging, seguir com `pm2 save`/backup do estado e só então avaliar cada serviço em produção. Não aplicar `chown`, alterar PM2 ou reiniciar serviços durante uma auditoria read-only.

## Critérios de aceite

O deploy só será considerado aprovado se o release tiver hash identificável, build reproduzível, rollback executável, domínio HTTPS respondendo, portas internas não expostas, quatro processos estáveis, worker sem crescimento contínuo de memória, `.env` sem exposição de valores em logs e nenhum dado de runtime versionado.
