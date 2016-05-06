'use strict';
module.exports = function() {
    return {
        files: ['test/unit/*.js', 'test/integration/*.js'],
        spec: {
            options: {
                reporter: 'spec',
                timeout: 10000
            }
        }
    };
};
