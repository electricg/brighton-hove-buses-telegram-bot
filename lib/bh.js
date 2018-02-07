const request = require('request');
const cheerio = require('cheerio');
const geolib = require('geolib');

const bhSingleStopDataUrl = 'http://www.buscms.com/api/REST/html';
const bhSingleStopDataPage = '/departureboard.aspx';
const bhSingleStopDataQuery = {
  clientid: 'BrightonBuses2016',
  format: 'json',
  sourcetype: 'siri',
  requestor: 'LD',
  includeTimestamp: 'true'
};
const bhStopsListDataUrl = 'http://www.buscms.com/api/rest/ent';
const bhStopsListDataPage = '/stop.aspx';
const bhStopsListDataQuery = {
  clientid: 'BrightonBuses2016',
  method: 'list'
};

const accuracy = 1;
const precision = 1;
const _range = 500;

/**
 * Retrieve the remote page cointaining the whole bus stops list
 * @returns {promise} array if successful, object if error
 */
const fetchStopsListData = () => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      baseUrl: bhStopsListDataUrl,
      url: bhStopsListDataPage,
      qs: Object.assign({}, bhStopsListDataQuery),
      json: false
    };

    request(options, (err, response) => {
      if (err) {
        reject({
          statusCode: 503,
          body: err.message
        });
        return;
      }

      const { statusCode, body } = response;

      if (statusCode === 200) {
        const res = JSON.parse(body.replace(/^\(/, '').replace(/\);$/, ''));

        resolve(res.result || []);
        return;
      }

      reject({
        statusCode,
        body
      });
    });
  });
};

/**
 * Filter nearby bus stops
 * @param {object} here - latitute and longitude to calculate the distance from
 * @param {array} list - bus stops to filter from
 * @param {number} [range] - in meters - optional
 * @returns {object} list of filtered bus stops, with stop code as key
 */
const getNearbyLocations = (here, list, range = _range) => {
  let result = {};

  list.forEach(item => {
    const loc = { latitude: item.lat, longitude: item.lng };
    const distance = geolib.getDistance(here, loc, accuracy, precision);
    item.distance = distance;

    if (distance <= range) {
      result[item.NaptanCode] = item;
    }
  });

  // return the closest 5 if none is in the range
  if (Object.keys(result).length === 0) {
    // TODO: test the sorting
    const sorted = list
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, 5);

    sorted.forEach(item => {
      result[item.NaptanCode] = item;
    });
  }

  return result;
};

/**
 * Find the nearby bus stops
 * @param {object} here - latitude and longitude of the current location
 * @param {number} [range] - in meters - optional
 * @returns {promise} object of the bus stops, with stop code as key
 */
const getNearbyStops = (here, range = _range) => {
  return fetchStopsListData()
    .then(res => {
      const output = getNearbyLocations(here, res, range);

      return Promise.resolve(output);
    })
    .catch(err => {
      return Promise.reject(err);
    });
};

/**
 * Retrieve the remote page containing the bus stop information
 * @param {string} stop - id or code of the bus stop
 * @param {string} [service] - name of the bus service - optional
 * @returns {promise} string if successful, object if error
 */
const fetchStopData = (stop, service) => {
  return new Promise((resolve, reject) => {
    const possibleErrors = [
      'no matching stop found',
      'Please select a stop from the map or search to see live departures'
    ];
    let qs = Object.assign({}, bhSingleStopDataQuery);

    if (/^\d+$/.test(stop)) {
      qs.stopid = stop;
    } else {
      qs.stopcode = stop;
    }

    if (service) {
      qs.servicenamefilter = service;
    }

    const options = {
      method: 'GET',
      baseUrl: bhSingleStopDataUrl,
      url: bhSingleStopDataPage,
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

      const { statusCode, body } = response;

      if (statusCode === 200) {
        for (let i = 0; i < possibleErrors.length; i++) {
          if (body.indexOf(possibleErrors[i]) !== -1) {
            reject({
              statusCode: 404,
              body: 'no matching stop found'
            });
            return;
          }
        }

        resolve(body);
        return;
      }

      reject({
        statusCode: statusCode,
        body: body
      });
    });
  });
};

/**
 * Parse the html page containing the bus stop information
 * @param {string} html
 * @returns {object} formatted data of the bus stop
 */
const parseStop = html => {
  const cleanedHtml = html.replace(/\\"/g, '"');
  const $ = cheerio.load(cleanedHtml);

  const $livetimes = $('.livetimes');
  const $services = $('.services a');
  const $times = $livetimes.find('tbody tr');

  const $stopName = $livetimes.find('.rowStopName th');
  const stopName = $stopName.text();
  const latitude = $stopName.data('lat');
  const longitude = $stopName.data('lng');
  const bearing = $stopName.data('bearing');
  const stopCode = $stopName.attr('title');
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
    bearing,
    location: {
      latitude,
      longitude
    },
    stopCode,
    lastUpdate,
    services,
    times
  };
};

/**
 * Find bus stop timetable
 * @param {string} stop - id or code of the bus stop
 * @param {string} [service] - name of the bus service - optional
 * @returns {promise} object
 */
const getData = (stop, service) => {
  return fetchStopData(stop, service)
    .then(res => {
      const output = parseStop(res);

      return Promise.resolve(output);
    })
    .catch(err => {
      return Promise.reject(err);
    });
};

module.exports = {
  getNearbyStops,
  getData
};
