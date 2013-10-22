/* global $ ui */

(function () {
    var searchControls = $('.content .actions .search');

    var searchBy = function (prop) {
        var value = (searchControls.filter('.by-' + prop).val() || '').trim();

        $('.content .file-list .by-' + prop).each(function () {
            var $this = $(this);

            if (value && value != $this.data(prop)) {
                $this.hide();
            } else {
                $this.show();
            }
        });
    }

    var search = function () {
        searchBy('month');
        searchBy('supplier');
    };

    searchControls.on('change keypress autocompletefocus autocompleteresponse autocompleteselect autocompleteclose', search);
})();
