'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const secureMethods = require('../../lib/secureAccessMethods.js');
const _ = require('lodash');

chai.use(chaiAsPromised);
chai.should();

describe('secureAccessMethods', () => {
    const expectedMethodNames = [
        'read',
        'readAll',
        'create',
        'update',
        'delete',
        'bypass'
    ];

    describe('all expected methods should exist', () => {
        _.each(expectedMethodNames, (methName) => {
            it(methName, () => {
                expect(secureMethods[methName]).to.be.instanceOf(Function);
            });

        });
    });

    describe('all methods should be expected', () => {
        _.each(_.keys(secureMethods), (methName) => {
            it(methName, () => {
                expect(expectedMethodNames).to.include(methName);
            });

        });
    });

    /**
     * the functions below are not really unit testable
     * they should be integration tested instead
     *
    describe('readSecure', () => {});
    describe('readAllSecure') => {});
    describe('createSecure') => {});
    describe('updateSecure') => {});
    describe('deleteSecure') => {});
     */
});
