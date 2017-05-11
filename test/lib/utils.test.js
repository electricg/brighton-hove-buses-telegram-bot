/* global describe, it */
const _ = require('lodash');
const utils = require('../../lib/utils');

describe('Utils', () => {

  describe('formatOrigins', () => {
    const o = [
      {
        'desc': 'should return empty array when input is a number',
        'input': 1,
        'output': []
      },
      {
        'desc': 'should return empty array when input is a boolean',
        'input': true,
        'output': []
      },
      {
        'desc': 'should return empty array when input is an object',
        'input': {},
        'output': []
      },
      {
        'desc': 'should return empty array when input is an empty string',
        'input': '',
        'output': []
      },
      {
        'desc': 'should return empty array when input is an empty array',
        'input': [],
        'output': []
      },
      {
        'desc': 'should trim spaces from a string',
        'input': ' aaaa , bbbb , cccc ',
        'output': ['aaaa', 'bbbb', 'cccc']
      },
      {
        'desc': 'should trim spaces from an array',
        'input': [' aaaa ', ' bbbb ', ' cccc '],
        'output': ['aaaa', 'bbbb', 'cccc']
      },
      {
        'desc': 'should return an array with one item from a string with no separators',
        'input': 'aaaa',
        'output': ['aaaa']
      },
      {
        'desc': 'should filter out items in the array that are not strings or empty strings',
        'input': [' aaaa ', 1, true, {}, null, '', 'bbbb'],
        'output': ['aaaa', 'bbbb']
      }
    ];

    o.forEach((item) => {
      it(item.desc, (done) => {
        let output = utils.formatOrigins(item.input);
        _.isEqual(output, item.output).should.equal(true);
        done();
      });
    });
  });


  describe('formatError', () => {
    const o = [
      {
        'desc': 'should return null error and no details property',
        'msg': null,
        'err': null,
        'output': { status: 0, error: null }
      },
      {
        'desc': 'should return error and no details property',
        'msg': 'xxx',
        'err': null,
        'output': { status: 0, error: 'xxx' }
      },
      {
        'desc': 'should return error and details property from err.message',
        'msg': 'xxx',
        'err': { message: 'yyy' },
        'output': { status: 0, error: 'xxx', details: 'yyy' }
      },
      {
        'desc': 'should return error and details property from err.statusCode and err.statusMessage',
        'msg': 'xxx',
        'err': { statusCode: 200, statusMessage: 'yyy' },
        'output': { status: 0, error: 'xxx', details: '200 yyy' }
      },
      {
        'desc': 'should return error and details property of empty string',
        'msg': 'xxx',
        'err': { zzz: 'yyy' },
        'output': { status: 0, error: 'xxx', details: '' }
      },
    ];

    o.forEach((item) => {
      it(item.desc, (done) => {
        let output = utils.formatError(item.msg, item.err);
        _.isEqual(output, item.output).should.equal(true);
        done();
      });
    });
  });
});