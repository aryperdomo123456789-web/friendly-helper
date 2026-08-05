# Deploy no aaPanel / VPS Ubuntu 22.04

O passo a passo completo foi movido para:

[`deploy/MIGRACAO-BACKEND-PROPRIO.md`](/www/wwwroot/stream.mago-bot.com/deploy/MIGRACAO-BACKEND-PROPRIO.md)

Para guardar e restaurar tudo depois, use também:

[`BACKUP-RESTAURACAO.md`](/www/wwwroot/stream.mago-bot.com/BACKUP-RESTAURACAO.md)

Use esse guia para:

- criar o banco Supabase
- rodar o schema e os dados base
- executar o seed de usuários
- subir o app com PM2 na porta `6873`
- manter o nginx sem afetar outros projetos
- configurar o webhook do Mercado Pago
