'use strict';

const AuthError = require('./error.js');
const _ = require('lodash');
const joi = require('joi');
/**
 * validate options sent to buildGeneric
 * @param {object} options is the options to validate
 * @return {boolean} true, otherwise throw error
 */
function validate(options) {
    const schema = joi.object().keys({
        actionName: joi.string().required(),
        authKey: joi.string().required(),
        modelName: joi.string().required(),
        acl: joi.object(),
        aclContextName: joi.string().required()
    });
    const errorMsg = 'Invalid rule options: ';
    const aclContext = options.acl[options.aclContextName];
    joi.assert(options, schema, errorMsg);
    joi.assert(aclContext, joi.func().required(), errorMsg);
    return true;
}

class Rule {
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
    constructor(action, method) {
        this.action = action;
        this.method = method;
    }

    /**
     * test whether rull applies to an action
     * @param {string} action
     * @return {boolean}
     */
    isApplicable(action) {
        return this.action === action;
    }

    /**
     * apply the rule to a model and user
     * @param {object} model is an instance of a bookshelfModel
     * @param {user} is the user credentials object
     */
    applyTo(model, user) {
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
    static buildGeneric(options) {
        let permissionName;
        let aclContextName;
        let method;

        // validate options: will throw error if invalid
        validate(options);

        permissionName = options.actionName + '_' + options.modelName;
        aclContextName = options.aclContextName;
        method = function genericAuthMethod(user) {
            const authVal = this.get(options.authKey);
            const aclQuestion = 'can ${user.username} ${options.actionName} ' +
                'from ${authVal}';
            const aclContext = options.acl[aclContextName];

            //TODO: optimize to cache perms instead of loading from redis
            return aclContext(aclQuestion).then(function checkAuth(allow) {
                let errorMsg;
                if (allow) {
                    return allow;
                }

                errorMsg = [
                    user.username,
                    'cannot',
                    _.startCase(options.actionName),
                    'in',
                    options.authKey,
                    '`',
                    authVal,
                    '`'
                ].join(' ');
                throw new AuthError(errorMsg);
            });
        };

        return new Rule(options.actionName, method);
    }
}

module.exports = Rule;
