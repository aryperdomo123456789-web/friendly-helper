# Smoke test do Player Reliability v1 em produção

**Projeto:** MAGOPLAYERPRO

**Autor:** Manus AI

**Data:** 26 de agosto de 2026

**Ambiente:** produção HTTPS no aaPanel

**Status:** rollout concluído; QoE de mídia ainda não medida

## 1. Objetivo

Este relatório registra a validação controlada do Player Reliability v1 no domínio real. O objetivo foi confirmar que o build correto entrou em produção, que os processos estão saudáveis, que a autenticação e as permissões continuam funcionando e que o catálogo pode chegar ao player sem expor a origem IPTV.

A reprodução de mídia não é declarada como aprovada quando a conta laboratorial não possui conteúdo reproduzível. Essa distinção é obrigatória: um HTTP 200 e uma tela de catálogo não provam primeiro frame, buffering, recuperação ou qualidade de vídeo.

## 2. Rollout e integridade

O build foi transferido para área temporária, comparado por manifesto ordenado de SHA-256 e trocado atomicamente. O manifesto local e o manifesto do servidor foram iguais. O build anterior permanece preservado para rollback. Os processos `stream-mago-bot`, `stream-mago-bot-player`, `stream-mago-bot-payments` e `stream-mago-bot-worker` foram recarregados individualmente.

Os health checks internos responderam HTTP 200 para main, player e payments. O domínio público respondeu HTTP 200 em `/`, `/inicio` e `/canais`; `/filmes` redirecionou para autenticação quando consultado sem sessão, comportamento esperado para rota protegida.

## 3. Evidências funcionais

| Área | Evidência | Resultado |
|---|---|---|
| Login cliente | Conta laboratorial autenticou no domínio real e chegou a `/inicio`. | Aprovado |
| Catálogo live | `/canais` renderizou filtros, paginação e seletor de portal. | Aprovado visualmente |
| Catálogo filme | `/filmes` renderizou filtros e paginação. | Aprovado visualmente |
| Conteúdo reproduzível | Conta laboratorial retornou zero itens no portal selecionado. | Não medido |
| Séries | Rota apresentou acesso laboratorial suspenso e resposta upstream 502. | Não medido; bloqueio de dados |
| Portais | Owner visualizou `Portal 1` a `Portal 7`, todos ativos. | Aprovado visualmente |
| Capacidade | A UI exibiu capacidade não definida nos sete portais. | Pendência operacional |
| Owner | `/painel` carregou após autenticação direta. | Aprovado |
| Usuário comum | Tentativa de `/painel` não exibiu controles administrativos. | Aprovado |
| Reprodução | Nenhum item disponível para clicar em Play. | Não certificado |

## 4. Estabilidade observada

Durante 60 segundos após o rollout, main, player e payments permaneceram HTTP 200. O worker permaneceu online sem novo restart na janela e apresentou aproximadamente 99 MiB na leitura do PM2. O contador histórico de reinícios do worker continuou elevado, portanto não deve ser tratado como SLO atingido; é dívida operacional para investigação prolongada.

## 5. Conclusão

O rollout de Player Reliability v1 foi confirmado em produção para integridade de artefato, saúde dos serviços, autenticação, permissões e navegação de catálogo. A telemetria e a remoção do prefetch de playback estão no build ativo.

O player não recebeu nota 10/10 com este smoke test. O estado real é aproximadamente **7,5/10 para IPTV multi-servidor em evolução** e **5/10 quando comparado a players OTT de primeira linha**, com a ressalva de que a reprodução real ainda não foi medida nesta conta. Para fechar o próximo gate, é necessário disponibilizar conteúdo de laboratório reproduzível e testar live, filme, episódio, buffering controlado, recovery, troca de portal, rede degradada, acessibilidade e ausência de URL upstream na rede.

O rollback continua preparado. Não foram alterados secrets, Nginx, firewall ou migrations durante esta publicação.

## Referência

A arquitetura, os critérios e as referências oficiais utilizadas estão em [Especificação de evolução do player para produção](../arquitetura/ESPECIFICACAO-PLAYER-PRODUCAO-2026-08-26.md).
