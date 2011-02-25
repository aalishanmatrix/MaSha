jQuery.fn.cleanWhitespace = function() {
    textNodes = this.contents().filter(
        function() { return (this.nodeType == 3 && !/\S/.test(this.nodeValue)); })
        .remove();
    }

var addSelection, removeSelection1, removeSelection2, logger_count = 0;

var _sel = {
    count: 0,
    savedSel: [],
    savedSelActiveElement: [],
    ranges: {},
    rootNode: 'selectable-content',
    logger: function(str){
        logger_count++;
        $('#logger').append('<p style="font-size:12px;text-align: left;">#'+logger_count+' | '+str+'</p>');
    },
    childs: [],
    updateHash: function(){
        var hash = '';
        for (key in _sel.ranges) { 
            hash += _sel.ranges[key] + ';';
            }
        hash = hash.substring(hash.length-1, 0);
        
        location.hash = 'sel='+hash;
    },
    readHash: function(){
        
        var hash = location.hash;
        ////console.log(hash);
        if (hash == '' || !hash) return;
        
        hash = hash.split('#')[1];
        //console.log(hash);
        //if (hash.substring(0, 3) != 'sel') return;

        hash = hash.substring(4, hash.length);
        //console.log(hash);
        hashAr = hash.split(';');
        //console.log(hashAr);
        
        // восстанавливаем первое выделение + скроллим до него.
        //selection.restoreStamp(hashAr[0], true);
        
        for (var i=0; i < hashAr.length; i++) {
            //console.log('i', i, 'hashAr', hashAr, 'hashAr.length', hashAr.length);
            _sel.restoreStamp(hashAr[i]);
        }
        

        // Вычисляем кол-во px от верха до первого выделенного участка текста, далее - скроллим до этого места.
        var scrollTo = $('.user_selection_true:first').offset().top - 150;
        $('html,body').animate({
            scrollTop:scrollTo
            }, 1500,  "easeInOutQuint");
        

    },
    restoreStamp: function(stamp){
        //scrolled = scrolled || false;
        rangy.deserializeSelection(stamp);
        //console.log('восстанавливаю стамп: ', stamp);
        _sel.tSelection(false);
        _sel.count++;
    },
    upmsg: function(){
        $msg = $('#upmsg-selectable');
        
        if ($.cookie('selectable-warning') == 'notshow') return;
        if ($msg.hasClass('show')) return;
        
        $msg.addClass('show');
        
        clearTimeout(autoclose);
        
        var opacity_start = 0;
        
        if ($.browser.msie) {
            $msg.animate({
                'top': '0px'
            }, { duration: 1000, easing: 'easeOutQuint' });
        } else {
            $msg.animate({
                'top': '0px',
                'opacity': '1'
            }, { duration: 1000, easing: 'easeOutQuint' });
        }
        
        
        function closemsg(){
            if ($.browser.msie) {
                $msg.animate({
                    'top': '-57px'
                }, 500,  "easeInQuint", function(){ 
                    $msg.removeClass('show');
                });
            } else {
                $msg.animate({
                    'top': '-57px',
                    'opacity': opacity_start
                }, 500,  "easeInQuint", function(){ 
                    $msg.removeClass('show');
                });
            }
            clearTimeout(autoclose);
            return false;
        }
        
        var autoclose = setTimeout(closemsg, 10000);
        $('.upmsg_closebtn', $msg).click(function(){
            $.cookie("selectable-warning", 'notshow');
            closemsg();
            return false;
        });
        
    },
    checkSelection: function(sel) {
        sel = sel || rangy.getSelection();
        var checker = sel._ranges[0],
            startDone = false, endDone = false;
        console.log(checker);
        
        if (checker.startOffset > 1) {
            for (var i=0; i<=checker.startOffset; i++) {
                console.log('CORRECTING START OFFSET. Loop #', i, '; Check = "', checker.startContainer.data[checker.startOffset - i], '"');
                if (checker.startContainer.data[checker.startOffset - i] == ' ') {
                    checker.setStart(checker.startContainer, checker.startOffset-i+1);
                    startDone = true;
                    break;
                }
            }
            if (!startDone) {
                checker.setStart(checker.startContainer, checker.startOffset-i+1);
            }
            
        }
        
        if (checker.endOffset < checker.endContainer.data.length) {
            
            for (var i=0; i<checker.endContainer.data.length-checker.endOffset; i++) {
                console.log('CORRECTING END OFFSET. Loop #', i, '; Check = "', checker.endContainer.data[checker.endOffset + i], '"');
                if (checker.endContainer.data[checker.endOffset + i] == ' ') {
                    checker.setEnd(checker.endContainer, checker.endOffset+i);
                    break;
                }
            }
        }
        //sel.setRanges(checker);
        return checker;

    },
    tSelection:function(hash) {
        
        _sel.checkSelection();
        
        // генерируем и сохраняем якоря для выделенного
        _sel.ranges['num'+_sel.count] = rangy.serializeSelection();

        addSelection.toggleSelection();
        $('.user_selection')
                .addClass('user_selection_true')
                .addClass('num'+_sel.count)
                .removeClass('user_selection');

        // сохраняем выделенное
        //console.log('сохраняем выделенное');
        _sel.savedSel['num'+_sel.count] = rangy.saveSelection();
        _sel.savedSelActiveElement['num'+_sel.count] = document.activeElement;
        //console.log(_sel.savedSel['num'+selection.count], _sel.savedSelActiveElement['num'+selection.count]);

        var timeout_hover, timeout_hover_b = false;
        var _this;

        function unhover() { 
            if (timeout_hover_b) $("."+_this.className.split(' ')[1]).removeClass("hover"); 
        }

        $(".num"+_sel.count).mouseover(function(){
            _this = this;
            //console.log($(this), this.classList[1], $("."+this.classList[1]));
            $("."+this.className.split(' ')[1]).addClass('hover');
            timeout_hover_b = false;
            clearTimeout(timeout_hover);
        });

        $(".num"+_sel.count).mouseleave(function(){
            timeout_hover_b = true;
            var timeout_hover = setTimeout(unhover, 2000);
        });

        $('.num'+_sel.count+':last').append('<span class="closewrap"><a href="#" class="txtsel_close"></a></span>');
        
        hash = hash || true;
        if (hash) _sel.updateHash();

        rangy.getSelection().removeAllRanges();
    },
    getFirstRange: function(){
        var sel = rangy.getSelection();
        return sel.rangeCount ? sel.getRangeAt(0) : null;
    },
    restoreSelection: function(selector) {
        if (_sel.savedSel[selector]) {
            rangy.restoreSelection(_sel.savedSel[selector], true);
            //savedSel = null;
            window.setTimeout(function() {
                if (_sel.savedSelActiveElement[selector] && typeof _sel.savedSelActiveElement[selector].focus != "undefined") {
                    _sel.savedSelActiveElement[selector].focus();
                }
            }, 1);
            return true;
        } else {
            return false;
        }
    },
    onlytSelection: function(obj){
        obj.toggleSelection();
    }
}




window.onload = function() {
    
    $('#selectable-content').cleanWhitespace();
    $('#selectable-content *').cleanWhitespace();
    
    rangy.init();
    var range = rangy.createRangyRange();
    $('div.b-entry > p, div.b-entry > div.imp, div.b-entry > div.imp p, div.b-entry blockquote').each(function(){
        range.selectNodeContents(this);
        //$(this).addClass('selectable');
    });
    
    
    $marker = $('#txtselect_marker');
    var textselect_event = true, dontshow = false;
    
    $(document).bind('textselect', function(e) {
        
        if (!textselect_event) return;
        
        
        var nodes = _sel.getFirstRange().getNodes();
        //_sel.logger(nodes);
        
        for (var i=0; i<nodes.length; i++) { 
            if (!$(nodes[i]).parents('#selectable-content').length
                || $(nodes[i]).parents('.user_selection_true').length) { 
                    return; 
                    break; 
                } 
            if (nodes[i].nodeType == 1) {
                if ($(nodes[i]).hasClass('user_selection_true')
                 || $(nodes[i]).hasClass('inpost')
                 || $(nodes[i]).hasClass('b-multimedia')
                 || $(nodes[i]).hasClass('photo')) {
                     //alert('отказ');
                     //console.log('отказ! все из-за ', nodes[i]);
                     return;
                     break;
                 }
            }
        }
        
        window.setTimeout(function(){
            if (!dontshow) {
                $marker.css({'top':e.pageY-33, 'left': e.pageX});
                if ($.browser.msie) {
                    $marker.addClass('show');
                } else {
                    $marker.fadeIn('fast', function(){
                        $marker.addClass('show');
                    });
                }
            }
        }, 1);
        

    });
    
    
    
    $marker.click(function(){
        
        dontshow = true;
        
        _sel.tSelection();
        _sel.count++;
        
        
        
        if ($.browser.msie) {
            $marker.removeClass('show');
            _sel.upmsg();
		    dontshow = false;
        } else {
            $marker.fadeOut('fast', function(){
    		    $(this).removeClass('show');
    		    _sel.upmsg();
    		    dontshow = false;
    		});
        }
		
		return false;
		
    });
    
    $('.closewrap a.txtsel_close').live('click', function(){
        var parent = this.parentNode.parentNode;
        var numclass = parent.className.split(' ')[1];
        $('.'+numclass).removeClass('hover');
        $(this).fadeOut('slow', function(){
            $(this).parent('span.closewrap').remove();
            var res = _sel.restoreSelection(numclass);
            
            if (res == true) {
                ////console.log('res', res);
                removeSelection2.cssClass = numclass;
                _sel.onlytSelection(removeSelection2);
                _sel.onlytSelection(removeSelection1);
                _sel.count = _sel.count - 1;
                delete _sel.ranges[numclass];
                _sel.updateHash();

                rangy.getSelection().removeAllRanges();
            }
        });

        return false;
    });



    



    var cssClassApplierModule = rangy.modules.CssClassApplier;
    if (rangy.supported && cssClassApplierModule && cssClassApplierModule.supported) {
        addSelection = rangy.createCssClassApplier("user_selection", true);
        removeSelection1 = rangy.createCssClassApplier("user_selection_true", true);
        removeSelection2 = rangy.createCssClassApplier("num", true);
    }
    
    $(document).click(function(e){
  		tar = $(e.target);
  		if (tar.attr('id') != 'txtselect_marker') {
  		    dontrun = false;
  		    if($('#txtselect_marker').hasClass('show')){
  		        if ($.browser.msie) {
                    $('#txtselect_marker').removeClass('show');
  		        } else {
  		            $('#txtselect_marker').fadeOut('fast', function(){
          			    $(this).removeClass('show');
          			});
  		        }
      		}
  		}
  	});
  	
    $('body').append('<div id="logger" style="position:fixed; bottom:0; left:0; width: 100%; height: auto; background: white; max-height: 150px; overflow: auto;"></div>');
  	_sel.readHash();
  }

