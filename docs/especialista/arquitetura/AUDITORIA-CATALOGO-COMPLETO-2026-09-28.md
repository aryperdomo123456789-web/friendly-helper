# Auditoria de catálogo completo M3U — 2026-09-28

## Escopo

Elevação controlada dos tetos do catálogo e preservação do acervo comercial no projeto `/www/wwwroot/stream.mago-bot.com`, sem alterar autenticação, permissões, player/proxy, pagamentos, webhook, chat, migrations ou dados financeiros.

## Diagnóstico antes da mudança

A playlist persistida em produção tinha 68.995.268 bytes e declarou 326.372 entradas:

| Tipo estrutural      | Entradas reais observadas | Categorias | Corte anterior |
| -------------------- | ------------------------: | ---------: | -------------: |
| Live                 |                     1.724 |         54 |          4.000 |
| Filmes               |                    42.260 |         46 |          4.000 |
| Séries/episódios M3U |                   282.388 |         42 |          4.000 |

As 282.388 linhas de série eram episódios com padrão de temporada/episódio. A metadata M3U não carregava `series_id`; por isso, o parser não deve tratar cada episódio como uma série independente. A correção deduplica os episódios por título normalizado e hidrata a lista final via `get_series`, preservando IDs Xtream reais para o carregamento posterior de temporadas e episódios.

## Mudança aplicada

Foi criado o contrato central `src/lib/catalog-limits.ts`:

- Live: **10.000** streams;
- Filme/VOD: **50.000** streams;
- Série: **16.000** séries.

O parser streaming agora:

1. mantém spool em disco e hash incremental;
2. aplica os tetos durante o consumo, sem acumular 326 mil objetos;
3. normaliza o sufixo `SxxExx` e deduplica episódios em uma entrada por série;
4. gera um identificador M3U temporário apenas para fallback;
5. hidrata as séries via Xtream quando a M3U é a fonte principal;
6. mantém o carregamento de episódios sob demanda através de `get_series_info`;
7. preserva escrita de cache em lotes controlados de até 500 linhas de cache.

O caminho direto Xtream da UI também deixou de usar o corte global de 4.000 e passou a respeitar o teto do tipo solicitado.

## Validação local

- Suíte completa: **63/63 testes aprovados**.
- Testes novos: tetos comerciais, normalização de título e deduplicação de episódios.
- `git diff --check`: aprovado.
- Build sanitizado local: aprovado.
- Build remoto isolado: aprovado.
- Scan do output: sem identificador Supabase legado e sem valores de credenciais detectados.

## Backup e rollback

Backup preventivo criado antes da alteração:

```text
Diretório: /root/backups/mago-catalog-cap-pre-20260928T225137Z
Arquivo: /root/backups/mago-catalog-cap-pre-20260928T225137Z.tar.gz
Tamanho: 18.968.339 bytes
SHA-256: 700bc4238f6f01386eed3ca7a4004657133df6fa1ba0c3a90a3247f4d6e8e8c0
```

Rollback do output ativo preservado em:

```text
/www/wwwroot/stream.mago-bot.com/.output.rollback-catalog-cap-20260928T225525Z
```

Manifesto ativo após deploy:

```text
8b077a27dcf3e486b6f6fd90bca4d73ebff797e74dc43ee3545cac673728e859
```

## Deploy e health-check

- Root público: **HTTP 200**.
- Asset público: **HTTP 200**.
- Token inválido: **HTTP 403**.
- `stream-mago-bot`: online.
- `stream-mago-bot-player`: online.
- `stream-mago-bot-payments`: online.
- `stream-mago-bot-worker`: online.

## Refresh completo real

Foi executado um refresh manual one-shot contra um servidor ativo livre, usando a fila durável já existente e sem origem nova ou carga contra upstream adicional.

Resultado final:

| Métrica                          |                                      Resultado |
| -------------------------------- | ---------------------------------------------: |
| Estado                           |                                    `succeeded` |
| Duração observada pelo runner    |                                  **28.454 ms** |
| Fonte                            |                                            M3U |
| Live                             |              **1.724 streams / 54 categorias** |
| Filmes                           |             **42.260 streams / 46 categorias** |
| Séries                           |               **9.561 séries / 42 categorias** |
| Hidratação M3U → Xtream          | **9.561 candidatos / 9.561 séries hidratadas** |
| Cache local persistido de filmes |                               **42.260 itens** |
| Cache local persistido de séries |                                **9.561 itens** |
| Cache local persistido Live      |                                **1.724 itens** |

A playlist declarou 326.372 entradas, mas o catálogo final correto não replica episódios como séries: ele entrega 9.561 séries e mantém episódios sob demanda, conforme o contrato atual do player.

## RAM e PM2 durante o refresh

Amostragem PM2 a cada aproximadamente 2 segundos durante o refresh:

| Indicador                 |   Resultado |
| ------------------------- | ----------: |
| Amostras                  |          13 |
| RSS mínimo                |      87 MiB |
| RSS máximo                | **285 MiB** |
| RSS após resfriamento     |  **98 MiB** |
| CPU máxima observada      |      102,1% |
| Amostras acima de 150 MiB |           8 |
| Amostras acima de 300 MiB |       **0** |
| Reinício durante o ciclo  |         Não |
| Status do worker          |      Online |

O pico ficou abaixo do hard limit PM2 de 300 MiB, mas acima do alerta operacional de 128/150 MiB. Isso prova que a indexação completa cabe no teto atual, não prova estabilidade premium em ciclos repetidos por 24–72 horas.

## Intercorrência observada

Uma tentativa automática iniciada logo após o deploy registrou um abort transitório na hidratação Xtream: `This operation was aborted`. Ela não foi usada como evidência final. O refresh manual subsequente concluiu com sucesso e registrou a hidratação completa de 9.561 séries. Não houve `refresh_m3u_failed_fallback` no ciclo manual final.

## Conclusão honesta

A barreira de 4.000 foi removida com tetos comerciais adequados e o acervo real foi indexado sem ultrapassar 300 MiB. O resultado está **aprovado para validação funcional do catálogo completo**, com risco operacional de RAM ainda aberto. A próxima etapa correta é acompanhar vários refreshes reais e medir a distribuição de RSS, duração, aborts Xtream e tempo de persistência antes de reduzir ou elevar limites de PM2.
