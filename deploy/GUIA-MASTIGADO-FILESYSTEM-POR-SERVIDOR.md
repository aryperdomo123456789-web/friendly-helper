# Guia Mastigado: M3U Por Servidor Sem Embolar

Atualizado em: 2026-08-16

Este guia explica, de forma simples, como o sistema deve guardar a M3U de cada servidor sem misturar nada.

## 1. Regra Principal

Cada servidor tem:

- um `server_id`
- uma pasta própria
- uma M3U própria
- seus próprios canais
- seus próprios filmes
- suas próprias séries

Um servidor nunca pode usar a pasta do outro.

## 2. O Que Deve Acontecer

### Quando o servidor é criado

1. o sistema salva o servidor no banco
2. pega o `server_id`
3. cria a pasta daquele servidor
4. baixa a M3U daquele servidor
5. separa a lista em:
   - canais
   - filmes
   - séries
6. salva tudo só naquela pasta

### Quando o dono troca de servidor na tela

1. a tela muda de servidor
2. o sistema limpa o estado antigo
3. carrega o novo `server_id`
4. lê só a M3U e os dados daquele servidor
5. não reaproveita conteúdo do servidor anterior

### Quando o dono clica em “Recarregar M3U”

1. o sistema pega o `server_id` do servidor ativo
2. apaga só a pasta daquele servidor
3. baixa a M3U de novo
4. reorganiza canais, filmes e séries
5. salva tudo outra vez só para aquele servidor

## 3. Pasta Local

### Pasta atual no código

Hoje o cache local está em:

```text
/www/wwwroot/stream.mago-bot.com/.storage/server-filesystem-cache/
```

### Pasta alvo desejada

Se quiser deixar no formato mais bonito no aaPanel, o alvo é:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

Dentro dela:

```text
{server_id}/
  m3u/
    playlist.m3u
    playlist.meta.json
  catalog/
    live/
    movie/
    series/
  media/
    posters/
    covers/
    logos/
```

## 4. O Que Já Existe No Código

O código já tem base pronta para:

- cache local por servidor
- lock por servidor
- limpeza só do servidor certo
- refresh manual só daquele servidor
- fallback em banco quando o local falhar

Arquivos principais:

- [`src/lib/server-filesystem-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.server.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [`src/routes/_authenticated/painel.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)

## 5. O Que Falta Se Quiser O Caminho Final No aaPanel

Se a ideia for sair da pasta `.storage` e ir para `storage/servers/{server_id}`, o trabalho é só este:

1. mudar a raiz do cache local
2. manter a regra por `server_id`
3. manter a escrita atômica
4. manter o lock por servidor
5. manter o botão de recarregar apagando só aquele servidor

## 6. Ordem Segura De Implementação

### Passo 1

Criar a pasta base:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/
```

### Passo 2

Fazer cada servidor usar:

```text
/storage/servers/{server_id}/
```

### Passo 3

Salvar a M3U daquele servidor:

- `playlist.m3u`
- `playlist.meta.json`

### Passo 4

Salvar o catálogo separado:

- `live`
- `movie`
- `series`

### Passo 5

No botão **Recarregar M3U**:

1. apagar só a pasta do servidor ativo
2. baixar a M3U de novo
3. salvar tudo outra vez

## 7. Regra Para Não Misturar

Não fazer:

- usar uma M3U única para todos os servidores
- apagar todas as pastas quando só um servidor foi recarregado
- mostrar dados antigos enquanto o novo servidor carrega
- gravar canais de um servidor dentro da pasta de outro

## 8. Resumo Bem Curto

```text
server_id -> pasta própria -> M3U própria -> canais/filmes/séries próprios -> refresh só daquele servidor
```

Se quiser, o próximo passo pode ser eu transformar este guia em uma checklist de 10 linhas, bem prática, para o dev executar sem pensar muito.

