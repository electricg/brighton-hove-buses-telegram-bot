/* global describe, it, beforeEach, afterEach */
const fs = require('fs');
const _ = require('lodash');
const nock = require('nock');
const rewire = require('rewire');

const _bh = rewire('../../lib/bh');
const _getStop = _bh.__get__('getStop');
const _parseStop = _bh.__get__('parseStop');
const _getData = _bh.__get__('getData');

const bhUrl = 'http://www.buscms.com/api/REST/html';
const qs = {
  'clientid': 'BrightonBuses2016',
  'format': 'json',
  'sourcetype': 'siri',
  'requestor': 'LD',
  'includeTimestamp': 'true'
};

const check6509 = fs.readFileSync('./test/data/6509.txt', 'utf8');
const check65097 = fs.readFileSync('./test/data/6509-7.txt', 'utf8');
const content6509 = fs.readFileSync('./test/data/6509.html', 'utf8');
const content65097 = fs.readFileSync('./test/data/6509-7.html', 'utf8');
const content000 = fs.readFileSync('./test/data/000.html', 'utf8');
const contentxxx = fs.readFileSync('./test/data/xxx.html', 'utf8');
const content6509777 = fs.readFileSync('./test/data/6509-777.html', 'utf8');

const stopid = '6509';
const stopcode = 'briapaw';
const servicename = '7';
const wrongStopid = '000';
const wrongStopcode = 'xxx';

const live = false;


describe('bh', () => {

  beforeEach((done) => {
    if (!live) {
      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopid: stopid }))
          .reply(200, content6509)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopid: stopid, servicenamefilter: servicename }))
          .reply(200, content65097)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: stopcode }))
          .reply(200, content6509)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: stopcode, servicenamefilter: servicename }))
          .reply(200, content65097)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopid: wrongStopid }))
          .reply(200, content000)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: wrongStopcode }))
          .reply(200, contentxxx)
      ;
    }

    done();
  });

  afterEach((done) => {
    nock.cleanAll();
    done();
  });

  describe('getStop', () => {
    it('should succeed passing only stop id', (done) => {
      const checks = check6509.split('\n==========\n');

      _getStop(stopid)
        .then((res) => {
          checks.forEach((check) => {
            res.indexOf(check).should.not.equal(-1);
          });

          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing stop id and service', (done) => {
      const checks = check65097.split('\n==========\n');

      _getStop(stopid, servicename)
        .then((res) => {
          checks.forEach((check) => {
            res.indexOf(check).should.not.equal(-1);
          });

          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing only stop code', (done) => {
      const checks = check6509.split('\n==========\n');

      _getStop(stopcode)
        .then((res) => {
          checks.forEach((check) => {
            res.indexOf(check).should.not.equal(-1);
          });

          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing stop code and service', (done) => {
      const checks = check65097.split('\n==========\n');

      _getStop(stopcode, servicename)
        .then((res) => {
          checks.forEach((check) => {
            res.indexOf(check).should.not.equal(-1);
          });

          done();
        })
        .catch((err) => done(err));
    });

    it('should fail passing non existing stop id', (done) => {
      _getStop(wrongStopid)
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(404);
          err.body.should.equal('no matching stop found');
          done();
        });
    });

    it('should fail passing non existing stop code', (done) => {
      _getStop(wrongStopcode)
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(404);
          err.body.should.equal('no matching stop found');
          done();
        });
    });

    it('should fail when server returns an error', (done) => {
      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: 'errorId' }))
          .replyWithError('fake error');

      _getStop('errorId')
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(503);
          err.body.should.equal('fake error');
          done();
        });
    });

    it('should fail when server returns something different from 200', (done) => {
      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: 'errorId' }))
          .reply(400, 'error');

      _getStop('errorId')
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(400);
          err.body.should.equal('error');
          done();
        });
    });
  });

  describe('parseStop', () => {
    const o = [
      {
        desc: 'should succeed when there is data',
        input: content65097,
        output: {
          stopName: 'Seven Dials',
          stopCode: 'briapaw',
          lastUpdate: '11:26',
          services: ['7', '14', '14C', '27', '55', '59', '77', 'N7', '27C', '48E', '37A', '37B', '57'],
          times: [ 
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '4 mins',
              time: '13/05/2017 11:31:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '8 mins',
              time: '13/05/2017 11:35:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '11:42',
              time: '13/05/2017 11:42:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '22 mins',
              time: '13/05/2017 11:49:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '28 mins',
              time: '13/05/2017 11:55:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '35 mins',
              time: '13/05/2017 12:02:00'
            },
            {
              service: '7',
              destination: 'Marina',
              timeLabel: '12:09',
              time: '13/05/2017 12:09:00'
            }
          ]
        }
      },
      {
        desc: 'should succeed when there is no data',
        input: content6509777,
        output: {
          stopName: 'Seven Dials',
          stopCode: 'briapaw',
          lastUpdate: '12:10',
          services: ['7', '14', '14C', '27', '55', '59', '77', 'N7', '27C', '48E', '37A', '37B', '57'],
          times: []
        }
      }
    ];

    o.forEach((item) => {
      it(item.desc, (done) => {
        const output = _parseStop(item.input);

        _.isEqual(output, item.output).should.equal(true);
        done();
      });
    });
  });

  describe('getData', () => {
    it('should succeed', (done) => {
      _getData(stopid)
        .then((res) => {
          res.stopName.should.equal('Seven Dials');
          res.stopCode.should.equal('briapaw');
          _.isEqual(['7', '14', '14C', '27', '55', '59', '77', 'N7', '27C', '48E', '37A', '37B', '57'], res.services).should.equal(true);

          done();
        })
        .catch((err) => done(err));
    });

    it('should fail', (done) => {
      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: 'errorId' }))
          .reply(400, 'error');

      _getData('errorId')
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(400);
          err.body.should.equal('error');
          done();
        });
    });
  });

});