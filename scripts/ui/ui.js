define(['require', 'jquery', 'jqueryui'], function (require, $) {
    $('.google-drive-auth').click(function () {
       require(['drive/auth'], function (auth) {
           auth.authorize(true);
       });
    });
    
    return {
        googleDriveAuthorizationSuccess: function () {
            $('.google-drive-auth').remove();
        },
        googleDriveAuthorizationFailed: function () {
            $('.google-drive-auth-failed').show();
        }
    };
});