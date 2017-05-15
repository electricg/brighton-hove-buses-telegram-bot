const TelegramBot = require('node-telegram-bot-api');
const config = require('./lib/config');
const telegram = require('./lib/telegram');

const token = config.get('telegramToken');
const url = config.get('appUrl');
const range = 100;


const start = () => {
  let options = {};

  if (config.get('isProduction')) {
    options.webHook = {
      port: process.env.PORT
    };
  }
  else {
    options.polling = true;
  }

  const bot = new TelegramBot(token, options);

  if (config.get('isProduction')) {
    bot.setWebHook(url + '/bot' + token);
  }

  bot.on('callback_query', (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const match = telegram.findMatches(action);

    telegram.sendResponse(bot, msg, match);
  });

  bot.onText(telegram.busStopRegEx, (msg, match) => {
    telegram.sendResponse(bot, msg, match);
  });

  bot.onText(/\/help/, (msg, match) => {
    console.log(msg, match);
  });

  bot.onText(/\/location/, (msg) => {
    telegram.askLocation(bot, msg);
  });

  bot.on('location', (msg) => {
    telegram.sendLocation(bot, msg, range);
  });
};


start();