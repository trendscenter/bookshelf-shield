'use strict';

const Shield = require('../../lib/Shield.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const relations = require('../stubs/relations');
const expect = chai.expect;
const BaseModel = require('../stubs/Model.js');
const authConfig = require('./fixtures/testShieldConfig.js');
const Rule = require('../../lib/Rule.js');
const AuthError = require('../../lib/error.js');
const secureMethods = require('../../lib/secureAccessMethods.js');

chai.use(chaiAsPromised);
chai.should();

describe('Shield', () => {
    let shield;
    let TestModel;
    const protectedMethodNames = [
        'fetch',
        'fetchAll',
        'save',
        'destroy'
    ];
    beforeEach('create new Shield', () => {
        TestModel = BaseModel.extend();
        shield = new Shield(TestModel, relations);
    });

    describe('constructor', () => {
        it('returns a Shield for the provided model', () => {
            shield.should.be.an.instanceOf(Shield);
        });

        it('returns a shield with a Model property', () => {
            expect(shield.Model).to.equal(TestModel);
        });

        it('returns a shield with an acl property', () => {
            expect(shield.acl).to.be.equal(relations);
        });

        it('returns a shield with a rules property', () => {
            expect(shield.rules).to.be.an.instanceOf(Array);
        });

        it('sets the shield property on the model', () => {
            expect(TestModel.shield).to.be.equal(shield);
        });

    });

    describe('addRules', () => {
        beforeEach('add rules to shield', () => {
            shield.addRules(authConfig);
        });

        it('adds four default rules to the shield', () => {
            expect(shield.rules).to.have.length(4);
        });

        describe('getApplicableRules', () => {
            it('returns an array of rules for read action', () => {
                const rules = shield.getApplicableRules('read');
                expect(rules).to.be.instanceOf(Array);
                expect(rules).to.have.length(1);
                expect(rules[0]).to.be.instanceOf(Rule);
            });

            it('returns an array of rules for create action', () => {
                const rules = shield.getApplicableRules('create');
                expect(rules).to.be.instanceOf(Array);
                expect(rules).to.have.length(1);
                expect(rules[0]).to.be.instanceOf(Rule);
            });

            it('returns an array of rules for update action', () => {
                const rules = shield.getApplicableRules('update');
                expect(rules).to.be.instanceOf(Array);
                expect(rules).to.have.length(1);
                expect(rules[0]).to.be.instanceOf(Rule);
            });

            it('returns an array of rules for delete action', () => {
                const rules = shield.getApplicableRules('delete');
                expect(rules).to.be.instanceOf(Array);
                expect(rules).to.have.length(1);
                expect(rules[0]).to.be.instanceOf(Rule);
            });

            it('throws an error if no rules found', () => {
                const testFn = () => shield.getApplicableRules('undefined');
                expect(testFn).to.throw(AuthError, /no rules found/i);
            });

        });

    });

    describe('wrapModel', () => {
        let model;
        before('instantiate Model', () => {
            model = new TestModel();
        });

        protectedMethodNames.forEach((fnName) => {
            it('prevents direct calls to ' + fnName + ' method', () => {
                const promise = model[fnName]();
                return expect(promise).to.be
                    .rejectedWith(Error, /protected access method/);
            });
        });

        protectedMethodNames.forEach((fnName) => {
            it('stores ' + fnName + ' method as _' + fnName, () => {
                fnName = '_' + fnName;
                expect(shield[fnName]).to.be.an.instanceOf(Function);
            });
        });

        // verify that all methods in secureMethods are added
        Object.keys(secureMethods).forEach((fnName) => {
            it('adds secure method: ' + fnName + ' to model prototype', () => {
                expect(model[fnName]).to.equal(secureMethods[fnName]);
            });
        });
    });

});

