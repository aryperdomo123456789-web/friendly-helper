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

| Área                  | Evidência                                                             | Resultado                     |
| --------------------- | --------------------------------------------------------------------- | ----------------------------- |
| Login cliente         | Conta laboratorial autenticou no domínio real e chegou a `/inicio`.   | Aprovado                      |
| Catálogo live         | `/canais` renderizou filtros, paginação e seletor de portal.          | Aprovado visualmente          |
| Catálogo filme        | `/filmes` renderizou filtros e paginação.                             | Aprovado visualmente          |
| Conteúdo reproduzível | Conta laboratorial retornou zero itens no portal selecionado.         | Não medido                    |
| Séries                | Rota apresentou acesso laboratorial suspenso e resposta upstream 502. | Não medido; bloqueio de dados |
| Portais               | Owner visualizou `Portal 1` a `Portal 7`, todos ativos.               | Aprovado visualmente          |
| Capacidade            | A UI exibiu capacidade não definida nos sete portais.                 | Pendência operacional         |
| Owner                 | `/painel` carregou após autenticação direta.                          | Aprovado                      |
| Usuário comum         | Tentativa de `/painel` não exibiu controles administrativos.          | Aprovado                      |
| Reprodução            | Nenhum item disponível para clicar em Play.                           | Não certificado               |

## 4. Estabilidade observada

Na janela do rollout anterior, main, player e payments permaneceram HTTP 200; o worker ficou online sem novo restart e apresentou aproximadamente 99 MiB. Na publicação do micro-hotfix, os quatro processos também permaneceram online e os health checks passaram após 60+ segundos; a leitura do worker chegou transitoriamente a aproximadamente 395 MiB e caiu para aproximadamente 85 MiB após quatro minutos. O contador histórico de reinícios continua elevado; portanto, memória e estabilidade do worker ainda não devem ser tratados como SLO atingido e exigem observação prolongada.

## 5. Conclusão

O rollout de Player Reliability v1 foi confirmado em produção para integridade de artefato, saúde dos serviços, autenticação, permissões e navegação de catálogo. A telemetria, a remoção do prefetch de playback e a troca não bloqueante de portal estão no build ativo.

O player não recebeu nota 10/10 com este smoke test. A reprodução real foi medida e falhou antes do primeiro frame em três tentativas live observadas no laboratório: uma no Portal 1 com timeout aproximado de 60 s e duas no Portal 2 com erro nativo em aproximadamente 7,5 s e 2,6 s. A tentativa final pós-micro-hotfix falhou em aproximadamente 1,7 s, mas registrou somente `native_media_error`, sem o falso `autoplay_blocked`. Para fechar o próximo gate, é necessário disponibilizar conteúdo de laboratório reproduzível e testar live, filme, episódio, buffering controlado, recovery, troca de portal, rede degradada, acessibilidade e ausência de URL upstream na rede.

O rollback continua preparado. O micro-hotfix `07b2964` foi publicado com manifesto determinístico; o build anterior permanece preservado. Não foram alterados secrets, Nginx, firewall ou migrations durante esta publicação. A leitura pós-reload manteve os quatro processos online e os health checks em 200, mas o worker apresentou aproximadamente 395 MiB, exigindo observação operacional prolongada antes de declarar SLO de memória.

## Referência

A arquitetura, os critérios e as referências oficiais utilizadas estão em [Especificação de evolução do player para produção](../arquitetura/ESPECIFICACAO-PLAYER-PRODUCAO-2026-08-26.md).

## Adendo — micro-hotfix pós-QA

O commit `07b2964` ajustou exclusivamente `src/components/player/VideoPlayer.tsx`: o erro nativo encerra o loading, impede que a rejeição de `play()` seja registrada como autoplay quando já existe erro de mídia e remove o handler JSX duplicado. Prettier, os 20 testes determinísticos de worker/player, lint direcionado e build sanitizado passaram. O typecheck global continua com falhas preexistentes em rotas, schema gerado e outros componentes fora do escopo desta correção; não foi introduzida migration nem alteração de contrato.

Após a publicação, a conta laboratorial permaneceu autenticada no Portal 2, o catálogo renderizou 20 itens e a reprodução final confirmou o comportamento de erro controlado. A ausência de primeiro frame continua bloqueada pela origem/proxy e não foi mascarada pelo hotfix.

## Adendo — observabilidade do upstream

O commit `5d62afd` adicionou logs estruturados e sanitizados ao caminho principal/player do stream e passou a carregar no token cifrado somente uma referência interna do servidor para correlação. O manifesto do build publicado foi `26d33d34422f6df86c904ed491e36648ed3c184bd4cc971ad6452536db030688`, substituindo o manifesto `2898c3087bdc9dee63fe0d1709c9ae1a8a70808b6c0c7350794177285f0a1555`; o rollback permanece preservado.

Os quatro processos ficaram online, os health checks locais de main/player/payments responderam 200 e o domínio público respondeu 200 após 60+ segundos. Uma tentativa autorizada posterior no Portal 2 gerou os novos logs: o processo principal recebeu HTTP 200 do player dedicado, enquanto o player identificou HTTP 200 com `content-type` `text/html` e classificou `playlist_invalid` em aproximadamente 0,2 s. A conta QA foi então deslogada e o navegador retornou à tela pública de login. Não houve alteração de permissões, catálogo, banco ou dados financeiros.

## Adendo — evolução 3/10 para 6/10: formato do playback

O commit `8f93d37` implementou o primeiro gate do plano de evolução: o builder Xtream agora respeita `ts` e `m3u8` quando o catálogo informa esses formatos, rejeita extensões desconhecidas e usa fallback seguro. A decisão de anexar `hls=1` deixou de depender da ausência textual de `ext=ts` e passou a observar o URL final construído. Foram adicionados três casos determinísticos ao `test:worker`; o conjunto passou com 27/27 testes, lint direcionado e build sanitizado sem o identificador legado.

O build foi publicado atomicamente no aaPanel com manifesto local/remoto `a0c8a40899eb8b2c466b1722091eacbc3bc2a8b5557eb7fb280c869f1a7efacc`. O manifesto anterior `26d33d34422f6df86c904ed491e36648ed3c184bd4cc971ad6452536db030688` permanece no rollback `.output.rollback.player-format-20260826T205110Z` do servidor. O readiness passou, os três endpoints internos responderam 200, o domínio público respondeu 200 e a observação adicional de 65 segundos manteve main/player/payments/worker online. Não foi executada nova reprodução após este deploy; portanto, o primeiro frame ainda não está comprovado e a nota não sobe automaticamente para 6/10.

## Adendo — fallback limitado de formato

O commit `a815a64` adicionou `fallback_urls` de forma retrocompatível. Quando uma entrada live chega sem extensão declarada, o backend assina no máximo duas tentativas: HLS primeiro e TS depois. O frontend só troca para o fallback após falha fatal antes do primeiro frame, destrói o engine anterior, limpa o elemento de mídia e registra `format_fallback`. Para entradas com `ts` ou `m3u8` declarados, permanece uma única tentativa no formato informado.

O build foi publicado atomicamente com manifesto `d668c73130690a664a2375dd396f7daadf24285ee08283fa5c68b6c765699306`; o build `a0c8a40899eb8b2c466b1722091eacbc3bc2a8b5557eb7fb280c869f1a7efacc` ficou no rollback `.output.rollback.player-fallback-20260826T210455Z`. O readiness passou e a observação adicional de 65 segundos manteve os quatro processos online, com health checks internos e público em 200. O worker apresentou aproximadamente 348 MiB nessa leitura; não houve novo playback após o deploy, então a alteração ainda aguarda validação de primeiro frame em fonte autorizada.

## Evidência QoE pós-hotfix — primeiro frame comprovado

Após autenticação manual da conta QA, a sessão abriu no Portal 3 e o catálogo live carregou 58 itens. Uma única reprodução autorizada foi acionada. A inspeção visual mostrou o vídeo com mudança de frames entre snapshots, sem o `ReferenceError` observado no bundle anterior. A correlação sanitizada registrou `startup_requested` em 0 ms, `first_frame` em 8.431 ms, aproximadamente 9,776 s de buffer e `playing` no mesmo instante, usando engine `native`. Não houve `native_media_error`, `autoplay_blocked` ou exceção JavaScript nesse fluxo. O upstream respondeu HTTP 200 com família HLS e mídia MPEG-TS durante a sessão. O fallback TS não foi acionado porque a tentativa HLS primária funcionou; ainda assim, primeiro frame e início de reprodução foram comprovados no build ativo.

Essa prova melhora a avaliação do caminho de live para aproximadamente 5/10 em laboratório, mas não certifica 6/10 global: ainda faltam repetição em outros portais, VOD, recovery induzido, TTFF p50/p95, buffering sustentado e a matriz de compatibilidade prevista no plano.

## Observação final do hotfix de estado

Após mais de 65 segundos do reload, o manifesto ativo permaneceu `9cc1d4322fa1841f5b1826f8341bb10b8bceb55d61331da16deeff54f2128124`. Os quatro processos nominais permaneceram online: main PID 107675, player PID 107723, payments PID 107864 e worker PID 107904. Os três health checks internos e o domínio público responderam HTTP 200. O rollback `.output.rollback.player-state-20260826T211434Z` permaneceu preservado. Na leitura de aproximadamente quatro minutos, o worker estava em cerca de 93,5 MiB e sem novo restart durante a janela; a diferença de versão informativa do PM2 permaneceu sem `pm2 update`.

## Matriz real pós-timeout/retry — sessão comum

Após login manual da conta QA comum, Portal 3 foi mantido como origem de laboratório e a validação foi executada em série, sem paralelismo. O catálogo live abriu 58 itens; uma reprodução live registrou `first_frame` em 3.931 s, `playing` em 3.932 s e um buffer curto de aproximadamente 33 ms. Um filme VOD respondeu HTTP 200 como `video/mp4` e registrou `first_frame`/`playing` em 10.705 s. Um episódio respondeu HTTP 200 como `video/mp4` e registrou `first_frame`/`playing` em 7.731 s. Não houve `startup_timeout`, `native_media_error`, `autoplay_blocked`, `player_initialization_error` ou `format_fallback` nas três tentativas; o caminho primário funcionou em todas.

A matriz confirma live, filme e episódio em uma origem autorizada e mostra que o timeout não disparou indevidamente. Ainda não é a matriz completa de 20 tentativas nem prova multiportal: Portal 1 e Portal 2 mantêm falhas anteriores de origem, e o fallback TS ainda não foi forçado em runtime. A sessão comum foi encerrada e o navegador retornou ao login público.

## Fixture isolado R1–R10

Foi implementado e executado um fixture determinístico local usando o módulo real `createPlaybackTelemetry`. A matriz sequencial cobriu segmento live transitório, atraso de playlist, fallback HLS→TS, falha permanente, `startup_timeout`, retry manual, erro de decodificação, troca A→B→A, desmontagem/logout e VOD/episódio lento. Resultado: **10/10 cenários passaram**, sem porta pública, sem requisição a origem externa e sem tocar fontes de clientes.

O fixture verificou cleanup, encerramento de loading, no máximo um fallback, retry em sessão nova, `recover_attempt`/`recover_success`, `fatal_error`, `destroyed` e ausência de `autoplay_blocked` falso. A matriz é evidência de contrato e política em ambiente determinístico; não substitui a mesma prova end-to-end em uma fonte autorizada real. O relatório sanitizado local foi gerado em `/home/ubuntu/player-recovery-matrix-2026-08-26.md`.

## Logout na aba Conta

A aba Conta recebeu um botão explícito **Sair da conta** para usuários comuns. A ação reutiliza o encerramento de queries, limpeza do cache React Query, `supabase.auth.signOut()` e navegação para a tela pública. Após o deploy, o botão foi localizado no DOM real e o logout foi confirmado visualmente pelo retorno à tela pública de login. Nenhum dado, permissão, assinatura, sessão de outro dispositivo ou configuração de produção foi alterado.

## Rodada controlada de Portais 1 e 2 e entitlement de laboratório

A simulação isolada de falha transitória de segmento continuou aprovada pelo fixture R1–R10 e pela suíte oficial. Nos testes reais, Portal 1 foi selecionado e o catálogo de categorias carregou, porém as categorias visitadas não ofereceram itens reproduzíveis; nenhuma tentativa de playback foi iniciada. Portal 2 foi selecionado e permaneceu em uso no seletor, mas a rota TV ao Vivo informou que não havia servidor liberado para aquela sessão; igualmente, nenhum playback foi iniciado. Esses resultados são inconclusivos para a saúde do player e foram mantidos separados de falhas de origem.

Para o laboratório, foi criado snapshot protegido do registro antes da mudança e aplicado exclusivamente `profiles.max_connections = 20` ao usuário de teste. O painel do dono recarregou mostrando `0 / 20`, e a consulta de verificação confirmou o valor 20. Nenhum outro usuário, plano, servidor, permissão, pagamento ou sessão foi alterado.

## Auditoria administrativa sanitizada

O commit `cda973e` adicionou uma aba Auditoria somente leitura ao painel do dono, com paginação server-side e referências hash para ator, alvo e entidade. O endpoint exige papel de dono e reutiliza `audit_logs`; nenhum identificador bruto é retornado ao navegador.

Durante a validação visual, detalhes legados de pagamento inicialmente exibiram `planId` e `provider_preference_id`; a descoberta foi tratada como bloqueio. O commit `6664759` endureceu a redaction para remover chaves de ID/ref e o build foi republicado com manifesto `233bd2ccce8bbde89656c9a810d86b733afed4a69f895574756d7311db46e790`. Na segunda validação, a tabela exibiu apenas referências hash de 16 caracteres e campos operacionais seguros, como amount e currency; não apareceram senha, token, URL, playlist, `planId`, `provider_preference_id`, `request_id` ou ID bruto.

O deploy teve manifesto local/remoto igual, readiness 200, domínio público 200, quatro processos online e rollback preservado. A sessão administrativa foi encerrada e o navegador retornou à tela pública.

## Telemetria de qualidade pós-deploy

O commit `6ec4f1a` adicionou `quality_sample` ao contrato QoE e ao player, com contadores de frames descartados/decodificados, nível e bitrate quando o engine HLS fornece essas informações. O build foi publicado com manifesto `9ff316b1f61891b4309c509ec7edb77895f25000a4be1c55acabe246eb15415a`; o rollback permaneceu preservado.

Após uma única reprodução autorizada no Portal 3, o processo main registrou amostras sanitizadas em aproximadamente 10,002 ms e 20,001 ms: `dropped_frames = 0`, `decoded_frames = 213` e depois `dropped_frames = 0`, `decoded_frames = 513`. O player respondeu HTTP 200 e permaneceu saudável. O engine registrado foi nativo; por isso não houve nível/bitrate HLS nessa amostra. A instrumentação confirma ausência de frames descartados naquela janela, mas ainda não certifica ABR ou qualidade multi-device.
