const Promise = require('bluebird');
const bh = require('./bh');

const busStopRegEx = new RegExp('^([a-zA-Z]+)([ ]+[a-zA-Z0-9]*)?$');


const createResponse = (messageId, match) => {
  const stop = match[1];
  const service = match[2] ? match[2].trim() : '';

  return bh.getData(stop, service)
    .then((res) => {
      let message = res.stopName + ' @ ' + res.lastUpdate + '\n';

      res.times.forEach((item) => {
        message += item.service + ' to ' + item.destination + ' - ' + item.timeLabel + '\n';
      });

      let keyboard = [
        {
          text: 'all',
          'callback_data': stop
        }
      ];

      res.services.forEach((item) => {
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

      return new Promise.resolve({
        message,
        opts
      });
    })
    .catch((err) => {
      console.log(err); //TODO
      let message = '';

      if (err.statusCode === 404) {
        message = 'Bus stop not found';
      }
      else {
        message = 'There was a problem contacting the server';
      }

      return new Promise.resolve({
        message: message,
        opts: {}
      });
    });
};


const createResponseLocation = (messageId, location) => {
  return bh.getNearbyStops(location)
    .then((res) => {
      const message = 'Bus stops found:\n';

      let keyboard = [];

      Object.keys(res).forEach((key) => {
        const item = res[key];

        keyboard.push([{
          text: item.LongName + ' ' + item.Bearing + ' (' + key + ')',
          'callback_data': key
        }]);
      });

      const opts = {
        'reply_to_message_id': messageId,
        'reply_markup': JSON.stringify({
          'inline_keyboard': keyboard
        })
      };

      return new Promise.resolve({
        message,
        opts
      });
    })
    .catch((err) => {
      console.log(err); //TODO
      let message = '';

      if (err.statusCode === 404) {
        message = 'Bus stop not found';
      }
      else {
        message = 'There was a problem contacting the server';
      }

      return new Promise.resolve({
        message: message,
        opts: {}
      });
    });
};


const sendResponse = (bot, msg, match) => {
  const chatId = msg.chat.id;
  // jshint camelcase:false
  const messageId = msg.message_id;
  // jshint camelcase:true

  bot.sendMessage(chatId, 'Looking...');

  createResponse(messageId, match)
    .then((res) => {
      bot.sendMessage(chatId, res.message, res.opts);
    });
};


const findMatches = (str) => {
  return str.match(busStopRegEx);
};


const askLocation = (bot, msg) => {
  const chatId = msg.chat.id;
  // jshint camelcase:false
  const messageId = msg.message_id;
  // jshint camelcase:true
  const keyboard = [
    {
      'text': 'Share my location',
      'request_location': true
    }
  ];
  const opts = {
    'reply_to_message_id': messageId,
    'reply_markup': JSON.stringify({
      'hide_keyboard': true,
      'keyboard': [keyboard]
    })
  };

  bot.sendMessage(chatId, 'xxx', opts);
};


const sendLocation = (bot, msg) => {
  const chatId = msg.chat.id;
  // jshint camelcase:false
  const messageId = msg.message_id;
  // jshint camelcase:true

  bot.sendMessage(chatId, 'Looking...');

  createResponseLocation(messageId, msg.location)
    .then((res) => {
      bot.sendMessage(chatId, res.message, res.opts);
    });
};


module.exports = {
  busStopRegEx,
  sendResponse,
  findMatches,
  askLocation,
  sendLocation
};