const rewire = require('rewire');

const config = require('../../../src/config');

const _api = rewire('../../../src/yvr/api');
const _getNearbyStops = _api.__get__('getNearbyStops');

describe('getNearbyStops', () => {
    it('should succeed', done => {
        const here = {
            latitude: '49.277612',
            longitude: '-123.125168'
        };
        const range = 500;

        _getNearbyStops(here, range, config.get('yvrApiToken'))
            .then(res => {
                console.log(res);
                Object.keys(res).length.should.equal(4);
                done();
            })
            .catch(err => done(err));
    });
});
