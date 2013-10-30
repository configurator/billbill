/* global $ ui reports define */
"use strict";

(function () {
    define('ui.reports.totalBySupplier', function (items, showGraph) {
        // Calculate the values
        var data = {};
        for (var i in items) {
            var item = items[i];
            data[item.supplier] = data[item.supplier] || 0;
            data[item.supplier] += parseFloat(item.totalAmount);
        }
        
        // Give the values the right shape for PieChart to understand, and sort them
        var result = [];
        for (var key in data) {
            result.push([key, data[key]]);
        }
        result.sort(function (a, b) {
            if (a[1] > b[1]) {
                return 1;
            } else if (a[1] < b[1]) {
                return -1;
            } else {
                return 0;
            }
        })
        result.unshift(['ספק', 'סה"כ']);
        
        // This makes the pie chart a little prettier
        var slices = {};
        for (var i = 0; i < result.length; i++) {
            slices[i] = { offset: 0.1 }
        };
        
        // Show the chart
        showGraph('PieChart', result, {
            legend: {
                position: 'top',
                maxLines: 4
            },
            is3D: true,
            pieHole: 0.2,
            slices: slices,
            reverseCategories: true
        });
    });
})();
