# Auditoria de interface responsiva — MAGOPLAYERPRO

**Data:** 27 de agosto de 2026  
**Escopo:** usuário comum, dono, navegação, TV ao Vivo, Filmes, Séries, Servidores, Conta, Suporte, player e painel administrativo.

## Resumo executivo

A estrutura atual é funcional e possui uma identidade visual consistente, mas ainda perde espaço em três pontos: duplicação de navegação, estados vazios que deixam grandes áreas escuras e um catálogo que só utiliza seu melhor arranjo a partir de larguras muito grandes. A recomendação é evoluir por camadas: primeiro corrigir o shell e os estados de conteúdo; depois adaptar o catálogo e o painel; por fim validar mobile, teclado, telas grandes e operação real.

A análise também aplica o princípio do [Google AIP-151][1]: operações que podem demorar devem expor estado rastreável, progresso, erro acionável e recuperação. No produto visual, isso significa que carregamento, vazio, erro, atualização e retry precisam ser estados diferentes, nunca uma tela preta indistinguível.

## Mapa de áreas

| Área | Rota | Shell | Risco visual principal | Prioridade |
|---|---|---|---|---|
| Início | `/inicio` | Usuário | Hero grande, navegação duplicada e atalhos pouco informativos | Alta |
| TV ao Vivo | `/canais` | Usuário + catálogo | Grid de três colunas sensível à largura e player lateral | Crítica |
| Filmes | `/filmes` | Usuário + catálogo | Estado vazio/loading sem orientação e posters dependentes de largura | Alta |
| Séries | `/series` | Usuário + catálogo | Fluxo de série/temporada/episódio precisa de hierarquia responsiva | Alta |
| Servidores | `/servidores` | Usuário | Estado sem portal sem CTA e cards dependentes de espaço horizontal | Alta |
| Conta | `/conta` | Usuário | Cards longos, ações críticas e estados nulos pouco explícitos | Alta |
| Suporte | `/suporte` | Usuário/dono | Lista + conversa precisa virar drawer/tela única no mobile | Alta |
| Painel | `/painel` | Dono | Hero repetido, sete abas densas e tabelas com overflow | Alta |
| Usuários | `/usuarios` | Dono | Tabelas e modais exigem validação em viewport estreita | Média |

## Achados visuais

### Shell autenticado

O shell usa uma sidebar fixa de 256 px no desktop, drawer no mobile, header sticky e um menu horizontal secundário em determinadas rotas. Quando o usuário está em Início, TV ao Vivo, Filmes ou Séries, a mesma navegação aparece no header e também na sidebar desktop. A primeira melhoria aplicada remove a repetição no desktop e mantém o menu completo no drawer mobile. O seletor de portal agora usa largura limitada por viewport para não empurrar o header em telas estreitas.

O shell também concentra polling de suporte, notificações e canais realtime. Essas operações devem continuar silenciosas e não podem causar layout shift; o padrão recomendado é manter skeleton local e mensagens de atualização, conforme a orientação de estados explícitos do AIP-151 [1].

### Catálogo e player

O catálogo usa categorias, lista e player em um grid. A composição anterior exigia três colunas a partir do breakpoint `lg`, o que comprimía a lista em notebooks e telas intermediárias. A primeira melhoria aplicada usa três modos: uma coluna no mobile; categorias ocupando a largura inteira e lista/player lado a lado em larguras intermediárias; e três colunas completas em telas grandes.

Em mobile, categorias, lista e player ficam empilhados e o comportamento existente de rolagem ao abrir um conteúdo é preservado. No desktop grande, o player continua sticky. Cards live mantêm proporção 16:9 e filmes/séries mantêm proporção de poster, reduzindo salto de layout durante carregamento.

### Estados vazios

As rotas de catálogo e servidores exibiam mensagens curtas ou grandes áreas escuras quando não havia portal liberado, itens ou resposta. Foi criado um componente `ContentEmptyState` com ícone, título, explicação e ação opcional, preparado para estados de portal ausente, busca sem resultado, categoria vazia e conteúdo indisponível. Isso transforma ausência de dados em orientação de produto.

### Painel do dono

O painel combina hero, cards de contexto, abas administrativas e tabelas. As sete abas agora ficam em faixa horizontal rolável em vez de quebra irregular, preservando alvos de toque e leitura em mobile. O conteúdo de Auditoria continua somente leitura e sanitizado, com referências hash e sem IDs brutos, tokens, URLs ou credenciais.

### Conta e Suporte

Conta e Suporte exibiram estados visualmente vazios na sessão auditada. A próxima camada deve distinguir carregamento, erro de consulta, conta sem plano, conta válida e suporte sem conversa. Para o Suporte, o desktop deve usar lista + conversa; em mobile, a lista deve ser uma tela/drawer com retorno explícito. Para Conta, os cards devem priorizar plano, conexões, validade, segurança e logout, com ações críticas sempre visíveis.

## Melhorias aplicadas neste lote

| Mudança | Arquivo | Efeito |
|---|---|---|
| Estado vazio reutilizável | `src/components/ui/content-empty-state.tsx` | Evita telas pretas e explica próximos passos |
| Grid adaptativo | `src/components/player/Catalog.tsx` | Usa melhor mobile, notebook e desktop grande |
| Estados de catálogo | `src/components/player/Catalog.tsx` | Diferencia portal ausente e busca sem resultado |
| Navegação sem duplicação | `src/routes/_authenticated/route.tsx` | Sidebar e tabs não competem no desktop |
| Seletor de portal responsivo | `src/routes/_authenticated/route.tsx` | Evita overflow no header estreito |
| Abas administrativas | `src/components/owner-panel/owner-panel-tabs.tsx` | Rolagem horizontal acessível em vez de quebra |

## Critérios de validação

A auditoria de implementação deve verificar quatro larguras: 360–390 px, 768 px, 1280 px e 1920 px ou superior. Em cada uma, os critérios são ausência de overflow horizontal acidental, foco visível, alvos de toque utilizáveis, títulos não cortados, player sem sobreposição e estados de loading/erro/vazio legíveis.

Fluxos críticos devem ser validados em navegador real: abrir cada catálogo, trocar portal, iniciar conteúdo, retornar ao catálogo, abrir Conta, sair e voltar ao login; no dono, abrir todas as abas do painel, paginar Auditoria e confirmar redaction. Operações potencialmente longas devem mostrar progresso ou estado explícito em vez de bloquear a página, seguindo a regra prática de aproximadamente dez segundos do AIP-151 [1].

## Estado e riscos remanescentes

O primeiro lote está implementado localmente, passou a suíte oficial de 34 testes, lint lógico direcionado e build sanitizado sem o identificador legado. O rollout ainda deve ser publicado após revisão final do diff e validação visual pós-deploy. As telas Conta e Suporte precisam de uma rodada específica com sessão e dados autorizados; a auditoria atual observou estados vazios, não um diagnóstico conclusivo de backend.

A melhoria visual não deve ser confundida com certificação de player top 1. Reprodução, QoE, ABR, recuperação, compatibilidade e escala permanecem gates próprios.

## Referências

[1]: https://google.aip.dev/151 "Google AIP-151 — Long-running operations"

## Iteração 2 — Suporte responsivo

O Suporte recebeu um modo adaptativo lista/conversa. Em viewport compacta, a lista de atendimentos ocupa a tela inicialmente; ao selecionar um protocolo, a conversa ocupa a área disponível e o controle de retorno devolve o usuário à lista. Em desktop, a divisão permanece em duas colunas com altura limitada e rolagem interna, evitando que a página inteira cresça indefinidamente. O contrato de chat, paginação, leitura, envio, anexos e encerramento foi preservado.

A validação local passou com 34/34 testes, lint lógico direcionado e build sanitizado. A validação de viewport móvel deve ser repetida em dispositivo/viewport real antes da certificação final de responsividade.

## Fechamento da auditoria de abas

Foram auditadas as áreas Início, TV ao Vivo, Filmes, Séries, Servidores, Conta, Suporte, Usuários e Painel do dono no build publicado. A auditoria encontrou e corrigiu duas regressões de runtime no processo: a referência de ícone no shell e a ordem condicional de hooks em Usuários. O Suporte também recebeu correção de colisão de símbolo e ordem segura de estado antes de sua validação final.

As validações finais confirmaram: Início com hero/atalhos; TV ao Vivo com estado vazio orientativo; Filmes com categorias, busca, cards e player reservado; Séries com 323 itens e paginação; Servidores com estados de portal; Conta com plano, indicação, segurança e logout; Suporte com lista/conversa, filtros e retorno; Usuários com filtros, tabela, paginação e `0 / 20` no laboratório; Painel com abas administrativas e Auditoria.

O primeiro lote foi publicado no `7550222`, o modo responsivo do Suporte no `d63d205`, o hotfix do ícone no `d55842e`, a ordem segura de estado no `0b6c9e6` e o hotfix de hooks de Usuários no `10e23ca`. Os builds correspondentes passaram por manifesto, readiness e rollback. A validação visual ocorreu em viewport desktop; a certificação de mobile físico e telas TV permanece uma etapa própria.
