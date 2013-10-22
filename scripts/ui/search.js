/* global $ ui */

(function () {
    var searchControls = $('.content .actions .search');

    var search = function () {
        var month = searchControls.filter('.by-month').val();
        var supplier = (searchControls.filter('.by-supplier').val() || '').trim();

        $('.content .file-list').children().each(function () {
            var line = $(this),
                properties = line.data('props');

            line.show();

            if (month && month != Set.MonthSet.normalize(properties.date)) {
                line.hide();
            }

            if (supplier && properties.supplier && properties.supplier.indexOf(supplier) == -1) {
                line.hide();
            }
        });
    };

    searchControls.on('change keypress autocompletefocus autocompleteresponse autocompleteselect autocompleteclose', search);
})();
