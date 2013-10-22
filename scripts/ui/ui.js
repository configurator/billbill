/* global $ define drive memoize ui main google secrets Set */
'use strict';

(function () {
    var knownPropertyValues = {
            supplier: new Set(),
            date: new Set.MonthSet()
        },
        currentlyShownDialog = $();
    
    var showUnclosableDialog = function (title, text, click, buttons) {
        currentlyShownDialog.remove();
        
        var message = $('<div>');
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
            buttons: buttons,
            dialogClass: 'no-close'
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
            drive.auth.authorize(true);
        }
    );
    
    var drivePicker = memoize(function () {
        var getView = function (id) {
            var result = new google.picker.DocsView(id);
            result.setIncludeFolders(true);
            result.setMode(google.picker.DocsViewMode.LIST);
            result.setParent('root');
            return result;
        };
        
        var views = {};
        views.upload = new google.picker.DocsUploadView();
        views.upload.setIncludeFolders(true);
        views.images = getView(google.picker.ViewId.DOCS_IMAGES);
        views.pdfs = getView(google.picker.ViewId.PDFS);
        
        var picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(secrets.web.client_id)
            .setCallback(function (args) {
                if (args && args.action == google.picker.Action.PICKED && args.docs && args.docs.length) {
                    var ids = args.docs.map(function (doc) { return doc.id; });
                    drive.addFiles(ids);
                }
            });
        for (var name in views) {
            picker = picker.addView(views[name]);
        }
        picker = picker.build();
        
        return picker;
    });
    
    $('.content .actions .pick-drive-file').click(function () {
        drivePicker().setVisible(true);
    });
    $('.content .actions .refresh').click(function () {
        drive.listFiles();
    });
    $('.content .file-list').on('click', 'li', function () {
        var item = $(this).data('item');
        if (!item || !item.id) {
            return;
        }
        
        ui.item.showItem(item.id);
    });
    
    define('ui', {
        knownPropertyValues: knownPropertyValues,
        
        finishedLoading: function () {
            $('body').removeClass('loading');
        },
        
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
                    drive.auth.authorize(true);
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
                    drive.createParentFolder();
                }
            );
        },
        
        parentFolderFound: function () {
            hideUnclosableDialog();
        },
        
        updateKnownFile: function (file) {
            var item = $('<li>').addClass('input-group');
            item.append($('<span>').addClass('form-control').addClass('title').text(file.title));
            for (var key in ui.item.propertyKinds) {
                var kind = ui.item.propertyKinds[key];
                if (kind.shownInList) {
                    item.append($('<span>').addClass('input-group-addon').addClass('property').addClass(key));
                }
            }
            item.data('item', file);
            item.data(file.id, 'id');
            
            var list = $('.content .file-list');
            var oldItem = list.find(':data(' + file.id + ')');
            if (oldItem.length) {
                oldItem.replaceWith(item);
            } else {
                list.append(item);
            }
            
            ui.updateProperties(file.id, drive.properties[file.id]);
        },
        
        updateProperties: function (id, properties) {
            if (!properties) {
                return;
            }
            
            var item = $('.content .file-list :data(' + id + ')');
            if (!item.length) {
                return;
            }
            
            item.data('props', properties);
            
            for (var key in ui.item.propertyKinds) {
                var kind = ui.item.propertyKinds[key];

                if (kind.shownInList) {
                    var value = properties[key];
                    
                    if (kind.listTranslator) {
                        value = kind.listTranslator(value);
                    }
                    
                    item.find('.property.' + key).text(value || '');
                }
                
                if (knownPropertyValues[key] && properties[key]) {
                    knownPropertyValues[key].add(properties[key]);
                }
            }
        }
    });
})();
