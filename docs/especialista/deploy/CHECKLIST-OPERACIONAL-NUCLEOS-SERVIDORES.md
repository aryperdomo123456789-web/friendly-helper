# Checklist Operacional Curto - Núcleos E Servidores

Atualizado em: 2026-08-16

Use este checklist para manter o sistema fluido, isolado e sem embolar entre servidores.

## 1. Antes De Mudar Algo

- [ ] Confirmar o `server_id` do servidor alvo.
- [ ] Confirmar que a ação é só para um servidor, nunca para todos.
- [ ] Confirmar que a aba ou tela não vai reaproveitar cache antigo.

## 2. Troca De Servidor

- [ ] Trocar o servidor ativo só pelo seletor correto.
- [ ] Limpar o estado antigo da tela.
- [ ] Recarregar somente os dados do novo `server_id`.
- [ ] Confirmar que PORTAL1, PORTAL2 e demais servidores não se misturaram.

## 3. Cache Local

- [ ] Verificar que o cache está indo para a pasta do servidor certo.
- [ ] Confirmar que a pasta é separada por `server_id`.
- [ ] Confirmar que canais, filmes e séries ficaram organizados dentro da mesma pasta do servidor.
- [ ] Confirmar que nenhum servidor escreveu na pasta de outro.

## 4. Botão Recarregar M3U

- [ ] Clicar apenas no servidor ativo.
- [ ] Apagar somente a pasta local daquele servidor.
- [ ] Baixar a M3U de novo.
- [ ] Reorganizar canais, filmes e séries.
- [ ] Confirmar que os outros servidores ficaram intactos.

## 5. Navegação Entre Abas

- [ ] Testar Início.
- [ ] Testar TV ao Vivo.
- [ ] Testar Filmes.
- [ ] Testar Séries.
- [ ] Confirmar que trocar de aba não trouxe conteúdo velho.
- [ ] Confirmar que a troca ficou leve e instantânea.

## 6. Player

- [ ] Abrir um canal.
- [ ] Abrir um filme.
- [ ] Abrir uma série.
- [ ] Confirmar que o player continua independente do catálogo.
- [ ] Confirmar que o player não herdou dados do servidor anterior.

## 7. Separação Por Núcleo

- [ ] Núcleo do usuário: só ver o que foi liberado para ele.
- [ ] Núcleo do dono: administrar sem afetar outros usuários.
- [ ] Núcleo do servidor: cada servidor isolado no seu espaço.
- [ ] Núcleo do worker: rodar em segundo plano sem travar a UI.

## 8. Validação Final

- [ ] Trocar rápido entre dois servidores.
- [ ] Recarregar um servidor e conferir se só ele mudou.
- [ ] Abrir as abas principais e conferir fluidez.
- [ ] Verificar que nada embolou entre contas, servidores ou caches.

## Regra De Ouro

Se for mexer em cache, lista ou refresh:

- [ ] usar `server_id`
- [ ] isolar por pasta
- [ ] não tocar nos demais servidores
- [ ] não reaproveitar estado antigo

