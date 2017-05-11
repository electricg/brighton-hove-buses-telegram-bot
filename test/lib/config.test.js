/* global describe, it */
const config = require('../../lib/config');

describe('Config', () => {
  it('should return a valid setting', (done) => {
    var c = config.get('port');
    (typeof c).should.equal('number');
    done();
  });


  it('should return undefined for an invalid setting', (done) => {
    var c = config.get('xxx');
    (typeof c).should.equal('undefined');
    done();
  });
});