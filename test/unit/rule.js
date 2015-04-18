'use strict';

const Rule = require('../../lib/Rule.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const relations = require('../stubs/relations');
const expect = chai.expect;
const AuthError = require('../../lib/error.js');

chai.use(chaiAsPromised);
chai.should();

describe('Rule', function() {
    let rule;
    let testUser = { username: 'test' };
    let testModel = {
        modelType: 'test',
        get: function() { return 'testVal'; }
    };
    let testMethod = function(user) {
        return Promise.resolve({
            user: user,
            model: this
        });
    };

    beforeEach('Require Rule Class', function() {
        rule = new Rule('test', testMethod);
    });

    describe('constructor', function() {
        it('should have an action and method property', function() {
            rule.should.have.property('action');
            rule.action.should.eql('test');
            rule.should.have.property('method');
            rule.method.should.eql(testMethod);
        });
    });

    describe('applyTo', function() {
        it('should return a promise that resolves model and user', function() {
            const expected = {
                user: testUser,
                model: testModel
            };
            const result = rule.applyTo(testModel, testUser);
            return result.should.become(expected);
        });
    });

    describe('isApplicable', function() {
        it('should return true when the action matches', function() {
            return rule.isApplicable('test').should.be.eql(true);
        });

        it('should return false when the action does not match', function() {
            return rule.isApplicable('somethingElse').should.be.eql(false);
        });
    });

    describe('buildGeneric', function() {
        let options;
        const testFn = function() {
            return Rule.buildGeneric(options);
        };

        beforeEach('rebuild rule options', function() {
            options = {
                actionName: 'test',
                authKey: 'testId',
                acl: relations,
                aclContextName: 'alwaysTrue',
                modelName: 'testModel'
            };
        });

        it('should error if actionName is not specified', function() {
            delete(options.actionName);
            expect(testFn).to.throw(Error);
        });

        it('should error if authKey is not specified', function() {
            delete(options.authKey);
            expect(testFn).to.throw(Error);
        });

        it('should error if acl is not specified', function() {
            delete(options.acl);
            expect(testFn).to.throw(Error);
        });

        it('should error if aclContextName is not specified', function() {
            delete(options.aclContextName);
            expect(testFn).to.throw(Error);
        });

        it('should error if modelName is not specified', function() {
            delete(options.modelName);
            expect(testFn).to.throw(Error);
        });

        it('should error if aclContextName is not a valid context', function() {
            options.aclContextName = 'undefined';
            expect(testFn).to.throw(Error);
        });

        it('should produce a Rule object if options are correct', function() {
            const rule = testFn();
            rule.should.have.property('action');
            rule.action.should.eql('test');
            rule.should.have.property('method');
            rule.method.should.be.a('function');
        });

        describe('Generic Rule Method', function() {
            it('should allow access if ACL returns true', function() {
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.become(true);
            });

            it('should reject with AuthError if ACL returns false', function() {
                options.aclContextName = 'alwaysFalse';
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.be.rejectedWith(AuthError);
            });

            it('should reject if ACL rejects with error', function() {
                options.aclContextName = 'alwaysError';
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.be.rejectedWith(Error);
            });
        });
    });
});
