# Smoke test do Player Reliability v1 em produção

**Projeto:** MAGOPLAYERPRO

**Autor:** Manus AI

**Data:** 26 de agosto de 2026

**Ambiente:** produção HTTPS no aaPanel

**Status:** rollout concluído; QoE real medida com falha de entrega da mídia

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

Na janela do rollout anterior, main, player e payments permaneceram HTTP 200; o worker ficou online sem novo restart e apresentou aproximadamente 99 MiB. Na publicação do micro-hotfix, os quatro processos também permaneceram online e os health checks passaram após 60+ segundos, mas a leitura do worker subiu para aproximadamente 395 MiB. O contador histórico de reinícios continua elevado; portanto, memória e estabilidade do worker ainda não devem ser tratados como SLO atingido e exigem observação prolongada.

## 5. Conclusão

O rollout de Player Reliability v1 foi confirmado em produção para integridade de artefato, saúde dos serviços, autenticação, permissões e navegação de catálogo. A telemetria, a remoção do prefetch de playback e a troca não bloqueante de portal estão no build ativo.

O player não recebeu nota 10/10 com este smoke test. A reprodução real foi medida e falhou antes do primeiro frame em três tentativas live observadas no laboratório: uma no Portal 1 com timeout aproximado de 60 s e duas no Portal 2 com erro nativo em aproximadamente 7,5 s e 2,6 s. A tentativa final pós-micro-hotfix falhou em aproximadamente 1,7 s, mas registrou somente `native_media_error`, sem o falso `autoplay_blocked`. Para fechar o próximo gate, é necessário disponibilizar conteúdo de laboratório reproduzível e testar live, filme, episódio, buffering controlado, recovery, troca de portal, rede degradada, acessibilidade e ausência de URL upstream na rede.

O rollback continua preparado. O micro-hotfix `07b2964` foi publicado com manifesto determinístico; o build anterior permanece preservado. Não foram alterados secrets, Nginx, firewall ou migrations durante esta publicação. A leitura pós-reload manteve os quatro processos online e os health checks em 200, mas o worker apresentou aproximadamente 395 MiB, exigindo observação operacional prolongada antes de declarar SLO de memória.

## Referência

A arquitetura, os critérios e as referências oficiais utilizadas estão em [Especificação de evolução do player para produção](../arquitetura/ESPECIFICACAO-PLAYER-PRODUCAO-2026-08-26.md).

## Adendo — micro-hotfix pós-QA

O commit `07b2964` ajustou exclusivamente `src/components/player/VideoPlayer.tsx`: o erro nativo encerra o loading, impede que a rejeição de `play()` seja registrada como autoplay quando já existe erro de mídia e remove o handler JSX duplicado. Prettier, os 20 testes determinísticos de worker/player, lint direcionado e build sanitizado passaram. O typecheck global continua com falhas preexistentes em rotas, schema gerado e outros componentes fora do escopo desta correção; não foi introduzida migration nem alteração de contrato.

Após a publicação, a conta laboratorial permaneceu autenticada no Portal 2, o catálogo renderizou 20 itens e a reprodução final confirmou o comportamento de erro controlado. A ausência de primeiro frame continua bloqueada pela origem/proxy e não foi mascarada pelo hotfix.
