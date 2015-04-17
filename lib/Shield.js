'use strict';

const AuthError = require('./error.js');
const Rule = require('./Rule.js');
const _ = require('lodash');
const secureMethods = require('./secureAccessMethods.js');
const defaultAuthConfig = {
    create: {},
    read: {},
    update: {},
    delete: {}
};

// helper functions
/**
 * protect method:
 * @return {Promise} a promise that rejects
 */
function protectMethod() {
    return Promise.reject(
        new Error('Attempt to call protected access method on shielded model')
    );
}

class Shield {
    /**
     * @param {bookshelfModel} model
     * @param {object} relations acl object
     * @return {Shield}
     */
    constructor(Model, relations) {
        this.Model = Model;
        this.relations = relations;
        this.rules = [];
        this.wrapModel();
    }

    /**
     * add rules to the current shield using a config
     * @param {object} authConfig is an object of the following form
     * @return {Shield}
     * {
     *  defaults: {
     *      modelName: 'Study', // model that config is intended for
     *      aclContextName: 'study', //context in which to check permissions
     *      authKey: 'studyId' //model-property to check permissions against
     *  },
     *  read: {
     *      aclContextName: 'site', //optional: will override default above
     *      authkey: 'siteId', //optional: will override default above
     *      method: function(user, shield) { //optional
     *          //should return a promise that resolves to true or false;
     *          //this refers to the current model
     *          //user is the credentials for the user accessing the model
     *          //shield is the shield object on the model's constructor:
     *          //this can be used to access the relations property;
     *      }
     *  }
     *}
     */
    addRules(_authConfig) {
        const authConfig = _.extend(defaultAuthConfig, _.clone(_authConfig));
        const self = this;

        // we don't want to iterate through the defaults, so remove them
        delete(authConfig.defaults);
        _.each(authConfig, function extendAndAddRule(ruleConfig, actionName) {
            // extend each rule in the config with the defaults
            ruleConfig = _.extend(
                _authConfig.defaults,
                _.cloneDeep(ruleConfig)
            );

            // grab actionName from key
            ruleConfig.actionName = actionName;

            //TODO: validate that the permissionName is set in the acl context.
            //TODO: validate that ruleConfig options are valid
            if (_.isFunction(ruleConfig.method)) {
                //custom auth method
                self.rules.push(
                    new Rule(ruleConfig.actionName, ruleConfig.method)
                );
            } else {
                self.rules.push(Rule.buildGeneric(ruleConfig));
            }
        });

        return this;
    }

    /**
     * override the Model's prototype methods for DB access
     * @return {this}
     */
    wrapModel() {
        // Store access methods in Shield
        this._fetch = this.Model.prototype.fetch;
        this._fetchAll = this.Model.prototype.fetchAll;
        this._save = this.Model.prototype.save;
        this._destroy = this.Model.prototype.destroy;

        // Add secure access methods
        this.Model.prototype.read = secureMethods.read;
        this.Model.prototype.readAll = secureMethods.readAll;
        this.Model.prototype.create = secureMethods.create;
        this.Model.prototype.update = secureMethods.update;
        this.Model.prototype.delete = secureMethods.delete;

        // Override access methods with error-throwing method
        this.Model.prototype.save = protectMethod;
        this.Model.prototype.fetch = protectMethod;
        this.Model.prototype.fetchAll = protectMethod;
        this.Model.prototype.destroy = protectMethod;
        return this;
    }

    /**
     * get a list of rules that apply to the given actionName
     * @param {string} actionName
     * @return {array} an array of rules that apply
     */
    getApplicableRules(actionName) {
        const rules = _.filter(this.rules, rule => {
            return rule.isApplicable(actionName);
        });

        if (!rules.length) {
            throw new AuthError('No rules found for ' + actionName);
        }
    }
}

module.exports = Shield;
