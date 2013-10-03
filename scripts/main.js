define(['require', 'drive/drive', 'ui/ui'], function (require, drive, ui) {
    return {
        loaded: function () {
            drive.auth.authorize();
        },
        
        googleDriveAuthorized: function () {
            drive.findParentFolder();
        },
        
        parentFoldersFound: function () {
            ui.parentFolderFound();
            drive.listFiles();
        }
    };
});