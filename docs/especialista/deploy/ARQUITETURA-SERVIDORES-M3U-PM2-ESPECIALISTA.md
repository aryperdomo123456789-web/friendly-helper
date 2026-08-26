# Arquitetura Especialista: Servidores, M3U Por `server_id` e PM2

Atualizado em: 2026-08-16

Este documento descreve, de forma objetiva, como o projeto `stream.mago-bot.com` deve tratar cada servidor IPTV como uma unidade isolada.

A regra principal é simples:

- cada servidor tem seu `server_id`
- cada servidor tem seu diretório próprio no filesystem local
- a M3U, catálogos e mídias nunca podem se misturar entre servidores
- a troca de servidor na interface precisa apenas trocar o contexto ativo, sem reaproveitar conteúdo antigo
- o botão de recarregar é o único ponto autorizado a apagar e baixar novamente a M3U local daquele servidor

## 1. Objetivo

O objetivo desta arquitetura é garantir:

- isolamento real entre servidores
- leitura rápida do catálogo
- refresh controlado e previsível
- menor chance de cache misturado
- operação fluida em múltiplas conexões simultâneas

## 2. Identidade Do Servidor

Cada servidor é tratado pelo seu `server_id`.

Esse identificador é a fronteira técnica do sistema.

Nada deve ser salvo, lido ou removido sem considerar primeiro o `server_id` ativo.

## 3. Estrutura Local No aaPanel

O armazenamento local recomendado fica dentro do próprio projeto em:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

### 3.1 M3U

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/m3u/playlist.m3u
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/m3u/playlist.meta.json
```

### 3.2 Catálogo

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/streams.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/streams.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/streams.json
```

### 3.3 Detalhes

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/vod-info/{vod_id}.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/series-info/{series_id}.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/epg/{stream_id}.json
```

### 3.4 Mídias

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/posters/
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/covers/
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/logos/
```

## 4. Regra De Operação Da M3U

### 4.1 Cadastro de servidor

Quando um novo servidor é cadastrado:

1. o sistema cria o registro do servidor
2. o `server_id` passa a ser a chave principal daquele núcleo
3. o sistema pode fazer o primeiro download da M3U
4. a M3U fica salva apenas no diretório daquele servidor
5. os catálogos derivados são reconstruídos apenas para aquele servidor

### 4.2 Recarregar M3U

Quando o dono clica em recarregar:

1. apagar apenas o diretório daquele `server_id`
2. baixar novamente a M3U
3. reconstruir os JSONs locais
4. substituir somente o conteúdo daquele servidor

### 4.3 Leitura normal

Em uso normal, a prioridade deve ser:

1. filesystem local do `server_id`
2. banco de dados/cache persistido
3. fallback Xtream

Se um servidor falhar, os outros continuam intactos.

## 5. Regras Para Não Embolar

Estas regras são obrigatórias:

- nunca usar cache genérico sem `server_id`
- nunca reaproveitar playlist de outro servidor
- nunca limpar todos os servidores ao recarregar apenas um
- nunca renderizar dados antigos enquanto o novo servidor está carregando
- nunca deixar a UI misturar categorias, canais ou filmes de servidores diferentes

## 6. Arquitetura Atual Em PM2

Hoje a produção está organizada em 4 processos PM2.

### 6.1 `stream-mago-bot`

Arquivo de start:

- [`deploy/pm2/start-main.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-main.sh)

Configuração:

- [`deploy/pm2/ecosystem.config.cjs`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/ecosystem.config.cjs)

Responsável por:

- interface principal
- páginas do usuário
- páginas do dono
- servidor HTTP principal
- navegação do catálogo
- troca de servidor na interface

Porta:

- `6873`

### 6.2 `stream-mago-bot-player`

Arquivo de start:

- [`deploy/pm2/start-player.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-player.sh)

Responsável por:

- player
- proxy de stream
- reprodução dos canais, filmes e séries
- validação de playback

Porta:

- `6874`

### 6.3 `stream-mago-bot-payments`

Arquivo de start:

- [`deploy/pm2/start-payments.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-payments.sh)

Responsável por:

- webhooks
- pagamentos
- auditoria financeira
- atualização de assinatura

Porta:

- `6875`

### 6.4 `stream-mago-bot-worker`

Arquivo de start:

- [`deploy/pm2/start-worker.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-worker.sh)

Responsável por:

- refresh em background
- sincronização de cache
- tarefas periódicas
- manutenção sem travar a UI

## 7. Fluxo Seguro Recomendado

### 7.1 Troca de servidor

Ao trocar de servidor na interface:

- o estado visual deve ser limpo
- o catálogo anterior não deve ser reaproveitado
- as queries antigas do servidor anterior devem ser descartadas
- o novo servidor carrega seu próprio diretório e seu próprio cache

### 7.2 Recarregar M3U

O botão de recarregar deve agir apenas no servidor ativo.

Fluxo correto:

1. identificar o `server_id`
2. apagar a árvore local daquele servidor
3. baixar a playlist novamente
4. regenerar live, movie e series
5. publicar o novo conteúdo só daquele servidor

### 7.3 Catálogo grande

Para manter o sistema rápido:

- páginas devem ser paginadas
- imagens devem ser pré-carregadas só quando visíveis
- o player deve ser isolado do carregamento do catálogo
- cada servidor precisa manter sua própria leitura local

## 8. O Que Não Deve Ser Feito

- não compartilhar `playlist.m3u` entre servidores
- não armazenar dados de PORTAL1 junto com PORTAL2
- não misturar cache de canais com cache de filmes e séries
- não limpar todos os servidores ao fazer refresh de um único servidor
- não depender de dados antigos da UI para mostrar o novo servidor

## 9. Resumo Operacional

Se quiser entender a operação em uma frase:

> cada servidor tem seu próprio `server_id`, seu próprio diretório local, sua própria M3U e seu próprio ciclo de refresh; o PM2 apenas separa os papéis de execução para a produção continuar fluida e sem embolar.

## 10. Referências Do Código

- [`deploy/pm2/ecosystem.config.cjs`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/ecosystem.config.cjs)
- [`deploy/pm2/start-main.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-main.sh)
- [`deploy/pm2/start-player.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-player.sh)
- [`deploy/pm2/start-payments.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-payments.sh)
- [`deploy/pm2/start-worker.sh`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-worker.sh)
- [`PROPOSTA-FILESYSTEM-POR-SERVIDOR-AAPANEL.md`](/www/wwwroot/stream.mago-bot.com/PROPOSTA-FILESYSTEM-POR-SERVIDOR-AAPANEL.md)

