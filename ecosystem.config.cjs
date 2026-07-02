module.exports = {
  apps: [
    {
      name: "kp-pakse-pos",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5173
      }
    }
  ]
};
