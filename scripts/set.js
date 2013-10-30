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
    
    Set.prototype.sort = function () {
        this.values.sort();
    };
    
    Set.prototype.add = function (value) {
        if (this.normalize) {
            value = this.normalize(value);
        }
        
        if (!this.has(value)) {
            this.values.push(value);
            this.sort();
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
    
    MonthSet.monthComparer = function (a, b) {
        a = a || '-';
        b = b || '-';

        if (a == b) {
            return 0;
        }

        if (a == '-') {
            return -1;
        } else if (b == '-') {
            return 1;
        }

        var ya = parseInt(a.substring(3), 10),
            yb = parseInt(b.substring(3), 10),
            ma = parseInt(a.substring(0, 2), 10),
            mb = parseInt(b.substring(0, 2), 10);

        if (ya != yb) {
            return ya - yb;
        } else {
            return ma - mb;
        }
    };
    
    MonthSet.prototype.sort = function () {
        this.values.sort(MonthSet.monthComparer);
    };
    
    define('Set', function (args) { return new Set(args); });
    define('Set.MonthSet', function (args) { return new MonthSet(args); });
    define('Set.MonthSet.normalize', MonthSet.prototype.normalize);
    define('Set.MonthSet.monthComparer', MonthSet.monthComparer)
})();
