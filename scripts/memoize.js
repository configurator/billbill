'use strict';

window.memoize = function (f) {
    var ran = false, result;
    return function () {
        if (!ran) {
            result = f.apply(this, arguments);
            ran = true;
            f = undefined;
        }
        return result;
    };
};