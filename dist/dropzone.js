(function($) {
    "use strict"
    var defaults = {
        zIndex: 1000,
        previewImages: true,
        showFileName: false,
        height:'81px',
        width:'81px'
    };

    /*
        Plugin declaration
    */
    $.inputFileZone = function(elem, options) {

        var plugin = this;

        plugin.options = options;

        plugin.input = $(elem);
        plugin.closestDiv = null;
        plugin.spanEl = null;

        plugin.browser = null;

        /*
            publics
        */
        plugin.init = function() {
            plugin.start();
        };

        plugin.start = function() {
            StylingDropZone();
            EventsDropZone();
        };
        

        function toDataUrl(url, callback) {
            if (!url) return false;
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var reader = new FileReader();
                reader.onloadend = function() {
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        }
        /* 
            Privates
        */
        function StylingDropZone() {
            plugin.input.wrap('<div class="closest-dropzone"></div>');
            var input_name = plugin.input.attr('name');
            plugin.input.removeAttr('name');
            plugin.closestDiv = plugin.input.closest('.closest-dropzone');

            plugin.closestDiv.append('<div class="dz-progressbar"><div class="dz-progress"></div></div><input name="'+input_name+'" type="hidden" class="dz_file_data">')
            toDataUrl($(plugin.input).attr('src'), function(myBase64) {
                plugin.closestDiv.css({
                    'background-image': 'url(' + myBase64 + ')'
                });
            });
            // IMAGE PRE LOAD

            if($(plugin.input).data('width')){
                plugin.options.width = $(plugin.input).data('width')
            }
            if($(plugin.input).data('height')){
                plugin.options.height = $(plugin.input).data('height')
            }
            plugin.closestDiv.css({
                'width': plugin.options.width,
                'height':  plugin.options.height,
                'position': 'relative',
                'background-size': 'cover',
                'background-position': '50%',
                'text-align': 'center',
                '-webkit-transition': 'all 0.3s ease-out',
                '-moz-transition': 'all 0.3s ease-out',
                '-ms-transition': 'all 0.3s ease-out',
                '-o-transition': 'all 0.3s ease-out',
                'transition': 'all 0.3s ease-out'
            });
                

            plugin.input.css({
                'z-index': plugin.options.zIndex + 1,
                'top': 0,
                'left': 0,
                'cursor': 'pointer !important',
                'height': '100%',
                'width': '100%',
                'position': 'absolute',
                'opacity': 0,
                'filter': 'alpha(opacity=0)'
            });

            plugin.spanEl = plugin.closestDiv.find('span');

            plugin.spanEl.css({
                'z-index': plugin.options.zIndex,
                'top': ( plugin.closestDiv.height() - plugin.spanEl.height() ) / 2 ,
                'left': 0,
                'width': '100%',
                'position': 'absolute',
                'word-wrap': 'break-word'
            });
        }

        function EventsDropZone() {
            plugin.input.on({
                dragover: dragOver,
                dragenter: dragEnter,
                dragleave: dragExit,
                dragexit: dragExit
            });
            // IE Legacy need to add events ! :(
            Browser();
            
            if (plugin.browser.msie && parseInt(plugin.browser.version, 10) < 10) {
                plugin.input.on({
                    drop: drop
                });
            } else {
                plugin.input.on({
                    change: dropOrChange,
                    drop: dropOrChange
                });
            }
        }

        function validate_file(file){
            // validate file type
            if(plugin.options.file_types_allowed){
                if(plugin.options.file_types_allowed.indexOf(file.type) == -1){
                    Swal.fire({
                        title: 'Invalid File type',
                        type: 'warning',
                    });
                    return false;
                }
            }
            // validate max file size
            if(plugin.options.max_file_size){
                if (plugin.options.max_file_size !== null) {
                    if (file.file_size > plugin.options.max_file_size) {
                        Swal.fire({
                            title: 'Maximum File Size Limit Exceded',
                            type: 'warning',
                        });
                        return false
                    }
                }
            }
            return true;
        }

        function start_upload(file_reader) {
            var form_data = new FormData();    
            form_data.append('file', file_reader);
            plugin.closestDiv.find('.dz-progress').css({
                'background-color': '#3f6ad8',
                'width': 0,
            })
            $.ajax({
                url: plugin.options.upload_url,
                data: form_data,
                processData: false,
                contentType: false,
                type: 'POST',
                mimeType:"multipart/form-data",                    
                cache: false,
                xhr: function(){
                    var xhr = new window.XMLHttpRequest();
                    //Upload progress
                    xhr.upload.addEventListener("progress", function(evt){
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            
                            plugin.closestDiv.find('.dz-progress').css({
                                'height': '100%',
                                'width': Math.round(percentComplete*100) + "%",
                            })
                        }
                    }, false);
                    return xhr;
                },
                success: function(response) {
                    // var data = JSON.parse(response)
                    // plugin.closestDiv.find('.circle-loader').removeClass('load-complete').addClass('load-complete')
                    // plugin.closestDiv.find('.checkmark').show();

                    plugin.closestDiv.find('.dz_file_data').val(response);
                    plugin.closestDiv.find('.dz-progress').css({
                        'background-color': '#3ac47d'
                    })
                }
            })
	        
        }

        function dropOrChange(event) {
            killHandler(event);
            // console.log( plugin.options.file_types_allowed )
            var file = event.target.files[0];
            //IE 10!
            if(!file) {
                file = event.originalEvent.dataTransfer.files[0];
            }

            if(validate_file(file)){
                if(plugin.options.showFileName){
                    plugin.closestDiv.addClass('dropzone-upload')
                        .find('span')
                        .css({'color': 'white'})
                        .html(file.name);
                }else{
                    plugin.closestDiv.addClass('dropzone-upload')
                        .find('span')
                        .css({'color': 'white'})
                        .html('');
                }
                
                start_upload(file);

                if(plugin.options.previewImages) {
                    // Create Thumbnail if type === image
                    if(file.type.match('image.*')) {
                        var reader = new FileReader();
                        reader.onload = function(event){
                            plugin.closestDiv.data('previouscss', plugin.closestDiv.css('background-image')+ ';'+ plugin.closestDiv.css('background-color'));
    
                            plugin.closestDiv.css({
                                'background-image': 'url(' + event.target.result + ')'
                            });
                        };
                        reader.readAsDataURL(file);
                    } else {
                        var previousCss = plugin.closestDiv.data('previouscss').split(';');
                        if(previousCss) {
                            plugin.closestDiv.css({
                                'background-image': previousCss[0],
                                'background-color': previousCss[1]
                            });
                        }
                    }
                }
            }
        }

        function drop(event) {
            killHandler(event);
        }

        function dragEnter(event) {
            killHandler(event);
        }

        function dragOver(event) {
            killHandler(event);

            plugin.closestDiv.addClass('dropzone-upload');
        }
        
        function dragExit(event) {
            killHandler(event);

            plugin.closestDiv.removeClass('dropzone-upload');
        }

        function killHandler(event) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Check browser 
        function Browser() {
            var browser = {
                msie : false,
                version : 0
            };

            if(navigator.userAgent.match(/MSIE ([0-9]+)\./)){
                browser.msie = true;
                browser.version = RegExp.$1;
            }

            plugin.browser = browser;
        }

        /*
            initialize
        */
        plugin.init();
    };

    // Add to jquery functions library
    $.fn.extend({
        inputFileZone: function(options, arg) {
            if (options && typeof(options) == 'object') {
                options = $.extend({}, defaults, options );
            }

            if(!options) options = defaults;

            this.each(function() {
                new $.inputFileZone(this, options);
            });
            return;
        }
    });
})(jQuery);
