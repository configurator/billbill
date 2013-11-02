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

    var drivePicker = memoize(function () {
        var getView = function (id) {
            var result = new google.picker.DocsView(id);
            result.setIncludeFolders(true);
            result.setMode(google.picker.DocsViewMode.LIST);
            result.setParent('root');
            result.setSelectFolderEnabled(true);
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
    $('.content .actions .data-entry-mode').click(function () {
        ui.item.startDataEntry();
    })
    $('.content .actions .show-report-selector').click(function () {
        ui.reports.showSelector();
    });
    
    $('.content .file-list').on('click', 'li', function () {
        var item = $(this).data('item');
        if (!item || !item.id) {
            return;
        }

        ui.item.showItem(item.id);
    });
    
    $('.drive-errors .retry-all').click(function () {
        $('.drive-errors .drive-error .error-retry').each(function () {
            $(this).click();
        });
    });
    $('.drive-errors .cancel-all').click(function () {
        $('.drive-errors .drive-error .error-cancel').each(function () {
            $(this).click();
        });
    });

    define('ui', {
        knownPropertyValues: knownPropertyValues,
        
        hideDriveError: function (div) {
            var container = $('.drive-errors');
            div.remove();
            if (!container.find('.drive-error').length) {
                container.hide();
            }
        },
        
        showDriveError: function (error, failureCount, retry, cancel) {
            console.error('Error connecting to Google Drive ', error);
            error = error || {};
            failureCount = failureCount || 1
            
            var div = $('<div>')
                .addClass('drive-error')
                .addClass('list-group-item')
                .append(
                    $('<h4>')
                    .addClass('error-text')
                    .addClass('list-group-item-heading')
                    .text('An error occured connecting to Google Drive. Some of your changes may not be saved unless you try again. ')
                    .append(
                        $('<span>')
                        .addClass('failure-count')
                        .addClass('badge')
                        .text(failureCount > 1 ? 'Failed ' + failureCount + ' times' : 'Failed once')
                    )
                )
                .append(
                    $('<pre>')
                    .addClass('error-details')
                    .addClass('list-group-item-text')
                    .text(
                        'Error: ' + error.message || 'Unknown'
                        + '\nCode: ' + error.code || 'Unknown'
                    )
                )
                .append(
                    $('<div>')
                    .addClass('error-actions')
                    .addClass('btn-toolbar')
                    .append(
                        $('<span>')
                        .addClass('error-retry')
                        .addClass('btn btn-primary')
                        .text('Try again!')
                        .click(function () {
                            ui.hideDriveError(div);
                            retry.apply(this, arguments);
                        })
                    )
                    .append(
                        $('<span>')
                        .addClass('error-cancel')
                        .addClass('btn btn-danger')
                        .text('Forget it')
                        .click(function () {
                            ui.hideDriveError(div);
                            cancel.apply(this, arguments);
                        })
                    )
                );

            $('.drive-errors .error-list').append(div);
            $('.drive-errors').show();
        },

        finishedLoading: function () {
            $('body').removeClass('loading');
        },
        
        googleDriveAuthorizationAttempted: function () {
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

        getGroup: function (properties) {
            properties = properties || {};

            var month = Set.MonthSet.normalize(properties.date),
                supplier = properties.supplier || '';

            var getOrCreateChild = function (item, property, value, childClass) {
                var child = item.children().filter(function () {
                        return $(this).data(property) == value;
                    }),
                    result = child && child.children('.list-group-item-text');

                if (child && child.length && result && result.length) {
                    return result;
                }

                item.append(
                    child = $('<div>')
                    .addClass('file-list-sublist')
                    .addClass('list-group-item')
                    .addClass('by-' + property)
                    .data(property, value)
                    .append(
                        $('<h4>')
                        .addClass('list-group-item-heading')
                        .text(value)
                    )
                    .append(
                        result = $('<div>')
                        .addClass('list-group-item-text')
                        .addClass(childClass || '')
                    )
                );

                return result;
            };

            var list = $('.content .file-list'),
                monthChild = getOrCreateChild(list, 'date', month, month, 'list-group'),
                supplierChild = getOrCreateChild(monthChild, 'supplier', supplier),
                ul = supplierChild.children('ul');

            if (ul && ul.length) {
                return ul;
            }

            supplierChild.append(
                ul = $('<ul>')
            );
            return ul;
        },

        getFileRow: function (id, context) {
            if (!context) {
                context = $('.content .file-list');
            }

            return context.find('.file-row:data(' + id + ')');
        },

        updateKnownFile: function (file) {
            var item = $('<li>').addClass('file-row').addClass('input-group');
            item.append($('<span>').addClass('form-control').addClass('title').text(file.title));
            for (var key in ui.item.propertyKinds) {
                var kind = ui.item.propertyKinds[key];
                if (kind.shownInList) {
                    item.append($('<span>').addClass('input-group-addon').addClass('property').addClass(key));
                }
            }
            item.data('item', file);
            item.data(file.id, 'id');

            var oldItem = ui.getFileRow(file.id);
            if (oldItem.length) {
                oldItem.replaceWith(item);
            } else {
                ui.getGroup().append(item);
            }

            ui.updateProperties(file.id, drive.properties[file.id]);
        },

        updateProperties: function (id, properties) {
            if (!properties) {
                return;
            }

            var item = ui.getFileRow(id);
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

            ui.updateItemGroup(id, item, properties);
            ui.updateTotals();
        },

        updateItemGroup: function (id, fileRow, properties) {
            var group = ui.getGroup(properties),
                contextFileRow = ui.getFileRow(id, group);

            if (!contextFileRow.length) {
                group.append(fileRow);
                ui.sort();
            }
        },
        
        updateTotals: function () {
            var sums = {};
            $('.file-row:visible').each(function () {
                var props = $(this).data('props');
                if (!props) {
                    return;
                }
                
                var value = parseFloat(props.totalAmount);
                if (value) {
                    var itemType = props.itemType || 'other';
                    sums[itemType] = (sums[itemType] || 0) + value;
                }
            });
            
            $('.total-row .value').text('0');
            
            for (var itemType in sums) {
                $('.total-row .' + itemType + ' .value').text(sums[itemType].toFixed(2));
            }
        }
    });
})();
