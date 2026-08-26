# Plano de evolução do player — 3/10 para 6/10

**Projeto:** MAGOPLAYERPRO
**Data:** 26 de agosto de 2026
**Responsável técnico:** Manus AI
**Escopo:** player, proxy de mídia, seleção de portal, telemetria QoE e operação de produção.
**Fora do escopo:** login, permissões, catálogo como produto, pagamentos, chat, migrations destrutivas, alteração de Nginx e rotação de secrets.

## 1. Diagnóstico de partida

A nota atual é **3/10 em comparação com players líderes**, porque o fluxo de catálogo e seleção de portal está funcional, mas a reprodução real ainda não atingiu primeiro frame nos canais testados. A evidência mais importante da rodada foi registrada em `docs/especialista/deploy/SMOKE-PLAYER-PRODUCAO-2026-08-26.md`: o serviço dedicado recebeu HTTP 200, porém o conteúdo upstream foi classificado como `text/html` quando o player esperava uma playlist HLS, resultando em `playlist_invalid`.

A base de engenharia já possui sessão por usuário/dispositivo, lease por portal, proxy server-side com token cifrado, recuperação HLS limitada, cleanup, telemetria QoE sanitizada, troca de portal reversível e deploy atômico. Essas capacidades melhoram a segurança operacional, mas não substituem a prova de que a mídia entregue é reproduzível.

## 2. Objetivo de 6/10

A meta de **6/10** significa um player operacionalmente confiável para um piloto controlado, não uma promessa de equivalência com Netflix. O aceite exige reprodução comprovada em fonte de laboratório autorizada e cobertura mínima de live e VOD, além de diagnóstico suficiente para separar erro de origem, proxy, formato e navegador.

| Gate            | Critério de aceite para a meta 6/10                                                                                                       | Evidência exigida                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Formato         | O URL gerado respeita `ts` ou `m3u8` quando o catálogo informa o formato; extensões desconhecidas usam fallback seguro.                   | Testes determinísticos do builder e logs de formato.          |
| Primeiro frame  | Pelo menos 5 sessões válidas por modalidade testada alcançam primeiro frame; nenhuma declaração baseada apenas em HTTP 200.               | Eventos `first_frame` e `playing` correlacionados por sessão. |
| Tempo de início | Medir TTFF p50/p95 em live e VOD. Proposta inicial: p50 ≤ 5 s e p95 ≤ 12 s em laboratório estável.                                        | Relatório QoE com amostra, navegador e data.                  |
| Erro            | Erro nativo, erro HLS e bloqueio de autoplay ficam separados; não há falso `autoplay_blocked` após erro de mídia.                         | Testes do player e logs/telemetria.                           |
| Recovery        | Pelo menos um recovery real de mídia ou rede retorna a `playing` sem duplicar listeners ou leases.                                        | Sequência `fatal_error → recover_attempt → recover_success`.  |
| Portal          | Troca Portal 1 ↔ Portal 2 mantém isolamento, catálogo escopado e uma única sessão por dispositivo.                                        | Smoke browser + consulta somente leitura de sessão.           |
| Cobertura       | Validar ao menos live e VOD em uma fonte licenciada/consentida; séries entram como extensão se a origem oferecer episódios reproduzíveis. | Matriz de teste sanitizada.                                   |
| Operação        | Build sem identificador legado, quatro processos online, readiness 200, manifesto comparado e rollback disponível.                        | Manifestos, PM2 e readiness do deploy.                        |

Os valores de TTFF são **critérios internos de piloto**, não benchmark de mercado. A nota só sobe quando os gates forem preenchidos com dados reais.

## 3. Ações executadas nesta rodada

Foi implementado o helper puro `src/lib/stream-format.ts` e o builder `buildStreamUrl` passou a aceitar apenas extensões seguras. Para live, `ts` permanece TS e `m3u8` permanece HLS; valores desconhecidos continuam em HLS como fallback conservador. O ponto de geração de playback deixou de tratar qualquer live sem `ext=ts` como HLS por heurística textual e passou a decidir pelo URL efetivamente construído.

Foram adicionados casos determinísticos à suíte `test:worker`: extensão TS, extensão HLS e fallback para valores desconhecidos. O build foi gerado com as variáveis atuais de produção somente em memória, passou a varredura contra o identificador legado e produziu o manifesto de rollout `a0c8a40899eb8b2c466b1722091eacbc3bc2a8b5557eb7fb280c869f1a7efacc`.

O commit `8f93d37` foi publicado no GitHub e o mesmo build foi aplicado atomicamente no aaPanel. O manifesto anterior `26d33d34422f6df86c904ed491e36648ed3c184bd4cc971ad6452536db030688` ficou preservado para rollback. Readiness local e público passaram, e a observação adicional manteve os quatro processos online. Não houve nova reprodução após o deploy; primeiro frame, recovery e TTFF continuam gates pendentes.

## 4. Etapas seguintes

### Etapa A — Formato e origem

Executar o novo build em produção de forma atômica. Após o rollout, testar somente conteúdos autorizados e correlacionar o resultado pelos logs `stream_upstream`. Se o upstream continuar devolvendo HTML, o próximo passo é corrigir a configuração/origem autorizada; não aumentar timeout ou criar tentativas indiscriminadas.

### Etapa B — Matriz QoE controlada

Com uma fonte reproduzível, testar live e VOD em pelo menos dois portais, medindo `startup_requested`, `manifest_loaded`, `first_frame`, `playing`, buffering, erro e recovery. Registrar TTFF p50/p95, taxa de primeiro frame, taxa de erro e recuperação por engine. Não usar carga de produção nem conteúdos de terceiros sem autorização.

### Etapa C — Compatibilidade e experiência

Depois da primeira reprodução estável, validar hls.js em navegador sem HLS nativo, controles nativos, mobile, troca de canal, retorno ao portal anterior, encerramento de componente e prevenção de vazamento de lease. Só então avaliar qualidade selecionável, variantes ABR, VOD e episódios.

### Etapa D — Operação

Observar PM2 e readiness por janela prolongada. O worker continua com contador histórico elevado de reinícios; a leitura de memória oscilou após reload e precisa de diagnóstico separado. Não executar `pm2 update`, migration, alteração de firewall ou rotação de secret como parte do aceite do player.

## 5. Rollout e rollback

Cada publicação deve seguir o procedimento versionado em `deploy/instructions.txt`: backup do build ativo, manifesto SHA-256 ordenado por caminho, transferência para stage, comparação local/remota, troca atômica, reload nominal de main/player/payments/worker, readiness por polling e rollback automático em caso de falha. O `.env`, tokens, playlists, URLs upstream, IDs de sessão e artefatos runtime nunca entram no GitHub.

## 6. Definição de pronto

O player será reportado como **6/10** somente quando a matriz QoE registrar primeiro frame e `playing` em fonte autorizada, os gates de erro/recovery/portal forem aprovados e os indicadores de operação forem observados sem regressão. Até lá, a classificação correta é **“fundação técnica evoluída, reprodução ainda bloqueada pela origem”**.
