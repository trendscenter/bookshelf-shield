'use strict';
module.exports = {
    defaults: {
        modelName: 'test',
        aclContextName: 'alwaysTrue',
        authKey: 'testKey'
    },
    create: {
        aclContextName: 'alwaysFalse',
        authKey: 'overriddenTestKey'
    }
};
