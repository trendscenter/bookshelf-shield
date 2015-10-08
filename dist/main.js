'use strict';
var Shield = require('./Shield.js');
var wrapRelations = require('./wrapRelations.js');
var _ = require('lodash');
var joi = require('joi');
var internals = {
    models: {},
    acl: null,
    authConfig: []
};

/**
 * Shortcut to get auth configs that apply to a given model
 * @param {string} modelName is the name of the model
 * @return {array} an array of matching configs
 */
function getAuthConfigs(modelName) {
    return _.filter(internals.authConfig, function hasSameModelName(c) {
        return c.defaults.modelName === modelName;
    });
}

/**
 * Set an individual model on the internal scope after wrapping it with a shield
 * @param {bookshelfModel} Model is a bookshelf Model constructor
 * @return null;
 */
function setModel(Model, modelName) {
    var authConfigs = undefined;
    if (!internals.acl) {
        throw new Error('Attempt to shield model before setting acl');
    }

    if (!internals.authConfig.length) {
        throw new Error('Attempt to shield model before seting configs');
    }

    // raise shield around Model
    new Shield(Model, internals.acl);
    authConfigs = getAuthConfigs(modelName);
    _.each(authConfigs, Model.shield.addRules, Model.shield);
    internals.models[modelName] = Model;
}

/**
 * set internal models
 * @param {object} models is an object with modelName: Model key pairs
 * @return null
 */
function setModels(models) {
    _.each(models, setModel);
}

/**
 * set internal authConfig
 * @param {array} configs see Shield.js for config example
 * @return null
 */
function setAuthConfig(configs) {
    internals.authConfig = configs;
}

/**
 * set internal ACL
 * @param {object} acl is the ACL object (e.g. relations)
 * @return null
 */
function setAcl(acl) {
    internals.acl = wrapRelations(acl);
}

/**
 * Validate that the all inputs are properly specified
 */
function validate(options) {
    var schema = joi.object().keys({
        config: joi.array().min(_.keys(options.models).length).required(),
        acl: joi.object().required(),
        models: joi.object().required()
    });
    joi.assert(options, schema, 'Invalid Shield Options:');
    return true;
}

/**
 * Main initialization method
 * @param {object} options is an object with keys for:
 *   config: the authConfig detailing rules for each model
 *   models: an object containing modelName: Model key pairs
 *   acl: the Action Control List object containing methods for each context
 * @return {null} the shield internals are private
 */
function init(options) {
    validate(options);
    setAuthConfig(options.config);
    setAcl(options.acl);
    setModels(options.models);
}

module.exports = init;
