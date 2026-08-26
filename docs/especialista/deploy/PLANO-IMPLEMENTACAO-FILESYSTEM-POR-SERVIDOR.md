# Plano De Implementacao Em Fases - Filesystem Local Por Servidor

Atualizado em: 2026-08-16

Este plano detalha a evolucao proposta para sair do cache apenas em banco e adicionar uma camada de filesystem local por servidor em `/www/wwwroot/stream.mago-bot.com/storage/...`.

O foco e:

- manter os fluxos que ja funcionam
- evitar mistura entre servidores
- permitir recarga individual por `server_id`
- acelerar leitura de M3U, catalogo e midia
- preservar fallback seguro para banco e Xtream

## Status Da Entrega

Implementacao aplicada em 2026-08-16:

- [`src/lib/server-filesystem-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.server.ts) criada
- [`src/lib/server-media-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-media-cache.server.ts) criada para cache local de imagens
- leitura e escrita local por servidor conectadas em [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- refresh administrativo ajustado para limpar o local antes de baixar novamente
- exclusao de servidor passou a remover tambem os arquivos locais do servidor
- imagens de catalogo, posters e herois agora podem usar cache local por servidor quando roteadas por [`src/lib/media-url.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/media-url.ts)
- build validado e processos PM2 do projeto reiniciados

## 1. Regra De Ouro

Antes de qualquer alteracao:

- nao quebrar login
- nao quebrar player
- nao quebrar proxy de stream
- nao quebrar painel do dono
- nao quebrar os servidores que ja estao funcionando
- nao mover tudo de uma vez

O filesystem deve entrar como camada adicional, nao como substituicao brusca.

## 2. Arquivos A Criar

### 2.1 Camada de filesystem por servidor

Criar:

- [`src/lib/server-filesystem-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.server.ts)

Responsabilidades:

- montar paths por `server_id`
- garantir diretorios
- escrever arquivos de forma atomica
- ler JSON e M3U local
- remover cache de um servidor
- aplicar lock por servidor
- validar integridade basica dos arquivos

### 2.2 Tipos e contratos auxiliares

Criar, se necessario:

- [`src/lib/server-filesystem-cache.types.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.types.ts)

Responsabilidades:

- contratos de snapshot
- tipos de metadados
- tipos de catalogo serializado
- tipos de lock/estado

### 2.3 Script de bootstrap do storage

Criar, se necessario:

- [`scripts/init-server-storage.mjs`](/www/wwwroot/stream.mago-bot.com/scripts/init-server-storage.mjs)

Responsabilidades:

- criar a arvore base de `storage`
- preparar permissao e estrutura inicial
- opcionalmente validar se o ambiente suporta escrita

### 2.4 Script de limpeza controlada

Criar, se necessario:

- [`scripts/clean-server-storage.mjs`](/www/wwwroot/stream.mago-bot.com/scripts/clean-server-storage.mjs)

Responsabilidades:

- apagar cache de um `server_id` especifico
- nunca limpar tudo sem filtro
- proteger contra exclusao de pasta errada

### 2.5 Documento operacional da nova camada

Criar:

- [`ARQUITETURA-FILESYSTEM-POR-SERVIDOR.md`](/www/wwwroot/stream.mago-bot.com/ARQUITETURA-FILESYSTEM-POR-SERVIDOR.md)

Responsabilidades:

- documentar a estrutura final de pastas
- registrar naming convention
- registrar TTL e limpeza
- registrar fallback

## 3. Funcoes A Alterar

### 3.1 Cache e refresh de catalogo

Arquivo principal:

- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)

Funcoes a adaptar:

- `readServerCache`
- `writeServerCache`
- `clearServerCache`
- `readServerPlaylistCache`
- `writeServerPlaylistCache`
- `clearServerPlaylistCache`
- `refreshServerCatalogCache`

Objetivo da mudanca:

- manter o banco como fallback
- gravar tambem em filesystem por servidor
- ler filesystem primeiro quando existir
- manter refresh concorrente isolado por `server_id`

### 3.2 Leitura do catalogo pelo usuario

Arquivo principal:

- [`src/lib/player.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)

Funcoes a adaptar:

- `getCategories`
- `getStreams`
- `getSeriesInfo`
- `getVodInfo`
- `getChannelEPG`

Objetivo da mudanca:

- consultar filesystem primeiro
- cair para banco se faltar arquivo
- cair para Xtream se banco falhar
- manter a separacao por `server_id`

### 3.3 Fluxo administrativo de servidor

Arquivo principal:

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)

Funcoes a adaptar:

- `saveServer`
- `refreshServerCache`
- `deleteServer`

Objetivo da mudanca:

- ao salvar servidor, disparar refresh de filesystem daquele `server_id`
- ao recarregar, apagar somente a arvore daquele servidor
- ao excluir servidor, remover o cache fisico correspondente

### 3.4 Worker de manutencao

Arquivo principal:

- [`src/worker.ts`](/www/wwwroot/stream.mago-bot.com/src/worker.ts)

Funcao a adaptar:

- `refreshActiveServerCatalogs`

Objetivo da mudanca:

- depois do refresh atual, gravar tambem a camada filesystem
- opcionalmente validar integridade e limpeza

### 3.5 Proxy de imagem e midia

Arquivos relevantes:

- [`src/routes/api/public/image.ts`](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/image.ts)
- [`src/lib/media-url.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/media-url.ts)

Objetivo da mudanca:

- permitir cache local de midia por servidor, se a etapa for habilitada
- manter o proxy atual como fallback

## 4. Ordem Segura De Deploy

### Fase 1 - Preparar Sem Mudar O Comportamento

Objetivo:

- criar a camada de filesystem sem usar em producao ainda

Passos:

1. criar `server-filesystem-cache.server.ts`
2. criar os tipos auxiliares
3. criar a pasta base `storage/servers`
4. adicionar leitura/escrita atomica
5. adicionar locks por `server_id`

Saida esperada:

- o codigo compila
- nada da UI muda
- nenhuma rota principal troca de fonte ainda

### Fase 2 - Gravar Em Paralelo

Objetivo:

- salvar no filesystem e no banco ao mesmo tempo

Passos:

1. fazer `refreshServerCatalogCache` escrever a M3U local por servidor
2. fazer `refreshServerCatalogCache` escrever os JSONs derivados
3. manter as escritas em banco como fonte atual
4. nao alterar ainda o caminho de leitura principal

Saida esperada:

- o filesystem passa a ser populado
- o comportamento atual segue igual
- o risco operacional continua baixo

### Fase 3 - Ler Primeiro Do Local

Objetivo:

- usar filesystem como primeira leitura quando existir e estiver valido

Passos:

1. adaptar `getCategories`
2. adaptar `getStreams`
3. adaptar `getSeriesInfo`
4. adaptar `getVodInfo`
5. adaptar `getChannelEPG`
6. manter banco e Xtream como fallback

Saida esperada:

- telas mais rapidas
- menos chamadas remotas
- isolamento total por servidor

### Fase 4 - Recarga Individual Completa

Objetivo:

- garantir que o botao de recarregar apague e reconstrua somente o servidor alvo

Passos:

1. adaptar `refreshServerCache`
2. adaptar `deleteServer`
3. adaptar o worker para limpar e reconstruir por `server_id`
4. invalidar cache de frontend apenas do servidor afetado

Saida esperada:

- recarga limpa
- nenhum outro servidor tocado
- sem embolar conteudo entre servidores

### Fase 5 - Midia E Hardening

Objetivo:

- evoluir imagens e ativos para cache local opcional

Passos:

1. adicionar storage de midia por servidor
2. colocar TTL e limpeza
3. validar tamanho de pasta
4. criar rotina de prune

Saida esperada:

- posters, logos e covers mais rapidos
- limpeza previsivel

## 5. Checklist De Validacao Em Producao

### 5.1 Antes Do Deploy

- [ ] confirmar que o build atual continua verde
- [ ] confirmar que os 4 PM2 estao online
- [ ] confirmar que nenhum fluxo de login, player ou suporte foi alterado
- [ ] confirmar que os arquivos novos foram criados sem sobrescrever rotas estaveis

### 5.2 Validacao Da Fase 1

- [ ] `storage/servers/{server_id}` e criado quando necessario
- [ ] escrita atomica funciona
- [ ] leitura de JSON funciona
- [ ] lock por `server_id` impede corrida
- [ ] um servidor nao enxerga o cache do outro

### 5.3 Validacao Da Fase 2

- [ ] salvar servidor popula filesystem local
- [ ] refresh manual recria arquivos do servidor alvo
- [ ] o banco continua recebendo snapshot
- [ ] a UI continua funcionando como antes

### 5.4 Validacao Da Fase 3

- [ ] `/canais` abre usando dados do filesystem quando disponivel
- [ ] `/filmes` abre usando dados do filesystem quando disponivel
- [ ] `/series` abre usando dados do filesystem quando disponivel
- [ ] fallback para banco funciona se o arquivo faltar
- [ ] fallback para Xtream funciona se banco e filesystem falharem

### 5.5 Validacao Da Fase 4

- [ ] o botao de recarregar limpa apenas o `server_id` alvo
- [ ] recarga de um servidor nao altera outro
- [ ] lista M3U e catalogo sao reconstruidos
- [ ] o frontend invalida apenas as queries relacionadas

### 5.6 Validacao Da Fase 5

- [ ] imagens carregam do cache local quando habilitado
- [ ] o fallback de imagem segue funcional
- [ ] nao existe vazamento de midia entre servidores
- [ ] limpeza de midia respeita o diretorio do servidor

### 5.7 Validacao Final

- [ ] build de producao concluido
- [ ] `pm2 restart` aplicado
- [ ] `pm2 save` executado
- [ ] testes manuais em PORTAL1 e PORTAL2 confirmam isolamento
- [ ] categorias, filmes e series continuam fluindo
- [ ] nenhuma regressao foi introduzida nos fluxos perfeitos

## 6. Sequencia Recomendada De Execucao

1. criar a camada filesystem
2. gravar em paralelo sem mudar leitura
3. mover leitura para filesystem com fallback
4. ligar recarga individual ao filesystem
5. adicionar cache opcional de midia
6. validar em producao por servidor

## 7. O Que Nao Fazer

- nao trocar tudo por filesystem de uma vez
- nao remover o banco antes da leitura nova estar provada
- nao compartilhar pasta entre servidores
- nao limpar cache sem filtrar `server_id`
- nao misturar regras de live, movie e series
- nao alterar o player enquanto o cache estiver sendo migrado

## 8. Resultado Esperado

Ao fim desta evolucao, cada servidor tera:

- sua propria playlist M3U local
- seu proprio catalogo local
- sua propria midia local opcional
- seu proprio refresh isolado
- seu proprio fallback seguro

Isso entrega:

- mais rapidez
- mais previsibilidade
- menos dependencia de rede
- menos risco de mistura entre servidores
- mais controle operacional no Aapanel
