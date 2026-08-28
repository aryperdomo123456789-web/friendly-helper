# Evolução de streaming, EPG e segurança — 2026-08-27

## Escopo

Esta entrega melhora o caminho de playback sem alterar autenticação, seleção de portal, catálogo, leases, pagamentos, chat ou o formato público retornado por `getPlaybackUrl`. A URL de reprodução continua sendo emitida pelo proxy da aplicação e o upstream continua oculto do navegador.

## HLS.js

O player passou a usar presets distintos para Live e VOD em `src/lib/hls-player-config.ts`. Live usa `lowLatencyMode: true`, buffer alvo de 20 segundos, teto de 60 segundos e back buffer de 30 segundos. Filme e série usam `lowLatencyMode: false`, buffer alvo de 45 segundos, teto de 180 segundos e back buffer de 90 segundos. Ambos limitam o tamanho aproximado do MSE, capam a qualidade ao tamanho do player e reduzem a qualidade quando a taxa de frames descartados indica pressão.

As políticas `fragLoadPolicy`, `playlistLoadPolicy` e `manifestLoadPolicy` usam retries finitos com backoff exponencial. O componente mantém uma camada adicional pequena para falhas fatais e stalls já iniciados: espera 500 ms, 1 s, 2 s, 4 s e 8 s no máximo, sem passar de cinco tentativas em Live ou quatro em VOD; ao atingir o limite, usa o fallback já existente ou exibe erro. O timer é cancelado no cleanup e não existe retry infinito.

Essa escolha segue a API oficial do HLS.js, que diferencia `maxBufferLength`, `maxMaxBufferLength`, back buffer, políticas de loader e `recoverMediaError()`. Buffer maior não é tratado como sinônimo automático de qualidade: ele aumenta consumo potencial de memória e pode piorar o tempo de início.

## EPG offline e virtualização

`src/lib/epg-client.ts` fornece parsing/normalização determinística de timestamps, ordenação estável, índice do programa corrente e cálculo de janela virtual. O `PlayerInfo` renderiza somente os eventos visíveis mais quatro itens de overscan por lado, mantendo a altura total do viewport para scroll contínuo. O modelo é intencionalmente sem dependência adicional de virtualização, pois a lista atual é de eventos do canal selecionado e pode ser virtualizada com uma estratégia fixa e auditável.

O snapshot EPG é persistido no IndexedDB do navegador com chave composta por usuário, servidor e canal. Dados frescos são considerados válidos por seis horas; um snapshot de até sete dias pode ser exibido como fallback offline enquanto a rede é recuperada. O cache local guarda apenas os campos de programação já normalizados, não credenciais, URLs upstream, playlists ou tokens. A autenticação e o servidor continuam sendo a fonte de verdade.

A invalidação de catálogo existente permanece intacta. A escrita local acontece somente quando o retorno remoto contém eventos; falhas do IndexedDB são silenciosas e não bloqueiam o player.

## Token HMAC

O proxy já usava AES-256-GCM para confidencialidade do destino upstream. Esta entrega adiciona uma versão de envelope `v: 2` e uma assinatura HMAC-SHA-256 sobre o pacote cifrado. A URL nova contém `s` e `h`; a rota pública e o serviço dedicado verificam ambos antes de encaminhar a requisição. Playlists reescritas recebem novos tokens HMAC automaticamente.

Tokens sem a assinatura continuam aceitos somente quando são envelopes legados sem `v: 2`, permitindo a drenagem segura de URLs já emitidas durante o TTL anterior. Novas URLs nunca são emitidas sem HMAC. A assinatura impede adulteração do ciphertext e do destino, mas não elimina replay por um cliente já autorizado durante o TTL; por isso o TTL, a autenticação do fluxo de emissão e o escopo por usuário/servidor continuam necessários.

## Testes

A suíte determinística passou em 43/43. Foram adicionados testes de indexação de 10.000 eventos, janela virtual, presets Live/VOD, retries finitos, round-trip HMAC e rejeição de assinatura adulterada. O TypeScript global ainda possui diagnósticos históricos fora dos arquivos alterados; não há diagnóstico novo nos módulos desta entrega. O `git diff --check` passa e os módulos novos passam pelo Prettier.

## Limitações honestas

Ainda é necessário validar playback em dispositivos físicos, Safari/iOS, Android, tablet e televisores, além de medir TTFF, rebuffer ratio, dropped frames, latência Live e memória em carga. A virtualização atual cobre o bloco de eventos do canal selecionado; uma grade multi-canal exigiria um contrato backend que entregue EPG de múltiplos canais e não deve ser inventada no frontend. O HMAC melhora integridade e não substitui DRM, watermarking ou controle de concorrência de sessão.

## Referências

[1]: https://github.com/video-dev/hls.js/blob/master/docs/API.md "HLS.js v1 API e fine tuning"
[2]: https://hlsjs-dev.video-dev.org/api-docs/ "HLS.js API Reference"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN IndexedDB API"
