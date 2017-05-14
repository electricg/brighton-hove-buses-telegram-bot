const Promise = require('bluebird');
const request = require('request');
const cheerio = require('cheerio');


const bhUrl = 'http://www.buscms.com/api/REST/html';

const possibleErrors = [
  'no matching stop found',
  'Please select a stop from the map or search to see live departures'
];


const getStop = (stop, service) => {
  return new Promise((resolve, reject) => {
    let qs = {
      'clientid': 'BrightonBuses2016',
      'format': 'json',
      'sourcetype': 'siri',
      'requestor': 'LD',
      'includeTimestamp': 'true'
    };

    if (/^\d+$/.test(stop)) {
      qs.stopid = stop;
    }
    else {
      qs.stopcode = stop;
    }

    if (service) {
      qs.servicenamefilter = service;
    }

    const options = {
      method: 'GET',
      baseUrl: bhUrl,
      url: '/departureboard.aspx',
      qs: qs,
      json: true
    };

    request(options, (err, response) => {
      if (err) {
        reject({
          statusCode: 503,
          body: err.message
        });
        return;
      }

      if (response.statusCode === 200) {
        for (let i = 0; i < possibleErrors.length; i++) {
          if (response.body.indexOf(possibleErrors[i]) !== -1) {
            reject({
              statusCode: 404,
              body: 'no matching stop found'
            });
            return;
          }
        }

        resolve(response.body);
        return;
      }

      reject({
        statusCode: response.statusCode,
        body: response.body
      });
    });
  });
};


const parseStop = (html) => {
  const cleanedHtml = html.replace(/\\"/g, '"');
  const $ = cheerio.load(cleanedHtml);

  const $livetimes = $('.livetimes');
  const $services = $('.services a');
  const $times = $livetimes.find('tbody tr');

  const stopName = $livetimes.find('.rowStopName th').text();
  const stopCode = $livetimes.find('.textHeader th').text().replace('text ', '').replace(' to 84268 for live times', '');
  const lastUpdate = $('.dptime span:nth-child(2)').text();
  let services = [];
  let times = [];

  $services.each((index, el) => {
    const name = $(el).text();

    if (name === 'all') {
      return;
    }

    if (!services.includes(name)) {
      services.push(name);
    }
  });

  $times.each((index, el) => {
    const $el = $(el);

    const service = $el.find('.colServiceName').text();
    const destination = $el.find('.colDestination').text();
    const $time = $el.find('.colDepartureTime');
    const timeLabel = $time.text();
    const time = $time.data('departuretime');

    times.push({
      service,
      destination,
      timeLabel,
      time
    });
  });

  return {
    stopName,
    stopCode,
    lastUpdate,
    services,
    times
  };
};


const getData = (stop, service) => {
  return getStop(stop, service)
    .then((res) => {
      const output = parseStop(res);

      return new Promise.resolve(output);
    })
    .catch((err) => {
      return new Promise.reject(err);
    });
};


module.exports = {
  getStop,
  parseStop,
  getData
};