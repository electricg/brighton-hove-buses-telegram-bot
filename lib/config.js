const nconf = require('nconf');

const DEFAULT = {
    NODE_ENV: 'development',
    TELEGRAM_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
    APP_URL: ''
};

nconf
    .env()
    .file(`${__dirname}/../config.json`)
    .defaults(DEFAULT);

// public layer
nconf.set('public:isProduction', nconf.get('NODE_ENV') === 'production');
nconf.set('public:telegramToken', nconf.get('TELEGRAM_TOKEN'));
nconf.set('public:appUrl', nconf.get('APP_URL'));

module.exports.get = param => {
    return nconf.get(`public:${param}`);
};
