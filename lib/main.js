'use strict';

require('babel/register');
const Shield = require('./Shield.js');
const wrapRelations = require('./wrapRelations.js');
const _ = require('lodash');
const internals = {
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
    let authConfigs;
    if (!internals.acl) {
        throw new Error('Attempt to shield model before setting acl');
    }

    if (!internals.authConfig.length) {
        throw new Error('Attempt to shield model before seting configs');
    }

    Model.shield = new Shield(Model, internals.acl);
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
function validate() {
    // TODO: Flush out validation
    /*
    const modelCount = internals.models.length;
    const schema = joi.object().keys({
        authConfig: joi.array().min(modelCount).items(joi.object().keys({
            defaults: joi.object().keys({
                modelName: joi.string(),
                aclContextName: joi.string(),
                authKey: joi.string()
            })
    */
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
    setAuthConfig(options.config);
    setAcl(options.acl);
    setModels(options.models);
    validate();
}

module.exports = init;
