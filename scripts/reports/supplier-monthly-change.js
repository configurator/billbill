/* global $ ui reports define */
"use strict";

(function () {
    define('ui.reports.supplierMonthlyChange', function (items, showGraph) {
        // Calculate the values
        var data = {},
            months = Set.MonthSet();
            
        for (var i in items) {
            var item = items[i]
                month = Set.MonthSet.normalize(item.date);
            
            if (!item.supplier || month == '-' || !item.totalAmount) {
                continue;
            }
            
            var datum = data[item.supplier] = data[item.supplier] || {};
            
            datum[month] = (datum[month] || 0) + parseFloat(item.totalAmount);
            months.add(month);
        }
        
        // Give the values the right shape for LineChart to understand, and sort them
        var result = [];
        for (var i in months.values) {
            var month = months.values[i],
                monthLine = [month];
            for (var supplier in data) {
                monthLine.push(data[supplier][month] || null)
            }
            result.push(monthLine);
        }
        var titleLine = ['חודש'];
        for (var supplier in data) {
            titleLine.push(supplier);
        }
        result.unshift(titleLine);
        
        // Show the chart
        showGraph('LineChart', result, {
            focusTarget: 'category',
            legend: {
                position: 'top',
                maxLines: 4
            },
            
            pointSize: 5,
            
            reverseCategories: true,
            hAxis: {
            },
            vAxis: {
                logScale: true
            }
        });
    });
})();
