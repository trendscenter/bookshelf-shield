'use strict';
module.exports = function() {
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
                ]
            }
        }
    };
};
