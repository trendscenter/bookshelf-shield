'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var AuthError = require('./error.js');
var Rule = require('./Rule.js');
var _ = require('lodash');
var secureMethods = require('./secureAccessMethods.js');
var protectedMethods = ['fetch', 'fetchAll', 'save', 'destroy'];
var defaultAuthConfig = {
    create: {},
    read: {},
    update: {},
    'delete': {}
};

// helper functions
/**
 * protect method:
 * @return {Promise} a promise that rejects
 */
function protectMethod() {
    return Promise.reject(new Error('Attempt to call protected access method on shielded model'));
}

var Shield = (function () {
    /**
     * @param {bookshelfModel} model
     * @param {object} relations acl object
     * @return {Shield}
     */

    function Shield(Model, acl) {
        _classCallCheck(this, Shield);

        this.Model = Model;
        this.Model.shield = this;
        this.acl = acl;
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
     *          //this can be used to access the acl (relations) property;
     *      }
     *  }
     *}
     */

    _createClass(Shield, [{
        key: 'addRules',
        value: function addRules(_authConfig) {
            var authConfig = _.assign({}, defaultAuthConfig, _authConfig);
            var self = this;

            // we don't want to iterate through the defaults, so remove them
            delete authConfig.defaults;
            _.each(authConfig, function extendAndAddRule(ruleConfig, actionName) {
                // extend each rule in the config with the defaults
                ruleConfig = _.assign(_.cloneDeep(ruleConfig), _authConfig.defaults);

                // add acl to the options
                ruleConfig.acl = self.acl;

                // grab actionName from key
                ruleConfig.actionName = actionName;

                //TODO: validate that ruleConfig options are valid
                if (_.isFunction(ruleConfig.method)) {
                    //custom auth method
                    self.rules.push(new Rule(ruleConfig.actionName, ruleConfig.method));
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
    }, {
        key: 'wrapModel',
        value: function wrapModel() {
            var _this = this;

            _.each(protectedMethods, function (methName) {
                var newMethName = '_' + methName;

                // Store access methods in Shield
                _this[newMethName] = _this.Model.prototype[methName];

                // Override access methods with error-throwing method
                _this.Model.prototype[methName] = protectMethod;
            });

            // Add secure access methods
            _.each(secureMethods, function (method, methName) {
                _this.Model.prototype[methName] = method;
            });

            return this;
        }

        /**
         * get a list of rules that apply to the given actionName
         * @param {string} actionName
         * @return {array} an array of rules that apply
         */
    }, {
        key: 'getApplicableRules',
        value: function getApplicableRules(actionName) {
            var rules = _.filter(this.rules, function (rule) {
                return rule.isApplicable(actionName);
            });

            if (!rules.length) {
                throw new AuthError('No rules found for ' + actionName);
            }

            return rules;
        }
    }]);

    return Shield;
})();

module.exports = Shield;