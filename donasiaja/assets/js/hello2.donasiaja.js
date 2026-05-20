console.log('DonasiAja 2.2.5');
jQuery(document).ready(function($) {

	$(".load_campaign").bind("click", function(){
		var id = $(this).attr('data-id');
		var uid = '';
		var load_count = $(this).attr('data-count');
		$(this).text('Load more...');

		var data_nya = [id, load_count, uid];
	    var data = {
	        "action": "donasiaja_load_campaign",
	        "datanya": data_nya
	    };
	    jQuery.post(donasiajaObjName.varSiteUrl + "/wp-admin/admin-ajax.php", data, function(response) {

	    	if(response==''){
				$('#box_button_'+id+' .donasiaja_loadmore_info').text('No more data').slideDown();
		        setTimeout(function() {
		            $('#box_button_'+id+' .donasiaja_loadmore_info').hide()
		        }, 5000);
		        $('#box_button_'+id+' button').text('Load more');
			}else{
				load_count = parseFloat(load_count)+1;
		        $('#box_button_'+id+' button').attr('data-count', load_count);
		        $('#box_button_'+id+' button').text('Load more');

				$('#section_'+id).append(response);
			}

	    });
	});

	$('.load_list_donatur').bind("click", function(e) {
		var id = $(this).attr('id');
		var campaign_id = $(this).attr('data-id');
		var load_count = $(this).attr('data-count');
		var anonim = $(this).attr('data-anonim');
		var fullanonim = $(this).attr('data-fullanonim');
		$('#'+id).text('Load more...');

		var data_nya = [id, campaign_id, load_count, anonim, fullanonim];
	    var data = {
	        "action": "djafunction_load_list_donatur",
	        "datanya": data_nya
	    };

	    jQuery.post(donasiajaObjName.varSiteUrl + "/wp-admin/admin-ajax.php", data, function(response) {
	    	if(response==''){
				$('#box_btn_'+id+' .loadmore_info').html('No more data').slideDown();
		        setTimeout(function() {
		            $('#box_btn_'+id+' .loadmore_info').hide()
		        }, 5000)
			}
	        
	        load_count = parseFloat(load_count)+1;
	        $('#'+id).attr('data-count', load_count).text('Loadmore');;
			$('#box_'+id).append(response);

	    })

	});


	// expand timeline
	$timelineExpandableTitle = $('.timeline-action.is-expandable .title');
		  
	  $($timelineExpandableTitle).attr('tabindex', '0');
	  
	  // Give timelines ID's
	  $('.timeline').each(function(i, $timeline) {
	    var $timelineActions = $($timeline).find('.timeline-action.is-expandable');
	    
	    $($timelineActions).each(function(j, $timelineAction) {
	      var $milestoneContent = $($timelineAction).find('.content');
	      
	      $($milestoneContent).attr('id', 'timeline-' + i + '-milestone-content-' + j).attr('role', 'region');
	      $($milestoneContent).attr('aria-expanded', $($timelineAction).hasClass('expanded'));
	      
	      $($timelineAction).find('.title').attr('aria-controls', 'timeline-' + i + '-milestone-content-' + j);
	    });
	  });
	  
	  $($timelineExpandableTitle).click(function() {
	    $(this).parent().toggleClass('is-expanded');
	    $(this).siblings('.content').attr('aria-expanded', $(this).parent().hasClass('is-expanded'));
	  });
	  
	  // Expand or navigate back and forth between sections
	  $($timelineExpandableTitle).keyup(function(e) {
	    if (e.which == 13){ //Enter key pressed
	      $(this).click();
	    } else if (e.which == 37 ||e.which == 38) { // Left or Up
	      $(this).closest('.timeline-milestone').prev('.timeline-milestone').find('.timeline-action .title').focus();
	    } else if (e.which == 39 ||e.which == 40) { // Right or Down
	      $(this).closest('.timeline-milestone').next('.timeline-milestone').find('.timeline-action .title').focus();
	    }
	  });


	$(".donasiaja_search input").click(function (e) {
		$('body').addClass('search-active');
	    $('.input-search').focus();
	    $('.site-canvas, .elementor').hide();
	});

	$(document).on("click",".icon-close",function(){
	  	$('body').removeClass('search-active');
	  	$('#header-title').show();
	  	$('#search-box').slideDown('slow');
	  	$('.site-canvas, .elementor').show();
	});

	$(document).on("keypress",".input-search",function(e){
		if (e.which == 13) {
			var s = $(this).val();
		    var linkRedirect = donasiajaObjName.varSiteUrl+'/search_campaign/s?s='+s;
		    var redirectWindow = window.open(linkRedirect, "_self");
	        redirectWindow.location;
		}    
	});
	
	$(".donasiaja_search").attr("data-action", "run_search_donasiaja");
	var check_s = $(".donasiaja_search").attr('data-action');
	if (check_s=='run_search_donasiaja') {
		var $head = $("head");
		var $headlinklast = $head.find("link[rel='stylesheet']:last");
		var linkElement = "<link rel='stylesheet' type='text/css' href='https://fonts.googleapis.com/icon?family=Material+Icons'>";
		if ($headlinklast.length){
		   $headlinklast.after(linkElement);
		}
		else {
		   $head.append(linkElement);
		}
		console.log(check_s);
		$('body').append('<div class="donasiaja_search_box"><div class="control"><div class="btn-material"></div></div><i class="icon-close material-icons">close</i><div class="search-input"><input class="input-search" placeholder="Start Typing" type="text" value=""></div></div>');
	}
	

});

(function($) {
    $.fn.onEnter = function(func) {
        this.bind('keypress', function(e) {
            if (e.keyCode == 13) func.apply(this, [e]);    
        });               
        return this; 
     };
})(jQuery);
		           
