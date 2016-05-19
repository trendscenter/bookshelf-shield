'use strict';

const Rule = require('../../lib/Rule.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const relations = require('../stubs/relations');
const expect = chai.expect;
const AuthError = require('../../lib/error.js');
const Model = require('../stubs/Model.js').extend();

chai.use(chaiAsPromised);
chai.should();

describe('Rule', () => {
    let rule;
    let testUser = { username: 'testUser' };
    let testModel = new Model();
    let testMethod = function(user) {
        return Promise.resolve({
            user: user,
            model: this
        });
    };

    beforeEach('Require Rule Class', () => {
        rule = new Rule({ actionName: 'test', method: testMethod });
    });

    describe('constructor', () => {
        it('should return an instance of Rule', () => {
            rule.should.be.an.instanceOf(Rule);
        });

        it('should have a config, action and method property', () => {
            rule.should.have.property('action');
            rule.action.should.eql('test');
            rule.should.have.property('method');
            rule.method.should.eql(testMethod);
            rule.should.have.property('config');
        });
    });

    describe('applyTo', () => {
        it('should return a promise that resolves model and user', () => {
            const expected = {
                user: testUser,
                model: testModel
            };
            const result = rule.applyTo(testModel, testUser);
            return result.should.become(expected);
        });
    });

    describe('isApplicable', () => {
        it('should return true when the action matches',
        () => rule.isApplicable('test').should.be.eql(true));

        it('should return false when the action does not match',
        () => rule.isApplicable('somethingElse').should.be.eql(false));
    });

    describe('buildGeneric', () => {
        let options;
        const testFn = () => Rule.buildGeneric(options);

        beforeEach('rebuild rule options', () => {
            options = {
                actionName: 'test',
                authKey: 'testId',
                acl: relations,
                aclContextName: 'alwaysTrue',
                modelName: 'testModel'
            };
        });

        it('should error if actionName is not specified', () => {
            delete(options.actionName);
            expect(testFn).to.throw(Error);
        });

        it('should error if authKey is not specified', () => {
            delete(options.authKey);
            expect(testFn).to.throw(Error);
        });

        it('should error if acl is not specified', () => {
            delete(options.acl);
            expect(testFn).to.throw(Error);
        });

        it('should error if aclContextName is not specified', () => {
            delete(options.aclContextName);
            expect(testFn).to.throw(Error);
        });

        it('should error if modelName is not specified', () => {
            delete(options.modelName);
            expect(testFn).to.throw(Error);
        });

        it('should error if aclContextName is not a valid context', () => {
            options.aclContextName = 'undefined';
            expect(testFn).to.throw(Error);
        });

        it('should produce a Rule object if options are correct', () => {
            const rule = testFn();
            rule.should.have.property('action');
            rule.action.should.eql('test');
            rule.should.have.property('method');
            rule.method.should.be.a('function');
        });

        describe('Generic Rule Method', () => {
            it('should allow access if ACL returns true', () => {
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.become(true);
            });

            it('should reject with AuthError if ACL returns false', () => {
                options.aclContextName = 'alwaysFalse';
                const expectedMsg = 'testUser cannot test testModel in ' +
                    'testId `testVal`';
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.be.rejectedWith(AuthError, expectedMsg);
            });

            it('should reject if ACL rejects with error', () => {
                options.aclContextName = 'alwaysError';
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.be.rejectedWith(Error);
            });

            it('should form the proper ACL question string', () => {
                options.aclContextName = 'identity';
                const expected = 'can testUser test_testModel from testVal';
                const rule = testFn();
                const result = rule.applyTo(testModel, testUser);
                return result.should.become(expected);
            });

        });
    });
});
