'use strict';
module.exports = function() {
    return {
        files: ['test/unit/*.js', 'test/integration/*.js'],
        options: {
            require: ['test/babelhook.js'],
            harmony: true
        },
        spec: {
            options: {
                reporter: 'spec',
                timeout: 10000
            }
        }
    };
};
