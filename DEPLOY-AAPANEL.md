# Deploy no aaPanel / VPS Ubuntu 22.04

Este projeto foi construído com TanStack Start e está pronto para produção.

## Requisitos
- Node.js 18 ou superior
- PM2 (npm install -g pm2)
- Banco de dados Supabase (Lovable Cloud)

## Passos para Instalação

1. **Clone o repositório** na sua VPS ou aaPanel.
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz com as chaves do Supabase.
4. **Build do projeto**:
   ```bash
   npm run build
   ```
5. **Inicie com PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   ```

## Configuração do Mercado Pago
1. Acesse o Painel do Dono -> Configuração Central.
2. Insira seu **Access Token** e **Public Key**.
3. No painel do Mercado Pago, configure a URL de Webhook:
   `https://seu-dominio.com/api/public/mercadopago-webhook`
4. Marque os eventos de `payment`.

## Dica Profissional (Nginx no aaPanel)
Para o streaming funcionar perfeitamente em HTTPS sem erros de mixed content, o proxy reverso já está configurado no código. Apenas certifique-se que o Nginx permite conexões longas (timeouts de 60s+).

