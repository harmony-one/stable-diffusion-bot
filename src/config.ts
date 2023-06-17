import * as process from 'process';

export default () => ({
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  STABILITY_API_KEY: process.env.STABILITY_API_KEY
});