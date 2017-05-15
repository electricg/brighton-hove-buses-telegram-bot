/* global describe, it, beforeEach, afterEach */
const fs = require('fs');
const _ = require('lodash');
const nock = require('nock');
const rewire = require('rewire');
const sinon = require('sinon');

const _telegram = rewire('../../lib/telegram');
const _createResponse = _telegram.__get__('createResponse');
const _createResponseLocation = _telegram.__get__('createResponseLocation');
const _sendResponse = _telegram.__get__('sendResponse');
const _findMatches = _telegram.__get__('findMatches');
const _sendLocation = _telegram.__get__('sendLocation');
const _askLocation = _telegram.__get__('askLocation');

const _bh = rewire('../../lib/bh');
const bhUrl1 = _bh.__get__('bhUrl1');
const bhUrl2 = _bh.__get__('bhUrl2');
const qs1 = _bh.__get__('qs1');
const qs2 = _bh.__get__('qs2');
const page1 = _bh.__get__('page1');
const page2 = _bh.__get__('page2');

const content6509 = fs.readFileSync('./test/data/6509.html', 'utf8');
const content65097 = fs.readFileSync('./test/data/6509-7.html', 'utf8');
const content000 = fs.readFileSync('./test/data/000.html', 'utf8');
const contentxxx = fs.readFileSync('./test/data/xxx.html', 'utf8');
const contentstops = fs.readFileSync('./test/data/stops.html', 'utf8');

const stopid = '6509';
const stopcode = 'briapaw';
const servicename = '7';
const wrongStopid = '000';
const wrongStopcode = 'xxx';

const live = false;


describe('telegram', () => {

  beforeEach((done) => {
    if (!live) {
      nock(bhUrl1)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopid: stopid }))
          .reply(200, content6509)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopid: stopid, servicenamefilter: servicename }))
          .reply(200, content65097)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: stopcode }))
          .reply(200, content6509)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: stopcode, servicenamefilter: servicename }))
          .reply(200, content65097)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopid: wrongStopid }))
          .reply(200, content000)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: wrongStopcode }))
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
    it('should succeed with only stopcode', (done) => {
      const messageId = 'abc';
      _createResponse(messageId, stopcode)
        .then((res) => {
          const expectedOutput = {
            opts: {
              'reply_to_message_id': 'abc',
              'reply_markup': '{"inline_keyboard":[[{"text":"all","callback_data":"briapaw"},{"text":"7","callback_data":"briapaw 7"},{"text":"14","callback_data":"briapaw 14"},{"text":"14C","callback_data":"briapaw 14C"},{"text":"27","callback_data":"briapaw 27"},{"text":"55","callback_data":"briapaw 55"},{"text":"59","callback_data":"briapaw 59"},{"text":"77","callback_data":"briapaw 77"},{"text":"N7","callback_data":"briapaw N7"},{"text":"27C","callback_data":"briapaw 27C"},{"text":"48E","callback_data":"briapaw 48E"},{"text":"37A","callback_data":"briapaw 37A"},{"text":"37B","callback_data":"briapaw 37B"},{"text":"57","callback_data":"briapaw 57"}]]}'
            }
          };

          _.isEqual(res.opts, expectedOutput.opts).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with stopcode and service', (done) => {
      const messageId = 'abc';
      _createResponse(messageId, stopcode, servicename)
        .then((res) => {
          const expectedOutput = {
            opts: {
              'reply_to_message_id': 'abc',
              'reply_markup': '{"inline_keyboard":[[{"text":"all","callback_data":"briapaw"},{"text":"7","callback_data":"briapaw 7"},{"text":"14","callback_data":"briapaw 14"},{"text":"14C","callback_data":"briapaw 14C"},{"text":"27","callback_data":"briapaw 27"},{"text":"55","callback_data":"briapaw 55"},{"text":"59","callback_data":"briapaw 59"},{"text":"77","callback_data":"briapaw 77"},{"text":"N7","callback_data":"briapaw N7"},{"text":"27C","callback_data":"briapaw 27C"},{"text":"48E","callback_data":"briapaw 48E"},{"text":"37A","callback_data":"briapaw 37A"},{"text":"37B","callback_data":"briapaw 37B"},{"text":"57","callback_data":"briapaw 57"}]]}'
            }
          };

          _.isEqual(res.opts, expectedOutput.opts).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with non existing stopcode', (done) => {
      const messageId = 'abc';

      _createResponse(messageId, wrongStopcode)
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

      nock(bhUrl1)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: errorStopid }))
          .reply(800, 'error');

      _createResponse(messageId, errorStopid)
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

      nock(bhUrl1)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: errorStopid }))
          .replyWithError('fake error');

      _createResponse(messageId, errorStopid)
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

  describe('createResponseLocation', () => {
    it('should succeed', (done) => {
      const messageId = 'abc';
      const here = {
        latitude: '50.8306925129872',
        longitude: '-0.148075984124083'
      };
      const range = 100;

      nock(bhUrl2)
        .get(page2)
          .query(qs2)
          .reply(200, contentstops);

      _createResponseLocation(messageId, here, range)
        .then((res) => {
          const expectedOutput = {
            message: 'Bus stops found:\n',
            opts: {
              'reply_to_message_id': 'abc',
              'reply_markup': '{"inline_keyboard":[[{"text":"Seven Dials W (briagmj)","callback_data":"briagmj"}],[{"text":"Seven Dials SE (brijdag)","callback_data":"brijdag"}],[{"text":"Seven Dials NW (brimdwd)","callback_data":"brimdwd"}],[{"text":"Seven Dials SW (briajwj)","callback_data":"briajwj"}]]}'
            }
          };

          _.isEqual(res, expectedOutput).should.equal(true);
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed with a not 200 from the bus server', (done) => {
      nock(bhUrl2)
        .get(page2)
          .query(qs2)
          .reply(800, 'error');

      _createResponseLocation()
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

    it('should succeed with results passing stopcode', (done) => {
      const match = ['', stopcode];
      const spy = sinon.spy(fx, 'log');

      _sendResponse(bot, msg, match);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'S', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });

    it('should succeed with results passing stopcode and service', (done) => {
      const match = ['', stopcode, ' ' + servicename];
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
      const match = ['', wrongStopcode];
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

      nock(bhUrl1)
        .get(page1)
          .query(_.assignIn({}, qs1, { stopcode: errorStopid }))
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

  describe('sendLocation', () => {
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
      'message_id': 'abc',
      location: {
        latitude: '50.8306925129872',
        longitude: '-0.148075984124083'
      }
    };

    it('should succeed', (done) => {
      const spy = sinon.spy(fx, 'log');

      nock(bhUrl2)
        .get(page2)
          .query(qs2)
          .reply(200, contentstops);

      _sendLocation(bot, msg);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'B', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });

    it('should succeed with error', (done) => {
      const spy = sinon.spy(fx, 'log');

      nock(bhUrl2)
        .get(page2)
          .query(qs2)
          .replyWithError('fake error');

      _sendLocation(bot, msg);

      setTimeout(() => {
        spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
        spy.withArgs('123', 'T', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });
  });

  describe('askLocation', () => {
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

    it('should succeed', (done) => {
      const spy = sinon.spy(fx, 'log');

      nock(bhUrl2)
        .get(page2)
          .query(qs2)
          .reply(200, contentstops);

      _askLocation(bot, msg);

      setTimeout(() => {
        spy.withArgs('123', 'T', '{').calledOnce.should.equal(true);

        fx.log.restore();
        done();
      }, 1000);
    });
  });

});