const fs = require('fs');
const nock = require('nock');
const rewire = require('rewire');
const should = require('should');

const _bh = rewire('../../lib/bh');
const _parseStopsListData = _bh.__get__('parseStopsListData');
const _fetchStopsListData = _bh.__get__('fetchStopsListData');
const _fetchStopData = _bh.__get__('fetchStopData');
const _parseStop = _bh.__get__('parseStop');
const _getData = _bh.__get__('getData');
const _getNearbyLocations = _bh.__get__('getNearbyLocations');
const _getNearbyStops = _bh.__get__('getNearbyStops');

const bhSingleStopDataUrl = _bh.__get__('bhSingleStopDataUrl');
const bhStopsListDataUrl = _bh.__get__('bhStopsListDataUrl');
const bhSingleStopDataQuery = _bh.__get__('bhSingleStopDataQuery');
const bhStopsListDataQuery = _bh.__get__('bhStopsListDataQuery');
const bhSingleStopDataPage = _bh.__get__('bhSingleStopDataPage');
const bhStopsListDataPage = _bh.__get__('bhStopsListDataPage');

const check6509 = fs.readFileSync('./test/data/6509.txt', 'utf8');
const check65097 = fs.readFileSync('./test/data/6509-7.txt', 'utf8');
const content6509 = fs.readFileSync('./test/data/6509.html', 'utf8');
const content65097 = fs.readFileSync('./test/data/6509-7.html', 'utf8');
const content000 = fs.readFileSync('./test/data/000.html', 'utf8');
const contentxxx = fs.readFileSync('./test/data/xxx.html', 'utf8');
const content6509777 = fs.readFileSync('./test/data/6509-777.html', 'utf8');
const contentstops = fs.readFileSync('./test/data/stops.html', 'utf8');

const stopid = '6509';
const stopcode = 'briapaw';
const servicename = '7';
const wrongStopid = '000';
const wrongStopcode = 'xxx';

const live = false;

describe('bh', () => {
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

    describe('parseStopsListData', () => {
        const o = [
            {
                desc: 'should return empty array when data is a number',
                input: 9,
                output: []
            },
            {
                desc: 'should return empty array when data is a boolean true',
                input: true,
                output: []
            },
            {
                desc: 'should return empty array when data is a boolean false',
                input: false,
                output: []
            },
            {
                desc: 'should return empty array when data is null',
                input: null,
                output: []
            },
            {
                desc: 'should return empty array when data is undefined',
                input: undefined,
                output: []
            },
            {
                desc: 'should return empty array when data is an empty object',
                input: {},
                output: []
            },
            {
                desc: 'should return empty array when data is an empty array',
                input: [],
                output: []
            },
            {
                desc: 'should return empty array when data is a string',
                input: 'x',
                output: []
            },
            {
                desc: 'should return empty array when data is an empty string',
                input: '',
                output: []
            },
            {
                desc: 'should return empty array when data is empty result',
                input: '({"result":[]});',
                output: []
            },
            {
                desc: 'should return one element',
                input: '({"result":[1]});',
                output: [1]
            },
            {
                desc: 'should return one element when end semicolon is missing',
                input: '({"result":[1]})',
                output: [1]
            },
            {
                desc: 'should return one element when multiple end semicolons',
                input: '({"result":[1]});;',
                output: [1]
            },
            {
                desc: 'should return one element when data is json not jsonp',
                input: '{"result":[1]}',
                output: [1]
            },
            {
                desc:
                    'should return empty array when data in jsonp not an array',
                input: '{"result":1}',
                output: []
            },
            {
                desc:
                    'should return empty array when data in jsonp has no result field',
                input: '{"fake":[1]}',
                output: []
            }
        ];

        o.forEach(item => {
            it(item.desc, done => {
                const output = _parseStopsListData(item.input);

                should.deepEqual(output, item.output);
                done();
            });
        });
    });

    describe('fetchStopsListData', () => {
        it('should succeed', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(200, contentstops);

            _fetchStopsListData()
                .then(res => {
                    res.length.should.not.equal(0);
                    done();
                })
                .catch(err => done(err));
        });

        it('should fail when server returns an error', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .replyWithError('fake error');

            _fetchStopsListData()
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(503);
                    err.body.should.equal('fake error');
                    done();
                });
        });

        it('should fail when server returns something different from 200', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(400, 'error');

            _fetchStopsListData('errorId')
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(400);
                    err.body.should.equal('error');
                    done();
                });
        });
    });

    describe('getNearbyLocations', () => {
        it('should succeed', done => {
            const list = JSON.parse(
                contentstops.replace(/^\(/, '').replace(/\);$/, '')
            );
            const here = {
                latitude: '50.8306925129872',
                longitude: '-0.148075984124083'
            };
            const range = 100;
            const output = _getNearbyLocations(here, list.result, range);
            Object.keys(output).length.should.equal(4);
            done();
        });

        it('should succeed when no bus stop is in the range', done => {
            const list = JSON.parse(
                contentstops.replace(/^\(/, '').replace(/\);$/, '')
            );
            const here = {
                latitude: '44.801485',
                longitude: '10.327903600000013'
            };
            const range = 100;
            const output = _getNearbyLocations(here, list.result, range);
            Object.keys(output).length.should.equal(5);
            done();
        });
    });

    describe('getNearbyStops', () => {
        it('should succeed', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .reply(200, contentstops);

            const here = {
                latitude: '50.8306925129872',
                longitude: '-0.148075984124083'
            };
            const range = 100;

            _getNearbyStops(here, range)
                .then(res => {
                    Object.keys(res).length.should.equal(4);
                    done();
                })
                .catch(err => done(err));
        });

        it('should fail', done => {
            nock(bhStopsListDataUrl)
                .get(bhStopsListDataPage)
                .query(bhStopsListDataQuery)
                .replyWithError('fake error');

            const here = {
                latitude: '50.8306925129872',
                longitude: '-0.148075984124083'
            };

            _getNearbyStops(here)
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(503);
                    err.body.should.equal('fake error');
                    done();
                });
        });
    });

    describe('fetchStopData', () => {
        it('should succeed passing only stop id', done => {
            const checks = check6509.split('\n==========\n');

            _fetchStopData(stopid)
                .then(res => {
                    checks.forEach(check => {
                        res.indexOf(check).should.not.equal(-1);
                    });

                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed passing stop id and service', done => {
            const checks = check65097.split('\n==========\n');

            _fetchStopData(stopid, servicename)
                .then(res => {
                    checks.forEach(check => {
                        res.indexOf(check).should.not.equal(-1);
                    });

                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed passing only stop code', done => {
            const checks = check6509.split('\n==========\n');

            _fetchStopData(stopcode)
                .then(res => {
                    checks.forEach(check => {
                        res.indexOf(check).should.not.equal(-1);
                    });

                    done();
                })
                .catch(err => done(err));
        });

        it('should succeed passing stop code and service', done => {
            const checks = check65097.split('\n==========\n');

            _fetchStopData(stopcode, servicename)
                .then(res => {
                    checks.forEach(check => {
                        res.indexOf(check).should.not.equal(-1);
                    });

                    done();
                })
                .catch(err => done(err));
        });

        it('should fail passing non existing stop id', done => {
            _fetchStopData(wrongStopid)
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(404);
                    err.body.should.equal('no matching stop found');
                    done();
                });
        });

        it('should fail passing non existing stop code', done => {
            _fetchStopData(wrongStopcode)
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(404);
                    err.body.should.equal('no matching stop found');
                    done();
                });
        });

        it('should fail when server returns an error', done => {
            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: 'errorId'
                    })
                )
                .replyWithError('fake error');

            _fetchStopData('errorId')
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(503);
                    err.body.should.equal('fake error');
                    done();
                });
        });

        it('should fail when server returns something different from 200', done => {
            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: 'errorId'
                    })
                )
                .reply(400, 'error');

            _fetchStopData('errorId')
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
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
                    bearing: 'E',
                    location: {
                        latitude: 50.8309347155897,
                        longitude: -0.146568919313217
                    },
                    stopCode: 'briapaw',
                    lastUpdate: '11:26',
                    services: [
                        '7',
                        '14',
                        '14C',
                        '27',
                        '55',
                        '59',
                        '77',
                        'N7',
                        '27C',
                        '48E',
                        '37A',
                        '37B',
                        '57'
                    ],
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
                    bearing: 'E',
                    location: {
                        latitude: 50.8309347155897,
                        longitude: -0.146568919313217
                    },
                    stopCode: 'briapaw',
                    lastUpdate: '12:10',
                    services: [
                        '7',
                        '14',
                        '14C',
                        '27',
                        '55',
                        '59',
                        '77',
                        'N7',
                        '27C',
                        '48E',
                        '37A',
                        '37B',
                        '57'
                    ],
                    times: []
                }
            }
        ];

        o.forEach(item => {
            it(item.desc, done => {
                const output = _parseStop(item.input);

                should.deepEqual(output, item.output);
                done();
            });
        });
    });

    describe('getData', () => {
        it('should succeed', done => {
            _getData(stopid)
                .then(res => {
                    res.stopName.should.equal('Seven Dials');
                    res.stopCode.should.equal('briapaw');
                    should.deepEqual(
                        [
                            '7',
                            '14',
                            '14C',
                            '27',
                            '55',
                            '59',
                            '77',
                            'N7',
                            '27C',
                            '48E',
                            '37A',
                            '37B',
                            '57'
                        ],
                        res.services
                    );

                    done();
                })
                .catch(err => done(err));
        });

        it('should fail', done => {
            nock(bhSingleStopDataUrl)
                .get(bhSingleStopDataPage)
                .query(
                    Object.assign({}, bhSingleStopDataQuery, {
                        stopcode: 'errorId'
                    })
                )
                .reply(400, 'error');

            _getData('errorId')
                .then(() => {
                    done('There should be an error');
                })
                .catch(err => {
                    err.statusCode.should.equal(400);
                    err.body.should.equal('error');
                    done();
                });
        });
    });
});
