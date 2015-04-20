'use strict';

module.exports = {
    defaults: {
        modelName: 'Study',
        authKey: 'id',
        aclContextName: 'study'
    },
    create: {
        authKey: 'siteId',
        aclContextName: 'site',
        method: function validateSiteAdmin(user) {
            const siteId = this.get('siteId');
            const Model = this.constructor;
            const aclContext = Model.shield.acl.site;
            const aclQuestion = 'can ' +
                user.username +
                ' create_Study from ' +
                siteId;

            if (!siteId) {
                return Promise.reject(
                    new Error('Study has no valide siteId')
                );
            }

            return aclContext(aclQuestion).then(function checkAuth(allow) {
                let errorMsg;
                if (allow) {
                    return allow;
                }

                errorMsg =
                    user.username +
                    ' cannot create studies in Site ' +
                    siteId;
                throw new Error(errorMsg);
            });
        }
    }
};

