const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const bh = require('./bh');

const busStopRegEx = new RegExp('^([a-zA-Z]+)( [a-zA-Z0-9]+)?$');


const searchBusStop = (bot, msg, match) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  bot.sendMessage(chatId, 'Looking...');

  const stop = match[1];
  let service = match[2];

  if (service) {
    service = service.trim();
  }
  else {
    service = '';
  }

  bh.getStop(stop, service)
    .then((res) => {
      const output = bh.parseStop(res);

      let message = output.stopName + ' @ ' + output.lastUpdate + '\n';

      output.times.forEach((item) => {
        message += item.service + ' to ' + item.destination + ' - ' + item.timeLabel + '\n';
      });

      let keyboard = [
        {
          text: 'all',
          'callback_data': stop
        }
      ];

      output.services.forEach((item) => {
        keyboard.push({
          text: item,
          'callback_data': stop + ' ' + item
        });
      });

      const opts = {
        'reply_to_message_id': messageId,
        'reply_markup': JSON.stringify({
          'inline_keyboard': [keyboard]
        })
      };

      bot.sendMessage(chatId, message, opts);
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(chatId, 'Sorry there was an error');
    });
};


const start = (token) => {
  let options = {};

  if (config.get('isProduction')) {
    options = {
      webHook: {
        port: process.env.PORT
      }
    };
  }
  else {
    options = {
      polling: true
    };
  }

  const bot = new TelegramBot(token, options);

  if (config.get('isProduction')) {
    const url = config.get('appUrl');
    bot.setWebHook(url + '/bot' + token);
  }

  bot.on('callback_query', (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    const match = action.match(busStopRegEx);

    searchBusStop(bot, msg, match);
  });


  bot.onText(busStopRegEx, (msg, match) => {
    searchBusStop(bot, msg, match);
  });
};


module.exports = {
  start
};