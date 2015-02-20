'use strict';
module.exports = function(grunt) {
    return {
        all: {
            options: {
                config: '.jscs.json'
            },
            files: {
                src: [
                    'test/**.js',
                    'grunt/**.js',
                    '*.js',
                    'lib/**.js'
                ],
            }
        }
    };
};
