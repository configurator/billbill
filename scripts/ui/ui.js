define(['jquery', 'jqueryui'], function ($) {
    return {
        googleDriveAuthorizationSuccess: function () {
            $('html').addClass('drive-authorized');
        },
        googleDriveAuthorizationFailed: function () {
            $('.google-drive-auth-failed').dialog({
                modal: true,
                closeOnEscape: false,
                dialogClass: 'no-close'
            });
        }
    };
});