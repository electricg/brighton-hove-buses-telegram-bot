/* global describe, it */
const fs = require('fs');
const contentstops = fs.readFileSync('./test/data/stops.html', 'utf8');
const contentservices = require('../data/services');

const regexStopName = '^[a-zA-Z0-9 \\(\\)&,\'-]+$';
const regexStopCode = '^[a-z]+$';
const regexServiceName = '^[a-zA-Z0-9]{1,3}$';


describe('Data', () => {

  describe('stop name', () => {
    it('should pass the regex', (done) => {
      const list = JSON.parse(contentstops.replace(/^\(/, '').replace(/\);$/, ''));
      const regex = new RegExp(regexStopName);
      let errors = [];

      list.result.forEach((item) => {
        const pass = regex.test(item.stopName);

        if (!pass) {
          errors.push(item.stopName);
        }
      });

      if (errors.length) {
        done(JSON.stringify(errors, null, 2));
      }
      else {
        done();
      }
    });
  });

  describe('stop code', () => {
    it('should pass the regex', (done) => {
      const list = JSON.parse(contentstops.replace(/^\(/, '').replace(/\);$/, ''));
      const regex = new RegExp(regexStopCode);
      let errors = [];

      list.result.forEach((item) => {
        const pass = regex.test(item.NaptanCode);

        if (!pass) {
          // TODO: remove bus stops with no code
          errors.push({ n: item.stopName, c: item.NaptanCode });
        }
      });

      if (errors.length) {
        done(JSON.stringify(errors, null, 2));
      }
      else {
        done();
      }
    });
  });

  describe('service name', () => {
    it('should pass the regex', (done) => {
      const regex = new RegExp(regexServiceName);
      let errors = [];

      contentservices.forEach((item) => {
        const pass = regex.test(item);

        if (!pass) {
          errors.push(item);
        }
      });

      if (errors.length) {
        done(JSON.stringify(errors, null, 2));
      }
      else {
        done();
      }
    });
  });

});