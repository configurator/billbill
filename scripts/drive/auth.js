define(['./client_secrets', 'ui/main'], function (secrets, ui) {
    var client_id = secrets.web.client_id,
        scopes = [
            'https://www.googleapis.com/auth/drive'
        ],
        authorization = null;
    
    var attemptAuthorization = function (immediate) {
        gapi.auth.authorize(
                {
                    'client_id': client_id,
                    'scope': scopes,
                    'immediate': immediate
                },
                function (result) {
                    console.log('Google auth result: ', result);
                    
                    if (result && !result.error) {
                        console.log('Google Drive authorization successful.');
                        ui.googleDriveAuthorizationSuccess();
                    } else if (immediate) {
                        console.log('Retrying authorization without immediacy');
                    } else {
                        console.error("Couldn't authorize with the Google Drive API.");
                        ui.googleDriveAuthorizationFailed();
                    }
                }
            );
    };
    
    return {
        authorize: function () {
            attemptAuthorization(true);
        }
    };
});