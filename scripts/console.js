define(['jquery'], function ($) {
    var colors = {
        log: '#000000',
        warn: '#cc9900',
        error: '#cc0000'
    };
    
    var log = $('#log');
    
    if (!console) {
        console = {};
    }
    for (var name in colors) {
        var func = console[name] || function () {};
        
        console[name] = function () {
            func.apply(console, arguments);

            var line = $('<div>');
            log.append(line);
            for (var i = 0; i < arguments.length; i++) {
                var section = $('<span>');
                section.text(arguments[i]);
                line.append(section);
                line.css('color', colors[name]);
            }
        };
    }
    return console;
});
