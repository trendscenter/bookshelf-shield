'use strict';

module.exports = {
    alwaysTrue: function() {
        return Promise.resolve(true);
    },

    alwaysFalse: function() {
        return Promise.resolve(false);
    },

    alwaysError: function() {
        return Promise.reject(new Error('This is a test error'));
    }
};
