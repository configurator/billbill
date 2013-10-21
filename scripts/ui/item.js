/* global ui define drive $ */
'use strict';

(function () {
    
    var singleItem = $('.item'),
        imageMimeRegex = /^image\//i,
        pdfMimeRegex = /\/pdf/i,
        
        currentlyShownItem = '',
        editing = false;
    
    var propertyKinds = {
        title: {
            name: 'שם קובץ',
            fileValue: true
        },
        viewUrl: {
            fileValue: true,
            isViewer: true
        },
        supplier: {
            name: 'ספק',
            editable: true
        },
        totalAmount: {
            name: 'סה"כ',
            editable: true,
            type: 'number'
        }
    };
    
    define('ui.item', {
        createViewer: function (file) {
            console.log('Creating viewer for file ', file);
            
            var result;
            if (imageMimeRegex.test(file.mimeType)) {
                result = $('<img>').attr('src', file.viewUrl);
            } else if (pdfMimeRegex.test(file.mimeType)) {
                result = $('<div class="full-size-embed-container">').append(
                    $('<embed>').attr({
                        name: 'plugin',
                        type: file.mimeType,
                        src: file.viewUrl
                    })
                );
            } else {
                result = $('<iframe>').attr('src', file.viewUrl);
            }
            
            result;
            result.smartZoom();
            
            return result;
        },
        
        showItem: function (id) {
            editing = false;
            
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
                .append(ui.item.createViewer(file));

            for (var key in propertyKinds) {
                var value = propertyKinds[key].fileValue ? file[key] : props[key];
                
                var tag = singleItem.find('.control.' + key + ' .value');
                if (tag.length) {
                    tag.data('get-set-value').call(tag, value || '');
                }
            }
            
            singleItem.show();
            editing = true;
            singleItem.find(':focusable').not('.btn').first().focus();
        },
        
        inputFieldValueChanged: function () {
            if (!editing) {
                return;
            }
            
            var $this = $(this),
                key = $this.data('key'),
                value = $this.data('get-set-value').call($this);
            
            drive.setProperty(currentlyShownItem, key, value);
        },
        
        showList: function () {
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
        
        advanceFile: function (addition) {
            return function  () {
                var list = $('.content .file-list').children('li'),
                    currentItem = list.filter(':data(' + currentlyShownItem + ')'),
                    index = list.index(currentItem),
                    selection = list.eq(index + addition),
                    item = selection.data('item');
                
                if (index + addition >= 0 && item && item.id) {
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
    
    $('.item .actions .close-file').click(ui.item.showList);
    $('.item .actions .previous-file').click(ui.item.advanceFile(-1));
    $('.item .actions .next-file').click(ui.item.advanceFile(1));
})();
