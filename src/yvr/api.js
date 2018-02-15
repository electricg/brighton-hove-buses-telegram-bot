const request = require('request');

const yvrBaseUrl = 'http://api.translink.ca/rttiapi/v1';
const yvrSingleStopDataPage = '/stops';

const _range = 500;

/**
 * Find the nearby bus stops
 * @param {object} here - latitude and longitude of the current location
 * @param {number} [range] - in meters - optional
 * @returns {promise} object of the bus stops, with stop code as key
 */
const getNearbyStops = (here, range = _range, apiToken) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            baseUrl: yvrBaseUrl,
            url: yvrSingleStopDataPage,
            qs: {
                apikey: apiToken,
                lat: here.latitude,
                long: here.longitude,
                radius: range,
                routeNo: '004'
            },
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
                resolve(body);
                return;
            }

            reject({
                statusCode,
                body
            });
        });
    });
};

module.exports = {
    getNearbyStops
};
