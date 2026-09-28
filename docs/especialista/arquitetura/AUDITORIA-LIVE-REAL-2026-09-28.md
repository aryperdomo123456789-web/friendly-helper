# Auditoria real do Live e indicação — 2026-09-28

## Escopo

Foi usado o fluxo público autorizado `dono-livre` com um usuário de laboratório temporário e acesso autenticado ao catálogo. A credencial não é registrada neste documento. A reprodução foi feita no canal **Globo Rj FHD**, com comparação adicional nas variantes HD e SD, sem imprimir URL upstream, token, cookie ou segredo.

Nenhuma origem de cliente foi submetida a carga. As medições foram leituras de uma sessão individual no browser Sandbox e consultas sanitizadas ao Supabase/produção.

## Resultado do usuário de laboratório

| Verificação                  | Resultado                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Link de teste                | Criado e ativo pelo fluxo oficial `dono-livre`                                       |
| Login                        | Sucesso; sessão autenticada redirecionou para `/inicio`                              |
| Catálogo Live                | Carregado no servidor exibido como `servidor 1`                                      |
| Acesso a servidores          | 2 servidores ativos vinculados ao usuário                                            |
| Globo Rj FHD                 | Encontrado em `Globo Sudeste` e iniciou playback                                     |
| Indicação com código do dono | **Falhou na persistência**: o perfil ficou sem `referred_by_id` e sem código efetivo |

### Causa do bug de indicação

`src/lib/test-links.functions.ts` resolvia o código somente dentro do ramo de antifraude público. O link `dono-livre` é `owner_only`, portanto pulava esse ramo por desenho e descartava o código do dono. A correção move a resolução do código para antes do claim antifraude e permite owner/admin somente quando o link é explicitamente owner-only. Links públicos continuam impedindo que owner/admin sejam usados como referenciadores, preservando a proteção contra abuso.

## Evidência do playback real

### Elemento de mídia e transporte

- HLS respondeu `200` pelo endpoint público da aplicação.
- O elemento usou a rota interna `/api/public/stream`, com querystrings omitidas da evidência.
- Resolução detectada: `1920x1080`.
- `readyState=4`, `paused=false`, `playbackRate=1`, sem `MediaError`.
- Em uma janela limpa de oito segundos no FHD, `currentTime` avançou **8,001 s**.
- A fingerprint de quadro mudou em 7 de 8 amostras de um segundo; portanto não houve quadro visual totalmente congelado durante essa janela.
- Não foram observados eventos de console HLS/native de erro nessa sessão.

### Playlist e segmento

- Playlist Live: `target duration=12 s`, 9 segmentos na janela, `EXTINF` entre aproximadamente `9,6 s` e `11,2 s`, sem `ENDLIST`.
- Segmento TS: status `200`, alinhamento TS válido em pacotes de 188 bytes.
- Streams identificados: **H.264** de vídeo e **AAC** de áudio.
- Um segmento observado continha aproximadamente 9,5 s de PTS de vídeo.
- Intervalo mediano de PTS: aproximadamente **0,034 s**, compatível com cerca de 29,4 FPS na origem daquele segmento; mínimo observado ~0,033 s e máximo ~0,167 s.
- A origem observada não apresentou PTS de câmera lenta nem ausência de trilha de vídeo.

### Comparação por qualidade

| Variante     | Resultado da sessão Sandbox                                                            |
| ------------ | -------------------------------------------------------------------------------------- |
| Globo Rj FHD | Avanço temporal normal, 1920x1080, sem novos frames descartados na janela limpa        |
| Globo Rj HD  | Avanço temporal normal, 1920x1080, sem novos frames descartados na janela comparativa  |
| Globo Rj SD  | Avanço temporal normal, mas houve aumento de 22 frames descartados em 8 s nessa sessão |

A contagem de frames apresentada pelo browser Sandbox é apenas evidência do ambiente automatizado; ela não é certificação de FPS físico em Android, iOS, TV ou hardware do cliente. O dado confiável de cadência da origem foi o PTS do TS, que ficou próximo de 30 FPS.

## Causa técnica mais provável do sintoma reportado

A origem e o proxy entregaram vídeo H.264/AAC temporalmente íntegro. O problema observado é mais compatível com **caminho de decodificação/renderização do cliente**, especialmente porque o player antigo escolhia `native HLS` sempre que `canPlayType()` retornava `maybe`. No Chrome do teste:

- `canPlayType('application/vnd.apple.mpegurl') = 'maybe'`;
- MSE e H.264/AAC eram suportados;
- consequentemente, o código antigo bypassava HLS.js e também bypassava os presets de buffer, cap de FPS e recovery configurados em `hls-player-config.ts`.

Esse caminho nativo pode se comportar pior em Chromium, hardware com aceleração inconsistente, TV/WebView ou dispositivo sob pressão de CPU. O teste Sandbox não prova sozinho o comportamento no aparelho do usuário, mas fecha que não há um defeito simples de PTS lento, stream sem vídeo ou erro 4xx/5xx no proxy.

## Correção aplicada no código

1. Novo `src/lib/player-engine.ts`:
   - prioriza HLS.js quando MSE e H.264 são suportados;
   - mantém native HLS no Safari e iOS;
   - faz fallback native quando MSE não está disponível.
2. `VideoPlayer.tsx` usa o seletor centralizado e passa a ativar os presets HLS.js no Chromium/MSE.
3. `test-links.functions.ts` preserva o claim antifraude público e corrige o vínculo owner-only do referral.
4. Testes unitários cobrem Chromium/MSE, Safari, iOS e ausência de MSE.

A alteração não mexe em contrato de player, proxy, tokens, banco, permissões, pagamentos, chat, catálogo ou seleção de servidor.

## Limitações e gate pós-deploy

- Ainda não é correto afirmar que o aparelho do usuário está corrigido sem repetir o teste no dispositivo real.
- O próximo gate deve medir no aparelho afetado: TTFF, `currentTime` versus relógio, dropped/decoded frames, stalls, bitrate/qualidade selecionada e janela de 5–10 minutos.
- Se a reprodução continuar lenta após HLS.js, o próximo suspeito é capacidade/pressão do dispositivo ou bitrate FHD da origem, não o parser do proxy. Nesse caso, testar HD como fallback e comparar QoE, sem mascarar falhas.
- Não houve carga concorrente contra origem IPTV. A evidência desta auditoria é de uma sessão individual e não certifica estabilidade de 24–72 horas.
