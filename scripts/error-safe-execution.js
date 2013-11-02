/* global define gapi */

(function () {
    var maxRetryCount = 2;
    
    define('registerErrorSafeExecution', function () {
        var dummyRequest = gapi.client.drive.files.list({}),
            prototype = dummyRequest.constructor.prototype;
            
        var tryAgain = function (callback, request, args) {
            if (request.failureCount > maxRetryCount) {
                return showUiError(callback, request, args);
            } else {
                return setTimeout(function() {
                    return request.safeExecute(callback);
                }, 100);
            }
        };
        
        var showUiError = function (callback, request, args) {
            var retry = function () {
                return request.safeExecute(callback);
            };
            
            var cancel = function () {
                return callback.apply(window, args);
            };
            
            ui.showDriveError(args[0], request.failureCount, retry, cancel);
        };
        
        prototype.safeExecute = function (callback) {
            var request = this;
            this.execute(function (result) {
                // Normal execution path
                if (result && !result.error) {
                    return callback.apply(window, arguments);
                }
                
                // Increase failure count
                request.failureCount = (request.failureCount || 0) + 1;
                
                // Error handling
                if (!result || !result.error.code) {
                    // Unknown error - try again automatically
                    return tryAgain(callback, request, arguments);
                } else if (result.error.code >= 500 && result.error.code < 600) {
                    // Server error - try again automatically
                    return tryAgain(callback, request, arguments);
                } else {
                    // In this case, the error is probably in the request or exogenous. No point in trying again.
                    return showUiError(callback, request, arguments);
                }
            })
        };
    });
    
})();
