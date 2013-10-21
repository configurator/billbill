/* global define main ui gapi drive */
'use strict';

(function () {
    var parentFolderNameForAllBillbillFiles = '__Billbill__',
        parentFolderMarkerProperty = '__Billbill__ParentFolder',
        parentFolders = {},
        parentFolderListFields = 'items(id)',
        fileGetFields = 'id, mimeType, title',
        fileListFields = 'items(' + fileGetFields + '), nextPageToken',
        knownFiles = {},
        properties = {};
    
    define('drive', {
        knownFiles: knownFiles,
        properties: properties,
        parentFolders: parentFolders,
        
        findParentFolder: function () {
            console.log('Searching for parent folder of all documents.');
            gapi.client.drive.files.list({
                q: 'title = "' + parentFolderNameForAllBillbillFiles + '" and trashed = false',
                fields: parentFolderListFields
            }).safeExecute(function (results) {
                if (!results || results.error) {
                    console.error('Error getting container folder; results:', results);
                } else {
                    console.info('Search results:', results);
                    var items = results.items || [];
                    var done = -1;
                    var plusOne = function () {
                        done++;
                        if (done == items.length) {
                            if (Object.keys(parentFolders).length == 0) {
                                ui.noParentFolderFound();
                            } else {
                                main.parentFoldersFound();
                            }
                        }
                    };
                    var checkFolder = function (id) {
                        gapi.client.drive.properties.get({
                            fileId: id,
                            propertyKey: parentFolderMarkerProperty
                        }).safeExecute(function (results) {
                            if (results && !results.error) {
                                parentFolders[id] = {};
                            }
                            plusOne();
                        });
                    };
                    
                    for (var i = 0; i < items.length; i++) {
                        checkFolder(results.items[i].id);
                    }
                    
                    plusOne();
                }
            });
        },
        
        createParentFolder: function () {
            console.log('Creating parent folder for all documents.');
            gapi.client.drive.files.insert({
                resource: {
                    title: parentFolderNameForAllBillbillFiles,
                    labels: { hidden: true },
                    description: 'This folder is used by Billbill internally.',
                    mimeType: 'application/vnd.google-apps.folder'
                }
            }).safeExecute(function (results) {
                if (!results || results.error) {
                    console.error('Error creating container folder; results: ', results);
                } else {
                    var id = results.id;
                    console.log('Folder created. Marking it.');
                    gapi.client.drive.properties.insert({
                        fileId: id,
                        resource: {
                            key: parentFolderMarkerProperty,
                            value: 1,
                            visibility: 'PRIVATE'
                        }
                    }).safeExecute(function (results) {
                        if (!results || results.error) {
                            console.error('Error setting container folder marker property', results);
                        } else {
                            parentFolders[id] = {};
                            console.log('Parent folder successfully created');
                            main.parentFoldersFound();
                        }
                    })
                }
            })
        },
        
        listFiles: function () {
            console.log('Listing files.');
            var query = '';
            for (var folder in parentFolders) {
                if (query.length) {
                    query = query + ' or ';
                }
                query = query + '\'' + folder + '\' in parents';
            }
            
            if (query == '') {
                return;
            }
            
            query = '(' + query + ') and trashed = false';
            
            console.log('Query ', { q: query, fields: fileListFields });
            
            var getResults = function (request) {
                request.safeExecute(function (results) {
                    if (!results || results.error) {
                        console.error('Error getting file list.', results);
                        return;
                    }
                    
                    console.info('Listing results:', results);
                    
                    for (var i in results.items) {
                        var item = results.items[i];
                        drive.normalizeAndSaveFile(item);
                        drive.loadProperties(item.id);
                    }
                    
                    var nextPageToken = results.nextPageToken;
                    if (nextPageToken) {
                        request = gapi.client.drive.files.list({
                            q: query,
                            pageToken: nextPageToken,
                            fields: fileListFields
                        });
                        getResults(request);
                    } else {
                        console.log('Finished listing all files');
                        main.filesListed();
                    }
                });
            };
            
            getResults(gapi.client.drive.files.list({
                q: query,
                fields: fileListFields
            }));
        },
        
        loadProperties: function (id) {
            gapi.client.drive.properties.list({
                fileId: id
            }).safeExecute(function (result) {
                if (!result || result.error) {
                    console.error('Error loading properties for file ' + id, result);
                    return;
                }
                
                var props = {};
                
                for (var key in result.items) {
                    var item = result.items[key];
                    props[item.key] = item.value;
                }
                
                properties[id] = props;
                ui.updateProperties(id, props);
            })
        },
        
        refreshFile: function (id) {
            gapi.client.drive.files.get({
                fileId: id,
                fields: fileGetFields
            }).safeExecute(function (result) {
                if (!result || result.error) {
                    console.error('Error loading file ' + id, result);
                    return;
                }

                drive.normalizeAndSaveFile(result);
                ui.updateKnownFile(result);
            });
            
            drive.loadProperties(id);
        },
        
        normalizeAndSaveFile: function (data) {
            if (!data || !data.id) {
                return;
            }
            
            data.viewUrl = '//drive.google.com/uc?export=view&id=' + data.id;
            knownFiles[data.id] = data;
            ui.updateKnownFile(data);
        },
        
        addFiles: function (ids) {
            var parentFolderId = Object.keys(parentFolders)[0];
            for (var x in ids) {
                var id = ids[x];
                gapi.client.drive.parents.insert({
                    fileId: id,
                    resource: { id: parentFolderId }
                }).safeExecute(function () {
                    console.log('Added file to list.');
                    drive.listFiles();
                });
            }
        },
        
        setProperty: function (file, key, value) {
            console.log('Saving property ' + file + '.' + key + ' = ', value);
            gapi.client.drive.properties.insert({
                fileId: file,
                resource: {
                    key: key,
                    value: value,
                    visibility: 'PRIVATE'
                }
            }).safeExecute(function (results) {
                if (!results || results.error) {
                    console.error('Error setting property on file', results);
                } else {
                    console.log('Property set. ', results);
                    drive.refreshFile(file);
                }
            })
        }
    });
})();
