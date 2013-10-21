/* global define ui drive gapi */
'use strict';

(function () {
    define('main_loaded', function () {
        gapi.client.load('drive', 'v2', function () {
            gapi.load('picker', { 'callback': function () {
                ui.finishedLoading();
                drive.auth.authorize();
            }});
        });
    });
    define('main', {
        googleDriveAuthorized: function () {
            drive.findParentFolder();
        },
        
        parentFoldersFound: function () {
            ui.parentFolderFound();
            drive.listFiles();
        }
    });
})();
