define(['client_secrets.json', 'google-drive-client'], function (secrets) {
    var client_id = secrets.web.client_id,
        scopes = [
            'https://www.googleapis.com/auth/drive'
        ]
    
    return {
        authorize: function () {
            gapi.auth.authorize(
                {
                    'client_id': client_id,
                    'scope': scopes,
                    'immediate': true
                },
                function (result) {
                    console.log('Google auth result: ', result);
                    if (result && !result.error) {
                        console.log('Google Drive authorization successful.');
                    }
                }
            );
        }
    };
});