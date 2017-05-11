const nconf = require('nconf');
const utils = require('./utils');

const DEFAULT = {
  PORT: 8080,
  HOST: '127.0.0.1',
  CORS: '*',
  NODE_ENV: 'development',
  TELEGRAM_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
  APP_URL: ''
};

nconf
  .env()
  .file(__dirname + '/../config.json')
  .defaults(DEFAULT)
;

// public layer
nconf.set('public:port', ~~nconf.get('PORT'));
nconf.set('public:host', nconf.get('HOST'));
nconf.set('public:allowedOrigins', utils.formatOrigins(nconf.get('CORS')));
nconf.set('public:isProduction', nconf.get('NODE_ENV') === 'production');
nconf.set('public:telegramToken', nconf.get('TELEGRAM_TOKEN'));
nconf.set('public:appUrl', nconf.get('APP_URL'));

module.exports.get = (param) => {
  return nconf.get('public:' + param);
};