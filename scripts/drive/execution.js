/* global define gapi */

(function () {
    var maxRetryCount = 2;

    var showUiError = function (callback, request, args) {
        var retry = function () {
            return request.safeExecute(callback);
        };
        
        var cancel = function () {
            return callback.apply(window, args);
        };
        
        ui.showDriveError(args[0], request.failureCount, retry, cancel);
    };
    
    define('registerErrorSafeExecution', function () {
        var dummyRequest = gapi.client.drive.files.list({}),
            prototype = dummyRequest.constructor.prototype,
            batch = null;
            
        var safer = function (f) {
            var tryAgain = function (callback, request, args) {
                if (request.failureCount > maxRetryCount) {
                    return showUiError(callback, request, args);
                } else {
                    return setTimeout(function() {
                            return exec.call(request, callback);
                    }, 100);
                }
            };
            
            var exec = function (callback) {
                this[f](function (result) {
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
                });
            };
            
            return exec;
        };
        
        prototype.batch = function (callback) {
            batch = batch || gapi.client.newRpcBatch();
            batch.add(this, {
                callback: callback
            });
            
            setTimeout(executeAllBatchRequests, 10);
        };

        prototype.safeExecute = safer('execute');
        prototype.safeBatch = safer('batch');
        
        var executeAllBatchRequests = function () {
            if (batch) {
                console.log('Executing batch request for ' + (batch.B && batch.B.length || '(unknown)') + ' request(s) ', batch);
                batch.execute();
                batch = null;
            }
        };
    });
    
})();
