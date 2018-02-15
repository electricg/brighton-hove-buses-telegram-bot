const config = require('../../src/config');

describe('Config', () => {
    it('should return a valid setting', done => {
        const output = config.get('telegramToken');
        (typeof output).should.equal('string');
        done();
    });

    it('should return undefined for an invalid setting', done => {
        const output = config.get('xxx');
        (typeof output).should.equal('undefined');
        done();
    });
});
