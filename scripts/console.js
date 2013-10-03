define(['jquery'], function ($) {
    var stringify = function (x) {
        try {
            if (typeof x != 'object'
                || x instanceof String
                || x instanceof Number) {
                    return x.toString();
            }
    
            if (x instanceof Array) {
                return '[' +
                    x.map(stringify).join(', ') +
                    ']';
            }
            
            if (x.length
                && x.length >= 0
                && x.length == Math.floor(x.length)) {
                    return stringify(Array.prototype.slice.call(x));
            }
            
            if (x instanceof HTMLElement) {
                return '<' + x.tagName + ' ...>';
            }
        
            return JSON.stringify(x);
        } catch (e) {
            try {
                return '' + x;
            } catch (e) {
                try {
                    var result = '{';
                    for (var prop in x) {
                        result += '\n' + prop + ': ' + x[prop] + ',';
                    }
                    return result + '\n}';
                } catch (e) {
                    return '(unprintable)';
                }
            }
        }
    };
    
    var colors = {
        info: '#666666',
        log: '#000000',
        warn: '#cc9900',
        error: '#cc0000'
    };
    
    var log = $('#log');
    
    if (!console) {
        console = {};
    }
    for (var name in colors) {
        console[name] = (function (original, color) {
            return function () {
                original.apply(console, arguments);
    
                var line = $('<div>');
                log.append(line);
                for (var i = 0; i < arguments.length; i++) {
                    var section = $('<span>');
                    section.text(stringify(arguments[i]));
                    line.append(section);
                    line.css('color', color);
                }
                
                // Scroll log to bottom
                log.scrollTop(log.prop('scrollHeight'))
            };
        })(console[name] || function() {}, colors[name]);
    }
    return console;
});
