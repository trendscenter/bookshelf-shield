'use strict';

const shield = require('../../lib/main.js');
const Shield = require('../../lib/Shield.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const relations = require('relations');
const bookshelfInit = require('bookshelf');
const knex = require('knex');
const mockKnex = require('mock-knex');
const expect = chai.expect;
const AuthError = require('../../lib/error.js');
const studyConfig = require('./fixtures/studyShield.js');
const authConfig = [studyConfig];
const _ = require('lodash');
const relationsPersistenceFilePath = './test/integration/tmp/relations.json';
const fs = require('fs');

let bookshelf;

chai.use(chaiAsPromised);
chai.should();

describe('Shield', () => {
    const models = {};
    before('Initialize Mock Knex', () => {
        const tracker = mockKnex.getTracker();
        mockKnex.knex.use(knex);
        mockKnex.knex.install();
        tracker.install();
        tracker.on('query', (query) => {
            query.response([{
                id: '1',
                sql: query.sql
            }]);
        });
    });

    before('Initialize bookshelf', () => {
        bookshelf = bookshelfInit(knex({ client: 'pg' }));
    });

    before('Initialize bookshelf models', () => {
        models.Study = bookshelf.Model.extend({tableName: 'mrs_studies'});
    });

    before('Initialize relations', () => {
        if (fs.existsSync(relationsPersistenceFilePath)) {
            fs.unlinkSync(relationsPersistenceFilePath);
        }

        relations.use(relations.stores.memory, {
            dataFile: relationsPersistenceFilePath
        });
        relations.define('study', {
            PI: ['read_Study'],
            siteAdmin: [
                'read_Study',
                'update_Study',
                'create_Study',
                'delete_Study'
            ]
        });
        relations.define('site', {
            siteAdmin: [
                'read_Study',
                'update_Study',
                'create_Study',
                'delete_Study'
            ]
        });
        relations.study('testPI is PI of 1');
        relations.study('otherPI is PI of 3');
        relations.study('testAdmin is siteAdmin of 1');
        relations.study('testAdmin is siteAdmin of 2');
        relations.site('testAdmin is siteAdmin of 10');
    });

    describe('init', () => {
        let options;
        const initShield = () => shield(options);
        beforeEach('Initialize options', () => {
            options = {
                config: authConfig,
                acl: relations,
                models: models
            };
        });

        it('should throw error if authConfig not set in options', () => {
            delete(options.config);
            expect(initShield).to.throw(Error, /Invalid Shield Options/);
        });

        it('should throw error if acl not set in options', () => {
            delete(options.acl);
            expect(initShield).to.throw(Error, /Invalid Shield Options/);
        });

        it('should throw error if models not set in options', () => {
            delete(options.models);
            expect(initShield).to.throw(Error, /Invalid Shield Options/);
        });

        it('should successfully create shield for each model', () => {
            initShield();
            _.each(models, (model) => {
                expect(model).to.have.property('shield');
                expect(model.shield).to.be.instanceOf(Shield);
            });
        });
    });

    describe('Secure Access Methods', () => {
        let study;
        beforeEach('reset study instance', () => {
            study = new models.Study();
        });

        describe('read', () => {
            const expectedSql = 'select "mrs_studies".* from "mrs_studies" ' +
                    'where "mrs_studies"."id" = ? limit ?';
            it('allow testPI to read study1', () => {
                const user = { username: 'testPI' };
                const promise = study.set('id', 1).read(user);
                return expect(promise).to.eventually.have.
                    deep.property('attributes.sql', expectedSql);
            });

            it('allow testAdmin to read study1', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('id', 1).read(user);
                return expect(promise).to.eventually.have.
                    deep.property('attributes.sql', expectedSql);
            });

            it('deny otherPI to read study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).read(user);
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });

            it('deny unknown to read study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).read(user);
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });
        });

        describe('readAll', () => {
            const expectedSql = 'select "mrs_studies".* from "mrs_studies" ' +
                    'where "id" = ?';
            it('allow testPI to readAll study1', () => {
                const user = { username: 'testPI' };
                const promise = study.where({ id: 1 }).readAll(user);
                return expect(promise).to.eventually.have.
                    deep.property('models[0].attributes.sql', expectedSql);
            });

            it('allow testAdmin to readAll study1', () => {
                const user = { username: 'testAdmin' };
                const promise = study.where({ id: 1 }).readAll(user);
                return expect(promise).to.eventually.have.
                    deep.property('models[0].attributes.sql', expectedSql);
            });

            it('deny otherPI to readAll study1', () => {
                const user = { username: 'otherPI' };
                const promise = study.where({ id: 1 }).readAll(user);
                return expect(promise).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });

            it('deny unknown to readAll study1', () => {
                const user = { username: 'otherPI' };
                const promise = study.where({ id: 1 }).readAll(user);
                return expect(promise).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });
        });

        describe('update', () => {
            it('deny testPI to update study1', () => {
                const user = { username: 'testPI' };
                const result = study.set('id', 1).update(user);
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*update/);
            });

            it('allow testAdmin to update study1', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('id', 1)
                    .set('testLabel', 'testLabel').update(user);
                return expect(promise).to.eventually.have.
                    deep.property('attributes.testLabel', 'testLabel');
            });

            it('denies anyone from updating new record', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('testLabel', 'testLabel')
                    .update(user);
                return expect(promise).to.be.
                    rejectedWith(AuthError, /new record/);
            });

            it('deny otherPI to update study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).update(user);

                //note: read permissions are required for update
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });

            it('deny unknown to update study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).update(user);

                //note: read permissions are required for update
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });
        });

        describe('create', () => {
            it('deny testPI to create study1', () => {
                const user = { username: 'testPI' };
                const result = study.set('siteId', 1).create(user);
                return expect(result).to.be.
                    rejectedWith(Error, /cannot.*create/);
            });

            //TODO add site-level auth to make the test below work
            it('allow testAdmin to create study', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('siteId', 10)
                    .set('testLabel', 'testLabel').create(user);
                return expect(promise).to.eventually.have.deep
                    .property('attributes');
            });

            it('denies anyone from creating an existing record', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('id', 1)
                    .set('testLabel', 'testLabel').create(user);
                return expect(promise).to.be.
                    rejectedWith(AuthError, /exists/);
            });

            it('deny otherPI to create study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('siteId', 1).create(user);
                return expect(result).to.be.
                    rejectedWith(Error, /cannot.*create/);
            });

            it('deny unknown to create study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('siteId', 1).create(user);
                result.catch(console.dir);
                return expect(result).to.be.
                    rejectedWith(Error, /cannot.*create/);
            });
        });

        describe('delete', () => {
            it('deny testPI to delete study1', () => {
                const user = { username: 'testPI' };
                const result = study.set('id', 1).delete(user);
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*delete/);
            });

            it('allow testAdmin to delete study1', () => {
                const user = { username: 'testAdmin' };
                const promise = study.set('id', 1)
                    .set('testLabel', 'testLabel').delete(user);
                return expect(promise).to.eventually.not.have.
                    deep.property('attributes.id');
            });

            it('deny otherPI to delete study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).delete(user);

                //note: read permissions are required for delete
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });

            it('deny unknown to delete study1', () => {
                const user = { username: 'otherPI' };
                const result = study.set('id', 1).delete(user);

                //note: read permissions are required for delete
                return expect(result).to.be.
                    rejectedWith(AuthError, /cannot.*read/);
            });
        });
    });

});
