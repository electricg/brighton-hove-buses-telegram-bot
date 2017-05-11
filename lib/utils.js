/**
 * Format error
 * @param {string} msg
 * @param {object} err
 * @returns {object} format { status: 0, error: 'xxx', details: 'yyy'}
 */
module.exports.formatError = (msg, err) => {
  let obj = {
    status: 0,
    error: msg
  };

  if (err) {
    obj.details = '';
    if (err.message) {
      obj.details = err.message;
    }
    if (err.statusCode || err.statusMessage) {
      obj.details = err.statusCode + ' ' + err.statusMessage;
    }
  }

  return obj;
};


/**
 * Format allowed origins, which can be passed as a single string or a string divided by comma or an array into an array of strings
 * @param {string|array} input
 * @returns {array} array of url
 */
module.exports.formatOrigins = (input) => {
  let output = input;
  if (typeof output === 'string' && output !== '') {
    output = output.split(',');
  }
  if (Array.isArray(output)) {
    let newOutput = [];
    output.forEach((item) => {
      if (typeof item === 'string' && item !== '') {
        newOutput.push(item.trim());
      }
    });
    return newOutput;
  }
  return [];
};