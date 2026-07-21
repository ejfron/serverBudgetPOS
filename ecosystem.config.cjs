module.exports = {
  apps: [
    {
      name: 'tapsilogan-api',
      script: './server/index.ts',
      interpreter: './node_modules/.bin/tsx',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3001,
        HOST: '0.0.0.0'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
}
