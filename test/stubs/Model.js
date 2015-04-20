'use strict';

function extend() {
    function Model() {
        this.modelType = 'testBase';
        this.get = () => 'testVal';
    }

    Model.prototype.fetch = cb => cb();
    Model.prototype.fetchAll = cb => cb();
    Model.prototype.save = cb => cb();
    Model.prototype.destroy = cb => cb();

    return Model;
}

module.exports.extend = extend;
