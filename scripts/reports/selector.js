/* global $ ui define drive google */
"use strict";

(function () {
    
    var selector = $('.reports .selector'),
        viewer = $('.reports .viewer'),
        graphSelections = viewer.find('.report-selection'),
        lastShownChart = null;
    
    define('ui.reports.showSelector', function () {
        selector.modal('show');
    });
    
    define('ui.reports.clearChart', function () {
        if (lastShownChart) {
            lastShownChart.clearChart();
            lastShownChart = null;
        }
    })
    
    var getSelectorValue = function (name) {
        var result = selector.find('.' + name + ' .value').val();
        if (typeof result != 'string') {
            result = '';
        }
        return result.trim();
    };
    
    var getSelectorFunctions = function () {
        var supplier = getSelectorValue('supplier'),
            itemType = getSelectorValue('itemType'),
            startMonth = Date.parseExact('1/' + getSelectorValue('start-month'), 'd/M/yyyy'),
            endMonth = Date.parseExact('1/' + getSelectorValue('end-month'), 'd/M/yyyy'),
            validators = [];
        
        if (supplier) {
            validators.push(function (item) {
                return item.supplier == supplier;
            });
        }
        
        if (itemType) {
            validators.push(function (item) {
                return item.itemType == itemType;
            });
        }
        
        if (startMonth) {
            validators.push(function (item) {
                var itemDate = item.date && Date.parseExact(item.date, 'dd/MM/yyyy');
                return itemDate && startMonth.compareTo(itemDate) != 1;
            });
        }
        
        if (endMonth) {
            endMonth.addMonths(1);
            validators.push(function (item) {
                var itemDate = item.date && Date.parseExact(item.date, 'dd/MM/yyyy');
                return itemDate && endMonth.compareTo(itemDate) == 1;
            });
        }
        
        return validators;
    };
    
    var passesValidation = function (item, validators) {
        for (var i in validators) {
            if (!validators[i](item)) {
                return false;
            }
        }
        
        return true;
    };
    
    var getItemsForReport = function () {
        var validators = getSelectorFunctions(),
            results = [];
        
        for (var id in drive.properties) {
            var item = drive.properties[id];
            if (passesValidation(item, validators)) {
                results.push(item);
            }
        }
        
        return results;
    };
    
    var getTitleForReport = function (title) {
        var supplier = getSelectorValue('supplier'),
            itemType = getSelectorValue('itemType'),
            startMonth = getSelectorValue('start-month'),
            endMonth = getSelectorValue('end-month');
        
        if (itemType || supplier) {
            title += ' -';
            
            if (itemType) {
                title += ' ' + selector.find('.itemType .value :selected').text();
            }
            if (supplier) {
                title += ' ' + supplier;
            }
        }
        
        if (startMonth || endMonth) {
            if (!startMonth) {
                title += ': עד חודש ' + endMonth;
            } else if (!endMonth) {
                title += ': מחודש ' + startMonth;
            } else {
                title += ': עבור חודשים ' + startMonth + ' - ' + endMonth;
            }
        }
        
        return title;
    };
    
    selector.find('.run-report').click(function () {
        var report = $(this).data('report'),
            runner = ui.reports[report],
            div = graphSelections.filter('.' + report),
            graph = div.find('.graph');
        
        if (!runner || !div.length || !graph.length) {
            console.error('Unknown report selection ' + report);
            return;
        }
        
        viewer.find('.title').text(getTitleForReport($(this).text()));
        
        var items = getItemsForReport();
        
        graphSelections.hide();
        div.show();
        
        var showGraph = function (chartType, dataArray, options) {
            ui.reports.clearChart();
            
            var data = google.visualization.arrayToDataTable(dataArray),
                chart = new google.visualization[chartType](graph[0]);
            
            lastShownChart = chart;
            
            viewer.one('shown.bs.modal', function () {
                options.width = graph.width();
                options.height = viewer.find('.modal-body').height() - viewer.find('.modal-header').outerHeight();
            
                console.log('Drawing a ' + chartType + ' ', dataArray, options);
                chart.draw(data, options || {});
            });
                
            selector.modal('hide');
            viewer.modal('show');
        };
        
        console.log('Running report ' + report + ' ', div[0], items);
        runner(items, showGraph, div);
    });
    
    selector.modal({ show: false });
    viewer.modal({ show: false }).on('hidden.bs.modal', ui.reports.clearChart);
})();
