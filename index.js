const config = require('./lib/config');
const bot = require('./lib/telegram');


const token = config.get('telegramToken');

bot.start(token);