/* global define */

(function () {
    var Set = function (args) {
        this.values = [];
        if (args) {
            if (args instanceof Array) {
                for (var i = 0; i < args.length; i++) {
                    this.add(args[i]);
                }
            } else {
                throw new Error('Invalid value for Set constructor.');
            }
        }
    };
    
    Set.prototype.add = function (value) {
        if (this.normalize) {
            value = this.normalize(value);
        }
        
        if (!this.has(value)) {
            this.values.push(value);
            this.values.sort();
        }
    };
    
    Set.prototype.remove = function (value) {
        if (this.normalize) {
            value = this.normalize(value);
        }
        
        var index = this.values.indexOf(value);
        if (index != -1) {
            this.splice(index, 1);
        }
    };
    
    Set.prototype.has = function (value) {
        if (this.normalize) {
            value = this.normalize(value);
        }
        
        return this.values.indexOf(value) != -1;
    };
    
    var MonthSet = function () {
        Set.apply(this, arguments);
    };
    
    MonthSet.prototype = new Set();
    
    var monthSetNormalizedValue = /^\d{2}\/\d{4}/;
    MonthSet.prototype.normalize = function (value) {
        if (monthSetNormalizedValue.test(value)) {
            return value;
        }
        
        var date = Date.parseExact(value, 'dd/MM/yyyy');
        return date ? date.toString('MM/yyyy') : '-';
    };
    
    
    define('Set', function (args) { return new Set(args); });
    define('Set.MonthSet', function (args) { return new MonthSet(args); });
})();