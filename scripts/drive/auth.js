/* global define gapi secrets ui main */
'use strict';

(function () {

    var client_id = secrets.web.client_id,
        scopes = [
            'https://www.googleapis.com/auth/drive'
        ];
    
    var attemptAuthorization = function (force) {
        console.log('Authorizing with Google Drive.');
        gapi.auth.authorize(
                {
                    'client_id': client_id,
                    'scope': scopes,
                    'immediate': force
                },
                function (result) {
                    console.info('Google auth result: ', result);
                    
                    if (result && !result.error) {
                        console.log('Google Drive authorization successful.');
                        ui.googleDriveAuthorizationSuccess();
                        main.googleDriveAuthorized();
                    } else if (!force) {
                        console.log('Retrying authorization without immediacy');
                        attemptAuthorization(true);
                    } else {
                        console.error("Couldn't authorize with the Google Drive API.");
                        ui.googleDriveAuthorizationFailed();
                    }
                }
            );
    };
    
    define('drive.auth.authorize', function (force) {
        attemptAuthorization(!force);
    });

})();
