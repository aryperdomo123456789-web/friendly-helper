# Validação do Mercado Pago sandbox — 2026-08-26

## Escopo e decisão de segurança

Esta validação foi executada em um preview local temporário, com o checkout Mercado Pago sandbox e o Supabase produtivo usado exclusivamente para o usuário laboratorial já existente. Antes de qualquer escrita foi criado um backup PostgreSQL customizado no servidor de produção. Não foram aplicadas migrations, alteradas permissões, atualizadas configurações financeiras, reiniciados processos de produção ou publicados bundles desta frente.

O backup foi validado com o `pg_restore` nativo do container PostgreSQL. O artefato é `/root/backups/stream-mago-before-mp-lab-20260826T144354Z.dump`, com 55.366.688 bytes, SHA-256 `92c5508f3fe6c1d43d4d897f24c760a6cd2940b522983619ad54dd22329b7cd5` e 649 entradas no inventário de restauração.

## Correções de código preparadas

O cliente Supabase deixou de acessar as variáveis públicas com notação dinâmica. Essa forma fazia o Vite serializar o objeto inteiro `import.meta.env`, incluindo o identificador legado do projeto. O acesso agora é estático, preservando o fallback server-side e o contrato do player.

A configuração do Vite deixou de expor automaticamente todo `VITE_*`. Somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são definidos explicitamente. O build sandbox usa os valores atuais extraídos da produção em memória; o `.env` produtivo não foi editado nem versionado.

O override de Mercado Pago sandbox ficou restrito a runtime não produtivo: `NODE_ENV` diferente de `production` e `MP_SANDBOX_MODE=true`. O token, a Public Key e o segredo sandbox são lidos somente no servidor e substituem a configuração financeira carregada do banco apenas dentro desse processo de laboratório. Em produção, o override não é aplicado.

## Matriz de evidências

| Item | Resultado | Evidência observada |
|---|---|---|
| Bundle sem projeto Supabase legado | **Passou** | Busca binária em `.output` não encontrou o identificador antigo. |
| Bundle apontando para Supabase customizado | **Passou** | `https://supabase.mago-bot.com` presente no artefato. |
| Chave pública embutida | **Passou** | Comprimento e SHA-256 da chave embutida coincidiram com a produção; o valor não foi registrado. |
| Login do usuário de laboratório | **Passou** | Login local e login pelo domínio HTTPS público redirecionaram para `/inicio`. |
| Isolamento visual de usuário comum | **Passou** | Catálogo, servidores, conta e suporte carregaram sem controles administrativos. |
| Área de conta e planos | **Passou** | `/conta` exibiu plano atual e quatro planos pagos. |
| Preferência Checkout Pro sandbox | **Passou** | A preferência mensal de R$ 30,00 foi criada e abriu o redirecionamento `sandbox.mercadopago.com.br`. |
| Registro local da preferência | **Passou** | Um registro laboratorial foi criado com status `pending`, moeda BRL, valor 30,00 e referência externa contendo `userId` e `planId`. |
| Idempotência na criação | **Parcial — código confirmado** | O código envia `X-Idempotency-Key` com UUID por requisição; o valor não é persistido nem foi repetido em um teste de retry. |
| Compra sandbox | **Não executada** | Foi interrompida antes de cartão/login de comprador por falta de conta compradora distinta. |
| Webhook Mercado Pago real | **Não executado** | A URL pública ficou disponível, mas nenhum evento real foi entregue durante esta validação. |
| HMAC `x-signature` real | **Não executado** | O segredo oficial de webhook sandbox não foi fornecido; o segredo temporário do preview não prova assinatura do provedor. |
| Ativação de plano | **Não executada** | Depende de um pagamento sandbox aprovado entregue ao webhook. |
| Bônus de indicação | **Não executado** | Depende de uma compra aprovada por usuário comprador distinto e elegível. |
| Comprovante | **Não executado** | Depende do processamento real do webhook aprovado. |
| Produção | **Preservada** | Nenhum deploy, reload, migration, alteração de configuração financeira ou mudança de permissão foi realizado. |

## Estado financeiro laboratorial

Antes do checkout, o usuário laboratorial possuía zero registros na tabela `payments`. Após a criação bem-sucedida da preferência, passou a existir exatamente um registro com status `pending`, valor de R$ 30,00 e moeda BRL. Não houve cobrança, liquidação, ativação ou bônus. O registro pendente deverá ser tratado conforme a política operacional do projeto antes de qualquer uso real; ele não deve ser confundido com pagamento aprovado.

## Testes automatizados e qualidade

`npm run test:worker` passou. O build completo passou usando o launcher que injeta explicitamente os valores Supabase da produção em memória. A verificação final confirmou a ausência do identificador legado e a presença do marcador de override sandbox no módulo server-side. O Prettier e o ESLint direcionados passaram nos três arquivos alterados.

O preview temporário e o túnel público foram encerrados ao final da validação. Os launchers usados no laboratório ficaram fora do repositório e não foram incluídos no commit. Nenhuma credencial Mercado Pago, senha, `.env`, playlist, storage ou artefato de runtime foi versionado.

## Conclusão operacional

O produto está certificado até a criação segura de uma preferência Checkout Pro sandbox e a persistência local de um pagamento pendente. O caminho de compra real, webhook assinado, idempotência de replay, ativação, indicação e comprovante permanece **bloqueado por falta de uma conta compradora sandbox distinta e do segredo oficial do webhook**. Não é tecnicamente correto declarar essas etapas concluídas sem executar o evento do provedor.

O próximo teste, caso seja autorizado, deve usar uma conta compradora de teste diferente da conta vendedora, cartão oficial de sandbox e o segredo oficial do webhook. A validação deve confirmar primeiro o evento `payment`, depois duplicação/replay, `claim_payment_approval`, ativação, bônus e comprovante. O token sandbox usado no laboratório foi exposto na conversa e deve ser revogado/renovado antes de qualquer uso real; a senha temporária do usuário de laboratório também deve ser trocada.

## Referências oficiais

[1]: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts "Mercado Pago — contas de teste"
[2]: https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/integration-test/test-purchases "Mercado Pago — compras de teste do Checkout Pro"
[3]: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials "Mercado Pago — credenciais"
[4]: https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/additional-content/notifications/webhooks "Mercado Pago — Webhooks e assinatura"
