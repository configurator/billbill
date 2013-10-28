/* global define ui drive gapi google registerErrorSafeExecution */
'use strict';

(function () {
    define('main_loaded', function () {
        gapi.client.load('drive', 'v2', function () {
            registerErrorSafeExecution();

            gapi.load('picker', { 'callback': function () {
                google.load("visualization", "1", {
                    packages: [
                        "corechart"
                    ],
                    callback: function () {
                        ui.googleDriveAuthorizationAttempted();
                        
                        drive.auth.authorize();
                    }
                });
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
        },
        
        filesListed: function () {
            ui.finishedLoading();
        }
    });
})();
