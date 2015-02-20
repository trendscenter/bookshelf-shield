'use strict';

var should = require('should');

describe('Array', function() {
    describe('#indexOf()', function() {
        var testArray;
        beforeEach('prepare test array', function () {
            testArray = [1, 2, 3];
        });
        it('should return the index when the value is present', function() {
            testArray.indexOf(1).should.be.equal(0);
            testArray.indexOf(2).should.be.equal(1);
            testArray.indexOf(3).should.be.equal(2);
        });
        it('should return -1 when the value is not present', function() {
            testArray.indexOf(5).should.be.equal(-1);
            testArray.indexOf(0).should.be.equal(-1);
        });
        it('silly async test', function(done) {
            process.nextTick(function() {
                //this is async
                done();
            });
        });
    });
});
