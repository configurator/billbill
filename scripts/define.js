/* global $ */
'use strict';

(function (global) {
    
    // Accepts an array defining the dotted name of a global value, and sets that global value to whatever is returned from this function.
    // If the value already exists, the results are combined.
    var define = function (names, value) {
        if (typeof names == 'string') {
            names = names.split('.');
        } else if (names instanceof Array) {
            names = names.slice();
        } else {
            throw new Error('Unknown type for define: ' + names);
        }
        
        if (names.length < 1) {
            throw new Error('Cannot define without a given name');
        }
        
        var container = global;
        var name = names.shift();
        while (names.length) {
            container = container[name] = container[name] || {};
            name = names.shift();
        }
        
        container[name] = combine(container[name], value);
    };
 
    var combine = function (left, right) {
        if (!left) {
            return right;
        }
        if (!right) {
            return left;
        }
        
        if (right instanceof Function) {
            return $.extend(right, left);
        } else {
            return $.extend(left, right);
        }
    };
    
    global.define = define;
})(window);
