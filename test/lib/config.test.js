/* global describe, it */
const config = require('../../lib/config');

describe('Config', () => {
  it('should return a valid setting', (done) => {
    var c = config.get('telegramToken');
    (typeof c).should.equal('string');
    done();
  });


  it('should return undefined for an invalid setting', (done) => {
    var c = config.get('xxx');
    console.log(c);
    (typeof c).should.equal('undefined');
    done();
  });
});