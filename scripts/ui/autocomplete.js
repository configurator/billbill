/* global $ ui */

(function () {

    var supplierAutocompleteOptions = {
        autoFocus: true,
        delay: 0,
        source: ui.knownPropertyValues.supplier.values
    };
    $('.autocomplete-supplier').autocomplete(supplierAutocompleteOptions);

    $('.autocomplete-month').focus(function () {
        var select = $(this);
        select.children('option').not(':first').remove();
        for (var key in ui.knownPropertyValues.date.values) {
            select.append($('<option>').text(ui.knownPropertyValues.date.values[key]));
        }
    })

})();
