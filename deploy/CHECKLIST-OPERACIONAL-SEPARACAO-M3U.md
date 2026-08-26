# Checklist Operacional - Separação M3U por Servidor

Atualizado em: 2026-08-16

Use esta lista para validar produção sem risco de misturar servidores.

## Antes de mexer

- [ ] Confirmar o `server_id` alvo.
- [ ] Confirmar o nome do portal correto.
- [ ] Confirmar que o portal não está sendo usado por outra recarga ao mesmo tempo.
- [ ] Verificar se o servidor está ativo em `iptv_servers`.
- [ ] Verificar se existe credencial em `server_credentials` para esse `server_id`.

## Ao recarregar a M3U

- [ ] Abrir o painel do dono.
- [ ] Ir em **Servidores**.
- [ ] Clicar no botão **Recarregar M3U / Cache** apenas no portal desejado.
- [ ] Aguardar o estado visual do botão.
  - [ ] `Validando`
  - [ ] `Baixando`
  - [ ] `Concluído`
- [ ] Se aparecer `Falha`, não apagar nada manualmente antes de conferir o erro.

## O que conferir depois do reload

- [ ] Verificar se a M3U foi gravada só na pasta do `server_id` certo.
- [ ] Verificar se `playlist.json` e `playlist.m3u` foram atualizados só daquele servidor.
- [ ] Verificar se os caches de `live`, `movie` e `series` foram recriados só para esse servidor.
- [ ] Confirmar que outros servidores não tiveram cache alterado.

## Teste prático na UI

- [ ] Trocar para `Canais` e clicar em uma categoria.
- [ ] Confirmar que a lista do meio muda.
- [ ] Trocar para `Filmes` e repetir o teste.
- [ ] Trocar para `Séries` e repetir o teste.
- [ ] Trocar o servidor no seletor do topo.
- [ ] Confirmar que o conteúdo muda junto com o `server_id` selecionado.

## Critério de sucesso

- [ ] Cada servidor mostra apenas o próprio catálogo.
- [ ] Canais, filmes e séries ficam separados corretamente.
- [ ] O cache de um servidor não afeta o outro.
- [ ] A troca de categoria responde sem travar.
- [ ] A troca de servidor continua fluida.

## Se algo falhar

- [ ] Não usar a mesma recarga em outro portal ao mesmo tempo.
- [ ] Conferir a mensagem técnica exibida.
- [ ] Validar se o upstream respondeu `502` ou HTML inválido.
- [ ] Repetir o reload somente no `server_id` com problema.
- [ ] Se necessário, revisar a playlist local daquele servidor em `storage/servers/{server_id}/`.

