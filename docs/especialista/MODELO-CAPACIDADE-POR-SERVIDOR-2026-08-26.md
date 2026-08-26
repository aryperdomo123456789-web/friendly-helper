# Modelo de capacidade por servidor — 2026-08-26

## Regra de negócio

O cadastro de servidores representa origens de catálogo e não define a quantidade de ativos. Um operador pode registrar dezenas ou milhares de servidores e contratar até mil conexões ou mais em um único servidor. O limite comercial e operacional deve ser medido por capacidade contratada, conexões simultâneas e quotas por usuário.

`iptv_servers.connection_capacity` é opcional. Quando preenchido com valor positivo, representa a capacidade simultânea aceita para aquele servidor. Valor nulo mantém o comportamento de compatibilidade até que a capacidade seja configurada. `profiles.max_connections` continua limitando conexões simultâneas por usuário.

## Sessão e lease

`device_sessions` mantém a unicidade existente por `(user_id, device_id)` para não quebrar o comportamento atual. A nova coluna nullable `server_id` identifica a origem usada pelo dispositivo. O RPC `claim_device_session` serializa a decisão por usuário com advisory lock, remove leases sem heartbeat há mais de três minutos, verifica limite global do usuário e limite do servidor e atualiza `last_seen` atomicamente.

O heartbeat existente passa a enviar o servidor selecionado quando disponível, e `getPlaybackUrl` reivindica a sessão antes de emitir o token de playback. O contrato da URL de playback não muda. A coluna nullable e o fallback legado permitem que a aplicação compilada continue compatível até a migration ser aplicada, mas a capacidade por servidor só deve ser considerada ativa depois de validar o RPC em staging.

## Migration e rollout

A migration `20260826091000_server_connection_capacity.sql` é não destrutiva: adiciona coluna, índices e função `security definer` com `search_path=public`; revoga execução pública e concede o RPC somente a `service_role`. Não deve ser aplicada diretamente em produção sem backup, teste em staging e rollback documentado.

A ordem segura é: backup do banco, aplicação em staging, teste de sessão nova, renovação do mesmo dispositivo, troca de servidor, limite de usuário, limite de servidor, expiração de lease e remoção de acesso; depois backup de produção, aplicação em janela autorizada, publicação do código, smoke test e monitoramento. O rollback de código é o revert do commit. O rollback do banco deve ser uma migration posterior planejada, nunca remoção manual de coluna em horário de incidente.

## Observabilidade mínima

Registrar contagem de conexões por servidor, capacidade configurada, rejeições por `user_limit` e `server_limit`, idade do lease mais antigo, taxa de heartbeat e erros do RPC. Os logs não devem conter URL de origem, DNS com credenciais, tokens ou dados de usuário além do identificador técnico necessário e já redigido conforme a política de produção.

## Validação local

`npm run test:worker` passou com 3 testes e `npm run build` passou após a inclusão do campo no admin, do helper de lease, dos tipos gerados e das migrations. A migration não foi executada contra banco de produção nesta etapa.
