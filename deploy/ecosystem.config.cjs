module.exports = {
  apps: [
    {
      name: 'stream-mago-bot',
      script: './start-pm2.sh',
      interpreter: 'bash',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 6873,
        HOST: '127.0.0.1'
      }
    }
  ]
};
