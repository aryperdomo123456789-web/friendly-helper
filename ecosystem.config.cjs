// PM2 config for aaPanel / VPS deploys.
// Build first:  NITRO_PRESET=node_server bun run build
// Then:         pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "webplayer",
      script: ".output/server/index.mjs",
      cwd: __dirname,
      exec_mode: "cluster",
      instances: 2, // bump to "max" on bigger VPS; streaming is I/O bound
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 3000,
        // Everything below must be provided by the server environment
        // (.env.production loaded by pm2 or aaPanel env vars). NEVER commit values.
        // SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY,
        // VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, STREAM_PROXY_SECRET
      },
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
