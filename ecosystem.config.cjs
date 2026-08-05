// PM2 config for aaPanel / VPS deploys.
// Build first:  NITRO_PRESET=node_server bun run build
// Then:         pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "stream-mago-bot",
      script: "./start-pm2.sh",
      interpreter: "bash",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 6873,
      },
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
