/* global describe, it, beforeEach, afterEach */
const fs = require('fs');
const _ = require('lodash');
const nock = require('nock');
const rewire = require('rewire');
const sinon = require('sinon');

const _telegram = rewire('../../lib/telegram');
const _createResponse = _telegram.__get__('createResponse');
const _sendResponse = _telegram.__get__('sendResponse');
const _findMatches = _telegram.__get__('findMatches');

const bhUrl = 'http://www.buscms.com/api/REST/html';
const qs = {
  'clientid': 'BrightonBuses2016',
  'format': 'json',
  'sourcetype': 'siri',
  'requestor': 'LD',
  'includeTimestamp': 'true'
};

const content6509 = fs.readFileSync('./test/data/6509.html', 'utf8');
const content65097 = fs.readFileSync('./test/data/6509-7.html', 'utf8');
const content000 = fs.readFileSync('./test/data/000.html', 'utf8');
const contentxxx = fs.readFileSync('./test/data/xxx.html', 'utf8');

const stopid = '6509';
const stopcode = 'briapaw';
const servicename = '7';
const wrongStopid = '000';
const wrongStopcode = 'xxx';

const live = false;


describe('telegram', () => {

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

  describe('createResponse', () => {
    it('should succeed with only stopid', (done) => {
      const messageId = 'abc';
      const match = ['', stopid];
      _createResponse(messageId, match)
        .then((res) => {
          const expectedOutput = {
            opts: {
              'reply_to_message_id': 'abc',
              'reply_markup': '{"inline_keyboard":[[{"text":"all","callback_data":"6509"},{"text":"7","callback_data":"6509 7"},{"text":"14","callback_data":"6509 14"},{"text":"14C","callback_data":"6509 14C"},{"text":"27","callback_data":"6509 27"},{"text":"55","callback_data":"6509 55"},{"text":"59","callback_data":"6509 59"},{"text":"77","callback_data":"6509 77"},{"text":"N7","callback_data":"6509 N7"},{"text":"27C","callback_data":"6509 27C"},{"text":"48E","callback_data":"6509 48E"},{"text":"37A","callback_data":"6509 37A"},{"text":"37B","callback_data":"6509 37B"},{"text":"57","callback_data":"6509 57"}]]}'
            }
          };

          _.isEqual(res.opts, expectedOutput.opts).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with stopid and service', (done) => {
      const messageId = 'abc';
      const match = ['', stopid, ' ' + servicename];
      _createResponse(messageId, match)
        .then((res) => {
          const expectedOutput = {
            opts: {
              'reply_to_message_id': 'abc',
              'reply_markup': '{"inline_keyboard":[[{"text":"all","callback_data":"6509"},{"text":"7","callback_data":"6509 7"},{"text":"14","callback_data":"6509 14"},{"text":"14C","callback_data":"6509 14C"},{"text":"27","callback_data":"6509 27"},{"text":"55","callback_data":"6509 55"},{"text":"59","callback_data":"6509 59"},{"text":"77","callback_data":"6509 77"},{"text":"N7","callback_data":"6509 N7"},{"text":"27C","callback_data":"6509 27C"},{"text":"48E","callback_data":"6509 48E"},{"text":"37A","callback_data":"6509 37A"},{"text":"37B","callback_data":"6509 37B"},{"text":"57","callback_data":"6509 57"}]]}'
            }
          };

          _.isEqual(res.opts, expectedOutput.opts).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with non existing stopid', (done) => {
      const messageId = 'abc';
      const match = ['', wrongStopid];

      _createResponse(messageId, match)
        .then((res) => {
          const expectedOutput = {
            message: 'Bus stop not found',
            opts: {}
          };

          _.isEqual(res, expectedOutput).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with a not 200 from the bus server', (done) => {
      const messageId = 'abc';
      const errorStopid = 'errorId';
      const match = ['', errorStopid];

      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: errorStopid }))
          .reply(800, 'error');

      _createResponse(messageId, match)
        .then((res) => {
          const expectedOutput = {
            message: 'There was a problem contacting the server',
            opts: {}
          };

          _.isEqual(res, expectedOutput).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with an error from the bus server', (done) => {
      const messageId = 'abc';
      const errorStopid = 'errorId';
      const match = ['', errorStopid];

      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: errorStopid }))
          .replyWithError('fake error');

      _createResponse(messageId, match)
        .then((res) => {
          const expectedOutput = {
            message: 'There was a problem contacting the server',
            opts: {}
          };

          _.isEqual(res, expectedOutput).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });
  });

  describe('sendResponse', () => {
    const fx = {
      log: (chatId, message, opts) => {
        return { chatId, message, opts };
      }
    };
    const bot = {
      sendMessage: (chatId, message, opts) => {
        const o = JSON.stringify(opts) || 'x';
        fx.log(chatId, message[0], o[0]);
      }
    };
    const msg = {
      chat: {
        id: '123'
      },
      'message_id': 'abc'
    };

    it('should succeed with results', (done) => {
      const match = ['', stopid];
      const spy = sinon.spy(fx, 'log');

      _sendResponse(bot, msg, match);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'S', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });

    it('should succeed with no results found', (done) => {
      const match = ['', wrongStopid];
      const spy = sinon.spy(fx, 'log');

      _sendResponse(bot, msg, match);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'B', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });

    it('should succeed with error', (done) => {
      const errorStopid = 'errorId';
      const match = ['', errorStopid];
      const spy = sinon.spy(fx, 'log');

      nock(bhUrl)
        .get('/departureboard.aspx')
          .query(_.assignIn({}, qs, { stopcode: errorStopid }))
          .replyWithError('fake error');

      _sendResponse(bot, msg, match);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'T', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });
  });

  describe('findMatches', () => {
    const o = [
      {
        desc: '',
        input: 'briapaw',
        output: ['', 'briapaw', undefined]
      },
      {
        desc: '',
        input: 'briapaw 7',
        output: ['', 'briapaw', ' 7']
      },
      {
        desc: '',
        input: 'BRIAPAW 77n',
        output: ['', 'BRIAPAW', ' 77n']
      },
      {
        desc: '',
        input: 'briapaw  ',
        output: ['', 'briapaw', '  ']
      }
    ];

    o.forEach((item) => {
      it('should succeed with `' + item.input + '`', (done) => {
        const output = _findMatches(item.input);

        _.isEqual(output[1], item.output[1]).should.equal(true);
        _.isEqual(output[2], item.output[2]).should.equal(true);
        done();
      });
    });
  });

});