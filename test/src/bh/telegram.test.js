const fs = require('fs');
const nock = require('nock');
const rewire = require('rewire');
const should = require('should');
const sinon = require('sinon');

const _telegram = rewire('../../../src/bh/telegram');
const _createResponse = _telegram.__get__('createResponse');
const _createResponseLocation = _telegram.__get__('createResponseLocation');
const _sendResponse = _telegram.__get__('sendResponse');
const _findMatches = _telegram.__get__('findMatches');
const _sendLocation = _telegram.__get__('sendLocation');
const _askLocation = _telegram.__get__('askLocation');

const _api = rewire('../../../src/bh/api');
const bhSingleStopDataUrl = _api.__get__('bhSingleStopDataUrl');
const bhStopsListDataUrl = _api.__get__('bhStopsListDataUrl');
const bhSingleStopDataQuery = _api.__get__('bhSingleStopDataQuery');
const bhStopsListDataQuery = _api.__get__('bhStopsListDataQuery');
const bhSingleStopDataPage = _api.__get__('bhSingleStopDataPage');
const bhStopsListDataPage = _api.__get__('bhStopsListDataPage');

const content6509 = fs.readFileSync('./test/data/bh/6509.html', 'utf8');
const content65097 = fs.readFileSync('./test/data/bh/6509-7.html', 'utf8');
const content000 = fs.readFileSync('./test/data/bh/000.html', 'utf8');
const contentxxx = fs.readFileSync('./test/data/bh/xxx.html', 'utf8');
const contentstops = fs.readFileSync('./test/data/bh/stops.html', 'utf8');

const stopid = '6509';
const stopcode = 'briapaw';
const servicename = '7';
const wrongStopid = '000';
const wrongStopcode = 'xxx';

const live = false;

describe('telegram', () => {
    beforeEach(done => {
        if (!live) {
            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, { stopid: stopid })
                )
                .reply(200, content6509)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopid: stopid,
                        servicenamefilter: servicename
                    })
                )
                .reply(200, content65097)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: stopcode
                    })
                )
                .reply(200, content6509)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: stopcode,
                        servicenamefilter: servicename
                    })
                )
                .reply(200, content65097)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopid: wrongStopid
                    })
                )
                .reply(200, content000)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: wrongStopcode
                    })
                )
                .reply(200, contentxxx);
        }

        done();
    });

    afterEach(done => {
        nock.cleanAll();
        done();
    });

    describe('createResponse', () => {
        it('should succeed with only stopcode', done => {
            const messageId = 'abc';
            _createResponse(messageId, stopcode)
                .then(res => {
                    const expectedOutput = {
                        opts: {
                            reply_to_message_id: 'abc',
                            reply_markup:
                                '{"inline_keyboard":[[{"text":"all","callback_data":"briapaw"},{"text":"7","callback_data":"briapaw 7"},{"text":"14","callback_data":"briapaw 14"},{"text":"14C","callback_data":"briapaw 14C"},{"text":"27","callback_data":"briapaw 27"},{"text":"55","callback_data":"briapaw 55"},{"text":"59","callback_data":"briapaw 59"},{"text":"77","callback_data":"briapaw 77"},{"text":"N7","callback_data":"briapaw N7"},{"text":"27C","callback_data":"briapaw 27C"},{"text":"48E","callback_data":"briapaw 48E"},{"text":"37A","callback_data":"briapaw 37A"},{"text":"37B","callback_data":"briapaw 37B"},{"text":"57","callback_data":"briapaw 57"}]]}'
                        }
                    };

                    should.deepEqual(res.opts, expectedOutput.opts);
                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed with stopcode and service', done => {
            const messageId = 'abc';
            _createResponse(messageId, stopcode, servicename)
                .then(res => {
                    const expectedOutput = {
                        opts: {
                            reply_to_message_id: 'abc',
                            reply_markup:
                                '{"inline_keyboard":[[{"text":"all","callback_data":"briapaw"},{"text":"7","callback_data":"briapaw 7"},{"text":"14","callback_data":"briapaw 14"},{"text":"14C","callback_data":"briapaw 14C"},{"text":"27","callback_data":"briapaw 27"},{"text":"55","callback_data":"briapaw 55"},{"text":"59","callback_data":"briapaw 59"},{"text":"77","callback_data":"briapaw 77"},{"text":"N7","callback_data":"briapaw N7"},{"text":"27C","callback_data":"briapaw 27C"},{"text":"48E","callback_data":"briapaw 48E"},{"text":"37A","callback_data":"briapaw 37A"},{"text":"37B","callback_data":"briapaw 37B"},{"text":"57","callback_data":"briapaw 57"}]]}'
                        }
                    };

                    should.deepEqual(res.opts, expectedOutput.opts);
                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed with non existing stopcode', done => {
            const messageId = 'abc';

            _createResponse(messageId, wrongStopcode)
                .then(res => {
                    const expectedOutput = {
                        message: 'Bus stop not found',
                        opts: {}
                    };

                    should.deepEqual(res, expectedOutput);
                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed with a not 200 from the bus server', done => {
            const messageId = 'abc';
            const errorStopid = 'errorId';

            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: errorStopid
                    })
                )
                .reply(800, 'error');

            _createResponse(messageId, errorStopid)
                .then(res => {
                    const expectedOutput = {
                        message: 'There was a problem contacting the server',
                        opts: {}
                    };

                    should.deepEqual(res, expectedOutput);
                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed with an error from the bus server', done => {
            const messageId = 'abc';
            const errorStopid = 'errorId';

            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: errorStopid
                    })
                )
                .replyWithError('fake error');

            _createResponse(messageId, errorStopid)
                .then(res => {
                    const expectedOutput = {
                        message: 'There was a problem contacting the server',
                        opts: {}
                    };

                    should.deepEqual(res, expectedOutput);
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('createResponseLocation', () => {
        it('should succeed', done => {
            const messageId = 'abc';
            const here = {
                latitude: '50.8306925129872',
                longitude: '-0.148075984124083'
            };
            const range = 100;

            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(200, contentstops);

            _createResponseLocation(messageId, here, range)
                .then(res => {
                    const expectedOutput = {
                        message: 'Bus stops found:\n',
                        opts: {
                            reply_to_message_id: 'abc',
                            reply_markup:
                                '{"inline_keyboard":[[{"text":"Seven Dials W (briagmj)","callback_data":"briagmj"}],[{"text":"Seven Dials SE (brijdag)","callback_data":"brijdag"}],[{"text":"Seven Dials NW (brimdwd)","callback_data":"brimdwd"}],[{"text":"Seven Dials SW (briajwj)","callback_data":"briajwj"}]]}'
                        }
                    };

                    should.deepEqual(res, expectedOutput);
                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed with a not 200 from the bus server', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(800, 'error');

            _createResponseLocation()
                .then(res => {
                    const expectedOutput = {
                        message: 'There was a problem contacting the server',
                        opts: {}
                    };

                    should.deepEqual(res, expectedOutput);
                    done();
                })
                .catch(err => done(err));
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
            message_id: 'abc'
        };

        it('should succeed with results passing stopcode', done => {
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

        it('should succeed with results passing stopcode and service', done => {
            const match = ['', stopcode, ` ${servicename}`];
            const spy = sinon.spy(fx, 'log');

            _sendResponse(bot, msg, match);

            setTimeout(() => {
                spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
                spy.withArgs('123', 'S', '{').calledOnce.should.equal(true);

                fx.log.restore();
                done();
            }, 1000);
        });

        it('should succeed with no results found', done => {
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

        it('should succeed with error', done => {
            const errorStopid = 'errorId';
            const match = ['', errorStopid];
            const spy = sinon.spy(fx, 'log');

            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: errorStopid
                    })
                )
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

        o.forEach(item => {
            it(`should succeed with \`${item.input}\``, done => {
                const output = _findMatches(item.input);

                should.deepEqual(output[1], item.output[1]);
                should.deepEqual(output[2], item.output[2]);
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
            message_id: 'abc',
            location: {
                latitude: '50.8306925129872',
                longitude: '-0.148075984124083'
            }
        };

        it('should succeed', done => {
            const spy = sinon.spy(fx, 'log');

            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(200, contentstops);

            _sendLocation(bot, msg);

            setTimeout(() => {
                spy.withArgs('123', 'L', 'x').calledOnce.should.equal(true);
                spy.withArgs('123', 'B', '{').calledOnce.should.equal(true);

                fx.log.restore();
                done();
            }, 1000);
        });

        it('should succeed with error', done => {
            const spy = sinon.spy(fx, 'log');

            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
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
            message_id: 'abc'
        };

        it('should succeed', done => {
            const spy = sinon.spy(fx, 'log');

            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
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
