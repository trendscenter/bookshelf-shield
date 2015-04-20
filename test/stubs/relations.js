'use strict';

module.exports = {
    alwaysTrue: () => Promise.resolve(true),
    alwaysFalse: () => Promise.resolve(false),
    alwaysError: () => Promise.reject(new Error('This is a test error')),
    identity: str => Promise.resolve(str)
};
