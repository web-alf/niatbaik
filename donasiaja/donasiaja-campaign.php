<?php
	
	set_time_donasiaja();

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_campaign";
    $table_name2 = $wpdb->prefix . "dja_donate";
    $table_name3 = $wpdb->prefix . "dja_users";
    $table_name4 = $wpdb->prefix . "dja_love";
    $table_name5 = $wpdb->prefix . "dja_settings";
    $table_name6 = $wpdb->prefix . "dja_campaign_update";
    $table_name7 = $wpdb->prefix . "dja_aff_code";
    $table_name8 = $wpdb->prefix . "dja_aff_submit";
    $table_name9 = $wpdb->prefix . "users";
    $table_name10 = $wpdb->prefix . "dja_aff_click";

    donasiaja_global_vars();
    $plugin_version = $GLOBALS['donasiaja_vars']['plugin_version'];

    // Check IP User
    check_blocked_ip();

    // Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name5.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');

    $show_currency = donasiaja_currency($currency);
    
    // Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name5.' where type="label_tab" or type="max_love" or type="app_name" or type="login_setting" or type="page_login" or type="anonim_text" or type="page_donate" or type="theme_color" or type="form_text" or type="powered_by_setting" or type="fb_pixel" or type="fb_event" or type="gtm_id" or type="limitted_donation_button" or type="tiktok_pixel" or type="fundraiser_on" or type="fundraiser_text" or type="fundraiser_button" or type="readmore_description" or type="metapixel_only" or type="metapixel_convertion" or type="metapixel_convertion_data" or type="user_bywa" or type="baznas_referral_code" or type="flying_button_settings" or type="flying_button_bubble_text" or type="flying_button_message" or type="flying_button_number" or type="flying_button_page_settings" or type="data_fundraiser_settings" ORDER BY id ASC');
    $label_tab 	 = $query_settings[0]->data;
    $max_love 	 = $query_settings[1]->data;
    $app_name	 = $query_settings[2]->data;
    $login_setting 	= $query_settings[3]->data;
    $page_login 	= $query_settings[4]->data;
    $anonim_text = $query_settings[5]->data;
    $page_donate = $query_settings[6]->data;
    $general_theme_color = json_decode($query_settings[7]->data, true);
    $form_text 	 = json_decode($query_settings[8]->data, true);
    $powered_by_setting = $query_settings[9]->data;
    $fb_pixel 	 = $query_settings[10]->data;
    $fb_event  	 = json_decode($query_settings[11]->data, true);
    $event_1   	 = $fb_event['event'][0];
    $event_2   	 = $fb_event['event'][1];
    $event_3   	 = $fb_event['event'][2];
    if(isset($fb_event['event'][3])){
        $event_4  = $fb_event['event'][3];
    }else{
        $event_4  = '';
    }
    $gtm_id 	 = $query_settings[12]->data;
    $limitted_donation_button = $query_settings[13]->data;
    $tiktok_pixel = $query_settings[14]->data;
    $fundraiser_on 		= $query_settings[15]->data;
    $fundraiser_text 	= $query_settings[16]->data;
    $fundraiser_button 	= $query_settings[17]->data;
    $readmore_description = $query_settings[18]->data;
    $metapixel_only 			= $query_settings[19]->data;
    $metapixel_convertion 		= $query_settings[20]->data;
    $metapixel_convertion_data 	= $query_settings[21]->data;
    // $user_bywa 					= $query_settings[22]->data;
    $baznas_referral_code 		= $query_settings[23]->data;
    $flying_button_settings        = $query_settings[24]->data;
    $flying_button_bubble_text     = $query_settings[25]->data;
    $flying_button_message         = $query_settings[26]->data;
    $flying_button_number          = $query_settings[27]->data;
	$flying_button_page_settings   = $query_settings[28]->data;
	$data_fundraiser_settings      = $query_settings[29]->data;

    $flying_button_page_settings  = json_decode($flying_button_page_settings, true);
    if (
        is_array($flying_button_page_settings) &&
        isset($flying_button_page_settings['settings']) &&
        is_array($flying_button_page_settings['settings'])
    ) {
        $page_campaign_button = $flying_button_page_settings['settings'][0] ?? null;
        $page_form_button     = $flying_button_page_settings['settings'][1] ?? null;
        $page_invoice_button  = $flying_button_page_settings['settings'][2] ?? null;
    } else {
        // Fallback default value kalau JSON tidak valid / kosong
        $page_campaign_button = null;
        $page_form_button     = null;
        $page_invoice_button  = null;
    }

    // for check update -> user_bywa
    if(isset($query_settings[22]->data)) { 
       // aman, data ada artinya sudah terinstall update terbaru
    } else { 
        // start install
        dja_options_install();
        dja_options_install_data();
    } 

    // meta pixel only - general
    if($metapixel_only=='1'){
    	$fb_pixel  = $fb_pixel;
    }

    if($metapixel_only==null){
    	$fb_pixel  = $fb_pixel;
    }

    // meta pixel convertion - general
    if($metapixel_convertion=='1'){
    	if($metapixel_convertion_data!=''){
	        $metapixel_convertion_data = json_decode($metapixel_convertion_data, true);
	        $jumlah_pixel = $metapixel_convertion_data['jumlah'];
	    }else{
	        $jumlah_pixel = 0;
	    }
	    
	    $fb_pixel_convertion = '';
	    if($jumlah_pixel>=1){
	        $count_pixel = 1;
	        foreach ($metapixel_convertion_data['data'] as $key => $value) {
	        	if($count_pixel==$jumlah_pixel){
	        		$fb_pixel_convertion .= $value[0];
	        	}else{
	        		$fb_pixel_convertion .= $value[0].',';
	        	}
	        	$count_pixel++;
	        }
	    }
	    $fb_pixel = $fb_pixel_convertion;
    }

    // set the color
    $theme_color 		= $general_theme_color['color'][0];
	$progressbar_color  = $general_theme_color['color'][1];
	$button_color 		= $general_theme_color['color'][2];

	if($button_color==''){
		$button_color = '#7680ff';
	}

	$text1 = $form_text['text'][0];
	$text2 = $form_text['text'][1];
	$text3 = $form_text['text'][2];
	$text4 = $form_text['text'][3];

	$slug = $donasi_id;
	$check = $wpdb->get_results('SELECT id from '.$table_name.' where slug="'.$slug.'"');
	if($check==null){
		$check2 = $wpdb->get_results('SELECT id, slug from '.$table_name.' where campaign_id="'.$slug.'"');
		$slug = $check2[0]->slug;
		if($check2==null){
			wp_redirect( get_site_url() );
			exit;
		}
	}

	// **********************
	// GET DATA CAMPAIGN
	// **********************
	$row = $wpdb->get_results('SELECT * from '.$table_name.' where slug="'.$slug.'"')[0];

    if($row->pixel_status=='1'){
	    // fb event
	    $fb_event  = json_decode($row->fb_event, true);
	    $event_1   = $fb_event['event'][0];
	    $event_2   = $fb_event['event'][1];
	    $event_3   = $fb_event['event'][2];
	    if(isset($fb_event['event'][3])){
	        $event_4  = $fb_event['event'][3];
	    }else{
	        $event_4  = '';
	    }
	}

    // meta pixel only
    if($row->pixel_status=='1' and $row->metapixel_only=='1'){
    	$fb_pixel  = $row->fb_pixel;
    }
    
    // kondisi untuk yang baru update ke 1.8 agar fb pixel tetap ke firing
    if($row->pixel_status=='1' and $row->metapixel_only==null){
        $fb_pixel  = $row->fb_pixel;
    }

    // meta pixel and convertion
    if($row->pixel_status=='1' and $row->metapixel_convertion=='1'){

	    if($row->metapixel_convertion_data!=''){
	        $metapixel_convertion_data = json_decode($row->metapixel_convertion_data, true);
	        $jumlah_pixel = $metapixel_convertion_data['jumlah'];
	    }else{
	        $jumlah_pixel = 0;
	    }
	    
	    $fb_pixel_convertion = '';
	    if($jumlah_pixel>=1){
	        $count_pixel = 1;
	        foreach ($metapixel_convertion_data['data'] as $key => $value) {
	        	// echo $value[0].'<br>';
	        	// echo $value[1].'<br>';
	        	if($count_pixel==$jumlah_pixel){
	        		$fb_pixel_convertion .= $value[0];
	        	}else{
	        		$fb_pixel_convertion .= $value[0].',';
	        	}
	        	$count_pixel++;
	        }
	    }

	    $fb_pixel = $fb_pixel_convertion;

    }

    if($row->gtm_status=='1'){
    	$gtm_id  = $row->gtm_id;
    }
    if($row->tiktok_status=='1'){
    	$tiktok_pixel  = $row->tiktok_pixel;
    }

    $general_status = $row->general_status;
    $allocation_title = $row->allocation_title;
    $allocation_others_title = $row->allocation_others_title;
    if($general_status=='1'){
        if($allocation_title=='1' || $allocation_title=='0'){
            $allocation_title = 'Donasi';
        }elseif($allocation_title=='2'){
            $allocation_title = 'Zakat';
        }elseif($allocation_title=='3'){
            $allocation_title = 'Qurban';
        }elseif($allocation_title=='4'){
            $allocation_title = 'Infaq';
        }elseif($allocation_title=='5'){
            $allocation_title = 'Wakaf';
        }else{
            $allocation_title = $allocation_others_title;
        }
    }else{
        $allocation_title = 'Donasi';
    }

    // button zakat
    if($row->form_type=='4' || $row->form_type=='7'){
        $text1 = 'Zakat Sekarang';
    }else{
        $text1 = $allocation_title.' Sekarang';
    }
    if (strpos(strtolower($allocation_title), 'wakaf') !== false ) {
        $text1 = 'Wakaf Sekarang';
    }

    if($row->form_status=='1'){
        $form_text   = json_decode($row->form_text, true);
        $text1 = $form_text['text'][0];
        $text2 = $form_text['text'][1];
        $text3 = $form_text['text'][2];
        $text4 = $form_text['text'][3];
    }

    if($general_status=='1'){
	    $donatur_name = $row->donatur_name;
	    $donatur_others_name = $row->donatur_others_name;
	    if($donatur_name==1 || $donatur_name==0){
	        if($currency=='MYR'){
				$donatur_title = "Penderma";
			}else{
				$donatur_title = "Donatur";
			}
	    }elseif($donatur_name==2){
	        $donatur_title = "Muzakki";
	    }elseif($donatur_name==3){
	        $donatur_title = "Wakif";
	    }else{
	        $donatur_title = $donatur_others_name;
	        if($donatur_title==''){
	        	$donatur_title = "Donatur";
	        }
	    }
	}else{
		if($currency=='MYR'){
			$donatur_title = "Penderma";
		}else{
			$donatur_title = "Donatur";
		}
	}

	if($general_status=='1'){
		if($row->home_icon_url!=''){
			$home_urlnya = $row->home_icon_url;
		}else{
			$home_urlnya = get_site_url();
		}
	}else{
		$home_urlnya = get_site_url();
	}

	// GET HOME ICON
	$home_icon = '1';
    if($general_status=='1'){
    	if($row->icon_setting!=''){
	    	$icon_setting = json_decode($row->icon_setting, true);
	        $home_icon = $icon_setting['home_icon'];
    	}
    }


	// check campaign is published or not
	if($link_code=='campaign'){
		if($row->publish_status=='1' || $row->publish_status=='4'){
		}else{
			wp_redirect( get_site_url() );
			exit;
		}
	}


	// custom whatsapp flying button
	$flying_button_status = $row->flying_button_status;
	if($flying_button_status=='1'){
		$flying_button_settings        = $row->flying_button_settings;
	    $flying_button_bubble_text     = $row->flying_button_bubble_text;
	    $flying_button_message         = $row->flying_button_message;
	    $flying_button_number          = $row->flying_button_number;
		$flying_button_page_settings   = $row->flying_button_page_settings;

	    $flying_button_page_settings  = json_decode($flying_button_page_settings, true);
	    if (
	        is_array($flying_button_page_settings) &&
	        isset($flying_button_page_settings['settings']) &&
	        is_array($flying_button_page_settings['settings'])
	    ) {
	        $page_campaign_button = $flying_button_page_settings['settings'][0] ?? null;
	        $page_form_button     = $flying_button_page_settings['settings'][1] ?? null;
	        $page_invoice_button  = $flying_button_page_settings['settings'][2] ?? null;
	    } else {
	        // Fallback default value kalau JSON tidak valid / kosong
	        $page_campaign_button = null;
	        $page_form_button     = null;
	        $page_invoice_button  = null;
	    }
	}
	

	// GET CAMPAIGN UPDATE
	$campaign_update = $wpdb->get_results("SELECT * FROM $table_name6 where campaign_id='$row->campaign_id' ORDER BY id DESC");

	// GET TOTAL DONASI
	$total_donasi = $wpdb->get_results("SELECT SUM(nominal) as total, COUNT(id) as jumlah FROM $table_name2 where campaign_id='$row->campaign_id' and status='1' ")[0];

	// target : 0 = unlimitted target
	if($row->target==0){
		$persen = 100;
		$persen_width = 100;
	}else{
		$persen = ($total_donasi->total/$row->target)*100;
		$persen_width = ($total_donasi->total/$row->target)*100;
		if($persen_width>100){
			$persen_width = 100;
		}
	}

	// GET INFORMATION

	// print_r($row->information);
	
	$information = str_replace(': center', ':center', $row->information);
	$information = str_replace(': justify', ':justify', $information);
	$information = str_replace(': left', ':left', $information);
	$information = str_replace(': #', ':#', $information);
	$information = str_replace("'", "&#39;", $information); // petik 1
    // $information = str_replace('"', "&#34;", $information); // petik 2
    $information = str_replace('../wp-content', get_site_url().'/wp-content', $information);
    // $information = str_replace('"', '', $information);

    // $information = $row->information;
    // print_r($information);
    
	$information_for_head = substr($information, 0, 450);

	// GER ORANG YANG DONASI TERBARU
	$donasi = $wpdb->get_results("SELECT * FROM $table_name2 where campaign_id='$row->campaign_id' and status='1' ORDER BY id DESC limit 0,5 ");

	// GER ORANG YANG DONASI TERBESAR
	$donasi2 = $wpdb->get_results("SELECT * FROM $table_name2 where campaign_id='$row->campaign_id' and status='1' ORDER BY nominal DESC limit 0,5 ");

	// GER ORANG YANG DONASI ADA KOMENNYA
	$donasi_comment = $wpdb->get_results("SELECT * FROM $table_name2 where campaign_id='$row->campaign_id' and status='1' and comment!='' ORDER BY id DESC limit 0,5 ");

	$data_comment = $wpdb->get_results("SELECT COUNT(id) as jumlah FROM $table_name2 where campaign_id='$row->campaign_id' and status='1' and comment!=''  ")[0];

	// GET DATA USER
	$user_info = get_userdata($row->user_id);
  	$fullname = $user_info->first_name.' '.$user_info->last_name;
  	$fullname = wp_strip_all_tags($fullname);

  	// GET CURRENT URL
  	$home_url = get_site_url();
  	if($link_code=='campaign'){
		$current_url = get_site_url().'/campaign/'.$slug;
	}else{
		$current_url = get_site_url().'/preview/'.$slug;
	}

	// GET PROFILE PICTURE
	$profile = $wpdb->get_results('SELECT user_pp_img as photo, user_type, user_verification, user_randid  from '.$table_name3.' where user_id="'.$row->user_id.'"');
	if(isset($profile[0])){
		if($profile==null){
			$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
		}else{
			$profile_photo = $profile[0]->photo;
			if($profile_photo==null){
				$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
			}
		}
	}else{
		$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
	}

	// print_r($profile);

	// Waktu Berakhir
    $date_now = date('Y-m-d');
    $datetime1 = new DateTime($date_now);
    // $datetime2 = new DateTime($row->end_date);
    if (!empty($row->end_date)) {
        $datetime2 = new DateTime($row->end_date);
    } else {
        // Handle null end_date: set $datetime2 to $datetime1 or a default future date
        $datetime2 = new DateTime('9999-12-31'); // You can use any default future date
    }
    $hasil = $datetime1->diff($datetime2);
    
    $year = $hasil->y;
    $month = $hasil->m;
    $day = $hasil->d;

    // Date
    $date_end = false;
    if($year!=0){
        if($day>7){
    		$sisa_waktu = $year.'&nbsp;tahun,&nbsp;' .($month+1).'&nbsp;bulan&nbsp;lagi';
    	}else{
    		$sisa_waktu = $year.'&nbsp;tahun,&nbsp;' .$month.'&nbsp;bulan&nbsp;lagi';
    	}
    }else{
        if($month!=0){
            $sisa_waktu = $month.'&nbsp;bulan,&nbsp;' .$day.'&nbsp;hari&nbsp;lagi';
        }else{
            if($day==0 && $hasil->days==0){
                $sisa_waktu = 'hari&nbsp;ini';
            }else{
                if($hasil->invert==true){
                    $sisa_waktu = '<span style="color:#ff6b24;font-style:italic;">sudah&nbsp;berakhir</span>';
                    $date_end = true;
                }else{
                    $sisa_waktu = $day.'&nbsp;hari&nbsp;lagi';
                }
                
            }
        }
    }

    if($row->end_date==null){
    	$sisa_waktu = '∞&nbsp;hari&nbsp;lagi';
    }

    if($hasil->invert==true){
    	$sisa_waktu = '<span style="color:#ff6b24;font-style:italic;">sudah&nbsp;berakhir</span>';
    }

    if($row->publish_status=='3'){
    	$sisa_waktu = '<span style="color:#ff6b24;font-style:italic;">Archived</span>';
    }

    // Settings Socialproof
    $query_settings2 = $wpdb->get_results('SELECT data from '.$table_name5.' where type="anonim_text" or type="socialproof_text" or type="socialproof_settings" ORDER BY id ASC');
    $anonim_text    	  = $query_settings2[0]->data;
    $socialproof_text     = $query_settings2[1]->data;
    $socialproof_settings = $query_settings2[2]->data;

    $socialproof_setting  = json_decode($socialproof_settings, true);
	$popup_style ='rounded';
	$delay = 8;
	$data_load = 10;
	$time_set = 1;
    if($socialproof_setting!=''){
		$popup_style    = $socialproof_setting['settings'][0];
		$position       = $socialproof_setting['settings'][1];
		$time_set       = $socialproof_setting['settings'][2];
		$delay          = $socialproof_setting['settings'][3];
		$data_load      = $socialproof_setting['settings'][4];
	}
    

    // close
    $close = 'false';

    // popup_style
    if($popup_style=='rounded'){
        $set_style = ' s-rounded';
    }elseif($popup_style=='flying_boxed'){
        $set_style = ' s-flying';
    }elseif($popup_style=='flying_rounded'){
        $set_style = ' s-rounded s-flying';
    }else{
        $set_style = '';
    }

    // delay
    $delay = $delay*1000;

    // data_load
    $total = $data_load;

    // time
    $time = $time_set;

    // title
    $title = $socialproof_text;

    // position
    $p_gravity = 'top';
    $p_position = 'left';
    if($socialproof_setting!=''){
	    $position_data = explode('_', $position);
		$p_gravity  = $position_data[0];
		$p_position = $position_data[1];
	}

	// set custom campaign socialproof
	if($row->socialproof_text!=''){
		$title = $row->socialproof_text;
	}

	if($row->socialproof_position!=''){
		$position_data_new = explode('_', $row->socialproof_position);
		$p_gravity  = $position_data_new[0];
		$p_position = $position_data_new[1];
	}

	// campaign
	$data_donasi = $wpdb->get_results("SELECT a.id, a.campaign_id, a.user_id, a.invoice_id, a.name, a.anonim, a.created_at, a.nominal as total, b.title, c.user_pp_img FROM $table_name2 a
	left JOIN $table_name b ON b.campaign_id = a.campaign_id
	left JOIN $table_name3 c ON c.user_id = a.user_id
	where a.status='1' and a.campaign_id='$row->campaign_id' ORDER BY id DESC LIMIT 0,$total ");

	$data_donasinya = '';
	foreach ($data_donasi as $value) {
		
		$donatur_name = $value->name;
		if($value->anonim=='1'){
			$donatur_name = $anonim_text;
		}
		$donatur_name = wp_strip_all_tags($donatur_name);

		// if(strpos($title, '{campaign_title}') !== false) {
		//     $title = str_replace("{campaign_title}", $value->title, $title);
		// }

		// if(strpos($title, '{total}') !== false) {
		//     $title = str_replace("{total}", $show_currency.number_format_currency($value->total), $title);
		// }

		$data_field = array();
	    $data_field[ '{campaign_title}' ] = $value->title;
	    $data_field[ '{total}' ] = $show_currency.number_format_currency($value->total);
	   
		$titlenya = strtr($title, $data_field);

		$pp = '';
		if($value->user_pp_img!=''){
			$pp = $value->user_pp_img;
		}

		$the_time = donasiaja_readtime($value->created_at);

		$donatur_name = str_replace("'",'',$donatur_name);
		$donatur_name = str_replace('"','',$donatur_name);

		$title_campaign = str_replace("'",'',$titlenya);
		$title_campaign = str_replace('"','',$title_campaign);
		
		$data_donasinya .= '{"content": ["'.$donatur_name.'", "'.$the_time.'", "'.$title_campaign.'", "'.$pp.'", "'.$value->campaign_id.'"]},';
	}

	$id_login = wp_get_current_user()->ID;

	$aff_code = '';
	if($id_login!=null){
		$rows_aff = $wpdb->get_results("SELECT aff_code from $table_name7 where campaign_id='$row->campaign_id' and user_id='$id_login' ORDER BY id DESC");
		if($rows_aff!=null){
			$aff_code = $rows_aff[0]->aff_code;
		}
	}


	$get_fundraiser = $wpdb->get_results("SELECT a.campaign_id, c.user_id as fundraiser_id, count(a.id) as jumlah_donatur, sum(b.nominal) as total
	FROM $table_name8 a 
	LEFT JOIN $table_name7 c on c.id = a.affcode_id 
	LEFT JOIN $table_name2 b on b.id = a.donate_id 
	where a.campaign_id='$row->campaign_id' and b.status = '1'
	GROUP BY fundraiser_id ORDER BY total DESC limit 0,5");

	$all_fundraiser = $wpdb->get_results("SELECT a.campaign_id, c.user_id as fundraiser_id, count(a.id) as jumlah_donatur, sum(b.nominal) as total
	FROM $table_name8 a 
	LEFT JOIN $table_name7 c on c.id = a.affcode_id 
	LEFT JOIN $table_name2 b on b.id = a.donate_id 
	where a.campaign_id='$row->campaign_id' and b.status = '1'
	GROUP BY fundraiser_id ORDER BY total DESC");

	$hex = $button_color;
	list($r, $g, $b) = sscanf($hex, "#%02x%02x%02x");
	$colornya = 'rgba('.$r.','.$g.','.$b.', 0.15)';
	$colornya_soft = 'rgba('.$r.','.$g.','.$b.', 0.04)';
	$color_hovernya = 'rgba('.$r.','.$g.','.$b.', 0.25)';



	// affcode
	$aff_ip = donasiaja_getIP();
    $aff_os = donasiaja_getOS();
    $aff_browser = donasiaja_getBrowser();

    if (strpos($affcode, '&') !== false ) {
		$get_affcode = explode('&',$affcode);
		$get_affcode = $get_affcode[0];
	}else{
		$get_affcode = $affcode;
	}

	if (strpos($get_affcode, 'ref=') !== false ) {
		$data_affcode = explode('ref=',$get_affcode);
		$data_affcode = $data_affcode[1];
	}else{
		$data_affcode = '';
	}

	$link_ref_aff = '';
	$affcode_id = '';
    if($data_affcode!=''){
    	// get aff_code
    	$check_affcode = $wpdb->get_results('SELECT * from '.$table_name7.' where aff_code="'.$data_affcode.'" ');
    	if($check_affcode!=null){
    		$affcode_id = $check_affcode[0]->id;
    		// $link_ref_aff = "?ref=$data_affcode";
    		$link_ref_aff = "?".$affcode;
    		
    		list ( $y, $m, $d ) = explode('.', date('Y.m.d'));
    		$today_start = mktime(0, 0, 0, $m, $d, $y);
			$today_end   = mktime(23, 59, 59, $m, $d, $y);
    		$check_log = $wpdb->get_results("SELECT * from $table_name10 where campaign_id='$row->campaign_id' and affcode_id='$affcode_id' and ip='$aff_ip' and os='$aff_os' and browser='$aff_browser' and created_at >= CURDATE()");
    		if($check_log==null){
    			// insert log
    			$wpdb->insert( $table_name10,
		            array(
		                'campaign_id'   => $row->campaign_id,
		                'affcode_id'    => $affcode_id,
		                'ip'    		=> $aff_ip,
		                'os'    		=> $aff_os,
		                'browser'    	=> $aff_browser,
		                'created_at'    => date("Y-m-d H:i:s")),
		            array('%s', '%s')       
		        );
    		}
    	}else{
    		// link tanpa dengan aff code tapi aff code gak valid, jadi aff code tidak diteruskan
    		$data_link = explode($data_affcode.'&',$affcode);
			$data_link_selanjutnya = $data_link[1] ?? '';

    		$link_ref_aff = "?".$data_link_selanjutnya;
    	}
    }else{
    	// link tanpa aff code
    	$link_ref_aff = "?".$affcode;
    }


    // {
    	// "link1":["0","zakat sekarang"],
    	// "link2":["1","Hubungi CS","6281320139386","text"],
    	// "link3":["0","Hubungi Admin","link"]
	// }

    $external_link = '';
    $option_baznasjabar_link = 0;
    $option_whatsapp_link = 0;
    $option_custom_link = 0;
    if (!empty($row->external_link_button)) {

        $external_link_button = $row->external_link_button;

        $external_link_data = json_decode($row->external_link_data, true);

        if (is_array($external_link_data)) {

            foreach($external_link_data as $key => $value){

                if($key=='link1'){
                    $option_baznasjabar_link = $value[0];
                    $baznasjabar_button = $value[1];
                    
                }
                if($key=='link2'){
                    $option_whatsapp_link = $value[0];
                    $whatsapp_button = $value[1];
                    $whatsapp_number = $value[2];
                    $whatsapp_text = $value[3];
                }
                if($key=='link3'){
                    $option_custom_link = $value[0];
                    $custom_button = $value[1];
                    $custom_link = $value[2];
                }
            }

        }else{
            $option_baznasjabar_link = 1;
            $option_whatsapp_link = 0;
            $option_custom_link = 0;
        }


        // Set Button and Link
        if($option_baznasjabar_link=='1'){
        	$text1 = $baznasjabar_button;
        	$external_link = 'https://baznasjabar.org/zakat?ref='.$baznas_referral_code;
        }
        if($option_whatsapp_link=='1'){
        	$text1 = $whatsapp_button;

        	$phone = djaPhoneFormat($whatsapp_number,$currency);

        	$message = dja_whatsapp_format($whatsapp_text);
			$message = str_replace("\\", '', $message);
			$message = str_replace("&#39;", "'", $message);
			$message = strip_tags($message);

        	$external_link = 'https://api.whatsapp.com/send?phone='.$phone.'&text='.$message;
        }
        if($option_custom_link=='1'){
        	$text1 = $custom_button;
        	$external_link = $custom_link;
        }

    }

    

?>
<!-- Powered by DonasiAja.id -->
<!DOCTYPE html>
<html lang="en-US">
<head>
	<title><?php echo get_langArray('f_campaign_title1');?> - <?php echo $row->title.' | '.$app_name; ?></title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
	<meta name="application-name" content="<?php echo $current_url; ?>"/>
	<meta name="title" content="<?php echo $row->title; ?>">
	<meta name="description" content="<?php echo strip_tags($information_for_head); ?>">
	<meta property="og:url" content="<?php echo $current_url; ?>" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="<?php echo $row->title; ?>" />
	<meta property="og:description" content="<?php echo strip_tags($information_for_head); ?>" />
<?php if($row->image_url!=null){?>
	<meta property="og:image" content="<?php echo $row->image_url; ?>" />
<?php }else{?>
	<meta property="og:image" content="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" />
<?php } ?>
	<meta property="twitter:card" content="summary_large_image">
	<meta property="twitter:url" content="<?php echo $current_url; ?>">
	<meta property="twitter:title" content="<?php echo $row->title; ?>">
	<meta property="twitter:description" content="<?php echo strip_tags($information_for_head); ?>">
	<?php if($row->image_url!=null){?>
	<meta property="twitter:image" content="<?php echo $row->image_url; ?>" />
<?php }else{?>
	<meta property="twitter:image" content="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" />
<?php } ?>
	<?php dja_set_favicon(); ?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja.css?ver='.$GLOBALS['donasiaja_vars']['plugin_version'].'';?>">
	<style type="text/css">
		a:active,a:focus,a:visited{box-shadow:none!important;outline:none;box-shadow:0 4px 15px 0 rgba(0,0,0,.1)}.loc_name{margin-top: -20px;padding-left: 25px;font-size: 13px;color: #a3aab0;}.d_map:hover .loc_name{color:#2196F3!important;transition:all 0.25s ease-in-out}.fancy-button{margin:auto;position:relative}.frills,.frills:after,.frills:before{position:absolute;background:#eb1f48;border-radius:4px;height:4px}.frills:after,.frills:before{content:"";display:block}.frills:before{bottom:15px}.frills:after{top:15px}.left-frills{right:180px;top:0}.active .left-frills{-webkit-animation:move-left 0.38s ease-out,width-to-zero 0.38s ease-out;animation:move-left 0.38s ease-out,width-to-zero 0.38s ease-out}.left-frills:before,.left-frills:after{left:15px}.active .left-frills:before{-webkit-animation:width-to-zero 0.38s ease-out,move-up 0.38s ease-out;animation:width-to-zero 0.38s ease-out,move-up 0.38s ease-out}.active .left-frills:after{-webkit-animation:width-to-zero 0.38s ease-out,move-down 0.38s ease-out;animation:width-to-zero 0.38s ease-out,move-down 0.38s ease-out}.right-frills{left:40px;top:0}.active .right-frills{-webkit-animation:move-right 0.38s ease-out,width-to-zero 0.38s ease-out;animation:move-right 0.38s ease-out,width-to-zero 0.38s ease-out}.right-frills:before,.right-frills:after{right:15px}.active .right-frills:before{-webkit-animation:width-to-zero 0.38s ease-out,move-up 0.38s ease-out;animation:width-to-zero 0.38s ease-out,move-up 0.38s ease-out}.active .right-frills:after{-webkit-animation:width-to-zero 0.38s ease-out,move-down 0.38s ease-out;animation:width-to-zero 0.38s ease-out,move-down 0.38s ease-out}.left-frills:before,.right-frills:after{transform:rotate(34deg)}.left-frills:after,.right-frills:before{transform:rotate(-34deg)}.total_love span{color:#F43756}.plus1{font-size:11px;margin-left:5px;position:absolute;top:0;color:#F43756;display:none}.plus1.show{display:inline}@-webkit-keyframes move-left{0%{transform:none}65%{transform:translateX(-30px)}100%{transform:translateX(-30px)}}@keyframes move-left{0%{transform:none}65%{transform:translateX(-80px)}100%{transform:translateX(-80px)}}@-webkit-keyframes move-right{0%{transform:none}65%{transform:translateX(80px)}100%{transform:translateX(80px)}}@keyframes move-right{0%{transform:none}65%{transform:translateX(80px)}100%{transform:translateX(80px)}}@-webkit-keyframes width-to-zero{0%{width:18px}100%{width:8px}}@keyframes width-to-zero{0%{width:18px}100%{width:8px}}@-webkit-keyframes move-up{100%{bottom:69.75px}}@keyframes move-up{100%{bottom:69.75px}}@-webkit-keyframes move-down{100%{top:69.75px}}@keyframes move-down{100%{top:69.75px}}
		.video-container { position: relative; padding-bottom: 56.25%; padding-top: 30px; height: 0; overflow: hidden; }
		.video-container iframe, .video-container object, .video-container embed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
		.donation_button_fundraiser{display:inline-block;border:0 none;font-weight:700;line-height:normal;text-align:center;vertical-align:middle;cursor:pointer;transition:all .35s ease 0s;text-decoration:none;border-radius:4px;width:100%;padding:12px 45px;font-size:16px;background-color:#dc3264;color:#fff;border:2px solid #dc3264;height:47px}.donation_button_fundraiser{margin-top:20px;width:50%;margin-right:2%;color:#fff;background:#e6f4ff;border:2px solid #1c7bce;color:#1c7bce;padding:5px 45px 17px 45px;box-shadow:0 10px 12px 0 rgba(0,0,0,.1)!important}.donation_button_fundraiser img{position:absolute;width:24px;margin-left:-75px;margin-top:3px;}.donation_button_fundraiser .text-fundraiser{padding-top:8px;padding-left:28px;font-size:13px;font-weight:700}
    	.donation_button_fundraiser:hover {
      			background: <?php echo $color_hovernya; ?> !important;
      			box-shadow: 0px 18px 15px 0 rgba(0,0,0,.1) !important;
    	}
    	.copy_link_aff img { width: 20px; margin-top: 6px; margin-left: -65px; }
    	.fundraiser-loading{display:inline-block}.fundraiser-loading:after{content:" ";display:block;width:10px;height:10px;margin:0;border-radius:50%;border:3px solid #fff;border-color:<?php echo $button_color; ?> transparent <?php echo $button_color; ?> transparent;animation:fundraiser-loading 1.2s linear infinite;position:absolute;margin-top:-13px;margin-left:10px}@keyframes fundraiser-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
    	.fundraiser-hide{display:none}
		.section-image img{height:auto!important}#header-title{z-index:99}#campaign-title{border-top-left-radius:0;border-top-right-radius:0}.section-box{border-radius:4px}.scale_button:active{scale:.95}.add_info{font-size:13px;background:#fff;padding:8px 6px;border-radius:4px;margin-right:15px;margin-top:-5px;text-align:center;margin-bottom:20px;border:2px solid #1C7BCE;color:#1C7BCE;width:90px}.add_info:hover{background:#e6f4ff}
		.btn-readmore{background-color:#fff;color:<?php echo $button_color;?>;cursor:pointer;animation:bounce 4s infinite;font-size:12px;border-color:<?php echo $button_color;?>;padding-top:0!important;transition:0.3s}.btn-readmore:hover{background-color:<?php echo $button_color;?>;color:#fff;border-color:<?php echo $button_color;?>}
		@keyframes bounce{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}60%{transform:translateY(-5px)}}
		/* --- */
		.readmore-desc{max-height:<?php if($readmore_description=="1"){echo "120px";}else{echo 'default';}?>;position:relative;overflow:hidden}.readmore-desc .box-button-readmore{position:absolute;bottom:0;left:0;width:100%;text-align:center;margin:0;padding-top:60px;padding-bottom:9px;background-image:linear-gradient(to bottom,#fff0,white)}.readmore-desc .box-button-readmore .button{padding:4px 20px 5px 20px!important;border-radius:99px;box-shadow:0 0 15px 5px #fff;height:36px}@media only screen and (max-width:520px){.readmore-desc .box-button-readmore .button{padding:5px 20px 5px 20px!important}}.readmore-desc.big-preview{max-height:240px}.readmore-desc.big-preview .box-button-readmore{padding-top:140px}.readmore-desc img{width:100%!important}.terbaru,.terbesar{font-size:13px;background:#fff;padding:8px 6px;border-radius:4px;text-align:center;border:2px solid #1C7BCE;color:#1C7BCE;width:90px;cursor:pointer}.terbaru:hover,.terbesar:hover{box-shadow:0 10px 12px 0 rgb(0 0 0 / .1)!important}.terbaru{margin-left:25px;margin-top:15px;background:#fff;border-color:<?php echo $button_color;?>;color:<?php echo $button_color;?>}.terbesar{margin-left:5px;margin-top:15px;background:#fff;border-color:<?php echo $button_color;?>;color:<?php echo $button_color;?>}.donation_box{margin-top:8px}.donation_box2{margin-top:8px}.btn-active{background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>;color:#fff;box-shadow:0 10px 12px 0 rgb(0 0 0 / .1)!important}#box-button-fundraiser{text-align:center;padding:30px 10px 40px 10px;background:<?php echo $colornya_soft;?>;background-image:linear-gradient(to top,<?php echo $colornya_soft;?>0%,#fff 100%);border-radius:8px;margin-bottom:5px}@media only screen and (max-width:480px){button.terbaru{}.donation_box.black{background:#fff;}.donation_button_fundraiser{width:100%}.box_terbaru .donation_inner_box, .box_terbesar .donation_inner_box{margin:10px 0px 10px 0;} .donation_inner_box{margin:10px 12px 10px 0;}.terbaru{margin-left:5px}#box-button-fundraiser{padding-left:20px;padding-right:20px} .section-box.flying-button .donation_button_now2 {padding: 12px 10px;} }
		.donation_inner_box {border-radius: 6px !important;}
		<?php 
		if($total_donasi->jumlah>999){
			echo ".container--tabs .nav-tabs > li > a { padding: 10px 10px !important; font-size:  12px; }";
		}else{
			echo ".container--tabs .nav-tabs > li > a { padding: 10px 10px !important; font-size:  13px; }";
		} ?>

		.container--tabs .nav-tabs > li > a { color: #23374d; font-weight: bold; }
		.container--tabs .nav-tabs > li.active > a, .container--tabs .nav-tabs > li.active > a:hover, .container--tabs .nav-tabs > li.active > a:focus { padding: 10px 12px !important; color:#ffffff; background: <?php echo $button_color;?>; border: 1px solid <?php echo $button_color;?>;}
		.timeline-milestone.is-current::before,.timeline-milestone.is-start::before{background-color:<?php echo $button_color;?>}
		.donation_box.black .donation_button button.load_data_donatur, .donation_box.black .donation_button button.load_doa_donatur, .donation_box.black .donation_button button.load_fundraiser, .donation_box.black .donation_button button.load_fundraiser { background: #fff !important; color: #23374d; box-shadow: 0px 3px 15px 0 rgba(0,0,0,.1) !important; transition: 0.3s; height: 42px !important;  }

		.donation_box.black .donation_button button.load_data_donatur:hover, .donation_box.black .donation_button button.load_doa_donatur:hover, .donation_box.black .donation_button button.load_fundraiser:hover, .donation_box.black .donation_button button.load_fundraiser:hover { border: 1px solid #444; transition: 0.3s; }

		@media only screen and (max-width: 768px) {
		  .whatsapp-float {
		    bottom: 20px;
		  }
		  .whatsapp-float.geser-dikit {
		  	bottom: 90px;
		  }
		}

        <?php
        if($id_login!='0'){
        	echo '.timeline-action.is-expandable .title { margin-bottom: 10px; } .timeline-action.is-expandable.is-expanded { padding-bottom: 40px; } ';
        }
        if($total_donasi->jumlah>100){ 
        echo '
	        @media only screen and (max-width:480px) {
	            .scrollable-tabs {
				  display: flex;
				  overflow-x: auto;
				  white-space: nowrap;
				  -webkit-overflow-scrolling: touch;
				}
		    }
		';
		}
        ?>
       
	</style>
	
	<script>
		!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Ukiyo=t():e.Ukiyo=t()}(self,(function(){return function(){"use strict";var e={d:function(t,i){for(var r in i)e.o(i,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:i[r]})},o:function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}},t={};e.d(t,{default:function(){return h}});var i=function(e){return new Promise((function(t,i){var r=new Image;r.onload=function(){return t(r)},r.onerror=function(e){return i(e)},r.src=e}))};function r(e,t){(null==t||t>e.length)&&(t=e.length);for(var i=0,r=new Array(t);i<t;i++)r[i]=e[i];return r}
function n(e,t){var i=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),i.push.apply(i,r)}
return i}
function s(e){for(var t=1;t<arguments.length;t++){var i=null!=arguments[t]?arguments[t]:{};t%2?n(Object(i),!0).forEach((function(t){o(e,t,i[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(i)):n(Object(i)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(i,t))}))}
return e}
function o(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}
function l(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}
function a(e,t){for(var i=0;i<t.length;i++){var r=t[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value" in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}
var set_margintop=!1;var h=function(){function e(t){var r=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(l(this,e),t){var o={scale:1.5,speed:1.5,wrapperClass:null,willChange:!1},a=t.getAttribute("data-u-scale"),h=t.getAttribute("data-u-speed"),p=t.getAttribute("data-u-willchange");if(this.element=t,this.wrapper=document.createElement("div"),this.options=s(s({},o),n),null!==a&&(this.options.scale=a),null!==h&&(this.options.speed=h),null!==p&&(this.options.willChange=!0),this.isIMGtag="img"===this.element.tagName.toLowerCase(),this.overflow=null,this.observer=null,this.requestId=null,this.timer=null,this.reset=this.reset.bind(this),this.isInit=!1,this.isIMGtag){var u=this.element.getAttribute("src");i(u).then((function(e){r._init()}))}else this._init()}}
var t,n;return t=e,(n=[{key:"_init",value:function(){this.isInit||(this._setupElements(),this._observer(),this._addEvent(),this.isInit=!0)}},{key:"_setupElements",value:function(){this._setStyles(!0);var e=this.element.getAttribute("data-u-wrapper-class");if(this.options.wrapperClass||e){var t=e||this.options.wrapperClass;this.wrapper.classList.add(t)}
var i=this.element.closest("picture");null!==i?(i.parentNode.insertBefore(this.wrapper,i),this.wrapper.appendChild(i)):(this.element.parentNode.insertBefore(this.wrapper,this.element),this.wrapper.appendChild(this.element))}},{key:"_setStyles",value:function(e){var t=this.element.clientHeight,i=this.element.clientWidth,r=document.defaultView.getComputedStyle(this.element),n="absolute"===r.position;this.overflow=t-t*this.options.scale,"0px"===r.marginTop&&"0px"===r.marginBottom||(this.wrapper.style.marginTop=r.marginTop,this.wrapper.style.marginBottom=r.marginBottom,this.element.style.marginTop="0",this.element.style.marginBottom="0"),"auto"!==r.inset&&(this.wrapper.style.top=r.top,this.wrapper.style.right=r.right,this.wrapper.style.bottom=r.bottom,this.wrapper.style.left=r.left,this.element.style.top="0",this.element.style.right="0",this.element.style.bottom="0",this.element.style.left="0"),"none"!==r.transform&&(this.wrapper.style.transform=r.transform),"auto"!==r.zIndex&&(this.wrapper.style.zIndex=r.zIndex),this.wrapper.style.position=n?"absolute":"relative",e&&(this.wrapper.style.width="100%",this.wrapper.style.overflow="hidden",this.element.style.display="block",this.element.style.overflow="hidden",this.element.style.backfaceVisibility="hidden","0px"!==r.padding&&(this.element.style.padding="0"),this.isIMGtag?this.element.style.objectFit="cover":this.element.style.backgroundPosition="center"),n&&(this.wrapper.style.width=i+"px",this.element.style.width="100%"),"none"!==r.maxHeight&&(this.wrapper.style.maxHeight=r.maxHeight,this.element.style.maxHeight="none"),"0px"!==r.minHeight&&(this.wrapper.style.minHeight=r.minHeight,this.element.style.minHeight="none"),this.wrapper.style.height=t+"px",this.element.style.height=t*this.options.scale+"px"}},{key:"_observer",value:function(){this.observer=new IntersectionObserver(this._observerCallback.bind(this),{root:null,rootMargin:"0px",threshold:0}),this.observer.observe(this.wrapper)}},{key:"_observerCallback",value:function(e){var t=this;e.forEach((function(e){e.isIntersecting?(t.isVisible=!0,t._update()):(t.isVisible=!1,t._cancel())}))}},{key:"_update",value:function(){this._setPosition(),this.requestId=window.requestAnimationFrame(this._update.bind(this))}},{key:"_setPosition",value:function(){this.options.willChange&&"transform"!==this.element.style.willChange&&(this.element.style.willChange="transform"),this.element.style.transform="translate3d(0 , ".concat(this._getTranslate(),"px , 0)"),this._checkMarginTop()}},{key:"_checkMarginTop",value:function(){if(set_margintop==!1){this.element.style.marginTop="".concat(this._getTranslate()*-1,"px")
set_margintop=!0;$('.parallax-wrapper img.parallax').attr('data-mgtop',this._getTranslate()*-1+"px")}}},{key:"_getTranslate",value:function(){var e=Math.abs(this.overflow),t=this._getProgress()/100,i=this.overflow+e*t*this.options.speed;return Math.round(i)}},{key:"_getProgress",value:function(){var e=window.innerHeight,t=this.wrapper.offsetHeight,i=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0,r=(i+e-(this.wrapper.getBoundingClientRect().top+i))/((e+t)/100);return Math.min(100,Math.max(0,r))}},{key:"_cancel",value:function(){this.requestId&&(this.options.willChange&&(this.element.style.willChange="auto"),window.cancelAnimationFrame(this.requestId))}},{key:"_addEvent",value:function(){navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/)?window.addEventListener("orientationchange",this.resize.bind(this)):window.addEventListener("resize",this.resize.bind(this))}},{key:"resize",value:function(){clearTimeout(this.timer),this.timer=setTimeout(this.reset,450)}},{key:"reset",value:function(){this.wrapper.style.height="",this.wrapper.style.width="",this.wrapper.style.position="",this.element.style.height="",this.element.style.width="","0px"!==this.wrapper.style.margin&&(this.wrapper.style.margin="",this.element.style.margin=""),"auto"!==this.wrapper.style.inset&&(this.wrapper.style.top="",this.wrapper.style.right="",this.wrapper.style.bottom="",this.wrapper.style.left="",this.element.style.top="",this.element.style.right="",this.element.style.bottom="",this.element.style.left=""),"none"!==this.wrapper.style.transform&&(this.wrapper.style.transform="",this.element.style.transform=""),"auto"!==this.wrapper.style.zIndex&&(this.wrapper.style.zIndex=""),this._setStyles(),this._setPosition(),this._checkMarginTop()}},{key:"destroy",value:function(){var e,t;this._cancel(),this.observer.disconnect(),this.wrapper.removeAttribute("style"),this.element.removeAttribute("style"),(e=this.wrapper).replaceWith.apply(e,function(e){if(Array.isArray(e))return r(e)}(t=this.wrapper.childNodes)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(t)||function(e,t){if(e){if("string"==typeof e)return r(e,t);var i=Object.prototype.toString.call(e).slice(8,-1);return"Object"===i&&e.constructor&&(i=e.constructor.name),"Map"===i||"Set"===i?Array.from(e):"Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)?r(e,t):void 0}}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()),this.isInit=!1}}])&&a(t.prototype,n),e}();return t.default}()}))
	</script>

	<?php 
    if (strpos($fb_pixel, ',') !== false ) {

        $array_pixel  = (explode(",", $fb_pixel));
        $count = count($array_pixel);
        $i = 1; ?>
         
    <script>
	!function(f,b,e,v,n,t,s)
	{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
	n.callMethod.apply(n,arguments):n.queue.push(arguments)};
	if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
	n.queue=[];t=b.createElement(e);t.async=!0;
	t.src=v;s=b.getElementsByTagName(e)[0];
	s.parentNode.insertBefore(t,s)}(window, document,'script',
	'https://connect.facebook.net/en_US/fbevents.js');
	<?php foreach ($array_pixel as $values){
        	$pixel_id = $values;
        	?> 
	fbq('init', '<?php echo $pixel_id; ?>');
	<?php } ?>
	fbq('track', '<?php echo $event_1; ?>');
	</script>
        
    <?php 

    }elseif($fb_pixel==''){
        $pixel_id = "";
    }else{
        $pixel_id = $fb_pixel;
        ?>
    <script>
	!function(f,b,e,v,n,t,s)
	{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
	n.callMethod.apply(n,arguments):n.queue.push(arguments)};
	if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
	n.queue=[];t=b.createElement(e);t.async=!0;
	t.src=v;s=b.getElementsByTagName(e)[0];
	s.parentNode.insertBefore(t,s)}(window, document,'script',
	'https://connect.facebook.net/en_US/fbevents.js');
	fbq('init', '<?php echo $pixel_id; ?>');
	fbq('track', '<?php echo $event_1; ?>');
	</script>

        <?php
    }
    ?>
    <?php if($gtm_id!=''){ ?>
    
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','<?php echo $gtm_id;?>');</script>
    <!-- End Google Tag Manager -->

    <?php } ?>

    <?php if($tiktok_pixel!=''){ ?>
    <script>
	!function (w, d, t) {
	  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

	  ttq.load('<?php echo $tiktok_pixel; ?>');
	  ttq.page();
	  ttq.track('<?php echo $event_1; ?>', {
		  content_id: '<?php echo $row->campaign_id; ?>',
		  content_type: 'product',
		  content_name: '<?php echo $row->title; ?>',
		  value: 0,
		  currency: '<?php echo $currency?>'
	  });
	}(window, document, 'ttq');
	</script>
	<?php } ?>

</head>
<body>
	<?php
	function isMobile() {
	    return preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos)/i", $_SERVER["HTTP_USER_AGENT"]);
	}

	$campaign_title = $row->title;
	if(strlen($campaign_title)>40){
		if(isMobile()){
		    $fix_title = substr($campaign_title, 0, 41).'...';
		}
		else {
		    $fix_title = substr($campaign_title, 0, 50).'...';
		}
	}else{
		$fix_title = $campaign_title;
	}

	$cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
    $roles = array_keys((array)$cap);
    $role = $roles[0];

    $set_location = '';
    if($row->location_name!=null){
    	if($row->location_gmaps!=null){
    		$set_location = '<a href="'.$row->location_gmaps.'" target="_blank" style="text-decoration:none;"><span class="d_map"><img alt="Image" src="'.plugin_dir_url( __FILE__ ) . "assets/images/maps.png".'"><div class="loc_name">'.$row->location_name.'</div></span></a>';
    	}else{
    		$set_location = '<span class="d_map"><img alt="Image" src="'.plugin_dir_url( __FILE__ ) . 'assets/images/maps.png"><div class="loc_name">'.$row->location_name.'</div></span>';
    	}
    }

    // cek dia itu target >= 1
    // cek lagi apakah yang didapat >= target
    // $total_donasi->total >= $row->target

    $donasi_terpenuhi = false;
    if($row->target>=1){
    	if($total_donasi->total >= $row->target){
    		if($limitted_donation_button=='1'){
    			$donasi_terpenuhi = true;
    		}
    	}
    }

	?>
	<div id="header-title" class="section-box"><span class="nav-icon" style="<?php if($home_icon!='1'){echo'display:none;';}?>"><a href="<?php echo $home_urlnya;?>"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/home.png'; ?>"></a></span><span class="campaign-header-title"><?php echo $fix_title; ?></span>
	<?php if($id_login!=null) 

		$action = false;
		if($role=='donatur'){
			if($id_login==$row->user_id){
				$action = true;
			}else{
				$action = false;
			}
		}else{
			if($role=='administrator'){
				$action = true;
			}else{
				$action = false;
			}
		}

	{ ?>

		<?php if($action==true){ ?>

		<a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=edit&id=').$row->campaign_id ?>" style="color:#444;"><div style="float: right;font-size: 13px;background: white;padding: 5px 10px;border-radius: 4px;margin-right: 15px;margin-top: -3px;"><img alt="" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/pencil.png'; ?>" style="width:11px;margin-right: 5px;">Edit</div></a>

	<?php } } ?>
	</div>
	<?php if($row->image_url!=null){?>
	<div class="section-image"><img alt="Image" class="parallax"  src="<?php echo $row->image_url; ?>"></div>
	<?php }else{?>
	<div class="section-image"><img alt="Image" class="parallax" src="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>"></div>
	<?php } ?>

	
	<div id="campaign-title" class="section-box">
		<div class="title"><h1><?php echo $campaign_title; ?></h1></div>
		<?php if($row->publish_status=='0'){?>
		<p style="font-size: 13px;color: #ababab;">Campaign on Drafts</p>
		<?php } elseif($row->publish_status=='2'){?>
		<p style="font-size: 13px;color: #C8D0DD;">Campaign on Status Review</p>
		<?php } ?>
		<?php echo $set_location; ?>
		<div class="donation_box2">
			
			<?php if($row->target==0){?>

				<span class="d_total"><?php echo $show_currency; ?><?php echo number_format_currency($total_donasi->total); ?></span>
				<span class="d_target">
					<span class="d_target_text">dan masih terus dikumpulkan</span>
				</span>
			<?php }else { ?>
				<span class="d_total"><?php echo $show_currency; ?><?php echo number_format_currency($total_donasi->total); ?></span>
				<span class="d_target">
					<span class="d_target_text">terkumpul&nbsp;dari&nbsp;<b><?php echo $show_currency; ?><?php echo number_format_currency($row->target); ?></b></span>
				</span>
			<?php } ?>
			<div class="donation_progress">
				<div class="donation_progress_bar full_green" style="background:<?php echo $progressbar_color; ?>;width:<?php echo $persen_width; ?>%"></div>
			
			<?php if($row->target==0){ ?>
				<span class="d_target_graph"><b><?php echo $total_donasi->jumlah;?></b> <?php echo $donatur_title; ?></span></span>
			<?php } else { ?>

				<span class="d_target_graph"><b><?php echo $total_donasi->jumlah;?></b> <?php echo get_langArray('f_campaign_label1');?></span>
			<?php } ?>

			<span class="d_date"><span><?php echo $sisa_waktu; ?></span></span>
			</div>
		</div>
		<?php if($hasil->invert==true){ ?>
		<div class="section-button button-disabled"><a href="javascript:;"><button class="donation_button_now"><?php echo $text1; ?></button></a></div>

		<?php } elseif($row->publish_status=='3'){ ?>
		<div class="section-button button-disabled"><a href="javascript:;"><button class="donation_button_now"><?php echo $text1; ?></button></a></div>

		<?php } elseif($donasi_terpenuhi==true){ ?>
		<div class="section-button button-disabled"><a href="javascript:;"><button class="donation_button_now"><?php echo $text2; ?> Terpenuhi</button></a></div>

		<?php }else{ ?>
			

			<?php if (!empty($row->external_link_button)) { ?>
				<div class="section-button"><a href="<?php echo $external_link;?>" target="_parent"><button class="donation_button_now scale_button" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>"><?php if($option_baznasjabar_link=='1'){ ?><img alt="logo" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/garuda.png'; ?>" style="width:27px;position: absolute;margin-top:-4px;margin-left: -10px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<?php } ?><?php if($option_whatsapp_link=='1'){ ?><img alt="logo" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/whatsapp_icon.png'; ?>" style="width:22px;position: absolute;margin-top:-2px;margin-left: -10px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<?php } ?><?php echo $text1; ?></button></a></div>
			<?php }else{ ?>

				<div class="section-button"><a href="<?php echo $current_url;?>/<?php echo $page_donate; ?><?php echo $link_ref_aff; ?>"><button class="donation_button_now scale_button" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>"><?php echo $text1; ?></button></a></div>

			<?php } ?>
			
		<?php } ?>
	</div>
	<div class="section-box" style="min-height: 130px;"><h3><?php echo get_langArray('f_campaign_title2');?></h3>
		<div class="penggalang-dana">
			<a href="<?php echo $home_url;?>/profile/<?php echo $profile[0]->user_randid; ?>">
				<div class="profile-picture">
					<img alt="Image" src="<?php echo $profile_photo; ?>" style="border-radius: 120px;border: 1px solid #dde4ec;">
				</div>
			</a>
			<div class="profile-name">
				<?php if($profile[0]->user_type=='org' && $profile[0]->user_verification=='1') { ?>
					<div class="user-link">
						<a href="<?php echo $home_url;?>/profile/<?php echo $profile[0]->user_randid; ?>">
							<span class=""><?php echo str_replace("\\", "", $fullname); ?></span>
						</a>
					</div>
					<div class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/check-org2.png'; ?>" style="width:42px;"></div><div class="user-verified" style="margin-left: 48px;font-style: italic;color: #a2b0ca;">Verified Organization</div>
				<?php } elseif($profile[0]->user_type=='personal' && $profile[0]->user_verification=='1') { ?>
					<div class="user-link">
						<a href="<?php echo $home_url;?>/profile/<?php echo $profile[0]->user_randid; ?>">
							<span class=""><?php echo $fullname; ?></span>
						</a>
					</div>
					<div class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/check.png'; ?>"></div><div class="user-verified" style="font-style: italic;color: #a2b0ca;">Verified User</div>
				<?php } else { ?>
					<div class="user-link" style="padding-top: 10px;">
						<a href="<?php echo $home_url;?>/profile/<?php echo $profile[0]->user_randid; ?>">
							<span class=""><?php echo $fullname; ?></span>
						</a>
					</div>
				<?php } ?>
			</div>
		</div>
	</div>

	<?php if($label_tab=="tab") { ?>
	<div class="section-box" id="tab-donasiaja">
		<div class="container--tabs" id="info-update">
			<section class="row">
				<?php 
				$jumlah_info = 0;
			  	foreach ($campaign_update as $getdata) { 
			  		$jumlah_info++;
			  	}
			  	if($jumlah_info>=1){
			  		$jumlah_infonya = '('.$jumlah_info.')';
			  	}else{
			  		$jumlah_infonya = '';
			  	}
			  	?>

				<ul class="nav nav-tabs scrollable-tabs">
					<li class="active"><a href="#tab-1">Keterangan</a></li>
					<li class=""><a href="#tab-2"><?php echo get_langArray('f_campaign_title3');?> <?php echo $jumlah_infonya; ?></a></li>
					<li class=""><a href="#tab-3"><?php echo $donatur_title; ?> <?php if($total_donasi->jumlah!=0){echo "($total_donasi->jumlah)";} ?></a></li>
				</ul>
				<div class="tab-content">
					<div id="tab-1" class="tab-pane active"> 
						<div class="col-md-10">
							
							<div class="readmore-desc">
								<?php echo $information; ?>

								<?php if($readmore_description=='1' ){ ?>
								<p class="box-button-readmore">
							        <a class="button btn-readmore" href="#"><?php echo get_langArray('f_campaign_button1');?> ▾</a>
							    </p>
								<?php } ?>

							</div>

						</div>
					</div> 
					<div id="tab-2" class="tab-pane">
						<div class="col-md-10">
							<?php

						    $dt = !empty($row->created_at) ? new DateTime($row->created_at) : new DateTime();
							$m = $dt->format('F');

						    if (strpos($m, 'January') !== false ) { $m = 'Januari'; }
						    elseif(strpos($m, 'February') !== false ) { $m = 'Februari'; }

						    $dt_published = $m.', '.$dt->format('j Y');

						    ?>

							<?php if($campaign_update==null){ ?>

					    	<div id="kabar-terbaru-donasi">
								  <ul class="timeline" style="margin-top: 50px;">
								  	<?php if($action==true){ ?>
								    <li class="timeline-milestone is-current" style="height:60px;">
								      	<div class="timeline-action" style="width: 100px;">
										<a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id ?>" style="text-decoration:none;"><div class="add_info">Add Info</div></a>
										 </div>
								    </li>
									<?php } ?>
									<li class="timeline-milestone is-start" style="height: 50px;">
								      <div class="timeline-action">
								      	<span class="date"><?php echo $dt_published; ?></span>
								        <h3 class="title">Campaign is published</h3>
								      </div>
								    </li>
								  </ul>
					    	</div>

					    	<?php }else{?>
					    	<div id="kabar-terbaru-donasi">
								  
								  <ul class="timeline" style="margin-top: 50px;">

								  	<?php if($action==true){ ?>
								    <li class="timeline-milestone is-current" style="height:60px;">
								      	<div class="timeline-action" style="width: 100px;">
										<a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id ?>" style="text-decoration:none;"><div class="add_info">Add Info</div></a>
										 </div>
								    </li>
									<?php } ?>

								  	<?php 
								  	foreach ($campaign_update as $value) { 

									  	$readtime = new donasiaja_readtime();
										$time_update = $readtime->time_donation($value->created_at);

										$dt = new DateTime($value->created_at);
									    $m = $dt->format('F');

									    if (strpos($m, 'January') !== false ) { $m = 'Januari'; }
									    elseif(strpos($m, 'February') !== false ) { $m = 'Februari'; }

									    $dt = $m.', '.$dt->format('j Y');

								  	?>
									    <li class="timeline-milestone is-current">
									      <div class="timeline-action is-expandable expanded is-expanded">
										        <span class="date"><?php echo $dt; ?></span>
										        <h3 class="title"><?php echo wp_strip_all_tags($value->title); ?></h3>
										        <div class="content">
										        <?php
										        	$information_update = str_replace("'", "&#39;", $value->information); // petik 1
											        // $information_update = str_replace('"', "&#34;", $information_update); // petik 2
												    $information_update = str_replace('../wp-content', get_site_url().'/wp-content', $information_update);

										        	echo $information_update; 
										        ?>
										        
										        <?php if($action==true){ ?>
										        <a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id.'&infoid='.$value->id ?>" style="text-decoration:none;width:90px;float: left;">
										        <div style="margin-bottom: 10px;text-align:left;background: #e2eef7;width: 60px;border-radius: 4px;padding: 5px 2px;font-size: 12px;padding-left: 18px;"><img alt="" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/pencil.png'; ?>" style="width:10px;margin-right: 5px;">Edit</div>
											    </a>
										        <?php } ?>

										        </div>
									      </div>
									    </li>
									<?php } ?>
									<li class="timeline-milestone is-start" style="height: 50px;">
								      <div class="timeline-action">
								      	<span class="date"><?php echo $dt_published; ?></span>
								        <h3 class="title">Campaign is published</h3>
								      </div>
								    </li>

								    
									 

								  </ul>
					    	</div>
					    	<?php } ?>
						</div>
					</div>
					<div id="tab-3" class="tab-pane">
						<div class="col-md-10">

							<!-- donation -->
							<?php if($donasi!=null){ ?>
							<button class="terbaru btn-active" data-id="terbaru"><?php echo get_langArray('f_campaign_button3');?></button>
							<button class="terbesar" data-id="terbesar"><?php echo get_langArray('f_campaign_button4');?></button>
							<?php } ?>

							<?php
							$set_rand = d_randomString(4);
							$set_rand2 = d_randomString(5);
							?>
							<div class="donation_box black box_terbaru" style="background: #ffffff;">
							    <div id="box_<?php echo $set_rand; ?>">
							        <?php
							        foreach ($donasi as $value) {
							        	$readtime = new donasiaja_readtime();
										$donation_time = $readtime->time_donation($value->created_at);

										$donatur_name = $value->name;
										$anonim = 'Orang Baik';
										if($value->anonim=='1'){
											$donatur_name = $anonim_text;
										}
										$donatur_name = wp_strip_all_tags($donatur_name);

							        	echo '
								        <div class="donation_inner_box" style="background:rgb(250, 252, 255);">
								            <div class="donation_name">'.$donatur_name.'<span class="donation_time"><span class="dashicons dashicons-clock"></span>'.$donation_time.'</span>
								            </div>
								            <div class="donation_total">Ber'.strtolower($allocation_title).' sebesar <b>'.$show_currency.number_format_currency($value->nominal).'</b></div>
								        </div>
								        ';
							        }
							        ?>
							    </div>
							    <div id="box_btn_<?php echo $set_rand; ?>" class="donation_button">
							        <?php if($donasi==null){ ?>
							    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/givelove.png'; ?>" style="width: 120px;"></p>
							    	<p style="color: #a3aab7;font-weight: 400;">Belum ada donasi untuk penggalangan dana ini</p>
							    	<?php }else{?>
							        <div class="loadmore_info"></div>
							        <button id="<?php echo $set_rand; ?>" class="load_data_donatur" data-act="terbaru" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
								    <?php } ?>
							    </div>
							</div>


							<div class="donation_box black box_terbesar" style="background: #ffffff;display: none;">
							    <div id="box_<?php echo $set_rand2; ?>">
							        <?php
							        foreach ($donasi2 as $value) {
							        	$readtime = new donasiaja_readtime();
										$donation_time = $readtime->time_donation($value->created_at);

										$donatur_name = $value->name;
										$anonim = 'Orang Baik';
										if($value->anonim=='1'){
											$donatur_name = $anonim_text;
										}
										$donatur_name = wp_strip_all_tags($donatur_name);

							        	echo '
								        <div class="donation_inner_box" style="background:rgb(250, 252, 255);">
								            <div class="donation_name">'.$donatur_name.'<span class="donation_time"><span class="dashicons dashicons-clock"></span>'.$donation_time.'</span>
								            </div>
								            <div class="donation_total">Ber'.strtolower($allocation_title).' sebesar <b>'.$show_currency.number_format_currency($value->nominal).'</b></div>
								        </div>
								        ';
							        }
							        ?>
							    </div>
							    <div id="box_btn_<?php echo $set_rand2; ?>" class="donation_button">
							        <?php if($donasi==null){ ?>
							    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/givelove.png'; ?>" style="width: 120px;"></p>
							    	<p style="color: #a3aab7;font-weight: 400;">Belum ada donasi untuk penggalangan dana ini</p>
							    	<?php }else{?>
							        <div class="loadmore_info"></div>
							        <button id="<?php echo $set_rand2; ?>" class="load_data_donatur" data-act="terbesar" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
								    <?php } ?>
							    </div>
							</div>
							<!-- end donation -->
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
	<?php }else{ ?>
	<div class="section-box"><h3>Keterangan</h3>

		<div id="keterangan-donasi" class="readmore-desc">
			<p><?php echo $information; ?></p>
			<?php if($readmore_description=='1' ){ ?>
			<p class="box-button-readmore">
		        <a class="button btn-readmore" href="#"><?php echo get_langArray('f_campaign_button1');?> ▾</a>
		    </p>
			<?php } ?>
		</div>

	</div>
	<?php 
	$jumlah_info = 0;
  	foreach ($campaign_update as $getdata) { 
  		$jumlah_info++;
  	}
  	if($jumlah_info>=1){
  		$jumlah_infonya = '('.$jumlah_info.')';
  	}else{
  		$jumlah_infonya = '';
  	}
  	?>
	<div class="section-box" id="info-update"><h3>Kabar Terbaru <?php echo $jumlah_infonya; ?></h3>
		<?php

		$dt = !empty($row->created_at) ? new DateTime($row->created_at) : new DateTime();
		$m = $dt->format('F');

	    if (strpos($m, 'January') !== false ) { $m = 'Januari'; }
	    elseif(strpos($m, 'February') !== false ) { $m = 'Februari'; }

	    $dt_published = $m.', '.$dt->format('j Y');
	    ?>

		<?php if($campaign_update==null){ ?>

    	<div id="kabar-terbaru-donasi">
			  <ul class="timeline" style="margin-top: 50px;">
			  	<?php if($action==true){ ?>
			    <li class="timeline-milestone is-current" style="height:60px;">
			      	<div class="timeline-action" style="width: 100px;">
					<a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id ?>" style="text-decoration:none;"><div class="add_info">Add Info</div></a>
					 </div>
			    </li>
				<?php } ?>
				<li class="timeline-milestone is-start" style="height: 50px;">
			      <div class="timeline-action">
			      	<span class="date"><?php echo $dt_published; ?></span>
			        <h3 class="title">Campaign is published</h3>
			      </div>
			    </li>
			  </ul>
    	</div>

    	<?php }else{?>
    	<div id="kabar-terbaru-donasi">
			  
			  <ul class="timeline" style="margin-top: 50px;">

			  	<?php if($action==true){ ?>
			    <li class="timeline-milestone is-current" style="height:60px;">
			      	<div class="timeline-action" style="width: 100px;">
					<a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id ?>" style="text-decoration:none;"><div class="add_info">Add Info</div></a>
					 </div>
			    </li>
				<?php } ?>

			  	<?php 
			  	foreach ($campaign_update as $value) { 

				  	$readtime = new donasiaja_readtime();
					$time_update = $readtime->time_donation($value->created_at);

					$dt = new DateTime($value->created_at);
				    $m = $dt->format('F');

				    if (strpos($m, 'January') !== false ) { $m = 'Januari'; }
				    elseif(strpos($m, 'February') !== false ) { $m = 'Februari'; }

				    $dt = $m.', '.$dt->format('j Y');

			  	?>
				    <li class="timeline-milestone is-current">
				      <div class="timeline-action is-expandable expanded">
					        <span class="date"><?php echo $dt; ?></span>
					        <h3 class="title"><?php echo wp_strip_all_tags($value->title); ?></h3>
					        <div class="content">
					        	<?php
						        	$information_update = str_replace("'", "&#39;", $value->information); // petik 1
									// $information_update = str_replace('"', "&#34;", $information_update); // petik 2
									$information_update = str_replace('../wp-content', get_site_url().'/wp-content', $information_update);
						        	echo $information_update; 
						        ?>

						        <?php if($action==true){ ?>
						        <a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$row->campaign_id.'&infoid='.$value->id ?>" style="text-decoration:none;">
						        <div style="margin-bottom: 10px;text-align:right;position: font-size: 13px;"><img alt="" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/pencil.png'; ?>" style="width:10px;margin-right: 5px;">Edit</div>
							    </a>
						        <?php } ?>

					        </div>
				      </div>
				    </li>
				<?php } ?>
				<?php if($jumlah_info>=1){ ?>
				<li class="timeline-milestone is-start" style="height: 50px;">
			      <div class="timeline-action">
			      	<span class="date"><?php echo $dt_published; ?></span>
			        <h3 class="title">Campaign is published</h3>
			      </div>
			    </li>
			    <?php } ?>
			  </ul>
    	</div>
    	<?php } ?>
		
	</div>

	<div class="section-box"><h3><?php echo $donatur_title; ?> <?php if($total_donasi->jumlah!=0){echo "($total_donasi->jumlah)";} ?></h3>
		
		<!-- donation -->
		<?php if($donasi!=null){ ?>
		<button class="terbaru btn-active" data-id="terbaru"><?php echo get_langArray('f_campaign_button3');?></button>
		<button class="terbesar" data-id="terbesar"><?php echo get_langArray('f_campaign_button4');?></button>
		<?php } ?>

		<?php
		$set_rand = d_randomString(4);
		$set_rand2 = d_randomString(5);
		?>
		<div class="donation_box black box_terbaru" style="background: #ffffff;">
		    <div id="box_<?php echo $set_rand; ?>">
		        <?php
		        foreach ($donasi as $value) {
		        	$readtime = new donasiaja_readtime();
					$donation_time = $readtime->time_donation($value->created_at);

					$donatur_name = $value->name;
					$anonim = 'Orang Baik';
					if($value->anonim=='1'){
						$donatur_name = $anonim_text;
					}
					$donatur_name = wp_strip_all_tags($donatur_name);

		        	echo '
			        <div class="donation_inner_box" style="background:rgb(250, 252, 255);">
			            <div class="donation_name">'.$donatur_name.'<span class="donation_time"><span class="dashicons dashicons-clock"></span>'.$donation_time.'</span>
			            </div>
			            <div class="donation_total">Ber'.strtolower($allocation_title).' sebesar <b>'.$show_currency.number_format_currency($value->nominal).'</b></div>
			        </div>
			        ';
		        }
		        ?>
		    </div>
		    <div id="box_btn_<?php echo $set_rand; ?>" class="donation_button">
		        <?php if($donasi==null){ ?>
		    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/givelove.png'; ?>" style="width: 120px;"></p>
		    	<p style="color: #a3aab7;font-weight: 400;">Belum ada donasi untuk penggalangan dana ini</p>
		    	<?php }else{?>
		        <div class="loadmore_info"></div>
		        <button id="<?php echo $set_rand; ?>" class="load_data_donatur" data-act="terbaru" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
			    <?php } ?>
		    </div>
		</div>


		<div class="donation_box black box_terbesar" style="background: #ffffff;display: none;">
		    <div id="box_<?php echo $set_rand2; ?>">
		        <?php
		        foreach ($donasi2 as $value) {
		        	$readtime = new donasiaja_readtime();
					$donation_time = $readtime->time_donation($value->created_at);

					$donatur_name = $value->name;
					$anonim = 'Orang Baik';
					if($value->anonim=='1'){
						$donatur_name = $anonim_text;
					}
					$donatur_name = wp_strip_all_tags($donatur_name);

		        	echo '
			        <div class="donation_inner_box" style="background:rgb(250, 252, 255);">
			            <div class="donation_name">'.$donatur_name.'<span class="donation_time"><span class="dashicons dashicons-clock"></span>'.$donation_time.'</span>
			            </div>
			            <div class="donation_total">Ber'.strtolower($allocation_title).' sebesar <b>'.$show_currency.number_format_currency($value->nominal).'</b></div>
			        </div>
			        ';
		        }
		        ?>
		    </div>
		    <div id="box_btn_<?php echo $set_rand2; ?>" class="donation_button">
		        <?php if($donasi==null){ ?>
		    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/givelove.png'; ?>" style="width: 120px;"></p>
		    	<p style="color: #a3aab7;font-weight: 400;">Belum ada donasi untuk penggalangan dana ini</p>
		    	<?php }else{?>
		        <div class="loadmore_info"></div>
		        <button id="<?php echo $set_rand2; ?>" class="load_data_donatur" data-act="terbesar" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
			    <?php } ?>
		    </div>
		</div>
		<!-- end donation -->

	</div>

	<?php } ?>

	<?php
		if($fundraiser_on=='1'){
			if($row->fundraiser_setting=='0' || $row->fundraiser_setting==null){
				$fundraiser_show = true;
			}else if($row->fundraiser_setting=='1'){
				if($row->fundraiser_on=='1'){
					$fundraiser_show = true;
					if($row->fundraiser_button==''){
						$fundraiser_button = 'Jadi Fundraiser';
					}else{
						$fundraiser_button = $row->fundraiser_button;
					}
					$fundraiser_text = $row->fundraiser_text;
				}else{
					$fundraiser_show = false;
				}
			}else{
				$fundraiser_show = false;
			}
		}else{
			$fundraiser_show = false;
		}

	?>

	<?php if($fundraiser_show==true) { ?>

		<div class="section-box"><h3>Fundraiser <?php if(count($all_fundraiser)!=0 && $data_fundraiser_settings=='1'){echo '('.count($all_fundraiser).')';} ?></h3>
			<?php
			$set_rand = d_randomString(4);
			?>
			
			<div class="donation_box black" style="background:<?php echo $colornya_soft;?>;background-image:linear-gradient(to top,<?php echo $colornya_soft;?>0%,#fff 100%);">

				<?php if($data_fundraiser_settings=='1'){ ?>
			    <div id="box_<?php echo $set_rand; ?>">
			        <?php

			        foreach ($get_fundraiser as $value) {
			        	$user_info = get_userdata($value->fundraiser_id);
					    $fundraiser_fullname = $user_info->first_name.' '.$user_info->last_name;
					    $fundraiser_fullname = wp_strip_all_tags($fundraiser_fullname);

			        	echo '
				        <div class="donation_inner_box" style="background:rgb(250, 252, 255);line-height:1.6;">
				            <div class="donation_name" style="color:'.$button_color.'">'.$fundraiser_fullname.'</div>
				            <div class="donation_comment" style="margin:0;">Berhasil mengajak '.$value->jumlah_donatur.' orang untuk berdonasi.<br></div>
				            <div class="donation_name">'.$show_currency.'&nbsp;'.number_format_currency($value->total).'</div>
				        </div>
				        ';

			        }
			        ?>
			    </div>
			    <div id="box_btn_<?php echo $set_rand; ?>" class="donation_button">
			    	<?php if(count($all_fundraiser)==null){ ?>
			    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/loudspeaker.png'; ?>" style="width: 120px;"></p>
			    	<p style="color: #a3aab7;">Belum ada Fundraiser</p>
			    	<?php }else{?>
			        <div class="loadmore_info"></div>
			        <button id="<?php echo $set_rand; ?>" class="load_fundraiser" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
				    <?php } ?>
			    </div>

				<?php } ?>

				<?php if($data_fundraiser_settings=='0'){ ?>
			    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/loudspeaker.png'; ?>" style="width: 120px;"></p>
		    	<?php } ?>
			
				<div style="text-align: center; padding: 40px 10px 30px 10px; border-radius: 8px; margin-bottom: 5px;">
				    <div style="font-size: 15px;font-family: 'Lato', FontAwesome, lato, sans-serif !important;margin-bottom:10px;"><?php echo $fundraiser_text; ?></div>
				    	<?php if($aff_code==''){ ?>
				    		<div><button class="donation_button_fundraiser regaff scale_button" data-cid="<?php echo $row->campaign_id; ?>" style="background:<?php echo $colornya; ?>;border-color:<?php echo $button_color;?>;margin-top: 25px;"><div><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/groups.png'; ?>"><div class="text-fundraiser" style="color:#2D3849;"><?php echo $fundraiser_button; ?><div class="fundraiser-loading fundraiser-hide"></div></div></div></button></div>
					    <?php }else{ ?>
					    	<div><button class="donation_button_fundraiser copy_link_aff scale_button" data-cid="<?php echo $row->campaign_id; ?>" style="background:<?php echo $colornya; ?>;border-color:<?php echo $button_color;?>;margin-top: 25px;" data-link="<?php echo $current_url; ?><?php if($aff_code!=''){echo '?ref=';echo $aff_code;}?>"><div><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/link2.png'; ?>"><div class="text-fundraiser" style="color:#2D3849;">Copy Link Aff</div></div></button></div>
					    <?php } ?>
				    </div>
				</div>
		</div>

	<?php } ?>

	<div class="section-box"><h3>Doa-doa orang baik <?php if($data_comment->jumlah!=0){echo "($data_comment->jumlah)";} ?></h3>
		<?php
		$set_rand = d_randomString(4);
		?>
		<div class="donation_box black" <?php if($donasi_comment==null){ echo "style='background:#ffffff;padding-top:10px;'";} ?>>
		    <div id="box_<?php echo $set_rand; ?>">
		        <?php
		        foreach ($donasi_comment as $value) {
		        	$readtime = new donasiaja_readtime();
					$donation_time = $readtime->time_donation($value->created_at);

					$donatur_name = $value->name;
					$anonim = 'Orang Baik';
					if($value->anonim=='1'){
						$donatur_name = $anonim_text;
					}
					$donatur_name = wp_strip_all_tags($donatur_name);

					// cek apakah user sudah pernah love
					$a = donasiaja_getIP();
				    $b = donasiaja_getOS();
				    $c = donasiaja_getBrowser();
				    $d = donasiaja_getMobDesktop();
					if($id_login!='0'){
						// cek berdasarkan user_agent
						$data = $wpdb->get_results('SELECT * from '.$table_name4.' where ip="'.$a.'" and os="'.$b.'" and browser="'.$c.'" and mobdesktop="'.$d.'" and donate_id="'.$value->id.'"');
				    	if($data!=null){
				    		$left_span = '<span>';
				    		$right_span = '</span>';
				    		$icon_love = plugin_dir_url( __FILE__ ) . 'assets/icons/praying-color3.png';
				    	}else{
				    		$left_span = '';
				    		$right_span = '';
				    		$icon_love = plugin_dir_url( __FILE__ ) . 'assets/icons/praying-gray.png';
				    	}
					}else{
						// cek berdasarkan user_id
						$data = $wpdb->get_results('SELECT * from '.$table_name4.' where user_id="'.$id_login.'" ');
				    	if($data!=null){
				    		$left_span = '<span>';
				    		$right_span = '</span>';
				    		$icon_love = plugin_dir_url( __FILE__ ) . 'assets/icons/praying-color3.png';
				    	}else{
				    		$left_span = '';
				    		$right_span = '';
				    		$icon_love = plugin_dir_url( __FILE__ ) . 'assets/icons/praying-gray.png';
				    	}
					}


					$total_love = $wpdb->get_results("SELECT SUM(love) as jumlah FROM $table_name4 where donate_id='$value->id' ")[0];
					$love = $total_love->jumlah;
					if($love==0){
						$love = 'Aaminn-kan doa ini';
					}else{
						if($love>=2){
							$love = $left_span.$love.' Aaminn'.$right_span;
						}else{
							$love = $left_span.$love.' Aaminn'.$right_span;
						}
					}

					$comment = wp_strip_all_tags(str_replace('\\', '', $value->comment));


		        	echo '
			        <div class="donation_inner_box">
			            <div class="donation_name">'.$donatur_name.'<span class="donation_time"><span class="dashicons dashicons-clock"></span>'.$donation_time.'</span>
			            </div>
			            <div class="donation_comment">'.$comment.'<br></div>
			            <div class="donation_love" id="love_'.$value->id.'" data-donateid="'.$value->id.'" data-campaignid="'.$value->campaign_id.'">
			            	
			            	<div class="fancy-button">
							  <div class="left-frills frills"></div>
							  <div class="box_love">
							  	<img alt="Image" src="'.$icon_love.'">
							  	<div class="total_love">'.$love.'</div>
							  	<div class="plus1">+1</div>
							  </div>
							  <div class="right-frills frills"></div>
							</div>

						</div>
			            	
			        </div>
			        ';
		        }
		        ?>
		    </div>
		    <div id="box_btn_<?php echo $set_rand; ?>" class="donation_button">
		    	<?php if($donasi_comment==null){ ?>
		    	<p style="text-align: center;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/giving.png'; ?>" style="width: 120px;"></p>
		    	<p style="color: #a3aab7;">Menanti doa-doa orang baik</p>
		    	<?php }else{?>
		        <div class="loadmore_info"></div>
		        <button id="<?php echo $set_rand; ?>" class="load_doa_donatur" data-id="<?php echo $row->campaign_id;?>" data-count="2" data-fullanonim="true" data-anonim="<?php echo $anonim_text; ?>">Load more</button>
			    <?php } ?>
		    </div>
		</div>
	</div>

	<div class="section-box box-powered">
		<?php if($powered_by_setting=='1'){ ?>
		<div class="powered-donasiaja-box"><a href="https://donasiaja.id" target="_blank"><img alt="Donasi Aja" class="powered-donasiaja-img" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donasiaja.ico'; ?>">Powered by DonasiAja</a></div>
		<?php } ?>
	</div>
	
	<div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
	<div class="section-box" id="fixed-button">
		<button class="donation_button_share"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/share.png'; ?>"><span class="text-share">Share</span><div class="text-bagikan">Bagikan</div></button><?php if($hasil->invert==true){ ?><a href="javascript:;" class="button-disabled"><button class="donation_button_now2"><?php echo $text1; ?></button></a><?php }elseif($row->publish_status=='3'){ ?><a href="javascript:;" class="button-disabled"><button class="donation_button_now2"><?php echo $text1; ?></button></a><?php } elseif($donasi_terpenuhi==true){ ?><a href="javascript:;" class="button-disabled"><button class="donation_button_now2"><?php echo $text2; ?> Terpenuhi</button></a><?php }else{ ?>
		
		<?php if (!empty($row->external_link_button)) { ?>

			<a href="<?php echo $external_link;?>" target="_parent"><button class="donation_button_now2 scale_button" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>"><?php if($option_baznasjabar_link=='1'){ ?><img alt="logo" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/garuda.png'; ?>" style="width:27px;position: absolute;margin-top:-4px;margin-left: -10px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<?php } ?><?php if($option_whatsapp_link=='1'){ ?><img alt="logo" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/whatsapp_icon.png'; ?>" style="width:22px;position: absolute;margin-top:-2px;margin-left: -10px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<?php } ?><?php echo $text1; ?></button></a>

		<?php }else{ ?>

			<a href="<?php echo $current_url;?>/<?php echo $page_donate; ?><?php echo $link_ref_aff; ?>"><button class="donation_button_now2 scale_button" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>"><?php echo $text1; ?></button></a>

		<?php } ?>

		

		<?php }?>
	</div>

	<div id="fixed-share-button" class="section-box">
		<div class="share-title">Bagikan melalui:</div>
		<div class="share-close">✕ Close</div>

		<button class="donation_social_button donasiaja_copy_link" data-link="<?php echo $current_url; ?><?php if($aff_code!=''){echo'?ref='.$aff_code;}?>"><span><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/link.png'; ?>" style="opacity: 0;margin-left: -15px;" alt="Copy Link"><div class="text-copy">Copy Link</div></span></button>

		<a class="donasiaja-share wa" href="https://api.whatsapp.com/send?&text=<?php echo $row->title; ?>%0A<?php echo $current_url; ?><?php if($aff_code!=''){echo'?ref='.$aff_code;}?>">
			<button class="donation_social_button whatsaap"><span><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/whatsapp.png'; ?>" alt="Whatsaap"></span>
			</button>
		</a>

		<a class="donasiaja-share fb" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $current_url; ?><?php if($aff_code!=''){echo'?ref='.$aff_code;}?>">
			<button class="donation_social_button facebook"><span><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/facebook.png'; ?>" alt="Facebook"></span>
			</button>
		</a>

		<a class="donasiaja-share twit" href="https://twitter.com/intent/tweet?text=<?php echo $current_url; ?><?php if($aff_code!=''){echo'?ref='.$aff_code;}?>">
			<button class="donation_social_button twitter"><span><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/x.png'; ?>" alt="Twitter"></span>
			</button>
		</a>

		<a class="donasiaja-share tele" href="https://telegram.me/share/url?text=<?php echo $row->title; ?> &url=<?php echo $current_url; ?><?php if($aff_code!=''){echo'?ref='.$aff_code;}?>">
			<button class="donation_social_button telegram"><span><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/telegram.png'; ?>" alt="Telegram"></span>
			</button>
		</a>
	</div>
   	


	    <?php if($flying_button_settings=='1' and $page_campaign_button=='1'){ ?>
	        <?php $wa_admin = wa_variants_08_628_2($flying_button_number); ?>
	        <!-- Floating Button - Whatsapp CS -->
	        <a href="https://api.whatsapp.com/send?phone=<?php echo $wa_admin; ?>&text=<?php echo urlencode($flying_button_message); ?>" 
	           class="whatsapp-float" target="_blank" style="cursor: pointer;">
	           <?php if($flying_button_bubble_text!=''){ ?><div class="chat-bubble"><?php echo $flying_button_bubble_text; ?></div><?php } ?>
	           <img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/whatsapp.svg'; ?>" class="whatsapp-icon" alt="" />
	        </a>
	    <?php } ?>



	<?php if($row->socialproof=='1') { 
	$decoding = "decoding='async'";
	echo '<script src="'.plugin_dir_url( __FILE__ ).'assets/js/toastify.js"></script>';

	echo '
		<script>

		Array.prototype.getRandomColor= function(cut){
		    var i= Math.floor(Math.random()*this.length);
		    if(cut && i in this){
		        return this.splice(i, 1)[0];
		    }
		    return this[i];
		}
		var avatar_colors= ["#D94452", "#FA6C51", "#F5B945", "#9ED26A", "#35BA9B", "#4FC0E8", 
		"#9579DA", "#E3B692", "#E5C3C1", "#E7CDAC"];
		splittedContent = [
				'.$data_donasinya.'
	        ];

		function loopSplit(splittedContent) {
		    for (var i = 0; i < splittedContent.length; i++) {
		        (function (i) {
		        })(i);
		    };
		}
		loopSplit(splittedContent);
				
		var d = 0, howManyTimes = splittedContent.length;

		function f_socialproof() {

		  	var name 	= splittedContent[d].content[0];
		    var time 	= " - "+splittedContent[d].content[1];
		    var title 	= splittedContent[d].content[2];
		    var pp_url 	= splittedContent[d].content[3];
		    var c_id 	= splittedContent[d].content[4];
		    show_color_avatar = "";
		    if(pp_url!=""){
		    	show_color_avatar = "display:none;";
		    }
		    show_img_avatar = "";
		    if(pp_url==""){
		    	show_img_avatar = "display:none;";
		    }
		    var show_time = "'.$time.'";
		    if(show_time=="hide"){
		    	time = "";
		    }
		    setTimeout(function() {
		       Toastify({
				  text: "<div class=dsproof-container id="+c_id+"><div class=dsproof-avatar style=background:"+avatar_colors.getRandomColor()+";"+show_color_avatar+">"+name.substring(0, 1)+"</div><div class=dsproof-avatar style="+show_img_avatar+"><img '.$decoding.' src="+pp_url+"></div><div class=dsproof-content><div class=dsproof-name>"+name+"</div><div class=dsproof-title>"+title+"</div><div class=dsproof-verified><img src='.plugin_dir_url( __FILE__ ).'assets/images/check.png'.'><span>Verified"+time+"</span></div><div></div>",
				  className: "donasiaja-socialproof'.$set_style.'",
				  escapeMarkup : false,
				  gravity: "'.$p_gravity.'",
				  position: "'.$p_position.'",
				  close: "'.$close.'",
				  duration: 5000,
				  style: {
				    background: "linear-gradient(to right, #ffffff, #ffffff)",
				  }
				}).showToast();
			}, 1000)
		  d++;
		  if (d < howManyTimes) {
		    setTimeout(f_socialproof, '.$delay.');
		  }
		}
		if(splittedContent.length>=1){
			f_socialproof();   
		}
		</script>

	';

	echo '<style>
		.donasiaja-socialproof{line-height: 1.5;border-radius:6px;max-width:360px;height:auto;padding-right:20px!important;z-index:9999;background:#fff!important;box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.06),0 10px 36px -4px rgba(77, 96, 232, 0.09) !important;}.donasiaja-socialproof .toast-close{border-radius:20px;position:absolute;right:0;color:#fff;margin-top:-16px!important;background:#0000004f;width:25px!important;height:25px!important;font-size:13px!important;text-align:center!important;padding:2px!important;opacity:1;top:10px}.dsproof-avatar{border-radius:4px;width:50px;height:50px;text-align:center;position:absolute;margin-left:-7px;margin-top:0px;font-size:32px;font-weight:700;color:#fffc;font-family:Lato,lato,sans-serif!important}.dsproof-avatar img{width:50px;height:50px;border-radius:4px;}.dsproof-content{margin-left:54px;color:#888;font-size:11px;font-family:Lato,lato,sans-serif!important}.dsproof-name{font-size:13px;font-weight:700;color:#35363c;position:absolute;margin-top:-3px}.dsproof-title{color:#656577;padding-top:16px;padding-bottom:2px}.dsproof-verified{font-size:10px;color:#b0b0c6;margin-bottom:2px;}.dsproof-verified span{padding-left:15px}.dsproof-verified img{width:12px;position:absolute;margin-top:2px}.toastify{min-width:160px;padding:12px 20px;padding-top:12px!important;color:#fff;display:inline-block;box-shadow:0 3px 6px -1px rgba(0,0,0,.12),0 10px 36px -4px rgba(77,96,232,.3);background:-webkit-linear-gradient(315deg,#73a5ff,#5477f5);background:linear-gradient(135deg,#73a5ff,#5477f5);position:fixed;opacity:0;transition:all .4s cubic-bezier(.215,.61,.355,1);cursor:pointer;text-decoration:none;z-index:2147483647}.toastify.on{opacity:1}.toast-close{opacity:.4;padding:0 5px}.toastify-right{right:15px}.toastify-left{left:15px}.toastify-top{top:-150px}.toastify-bottom{bottom:-150px}.toastify-rounded{}.toastify-avatar{width:1.5em;height:1.5em;margin:-7px 5px;border-radius:2px}.toastify-center{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content;max-width:-moz-fit-content}@media only screen and (max-width:360px){.toastify-left,.toastify-right{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content}} .donasiaja-socialproof.s-rounded .dsproof-avatar{border-radius: 50px;} .donasiaja-socialproof.s-rounded .dsproof-avatar img{border-radius: 50px;}
		.donasiaja-socialproof.s-rounded {height:auto !important;}
		.donasiaja-socialproof.s-rounded .dsproof-avatar {margin-top:0px;}
		.donasiaja-socialproof.s-flying { background: transparent !important;box-shadow:none !important;}
		.donasiaja-socialproof.s-flying .dsproof-avatar { box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.06),0 10px 36px -4px rgba(77, 96, 232, 0.04) !important;}
		.donasiaja-socialproof.s-flying .dsproof-content { background: #fff;padding: 10px 20px 10px 16px;border-radius: 4px;box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.06),0 10px 36px -4px rgba(77, 96, 232, 0.04)}
		@media only screen and (max-width:480px) {
		    .toastify-bottom {
		      bottom: 100px !important;
		    }
		}
	</style>';

	} // close socialproof ?>
	
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/jquery.min.js';?>"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/donasiaja.min.js?ver='.$GLOBALS['donasiaja_vars']['plugin_version'].'';?>"></script>
	<script>
		jQuery(document).ready(function($){
			$(window).scroll(function() {
			    var value_mgtop = $('.parallax-wrapper img.parallax').attr("data-mgtop");
			    $('.parallax-wrapper img.parallax').css({"margin-top":value_mgtop});
			});
		});
	</script>
	<script>
		const image = document.querySelector('.parallax');
		new Ukiyo(image, {
		    scale: 1.5, // 1~2 is recommended
		    speed: 1.5, // 1~2 is recommended
		    willChange: true, // This may not be valid in all cases
		    wrapperClass: "parallax-wrapper"
		})

		window.addEventListener("load", function() {

			// store tabs variable
			var myTabs = document.querySelectorAll("ul.nav-tabs > li");

			function myTabClicks(tabClickEvent) {

				for (var i = 0; i < myTabs.length; i++) {
					myTabs[i].classList.remove("active");
				}

				var clickedTab = tabClickEvent.currentTarget; 

				clickedTab.classList.add("active");

				tabClickEvent.preventDefault();

				var myContentPanes = document.querySelectorAll(".tab-pane");

				for (i = 0; i < myContentPanes.length; i++) {
					myContentPanes[i].classList.remove("active");
				}

				var anchorReference = tabClickEvent.target;
				var activePaneId = anchorReference.getAttribute("href");
				var activePane = document.querySelector(activePaneId);

				activePane.classList.add("active");

			}

			for (i = 0; i < myTabs.length; i++) {
				myTabs[i].addEventListener("click", myTabClicks)
			}
		});

		$(document).ready(function() {
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
		});                  


		$(document).ready(function() {
		    $('.donasiaja-share').click(function(e) {
		        e.preventDefault();
		        if ($(this).hasClass("wa") || $(this).hasClass("fb") || $(this).hasClass("twit") || $(this).hasClass("tele")) {
					window.open($(this).attr('href'), 'fbShareWindow', 'height=450, width=550, top=' + ($(window).height() / 2 - 275) + ', left=' + ($(window).width() / 2 - 225) + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
						return false;
				}
		        
		    });

		    $('.terbaru, .terbesar').click(function() {
		        // Remove "btn-active" class from both buttons
		        $('.terbaru, .terbesar').removeClass('btn-active');

		        // Add "btn-active" class to the clicked button
		        $(this).addClass('btn-active');

		        var id =  $(this).attr('data-id');
		        if(id=='terbaru'){
		        	$('.box_terbaru').slideDown();
		        	$('.box_terbesar').slideUp();
		        }else{
		        	$('.box_terbaru').slideUp();
		        	$('.box_terbesar').slideDown();
		        }
		    });
		});

		$('.donation_button_share').bind("click", function(e) {
			$('#fixed-share-button').addClass("show-button");
		});
		$('.share-close').bind("click", function(e) {
			$('#fixed-share-button').removeClass("show-button");
		});

		<?php if($readmore_description=='1' ){ ?>

			$(".readmore-desc").readMore({
			    expandTrigger: ".box-button-readmore",
			    previewHeight: 400,
			    fadeColor1: "rgba(255,255,255,0)",
			    fadeColor2: "rgba(255,255,255,1)"
			});

		<?php } ?>

		$(function() {
		    var header = $("#header-title");
		    var header2 = $('.campaign-header-title');
		    var footer = $("#fixed-button");
		    $(window).scroll(function() {
		        var scroll = $(window).scrollTop();
			    var windowHeight = $(window).height();
			    var documentHeight = $(document).height();
			    var windowWidth = $(window).width(); // lebar layar

		        if (scroll >= 500) {
		            header.addClass("flying-header");
		            header2.addClass("show-title");
		            footer.addClass("flying-button");
		        } else {
		            header.removeClass("flying-header");
		            header2.removeClass("show-title");
		            footer.removeClass("flying-button");
		            $('#fixed-share-button').removeClass("show-button");
		        }

		        // Cek sisa scroll ke bawah
			    const distanceToBottom = documentHeight - (scroll + windowHeight);

			    // ubah ke persentase (0–100)
			    const percentFromBottom = (distanceToBottom / documentHeight) * 100;

			    // kalau sisa kurang dari 50% dari tinggi dokumen dan layar ≤480px
			    if (percentFromBottom <= 50 && windowWidth <= 480) {
			        $('.whatsapp-float').addClass("geser-dikit");
			    } else {
			        $('.whatsapp-float').removeClass("geser-dikit");
			    }

		    });
		});


		$(document).on("click", ".donasiaja_copy_link", function(e) {
			var link_donasi = $(this).data("link");
			copyToClipboard(link_donasi);
			var message = "Copy link donasi berhasil!";
			var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
			var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
			createAlert(message, status, timeout);
		});

		$(document).on("click", ".copy_link_aff", function(e) {
			var link_donasi = $(this).data("link");
			copyToClipboard(link_donasi);
			var message = "Copy Link Aff berhasil!";
			var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
			var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
			createAlert(message, status, timeout);
		});

		$(document).on("click", ".regaff", function(e) {
			$('.fundraiser-loading').removeClass('fundraiser-hide');
			var cid = $(this).data("cid");
			var data_nya = [cid];
		    var data = {
		        "action": "djafunction_regaff_fundraiser",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {

		    	var response_text = response.split("_");
                response_info = response_text[0];
                response_affcode = response_text[1];

                if(response_info=='loginfirst'){
			    	$('.fundraiser-loading').addClass('fundraiser-hide');

			    	var message = "Silahkan anda login terlebih dahulu.";
					var status = "warning";    /* There are 4 statuses: success, info, warning, danger  */
					var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
					createAlert(message, status, timeout);

					<?php if($login_setting=='1'){
					echo '
					setTimeout(function() {
			            var urlnya = "'.get_site_url().'/'.$page_login.'";
						window.location.replace(urlnya);
			        }, 1200)
					';
					}else{
					echo '
					setTimeout(function() {
			            var urlnya = "'.get_site_url().'/wp-login.php";
						window.location.replace(urlnya);
			        }, 1200)
					';
					} ?>

                }else{
                	var aff_url = "<?php echo $current_url; ?>"+'?ref='+response_affcode;
			    	$('.donation_button_fundraiser img').attr("src","<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/link2.png'; ?>");
			    	$('.donation_button_fundraiser').removeClass('regaff');
			    	$('.donation_button_fundraiser').addClass('copy_link_aff');
			    	$('.donation_button_fundraiser').attr('data-link', aff_url);
			    	$('.donation_button_fundraiser .text-fundraiser').text('Copy Link Aff');
			    	
			    	$('.fundraiser-loading').addClass('fundraiser-hide');

			    	copyToClipboard(aff_url);

			    	var message = "Link Aff Fundraiser berhasil didaftarkan dan di-copy. Silahkan sebarkan ke Social Media anda.";
					var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
					var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
					createAlert(message, status, timeout);
                }

		    	
		    });
		});

		

		// get Copy
		function copyToClipboard(string) {
		let textarea;let result;try{textarea=document.createElement("textarea");textarea.setAttribute("readonly",!0);textarea.setAttribute("contenteditable",!0);textarea.style.position="fixed";textarea.value=string;document.body.appendChild(textarea);textarea.focus();textarea.select();const range=document.createRange();range.selectNodeContents(textarea);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);textarea.setSelectionRange(0,textarea.value.length);result=document.execCommand("copy")}catch(err){console.error(err);result=null}finally{document.body.removeChild(textarea)}
	if(!result){const isMac=navigator.platform.toUpperCase().indexOf("MAC")>=0;const copyHotkey=isMac?"⌘C":"CTRL+C";result=box-button-readmore(`Press ${copyHotkey}`,string);if(!result){return!1}}
	return!0
		}

		function getNum(val) {
		   if (isNaN(val)) {
		     return 0;
		   }
		   return val;
		}

		$(function(){
		  $(document).on("click", ".donation_love", function(e) {
		    $(this).bind('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){
		        $(this).removeClass('active');
		    })
		     $(this).addClass("active");
		  });
		});


		$(document).on("click", ".donation_love", function(e) {
			var id = $(this).attr('id');
			var campaign_id = $(this).attr('data-campaignid');
			var donate_id = $(this).attr('data-donateid');
			var count_love = $(this).find('.total_love').text();
			
			var thenum = parseInt(getNum(count_love.replace(/\D/g, "")));
			if(isNaN(thenum)){
				$(this).find('.total_love').html('<span>1 Aaminn</span>');
			}else{
				thenum = thenum+1;
				$(this).find('.total_love').html('<span>'+thenum+' Aaminn</span>');
			}

			$("#"+id+" img").attr("src","<?php echo plugin_dir_url( __FILE__ ).'assets/icons/praying-color3.png';?>");

			$(this).find('.plus1').addClass('show').animate({
				top: '-27px',
				opacity: '0',
			}, {
				duration : 400, 
				complete : function(){
    				set_hide(id);
    			}
    		});
			// console.log("log: "+id);
			var data_nya = [campaign_id, donate_id];
		    var data = {
		        "action": "djafunction_set_love",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
		    	<?php if($max_love!='0'){?>

		    	if(response=='cukup'){
		    		alert('Maaf, hanya boleh <?php echo $max_love; ?> kali');
				}
				<?php } ?>


		    });
			
		});



		function set_hide(id){
			$('#'+id+' .plus1').removeClass('show').removeAttr('style');
		}

		// Load Fundariser
		$('.load_fundraiser').bind("click", function(e) {
			var id = $(this).attr('id');
			var campaign_id = $(this).attr('data-id');
			var load_count = $(this).attr('data-count');
			var anonim = $(this).attr('data-anonim');
			var fullanonim = $(this).attr('data-fullanonim');
			$('#'+id).text('Load more...');

			var data_nya = [id, campaign_id, load_count, anonim, fullanonim];
		    var data = {
		        "action": "djafunction_load_fundraiser",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
		    	if(response==''){
					$('#box_btn_'+id+' .loadmore_info').html('No more data').slideDown();
			        setTimeout(function() {
			            $('#box_btn_'+id+' .loadmore_info').hide()
			        }, 5000)
				}
		        
		        load_count = parseFloat(load_count)+1;
		        $('#'+id).attr('data-count', load_count).text('Load more');;
				$('#box_'+id).append(response);

		    })

		});


		// Load Doa Donatur
		$('.load_doa_donatur').bind("click", function(e) {
			var id = $(this).attr('id');
			var campaign_id = $(this).attr('data-id');
			var load_count = $(this).attr('data-count');
			var anonim = $(this).attr('data-anonim');
			var fullanonim = $(this).attr('data-fullanonim');
			$('#'+id).text('Load more...');

			var data_nya = [id, campaign_id, load_count, anonim, fullanonim];
		    var data = {
		        "action": "djafunction_load_doa_donatur",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
		    	if(response==''){
					$('#box_btn_'+id+' .loadmore_info').html('No more data').slideDown();
			        setTimeout(function() {
			            $('#box_btn_'+id+' .loadmore_info').hide()
			        }, 5000)
				}
		        
		        load_count = parseFloat(load_count)+1;
		        $('#'+id).attr('data-count', load_count).text('Load more');;
				$('#box_'+id).append(response);

		    })

		});

		// Load Data Donatur
		$('.load_data_donatur').bind("click", function(e) {
			var id = $(this).attr('id');
			var campaign_id = $(this).attr('data-id');
			var load_count = $(this).attr('data-count');
			var anonim = $(this).attr('data-anonim');
			var fullanonim = $(this).attr('data-fullanonim');
			var act = $(this).attr('data-act');
			$('#'+id).text('Load more...');

			var data_nya = [id, campaign_id, load_count, anonim, fullanonim, act];
		    var data = {
		        "action": "djafunction_load_data_donatur",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
		    	if(response==''){
					$('#box_btn_'+id+' .loadmore_info').html('No more data').slideDown();
			        setTimeout(function() {
			            $('#box_btn_'+id+' .loadmore_info').hide()
			        }, 5000)
				}
		        
		        load_count = parseFloat(load_count)+1;
		        $('#'+id).attr('data-count', load_count).text('Load more');;
				$('#box_'+id).append(response);

		    })

		});

	</script>

	<?php if($gtm_id!=''){ ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo $gtm_id;?>"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    <?php } ?>
</body>
</html>
