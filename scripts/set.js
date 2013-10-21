/* global define */

(function () {
    var Set = function (args) {
        if (args) {
            if (args instanceof Array) {
                this.values = args;
            } else {
                throw new Error('Invalid value for Set constructor.');
            }
        } else {
            this.values = [];
        }
    };
    
    Set.prototype.add = function (value) {
        if (!this.has(value)) {
            this.values.push(value);
            this.values.sort();
        }
    };
    
    Set.prototype.remove = function (value) {
        var index = this.values.indexOf(value);
        if (index != -1) {
            this.splice(index, 1);
        }
    };
    
    Set.prototype.has = function (value) {
        return this.values.indexOf(value) != -1;
    };
    
    
    define('Set', function (args) { return new Set(args); });
})();