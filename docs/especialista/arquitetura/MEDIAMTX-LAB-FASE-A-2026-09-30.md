# MediaMTX — Fase A: laboratório isolado

**Data:** 2026-09-30
**Host:** produção VPS, somente camada de laboratório
**Status:** homologado para laboratório; não integrado ao gateway ativo e não publicado no tráfego de usuários.

## Escopo

Foi instalado o binário oficial MediaMTX v1.9.3 Linux amd64 em `/opt/mediamtx-lab/`.

Hash SHA-256 do binário instalado:

```text
b59ecfdaa4ad9aad2281fda1ed46a73eaa0f08fb0d6271a287e87506fd9df2e7
```

O laboratório usa serviços systemd separados:

- `mediamtx-lab.service`: MediaMTX principal, HLS em `127.0.0.1:6876` e métricas em `127.0.0.1:9997`.
- `mediamtx-fixture-source.service`: receptor RTSP local da fixture em `127.0.0.1:18554`.
- `mediamtx-fixture.service`: `ffmpeg` gerando vídeo H.264 e áudio AAC sintéticos, sem origem IPTV.

A API administrativa do MediaMTX ficou desativada. A porta 9997 é exclusivamente de métricas Prometheus locais.

## Isolamento

Não foram alteradas as portas do produto:

- `127.0.0.1:6873` — HTTP 200 no pós-teste.
- `127.0.0.1:6874/healthz` — HTTP 200 no pós-teste.
- `127.0.0.1:6875/healthz` — HTTP 200 no pós-teste.

Os processos PM2 do MAGOPLAYERPRO permaneceram online no pós-teste, incluindo player, pagamentos e os dois workers de catálogo.

Nenhuma origem de cliente, credencial, token, playlist privada ou Servidor 1 foi usado na fixture.

## Configuração do path

O path principal é `fixture`, com origem RTSP local sob demanda:

```yaml
paths:
  fixture:
    source: rtsp://127.0.0.1:18554/fixture
    sourceOnDemand: yes
    sourceOnDemandStartTimeout: 10s
    sourceOnDemandCloseAfter: 10s
    maxReaders: 4
```

RTSP, RTMP, WebRTC e SRT públicos ficaram desativados no MediaMTX principal. Todos os listeners de laboratório usam loopback.

## Evidência de reprodução

O endpoint HLS interno retornou manifesto real com:

- HLS versão 9;
- variante de vídeo 640×360;
- `avc1`/H.264;
- `mp4a`/AAC;
- frame rate de 25 fps;
- segmentos fMP4/LL-HLS gerados pelo MediaMTX.

O `ffprobe` confirmou os dois streams, áudio e vídeo, no manifesto interno.

## Métricas observadas

Durante a leitura do manifesto e inspeção com `ffprobe`:

| Métrica                       | Evidência observada |
| ----------------------------- | ------------------: |
| Bytes recebidos pelo path     |          8.255.460+ |
| Bytes enviados pelo path      |          8.255.460+ |
| Bytes enviados pelo muxer HLS |            965.880+ |
| RSS MediaMTX principal        |            ~31,9 MB |
| RSS receptor RTSP da fixture  |            ~11,5 MB |
| RSS ffmpeg da fixture         |            ~25,5 MB |
| Estado do path                |             `ready` |
| Estado das 3 unidades         |            `active` |

Os valores são uma amostra de laboratório, não uma capacidade comercial certificada.

## Adapter e circuit breaker preparatórios

Criados sem wiring nos entrypoints ativos:

- `src/lib/media-adapters/types.ts`
- `src/lib/media-adapters/circuit-breaker.ts`
- `scripts/media-adapter-circuit-breaker.test.ts`

O protótipo suporta:

- contrato server-only para `probe`, `start`, `health` e `stop`;
- estados `closed`, `open` e `half_open`;
- threshold de falhas;
- cooldown;
- fallback ordenado entre gateway atual e MediaMTX;
- exclusão automática de candidato aberto;
- reset após sucesso.

## Validação de código

- Testes do circuit breaker: **3/3 aprovados**.
- `git diff --check`: **aprovado**.
- Build sanitizado local: **aprovado**.
- Nenhum entrypoint de produção foi alterado.
- Nenhum deploy do app foi executado.

## Limitações honestas

Ainda não está validado:

- playback real de usuário pelo MAGOPLAYERPRO usando MediaMTX;
- integração com o token HMAC atual;
- autorização por usuário e `server_id` no MediaMTX;
- carga concorrente comercial;
- failover real entre gateway 6874 e MediaMTX 6876;
- compatibilidade Safari/iOS/Android/TV;
- estabilidade de 24–72 horas.

## Próximo gate seguro

Criar um adapter MediaMTX real em ambiente de laboratório, com token de teste e `server_id` fixture, sem alterar o caminho do Servidor 1. Só depois de métricas comparativas e validação do circuito será considerado um canário elegível.
