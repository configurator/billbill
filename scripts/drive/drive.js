/* global define main ui gapi drive */
'use strict';

(function () {
    var parentFolderNameForAllBillbillFiles = '__Billbill__',
        parentFolderMarkerProperty = '__Billbill__ParentFolder',
        googleDriveFolderMimeType = 'application/vnd.google-apps.folder',
        parentFolders = {},
        parentFolderListFields = 'items(id)',
        fileGetFields = 'id, mimeType, title',
        fileListFields = undefined,//'items(' + fileGetFields + '), nextPageToken',
        knownFiles = {},
        properties = {},
        
        stripMillisecondsRegExp = /^(.*)\.\d\d\dZ$/;

    var listFilesInFolders = function (folders, gotFile, finished) {
        console.log('Listing files in ', folders);
        var query = '';
        for (var folder in folders) {
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
                    gotFile(results.items[i]);
                }
                
                var nextPageToken = results.nextPageToken;
                if (nextPageToken) {
                    request = gapi.client.drive.files.list({
                        q: query,
                        pageToken: nextPageToken,
                        fields: fileListFields,
                        maxResults: 1000
                    });
                    getResults(request);
                } else {
                    console.log('Finished listing all files');
                    finished();
                }
            });
        };
        
        getResults(gapi.client.drive.files.list({
            q: query,
            fields: fileListFields,
            maxResults: 1000
        }));
    };
    
    define('drive', {
        knownFiles: knownFiles,
        properties: properties,
        parentFolders: parentFolders,
        
        listFilesInFolders: listFilesInFolders,
        
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
                        }).safeBatch(function (results) {
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
                    mimeType: googleDriveFolderMimeType
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
            listFilesInFolders(parentFolders, function (item) {
                drive.normalizeAndSaveFile(item);
                drive.loadProperties(item.id);
            }, function () {
                main.filesListed();
            });
         },
        
        loadProperties: function (id) {
            gapi.client.drive.properties.list({
                fileId: id
            }).safeBatch(function (result) {
                if (!result || result.error || !result.result || result.result.error) {
                    console.error('Error loading properties for file ' + id, result);
                    return;
                }
                
                var props = {};
                
                for (var key in result.result.items) {
                    var item = result.result.items[key];
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
            }).safeBatch(function (result) {
                if (!result || result.error) {
                    console.error('Error loading file ' + id, result);
                    return;
                }

                drive.normalizeAndSaveFile(result);
            });
            
            drive.loadProperties(id);
        },
        
        normalizeAndSaveFile: function (data) {
            if (!data || !data.id) {
                return;
            }
            
            if (data.mimeType == googleDriveFolderMimeType) {
                // We never display folders
                return;
            }
            
            var timestampWithoutMilliseconds = stripMillisecondsRegExp.exec(data.modifiedDate),
                parsedTimestamp = timestampWithoutMilliseconds && Date.parseExact(timestampWithoutMilliseconds[1], 'yyyy-MM-ddTHH:mm:ss');
            if (parsedTimestamp) {
                data.timestamp = parsedTimestamp.getTime();
            }
            
            data.viewUrl = '//drive.google.com/uc?export=view&id=' + data.id;
            knownFiles[data.id] = data;
            ui.updateKnownFile(data);
        },
        
        enumerateFilesFromGivenFoldersRecursively: function (ids, callback) {
            var skipFiles = {},
                resultFiles = [],
                foldersToEnumerate = {},
                inProgress = 0;
            
            for (var id in knownFiles) {
                skipFiles[id] = true;
            }

            var enumerateFile = function (id) {
                console.log('Looking at file ' + id);
                if (skipFiles[id]) {
                    console.log('Skipped - we already know this file!');
                    return;
                }
                skipFiles[id] = true;
                
                inProgress++;
                gapi.client.drive.files.get({
                    fileId: id,
                    fields: fileGetFields
                }).safeBatch(function (result) {
                    console.log('result ', result);
                    inProgress--;
                    
                    if (!result || result.error) {
                        console.error('Failed to enumerate file ' + id + '; ignoring this file.');
                        return;
                    }
                    
                    if (result.mimeType == googleDriveFolderMimeType) {
                        foldersToEnumerate[id] = true;
                    } else {
                        resultFiles.push(id);
                    }
                    
                    finishedEnumeration();
                });
            };
            
            var enumerateChildren = function () {
                var folders = foldersToEnumerate;
                foldersToEnumerate = {};
                
                console.log('Enumerating files in folders ', folders);
                
                inProgress++;
                listFilesInFolders(folders, function (item) {
                    enumerateFile(item.id);
                }, function () {
                    inProgress--;
                    finishedEnumeration();
                });
            };
            
            var finishedEnumeration = function () {
                if (inProgress != 0) {
                    return;
                }
                
                if (Object.keys(foldersToEnumerate).length) {
                    enumerateChildren();
                    return;
                }
                
                callback(resultFiles);
                
                // Make sure we're not called again
                callback = function () {
                    console.error('Callback was almost called twice!');
                }
            };
            
            inProgress++;
            for (var index in ids) {
                enumerateFile(ids[index]);
            }
            inProgress--;
            finishedEnumeration();
        },
        
        addFiles: function (ids) {
            console.log('Adding files ', ids);
            var parentFolderId = Object.keys(parentFolders)[0];
            drive.enumerateFilesFromGivenFoldersRecursively(ids, function (ids) {
                var awaiting = ids.length;
                for (var x in ids) {
                    var id = ids[x];
                    gapi.client.drive.parents.insert({
                        fileId: id,
                        resource: { id: parentFolderId }
                    }).safeBatch(function () {
                        console.log('Added file to list.');
                        awaiting--;
                        if (!awaiting) {
                            drive.listFiles();
                        }
                    });
                }
            });
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
            }).safeBatch(function (results) {
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
