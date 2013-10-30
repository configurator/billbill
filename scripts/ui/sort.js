/* global $ */

(function () {
    $.fn.sort = function (property, comparer, reverse) {
        reverse = reverse ? -1 : 1;

        comparer = comparer || function (a, b) {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            } else {
                return 0;
            }
        };

        var getterComparer = function (a, b) {
            a = $(a).data(property);
            b = $(b).data(property);

            return comparer(a, b) * reverse;
        };

        $(this).parent().each(function () {
            var $this = $(this),
                children = $this.children(),
                ordered = Array.prototype.sort.call(children, getterComparer);

            for (var i = 0; i < ordered.length; i++) {
                $this.append(ordered[i]);
            }
        });
    };

    var sortRequired = false;

    define('ui.sort', function () {
        sortRequired = true;

        setTimeout(function() {
            if (!sortRequired) {
                return;
            }
            sortRequired = false;

            $('.file-list .by-date').sort('date', Set.MonthSet.monthComparer, true);
            $('.file-list .by-supplier').sort('supplier');
        }, 100);
    });
})();
