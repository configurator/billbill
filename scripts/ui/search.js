/* global $ ui */

(function () {
    var searchControls = $('.content .actions .search');

    var searchBy = function (prop) {
        var value = (searchControls.filter('.by-' + prop).val() || '').trim();

        $('.content .file-list .by-' + prop).each(function () {
            var $this = $(this);

            if (value && $this.data(prop).indexOf(value) == -1) {
                $this.hide();
            } else {
                $this.show();
            }
        });
    }

    var search = function () {
        searchBy('month');
        searchBy('supplier');

        $('.content .file-list .by-month:visible, .content .file-list .by-supplier:visible').each(function () {
            var $this = $(this);
            if (!$this.find('.file-row:visible').length) {
                $this.hide();
            }
        });
    };

    searchControls.on('change keypress autocompletefocus autocompleteresponse autocompleteselect autocompleteclose', search);
})();
