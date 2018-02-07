const bh = require('./bh');

const busStopRegEx = new RegExp('^([a-zA-Z]+)([ ]+[a-zA-Z0-9]*)?$');

/**
 * Create bus stop timetable to send to the user
 * @param {string} messageId - message to reply to
 * @param {string} stop - code of the bus stop
 * @param {string} [service] - name of the bus service - optional
 * @returns {promise} object with the response
 */
const createResponse = (messageId, stop, service) => {
  return bh
    .getData(stop, service)
    .then(res => {
      const { stopName, bearing, lastUpdate, times, services } = res;

      const message = times.reduce(
        (acc, { service, destination, timeLabel }) => {
          return (acc += `${service} to ${destination} - ${timeLabel}\n`);
        },
        `${stopName} (${bearing})` + ` @ ${lastUpdate}\n`
      );

      let keyboard = [
        {
          text: 'all',
          callback_data: stop
        }
      ];

      services.forEach(item => {
        keyboard.push({
          text: item,
          callback_data: `${stop} ${item}`
        });
      });

      const opts = {
        reply_to_message_id: messageId,
        reply_markup: JSON.stringify({
          inline_keyboard: [keyboard]
        })
      };

      return Promise.resolve({
        message,
        opts
      });
    })
    .catch(err => {
      console.log(err); // TODO: log error somewhere
      const message =
        err.statusCode === 404
          ? 'Bus stop not found'
          : 'There was a problem contacting the server';

      return Promise.resolve({
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
  return bh
    .getNearbyStops(location, range)
    .then(res => {
      const message = 'Bus stops found:\n';

      let keyboard = [];

      Object.keys(res).forEach(key => {
        const item = res[key];

        keyboard.push([
          {
            text: `${item.LongName} ${item.Bearing} (${key})`,
            callback_data: key
          }
        ]);
      });

      const opts = {
        reply_to_message_id: messageId,
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      };

      return Promise.resolve({
        message,
        opts
      });
    })
    .catch(err => {
      console.log(err); // TODO: log error somewhere

      return Promise.resolve({
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
const sendResponse = (bot, msg, match) => {
  const { message_id: messageId, chat: { id: chatId } } = msg;
  const [, stop, service = ''] = match;

  bot.sendMessage(chatId, 'Looking...');

  createResponse(messageId, stop, service.trim()).then(res => {
    bot.sendMessage(chatId, res.message, res.opts);
  });
};

/**
 * Parse user input to find bus stop code and service
 * @param {string} str - Input
 * @returns {array} matches
 */
const findMatches = str => {
  return str.match(busStopRegEx);
};

/**
 * Send the request for the user location
 * @param {object} bot - Telegram bot
 * @param {object} msg - Received message to reply to
 */
const askLocation = (bot, msg) => {
  const { message_id: messageId, chat: { id: chatId } } = msg;
  const keyboard = [
    {
      text: 'Share my location',
      request_location: true
    }
  ];
  const opts = {
    reply_to_message_id: messageId,
    reply_markup: JSON.stringify({
      hide_keyboard: true,
      keyboard: [keyboard]
    })
  };

  bot.sendMessage(
    chatId,
    'To give you the list of nearby bus stops, I need to know you location.\nPlease activate the GPS on your device',
    opts
  );
};

/**
 * Send nearby bus stops list response to the user
 * @param {object} bot - Telegram bot
 * @param {object} msg - Received message to reply to
 * @param {number} [range] - in meters - optional
 */
const sendLocation = (bot, msg, range) => {
  const { message_id: messageId, location, chat: { id: chatId } } = msg;

  bot.sendMessage(chatId, 'Looking...');

  createResponseLocation(messageId, location, range).then(res => {
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
