# Identidade canônica dos portais e observação privada do owner

**Data:** 26 de agosto de 2026<br>
**Projeto:** MAGOPLAYERPRO<br>
**Escopo:** nomes sequenciais, reordenação administrativa e referência privada da origem IPTV

## Contrato funcional

Os servidores IPTV passam a ser apresentados com nomes canônicos baseados exclusivamente na posição atual da lista: `Portal 1`, `Portal 2`, `Portal 3` e assim por diante. O proprietário não digita nem edita esse nome. Ao arrastar um portal, a interface renumera imediatamente os cards e o backend persiste a nova ordem e os novos nomes na mesma transação da RPC administrativa.

A inclusão e a exclusão também normalizam toda a sequência. Não ficam lacunas intencionais na nomenclatura; se o Portal 2 for excluído, o antigo Portal 3 passa a ser Portal 2. O UUID continua sendo o identificador técnico estável e não muda quando a posição muda.

| Campo                              | Finalidade                               | Visibilidade                                     |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `iptv_servers.id`                  | Identificador técnico estável            | Interno                                          |
| `iptv_servers.sort_order`          | Ordem operacional                        | Dono/admin e backend                             |
| `iptv_servers.name`                | Rótulo canônico `Portal N`               | Usuários autorizados e administração             |
| `iptv_server_owner_notes.note`     | Referência privada do servidor conectado | Somente owner                                    |
| `iptv_servers.connection_capacity` | Capacidade operacional da origem IPTV    | Administração; não é limite comercial do usuário |

## Observação privada

A tabela `iptv_server_owner_notes` mantém uma observação por portal, com limite de 2.000 caracteres e atualização em UTC. Ela existe para referências internas, como identificação da origem conectada, região, contrato ou anotação operacional. O conteúdo não deve conter senhas, tokens, URLs com credenciais ou dados pessoais desnecessários.

A proteção tem duas camadas. No banco, Row Level Security permite a tabela apenas para a função `owner`; admin, usuário comum e anônimo não conseguem ler ou gravar o conteúdo diretamente. No backend, as funções administrativas identificam explicitamente o papel e só consultam ou atualizam as notas quando o papel é `owner`. Mesmo que um admin envie `owner_note` manualmente, o campo é ignorado.

A tela usa `can_edit_owner_note` apenas para exibir o editor ao owner. Essa flag não é a autoridade de segurança: toda tentativa continua dependendo da autorização server-side e da política RLS.

## Reordenação atômica

A RPC `admin_reorder_iptv_servers` passa a exigir uma lista completa, sem UUID duplicado e sem portal inexistente. Ela valida owner/admin, atribui `sort_order` sequencial e grava `name = 'Portal ' || posição` para todos os portais no mesmo bloco transacional. Uma lista parcial ou inválida é rejeitada, evitando que a operação deixe portais com ordem ou nome inconsistente.

O backend também normaliza os nomes após salvar e excluir portal. Isso protege os caminhos administrativos que não passam pelo drag-and-drop e mantém o player coerente depois de uma inclusão ou remoção.

## Compatibilidade e segurança

A alteração não muda o UUID, DNS, credenciais, `user_server_access`, `device_sessions`, heartbeat, lease, cache IPTV, contrato do player ou proxy. A troca de posição muda apenas a apresentação e a ordem; a origem técnica continua identificada pelo mesmo UUID.

A migration foi criada de forma aditiva e **não foi aplicada em produção nesta etapa**. Antes de aplicar, deve existir backup PostgreSQL verificável, janela operacional, validação da RPC em staging ou laboratório e rollback documentado. O código server-side tolera temporariamente a ausência da tabela de notas, mas a edição da observação só terá efeito depois da aplicação da migration correspondente.

## Validação executada

| Verificação                | Resultado                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Numeração `Portal N`       | Testes determinísticos aprovados.                                                        |
| Reordenação otimista da UI | Atualiza nome e posição imediatamente; erro restaura a lista anterior.                   |
| Lista completa na RPC      | Migration revisada para rejeitar lista parcial, duplicada ou inexistente.                |
| Observação privada         | Campo exibido somente quando o retorno server-side autoriza o owner.                     |
| Suíte existente            | `npm run test:worker`: 13 testes aprovados.                                              |
| Build                      | Build multisserviço aprovado com Supabase público correto; identificador legado ausente. |
| Produção                   | Nenhum deploy, migration, reload, restart ou alteração de dados executado.               |

A validação visual com duas identidades administrativas diferentes não foi executada, pois não foi criado usuário adicional de laboratório. O isolamento é protegido no backend e no RLS, mas a verificação de navegador com owner e admin distintos deve ser feita antes de ativar a migration em produção.
