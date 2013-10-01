define(function (require) {
    require.config({
        paths: {
            'google-drive-client': 'https://apis.google.com/js/client.js'
        }
    });
    
    require(['drive'], function () {
        console.log('Everything loaded.');
    });
});