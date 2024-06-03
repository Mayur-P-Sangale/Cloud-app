const mocha = require('mocha');
const request = require('supertest');
const assert = require('assert');

const app = require('./index');

describe('GET /healthz', () => {
    it(' /healthz 200 OK TEST', (done) => {

        request(app)
        .get('/healthz')
        .end( (err,res) => {
            assert.equal('200', res.statusCode);
            done();
        });
    });
});