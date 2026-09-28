const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "../..");

function makeApp(config) {
  return {
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    merge_logs: true,
    time: true,
    ...config,
  };
}

module.exports = {
  apps: [
    makeApp({
      name: "stream-mago-bot",
      script: "./deploy/pm2/start-main.sh",
      interpreter: "bash",
      cwd: ROOT_DIR,
      env: {
        NODE_ENV: "production",
        PORT: 6873,
        HOST: "127.0.0.1",
        STREAM_SERVICE_URL: "http://127.0.0.1:6874",
        PAYMENTS_SERVICE_URL: "http://127.0.0.1:6875",
      },
      out_file: "./logs/main.out.log",
      error_file: "./logs/main.err.log",
    }),
    makeApp({
      name: "stream-mago-bot-player",
      script: "./deploy/pm2/start-player.sh",
      interpreter: "bash",
      cwd: ROOT_DIR,
      env: {
        NODE_ENV: "production",
        PORT: 6874,
        HOST: "127.0.0.1",
        ENTRY_FILE: ".output/player/index.mjs",
      },
      out_file: "./logs/player.out.log",
      error_file: "./logs/player.err.log",
    }),
    makeApp({
      name: "stream-mago-bot-payments",
      script: "./deploy/pm2/start-payments.sh",
      interpreter: "bash",
      cwd: ROOT_DIR,
      env: {
        NODE_ENV: "production",
        PORT: 6875,
        HOST: "127.0.0.1",
        ENTRY_FILE: ".output/payments/index.mjs",
      },
      out_file: "./logs/payments.out.log",
      error_file: "./logs/payments.err.log",
    }),
    makeApp({
      name: "stream-mago-bot-worker",
      script: "./deploy/pm2/start-worker.sh",
      interpreter: "bash",
      cwd: ROOT_DIR,
      max_memory_restart: "300M",
      restart_delay: 5_000,
      exp_backoff_restart_delay: 1_000,
      kill_timeout: 10_000,
      env: {
        NODE_ENV: "production",
        ENTRY_FILE: ".output/worker/index.mjs",
        WORKER_SERVICE_NAME: "stream-mago-bot-worker",
        WORKER_HEARTBEAT_INTERVAL_MS: 60000,
        WORKER_MEMORY_WARN_MB: 128,
        WORKER_MEMORY_CRITICAL_MB: 150,
        WORKER_RESTART_ALERT_THRESHOLD: 5,
        WORKER_LOCK_STALE_SECONDS: 480,
        WORKER_LOCK_LEASE_MS: 480000,
        WORKER_HEARTBEAT_STALE_SECONDS: 180,
        WORKER_ERROR_ALERT_THRESHOLD: 5,
      },
      out_file: "./logs/worker.out.log",
      error_file: "./logs/worker.err.log",
    }),
  ],
};
