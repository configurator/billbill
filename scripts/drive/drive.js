define(['ui/ui', './auth'], function (ui, auth) {
    var parentFolderNameForAllBillbillFiles = '__Billbill__';
    var parentFolderMarkerProperty = '__Billbill__ParentFolder'
    var parentFolders = [];
    
    return {
        auth: auth,
        
        findParentFolder: function () {
            console.log('Searching for parent folder of all documents.');
            gapi.client.request({
                path: '/drive/v2/files',
                method: 'GET',
                params: {
                    maxResults: 1000,
                    q: 'title = "' + parentFolderNameForAllBillbillFiles + '"'
                },
                callback: function (results) {
                    if (!results || results.error) {
                        console.error('Error getting container folder; results:', results);
                    } else {
                        console.info('Search results:', results)
                        var items = results.items;
                        var done = -1;
                        var plusOne = function () {
                            done++;
                            if (done == items.length) {
                                if (parentFolders.length == 0) {
                                    ui.noParentFolderFound();
                                } else {
                                    require(['main'], function (main) { main.parentFoldersFound() });
                                }
                            }
                        };
                        var checkFolder = function (id) {
                            gapi.client.request({
                                path: '/drive/v2/files/' + id + '/properties/' + parentFolderMarkerProperty,
                                method: 'GET',
                                callback: function (results) {
                                    if (results && !results.error) {
                                        parentFolders.push(id);
                                    }
                                    plusOne();
                                }
                            })
                        };
                        
                        for (var i = 0; i < items.length; i++) {
                            checkFolder(results.items[i].id);
                        }
                        
                        plusOne();
                    }
                }
            });
        },
        
        createParentFolder: function () {
            console.log('Creating parent folder for all documents.');
            gapi.client.request({
                path: '/drive/v2/files',
                method: 'POST',
                params: {
                    visibility: 'PRIVATE'
                },
                body: {
                    title: parentFolderNameForAllBillbillFiles,
                    'labels.hidden': true,
                    description: 'This folder is used by Billbill internally.',
                    mimeType: 'application/vnd.google-apps.folder'
                },
                callback: function (results) {
                    if (!results || results.error) {
                        console.error('Error creating container folder; results: ', results);
                    } else {
                        var id = results.id;
                        console.log('Folder created. Marking it.');
                        gapi.client.request({
                            path: '/drive/v2/files/' + id + '/properties',
                            method: 'POST',
                            body: {
                                key: parentFolderMarkerProperty,
                                value: 1,
                                visibility: 'PRIVATE'
                            },
                            callback: function (results) {
                                if (!results || results.error) {
                                    console.error('Error setting container folder marker property', results);
                                } else {
                                    parentFolders.push(id);
                                    console.log('Parent folder successfully created');
                                    require(['main'], function (main) { main.parentFoldersFound() });
                                }
                            }
                        })
                    }
                }
            });
        },
        
        listFiles: function () {
            console.log('Listing files.');
            
        }
    };
});