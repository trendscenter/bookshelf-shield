'use strict';

//TODO: delete rule.js

const AuthError = require('./error.js');
const _ = require('lodash');

class Rule {
    constructor(action, method) {
        this.action = action;
        this.method = method;
    }

    isApplicable(action) {
        return this.action === action;
    }

    apply(model, user) {
        //TODO: check for super here??
        return this.method.bind(model, user);
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

        //TODO: validate that required options are present
        permissionName = options.actionName + '_' + options.modelName;
        aclContextName = options.aclContextName;

        //TODO: throw error if aclContext is undefined
        method = function genericAuthMethod(user, shield) {
            const authObj = this.get(options.authKey);
            const aclQuestion = 'can ' +
                user.username +
                ' ' +
                options.actionName +
                ' from ' +
                authObj;
            const aclContext = shield.relations[aclContextName];

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
                    authObj,
                    '`'
                ].join(' ');
                throw new AuthError(errorMsg);
            });
        };

        return new Rule(options.action, method);
    }
}

module.exports = Rule;
