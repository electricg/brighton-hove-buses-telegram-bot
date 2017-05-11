/* global describe, it */
const _ = require('lodash');
const bh = require('../../lib/bh');


describe('bh', () => {

  describe('getStop', () => {

    it('should succeed passing only stop id', (done) => {
      bh.getStop('6509')
        .then(() => {
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing stop id and service', (done) => {
      bh.getStop('6509', '7')
        .then(() => {
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing only stop code', (done) => {
      bh.getStop('briapaw')
        .then(() => {
          done();
        })
        .catch((err) => done(err));
    });

    it('should succeed passing stop code and service', (done) => {
      bh.getStop('briapaw', '7')
        .then(() => {
          done();
        })
        .catch((err) => done(err));
    });

    it('should fail passing non existing stop id', (done) => {
      bh.getStop('000')
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
      bh.getStop('xxx')
        .then(() => {
          done('There should be an error');
        })
        .catch((err) => {
          err.statusCode.should.equal(404);
          err.body.should.equal('no matching stop found');
          done();
        });
    });

  });

  describe('parseStop', () => {

    it('should succeed when there is data', (done) => {
      const input = `<div class=\"livetimes\">  <table class=\"busexpress-clientwidgets-departures-departureboard\">  <thead><tr class=\"rowStopName\"><th colspan=\"3\" title=\"briapaw\" data-lat=\"50.8309347155897\" data-lng=\"-0.146568919313217\" data-bearing=\"E\">Seven Dials</th><tr>  <tr class=\"textHeader\"><th colspan=\"3\">text briapaw to 84268 for live times</th><tr>  <tr class=\"rowHeaders\"><th>service</th><th>destination</th><th>time</th><tr></thead><tbody>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 19:47:00\" title=\"due\">due</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 19:52:00\" title=\"5 mins\">5 mins</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 19:57:00\" title=\"10 mins\">10 mins</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 20:22:00\" title=\"35 mins\">35 mins</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 20:23:00\" title=\"20:23\">20:23</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 20:33:00\" title=\"46 mins\">46 mins</td>  </tr>  <tr class=\"rowServiceDeparture\">  <td class=\"colServiceName\">7</td>  <td class=\"colDestination\" title=\"Marina\">Marina</td>  <td class=\"colDepartureTime\" data-departureTime=\"11/05/2017 20:43:00\" title=\"56 mins\">56 mins</td>  </tr>  </tbody></table></div>  <div class=\"scrollmessage_container\"><div class=\"scrollmessage\"></div></div>  <div class=\"services\"><a href=\"#\" onclick=\"serviceNameClick('');\" class=\"service\">all</a>   <a href=\"#\" onclick=\"serviceNameClick('7');\" class=\"service selected\">7</a> <a href=\"#\" onclick=\"serviceNameClick('14');\" class=\"service\">14</a> <a href=\"#\" onclick=\"serviceNameClick('14C');\" class=\"service\">14C</a> <a href=\"#\" onclick=\"serviceNameClick('27');\" class=\"service\">27</a> <a href=\"#\" onclick=\"serviceNameClick('55');\" class=\"service\">55</a> <a href=\"#\" onclick=\"serviceNameClick('59');\" class=\"service\">59</a> <a href=\"#\" onclick=\"serviceNameClick('77');\" class=\"service\">77</a> <a href=\"#\" onclick=\"serviceNameClick('N7');\" class=\"service\">N7</a> <a href=\"#\" onclick=\"serviceNameClick('27C');\" class=\"service\">27C</a> <a href=\"#\" onclick=\"serviceNameClick('48E');\" class=\"service\">48E</a> <a href=\"#\" onclick=\"serviceNameClick('37A');\" class=\"service\">37A</a> <a href=\"#\" onclick=\"serviceNameClick('37B');\" class=\"service\">37B</a> <a href=\"#\" onclick=\"serviceNameClick('57');\" class=\"service\">57</a> <a href=\"#\" onclick=\"serviceNameClick('7');\" class=\"service selected\">7</a>   </div>  <div class='dptime'><span>times generated at: </span> <span>19:46</span></div>`;

      const output = bh.parseStop(input);
      const expectedOutput = {
        stopName: 'Seven Dials',
        stopCode: 'briapaw',
        lastUpdate: '19:46',
        services:
         [ '7',
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
           '57' ],
        times: [ 
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: 'due',
            time: '11/05/2017 19:47:00'
          },
          {
            service: '7',
            destination: 'Marina',
            timeLabel: '5 mins',
            time: '11/05/2017 19:52:00'
          },
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: '10 mins',
            time: '11/05/2017 19:57:00'
          },
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: '35 mins',
            time: '11/05/2017 20:22:00'
          },
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: '20:23',
            time: '11/05/2017 20:23:00'
          },
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: '46 mins',
            time: '11/05/2017 20:33:00'
          },
          { 
            service: '7',
            destination: 'Marina',
            timeLabel: '56 mins',
            time: '11/05/2017 20:43:00'
          }
        ]
      };
      _.isEqual(output, expectedOutput).should.equal(true);
      done();
    });

    it('should succeed when there is no data', (done) => {
      const input = `<div class=\"livetimes\">  <table class=\"busexpress-clientwidgets-departures-departureboard\">  <thead><tr class=\"rowStopName\"><th colspan=\"3\" title=\"briapaw\" data-lat=\"50.8309347155897\" data-lng=\"-0.146568919313217\" data-bearing=\"E\">Seven Dials</th><tr>  <tr class=\"textHeader\"><th colspan=\"3\">text briapaw to 84268 for live times</th><tr>  <tr class=\"rowHeaders\"><th>service</th><th>destination</th><th>time</th><tr></thead><tbody>  </tbody></table></div>  <div class=\"scrollmessage_container\"><div class=\"scrollmessage\"></div></div>  <div class=\"services\"><a href=\"#\" onclick=\"serviceNameClick('');\" class=\"service selected\">all</a>   <a href=\"#\" onclick=\"serviceNameClick('7');\" class=\"service\">7</a> <a href=\"#\" onclick=\"serviceNameClick('14');\" class=\"service\">14</a> <a href=\"#\" onclick=\"serviceNameClick('14C');\" class=\"service\">14C</a> <a href=\"#\" onclick=\"serviceNameClick('27');\" class=\"service\">27</a> <a href=\"#\" onclick=\"serviceNameClick('55');\" class=\"service\">55</a> <a href=\"#\" onclick=\"serviceNameClick('59');\" class=\"service\">59</a> <a href=\"#\" onclick=\"serviceNameClick('77');\" class=\"service\">77</a> <a href=\"#\" onclick=\"serviceNameClick('N7');\" class=\"service\">N7</a> <a href=\"#\" onclick=\"serviceNameClick('27C');\" class=\"service\">27C</a> <a href=\"#\" onclick=\"serviceNameClick('48E');\" class=\"service\">48E</a> <a href=\"#\" onclick=\"serviceNameClick('37A');\" class=\"service\">37A</a> <a href=\"#\" onclick=\"serviceNameClick('37B');\" class=\"service\">37B</a> <a href=\"#\" onclick=\"serviceNameClick('57');\" class=\"service\">57</a> <a href=\"#\" onclick=\"serviceNameClick('7');\" class=\"service\">7</a>   </div>  <div class='dptime'><span>times generated at: </span> <span>19:47</span></div>`;

      const output = bh.parseStop(input);
      const expectedOutput = {
        stopName: 'Seven Dials',
        stopCode: 'briapaw',
        lastUpdate: '19:47',
        services:
         [ '7',
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
           '57' ],
        times: []
      };
      _.isEqual(output, expectedOutput).should.equal(true);
      done();
    });

  });

});