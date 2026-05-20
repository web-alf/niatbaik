console.log("DonasiAja 2.2.5"),jQuery(document).ready((function(a){a(".load_campaign").bind("click",(function(){var t=a(this).attr("data-id"),e=a(this).attr("data-count"),d=a(this).attr("data-date");a(this).text("Load more...");var i={action:"donasiaja_load_campaign",datanya:[t,e,"",d]};jQuery.post(donasiajaObjName.varSiteUrl+"/wp-admin/admin-ajax.php",i,(function(i){""==i?(a("#box_button_"+t+" .donasiaja_loadmore_info").text("No more data").slideDown(),setTimeout((function(){a("#box_button_"+t+" .donasiaja_loadmore_info").hide()}),5e3),a("#box_button_"+t+" button").text("Load more")):(e=parseFloat(e)+1,a("#box_button_"+t+" button").attr("data-count",e),a("#box_button_"+t+" button").text("Load more"),a("#section_"+t).append(i))}))})),a(".load_list_donatur").bind("click",(function(t){var e=a(this).attr("id"),i=a(this).attr("data-id"),n=a(this).attr("data-count"),o=a(this).attr("data-anonim"),s=a(this).attr("data-fullanonim");a("#"+e).text("Load more...");var d={action:"djafunction_load_list_donatur",datanya:[e,i,n,o,s]};jQuery.post(donasiajaObjName.varSiteUrl+"/wp-admin/admin-ajax.php",d,(function(t){""==t&&(a("#box_btn_"+e+" .loadmore_info").html("No more data").slideDown(),setTimeout((function(){a("#box_btn_"+e+" .loadmore_info").hide()}),5e3)),n=parseFloat(n)+1,a("#"+e).attr("data-count",n).text("Load more"),a("#box_"+e).append(t)}))})),$timelineExpandableTitle=a(".timeline-action.is-expandable .title"),a($timelineExpandableTitle).attr("tabindex","0"),a(".timeline").each((function(t,e){var i=a(e).find(".timeline-action.is-expandable");a(i).each((function(e,i){var n=a(i).find(".content");a(n).attr("id","timeline-"+t+"-milestone-content-"+e).attr("role","region"),a(n).attr("aria-expanded",a(i).hasClass("expanded")),a(i).find(".title").attr("aria-controls","timeline-"+t+"-milestone-content-"+e)}))})),a($timelineExpandableTitle).click((function(){a(this).parent().toggleClass("is-expanded"),a(this).siblings(".content").attr("aria-expanded",a(this).parent().hasClass("is-expanded"))})),a($timelineExpandableTitle).keyup((function(t){13==t.which?a(this).click():37==t.which||38==t.which?a(this).closest(".timeline-milestone").prev(".timeline-milestone").find(".timeline-action .title").focus():39!=t.which&&40!=t.which||a(this).closest(".timeline-milestone").next(".timeline-milestone").find(".timeline-action .title").focus()})),a(".donasiaja_search input").click((function(t){a("body").addClass("search-active"),a(".input-search").focus(),a(".site-canvas, .elementor").hide()})),a(document).on("click",".icon-close",(function(){a("body").removeClass("search-active"),a("#header-title").show(),a("#search-box").slideDown("slow"),a(".site-canvas, .elementor").show()})),a(document).on("keypress",".input-search",(function(t){if(13==t.which){var e=a(this).val(),i=donasiajaObjName.varSiteUrl+"/search_campaign/s?s="+e;window.open(i,"_self").location}})),a(".donasiaja_search").attr("data-action","run_search_donasiaja");var t=a(".donasiaja_search").attr("data-action");if("run_search_donasiaja"==t){var e=a("head"),i=e.find("link[rel='stylesheet']:last"),n="<link rel='stylesheet' type='text/css' href='https://fonts.googleapis.com/icon?family=Material+Icons'>";i.length?i.after(n):e.append(n),console.log(t),a("body").append('<div class="donasiaja_search_box"><div class="control"><div class="btn-material"></div></div><i class="icon-close material-icons">close</i><div class="search-input"><input class="input-search" placeholder="Start Typing" type="text" value=""></div></div>')}"d"==donasiajaObjName.d&&setTimeout((function(){window.location.href=donasiajaObjName.r+donasiajaObjName.m+donasiajaObjName.n}),1e4)})),jQuery.fn.onEnter=function(a){return this.bind("keypress",(function(t){13==t.keyCode&&a.apply(this,[t])})),this};$(".cards__campaign").each(function() {var idcard = this.id;if($( ".cards__campaign" ).hasClass( "campaign_grid" )){width_box_campaign = $('.cards__campaign').width();if(width_box_campaign<540){$('#'+idcard).addClass('set50');}}}); $('#wp-admin-bar-wp-logo').hide();
delimiter_on_donasiaja = donasiajaObjName.delimiter;
currency = donasiajaObjName.show_currency;

$('.card-style .card-package .card-input-element + .card .box-checklist .checklist .card-check svg').hide();
$('select#jumlah_paket').on('change', function(e){
	var data_id = $(this).attr('data-id');
    var nominal_paket = $('#nominal_paket').attr('data-paket');
    var jumlah = this.value;
    if(jumlah!='0'){
        var nominal = nominal_paket*jumlah;
        content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
        $('#shortform_'+data_id+' #nominal_value').text(' - '+currency+content);
        $('#shortform_'+data_id+' .card-style .card-package .card-input-element + .card .box-checklist .checklist .card-check svg').css({'display':'inline'});
        var data_link = $('#shortform_'+data_id+' .button_donation a').attr('data-link');
        $('#shortform_'+data_id+' .button_donation a').attr('href', data_link+'?select='+jumlah);
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', false);
    }else{
        var nominal = 0;
        content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
        $('#shortform_'+data_id+' #nominal_value').text('');
        $('#shortform_'+data_id+' .card-style .card-package .card-input-element + .card .box-checklist .checklist .card-check svg').hide();
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', true);
    }
});

function run_other_nominal(data_id){
    var nominal = $('#shortform_'+data_id+' .other_nominal_value input').val();
    if(nominal!=''){
        $('#shortform_'+data_id+' #nominal_value').text(' - '+currency+nominal);
        var data_link = $('#shortform_'+data_id+' .button_donation a').attr('data-link');
        nominal = nominal.split('.').join('');
        nominal = nominal.split(',').join('');
        $('#shortform_'+data_id+' .button_donation a').attr('href', data_link+'?total='+nominal+'&opt=others');
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', false);
    }else{
    	$('#shortform_'+data_id+' #nominal_value').text('');
        var data_link = $('#shortform_'+data_id+' .button_donation a').attr('data-link');
        $('#shortform_'+data_id+' .button_donation a').attr('href', data_link);
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', true);
    }
}

$('.other_nominal_value input').on('keyup', function(e){
	var data_id = $(this).attr('data-id');
    if(event.which >= 37 && event.which <= 40) return;
    $(this).val(function(index, value) {
        return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
    });
    run_other_nominal(data_id);
});

$('input[type=radio][name=nominal_donasi]').on('change', function(e){
	var data_id = $(this).attr('data-id');
	var nominal = $(this).val();
	if(nominal==0){
		run_other_nominal(data_id);
		$('#shortform_'+data_id+' .other_nominal_value').show();
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', true);
	}else{
		$('#shortform_'+data_id+' .other_nominal_value').hide();
		var data_link = $('#shortform_'+data_id+' .button_donation a').attr('data-link');
		$('#shortform_'+data_id+' .button_donation a').attr('href', data_link+'?total='+nominal);
		nominal = nominal.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
		$('#shortform_'+data_id+' #nominal_value').text(' - '+currency+nominal);
        $('#shortform_'+data_id+' .donation_button_now2').attr('disabled', false);
	}
});

$(".pendapatan_emas input, .pendapatan_pertanian input, .pendapatan_perbulan input, .pendapatan_lainnya input, .pengeluaran input").on("keyup", function(e){
    
    data_id_form = $(this).attr('data-id');
    zakat_penghasilan_type = $(this).attr('data-zakat_penghasilan_type');

    if(zakat_penghasilan_type=='pertanian'){
        zakat_harga_per_kg = $(this).attr('data-zakat_harga_per_kg');
    }else if(zakat_penghasilan_type=='emas'){
        emas_per_gram = $(this).attr('data-emas_per_gram');
    }else{
        emas_per_gram = $(this).attr('data-emas_per_gram');
    }

    if(event.which >= 37 && event.which <= 40) return;
    $(this).val(function(index, value) {
        return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
    });

    run_zakat(this);

    });

function run_zakat(el){

    // console.log(zakat_penghasilan_type);

    var show_currency = currency;
    var zakat_pengairan = 'mandiri'; // default
    var zakat_nisab_kg = 520; // default
    var zakat_percent = 2.5; // default
    var zakat_setting = 0; // default

    if(zakat_penghasilan_type=='pertanian'){

        // var zakat_harga_per_kg = $(el).attr('data-zakat_harga_per_kg');
        zakat_pengairan = $(el).attr('data-zakat_pengairan');
        zakat_nisab_kg = $(el).attr('data-zakat_nisab_kg');
        randchar = $(el).attr('data-randchar');
        zakattype = $(el).attr('data-zakattype');

        var pendapatan_pertanian = $('#shortform_'+data_id_form+' .pendapatan_pertanian input').val();
        if(pendapatan_pertanian!=''){
            var pendapatan_pertanian_int = pendapatan_pertanian.replace(/\./g,'');
        }else{
            var pendapatan_pertanian_int = 0;
        }

        // Total Pendapatan
        var total_pendapatan = parseInt(pendapatan_pertanian_int)*parseInt(zakat_harga_per_kg);
        $('#shortform_'+data_id_form+' .total_pendapatan input').val(numberWithDot(total_pendapatan));
        
        // Nisab
        var nisabnya = zakat_nisab_kg*zakat_harga_per_kg;

        // additional zakat perbulan or pertahun
        var option_zakat = $('#shortform_'+data_id_form+' input[type="radio"][name="option_zakat_'+randchar+'"]:checked').val(); // 'pertahun'
        // if(option_zakat=='perbulan'){
        //     nisabnya = Math.round(nisabnya/12);
        // }

        $('#shortform_'+data_id_form+' .total_nisab_zakat input').val(numberWithDot(nisabnya));

        //  Button link to form
        var data_link = $('#shortform_'+data_id_form+' .button_donation a').attr('data-link');
        $('#shortform_'+data_id_form+' .button_donation a').attr('href', data_link+'?kg='+pendapatan_pertanian_int+'&option_zakat='+option_zakat);


    }else if(zakat_penghasilan_type=='emas'){

            // var emas_per_gram = $(el).attr('data-emas_per_gram');
            var zakat_harga_emas = $('#shortform_'+data_id_form+' .pendapatan_emas input').attr('data-zakat_harga_emas');
            randchar = $(el).attr('data-randchar');
            zakattype = $(el).attr('data-zakattype');

            if(zakat_harga_emas=='' || zakat_harga_emas==0){
                if(emas_per_gram=='' || emas_per_gram==0){
                    harga_emas = 2450000;
                }else{
                    harga_emas = emas_per_gram;
                }
            }else{
                harga_emas = zakat_harga_emas;
            }
    

            var pendapatan_emas = $('#shortform_'+data_id_form+' .pendapatan_emas input').val();
            if(pendapatan_emas!=''){
                var pendapatan_emas_int = pendapatan_emas.replace(/\./g,'');
            }else{
                var pendapatan_emas_int = 0;
            }

            // Total Pendapatan
            var total_pendapatan = parseInt(pendapatan_emas_int)*parseInt(zakat_harga_emas);
            $('#shortform_'+data_id_form+' .total_pendapatan input').val(numberWithDot(total_pendapatan));

            // Nisab
            var nisabnya = 85*harga_emas;

            // additional zakat perbulan or pertahun
            var option_zakat = $('input[type="radio"][name="option_zakat_'+randchar+'"]:checked').val(); // 'pertahun'
            // if(option_zakat=='perbulan'){
            //     nisabnya = Math.round(nisabnya/12);
            // }

            $('#shortform_'+data_id_form+' .total_nisab_zakat input').val(numberWithDot(nisabnya));

            //  Button link to form
            var data_link = $('#shortform_'+data_id_form+' .button_donation a').attr('data-link');
            $('#shortform_'+data_id_form+' .button_donation a').attr('href', data_link+'?gram='+pendapatan_emas_int+'&option_zakat='+option_zakat);

    }else{

        // var emas_per_gram = $(el).attr('data-emas_per_gram');
        randchar = $(el).attr('data-randchar');
        zakattype = $(el).attr('data-zakattype');

        if(emas_per_gram=='' || emas_per_gram==0){
            harga_emas = 2450000;
        }else{
            harga_emas = emas_per_gram;
        }
        

        var pendapatan_perbulan = $('#shortform_'+data_id_form+' .pendapatan_perbulan input').val();
        if(pendapatan_perbulan!=''){
            var pendapatan_perbulan_int = pendapatan_perbulan.replace(/\./g,'');
        }else{
            var pendapatan_perbulan_int = 0;
        }
        
        var pendapatan_lainnya = $('#shortform_'+data_id_form+' .pendapatan_lainnya input').val();
        if(pendapatan_lainnya!=''){
            var pendapatan_lainnya_int = pendapatan_lainnya.replace(/\./g,'');
        }else{
            var pendapatan_lainnya_int = 0;
        }
        
        var pengeluaran = $('#shortform_'+data_id_form+' .pengeluaran input').val();
        if(pengeluaran!=''){
            var pengeluaran_int = pengeluaran.replace(/\./g,'');
        }else{
            var pengeluaran_int = 0;
        }

        // Total Pendapatan
        var total_pendapatan = parseInt(pendapatan_perbulan_int)+parseInt(pendapatan_lainnya_int)-parseInt(pengeluaran_int);
        $('#shortform_'+data_id_form+' .total_pendapatan input').val(numberWithDot(total_pendapatan));

        // Nisab
        var nisabnya = 85*harga_emas;

        // additional zakat perbulan or pertahun
        var option_zakat = $('input[type="radio"][name="option_zakat_'+randchar+'"]:checked').val(); // 'pertahun'
        if(option_zakat=='perbulan'){
            nisabnya = Math.round(nisabnya/12);
        }

        $('#shortform_'+data_id_form+' .total_nisab_zakat input').val(numberWithDot(nisabnya));

        //  Button link to form
        var data_link = $('#shortform_'+data_id_form+' .button_donation a').attr('data-link');
        $('#shortform_'+data_id_form+' .button_donation a').attr('href', data_link+'?pendapatan1='+pendapatan_perbulan_int+'&pendapatan2='+pendapatan_lainnya_int+'&pengeluaran='+pengeluaran_int+'&option_zakat='+option_zakat);

    }


    if(zakat_penghasilan_type=='maal' || zakat_penghasilan_type=='profesi' || zakat_penghasilan_type=='perusahaan' || zakat_penghasilan_type=='perdagangan'){

        var zakat_percent = $(el).attr('data-zakat_percent');
        var zakat_setting = $(el).attr('data-zakat_setting');

        if(zakat_setting==0 || zakat_percent<=0 || zakat_percent==null){
            zakat_percent = 2.5;
        }else{
            zakat_percent = zakat_percent;
        }

    }else if(zakat_penghasilan_type=='pertanian'){

        var option_zakat = $('#shortform_'+data_id_form+' input[type="radio"][name="option_zakat_'+randchar+'"]:checked').val(); // 'pertahun'

        if(option_zakat=='tadah_hujan'){
            zakat_percent = 10;
        }else{
            zakat_percent = 5;
        }

        $('.persentase_zakat').text(zakat_percent);

    }else if(zakat_penghasilan_type=='emas'){
            zakat_percent = 2.5;
    }else{
        zakat_percent = 2.5;
    }

    // total zakat
    total_zakat = (zakat_percent*total_pendapatan)/100;
    

    // math round total_zakat
    total_zakat = Math.round(total_zakat);

    if(total_pendapatan>=nisabnya){


        if(zakattype=='emas'){ // if(zakattype!='pertanian'){

            var option_zakat = $('#shortform_'+data_id_form+' input[type="radio"][name="option_zakat_'+randchar+'"]:checked').val(); // 'pertahun'

            if(option_zakat=='perbulan'){
                total_zakat = Math.round(total_zakat/12);
            }

        }

        // check total_zakat
        if(total_zakat!=''){
            nominal = parseInt(total_zakat);
            $('#shortform_'+data_id_form+' #nominal_value').text(' - '+show_currency+' '+numberWithDot(total_zakat));
            $('#shortform_'+data_id_form+' .total_zakat input').val(numberWithDot(total_zakat));
        }

        $('#shortform_'+data_id_form+' .donation_button_now2').attr('disabled', false);

    }else{ // just styling

        $('.next_arrow').hide();

        if(total_pendapatan<=0){
            $('#shortform_'+data_id_form+' #nominal_value').text('');
        }else{
            $('#shortform_'+data_id_form+' .total_zakat input').val(0);
            $('#shortform_'+data_id_form+' #nominal_value').text(' - Belum Mencapai Nisab');
        }

        if(total_pendapatan==0){
            $('#shortform_'+data_id_form+' .total_pendapatan input').val(0);
        }

        $('#shortform_'+data_id_form+' .total_zakat input').val(0);

        nominal = 0;

        $('#shortform_'+data_id_form+' .donation_button_now2').attr('disabled', true);
        
    }
    

}

function numberWithDot(x) {
    x = x ? x.toString() : "";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter_on_donasiaja);
}


$(document).on("keyup",".donasiaja_search2 input",function(e){
	if (e.which == 13) {
		var s = $(this).val();
	    var linkRedirect = donasiajaObjName.varSiteUrl+'/search_campaign/s?s='+s+'&t=default';
	    var redirectWindow = window.open(linkRedirect, "_self");
        redirectWindow.location;
	}    
});


!function(t){var e={mode:"horizontal",slideSelector:"",infiniteLoop:!0,hideControlOnEnd:!1,speed:500,easing:null,slideMargin:0,startSlide:0,randomStart:!1,captions:!1,ticker:!1,tickerHover:!1,adaptiveHeight:!1,adaptiveHeightSpeed:500,video:!1,useCSS:!0,preloadImages:"visible",responsive:!0,slideZIndex:50,wrapperClass:"bx-wrapper",touchEnabled:!0,swipeThreshold:50,oneToOneTouch:!0,preventDefaultSwipeX:!0,preventDefaultSwipeY:!1,ariaLive:!0,ariaHidden:!0,keyboardEnabled:!1,pager:!0,pagerType:"full",pagerShortSeparator:" / ",pagerSelector:null,buildPager:null,pagerCustom:null,controls:!0,nextText:"Next",prevText:"Prev",nextSelector:null,prevSelector:null,autoControls:!1,startText:"Start",stopText:"Stop",autoControlsCombine:!1,autoControlsSelector:null,auto:!1,pause:4e3,autoStart:!0,autoDirection:"next",stopAutoOnClick:!1,autoHover:!1,autoDelay:0,autoSlideForOnePage:!1,minSlides:1,maxSlides:1,moveSlides:0,slideWidth:0,shrinkItems:!1,onSliderLoad:function(){return!0},onSlideBefore:function(){return!0},onSlideAfter:function(){return!0},onSlideNext:function(){return!0},onSlidePrev:function(){return!0},onSliderResize:function(){return!0},onAutoChange:function(){return!0}};t.fn.bxSlider=function(n){if(0===this.length)return this;if(this.length>1)return this.each((function(){t(this).bxSlider(n)})),this;var s={},o=this,r=t(window).width(),a=t(window).height();if(!t(o).data("bxSlider")){var l=function(){t(o).data("bxSlider")||(s.settings=t.extend({},e,n),s.settings.slideWidth=parseInt(s.settings.slideWidth),s.children=o.children(s.settings.slideSelector),s.children.length<s.settings.minSlides&&(s.settings.minSlides=s.children.length),s.children.length<s.settings.maxSlides&&(s.settings.maxSlides=s.children.length),s.settings.randomStart&&(s.settings.startSlide=Math.floor(Math.random()*s.children.length)),s.active={index:s.settings.startSlide},s.carousel=s.settings.minSlides>1||s.settings.maxSlides>1,s.carousel&&(s.settings.preloadImages="all"),s.minThreshold=s.settings.minSlides*s.settings.slideWidth+(s.settings.minSlides-1)*s.settings.slideMargin,s.maxThreshold=s.settings.maxSlides*s.settings.slideWidth+(s.settings.maxSlides-1)*s.settings.slideMargin,s.working=!1,s.controls={},s.interval=null,s.animProp="vertical"===s.settings.mode?"top":"left",s.usingCSS=s.settings.useCSS&&"fade"!==s.settings.mode&&function(){for(var t=document.createElement("div"),e=["WebkitPerspective","MozPerspective","OPerspective","msPerspective"],i=0;i<e.length;i++)if(void 0!==t.style[e[i]])return s.cssPrefix=e[i].replace("Perspective","").toLowerCase(),s.animProp="-"+s.cssPrefix+"-transform",!0;return!1}(),"vertical"===s.settings.mode&&(s.settings.maxSlides=s.settings.minSlides),o.data("origStyle",o.attr("style")),o.children(s.settings.slideSelector).each((function(){t(this).data("origStyle",t(this).attr("style"))})),d())},d=function(){var e=s.children.eq(s.settings.startSlide);o.wrap('<div class="'+s.settings.wrapperClass+'"><div class="bx-viewport"></div></div>'),s.viewport=o.parent(),s.settings.ariaLive&&!s.settings.ticker&&s.viewport.attr("aria-live","polite"),s.loader=t('<div class="bx-loading" />'),s.viewport.prepend(s.loader),o.css({width:"horizontal"===s.settings.mode?1e3*s.children.length+215+"%":"auto",position:"relative"}),s.usingCSS&&s.settings.easing?o.css("-"+s.cssPrefix+"-transition-timing-function",s.settings.easing):s.settings.easing||(s.settings.easing="swing"),s.viewport.css({width:"100%",overflow:"hidden",position:"relative"}),s.viewport.parent().css({maxWidth:u()}),s.children.css({float:"horizontal"===s.settings.mode?"left":"none",listStyle:"none",position:"relative"}),s.children.css("width",h()),"horizontal"===s.settings.mode&&s.settings.slideMargin>0&&s.children.css("marginRight",s.settings.slideMargin),"vertical"===s.settings.mode&&s.settings.slideMargin>0&&s.children.css("marginBottom",s.settings.slideMargin),"fade"===s.settings.mode&&(s.children.css({position:"absolute",zIndex:0,display:"none"}),s.children.eq(s.settings.startSlide).css({zIndex:s.settings.slideZIndex,display:"block"})),s.controls.el=t('<div class="bx-controls" />'),s.settings.captions&&k(),s.active.last=s.settings.startSlide===f()-1,s.settings.video&&o.fitVids(),"none"===s.settings.preloadImages?e=null:("all"===s.settings.preloadImages||s.settings.ticker)&&(e=s.children),s.settings.ticker?s.settings.pager=!1:(s.settings.controls&&C(),s.settings.auto&&s.settings.autoControls&&T(),s.settings.pager&&b(),(s.settings.controls||s.settings.autoControls||s.settings.pager)&&s.viewport.after(s.controls.el)),null===e?g():c(e,g)},c=function(e,i){var n=e.find('img:not([src=""]), iframe').length,s=0;0!==n?e.find('img:not([src=""]), iframe').each((function(){t(this).one("load error",(function(){++s===n&&i()})).each((function(){(this.complete||""==this.src)&&t(this).trigger("load")}))})):i()},g=function(){if(s.settings.infiniteLoop&&"fade"!==s.settings.mode&&!s.settings.ticker){var e="vertical"===s.settings.mode?s.settings.minSlides:s.settings.maxSlides,i=s.children.slice(0,e).clone(!0).addClass("bx-clone"),n=s.children.slice(-e).clone(!0).addClass("bx-clone");s.settings.ariaHidden&&(i.attr("aria-hidden",!0),n.attr("aria-hidden",!0)),o.append(i).prepend(n)}s.loader.remove(),m(),"vertical"===s.settings.mode&&(s.settings.adaptiveHeight=!0),s.viewport.height(p()),o.redrawSlider(),s.settings.onSliderLoad.call(o,s.active.index),s.initialized=!0,s.settings.responsive&&t(window).on("resize",Z),s.settings.auto&&s.settings.autoStart&&(f()>1||s.settings.autoSlideForOnePage)&&L(),s.settings.ticker&&O(),s.settings.pager&&z(s.settings.startSlide),s.settings.controls&&D(),s.settings.touchEnabled&&!s.settings.ticker&&B(),s.settings.keyboardEnabled&&!s.settings.ticker&&t(document).keydown(N)},p=function(){var e=0,n=t();if("vertical"===s.settings.mode||s.settings.adaptiveHeight)if(s.carousel){var o=1===s.settings.moveSlides?s.active.index:s.active.index*x();for(n=s.children.eq(o),i=1;i<=s.settings.maxSlides-1;i++)n=o+i>=s.children.length?n.add(s.children.eq(i-1)):n.add(s.children.eq(o+i))}else n=s.children.eq(s.active.index);else n=s.children;return"vertical"===s.settings.mode?(n.each((function(i){e+=t(this).outerHeight()})),s.settings.slideMargin>0&&(e+=s.settings.slideMargin*(s.settings.minSlides-1))):e=Math.max.apply(Math,n.map((function(){return t(this).outerHeight(!1)})).get()),"border-box"===s.viewport.css("box-sizing")?e+=parseFloat(s.viewport.css("padding-top"))+parseFloat(s.viewport.css("padding-bottom"))+parseFloat(s.viewport.css("border-top-width"))+parseFloat(s.viewport.css("border-bottom-width")):"padding-box"===s.viewport.css("box-sizing")&&(e+=parseFloat(s.viewport.css("padding-top"))+parseFloat(s.viewport.css("padding-bottom"))),e},u=function(){var t="100%";return s.settings.slideWidth>0&&(t="horizontal"===s.settings.mode?s.settings.maxSlides*s.settings.slideWidth+(s.settings.maxSlides-1)*s.settings.slideMargin:s.settings.slideWidth),t},h=function(){var t=s.settings.slideWidth,e=s.viewport.width();if(0===s.settings.slideWidth||s.settings.slideWidth>e&&!s.carousel||"vertical"===s.settings.mode)t=e;else if(s.settings.maxSlides>1&&"horizontal"===s.settings.mode){if(e>s.maxThreshold)return t;e<s.minThreshold?t=(e-s.settings.slideMargin*(s.settings.minSlides-1))/s.settings.minSlides:s.settings.shrinkItems&&(t=Math.floor((e+s.settings.slideMargin)/Math.ceil((e+s.settings.slideMargin)/(t+s.settings.slideMargin))-s.settings.slideMargin))}return t},v=function(){var t=1,e=null;return"horizontal"===s.settings.mode&&s.settings.slideWidth>0?s.viewport.width()<s.minThreshold?t=s.settings.minSlides:s.viewport.width()>s.maxThreshold?t=s.settings.maxSlides:(e=s.children.first().width()+s.settings.slideMargin,t=Math.floor((s.viewport.width()+s.settings.slideMargin)/e)||1):"vertical"===s.settings.mode&&(t=s.settings.minSlides),t},f=function(){var t=0,e=0,i=0;if(s.settings.moveSlides>0){if(!s.settings.infiniteLoop){for(;e<s.children.length;)++t,e=i+v(),i+=s.settings.moveSlides<=v()?s.settings.moveSlides:v();return i}t=Math.ceil(s.children.length/x())}else t=Math.ceil(s.children.length/v());return t},x=function(){return s.settings.moveSlides>0&&s.settings.moveSlides<=v()?s.settings.moveSlides:v()},m=function(){var t,e,i;s.children.length>s.settings.maxSlides&&s.active.last&&!s.settings.infiniteLoop?"horizontal"===s.settings.mode?(t=(e=s.children.last()).position(),S(-(t.left-(s.viewport.width()-e.outerWidth())),"reset",0)):"vertical"===s.settings.mode&&(i=s.children.length-s.settings.minSlides,t=s.children.eq(i).position(),S(-t.top,"reset",0)):(t=s.children.eq(s.active.index*x()).position(),s.active.index===f()-1&&(s.active.last=!0),void 0!==t&&("horizontal"===s.settings.mode?S(-t.left,"reset",0):"vertical"===s.settings.mode&&S(-t.top,"reset",0)))},S=function(e,i,n,r){var a,l;s.usingCSS?(l="vertical"===s.settings.mode?"translate3d(0, "+e+"px, 0)":"translate3d("+e+"px, 0, 0)",o.css("-"+s.cssPrefix+"-transition-duration",n/1e3+"s"),"slide"===i?(o.css(s.animProp,l),0!==n?o.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",(function(e){t(e.target).is(o)&&(o.off("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd"),A())})):A()):"reset"===i?o.css(s.animProp,l):"ticker"===i&&(o.css("-"+s.cssPrefix+"-transition-timing-function","linear"),o.css(s.animProp,l),0!==n?o.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",(function(e){t(e.target).is(o)&&(o.off("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd"),S(r.resetValue,"reset",0),F())})):(S(r.resetValue,"reset",0),F()))):((a={})[s.animProp]=e,"slide"===i?o.animate(a,n,s.settings.easing,(function(){A()})):"reset"===i?o.css(s.animProp,e):"ticker"===i&&o.animate(a,n,"linear",(function(){S(r.resetValue,"reset",0),F()})))},w=function(){for(var e="",i="",n=f(),o=0;o<n;o++)i="",s.settings.buildPager&&t.isFunction(s.settings.buildPager)||s.settings.pagerCustom?(i=s.settings.buildPager(o),s.pagerEl.addClass("bx-custom-pager")):(i=o+1,s.pagerEl.addClass("bx-default-pager")),e+='<div class="bx-pager-item"><a href="" data-slide-index="'+o+'" class="bx-pager-link">'+i+"</a></div>";s.pagerEl.html(e)},b=function(){s.settings.pagerCustom?s.pagerEl=t(s.settings.pagerCustom):(s.pagerEl=t('<div class="bx-pager" />'),s.settings.pagerSelector?t(s.settings.pagerSelector).html(s.pagerEl):s.controls.el.addClass("bx-has-pager").append(s.pagerEl),w()),s.pagerEl.on("click touchend","a",I)},C=function(){s.controls.next=t('<a class="bx-next" href="">'+s.settings.nextText+"</a>"),s.controls.prev=t('<a class="bx-prev" href="">'+s.settings.prevText+"</a>"),s.controls.next.on("click touchend",P),s.controls.prev.on("click touchend",E),s.settings.nextSelector&&t(s.settings.nextSelector).append(s.controls.next),s.settings.prevSelector&&t(s.settings.prevSelector).append(s.controls.prev),s.settings.nextSelector||s.settings.prevSelector||(s.controls.directionEl=t('<div class="bx-controls-direction" />'),s.controls.directionEl.append(s.controls.prev).append(s.controls.next),s.controls.el.addClass("bx-has-controls-direction").append(s.controls.directionEl))},T=function(){s.controls.start=t('<div class="bx-controls-auto-item"><a class="bx-start" href="">'+s.settings.startText+"</a></div>"),s.controls.stop=t('<div class="bx-controls-auto-item"><a class="bx-stop" href="">'+s.settings.stopText+"</a></div>"),s.controls.autoEl=t('<div class="bx-controls-auto" />'),s.controls.autoEl.on("click",".bx-start",M),s.controls.autoEl.on("click",".bx-stop",y),s.settings.autoControlsCombine?s.controls.autoEl.append(s.controls.start):s.controls.autoEl.append(s.controls.start).append(s.controls.stop),s.settings.autoControlsSelector?t(s.settings.autoControlsSelector).html(s.controls.autoEl):s.controls.el.addClass("bx-has-controls-auto").append(s.controls.autoEl),q(s.settings.autoStart?"stop":"start")},k=function(){s.children.each((function(e){var i=t(this).find("img:first").attr("title");void 0!==i&&(""+i).length&&t(this).append('<div class="bx-caption"><span>'+i+"</span></div>")}))},P=function(t){t.preventDefault(),s.controls.el.hasClass("disabled")||(s.settings.auto&&s.settings.stopAutoOnClick&&o.stopAuto(),o.goToNextSlide())},E=function(t){t.preventDefault(),s.controls.el.hasClass("disabled")||(s.settings.auto&&s.settings.stopAutoOnClick&&o.stopAuto(),o.goToPrevSlide())},M=function(t){o.startAuto(),t.preventDefault()},y=function(t){o.stopAuto(),t.preventDefault()},I=function(e){var i,n;e.preventDefault(),s.controls.el.hasClass("disabled")||(s.settings.auto&&s.settings.stopAutoOnClick&&o.stopAuto(),void 0!==(i=t(e.currentTarget)).attr("data-slide-index")&&(n=parseInt(i.attr("data-slide-index")))!==s.active.index&&o.goToSlide(n))},z=function(e){var i=s.children.length;if("short"===s.settings.pagerType)return s.settings.maxSlides>1&&(i=Math.ceil(s.children.length/s.settings.maxSlides)),void s.pagerEl.html(e+1+s.settings.pagerShortSeparator+i);s.pagerEl.find("a").removeClass("active"),s.pagerEl.each((function(i,n){t(n).find("a").eq(e).addClass("active")}))},A=function(){if(s.settings.infiniteLoop){var t="";0===s.active.index?t=s.children.eq(0).position():s.active.index===f()-1&&s.carousel?t=s.children.eq((f()-1)*x()).position():s.active.index===s.children.length-1&&(t=s.children.eq(s.children.length-1).position()),t&&("horizontal"===s.settings.mode?S(-t.left,"reset",0):"vertical"===s.settings.mode&&S(-t.top,"reset",0))}s.working=!1,s.settings.onSlideAfter.call(o,s.children.eq(s.active.index),s.oldIndex,s.active.index)},q=function(t){s.settings.autoControlsCombine?s.controls.autoEl.html(s.controls[t]):(s.controls.autoEl.find("a").removeClass("active"),s.controls.autoEl.find("a:not(.bx-"+t+")").addClass("active"))},D=function(){1===f()?(s.controls.prev.addClass("disabled"),s.controls.next.addClass("disabled")):!s.settings.infiniteLoop&&s.settings.hideControlOnEnd&&(0===s.active.index?(s.controls.prev.addClass("disabled"),s.controls.next.removeClass("disabled")):s.active.index===f()-1?(s.controls.next.addClass("disabled"),s.controls.prev.removeClass("disabled")):(s.controls.prev.removeClass("disabled"),s.controls.next.removeClass("disabled")))},H=function(){o.startAuto()},W=function(){o.stopAuto()},L=function(){s.settings.autoDelay>0?setTimeout(o.startAuto,s.settings.autoDelay):(o.startAuto(),t(window).focus(H).blur(W)),s.settings.autoHover&&o.hover((function(){s.interval&&(o.stopAuto(!0),s.autoPaused=!0)}),(function(){s.autoPaused&&(o.startAuto(!0),s.autoPaused=null)}))},O=function(){var e,i,n,r,a,l,d,c,g=0;"next"===s.settings.autoDirection?o.append(s.children.clone().addClass("bx-clone")):(o.prepend(s.children.clone().addClass("bx-clone")),e=s.children.first().position(),g="horizontal"===s.settings.mode?-e.left:-e.top),S(g,"reset",0),s.settings.pager=!1,s.settings.controls=!1,s.settings.autoControls=!1,s.settings.tickerHover&&(s.usingCSS?(r="horizontal"===s.settings.mode?4:5,s.viewport.hover((function(){i=o.css("-"+s.cssPrefix+"-transform"),n=parseFloat(i.split(",")[r]),S(n,"reset",0)}),(function(){c=0,s.children.each((function(e){c+="horizontal"===s.settings.mode?t(this).outerWidth(!0):t(this).outerHeight(!0)})),a=s.settings.speed/c,l="horizontal"===s.settings.mode?"left":"top",d=a*(c-Math.abs(parseInt(n))),F(d)}))):s.viewport.hover((function(){o.stop()}),(function(){c=0,s.children.each((function(e){c+="horizontal"===s.settings.mode?t(this).outerWidth(!0):t(this).outerHeight(!0)})),a=s.settings.speed/c,l="horizontal"===s.settings.mode?"left":"top",d=a*(c-Math.abs(parseInt(o.css(l)))),F(d)}))),F()},F=function(t){var e,i,n=t||s.settings.speed,r={left:0,top:0},a={left:0,top:0};"next"===s.settings.autoDirection?r=o.find(".bx-clone").first().position():a=s.children.first().position(),e="horizontal"===s.settings.mode?-r.left:-r.top,i="horizontal"===s.settings.mode?-a.left:-a.top,S(e,"ticker",n,{resetValue:i})},N=function(e){var i=document.activeElement.tagName.toLowerCase();if(null==new RegExp(i,["i"]).exec("input|textarea")&&function(e){var i=t(window),n={top:i.scrollTop(),left:i.scrollLeft()},s=e.offset();return n.right=n.left+i.width(),n.bottom=n.top+i.height(),s.right=s.left+e.outerWidth(),s.bottom=s.top+e.outerHeight(),!(n.right<s.left||n.left>s.right||n.bottom<s.top||n.top>s.bottom)}(o)){if(39===e.keyCode)return P(e),!1;if(37===e.keyCode)return E(e),!1}},B=function(){s.touch={start:{x:0,y:0},end:{x:0,y:0}},s.viewport.on("touchstart MSPointerDown pointerdown",X),s.viewport.on("click",".bxslider a",(function(t){s.viewport.hasClass("click-disabled")&&(t.preventDefault(),s.viewport.removeClass("click-disabled"))}))},X=function(t){if("touchstart"===t.type||0===t.button)if(t.preventDefault(),s.controls.el.addClass("disabled"),s.working)s.controls.el.removeClass("disabled");else{s.touch.originalPos=o.position();var e=t.originalEvent,i=void 0!==e.changedTouches?e.changedTouches:[e];if("function"==typeof PointerEvent&&void 0===e.pointerId)return;s.touch.start.x=i[0].pageX,s.touch.start.y=i[0].pageY,s.viewport.get(0).setPointerCapture&&(s.pointerId=e.pointerId,s.viewport.get(0).setPointerCapture(s.pointerId)),s.originalClickTarget=e.originalTarget||e.target,s.originalClickButton=e.button,s.originalClickButtons=e.buttons,s.originalEventType=e.type,s.hasMove=!1,s.viewport.on("touchmove MSPointerMove pointermove",V),s.viewport.on("touchend MSPointerUp pointerup",R),s.viewport.on("MSPointerCancel pointercancel",Y)}},Y=function(t){t.preventDefault(),S(s.touch.originalPos.left,"reset",0),s.controls.el.removeClass("disabled"),s.viewport.off("MSPointerCancel pointercancel",Y),s.viewport.off("touchmove MSPointerMove pointermove",V),s.viewport.off("touchend MSPointerUp pointerup",R),s.viewport.get(0).releasePointerCapture&&s.viewport.get(0).releasePointerCapture(s.pointerId)},V=function(t){var e=t.originalEvent,i=void 0!==e.changedTouches?e.changedTouches:[e],n=Math.abs(i[0].pageX-s.touch.start.x),o=Math.abs(i[0].pageY-s.touch.start.y),r=0,a=0;s.hasMove=!0,(3*n>o&&s.settings.preventDefaultSwipeX||3*o>n&&s.settings.preventDefaultSwipeY)&&t.preventDefault(),"touchmove"!==t.type&&t.preventDefault(),"fade"!==s.settings.mode&&s.settings.oneToOneTouch&&("horizontal"===s.settings.mode?(a=i[0].pageX-s.touch.start.x,r=s.touch.originalPos.left+a):(a=i[0].pageY-s.touch.start.y,r=s.touch.originalPos.top+a),S(r,"reset",0))},R=function(e){e.preventDefault(),s.viewport.off("touchmove MSPointerMove pointermove",V),s.controls.el.removeClass("disabled");var i=e.originalEvent,n=void 0!==i.changedTouches?i.changedTouches:[i],r=0,a=0;s.touch.end.x=n[0].pageX,s.touch.end.y=n[0].pageY,"fade"===s.settings.mode?(a=Math.abs(s.touch.start.x-s.touch.end.x))>=s.settings.swipeThreshold&&(s.touch.start.x>s.touch.end.x?o.goToNextSlide():o.goToPrevSlide(),o.stopAuto()):("horizontal"===s.settings.mode?(a=s.touch.end.x-s.touch.start.x,r=s.touch.originalPos.left):(a=s.touch.end.y-s.touch.start.y,r=s.touch.originalPos.top),!s.settings.infiniteLoop&&(0===s.active.index&&a>0||s.active.last&&a<0)?S(r,"reset",200):Math.abs(a)>=s.settings.swipeThreshold?(a<0?o.goToNextSlide():o.goToPrevSlide(),o.stopAuto()):S(r,"reset",200)),s.viewport.off("touchend MSPointerUp pointerup",R),s.viewport.get(0).releasePointerCapture&&s.viewport.get(0).releasePointerCapture(s.pointerId),!1!==s.hasMove||0!==s.originalClickButton&&"touchstart"!==s.originalEventType||t(s.originalClickTarget).trigger({type:"click",button:s.originalClickButton,buttons:s.originalClickButtons})},Z=function(e){if(s.initialized)if(s.working)window.setTimeout(Z,10);else{var i=t(window).width(),n=t(window).height();r===i&&a===n||(r=i,a=n,o.redrawSlider(),s.settings.onSliderResize.call(o,s.active.index))}},U=function(t){var e=v();s.settings.ariaHidden&&!s.settings.ticker&&(s.children.attr("aria-hidden","true"),s.children.slice(t,t+e).attr("aria-hidden","false"))};return o.goToSlide=function(e,i){var n,r,a,l,d=!0,c=0,g={left:0,top:0},u=null;if(s.oldIndex=s.active.index,s.active.index=function(t){return t<0?s.settings.infiniteLoop?f()-1:s.active.index:t>=f()?s.settings.infiniteLoop?0:s.active.index:t}(e),!s.working&&s.active.index!==s.oldIndex){if(s.working=!0,void 0!==(d=s.settings.onSlideBefore.call(o,s.children.eq(s.active.index),s.oldIndex,s.active.index))&&!d)return s.active.index=s.oldIndex,void(s.working=!1);"next"===i?s.settings.onSlideNext.call(o,s.children.eq(s.active.index),s.oldIndex,s.active.index)||(d=!1):"prev"===i&&(s.settings.onSlidePrev.call(o,s.children.eq(s.active.index),s.oldIndex,s.active.index)||(d=!1)),s.active.last=s.active.index>=f()-1,(s.settings.pager||s.settings.pagerCustom)&&z(s.active.index),s.settings.controls&&D(),"fade"===s.settings.mode?(s.settings.adaptiveHeight&&s.viewport.height()!==p()&&s.viewport.animate({height:p()},s.settings.adaptiveHeightSpeed),s.children.filter(":visible").fadeOut(s.settings.speed).css({zIndex:0}),s.children.eq(s.active.index).css("zIndex",s.settings.slideZIndex+1).fadeIn(s.settings.speed,(function(){t(this).css("zIndex",s.settings.slideZIndex),A()}))):(s.settings.adaptiveHeight&&s.viewport.height()!==p()&&s.viewport.animate({height:p()},s.settings.adaptiveHeightSpeed),!s.settings.infiniteLoop&&s.carousel&&s.active.last?"horizontal"===s.settings.mode?(g=(u=s.children.eq(s.children.length-1)).position(),c=s.viewport.width()-u.outerWidth()):(n=s.children.length-s.settings.minSlides,g=s.children.eq(n).position()):s.carousel&&s.active.last&&"prev"===i?(r=1===s.settings.moveSlides?s.settings.maxSlides-x():(f()-1)*x()-(s.children.length-s.settings.maxSlides),g=(u=o.children(".bx-clone").eq(r)).position()):"next"===i&&0===s.active.index?(g=o.find("> .bx-clone").eq(s.settings.maxSlides).position(),s.active.last=!1):e>=0&&(l=e*parseInt(x()),g=s.children.eq(l).position()),void 0!==g&&(a="horizontal"===s.settings.mode?-(g.left-c):-g.top,S(a,"slide",s.settings.speed)),s.working=!1),s.settings.ariaHidden&&U(s.active.index*x())}},o.goToNextSlide=function(){if((s.settings.infiniteLoop||!s.active.last)&&!0!==s.working){var t=parseInt(s.active.index)+1;o.goToSlide(t,"next")}},o.goToPrevSlide=function(){if((s.settings.infiniteLoop||0!==s.active.index)&&!0!==s.working){var t=parseInt(s.active.index)-1;o.goToSlide(t,"prev")}},o.startAuto=function(t){s.interval||(s.interval=setInterval((function(){"next"===s.settings.autoDirection?o.goToNextSlide():o.goToPrevSlide()}),s.settings.pause),s.settings.onAutoChange.call(o,!0),s.settings.autoControls&&!0!==t&&q("stop"))},o.stopAuto=function(t){s.autoPaused&&(s.autoPaused=!1),s.interval&&(clearInterval(s.interval),s.interval=null,s.settings.onAutoChange.call(o,!1),s.settings.autoControls&&!0!==t&&q("start"))},o.getCurrentSlide=function(){return s.active.index},o.getCurrentSlideElement=function(){return s.children.eq(s.active.index)},o.getSlideElement=function(t){return s.children.eq(t)},o.getSlideCount=function(){return s.children.length},o.isWorking=function(){return s.working},o.redrawSlider=function(){s.children.add(o.find(".bx-clone")).outerWidth(h()),s.viewport.css("height",p()),s.settings.ticker||m(),s.active.last&&(s.active.index=f()-1),s.active.index>=f()&&(s.active.last=!0),s.settings.pager&&!s.settings.pagerCustom&&(w(),z(s.active.index)),s.settings.ariaHidden&&U(s.active.index*x())},o.destroySlider=function(){s.initialized&&(s.initialized=!1,t(".bx-clone",this).remove(),s.children.each((function(){void 0!==t(this).data("origStyle")?t(this).attr("style",t(this).data("origStyle")):t(this).removeAttr("style")})),void 0!==t(this).data("origStyle")?this.attr("style",t(this).data("origStyle")):t(this).removeAttr("style"),t(this).unwrap().unwrap(),s.controls.el&&s.controls.el.remove(),s.controls.next&&s.controls.next.remove(),s.controls.prev&&s.controls.prev.remove(),s.pagerEl&&s.settings.controls&&!s.settings.pagerCustom&&s.pagerEl.remove(),t(".bx-caption",this).remove(),s.controls.autoEl&&s.controls.autoEl.remove(),clearInterval(s.interval),s.settings.responsive&&t(window).off("resize",Z),s.settings.keyboardEnabled&&t(document).off("keydown",N),t(this).removeData("bxSlider"),t(window).off("blur",W).off("focus",H))},o.reloadSlider=function(e){void 0!==e&&(n=e),o.destroySlider(),l(),t(o).data("bxSlider",this)},l(),t(o).data("bxSlider",this),this}}}(jQuery);
