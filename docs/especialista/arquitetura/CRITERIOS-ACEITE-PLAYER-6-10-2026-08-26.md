# Critérios de aceite e plano exato para levar o player a 6/10

**Projeto:** MAGOPLAYERPRO

**Data:** 26 de agosto de 2026

**Status atual:** caminho live de laboratório aproximadamente 5/10; produto completo aproximadamente 4/10.

**Meta:** atingir 6/10 com evidência repetível, sem declarar sucesso com base em uma única reprodução.

## 1. Definição operacional da meta

A nota 6/10 será concedida somente quando o player demonstrar reprodução confiável em uma pequena matriz autorizada de live, VOD e episódios, mantendo isolamento por usuário, troca de portal, telemetria sanitizada e estabilidade operacional. A meta não significa equivalência a Netflix ou a outro líder OTT; significa que o núcleo de reprodução já é utilizável, observável e previsível em um conjunto conhecido de fontes e navegadores.

> **Regra de ouro:** catálogo carregado não é playback aprovado. O gate principal é o primeiro frame seguido de execução contínua.

## 2. O que já está concluído

| Capacidade                    | Evidência atual                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Respeito ao formato anunciado | O builder diferencia `ts` e `m3u8` e rejeita extensões inseguras.                                  |
| Fallback controlado           | Live sem extensão pode tentar HLS e, no máximo, TS; não há loop infinito.                          |
| Tratamento de erro nativo     | O loading encerra e `autoplay_blocked` não é emitido como causa falsa após erro nativo.            |
| QoE                           | Há eventos sanitizados de startup, primeiro frame, execução, buffering, erro, recovery e fallback. |
| Proxy                         | URL upstream, token, playlist e credenciais permanecem fora do cliente e dos logs.                 |
| Portal e sessão               | A troca de portal foi comprovada sem prefetch bloqueante e sem interferência entre usuários.       |
| Deploy                        | Build sanitizado, manifesto, readiness, reload nominal e rollback preservado.                      |
| Prova de reprodução           | Uma sessão autorizada no Portal 3 atingiu primeiro frame em 8,431 s e `playing` no mesmo instante. |

## 3. Gates obrigatórios para liberar 6/10

### Gate A — Fonte autorizada e matriz mínima

O proprietário deve disponibilizar ou confirmar uma fonte de laboratório lícita e reproduzível. Não será injetada URL externa, playlist de terceiros ou credencial no código, banco ou build. A fonte precisa ser testável no escopo autorizado e permanecer disponível durante a janela de validação.

A matriz mínima será composta por **20 tentativas controladas**, sem paralelismo e sem carga de produção: dez reproduções live distribuídas em pelo menos dois portais autorizados, cinco itens VOD e cinco episódios de série. Se a conta possuir somente uma fonte realmente saudável, a limitação será registrada e a nota ficará provisória; não será mascarada como cobertura multiportal.

**Aceite:** pelo menos 18 das 20 tentativas alcançam primeiro frame e `playing`, sem exceção JavaScript e sem evento falso de autoplay. O objetivo de operação será TTFF p50 ≤ 5 s e p95 ≤ 12 s na janela de laboratório; valores acima disso não reprovam automaticamente se a origem for comprovadamente lenta, mas impedem a classificação premium sem justificativa.

### Gate B — Formato e engine

Cada tentativa deve registrar, de forma sanitizada, o tipo lógico (`live`, `movie` ou `series`), engine utilizado, formato solicitado pelo catálogo, status HTTP e família de `content-type`. O player não pode tratar todo live como HLS nem pode tentar interpretar TS bruto como playlist.

**Aceite:** entradas HLS geram caminho HLS; entradas TS não recebem `hls=1`; VOD e episódios respeitam a extensão segura; resposta HTML, login do provedor ou playlist inválida terminam em erro controlado e diagnosticável. Nenhuma URL, token, stream ID ou credencial pode aparecer em tela, telemetria ou log.

### Gate C — Recovery e fallback

Será executada uma falha controlada em ambiente autorizado, preferencialmente interrompendo temporariamente a entrega de um segmento ou usando uma origem de laboratório que responda erro transitório. Não será provocado dano em origem de cliente.

**Aceite:** o player registra `fatal_error` e `recover_attempt`, tenta recovery limitado, não cria loop, não duplica listeners, não perde o lease e retorna a `playing` em até 10 s após a origem voltar. Quando HLS falhar antes do primeiro frame e houver fallback TS, deve existir no máximo uma transição `format_fallback`; se ambos falharem, a UI deve encerrar loading e exibir mensagem controlada.

### Gate D — Troca de portal e isolamento

Com uma conta QA autorizada, executar Portal A → Portal B → Portal A, sempre por clique real e sem prefetch de playback. Se houver duas contas laboratoriais autorizadas, manter uma reprodução na primeira enquanto a segunda troca de portal.

**Aceite:** a troca muda apenas a sessão solicitante; o lease continua associado ao usuário, dispositivo e portal corretos; não há alteração de catálogo, seleção ou reprodução de outra conta; ao desmontar o player, a sessão é limpa e o logout encerra o laboratório.

### Gate E — QoE e evidência

Cada tentativa deve produzir um conjunto correlacionável e sanitizado contendo startup, primeiro frame quando existir, playing, buffering, erro, recovery/fallback e destroyed. A análise deve calcular tentativas, taxa de primeiro frame, TTFF p50/p95, contagem de rebuffer, duração de rebuffer, recovery success e erro por portal/tipo.

**Aceite:** os eventos chegam sem URL upstream, token, playlist, título de conteúdo, credencial ou identificador sensível. A taxa de primeiro frame da matriz é ≥ 90%, a taxa de erro fatal não recuperado é ≤ 10% e nenhuma tentativa fica indefinidamente em loading.

### Gate F — VOD, séries e controles básicos

Além de live, serão testados um filme e um episódio autorizado. O player deve carregar a mídia, permitir play/pause, buscar quando a origem suportar, exibir erro controlado e destruir o recurso ao trocar de item. Não será prometido resume, DRM, legenda ou qualidade adaptativa antes de haver suporte medido para essas funções.

**Aceite:** cinco itens VOD/série da matriz alcançam primeiro frame ou são rejeitados com razão de formato/origem claramente registrada; nenhum playback anterior permanece tocando ao abrir o próximo item; nenhum lease fica órfão.

### Gate G — Compatibilidade mínima

A matriz de laboratório deve incluir Chromium desktop no ambiente de teste e uma viewport móvel. A validação adicional em Safari/iOS e Android real depende de teste manual do proprietário, pois o ambiente de automação não representa todos os engines nativos.

**Aceite:** Chromium desktop e viewport móvel reproduzem a matriz mínima sem erro de layout que impeça controle, sem loading infinito e sem regressão de login, catálogo ou troca de portal. Safari/iOS/Android ficam explicitamente marcados como pendentes até validação manual.

### Gate H — Operação sustentada e rollback

Após o deploy, manter uma janela de observação de pelo menos 60 minutos em tráfego controlado. Não haverá teste de carga antes da matriz funcional passar. O estado dos quatro processos, readiness interno, domínio público, restarts e memória do worker serão registrados.

**Aceite:** quatro processos online, health checks 200, domínio público 200, nenhum novo restart inesperado durante a janela e memória do worker estabilizada sem crescimento monotônico. O build ativo deve ter manifesto correspondente ao build local e o rollback deve continuar disponível. A diferença informativa de versão do PM2 não autoriza `pm2 update` neste escopo.

## 4. Ordem exata de execução

| Ordem | Ação                                                | Resultado de passagem                                                     |
| ----: | --------------------------------------------------- | ------------------------------------------------------------------------- |
|     1 | Confirmar fonte e escopo lícitos com o proprietário | Portal/fonte autorizados e janela definida.                               |
|     2 | Fechar baseline dos logs atuais                     | Manifesto de eventos, erros e TTFF existente, sem expor dados sensíveis.  |
|     3 | Executar a matriz de 20 tentativas em série         | Tabela de sucesso, falha, formato e tempo por tentativa.                  |
|     4 | Corrigir somente o primeiro bloqueio reproduzível   | Patch pequeno, teste determinístico e nenhuma mudança em banco/permissão. |
|     5 | Reexecutar apenas os casos afetados                 | Regressão ausente e melhoria demonstrada.                                 |
|     6 | Executar recovery/fallback controlado               | Retorno a `playing` ou erro final controlado, sem loop.                   |
|     7 | Validar troca A → B → A e lease                     | Isolamento e cleanup comprovados.                                         |
|     8 | Validar VOD e série                                 | Contrato de formato e lifecycle comprovados.                              |
|     9 | Rodar build sanitizado e revisão de diff            | Testes, lint, build, identificador legado ausente e nenhum segredo.       |
|    10 | Commit e push na branch de trabalho                 | Histórico claro e branch limpa.                                           |
|    11 | Deploy atômico no aaPanel                           | Manifesto igual, rollback preservado, reload nominal e readiness.         |
|    12 | Observar 60 minutos e atualizar documentação        | Critérios aceitos ou bloqueios explicitamente registrados.                |

## 5. O que não deve ser feito

Não se deve aumentar timeout para esconder origem lenta, adicionar retries ilimitados, forçar HLS para toda entrada live, reescrever playlists sem validar content-type, testar centenas de conexões antes da aprovação funcional, mexer em migrations, alterar permissões, mudar Nginx, executar `pm2 update`, salvar credenciais em arquivos ou usar conteúdo sem autorização.

Também não se deve declarar 6/10 usando apenas a reprodução bem-sucedida do Portal 3. Essa amostra prova que o caminho pode funcionar; ela não prova disponibilidade dos demais portais, VOD, recovery, compatibilidade ou estabilidade sustentada.

## 6. Dependência que bloqueia a próxima execução

A próxima execução prática precisa de uma **fonte de laboratório autorizada com live, VOD e pelo menos um episódio**, ou da confirmação do proprietário de quais portais e conteúdos podem ser usados para o teste. A entrada de credencial deve ser feita manualmente pelo proprietário no navegador ou por fluxo seguro; não deve ser enviada novamente nem armazenada em chat, código ou relatório.

Enquanto essa dependência não for satisfeita, o estado correto é: código pronto para a matriz, produção com rollback, uma prova live positiva, mas meta 6/10 ainda não certificada.

## 7. Definition of Done

O player será considerado 6/10 quando os Gates A–H estiverem acompanhados de evidência sanitizada, os testes e o build estiverem verdes, o commit estiver no GitHub, o manifesto ativo estiver no aaPanel, o rollback estiver preservado, a branch estiver limpa e o relatório separar claramente sucesso do player, saúde da origem e limitações ainda não medidas.

### Referências internas

[1]: https://github.com/aryperdomo123456789-web/friendly-helper/blob/backup/stream-mago-bot-2026-08-05/src/components/player/VideoPlayer.tsx "Componente VideoPlayer"
[2]: https://github.com/aryperdomo123456789-web/friendly-helper/blob/backup/stream-mago-bot-2026-08-05/src/lib/player-telemetry.ts "Telemetria QoE do player"
[3]: https://github.com/aryperdomo123456789-web/friendly-helper/blob/backup/stream-mago-bot-2026-08-05/src/lib/stream-proxy.server.ts "Proxy server-side e tokens opacos"
[4]: https://github.com/aryperdomo123456789-web/friendly-helper/blob/backup/stream-mago-bot-2026-08-05/docs/especialista/deploy/SMOKE-PLAYER-PRODUCAO-2026-08-26.md "Smoke de produção sanitizado"
