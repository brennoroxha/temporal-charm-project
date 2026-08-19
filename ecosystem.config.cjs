module.exports = {
  apps: [
    {
      name: "ember-glow-nest",
      script: "scripts/start-production.mjs",
      cwd: __dirname,
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      wait_ready: true,
      listen_timeout: 15000,
      min_uptime: "5s",
      max_restarts: 5,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        APP_HOST: "0.0.0.0",
        APP_PORT: "5007",
        HOST: "0.0.0.0",
        PORT: "5007",
        NITRO_HOST: "0.0.0.0",
        NITRO_PORT: "5007",
        STARTUP_TIMEOUT_MS: "15000",
      },
    },
  ],
};