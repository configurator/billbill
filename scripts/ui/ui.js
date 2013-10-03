define(['require', 'jquery', 'jqueryui'], function (require, $) {
    var currentlyShownDialog = $();
    
    var showUnclosableDialog = function (title, text, click, buttons) {
        currentlyShownDialog.remove();
        
        var message = $('<div class="no-close">');
        message.addClass('no-close');
        if (title) {
            message.attr('title', title);
        }
        
        if (text instanceof Array) {
            for (var i = 0; i < text.length; i++) {
                var line = $('<p>');
                line.text(text[i]);
                message.append(line);
            }
        } else {
            message.text(text);
        }
        
        $('body').append(message);
        message.click(click);
        message.dialog({
            modal: true,
            buttons: buttons
        });
        
        currentlyShownDialog = message;
        return message;
    };
    
    var hideUnclosableDialog = function () {
        currentlyShownDialog.remove();
    };
    
    showUnclosableDialog(
        'Authorizing',
        [
            'You must authorize this app to use Google Drive. A popup will open to allow this authorization.',
            'Click here to retry authorization.'
        ],
        function () {
            require(['drive/drive'], function (drive) {
                drive.auth.authorize(true);
            });
        }
    );
    
    return {
        googleDriveAuthorizationSuccess: function () {
            hideUnclosableDialog();
        },
        googleDriveAuthorizationFailed: function () {
            showUnclosableDialog(
                'Authorizing',
                [
                    'You must authorize this app to use Google Drive. A popup will open to allow this authorization.',
                    'Click here to retry authorization.'
                ],
                function () {
                    require(['drive/drive'], function (drive) {
                        drive.auth.authorize(true);
                    });
                }
            );
        },
        noParentFolderFound: function () {
            showUnclosableDialog(
                'Installation required',
                [
                    'This seems to be the first time you\'ve run Billbill.',
                    'Installation is required. Click here to install.'
                ],
                function () {
                    require(['drive/drive'], function (drive) {
                        drive.createParentFolder();
                    });
                }
            );
        },
        parentFolderFound: function () {
            hideUnclosableDialog();
        }
    };
});