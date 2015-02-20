'use strict';

var config = require('config');

console.log('this is the value of a required config option: `%s`', config.get('required'));

if (config.has('optional')) {
    console.log('this is the value of an optional config option: `%s`', config.get('optional'));
} else {
    console.log('no optional config option set');
}

