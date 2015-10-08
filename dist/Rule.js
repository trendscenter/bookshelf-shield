'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var AuthError = require('./error.js');
var joi = require('joi');
/**
 * validate options sent to buildGeneric
 * @param {object} options is the options to validate
 * @return {boolean} true, otherwise throw error
 */
function validate(options) {
    var schema = joi.object().keys({
        actionName: joi.string().required(),
        authKey: joi.string().required(),
        modelName: joi.string().required(),
        acl: joi.object(),
        aclContextName: joi.string().required()
    });
    var errorMsg = 'Invalid rule options: ';
    var aclContext = options.acl[options.aclContextName];
    joi.assert(options, schema, errorMsg);
    joi.assert(aclContext, joi.func().required(), errorMsg);
    return true;
}

var Rule = (function () {
    /**
     * @param {string} action is the action for which this rule applies
     * @param {function} method is the function to test the rule.
     *  the function should have signature below, and return a promise
     *  if the promise rejects, then access will be deined
     *  if the rule resolves to false
     *     access will be allowed if another rule resolves to true
     *  if the rule resolves to rue,
     *      access will be allowed unless another rule throws an error
     *  function(user){
     *      //`this` is the model in question
     *      //`shield` can be accessed through this.constructor.shield
     *      //`acl` can be accessed through shield.getAcl('aclContextName')
     *  }
     */

    function Rule(config) {
        _classCallCheck(this, Rule);

        this.action = config.actionName;
        this.method = config.method;
        this.config = config;
    }

    /**
     * test whether rull applies to an action
     * @param {string} action
     * @return {boolean}
     */

    _createClass(Rule, [{
        key: 'isApplicable',
        value: function isApplicable(action) {
            return this.action === action;
        }

        /**
         * apply the rule to a model and user
         * @param {object} model is an instance of a bookshelfModel
         * @param {user} is the user credentials object
         */
    }, {
        key: 'applyTo',
        value: function applyTo(model, user) {
            //TODO: check for super here??
            return this.method.call(model, user);
        }

        /**
         * static rule builder for generic auth
         * @param {object} options is an object with keys:
         * action: the name of the action to be protected
         * modelName: the name of the model to be protected
         * ('action_modelName' should match relation rules)
         * aclContext: the relations context in which permissions should be checked
         * authKey: the property of the model which is upon which access is limited
         */
    }], [{
        key: 'buildGeneric',
        value: function buildGeneric(options) {
            var permissionName = undefined;
            var aclContextName = undefined;
            var method = undefined;

            // validate options: will throw error if invalid
            validate(options);

            permissionName = options.actionName + '_' + options.modelName;
            aclContextName = options.aclContextName;
            method = function genericAuthMethod(user) {
                var authVal = this.get(options.authKey);
                var aclQuestion = 'can ' + user.username + ' ' + permissionName + ' from ' + authVal;
                var aclContext = options.acl[aclContextName];

                //TODO: optimize to cache perms instead of loading from redis
                return aclContext(aclQuestion).then(function checkAuth(allow) {
                    var errorMsg = undefined;
                    if (allow) {
                        return allow;
                    }

                    errorMsg = [user.username, 'cannot', permissionName.replace('_', ' '), 'in', options.authKey, '`' + authVal + '`'].join(' ');
                    throw new AuthError(errorMsg);
                });
            };

            options.method = method;

            return new Rule(options);
        }
    }]);

    return Rule;
})();

module.exports = Rule;