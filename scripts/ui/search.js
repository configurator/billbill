/* global $ ui */

(function () {
    var searchControls = $('.content .actions .search');

    var searchBy = function (prop, compare) {
        var value = (searchControls.filter('.by-' + prop).val() || '').trim();

        if (value) {
            $('.content .file-row').each(function () {
                var $this = $(this),
                    props = $this.data('props'),
                    propValue = props && props[prop];
    
                if (!compare(propValue, value)) {
                    $this.hide();
                }
            });
        }
    };
    
    var searchComparers = {
        equals: function (value, searchString) {
            return value == searchString;
        },
        
        indexOf: function (value, searchString) {
            if (typeof value != 'string') {
                return false;
            }
            
            return value.indexOf(searchString) != -1;
        },
        
        month: function (value, searchString) {
            return Set.MonthSet.normalize(value) == searchString;
        }
    };

    var search = function () {
        $('.content .file-row').show();
        
        searchBy('date', searchComparers.month);
        searchBy('supplier', searchComparers.indexOf);
        searchBy('itemType', searchComparers.equals);

        $('.content .file-list .file-list-sublist')
            .show()
            .each(function () {
                var $this = $(this);
                if (!$this.find('.file-row:visible').length) {
                    $this.hide();
                }
            });

        ui.updateTotals();
    };

    searchControls.on('change keypress autocompletefocus autocompleteresponse autocompleteselect autocompleteclose', search);
})();
