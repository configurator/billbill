/* global ui define drive $ */
'use strict';

(function () {
    
    var singleItem = $('.item'),
        imageMimeRegex = /^image\//i,
        pdfMimeRegex = /\/pdf/i,
        
        currentlyShownItem = '',
        editing = false,
        
        preloadArea = $('<div>').hide(),
        preloadedViewers = {},
        maxPreloadedViewers = 10;
        
    $('body').append(preloadArea);
    
    var formats = {
        validationResults: {
            success: 'has-success',
            error: 'has-error',
            none: '',
            
            allResults: 'has-error has-success'
        },
        
        text: {
            normalize: function (value) {
                return (value || '').trim();
            },
            
            validate: function (value) {
                return formats.validationResults.success;
            }
        },
        date: {
            normalize: function (text) {
                var value = Date.parseExact(text, [
                    'd/M/yy',
                    'd M yy',
                    'd/M',
                    'd M',
                    'ddMM',
                    'ddMMyy',
                    'ddMMyyyy'
                ]);
                
                if (value) {
                    return value.toString('dd/MM/yyyy');
                } else {
                    return text;
                }
            },
            
            validate: function (value) {
                return Date.parseExact(value, 'dd/MM/yyyy')
                    ? formats.validationResults.success
                    : formats.validationResults.error;
            }
        },
        
        number: {
            normalize: function (value) {
                return (value || '').trim();
            },
            
            validate: function (value) {
                return isNaN(Number(value).valueOf())
                    ? formats.validationResults.error
                    : formats.validationResults.success;
            }
        },
        
        regex: function (regex) {
            return {
                normalize: formats.text.normalize,
                
                validate: function (value) {
                    return regex.test(value)
                        ? formats.validationResults.success
                        : formats.validationResults.error;
                }
            }
        }
    };
    
    var listTranslators = {
        select: function (key) {
            var select = singleItem.find('.control.' + key + ' select.value');
            
            return function (value) {
                return select.find('[value="' + value + '"]').text() || value;
            };
        }
    };
    
    var propertyKinds = {
        title: {
            fileValue: true
        },
        
        itemType: {
            format: formats.text,
            shownInList: true,
            listTranslator: listTranslators.select('itemType')
        },
        identifier: {
            format: formats.regex(/^[- /A-Z0-9]*$/),
            shownInList: true
        },
        supplier: {
            format: formats.text,
            shownInList: true
        },
        totalAmount: {
            format: formats.number,
            shownInList: true
        },
        date: {
            format: formats.date,
            shownInList: true
        }
    };
    
    define('ui.item', {
        propertyKinds: propertyKinds,
        formats: formats,
        
        viewer: {
            create: function (file) {
                if (imageMimeRegex.test(file.mimeType)) {
                    return $('<img>').attr('src', file.viewUrl);
                } else if (pdfMimeRegex.test(file.mimeType)) {
                    return $('<embed>').attr({
                        name: 'plugin',
                        type: file.mimeType,
                        src: file.viewUrl
                    });
                } else {
                    return $('<iframe>').attr('src', file.viewUrl);
                }
            },
            
            preload: function (file) {
                if (!file || !file.id) {
                    return $();
                }
                
                var viewer = ui.item.viewer.create(file);
                viewer.data('id', file.id);
                preloadArea.prepend(viewer);
                preloadedViewers[file.id] = viewer;
                
                ui.item.viewer.purge();
                
                return viewer;
            },
            
            get: function (file) {
                if (!file || !file.id) {
                    return $();
                }
                
                return preloadedViewers[file.id] || ui.item.viewer.preload(file);
            },
            
            hide: function () {
                singleItem.find('.viewUrl').children().each(function () {
                    preloadArea.prepend(this);
                });
                ui.item.viewer.purge();
            },
            
            delete: function (id) {
                var viewer = preloadedViewers[id] || $();
                delete preloadedViewers[id];
                viewer.remove();
            },
            
            purge: function () {
                preloadArea.children().filter(':gt('+maxPreloadedViewers+')').each(function () {
                    ui.item.viewer.delete($(this).data('id'));
                });
            }
        },
        
        showItem: function (id) {
            editing = false;
            ui.item.viewer.hide();
            
            var file = drive.knownFiles[id],
                props = drive.properties[id];
            
            if (!file || !props) {
                console.error('Unknown file ' + id);
                ui.item.showList();
                return;
            }
            
            currentlyShownItem = id;
            
            singleItem.find('.viewUrl')
                .empty()
                .append(ui.item.viewer.get(file));
                
            for (var key in propertyKinds) {
                var kind = propertyKinds[key],
                    value = kind.fileValue ? file[key] : props[key];
                
                var tag = singleItem.find('.control.' + key + ' .value');
                if (tag.length) {
                    tag.data('get-set-value').call(tag, value || '');
                    tag.change();
                }
                
                tag.parent().removeClass(formats.validationResults.allResults);
                
                if (kind.format && kind.format.validate && value) {
                    tag.parent().addClass(kind.format.validate(value));
                }
            }
            
            singleItem.show();
            editing = true;
            singleItem.find(':focusable').not('.btn').first().focus();
            
            // Preload next and previous item, for quick browsing
            ui.item.viewer.get(ui.item.getNextFile(1));
            ui.item.viewer.get(ui.item.getNextFile(-1));
        },
        
        inputFieldValueChanged: function () {
            if (!editing) {
                return;
            }
            
            var $this = $(this),
                key = $this.data('key'),
                value = $this.data('get-set-value').call($this),
                kind = propertyKinds[key];
            
            if (kind) {
                if (kind.format && kind.format.normalize) {
                    value = kind.format.normalize(value);
                    $this.data('get-set-value').call($this, value);
                }

                $this.parent().removeClass(formats.validationResults.allResults);
                
                if (kind.format && kind.format.validate && value) {
                    $this.parent().addClass(kind.format.validate(value));
                }
                
                drive.setProperty(currentlyShownItem, key, value);
            }
        },
        
        showList: function () {
            ui.item.viewer.hide();
            singleItem.hide();

            editing = false;
        },
        
        moveToNextItem: function () {
            var controls = singleItem.find(':focusable'),
                myIndex = controls.index(this),
                next = controls.eq(myIndex + 1);
            
            if (!next.length) {
                next = singleItem.find('.next-file');
            }
            
            next.focus();
        },
        
        inputControlKeyPress: function (event) {
            if (event.which == 13) {
                ui.item.moveToNextItem.call(this);
                return false;
            }
        },
        
        getNextFile: function (addition) {
            var list = $('.content .file-list').children('li'),
                currentItem = list.filter(':data(' + currentlyShownItem + ')'),
                index = list.index(currentItem),
                selection = list.eq(index + addition),
                item = selection.data('item');
            
            if (index + addition >= 0 && item && item.id) {
                return item;
            } else {
                return false;
            }
        },
        
        advanceFile: function (addition) {
            return function  () {
                var item = ui.item.getNextFile(addition);
                if (item && item.id) {
                    ui.item.showItem(item.id);
                } else {
                    ui.item.showList();
                }
            };
        }
    });
    
    for (var key in propertyKinds) {
        var control = singleItem.find('.control.' + key + ' .value');
        if (!control.length) {
            continue;
        }
        
        control.data('key', key);
        switch ((control.prop('tagName') || '').toLowerCase()) {
            case 'span':
                control.data('get-set-value', control.text);
                break;
                
            case 'input':
            case 'textarea':
            case 'select':
                control.data('get-set-value', control.val);
                break;
            
            default:
                console.info('Unknown control type ', control);
                control.data('get-set-value', $.noop);
                break;
        }
        
        control.change(ui.item.inputFieldValueChanged);
        control.keypress(ui.item.inputControlKeyPress);
    }
    
    singleItem.find('.actions .close-file').click(ui.item.showList);
    singleItem.find('.actions .previous-file').click(ui.item.advanceFile(-1));
    singleItem.find('.actions .next-file').click(ui.item.advanceFile(1));
})();
