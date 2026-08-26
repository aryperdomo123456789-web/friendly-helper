# Checklist Simples - M3U Por Servidor

Atualizado em: 2026-08-16

## Objetivo

Garantir que cada servidor tenha:

- seu `server_id`
- sua própria pasta
- sua própria M3U
- seus próprios canais, filmes e séries
- refresh só do servidor ativo

## Checklist De Implementação

- [ ] Confirmar que cada servidor já tem `server_id` único.
- [ ] Criar ou validar a pasta base do cache local.
- [ ] Garantir pasta separada por servidor.
- [ ] Salvar a M3U completa dentro da pasta do próprio servidor.
- [ ] Separar a M3U em:
  - [ ] canais
  - [ ] filmes
  - [ ] séries
- [ ] Salvar catálogo e mídia só dentro da pasta daquele servidor.
- [ ] Garantir que o sistema leia primeiro o cache local daquele servidor.
- [ ] Garantir fallback para banco e Xtream se o local falhar.
- [ ] Ao trocar de servidor na tela, limpar o estado antigo.
- [ ] Ao trocar de servidor, carregar só os dados do novo `server_id`.
- [ ] No botão "Recarregar M3U", apagar só a pasta do servidor ativo.
- [ ] No botão "Recarregar M3U", baixar tudo de novo.
- [ ] No botão "Recarregar M3U", reorganizar canais, filmes e séries.
- [ ] Garantir que um servidor nunca sobrescreva outro.
- [ ] Validar que a UI não mostra dados antigos enquanto o novo servidor carrega.
- [ ] Testar troca rápida entre PORTAL1 e PORTAL2.
- [ ] Testar recarga manual em um servidor sem afetar os outros.
- [ ] Reiniciar os processos PM2 após aplicar a mudança.

## Checklist De Validação

- [ ] Abrir o servidor A e verificar catálogo correto.
- [ ] Trocar para o servidor B e verificar que o catálogo mudou.
- [ ] Voltar para o servidor A e confirmar que o conteúdo continua certo.
- [ ] Clicar em "Recarregar M3U" no servidor A.
- [ ] Confirmar que somente o servidor A foi limpo e recriado.
- [ ] Confirmar que o servidor B continua intacto.
- [ ] Confirmar que canais, filmes e séries continuam separados.
- [ ] Confirmar que o player continua funcionando.

## Regra De Ouro

Se for mexer em cache:

- sempre usar `server_id`
- sempre isolar por pasta
- nunca limpar todos os servidores juntos
- nunca misturar conteúdo entre servidores

