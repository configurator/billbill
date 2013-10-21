/* global define gapi */

(function () {
    var maxRetryCount = 2;
    
    define('registerErrorSafeExecution', function () {
        var dummyRequest = gapi.client.drive.files.list({}),
            prototype = dummyRequest.constructor.prototype;
            
        var tryAgain = function (callback, request, args) {
            request.failureCount = ++request.failureCount || 1;
            if (request.failureCount > maxRetryCount) {
                return callback.apply(window, args);
            } else {
                return setTimeout(function() {
                    return request.safeExecute(callback);
                }, 100);
            }
        };
            
        prototype.safeExecute = function (callback) {
            var request = this;
            this.execute(function (result) {
                // Normal execution path
                if (result && !result.error) {
                    return callback.apply(this, arguments);
                }
                
                // Error handling
                if (!result || !result.error.code) {
                    // Unknown error - try again
                    return tryAgain(callback, request, arguments);
                } else if (result.error.code >= 500 && result.error.code < 600) {
                    // Server error - try again
                    return tryAgain(callback, request, arguments);
                } else {
                    // In this case, the error is probably in the request or exogenous. No point in trying again.
                    return callback.apply(this, arguments);
                }
            })
        };
    });
    
})();