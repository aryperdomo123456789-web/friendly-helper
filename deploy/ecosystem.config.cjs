module.exports = {
  apps: [
    {
      name: 'stream-mago-bot',
      script: '.output/server/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 6873,
        HOST: '0.0.0.0'
      }
    }
  ]
};
