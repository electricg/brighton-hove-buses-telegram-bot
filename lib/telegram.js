const Promise = require('bluebird');
const bh = require('./bh');

const busStopRegEx = new RegExp('^([a-zA-Z]+)([ ]+[a-zA-Z0-9]*)?$');


/**
 * Create bus stop timetable to send to the user
 * @param {string} messageId - message to reply to
 * @param {string} stop - code of the bus stop
 * @param {string} [service] - name of the bus service - optional
 * @returns {promise} object with the response
 */
const createResponseBusstop = (messageId, stop, service) => {
  return bh.getData(stop, service)
    .then((res) => {
      let message = `${res.stopCode} - ${res.stopName} (${res.bearing }) @ ${res.lastUpdate}\n`;

      res.times.forEach((item) => {
        message += `${item.service} to ${item.destination} - ${item.timeLabel}\n`;
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
        // 'reply_to_message_id': messageId,
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
      console.log(err); // TODO: log error somewhere
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


/**
 * Create nearby bus stops list to send to the user
 * @param {string} messageId - message to reply to
 * @param {object} location - latitute and longitude of the current location
 * @param {number} [range] - in meters - optional
 * @returns {promise} object with the response
 */
const createResponseLocation = (messageId, location, range) => {
  return bh.getNearbyStops(location, range)
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
      console.log(err); // TODO: log error somewhere

      return new Promise.resolve({
        message: 'There was a problem contacting the server',
        opts: {}
      });
    });
};


/**
 * Send bus stop timetable response to the user
 * @param {object} bot - Telegram bot
 * @param {object} msg - Received message to reply to
 * @param {array} match - regex matches
 */
const sendResponseBusstop = (bot, msg, match) => {
  const chatId = msg.chat.id;
  // jshint camelcase:false
  const messageId = msg.message_id;
  // jshint camelcase:true
  const stop = match[1];
  const service = match[2] ? match[2].trim() : '';

  const text = `Looking for ${stop}${service ? ' ' + service : ''}...`;

  bot.sendMessage(chatId, text);

  createResponseBusstop(messageId, stop, service)
    .then((res) => {
      bot.sendMessage(chatId, res.message, res.opts);
    });
};


/**
 * Parse user input to find bus stop code and service
 * @param {string} str - Input
 * @returns {array} matches
 */
const findMatches = (str) => {
  return str.match(busStopRegEx);
};


/**
 * Send the request for the user location
 * @param {object} bot - Telegram bot
 * @param {object} msg - Received message to reply to
 */
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

  bot.sendMessage(chatId, 'To give you the list of nearby bus stops, I need to know you location.\nPlease activate the GPS on your device', opts);
};


/**
 * Send nearby bus stops list response to the user
 * @param {object} bot - Telegram bot
 * @param {object} msg - Received message to reply to
 * @param {number} [range] - in meters - optional
 */
const sendLocation = (bot, msg, range) => {
  const chatId = msg.chat.id;
  // jshint camelcase:false
  const messageId = msg.message_id;
  // jshint camelcase:true

  bot.sendMessage(chatId, 'Looking...');

  createResponseLocation(messageId, msg.location, range)
    .then((res) => {
      bot.sendMessage(chatId, res.message, res.opts);
    });
};


const giulia = (bot, chatId, message, keyboard) => {
  const opts = {

  };
  bot.sendMessage(chatId, message, opts);
};


// const sendResponseHelp = (bot, msg) => {
//   giulia(bot, msg, )
// };


// const sendResponseAbout = (bot, msg) => {

// };


module.exports = {
  busStopRegEx,
  sendResponseBusstop,
  findMatches,
  askLocation,
  sendLocation,
  // sendResponseHelp,
  // sendResponseAbout
};