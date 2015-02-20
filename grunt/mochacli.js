'use strict';
module.exports = function(grunt) {
    return {
        options: {
            files: 'test/*_test.js'
        },
        spec: {
            options: {
                reporter: 'spec',
                timeout: 10000
            }
        }
    };
};
