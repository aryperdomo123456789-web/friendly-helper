# Roteiro de falhas controladas para provar recovery do player

**Projeto:** MAGOPLAYERPRO

**Objetivo:** provar recovery, fallback, encerramento controlado e isolamento suficientes para a meta 6/10.

**Regra:** executar somente em fonte de laboratório autorizada ou em um simulador local isolado. Não provocar falha em origem de cliente, não derrubar Nginx, não bloquear o servidor inteiro e não criar carga paralela.

## 1. Como a simulação deve funcionar

A simulação deve ocorrer em uma origem de laboratório separada do catálogo de clientes. O método preferencial é um proxy/fixture local que devolva respostas determinísticas para uma playlist e seus segmentos, com uma chave de cenário ativada apenas no ambiente de teste. O cenário deve ser selecionado por configuração de laboratório, nunca por parâmetro público sem autenticação, e deve ser removido ou desativado antes do deploy final.

Cada cenário precisa registrar um `scenario_ref` sanitizado no relatório local. O player continuará registrando apenas eventos QoE, sem URL upstream, token, playlist, stream ID, nome de conteúdo ou credencial.

> **Não vale simular apagando arquivo em produção.** A prova deve ser reproduzível e reversível, não uma aventura de madrugada no servidor do cliente.

## 2. Falhas obrigatórias para a meta 6/10

| ID  | Falha controlada                                | Forma segura de simular                                                                                     | Eventos esperados                                                                                              | Critério de aprovação                                                                                                              |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Segmento live falha uma vez após `playing`      | O fixture devolve timeout ou HTTP 503 para exatamente um segmento e volta a 200 no próximo pedido.          | `buffer_start`, erro transitório do engine, `buffer_end`; `recover_attempt` se o engine exigir.                | O vídeo retorna a `playing` em até 10 s, sem reload completo, sem loop e sem erro fatal final.                                     |
| R2  | Playlist HLS demora a atualizar                 | O fixture segura uma atualização de playlist por poucos segundos e depois libera a versão seguinte.         | `buffer_start`, `buffer_end`, métricas de duração de buffer.                                                   | O player tolera a pausa curta e retoma; não confunde atraso transitório com `startup_timeout` se já houve primeiro frame.          |
| R3  | HLS inválido antes do primeiro frame, TS válido | A primeira URL retorna conteúdo inválido/HTML controlado; a segunda extensão TS retorna mídia válida.       | `startup_requested`, `fatal_error` ou erro nativo sanitizado, `format_fallback`, `first_frame`, `playing`.     | Uma única transição HLS → TS, primeiro frame em até 20 s totais, sem duplicação de listeners e sem segunda tentativa adicional.    |
| R4  | HLS e TS permanentemente inválidos              | As duas respostas do fixture permanecem inválidas.                                                          | `startup_requested`, no máximo um `format_fallback`, `fatal_error`; nenhum `playing`.                          | Loading termina em até 20 s após a última tentativa; mensagem final aparece; não há loop, avalanche de requests ou lease pendente. |
| R5  | Timeout de startup sem resposta de mídia        | O fixture não entrega primeiro frame e mantém a conexão dentro do limite de laboratório.                    | `startup_requested`, `fatal_error` com `startup_timeout`; fallback uma vez se existir.                         | O spinner termina no limite de 20 s; a UI exibe erro claro; o botão `Tentar novamente` inicia uma nova sessão limpa.               |
| R6  | Retry manual após falha permanente              | Depois de R4 ou R5, o operador clica uma vez em `Tentar novamente`; o fixture é alterado para mídia válida. | Primeiro ciclo termina em `fatal_error`; segundo ciclo registra `startup_requested`, `first_frame`, `playing`. | O retry recupera em uma nova sessão; não existem listeners duplicados, eventos duplicados ou dois leases ativos.                   |
| R7  | Falha de decodificação/mídia corrompida         | O fixture envia uma amostra de mídia inválida em um cenário isolado; não usar conteúdo de cliente.          | `native_media_error` ou erro equivalente; `fatal_error`; recovery limitado quando aplicável.                   | O player encerra loading e mostra erro controlado; não registra `autoplay_blocked` como causa primária; não trava a página.        |
| R8  | Troca de portal durante playback                | Iniciar mídia válida, trocar por clique para outro portal autorizado e depois voltar ao primeiro.           | `playing` no primeiro, `destroyed`/flush na troca, `startup_requested` no segundo e no retorno.                | A mídia anterior para, o lease antigo é liberado, o novo portal não interfere em outra sessão e o retorno funciona.                |
| R9  | Desmontagem/logout durante playback             | Trocar de rota ou sair enquanto o player está reproduzindo.                                                 | `destroyed` e flush best-effort; nenhum evento posterior do componente desmontado.                             | Não há requests órfãos, erro React, reprodução audível após logout ou lease preso.                                                 |
| R10 | VOD/episódio com resposta lenta e retomada      | Fixture VOD responde MP4 com atraso inicial controlado e depois mantém 200.                                 | `startup_requested`, `first_frame`, `playing`; `buffer_start`/`buffer_end` se houver pausa.                    | Primeiro frame ocorre antes do limite; play/pause e troca de item não deixam o conteúdo anterior tocando.                          |

## 3. Falhas recomendadas para elevar a confiança

| ID  | Falha                                     | Por que importa                                          | Critério recomendado                                                                                                                             |
| --- | ----------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| R11 | Offline do navegador e retorno online     | Representa perda real de conectividade do usuário.       | Ao voltar a rede, o player recupera ou mostra erro controlado em até 15 s; sem polling infinito.                                                 |
| R12 | HTTP 401/403 por expiração de autorização | Distingue origem indisponível de sessão inválida.        | Uma tentativa de renovação se o contrato suportar; caso contrário, erro de autorização claro, sem retry infinito e sem expor token.              |
| R13 | HTTP 404/410 em segmento ou playlist      | Representa conteúdo removido ou rota inválida.           | Classificação terminal rápida e mensagem adequada; não gastar 20 s em cada retry.                                                                |
| R14 | Latência variável e jitter                | Mede comportamento em redes ruins sem desligar a fonte.  | Buffering mensurado e retorno a `playing`; sem crescimento monotônico de memória no cliente.                                                     |
| R15 | Mudança de qualidade/variante HLS         | Confirma se ABR existe de fato, em vez de ser presumido. | Registrar variante/qualidade apenas de forma sanitizada; troca sem erro e sem perda longa. Se não houver ABR implementado, marcar como pendente. |
| R16 | Seek VOD para posição válida e inválida   | Valida o contrato de navegação temporal.                 | Seek válido retoma; seek inválido é rejeitado sem travar; não exigir esse gate para live.                                                        |

## 4. Ordem exata de execução

A sequência deve ser executada em uma única sessão de laboratório por cenário, sem paralelismo. Primeiro validar R4 e R5 para confirmar que o terminal error e o timeout não deixam loading infinito. Depois executar R3 para provar o HLS → TS. Em seguida executar R6, pois o retry só é válido se a falha anterior terminar com cleanup correto.

Depois de testar inicialização, executar R1 e R2 após `playing`; esses são os testes de recovery propriamente ditos. Só então executar R8 e R9 para provar troca de portal, cleanup e isolamento. Na sequência, repetir a lógica em R10 para VOD e episódio. R11–R16 são a camada de confiança adicional e devem ser marcados como aprovados, reprovados ou não suportados.

Entre cenários, destruir o player, esperar o flush de telemetria, verificar ausência de lease órfão e limpar o fixture. Não reaproveitar sessão ou URL de playback entre cenários se isso puder contaminar a medição.

## 5. Dados que precisam ser capturados

| Campo     | Regra                                                            |
| --------- | ---------------------------------------------------------------- |
| Cenário   | `scenario_ref` local, sem URL ou ID upstream.                    |
| Tipo      | `live`, `movie` ou `series`.                                     |
| Engine    | `native` ou `hls.js`.                                            |
| Startup   | Tempo entre `startup_requested` e primeiro frame ou timeout.     |
| Recovery  | Número de tentativas, tempo até `playing` e sucesso/falha.       |
| Buffering | Contagem, duração total e maior pausa.                           |
| Fallback  | Se ocorreu e qual transição segura foi usada, sem registrar URL. |
| Cleanup   | Se `destroyed` ocorreu e se o lease terminou.                    |
| Resultado | `pass`, `controlled_failure`, `unsupported` ou `fail`.           |

## 6. Definition of Done para recovery

O recovery será considerado aprovado quando R1, R2, R3, R4, R5, R6, R8, R9 e R10 passarem, sem loading infinito, listener duplicado, lease órfão, autoplay falso ou exposição de segredo. Para a meta 6/10, a matriz funcional precisa manter pelo menos 90% de primeiro frame nas tentativas autorizadas, com TTFF p50 até 5 s e p95 até 12 s, além de erro fatal não recuperado ≤ 10% na janela controlada.

R11–R16 não devem ser inventados no relatório. Se não houver suporte real a renovação de autorização, ABR ou seek específico, o resultado correto é `unsupported` e a nota fica limitada ao escopo comprovado.

## 7. Rollback e abort conditions

Abortar imediatamente se a simulação atingir qualquer origem fora do laboratório, se houver aumento de carga não planejado, se o proxy começar a registrar URLs/credenciais, se o número de requests crescer sem limite, se o worker apresentar crescimento monotônico de memória ou se o lease de outra sessão for tocado.

Antes de alterar código, gerar backup do build e manter rollback. Depois de cada patch, executar testes determinísticos, lint direcionado, build sanitizado, revisão de diff e deploy atômico apenas se o cenário permanecer reproduzível. Não executar migration, não alterar Nginx, não alterar firewall, não rodar `pm2 update` e não modificar pagamentos.

## 8. Estado atual

O MAGOPLAYERPRO já comprovou primeiro frame em live, filme e episódio em uma origem autorizada. O próximo gate técnico é implementar ou preparar o fixture isolado para R1–R10 e executar a matriz sem tocar fontes de clientes. A nota 6/10 só deve ser atribuída após esses resultados serem anexados ao smoke de produção e correlacionados por eventos QoE sanitizados.
