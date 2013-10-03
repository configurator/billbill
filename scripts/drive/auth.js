define(['./client_secrets', 'ui/ui'], function (secrets, ui) {
    var client_id = secrets.web.client_id,
        scopes = [
            'https://www.googleapis.com/auth/drive'
        ],
        authorization = null;
    
    var attemptAuthorization = function (immediate) {
        console.log('Authorizing with Google Drive.')
        gapi.auth.authorize(
                {
                    'client_id': client_id,
                    'scope': scopes,
                    'immediate': immediate
                },
                function (result) {
                    console.info('Google auth result: ', result);
                    
                    if (result && !result.error) {
                        console.log('Google Drive authorization successful.');
                        ui.googleDriveAuthorizationSuccess();
                        require(['main'], function (main) { main.googleDriveAuthorized() });
                    } else if (immediate) {
                        console.log('Retrying authorization without immediacy');
                        attemptAuthorization(false);
                    } else {
                        console.error("Couldn't authorize with the Google Drive API.");
                        ui.googleDriveAuthorizationFailed();
                    }
                }
            );
    };
    
    return {
        authorize: function (force) {
            attemptAuthorization(!force);
        }
    };
});