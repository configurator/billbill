/* global $ ui */

(function () {

    var supplierAutocompleteOptions = {
        autoFocus: true,
        delay: 0,
        source: ui.knownPropertyValues.supplier.values,
        change: ui.item.inputFieldValueChanged
    };
    $('.item .control.supplier .value').autocomplete(supplierAutocompleteOptions);
    $('.content .actions .search.by-supplier').autocomplete(supplierAutocompleteOptions);
    
    $('.content .actions .search.by-date').focus(function () {
        var select = $('.content .actions .search.by-date');
        select.children('option').not(':first').remove();
        for (var key in ui.knownPropertyValues.date.values) {
            select.append($('<option>').text(ui.knownPropertyValues.date.values[key]));
        }
    })

})();
