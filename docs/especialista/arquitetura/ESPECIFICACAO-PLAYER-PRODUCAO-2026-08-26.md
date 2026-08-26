# Especificação de evolução do player para produção

**Projeto:** MAGOPLAYERPRO
**Autor:** Manus AI
**Data:** 26 de agosto de 2026
**Status:** Especificação técnica e plano de implementação seguro
**Escopo:** Player web de TV ao vivo, filmes e séries sobre origens IPTV autorizadas

> Este documento define o caminho técnico para levar o player a um padrão premium de produção. “10/10” é tratado como um conjunto de critérios mensuráveis, não como uma promessa visual. O sistema só poderá receber essa classificação depois de instrumentação, testes reais, compatibilidade comprovada e observação operacional.

## 1. Resumo executivo

O player atual é funcional para o cenário IPTV multi-servidor. Ele usa um elemento HTML `<video>`, reprodução HLS nativa quando o navegador oferece suporte e `hls.js` quando é necessário MSE. O acesso ao conteúdo é protegido por uma URL opaca produzida server-side; o proxy cifra a URL de origem com AES-256-GCM, expira o token e reescreve manifests HLS para que segmentos, chaves e playlists continuem passando pelo domínio da aplicação sem expor DNS, usuário ou senha do painel.

A base de segurança e compatibilidade é boa, mas a experiência ainda não é comparável à de um player OTT premium. O maior déficit não é o botão de play: é a ausência de dados reais de QoE, continuidade de reprodução, política de recuperação baseada em evidência, seleção de capacidade do dispositivo, estados de qualidade e critérios de acessibilidade. O primeiro investimento correto é tornar o playback observável e recuperável; DRM deve permanecer separado, pois depende de conteúdo licenciado, serviço de licença e compatibilidade de dispositivos.

## 2. Evidências reais da auditoria

A tabela abaixo separa fatos observados no código de metas futuras. Os valores atuais são configurações implementadas, não medições de sucesso em usuários reais.

| Área             | Fato observado no código                                                                                                                                                                                                        | Consequência                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine           | `hls.js` `^1.6.16` está instalado. Safari/navegadores com HLS nativo usam `video.src`; demais navegadores usam HLS.js quando MSE está disponível.                                                                               | Existe uma base correta de compatibilidade, mas os dois caminhos ainda não geram a mesma telemetria.                                                             |
| Buffer HLS.js    | `enableWorker: true`, `backBufferLength: 90`, `maxBufferLength: 30`, `maxMaxBufferLength: 120`, `maxBufferHole: 0.5`, sincronização live em 3 segmentos e latência máxima de 8 segmentos.                                       | Há proteção inicial de memória e latência, porém os parâmetros ainda não são ajustados por dados reais do catálogo e da origem.                                  |
| Retry HLS.js     | Até 5 recuperações locais para erros fatais de mídia ou rede; políticas configuradas com até 15 tentativas de manifest/level e 25 de fragmento.                                                                                 | Existe recuperação finita, mas falta registrar quantas recuperações realmente funcionam e quando o retry piora a experiência.                                    |
| Proxy de stream  | O endpoint aceita `Range`, faz até 4 tentativas upstream com timeout de 60 segundos, preserva headers de conteúdo, usa `no-store`, `nosniff` e `no-referrer`, e devolve estado de mídia indisponível sem vazar a URL da origem. | O proxy evita mixed content e protege credenciais, mas ainda não reporta QoE ao produto nem faz failover inteligente entre origens autorizadas durante playback. |
| URL de playback  | `getPlaybackUrl` valida sessão e origem, reivindica o lease do dispositivo e assina a URL com sujeito igual ao usuário. O TTL atual do playback é de 24 horas.                                                                  | A autorização está vinculada ao usuário, mas o TTL é mais longo que o necessário para uma sessão premium e deve ser revisado com telemetria e revogação.         |
| Origem Xtream    | O cliente server-side usa timeout padrão de 10 segundos e percorre `dnsPool` em sequência quando a origem falha.                                                                                                                | Há failover de API/catalogação, mas isso não constitui failover de playback em tempo real.                                                                       |
| QoE              | Não há coleta consolidada de tempo até primeiro frame, rebuffer, dropped frames, bitrate, latência live, erro por origem ou abandono.                                                                                           | Não é possível afirmar taxa de sucesso, qualidade ou capacidade real do player.                                                                                  |
| Continuidade     | O componente atual não persiste posição, não sincroniza progresso entre dispositivos e não oferece retomada VOD.                                                                                                                | A experiência está abaixo do padrão OTT premium.                                                                                                                 |
| Acessibilidade   | Existe um `<track kind="captions" />` vazio; os controles nativos são utilizados.                                                                                                                                               | Legendas reais, navegação completa por teclado, foco, contraste e teste assistivo ainda precisam ser comprovados.                                                |
| Recursos remotos | `disablePictureInPicture` está ativo e `controlsList` desabilita download, velocidade e reprodução remota.                                                                                                                      | O produto sacrifica recursos de conveniência; a decisão deve ser intencional e validada por segurança/licenciamento, não herdada sem análise.                    |

## 3. Referências técnicas de primeira linha

A arquitetura proposta segue padrões públicos e documentação oficial, não uma implementação proprietária inventada.

O **Media Source Extensions (MSE)** permite controlar a composição de segmentos, o carregamento e a eviction de buffers, e serve de base para clientes adaptativos HLS/DASH. A própria documentação também expõe `getVideoPlaybackQuality()` para observar frames descartados ou corrompidos [1].

O **Encrypted Media Extensions (EME)** fornece a API comum para sistemas de conteúdo protegido e exige contexto seguro HTTPS. Ele não fornece licenciamento por si só e não deve ser adicionado ao MAGOPLAYERPRO sem cadeia de conteúdo e licença compatíveis [2] [3].

A documentação do **hls.js** formaliza eventos de erro com tipo, detalhe e fatalidade; métodos de recuperação de mídia; destruição obrigatória ao trocar de stream; ABR, buffer, latência live, áudio, legendas, EME, CMCD, bandwidth estimate e métricas de playback [4].

A Apple descreve **HLS** como um protocolo desenhado para confiabilidade e adaptação dinâmica às condições de rede, executável sobre servidores web e CDNs comuns. A área oficial também referencia Low-Latency HLS, CMAF, autoria de ladders, métricas de performance, Content Steering e AirPlay [5].

A **WCAG 2.2** inclui requisitos de mídia baseada em tempo, captions pré-gravadas e ao vivo, audiodescrição, controle de áudio, teclado, contraste, reflow e foco. O player deve tratar esses itens como critérios de aceite [6].

A **Media Capabilities API** permite consultar a capacidade de decodificação do dispositivo para codec, resolução, bitrate e configuração específicos, informando se a reprodução tende a ser suave e eficiente [7].

## 4. Arquitetura alvo 10/10

### 4.1 Engine de reprodução

O player deve manter um único contrato visual e operacional, mas escolher o engine de forma explícita. Em Safari e ambientes com HLS nativo, o caminho nativo deve ser usado. Em navegadores sem HLS nativo, HLS.js deve operar sobre MSE com detecção de suporte, política de buffer e retry finito. Antes de escolher uma variante, a aplicação deve consultar capabilities quando houver ladder/codec conhecido; nunca deve assumir que um codec é suportado apenas porque o navegador abriu o elemento `<video>`.

A troca de conteúdo deve sempre destruir o contexto anterior, pausar o elemento, remover o `src`, liberar MediaSource/HLS.js e descartar listeners. O novo conteúdo deve possuir um `playback_session_id` local não identificável, usado apenas para correlacionar eventos daquela reprodução.

### 4.2 Segurança e proxy

O navegador continuará recebendo somente uma URL opaca do próprio domínio. A URL de origem, credenciais Xtream e DNS do painel permanecerão server-only. O proxy deve continuar validando expiração, autenticação GCM, protocolo HTTP/HTTPS, `Range`, `Content-Type`, `Content-Range` e reescrita de todos os URIs relativos e absolutos de playlists.

Para a próxima fase, o token deve ser reduzido a uma duração compatível com a sessão real e renovado somente por uma função autorizada. A renovação não deve permitir trocar `user_id`, `server_id` ou conteúdo sem nova validação de acesso. Logs nunca devem conter URL upstream, querystring de credencial, token opaco completo, nome de usuário do painel ou senha.

### 4.3 Recuperação e failover

A recuperação deve ser uma máquina de estados finita, não um conjunto de retries independentes. Os estados recomendados são `idle`, `loading`, `playing`, `buffering`, `recovering`, `switching_source`, `ended` e `failed`.

A política deve distinguir erro de manifest, fragmento, mídia, codec, autorização, origem indisponível e timeout. Para erro transitório, pode haver backoff limitado. Para erro fatal persistente, o player deve tentar uma única origem alternativa autorizada quando existir `dnsPool` ou outro portal permitido; depois deve encerrar o contexto e apresentar uma mensagem útil. O sistema não deve fazer loops infinitos nem trocar silenciosamente para uma origem que o usuário não possui.

Em TV ao vivo, o algoritmo deve registrar posição live, target latency, drift e número de rebuffer. Em VOD, deve preservar posição e permitir retomada. Uma troca de origem deve invalidar apenas o contexto de playback atual, sem limpar catálogo, sessão ou dados de outro usuário.

### 4.4 Telemetria de QoE

A primeira entrega de produção deve coletar eventos agregados e sanitizados. O cliente pode observar eventos do elemento `<video>`, HLS.js e Media Capabilities, mas deve enviar somente mudanças significativas ou um resumo periódico, evitando uma requisição por frame ou por segmento.

A identidade do usuário deve ser derivada no servidor a partir da sessão autenticada. O cliente pode enviar um identificador aleatório de playback e o `server_id` selecionado; não pode escolher livremente `user_id` para atribuir telemetria a outra pessoa. Títulos, URLs, tokens, credenciais e conteúdo do manifest não devem ser enviados.

| Métrica                  | Definição                                                  | Uso operacional                                           |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| `time_to_first_frame_ms` | Tempo entre início autorizado e primeiro frame reproduzido | Detectar origem lenta, proxy lento ou codec incompatível. |
| `startup_success`        | Reprodução atingiu `playing` dentro do timeout             | Medir sucesso real de início.                             |
| `rebuffer_count`         | Entradas em `waiting`/stall após início                    | Medir instabilidade da origem e rede.                     |
| `rebuffer_duration_ms`   | Tempo acumulado em buffering                               | Separar travamento pontual de degradação grave.           |
| `fatal_error_type`       | Categoria sanitizada do erro fatal                         | Priorizar correções por causa, não por impressão visual.  |
| `recovery_attempts`      | Tentativas de recuperação por sessão                       | Detectar loops, origem instável e políticas agressivas.   |
| `recovery_success`       | Retorno a `playing` após recuperação                       | Medir valor real do retry/fallback.                       |
| `dropped_frames`         | Frames descartados quando disponível                       | Detectar saturação de CPU/GPU ou codec inadequado.        |
| `buffer_seconds`         | Janela de conteúdo disponível no momento do evento         | Ajustar buffer e investigar starvation.                   |
| `bitrate_level`          | Variante atual ou estimativa de banda, quando disponível   | Avaliar ABR e qualidade entregue.                         |
| `live_latency_ms`        | Distância estimada da borda live                           | Controlar experiência de TV ao vivo.                      |
| `switch_reason`          | Troca manual, falha, capacidade ou logout                  | Auditar failover e UX.                                    |
| `ended_reason`           | Pausa, abandono, término, erro ou troca                    | Medir abandono e estabilidade.                            |

O armazenamento recomendado é um resumo de sessão com retenção curta e agregações diárias. Se uma tabela for necessária, ela deve ser aditiva, com índices por data, `server_id` e categoria de erro, sem armazenar segredo ou URL. O desenho exato da migration só deve ocorrer depois de definir retenção e volume esperado.

### 4.5 Experiência premium

A interface deve mostrar estado explícito de carregamento, buffering, recuperação, origem alternativa, indisponibilidade e encerramento. Mensagens como “canal fora do ar” devem diferenciar falha da origem, limite de sessões do usuário, sessão expirada e erro técnico. O botão de tentar novamente deve respeitar backoff e não criar múltiplos leases concorrentes.

Para VOD, o player deve adicionar `resume_from`, gravação periódica da posição e retomada por usuário/dispositivo, com escrita limitada e idempotente. Para live, deve exibir indicador de ao vivo, atraso aproximado quando disponível e ação de voltar à borda live.

Qualidade manual, picture-in-picture, reprodução remota e velocidade devem ser liberados somente quando forem compatíveis com o contrato de conteúdo e com a política de segurança. A remoção atual dessas capacidades não deve ser considerada “premium” automaticamente.

### 4.6 Acessibilidade e compatibilidade

Os controles devem funcionar por teclado, possuir nomes acessíveis, foco visível, contraste suficiente e ordem de navegação previsível. Captions reais devem ser usadas quando fornecidas pela origem ou por metadata autorizada; um `<track>` vazio não constitui acessibilidade. A validação deve incluir leitores de tela, zoom, reflow, navegação sem mouse e preferências de movimento reduzido.

A matriz mínima deve cobrir Chrome/Chromium com MSE, Safari com HLS nativo, Firefox, Android Chrome, iOS Safari e pelo menos uma viewport de TV ou navegador de tela grande. Cada combinação deve registrar codec, container, resolução, bitrate, resultado de `decodingInfo()` quando disponível, início, buffering e erro.

### 4.7 DRM como trilha separada

DRM não deve ser implementado para mascarar problemas de proxy ou para elevar artificialmente a nota do produto. A trilha só começa se houver conteúdo licenciado e uma arquitetura de licença aprovada. Ela deve definir key system por plataforma, política de persistência, renovação, expiração, revogação, privacidade, suporte a EME e observabilidade de falhas de licença.

## 5. Critérios objetivos de aceite

Os números abaixo são **metas a medir após a instrumentação**, não resultados já obtidos. A linha de base deve ser calculada com tráfego laboratorial e amostra produtiva sanitizada antes de fixar SLO definitivo.

| Critério                         |                                            Meta inicial de produção | Evidência exigida                                    |
| -------------------------------- | ------------------------------------------------------------------: | ---------------------------------------------------- |
| Início bem-sucedido              |                                        ≥ 98% das tentativas válidas | Telemetria por engine, navegador e servidor.         |
| Tempo até primeiro frame         |                                                p50 ≤ 3 s; p95 ≤ 8 s | Sessões com timestamp server/client correlacionável. |
| Sessão sem erro fatal            |                                                               ≥ 97% | Erros categorizados e deduplicados.                  |
| Recuperação de falha transitória |                              ≥ 80% quando houver origem alternativa | Comparação entre tentativas e retorno a `playing`.   |
| Rebuffer VOD                     |                         ≤ 1,5% do tempo assistido como meta inicial | `rebuffer_duration_ms / watch_duration_ms`.          |
| Troca de servidor                |                     0 vazamento de autorização; ≤ 1 ação do usuário | Teste com dois usuários e origens distintas.         |
| Segurança de origem              |                           0 URL/credencial upstream no browser/logs | Inspeção de rede, bundle e logs redigidos.           |
| Idempotência de lease            |                                      0 sessões duplicadas por retry | Teste de repetição e concorrência.                   |
| Acessibilidade                   |                                 WCAG aplicável sem bloqueio crítico | Checklist e teste manual por matriz de dispositivo.  |
| Operação                         | Alertas para erro fatal, p95 de início, rebuffer e origem degradada | Dashboard ou relatório com retenção definida.        |

Nenhuma meta deve ser declarada atingida usando dados simulados. Se não houver amostra real suficiente, o status deve ser `não medido`.

## 6. Implementação realizada nesta rodada

A entrega atual implementa **Player Reliability v1** sem alterar o contrato de playback: o módulo `src/lib/player-telemetry.ts` mantém fila limitada, resumo de primeiro frame e buffering, sanitização de código/motivo, flush em lotes e encerramento que nunca bloqueia a troca de conteúdo. O `VideoPlayer` registra início, manifest, primeiro frame, reprodução, buffering, erro fatal, recuperação, encerramento e cleanup; o contexto anterior é destruído antes de uma nova URL ser carregada.

A função server-side `recordPlaybackTelemetry` deriva a identidade da sessão autenticada, valida perfil, origem ativa e autorização `user_server_access`, e grava apenas um evento JSON sanitizado nos logs do serviço. Não há URL upstream, credencial, token opaco, título ou conteúdo de playlist no payload. A telemetria não foi persistida no banco nesta rodada; isso evita criar retenção e volume sem antes medir o tráfego real.

O catálogo deixou de fazer prefetch de URLs de playback em hover, foco ou carregamento de página. Como `getPlaybackUrl` reivindica o lease de conexão, essa alteração impede que navegar pelo catálogo consuma uma sessão antes do clique real em Play. O prefetch de imagens e metadata de séries permanece.

A suíte passou com 20 testes, incluindo três casos de telemetria. O build multisserviço passou com URL e chave pública do Supabase obtidas em memória; a varredura do `.output` não encontrou o identificador legado. O typecheck completo ainda apresenta erros históricos em arquivos fora do player; não há erro novo em `VideoPlayer.tsx`, `player-telemetry.ts` ou nos contratos server-side adicionados nesta rodada. A telemetria e a remoção do prefetch ainda não foram publicadas em produção.

## 7. Plano de implementação por fases

### Fase P1 — Instrumentação sem alteração de contrato — entregue

Esta fase foi implementada nesta rodada. O módulo client-side de telemetria mantém buffer em memória, fila limitada, sanitização e envio agregado. Eventos nativos e HLS.js são registrados sem alterar a URL pública, o proxy ou o contrato de `getPlaybackUrl`. A função server-side valida a identidade e a origem e emite somente logs JSON sanitizados. Testes puros cobrem primeiro frame, buffering, sanitização, flush e falha do endpoint sem bloquear o player.

### Fase P2 — Recuperação e failover controlados — próxima fase

Extrair uma política finita de recovery, testar erro de manifest, mídia, fragmento, timeout e codec, e usar apenas origens já autorizadas pelo servidor. Implementar cancelamento/destroy rigoroso ao trocar de conteúdo e impedir leases concorrentes durante prefetch/play.

### Fase P3 — Continuidade e controles premium

Implementar resume VOD por usuário, live edge, qualidade manual quando a playlist fornecer variants, legendas reais e estados de erro recuperáveis. Persistir apenas o necessário, com debounce e idempotência.

### Fase P4 — Compatibilidade e acessibilidade

Executar a matriz de navegadores, codecs, resoluções, mobile e tela grande. Validar teclado, leitor de tela, captions, contraste, zoom, PiP e reprodução remota conforme política de conteúdo.

### Fase P5 — Escala e DRM opcional

Medir QoE por origem, capacidade do proxy, taxa de fallback e impacto em CPU/RAM/rede. Somente após conteúdo/licença aprovados, avaliar EME/DRM em uma trilha isolada e reversível.

## 8. Rollout de produção

Cada fase deve ser publicada em branch e commit próprios, com `npm run test:worker`, testes específicos do player, lint direcionado, build completo e inspeção do bundle. Migrations, se necessárias, devem ser aditivas, precedidas de backup PostgreSQL verificável e acompanhadas de rollback.

O rollout deve usar feature flag ou segmentação por conta de laboratório/owner antes de liberar para todos. A sequência operacional é: build fora da produção; manifesto/hash; transferência para área temporária; verificação byte a byte; preservação do build anterior; troca atômica; reload individual de main/player/payments/worker; readiness com polling; smoke test; observação; rollback automático em falha.

O smoke test mínimo deve validar login, catálogo, seleção de Portal, abertura de live, filme e episódio, buffering controlado, troca de origem, logout, isolamento de dois usuários e ausência de URL upstream na rede do navegador. O teste deve registrar apenas métricas e identificadores redigidos.

## 9. Classificação atual e decisão

Com base na auditoria do código, o player atual é **7/10 para IPTV multi-servidor** e aproximadamente **5/10 quando comparado a players OTT de primeira linha**. Essa nota não representa defeito de segurança crítico; representa distância de recursos, medição e operação premium.

A decisão recomendada é não reescrever o player. O caminho de menor risco é preservar `VideoPlayer`, `Catalog`, `getPlaybackUrl`, `stream-proxy` e `xtreamCall`, extraindo primeiro telemetria e política de recovery. Depois, implementar resume, capabilities, qualidade e acessibilidade. O proxy e a autorização devem continuar server-side.

O primeiro marco de produção é **Player Reliability v1**, com telemetria, estados, recuperação finita e relatório por origem. Sem esse marco, qualquer afirmação de player 10/10 será opinião. Com ele, o produto passa a ter dados para evoluir rápido sem sacrificar login, sessões, permissões, catálogo ou proxy.

## Referências

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API "MDN — Media Source API"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API "MDN — Encrypted Media Extensions API"
[3]: https://www.w3.org/TR/encrypted-media-2/ "W3C — Encrypted Media Extensions 2"
[4]: https://github.com/video-dev/hls.js/blob/master/docs/API.md "hls.js — HLS.js v1 API"
[5]: https://developer.apple.com/streaming/ "Apple Developer — HTTP Live Streaming"
[6]: https://www.w3.org/TR/WCAG22/ "W3C — Web Content Accessibility Guidelines 2.2"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/Media_Capabilities_API "MDN — Media Capabilities API"

## Anexos de auditoria

| Arquivo                                 | Responsabilidade                                              |
| --------------------------------------- | ------------------------------------------------------------- |
| `src/components/player/VideoPlayer.tsx` | Engine visual, HLS.js/native, buffering e recuperação atual.  |
| `src/components/player/Catalog.tsx`     | Catálogo, prefetch, cache de playback e integração do player. |
| `src/lib/player.functions.ts`           | Sessão, autorização, lease, catálogo e URL de playback.       |
| `src/lib/player-store.tsx`              | Identidade, servidor ativo, cache e heartbeat.                |
| `src/lib/stream-proxy.server.ts`        | Token AES-GCM e reescrita de playlist.                        |
| `src/routes/api/public/stream.ts`       | Proxy público, Range, retry, timeout e fallback de mídia.     |
| `src/lib/xtream.server.ts`              | API Xtream, timeout, DNS pool e construção de stream.         |
| `package.json`                          | Versões reais de hls.js e scripts de build/teste.             |

**Conclusão:** o player está pronto para receber uma evolução profissional controlada, não para ser declarado perfeito antes da medição. O primeiro commit de código deve atacar Player Reliability v1; o primeiro deploy dessa frente deve ser canário, reversível e observado.
