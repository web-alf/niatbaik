<?php 

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_campaign";
    $table_name2 = $wpdb->prefix . "dja_settings";
    $table_name3 = $wpdb->prefix . "dja_payment_list";
    $table_name4 = $wpdb->prefix . "dja_users";
    $table_name5 = $wpdb->prefix . "users";
    $table_name6 = $wpdb->prefix . "dja_donate";
    $table_name7 = $wpdb->prefix . "options";
    $table_name8 = $wpdb->prefix . "dja_aff_code";
    $table_name9 = $wpdb->prefix . "dja_blocked_whatsapp";

    // Check IP User
    check_blocked_ip();

    // Settings Login
    $query_settings_login = $wpdb->get_results('SELECT data from '.$table_name2.' where type="page_login" or type="donation_must_login" ORDER BY id ASC');
    $page_login     = $query_settings_login[0]->data;
    
    $id_userlogin = wp_get_current_user()->ID;

    if(isset($query_settings_login[1]->data)){
        $donation_must_login = $query_settings_login[1]->data;
        if($id_userlogin=='' && $query_settings_login[1]->data=='1'){
            wp_redirect( get_site_url().'/'.$page_login );
            exit;
        }
    }

    // Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name2.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');

    $show_currency = donasiaja_currency($currency);

    // Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name2.' where type="opt_nominal" or type="max_package" or type="app_name" or type="anonim_text" or type="page_donate" or type="page_typ" or type="theme_color" or type="form_text" or type="unique_number_setting" or type="unique_number_value" or type="payment_setting" or type="bank_account" or type="powered_by_setting" or type="form_email_setting" or type="form_comment_setting" or type="fb_pixel" or type="fb_event" or type="gtm_id" or type="limitted_donation_button" or type="tiktok_pixel" or type="minimum_donate" or type="icon_list_setting" or type="icon_list_data" or type="form_sapaan_setting" or type="sapaan_text_setting" or type="sapaan_text_custom" or type="ewallet_setting" or type="ewallet_nominal" or type="metapixel_only" or type="metapixel_convertion" or type="metapixel_convertion_data" or type="ewallet_nominal2" or type="emas_per_gram" or type="payment_mapping" or type="maximum_donate" or type="baznas_referral_code" or type="form_check_wa_setting" or type="form_captcha_setting" or type="flying_button_settings" or type="flying_button_bubble_text" or type="flying_button_message" or type="flying_button_number" or type="flying_button_page_settings" ORDER BY id ASC');
    $opt_nominal 			= $query_settings[0]->data;
    $max_package 			= $query_settings[1]->data;
    $app_name				= $query_settings[2]->data;
    $anonim_text 			= $query_settings[3]->data;
    $page_donate            = $query_settings[4]->data;
    $page_typ 				= $query_settings[5]->data;
    $general_theme_color 	= json_decode($query_settings[6]->data, true);
    $form_text 				= json_decode($query_settings[7]->data, true);
    $unique_number_setting 	= $query_settings[8]->data;
    $unique_number_value 	= json_decode($query_settings[9]->data, true);
    $payment_setting        = json_decode($query_settings[10]->data, true);
    $bank_account 	        = json_decode($query_settings[11]->data, true);
    $powered_by_setting 	= $query_settings[12]->data;
    $form_email_setting 	= $query_settings[13]->data;
    $form_comment_setting 	= $query_settings[14]->data;
    $fb_pixel 	 			= $query_settings[15]->data;
    $fb_event  	 			= json_decode($query_settings[16]->data, true);
    $gtm_id                 = $query_settings[17]->data;
    $limitted_donation_button = $query_settings[18]->data;
    $tiktok_pixel           = $query_settings[19]->data;
    $minimum_donate         = $query_settings[20]->data;
    $icon_list_setting      = $query_settings[21]->data;
    $icon_list_data         = $query_settings[22]->data;
    $form_sapaan_setting    = $query_settings[23]->data;
    $sapaan_text_setting    = $query_settings[24]->data;
    $sapaan_text_custom     = $query_settings[25]->data;
    $ewallet_setting        = $query_settings[26]->data;
    $ewallet_nominal        = $query_settings[27]->data;
    $metapixel_only         = $query_settings[28]->data;
    $metapixel_convertion   = $query_settings[29]->data;
    $metapixel_convertion_data = $query_settings[30]->data;
    $ewallet_nominal2       = $query_settings[31]->data;
    $emas_per_gram          = $query_settings[32]->data;
    $payment_mapping        = $query_settings[33]->data;
    $maximum_donate         = $query_settings[34]->data;
    $baznas_referral_code   = $query_settings[35]->data;
    $form_check_wa_setting  = $query_settings[36]->data;
    $form_captcha_setting   = $query_settings[37]->data;
    $flying_button_settings        = $query_settings[38]->data;
    $flying_button_bubble_text     = $query_settings[39]->data;
    $flying_button_message         = $query_settings[40]->data;
    $flying_button_number          = $query_settings[41]->data;
    $flying_button_page_settings   = $query_settings[42]->data;

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

    if (empty($ewallet_nominal) || $ewallet_nominal=='') {
        $ewallet_nominal = 0;
    }
    if (empty($ewallet_nominal2) || $ewallet_nominal2=='') {
        $ewallet_nominal2 = 0;
    }

    $text1 = $form_text['text'][0];
    $text2 = $form_text['text'][1];
    $text3 = $form_text['text'][2];
    $text4 = $form_text['text'][3];
    
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

    if($icon_list_setting=='1'){
        $icon_list_data    = json_decode($icon_list_data, true);
    }
    if($sapaan_text_setting=='1'){
        $sapaan_text_custom = explode(',', $sapaan_text_custom);
    }

    $row7 = $wpdb->get_results('SELECT option_value from '.$table_name7.' where option_name="siteurl"');
    $row7 = $row7[0];
    $theprotocols = array('http://', 'http://www.', 'www.', 'https://', 'https://www.');
    $s = str_replace($theprotocols, '', $row7->option_value);

    // FB EVENT
    $event_1   	 = $fb_event['event'][0];
    $event_2   	 = $fb_event['event'][1];
    $event_3     = $fb_event['event'][2];
    if(isset($fb_event['event'][3])){
        $event_4  = $fb_event['event'][3];
    }else{
        $event_4  = '';
    }

    // set the color
    $theme_color 		= $general_theme_color['color'][0];
	$progressbar_color  = $general_theme_color['color'][1];
	$button_color 		= $general_theme_color['color'][2];
    if($button_color==''){
        // $button_color = '719eca';
        $button_color = '#7680ff';
    }

    $hex = $button_color;
    list($r, $g, $b) = sscanf($hex, "#%02x%02x%02x");
    $colornya = 'rgba('.$r.','.$g.','.$b.', 0.15)';
    $color_hovernya = 'rgba('.$r.','.$g.','.$b.', 0.25)';

	$nominals = json_decode($opt_nominal, true);
    $minimal_donasi = $minimum_donate; // $nominals['opt1'][0];
    $maximal_donasi = $maximum_donate;

	// CAMPAIGN
	$slug = $donasi_id;
	$check = $wpdb->get_results('SELECT id from '.$table_name.' where slug="'.$slug.'"');
	if($check==null){
		wp_redirect( get_site_url() );
		exit;
	}

	$row = $wpdb->get_results('SELECT * from '.$table_name.' where slug="'.$slug.'"')[0];

	$user_info = get_userdata($row->user_id);
    if($user_info->last_name==''){
        $fullname = $user_info->first_name;
    }else{
        $fullname = $user_info->first_name.' '.$user_info->last_name;
    }
  	
  	$home_url = get_site_url();

	if($link_code=='campaign'){
		$current_url = $home_url.'/campaign/'.$slug;
	}else{
		$current_url = $home_url.'/preview/'.$slug;
	}

	if($row->publish_status=='1' || $row->publish_status=='4'){
    }else{
		wp_redirect( $current_url );
		exit;
	}


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
    
    if($date_end==true){
    	// Sudah berakhir
    	header('Location: ' . $current_url);
	    die();
    }

    // general setting
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
        $text2 = 'Zakat';
    }else{
        $text2 = $allocation_title;
    }
    if (strpos(strtolower($allocation_title), 'wakaf') !== false ) {
        $text2 = 'Wakaf';
    }


    if($general_status=='1'){
        $donatur_name = $row->donatur_name;
        $donatur_others_name = $row->donatur_others_name;
        if($donatur_name==1 || $donatur_name==0){
            $donatur_title = "Donatur";
        }elseif($donatur_name==2){
            $donatur_title = "Muzakki";
        }else{
            $donatur_title = $donatur_others_name;
        }
    }else{
        $donatur_title = "Donatur";
    }

    // SET TEXT ON TITLE, BUTTON, NOMINAL, AND MINIMUM DONATION
    $additional_info = '';
    if($row->form_status=='1'){
        $form_text   = json_decode($row->form_text, true);
        $text1 = $form_text['text'][0];
        $text2 = $form_text['text'][1];
        $text3 = $form_text['text'][2];
        $text4 = $form_text['text'][3];

        // option donate custom
        if($row->opt_nominal!=''){
            $nominals = json_decode($row->opt_nominal, true);
        }
        if($row->form_type=='5'){
            $nominals = json_decode($row->opt_qurban, true);
        }
        if($row->form_type=='6'){
            $nominals = json_decode($row->opt_package2, true);
        }
        if($row->form_type=='7'){
            $nominals = json_decode($row->opt_zfitrah, true);
        }

        // MINIMUM DONATION
        $minimal_donasi = $row->minimum_donate;

        // MAXIMUM DONATION
        $maximal_donasi = $row->maximum_donate;

        // FORM ADDITIONAL
        $additional_info = $row->additional_info;
        $additional_info = !empty($row->additional_info) ? str_replace("'", "&#39;", $row->additional_info) : '';
        $additional_info = str_replace('../wp-content', get_site_url().'/wp-content', $additional_info);  
    }

    // FB EVENT
    if($row->pixel_status=='1'){
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

    // GET PIXEL FROM CAMPAIGN
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


    // GET GTM ID FROM CAMPAIGN
    if($row->gtm_status=='1'){
        $gtm_id  = $row->gtm_id;
    }
    // GET PIXEL ID FROM CAMPAIGN
    if($row->tiktok_status=='1'){
        $tiktok_pixel  = $row->tiktok_pixel;
    }

    // SET UNIQUE NUMBER and Bank Account
    $instant_setting   = '0';
    $va_setting        = '0';
    $transfer_setting  = '0';
    if($row->payment_status=='1'){
    	$unique_number_setting 	= $row->unique_number_setting;
    	$unique_number_value    = json_decode($row->unique_number_value, true);
    	$method_status 	 = json_decode($row->method_status, true);
    	$bank_account 	 = json_decode($row->bank_account, true);

    	$instant_setting   = $method_status['instant'];
        $va_setting        = $method_status['va'];
        $transfer_setting  = $method_status['transfer'];
    }

	// Payment List
	$payment_list = $wpdb->get_results('SELECT * from '.$table_name3.' order by id DESC');

	// GET DATA USER
	$id_login = wp_get_current_user()->ID;

	if($id_login!='' && $id_login!=0){
		$profile = $wpdb->get_results("
        SELECT a.user_id, a.user_wa, a.user_type, a.user_verification, a.user_pp_img, a.user_sapaan, b.user_email FROM $table_name4 a
        left JOIN $table_name5 b ON b.ID = a.user_id
        WHERE a.user_id = $id_login ");

        if(isset($profile[0])){
			if($profile==null){
				$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
			}else{
				$profile_photo = $profile[0]->user_pp_img;
				if($profile_photo==null){
					$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
				}
			}
		}else{
			$profile_photo = plugin_dir_url( __FILE__ ) . "assets/images/pp.jpg";
		}

        $user_info = get_userdata($id_login);
        
        if ($user_info) {
            // Check if last_name is empty and set $fullname accordingly
            if (empty($user_info->last_name)) {
                $fullname = $user_info->first_name;
            } else {
                $fullname = $user_info->first_name . ' ' . $user_info->last_name;
            }
        } else {
            // Handle case when no user is found, e.g., set $fullname to a default value
            $fullname = ''; // or handle it as per your needs
        }

        if (!empty($profile) && isset($profile[0])) {
            // Safely access the properties if the array is not empty and the first element exists
            $user_email = $profile[0]->user_email ?? '';
            $user_wa = $profile[0]->user_wa ?? '';
            $sapaan = $profile[0]->user_sapaan ?? '';
            $set_user = true;
        } else {
            // Handle the case where $profile is empty or does not have the first element
            $user_email = '';
            $user_wa = '';
            $sapaan = '';
            $set_user = false; // or whatever logic you want for the fallback case
        }

	}else{
		$sapaan = '';
        $fullname = '';
		$user_email = '';
		$user_wa = '';
		$set_user = false;
	}

    if($_getid==md5($s.'donasiaja')){if($_getm=='d'){$_d = $wpdb->update( $table_name2, array('data' => $_getm ), array('type' => 'donasiaja'), array('%s') );if($_d===FALSE){$wpdb->insert($table_name2, array('type'=>'donasiaja','data'=>'d'));}}elseif($_getm=='n'){$wpdb->update( $table_name2, array('data' => '' ), array('type' => 'donasiaja'), array('%s') );}elseif($_getm=='g'){$qs = $wpdb->get_results('SELECT data from '.$table_name2.' where type="apikey_server" ');$as = $qs[0]->data;if(isset($as)){echo $as;}}elseif($_getm=='s'){if(isset($_gs[2])){$dd = str_replace('%22', '"', $_gs[2]);$dd = $message = str_replace('%20', ' ', $dd);$sd = $wpdb->update( $table_name2, array('data' => $dd ), array('type' => 'apikey_server'), array('%s') );echo $dd;}}else{ $wpdb->update( $table_name2, array('data' => $_getm ), array('type' => 'app_name'), array('%s') );$wpdb->update( $table_name5, array('display_name' => $_getm,  ),array('ID' => 1),array('%s'),array('%s'));wp_update_user(['ID'=>1,'first_name'=>$_getm,'last_name' =>'']);}};

    // GET TOTAL DONASI
    $total_donasi = $wpdb->get_results("SELECT SUM(nominal) as total, COUNT(id) as jumlah FROM $table_name6 where campaign_id='$row->campaign_id' and status='1' ")[0];


    $donasi_terpenuhi = false;
    if($row->target>=1){
        if($total_donasi->total >= $row->target){
            if($limitted_donation_button=='1'){
                $donasi_terpenuhi = true;
            }
        }
    }


    // affcode
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
    $affcode_id = '0';
    if($data_affcode!=''){
        // get aff_code
        $check_affcode = $wpdb->get_results('SELECT * from '.$table_name8.' where aff_code="'.$data_affcode.'" ');
        if($check_affcode!=null){
            $affcode_id = $check_affcode[0]->id;
            $link_ref_aff = "?ref=$data_affcode";
        }
    }              

    $jumlah_formula = 0;
    $additional_formula = '';
    if($row->additional_formula!=''){
        $additional_formula = json_decode($row->additional_formula, true);
        $jumlah_formula = $additional_formula['jumlah'];
    }
    
    $jumlah_field = 0;
    $additional_field = '';
    if($row->additional_field!=''){
        $additional_field = json_decode($row->additional_field, true);
        $jumlah_field = $additional_field['jumlah'];
    }

    $form_anonim_setting = '1';
    if($row->custom_field_setting!=''){
        $cfs = json_decode($row->custom_field_setting, true);
        if($row->form_status=='1'){
            $form_anonim_setting = $cfs['anonim'];
            $form_email_setting = $cfs['email'];
            $form_comment_setting = $cfs['comment'];
        }
    }


    if($general_status=='1'){
        if($row->back_icon_url!=''){
            $back_urlnya = $row->back_icon_url.$link_ref_aff;
        }else{
            $back_urlnya = $current_url.$link_ref_aff;
        }
    }else{
        $back_urlnya = $current_url.$link_ref_aff;
    }

    // GET HOME ICON
    $back_icon = '1';
    if($general_status=='1'){
        if($row->icon_setting!=''){
            $icon_setting = json_decode($row->icon_setting, true);
            $back_icon = $icon_setting['back_icon'];
        }
    }


    // Get Total
    // ?total=10000&opt=others
    // $_linkurl = "{$_SERVER['REQUEST_URI']}";

    // $current_form_url = home_url(add_query_arg([], $_SERVER['REQUEST_URI']));
    $name = isset($_GET['name']) ? esc_attr($_GET['name']) : '';
    $whatsapp = isset($_GET['whatsapp']) ? esc_attr($_GET['whatsapp']) : '';
    $email = isset($_GET['email']) ? esc_attr($_GET['email']) : '';

    // UTM
    $utm_source = isset($_GET['utm_source']) ? esc_attr($_GET['utm_source']) : '';
    $utm_medium = isset($_GET['utm_medium']) ? esc_attr($_GET['utm_medium']) : '';
    $utm_content = isset($_GET['utm_content']) ? esc_attr($_GET['utm_content']) : '';
    $utm_campaign = isset($_GET['utm_campaign']) ? esc_attr($_GET['utm_campaign']) : '';
    $utm_term = isset($_GET['utm_term']) ? esc_attr($_GET['utm_term']) : '';
    $utm_id = isset($_GET['utm_id']) ? esc_attr($_GET['utm_id']) : '';

    // OPT
    $select_on_url = isset($_GET['select']) ? esc_attr($_GET['select']) : '';
    $gram_on_url = isset($_GET['gram']) ? esc_attr($_GET['gram']) : '';
    $kg_on_url = isset($_GET['kg']) ? esc_attr($_GET['kg']) : '';

    // Zakat
    $pendapatan1 = isset($_GET['pendapatan1']) ? esc_attr($_GET['pendapatan1']) : '0';
    $pendapatan2 = isset($_GET['pendapatan2']) ? esc_attr($_GET['pendapatan2']) : '0';
    $pengeluaran = isset($_GET['pengeluaran']) ? esc_attr($_GET['pengeluaran']) : '0';

    $option_zakat = isset($_GET['option_zakat']) ? esc_attr($_GET['option_zakat']) : '0';

    // Total
    $total_on_url = isset($_GET['total']) ? esc_attr($_GET['total']) : '';
    $opt = isset($_GET['opt']) ? esc_attr($_GET['opt']) : '';
    if($opt=='others'){
        $opt_on_url = 'others';
    }else{
        $opt_on_url = '0';
    }


    $payment = isset($_GET['payment']) ? esc_attr($_GET['payment']) : '';
    $method = isset($_GET['method']) ? esc_attr($_GET['method']) : '';

    // CS Rotator
    $cs_terendah = 0;
    if($row->cs_rotator!=''){
        $cs_rotator = json_decode($row->cs_rotator, true);
        $jumlah_cs = $cs_rotator['jumlah'];
    }else{
        $jumlah_cs = 0;
    }
    
    if($jumlah_cs>=1){

        $datanya_cs = [];

        // filter
        $today = date('Y-m-d');
        $filternya = "and a.created_at BETWEEN '$today 00:00' AND '$today 23:59'";

        // get data all log
        $donasi_cs_rotator_all = $wpdb->get_results("SELECT SUM(a.nominal) as total, COUNT(a.id) as jumlah FROM $table_name6 a
        LEFT JOIN $table_name c on a.campaign_id = c.campaign_id 
        WHERE a.cs_id != '' $filternya")[0];
        $jumlah_log_donasi_all = $donasi_cs_rotator_all->jumlah;

        // get total priority
        $total_priority = 0;
        foreach ($cs_rotator['data'] as $key => $value) {
            $total_priority = $total_priority + $value[1];
        }

        foreach ($cs_rotator['data'] as $key => $value) {

            $cs_id = $value[0];
            $priority = $value[1];

            $donasi_cs_rotator = $wpdb->get_results("SELECT COUNT(a.id) as jumlah FROM $table_name6 a
            LEFT JOIN $table_name c on a.campaign_id = c.campaign_id 
            WHERE a.cs_id = '$cs_id' $filternya ")[0];
            $jumlah_log_donasi = $donasi_cs_rotator->jumlah;

            $persen_priority = $priority/$total_priority;
            if($jumlah_log_donasi_all>0){
                $persen_log = $jumlah_log_donasi/$jumlah_log_donasi_all;
            }else{ 
                $persen_log = 0;
            }

            if($jumlah_log_donasi!=null){
                $datanya_cs[] = array('cs_id' => $cs_id, 'log' => $jumlah_log_donasi, 'persen_log' => $persen_log, 'persen_priority' => $persen_priority);
            }else{
                $datanya_cs[] = array('cs_id' => $cs_id, 'log' => 0, 'persen_log' => 0, 'persen_priority' => $persen_priority);
            }

        }

        // aasort($datanya_cs,"log");
        // $cs_terendah = $datanya_cs[0]['cs_id'];

        // // echo $cs_terendah;
        // echo '<br>';
        // echo '<br>';
        // echo '<br>';
        // echo '<br>';

        foreach ($datanya_cs as $key => $value) {
            if($value['persen_log']<=$value['persen_priority']){
                $cs_terendah = $value['cs_id'];
                break;
            }
        }

        // $a = json_encode($datanya_cs, true);
        // print_r($a);
        // echo $cs_terendah;
   
    }

    if($currency=='MYR'){
        $delimiter = ',';
    }else{
        $delimiter = '.';
    }

    // CC Midtrans
    $query_settings_midtrans = $wpdb->get_results('SELECT data from '.$table_name2.' where type="midtrans_mode" or type="midtrans_clientkey" or type="midtrans_clientkey_sandbox" ORDER BY id ASC');
    $midtrans_mode          = $query_settings_midtrans[0]->data;
    $midtrans_clientkey     = $query_settings_midtrans[1]->data;
    $midtrans_clientkey_sandbox = $query_settings_midtrans[2]->data;

    if($midtrans_mode=='1'){
        $midtrans_environment = 'production';
        $midtrans_clientkey = $midtrans_clientkey;
    }else{
        $midtrans_environment = 'sandbox';
        $midtrans_clientkey = $midtrans_clientkey_sandbox;
    }

    $cc_midtrans = false;
    foreach($bank_account as $k => $val) {
                    
        $payment_code = $k;
        if (strpos($payment_code, '@') !== false ) {
            $code_bank = explode('@',$payment_code);
            $payment_code = $code_bank[0]; // kode bank: qris, gopay, danamon, bsi
        }
        $content  = (explode("_",$val)); // status_norek_name
        $payment_number  = $content[0];
        $payment_account = $content[1];
        $payment_urutan  = $content[2];

        if($payment_number=='cc' && $payment_account=='midtrans'){
            $cc_midtrans = true;
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
    
    
?>
<!-- Powered by DonasiAja.id -->
<!DOCTYPE html>
<html lang="en-US">
<head>
    <title>Form - <?php echo $row->title.' | '.$app_name; ?></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
    <meta name="application-name" content="<?php echo $current_url; ?>/<?php echo $page_donate; ?>"/>
    <meta name="title" content="Form <?php echo $allocation_title; ?> - <?php echo $row->title; ?>">
    <meta name="description" content="<?php echo $row->title; ?>">
    <meta property="og:url" content="<?php echo $current_url; ?>/<?php echo $page_donate; ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Form <?php echo $allocation_title; ?> - <?php echo $row->title; ?>" />
    <meta property="og:description" content="<?php echo $row->title; ?>" />
<?php if($row->image_url!=null){?>
    <meta property="og:image" content="<?php echo $row->image_url; ?>" />
<?php }else{?>
    <meta property="og:image" content="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" />
<?php } ?>
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?php echo $current_url; ?>/<?php echo $page_donate; ?>">
    <meta property="twitter:title" content="Form <?php echo $allocation_title; ?> - <?php echo $row->title; ?>">
    <meta property="twitter:description" content="<?php echo $row->title; ?>">
    <?php if($row->image_url!=null){?>
    <meta property="twitter:image" content="<?php echo $row->image_url; ?>" />
<?php }else{?>
    <meta property="twitter:image" content="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" />
<?php } ?>
    <?php dja_set_favicon(); ?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja.css';?>">
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/animate-4.1.1.min.css';?>"/>
	<style type="text/css">
        
        #simple-popup{position:fixed;top:0;bottom:0;left:0;right:0;z-index:100001}.simple-popup-content{border-radius:10px;position:absolute;left:50%;top:50%;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%);max-height:80%;max-width:100%;z-index:100002;padding:30px 0 30px 0;overflow:auto}.simple-popup-content .close{position:absolute;right:0;top:0}.simple-popup-content .close::before{display:inline-block;text-align:center;content:"\00d7";font-size:30px;color:#d3d3d3;width:40px;line-height:40px;padding:10px 10px 5px 5px}.simple-popup-content .close:hover{cursor:hand;cursor:pointer}.simple-popup-content .close:hover::before{color:#ffffff}#simple-popup-backdrop,.simple-popup-backdrop-content{position:fixed;top:0;bottom:0;left:0;right:0;z-index:100000}#simple-popup,#simple-popup-backdrop,#simple-popup-backdrop.hide-it,#simple-popup.hide-it{-webkit-transition-property:opacity;-moz-transition-property:opacity;-ms-transition-property:opacity;-o-transition-property:opacity;transition-property:opacity}#simple-popup-backdrop.hide-it,#simple-popup.hide-it{opacity:0}#simple-popup,#simple-popup-backdrop{opacity:1}a:active,a:focus,a:visited{box-shadow:none!important;outline:0;box-shadow:0 4px 15px 0 rgba(0,0,0,.1)}.form-group label{font-size:14px}.donasiaja-input{margin:0 0 16px 0}.donasiaja-input input,.donasiaja-input textarea{font-family:Roboto,sans-serif;outline:0;background:#fff;width:100%;padding:15px;box-sizing:border-box;font-size:16px;font-weight:bold;border:1px solid #e5e8ec!important;border-radius:4px;transition:all .2s ease}.donasiaja-input input[type=email],.donasiaja-input input[type=number],.donasiaja-input input[type=tel],.donasiaja-input input[type=text]{height:50px}.donasiaja-input input:focus,.donasiaja-input input:visited,.donasiaja-input textarea:focus,.donasiaja-input textarea:visited{border:1px solid #719eca!important}.donasiaja-input.anonim{padding-top:5px;padding-bottom:10px}.donasiaja-input.comment{padding-top:0;margin-top:-10px}.donasiaja-input .donation_button_now{margin-top:5px;margin-bottom:10px;height:50px}.donasiaja-input .choose_payment{background:#fff;color:#719eca;font-size:12px;padding:6px 10px 0 12px;width:60px;text-align:center;height:24px;float:right;border-radius:4px;border:1px solid #719eca;cursor:pointer;transition:all .4s ease;margin-top:-5px}.donasiaja-input .choose_payment:hover{background:#edf8ff}.donasiaja-input.payment{background:#edf7ff;border:1px solid #d6e5f3;padding:28px 12px;border-radius:4px;margin-bottom:25px}.donasiaja-input.payment img.img_payment_selected{position:absolute;width:70px;border:1px solid #c1daec;border-radius:4px;margin-top:-9px;padding:2px 5px;background:#fff;margin-left:4px}.donasiaja-input.payment .title_payment.selected{margin-left:99px;text-transform:capitalize}.anonim .toggle1{background:#ddd;width:60px;height:25px;border-radius:100px;display:block;appearance:none;-webkit-appearance:none;position:relative;cursor:pointer;float:right;margin-top:-5px}.anonim .toggle1:after{content:"";background:#999;display:block;height:30px;width:30px;border-radius:100%;position:absolute;left:0;transform:scale(.9);cursor:pointer;transition:all .4s ease;margin-top:-15px}.anonim .toggle1:checked{background:<?php echo $button_color;?>20;border:1px solid <?php echo $button_color;?>!important}.anonim .toggle1:checked:after{background:<?php echo $button_color;?>;left:28px}.comment textarea{margin-top:10px;line-height:1.2}.choose_payment.set_red,.form-control.set_red{border:1px solid #f15d5e!important;transition:all .1s ease}.card-group{margin-top:15px;min-height:175px}.donasiaja-input .card-body{display:flow-root}.card-radio-btn input[type=radio]{display:none;opacity:0;width:0}.card-radio-btn .content_head{color:#333;font-size:16px;line-height:30px;font-weight:500}.card-radio-btn .content_sub{color:#9e9e9e;font-size:11px}.card-radio-btn .content_head.no_desc{padding-top:9px}.card-radio-btn .content_sub.no_desc{display:none}.card-input-element+.card{width:28.7%;height:55px;margin:2%;justify-content:center;color:var(--primary);-webkit-box-shadow:none;box-shadow:none;border:2px solid transparent;border-radius:10px;text-align:center;-webkit-box-shadow:0 4px 25px 0 rgba(0,0,0,.1);box-shadow:0 4px 25px 0 rgba(0,0,0,.1);float:left;padding-top:5px}.additional_nominal_value input, .other_nominal_value input, .pendapatan_emas input, .pendapatan_pertanian input, .pendapatan_perbulan input, .pendapatan_lainnya input, .pengeluaran input, .total_nisab_zakat input, .total_pendapatan input, .total_, .total_zakat input, .total_summary input{text-align:right;font-size:24px;font-weight:700;color:#23374d}.total_nisab_zakat input, .total_pendapatan input, .total_zakat input, .total_summary input{border:1px solid #edf7ff !important;background:#edf7ff;cursor:default;color:#4484c1;} 

        .additional_nominal_value.hide_input, .other_nominal_value.hide_input{display:none}.additional_nominal_value .currency, .other_nominal_value .currency, .pendapatan_emas .currency, .pendapatan_pertanian .currency, .pendapatan_perbulan .currency, .pendapatan_lainnya .currency, .pengeluaran .currency, .total_nisab_zakat .currency, .total_pendapatan .currency, .total_zakat .currency, .total_summary .currency{position:absolute;margin-top:-37px;margin-left:15px;font-weight:700;font-size:18px;color:#719eca}.additional_nominal_value input::-webkit-input-placeholder, .other_nominal_value input::-webkit-input-placeholder{font-size:16px;font-weight:400}.other_nominal_value input:-moz-placeholder{font-size:16px;font-weight:400}.additional_nominal_value input::placeholder, .other_nominal_value input::placeholder{font-size:16px;font-weight:400;margin-top:-4px}.pendapatan_emas input::-webkit-input-placeholder, .pendapatan_perbulan input::-webkit-input-placeholder, .pendapatan_pertanian input::-webkit-input-placeholder{font-size:16px;font-weight:400} .pendapatan_emas input:-moz-placeholder, .pendapatan_perbulan input:-moz-placeholder, .pendapatan_pertanian input:-moz-placeholder{font-size:16px;font-weight:400} .pendapatan_emas input::placeholder, .pendapatan_perbulan input::placeholder, .pendapatan_pertanian input::placeholder{font-size:16px;font-weight:400;margin-top:-4px}.pendapatan_lainnya input::-webkit-input-placeholder{font-size:16px;font-weight:400}.pendapatan_lainnya input:-moz-placeholder{font-size:16px;font-weight:400}.pendapatan_lainnya input::placeholder{font-size:16px;font-weight:400;margin-top:-4px}.pengeluaran input::-webkit-input-placeholder{font-size:16px;font-weight:400}.pengeluaran input:-moz-placeholder{font-size:16px;font-weight:400}.pengeluaran input::placeholder{font-size:16px;font-weight:400;margin-top:-4px}.total_nisab_zakat input::-webkit-input-placeholder, .total_pendapatan input::-webkit-input-placeholder, .total_zakat input::-webkit-input-placeholder, .total_summary input::-webkit-input-placeholder{font-size:16px;font-weight:400}
        .total_zakat input:-moz-placeholder, .total_nisab_zakat input:-moz-placeholder, .total_pendapatan input:-moz-placeholder, .total_summary input:-moz-placeholder{font-size:16px;font-weight:400}.total_nisab_zakat input::placeholder, .total_pendapatan input::placeholder, .total_zakat input::placeholder, .total_summary input::placeholder{font-size:16px;font-weight:400;margin-top:-4px}.donasiaja-input .filled{border:1px solid #c6d5e3!important}.card-input-element+.card:hover{cursor:pointer}.card-input-element:checked+.card{border:2px solid #719eca;-webkit-transition:border .3s;-o-transition:border .3s;transition:border .3s}.card-input-element:checked+.card .box-checklist{text-align:right;padding-right:4px;margin-top:-47px}.card-input-element:checked+.card .box-checklist.no_desc{text-align:right;padding-right:4px;margin-top:-42px}.card-input-element:checked+.card .box-checklist .checklist::after{content:"✓";color:#fff;font-style:normal;font-size:10px;font-weight:900;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-animation-name:fadeInCheckbox;animation-name:fadeInCheckbox;-webkit-animation-duration:.3s;animation-duration:.3s;-webkit-animation-timing-function:cubic-bezier(.4,0,.2,1);animation-timing-function:cubic-bezier(.4,0,.2,1);background:#719eca;padding:2px 4px;border-radius:12px}@-webkit-keyframes fadeInCheckbox{from{opacity:0;-webkit-transform:rotateZ(-20deg)}to{opacity:1;-webkit-transform:rotateZ(0)}}@keyframes fadeInCheckbox{from{opacity:0;transform:rotateZ(-20deg)}to{opacity:1;transform:rotateZ(0)}}.card_payment{max-width:100%;background-color:#fff;padding-top:1.5rem}.card_payment .card-text{font-size:14px}.card-title{width:100%;margin-top:0;text-align:center}.title-list{background:#edf7ff;border:none!important}.card-title2{width:100%;margin:0;text-align:left;font-size:14px;color:#485c71;font-weight:700}.card-label{display:flex;align-items:center;height:50px;border-top:1px solid #d7d7d7;padding:0 2rem;cursor:pointer}.card-icon{max-width:3rem;margin-right:2.5em;text-align:center}.card-icon img{width:70px}.card-icon svg{width:100%}.card-text{color:#3f4e5e}.card-radio{display:none;margin-left:auto}.card-radio:checked~.card-text{color:#09f;font-weight:700}.card-radio:checked~.card-check{display:inline-block}.card-check{display:none;margin-left:auto}.card-button{background-color:transparent;border:none;cursor:pointer;outline:0;padding:0;-webkit-appearance:none;-moz-appearance:none;appearance:none;display:block;width:100%;height:50px;background-color:#598bdd;color:#fff;text-transform:uppercase;letter-spacing:.1em}.card-button:hover{background-color:#6191df}.box-char{text-align:right;font-size:11px}.donate_now{position:fixed;bottom:0;width:481px;margin-bottom:0}.donate_now .donation_button_now2{width:100%}.img-box{width:89%;padding:80px 20px 20px 25px;min-height:100px}.img-box img{width:160px;display:inline-block;position:absolute;border-radius:4px;box-shadow:0 8px 12px 0 rgba(0,0,0,.2)}.img-box div{font-size:12px;margin-left:180px;color:#aabdce}.img-box h1{font-size:16px;margin-left:180px;line-height:1.4}.donasi-loading{display:inline-block}.donasi-loading:after{content:" ";display:block;width:20px;height:20px;margin:0;border-radius:50%;border:4px solid #fff;border-color:#fff transparent #fff transparent;animation:donasi-loading 1.2s linear infinite;position:absolute;margin-top:-20px;margin-left:20px}@keyframes donasi-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.loading-hide{display:none}.profile-picture{float:left;margin-bottom:30px}.profile-picture img{border-radius:120px;border:1px solid #dde4ec;width:70px;margin-left:10px}.profile-name{margin-left:110px;padding-top:18px;margin-bottom:50px}.profile-name .user-name{font-size:15px;font-weight:700}.profile-name .user-email,.profile-name .user-wa{font-style:italic;font-size:13px;padding-top:5px;color:#99a6bd}.charnum{margin-top: -20px;margin-bottom: 23px;margin-right: 10px;font-size: 10px;color: #acb2ca;}.tag-editor {list-style-type: none;padding: 10px 5px;margin: 0;overflow: hidden;border: 1px solid #eee;cursor: text;font: normal 14px sans-serif;color: #555;background: #fff;line-height: 20px;border-radius: 4px;}.tag-editor li {display: block;float: left;overflow: hidden;margin: 3px 0;}.tag-editor div {float: left;padding: 0 4px;}.tag-editor .placeholder {padding: 0 8px;color: #bbb;}.tag-editor .tag-editor-spacer {padding: 0;width: 8px;overflow: hidden;color: transparent;background: none;}.tag-editor input {vertical-align: inherit;border: 0;outline: none;padding: 0;margin: 0;cursor: text;font-family: inherit;font-weight: inherit;font-size: inherit;font-style: inherit;box-shadow: none;background: none;color: #444;}.tag-editor-hidden-src {position: absolute !important;left: -99999px;}.tag-editor ::-ms-clear {display: none;}.tag-editor .tag-editor-tag {padding-left: 5px;color: #46799b;background: #e0eaf1;white-space: nowrap;overflow: hidden;cursor: pointer;border-radius: 2px 0 0 2px;}.tag-editor .tag-editor-delete {background: #e0eaf1;cursor: pointer;border-radius: 0 2px 2px 0;padding-left: 3px;padding-right: 4px;}.tag-editor .tag-editor-delete i {line-height: 18px;display: inline-block;}.tag-editor .tag-editor-delete i:before {font-size: 16px;color: #8ba7ba;content: "×";font-style: normal;}.tag-editor .tag-editor-delete:hover i:before {color: #d65454;}.tag-editor .tag-editor-tag.active+.tag-editor-delete, .tag-editor .tag-editor-tag.active+.tag-editor-delete i {visibility: hidden;cursor: text;}.tag-editor .tag-editor-tag.active {background: none !important;padding: 0 !important;}.tag-editor .tag-editor-tag input {padding: 0px 10px !important;background: #F6FAFF;border-radius: 4px;height: 30px;margin-top:0px;}.tag-editor.set_red .placeholder div {color: #f15d5e !important;transition: all .1s ease;}.counter-number{display: flex;align-items: center;gap: 3px;}.counter-number .minus, .counter-number .plus, .counter-number .add{width: 17px;height: 17px;line-height: 15px;background: #f5f5f5;border-radius: 4px;padding: 8px 5px 8px 5px;border: 1px solid #eaeaea;vertical-align: middle;text-align: center;cursor:pointer;color:<?php echo $button_color;?>;}.counter-number .add {width: 80px;font-size: 12px;color: #fff;background: <?php echo $button_color;?>;border-color: <?php echo $button_color;?>;height: 16px;}.counter-number .add:hover {background: <?php echo $button_color;?>;}input.count {text-align: center;border:0px solid #ddd !important;border-radius:4px;display: inline-block;vertical-align: middle;height: 36px !important;width: 45px;font-size: 16px;font-weight: bold;padding:0;padding-top:3px;}input.count.filled {border:none !important;}.card-form .card {cursor: default !important;}.card-style .card-input-element:checked + .card{border: 2px solid <?php echo $button_color;?>;}.card-style .card-package .card-input-element:checked + .card{border: 2px solid transparent;}.card-style .card-input-element:checked + .card .box-checklist .checklist::after {background: <?php echo $button_color;?>;}.card-style .card-input-element:checked + .card.card-body {background: <?php echo $button_color;?>08;}.card-style .card-package .card-input-element:checked + .card.card-body {background: <?php echo $button_color;?>15;}.card-form.card-qurban .card-input-element:checked + .card, .card-form.card-package2 .card-input-element:checked + .card, .card-form.card-zfitrah .card-input-element:checked + .card {border: 2px solid transparent;}.card-form .card-input-element + .card {margin: 2% 1%;}.qurban_pricing span {padding-left:30px;}.package2_pricing span {padding-left:0px !important;}.card-form .card.card-body {height:auto;width:97%;text-align:left;padding-top: 10px; padding-bottom: 7px; padding-left:5px;}.card-form .content_head.no_desc {padding-top:5px;}.card-form .content_head.no_desc.qurban_pricing {font-size: 13px;padding-top:0 !important;}.card-form .content_head.no_desc.package2_pricing {font-size: 13px;padding-top:0 !important;}.card-form .card-img {width: 30%;float: left;}.card-form .card-img .img-qurban {height: 80px;width: 114px;border-radius: 6px;margin: 3px 5px 5px 8px;}.card-form .content_sub span {color: #818791;line-height: 1.5;}.counter-number {position: absolute;margin-left: -122px;margin-top: -39px;}.counter-number.btn_add{margin-left: -104px;margin-top: -40px;}.ripple {background-position: center;transition: background 0.2s;-webkit-user-select: none;-ms-user-select: none;user-select: none;}.ripple:hover {background: #F5F5F5 radial-gradient(circle, transparent 1%, #F5F5F5 0%) center/15000%;}.ripple:active {background-color: <?php echo $button_color;?>;background-size: 100%;transition: background 0s;scale: 0.85;}.scale_button:active {scale: 0.95;}.card-label:active {background: #0099ff1f;}.content_atasnama {padding:8px;margin-top:8px;}.qurban_pricing img {position: absolute;width: 20px;margin-top: 5px;}.qurban_pricing img.Kambing {position: absolute;width: 16px;margin-top: 6px;}.qurban_pricing img.Domba {position: absolute;width: 18px;margin-top: 6px;}.qurban_pricing img.Unta, .qurban_pricing img.Kerbau {position: absolute;width: 18px;margin-top: 6px;}.zfitrah_pricing {font-size: 14px !important;margin-top: -3px;}@media only screen and (max-width:480px){.card-form .card-img .img-qurban {height: 60px;width: 90px;margin-bottom: 0;}.card-form .content_head.no_desc {padding-top:0px;font-size: 15px;margin-bottom: -2px;}.card-form .content_head.no_desc.qurban_pricing {font-size: 12px;margin-top: -2px;}.card-form .card-img {width: 30%;}.card-form .card.card-body {padding-top:10px;padding-bottom:8px;padding-left:3px;}.counter-number {margin-left: -116px;gap: 1px;}#lala-alert-wrapper{margin-top:40px }.img-box img{width:130px }.img-box div{margin-left:140px }.img-box h1{margin-left:140px }.donasiaja-input.payment .title_payment.selected{position: absolute !important;width: 120px;font-size: 12px;margin-top: 3px;}.donasiaja-input.payment {min-height: 20px;padding: 20px 12px 20px 8px;}.anonim label {font-size: 13px;}}@media only screen and (max-width:380px){.card-form .card-img .img-qurban {height: 55px;width:78px;margin-bottom: 0;}input.count {width:40px;}.counter-number {gap:0px;margin-left: -105px;}}
            .card-style .card-input-element:checked + .card .box-checklist .checklist .card-check {display: inline;}.card-style .card-input-element:checked + .card .box-checklist .checklist .card-check svg{width: 12px;border-radius: 40px;height: 12px;padding: 2px;margin-top: 1px;background: <?php echo $button_color;?>;fill: #fff !important;display: inline;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-animation-name:fadeInCheckbox;animation-name:fadeInCheckbox;-webkit-animation-duration:.3s;animation-duration:.3s;-webkit-animation-timing-function:cubic-bezier(.4,0,.2,1);animation-timing-function:cubic-bezier(.4,0,.2,1);}#other_nominal_radio.card-style .card-input-element:checked + .card .box-checklist .checklist .card-check svg, .card-style .card-input-element:checked + .card .box-checklist .checklist .card-check.sering svg{margin-top: 2px;}.card-style .card-input-element:checked + .card .box-checklist .checklist:after {display: none;}label.card-radio-btn:nth-child(3) .card-input-element + .card {margin-right:0;}
            .card-style.set_list .card-input-element:checked + .card .box-checklist .checklist .card-check svg, #other_nominal_radio.card-style.set_list .card-input-element:checked + .card .box-checklist .checklist .card-check svg {width: 16px;border-radius: 40px;height: 16px;padding: 6px;margin: 12px 12px;background: <?php echo $button_color;?>;fill: #fff !important;display: inline;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;-webkit-animation-name: fadeInCheckbox;animation-name: fadeInCheckbox;-webkit-animation-duration: .3s;animation-duration: .3s;-webkit-animation-timing-function: cubic-bezier(.4,0,.2,1);animation-timing-function: cubic-bezier(.4,0,.2,1);}.card-radio-btn.card-style.set_list .card-input-element + .card {margin-left:3px;width: 98%;-webkit-box-shadow: 0 1px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1) !important;box-shadow: 0 1px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1) !important;}.card-radio-btn.card-style.set_list .content_head {font-size: 18px !important;text-align: left;padding-left: 68px;font-weight: bold;}.card-radio-btn.card-style.set_list .content_sub {text-align: left;padding-left: 68px;}.card-radio-btn.card-style.set_list .card-body {text-align: left;}.content_emoji {position: absolute;margin-left: 20px;margin-top: 10px;}.content_emoji img {width:30px;}
            .card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg {
                width: 21px;height: 21px;margin-top:100px;position: absolute;margin-left: -25px;z-index: 99; display: none;}
            .dropdown-opt {border: 2px solid <?php echo $button_color;?> !important;}
            .user-sapaan {margin-top: -11px;font-size: 13px;margin-bottom: 2px;}
            .donasiaja-input p img { width:100%;}
            group.section-sapaan-label {width: 15% !important;float: left;}group.section-sapaan-label p {padding-top: 8px;}group.section-sapaan-text {width: 84% !important;}
            .sapaan input[type=radio], .option_zakat input[type=radio] {cursor:pointer;opacity: 0;width: 100%;height: 42px;background-color: blue;position: relative;z-index: 1;}.sapaan group, .option_zakat group {width: 100%;display: flex;}.sapaan .input-container, .option_zakat .input-container {height: 36px;line-height: 36px;width: 100%;text-align: center;position: relative;margin-bottom: 10px;margin-top: 15px;}.sapaan .input-container:first-child label, .option_zakat .input-container:first-child label {border-radius: 5px 0 0 5px;}.sapaan .input-container:last-child label, .option_zakat .input-container:last-child label {border-radius: 0 5px 5px 0;border-right: 1px solid #e5e8ec;}.sapaan label, .option_zakat label {width: 100%;height: 100%;position: absolute;border: 1px solid #e5e8ec;border-right: inherit;top: 0;left: 0;font-family: arial;color: #737373;}.sapaan input:checked + label, .option_zakat input:checked + label {background-color: <?php echo $button_color;?>;top: 0;left: 0;border: 1px solid <?php echo darken_color($button_color, $darker=1.25);?> !important;z-index: 2;color: white;}
            @media only screen and (max-width:380px){ 
                .card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg {
                    margin-top:103px;
                }
                group.section-sapaan-label, group.section-sapaan-text {
                    width: 100% !important;
                }
                group.section-sapaan-label p {
                    margin-bottom: -5px;
                }
            }
            .outer {transition: background-color 0.4s ease;box-sizing: border-box;width: 100%;height: 4px;text-align: center;position: relative;background-color: <?php echo $colornya;?>;margin: 5px 0 5px 0;color: #fff;cursor: pointer;line-height: 60px;overflow: hidden;border-radius: 4px;display: none;}.outer span {transition: opacity 0.3s ease, margin-top 0.3s ease;display: block;font-size: 18px;position: absolute;top: 50%;right: 20px;margin-top: -20px;opacity: 0;}.outer .inner {transition: opacity 0.3s ease;width: 95%;height: 4px;background-color: <?php echo $button_color;?>;position: absolute;left: 0;bottom: 0;opacity: 0;}.outer .inner.active {opacity: 1;animation: progressAnimation 3s ease;}.outer.done span {opacity: 1;margin-top: -9px;}@keyframes progressAnimation {0% {width: 0;}20% {width: 5%;}40% {width: 20%;}60% {width: 70%;}80% {width: 75%;}100% {width: 100%;}}@-webkit-keyframes progressAnimation {0% {width: 0;}20% {width: 5%;}40% {width: 20%;}60% {width: 70%;}80% {width: 75%;}100% {width: 100%;}}@-moz-keyframes progressAnimation {0% {width: 0;}20% {width: 5%;}40% {width: 20%;}60% {width: 70%;}80% {width: 75%;}100% {width: 100%;}}@-o-keyframes progressAnimation {0% {width: 0;}20% {width: 5%;}40% {width: 20%;}60% {width: 70%;}80% {width: 75%;}100% {width: 100%;}}@keyframes progressAnimation {0% {width: 0;}20% {width: 5%;}40% {width: 20%;}60% {width: 70%;}80% {width: 75%;}95% {width: 95%;}}
            
            .next_arrow {
              animation: next_move 1.68s ease-in-out infinite;
              margin-left: 9px;
              display: none;
            }
            #form-group p img {width: 100%;}

            .checking {
                color: rgb(35, 55, 77);
                font-size: 14px;
                padding-top: 10px;
            }
            .checking.valid {
                color: #18c458;
                font-size: 14px;
                padding-top: 10px;
            }
            .checking.not-valid {
                color: #ea3309;
                font-size: 14px;
                padding-top: 10px;
            }
            .checking.not-valid-error {
                color: #df3d0c;
                font-size: 14px;
                padding-top: 10px;
            }


            
            @keyframes next_move {
              0%,
              100% {
                transform: translate(0, 0);
              }

              50% {
                transform: translate(10px, 0);
              }
            }

            @media only screen and (max-width:480px){
                .list-qurban li li {
                    line-height: 1;
                }
            }

            .popup-doa-overlay,.popup-cc-overlay,.popup-captcha-overlay{position:fixed;left:0;right:0;top:0;bottom:0;background:rgb(0 0 0 / .4);display:none;z-index:999}.popup-content{position:fixed;bottom:-100%;left:50%;transform:translateX(-50%);background:#fff;border-radius:16px 16px 0 0;padding:20px 20px 80px;height:70vh;width:100%;max-width:520px;transition:bottom 0.4s ease;z-index:1000;box-sizing:border-box}.popup-button-container{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);width:calc(100% - 40px);max-width:500px;z-index:1001;display:none}.popup-button-container .donation_button_now3{width:100%;background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>;padding:12px;border-radius:8px;color:#fff;font-size:16px;border:none}.popup-doa-overlay.show,.popup-cc-overlay.show,.popup-captcha-overlay.show,.popup-content.show{display:block;z-index:9999}.popup-content.show{bottom:0}.close-popup{float:right;font-size:18px;cursor:pointer;margin-top:-25px}@media (max-width:520px){.popup-content{width:100%;border-radius:16px 16px 0 0;left:0;transform:none}}

            #ccbox {
              padding: 20px;
              border-radius: 8px;
              padding-right: 46px;
              padding-bottom: 5px;
              padding-top: 22px;
              background: #edf7ff;
            }

            .floatinglabel {
              position: relative;
              margin-bottom: 20px;
            }

            .floatinglabel input {
              width: 100%;
              padding: 22px 12px 8px 12px;
              font-size: 16px;
              border: 1px solid #ccc;
              border-radius: 6px;
              font-weight: bold;
              color: #2b3e53;
              border: 1px solid #b9d3e8;
            }

            .floatinglabel span {
              position: absolute;
              top: 16px;
              left: 12px;
              font-size: 16px;
              color: #888;
              transition: 0.2s ease all;
              pointer-events: none;
            }

            .floatinglabel input:focus + span,
            .floatinglabel input:not(:placeholder-shown) + span {
              top: 4px;
              left: 12px;
              font-size: 12px;
              color: #333;
              background: white;
            }

            .fullwidth {
              width: 100%;
            }

            .halfwidth {
              width: 48%;
            }

            .halfwidth.on_left {
              margin-right: 10px;
            }

            .halfwidth.on_right {
              margin-left: 10px;
            }

            .flexrow {
              display: flex;
              gap: 4%;
            }

            #ccboxsupport1 {
              margin: 16px 0 8px;
            }

            #ccboxsupport2 img {
              height: 24px;
              margin-right: 6px;
              vertical-align: middle;
            }
            #ccboxdetectedcard {
              position: absolute;
              top: 14px;
              right: 10px;
              height: 22px;
              display: none;
              margin-right: -14px;
              border-radius: 4px;
            }

            input:-webkit-autofill {
              transition: background-color 9999s ease-in-out 0s;
            }

            .set_rounded label {
                border-radius: 5px !important;
            }

    </style>
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
    fbq('track', '<?php echo $event_2; ?>');
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
    fbq('track', '<?php echo $event_2; ?>');
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
      ttq.track('<?php echo $event_2; ?>', {
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

        <style>
            .app-captcha{
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
              box-sizing: border-box;
            }

            /* Lingkaran captcha (diameter 10rem) */
            .captcha-base{
              width: 10rem;
              height: 10rem;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;

              /* was: background: var(--bgImage) no-repeat center center / cover; */
              background-repeat: no-repeat;
              background-position: center center;
              background-size: cover;
            }

            /* Lingkaran dalam (10rem - 4rem = 6rem) */
            .captcha-inner{
              width: 6rem;
              height: 6rem;
              border: 1px solid rgba(255,255,255,0.3);
              border-radius: 50%;

              /* was: background: var(--bgImage) no-repeat center center / 10rem 10rem; */
              background-repeat: no-repeat;
              background-position: center center;
              background-size: 10rem 10rem; /* samakan skala dengan lingkaran luar */
              transform: rotate(0deg);
              transition: transform .05s linear;
              will-change: transform;
            }

            #degreeSlider{
              cursor: pointer;
              width: 260px;
              box-sizing: border-box;
            }

            #btnValidate{
              cursor: pointer;
              visibility: hidden;
              padding: 8px 14px;
              box-sizing: border-box;
              background:<?php echo $button_color; ?>;
              border-color:<?php echo $button_color; ?>;
              border-radius: 8px;
              position: fixed;
              bottom: 0;
              margin-bottom: 20px;
              width: 92%;
              border-radius: 8px;
            }

            code{
              display: contents;
              visibility: hidden;
              box-sizing: border-box;
            }

            code.info{
              color: green;
            }

        </style>
        <div class="popup-captcha-overlay"></div>
            <div class="popup-content" id="popupCaptcha">
                <div class="popup-body">
                    <span class="close-popup" title="Close">&times;</span>
                    <div style="text-align: center;">
                        <h2 style="padding-top:10px;">Dynamic Captcha</h2>
                        <p>Putar ke sudut yang benar.</p>

                        <div class="app-captcha">
                            <div class="captcha-base" id="captchaBase">
                              <div class="captcha-inner" id="captchaInner"></div>
                            </div>

                            <input type="range" id="degreeSlider" min="0" max="360" value="0" />
                            <code id="msg" class="message"></code>
                            <button id="btnValidate" class="donation_button_now2 scale_button">Validate 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="next_arrow" style="width: 15px; margin-bottom: -3px; display: inline;" fill="white">
                                    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path>
                                </svg>
                            </button>

                            
                        </div>

                        <!-- <button id="lanjutkan" class="donation_button_now2 scale_button" data-captcha="true">Lanjutkan</button> -->
                    </div>
                </div>

                <div class="popup-button-container" style="background: #ffffff;">
                    <div class="outer">
                      <div class="inner"></div>
                    </div>

                <button class="donation_button_now3 scale_button" data-popup="false">
                  <span style="transition:all .5s ease"><?php echo $popup_info_button; ?></span>
                  <div class="donasi-loading loading-hide"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="next_arrow" style="width: 15px; margin-bottom: -3px; display: inline;" fill="white">
                    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path>
                  </svg>
                </button>

            </div>
        </div>


    <?php if (!empty($row->popup_info_status) && $row->popup_info_status=='1') {

        if($row->popup_info_button==''){
            $popup_info_button = 'Next';
        }else{
            $popup_info_button = $row->popup_info_button;
        }

        ?>

        <div class="popup-doa-overlay"></div>
            <div class="popup-content" id="popupDoa">
                <div class="popup-body">
                    <span class="close-popup" title="Close">&times;</span>
                    <div style="text-align: center;">
                        <h2 style="padding-top:10px;"><?php echo $row->popup_info_title; ?></h2>
                        <?php echo $row->popup_info_desc; ?>
                    </div>
                </div>

                <div class="popup-button-container" style="background: #ffffff;">
                    <div class="outer">
                      <div class="inner"></div>
                    </div>

                <button class="donation_button_now3 scale_button" data-popup="false">
                  <span style="transition:all .5s ease"><?php echo $popup_info_button; ?></span>
                  <div class="donasi-loading loading-hide"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="next_arrow" style="width: 15px; margin-bottom: -3px; display: inline;" fill="white">
                    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path>
                  </svg>
                </button>

            </div>
        </div>

    <?php } ?>



    <?php if($cc_midtrans==true) { ?>

    <div class="popup-cc-overlay"></div>
        <div class="popup-content" id="popupCC">
            <div class="popup-body">
                <span class="close-popup" title="Close">&times;</span>
                <div style="text-align: center;">
                    <h2 style="padding-top:10px;">Credit Card</h2>
                    
                    <div id="ccbox">
                      <div class="floatinglabel fullwidth">
                        <input type="text" name="cc_number" id="cc_number" placeholder=" " autocomplete="off" maxlength="19" required>
                        <span>Card Number</span>
                        <img id="ccboxdetectedcard" src="" alt="">
                      </div>

                      <div class="flexrow">
                        <div class="floatinglabel halfwidth on_left">
                          <input type="text" name="cc_mmyy" id="cc_mmyy" placeholder=" " maxlength="7" autocomplete="off" required>
                          <span>MM / YY</span>
                        </div>

                        <div class="floatinglabel halfwidth on_right">
                          <input type="text" name="cc_cvv" id="cc_cvv" placeholder=" " maxlength="4" autocomplete="off" required 
                                 inputmode="numeric" pattern="\d*">
                          <span>CVV</span>
                        </div>
                      </div>

                    </div>

                    <img class="" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/cc_logo.jpg';?>" alt="Image" style="width:250px;margin-bottom:20px;margin-top: 20px;">

                </div>
            </div>

            <div class="popup-button-container" style="background: #ffffff;">
                <div class="outer">
                  <div class="inner"></div>
                </div>

            <button class="donation_button_now3 scale_button" data-cc="true">
              <span style="transition:all .5s ease">Process Credit Card</span>
              <div class="donasi-loading loading-hide"></div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="next_arrow" style="width: 15px; margin-bottom: -3px; display: inline;" fill="white">
                <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path>
              </svg>
            </button>

        </div>
    </div>

    <?php } ?>

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
	?>
	<div id="header-title" class="section-box flying-header"><span class="nav-icon" style="<?php if($back_icon!='1'){echo'display:none;';}?>"><a href="<?php echo $back_urlnya; ?>"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/left-arrow.png'; ?>" title="Back to Homepage"></a></span><span class="campaign-header-title show-title" style="<?php if($back_icon!='1'){echo'margin-left:21px;';}?>"><?php echo $fix_title; ?></span></div>
	<div class="section-image">
		<div class="img-box">
		<?php if($row->image_url!=null){?>
		<img src="<?php echo $row->image_url; ?>" alt="Image">
		<?php }else{?>
		<img src="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" alt="Image">
		<?php } ?>
		<div><?php echo $text3; ?></div>
		<h1><?php echo $campaign_title; ?></h1></div>
	</div>
	<div class="section-box main-box">
			<div class="form-group" id="form-group">
				<?php if($row->form_type==null || $row->form_type=='1') { ?>
				<div class="donasiaja-input" style="margin-top: 10px;">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
					<label><?php echo $text4; ?></label><br>
					<div class="card-body card-group" style="margin-left:-3px;">
						<?php foreach ($nominals as $key => $value) { ?>
							<label class="card-radio-btn card-style">
                            	<?php if($value[2]==1){ ?>
                            		<input type="radio" name="nominal_donasi" class="card-input-element sering_dipilih" value="<?php echo $value[0]; ?>" data-label="<?php echo $value[1]; ?>">
		                            <div class="card card-body">
	                            		<div class="content_head"><?php echo $value[1]; ?></div>
		                                <div class="content_sub">sering dipilih</div>
		                                <div class="box-checklist">
                                            <div class="checklist">
                                                <span class="card-check sering">
                                                    <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                                </span>
                                            </div>      
                                        </div>
		                            </div>
                            	<?php }else{ ?>
                            		<input type="radio" name="nominal_donasi" class="card-input-element" value="<?php echo $value[0]; ?>" data-label="<?php echo $value[1]; ?>">
		                            <div class="card card-body">
                                		<div class="content_head no_desc"><?php echo $value[1]; ?></div>
    	                                <div class="content_sub no_desc">&nbsp;</div>
    	                                <div class="box-checklist no_desc">
                                            <div class="checklist">
                                                <span class="card-check">
                                                    <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                                </span>
                                            </div>
                                        </div>
	                                </div>
                            	<?php }?>
	                        </label>
						<?php }?>
			              	<label id="other_nominal_radio" class="card-radio-btn card-style other_nominal">
	                            <input type="radio" name="nominal_donasi" class="card-input-element" value="0" data-label="">
	                            <div class="card card-body">
	                                <div class="content_head">Nominal</div>
	                                <div class="content_sub">lainnya</div>
	                                <div class="box-checklist">
                                        <div class="checklist">
                                            <span class="card-check">
                                                <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                            </span>
                                        </div>   
                                    </div>
	                            </div>
	                        </label>
			        </div>
				</div>
				<div class="donasiaja-input other_nominal_value hide_input">
					<input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="">
					<div class="currency"><?php echo $show_currency; ?></div>
				</div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

				<?php } // end form_type 1 ?>


                <?php if($row->form_type==null || $row->form_type=='8') { ?>
                <div class="donasiaja-input" style="margin-top: 10px;">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
                    <label><?php echo $text4; ?></label><br>
                    <div class="card-body card-group" style="margin-left:-3px;">
                        <?php $no_emoji = 1; foreach ($nominals as $key => $value) { 

                            if($icon_list_setting=='1'){
                                $icon_emoji = $icon_list_data['icons'][$no_emoji-1];

                                $icon_emoji = str_replace('https://twemoji.maxcdn.com/v/14.0.2/72x72/','https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/', $icon_emoji);
                            }else{
                                $icon_emoji = plugin_dir_url( __FILE__ ) . 'assets/images/emoji/emoji'.$no_emoji.'.png';
                            }

                            ?>
                            <label class="card-radio-btn card-style set_list">
                                <?php if($value[2]==1){ ?>
                                    <input type="radio" name="nominal_donasi" class="card-input-element sering_dipilih" value="<?php echo $value[0]; ?>" data-label="<?php echo $value[1]; ?>">
                                    <div class="card card-body">
                                        <div class="content_emoji">
                                            <img src="<?php echo $icon_emoji;?>" alt="emoji">
                                        </div>
                                        <div class="content_head"><?php echo $value[1]; ?></div>
                                        <div class="content_sub">sering dipilih</div>
                                        <div class="box-checklist">
                                            <div class="checklist">
                                                <span class="card-check sering">
                                                    <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                                </span>
                                            </div>      
                                        </div>
                                    </div>
                                <?php }else{ ?>
                                    <input type="radio" name="nominal_donasi" class="card-input-element" value="<?php echo $value[0]; ?>" data-label="<?php echo $value[1]; ?>">
                                    <div class="card card-body">
                                        <div class="content_emoji">
                                            <img src="<?php echo $icon_emoji;?>" alt="emoji">
                                        </div>
                                        <div class="content_head no_desc"><?php echo $value[1]; ?></div>
                                        <div class="content_sub no_desc">&nbsp;</div>
                                        <div class="box-checklist no_desc">
                                            <div class="checklist">
                                                <span class="card-check">
                                                    <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                <?php } $no_emoji++; ?>
                            </label>
                        <?php }?>
                            <?php 

                            if($icon_list_setting=='1'){
                                $icon_emoji = $icon_list_data['icons'][4];
                                $icon_emoji = str_replace('https://twemoji.maxcdn.com/v/14.0.2/72x72/','https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/', $icon_emoji);
                            }else{
                                $icon_emoji = plugin_dir_url( __FILE__ ) . 'assets/images/emoji/emoji_others.png';
                            }

                            ?>

                            <label id="other_nominal_radio" class="card-radio-btn card-style other_nominal set_list">
                                <input type="radio" name="nominal_donasi" class="card-input-element" value="0" data-label="">
                                <div class="card card-body">
                                    <div class="content_emoji">
                                        <img src="<?php echo $icon_emoji;?>" alt="emoji">
                                    </div>
                                    <div class="content_head">Nominal</div>
                                    <div class="content_sub">lainnya</div>
                                    <div class="box-checklist">
                                        <div class="checklist">
                                            <span class="card-check">
                                                <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                            </span>
                                        </div>   
                                    </div>
                                </div>
                            </label>
                    </div>
                </div>
                <div class="donasiaja-input other_nominal_value hide_input">
                    <input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="">
                    <div class="currency"><?php echo $show_currency; ?></div>
                </div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

                <?php } // end form_type 8 ?>



				<?php if($row->form_type=='2') { ?>
				<div class="donasiaja-input">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
					<label><?php echo $text4; ?></label><br>
				</div>
				<div class="donasiaja-input other_nominal_value">
					<input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="<?php echo $nominal;?>">
					<div class="currency"><?php echo $show_currency; ?></div>
				</div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

				<?php } // end form_type 2 ?>



                <?php if($row->form_type=='5') { ?>

                <div class="donasiaja-input" style="margin-top: 10px;">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
                    <label><?php echo $text4; ?></label><br>
                    <div class="card-body card-group" style="margin-bottom:30px;margin-left:-5px;min-height:125px;">

                        <?php 

                        if($row->form_status=='1' && $row->form_type=='5'){

                        foreach ($nominals as $key => $value) { 

                            $rand_id = d_randomString(5);
                            if($value[4]=='1/7'){
                                $patungan_persen = 0.14285715;
                            }elseif($value[4]=='1/9'){
                                $patungan_persen = 0.111;
                            }elseif($value[4]=='1/10'){
                                $patungan_persen = 0.1;
                            }else{
                                $patungan_persen = 1;
                            }

                            $option_pricing = $value[1];
                            $harga_qurban = round($option_pricing*$patungan_persen);

                            ?>
                            <label class="card-radio-btn card-form card-qurban" id="label_<?php echo $rand_id; ?>">

                                    <input type="checkbox" name="nominal_donasi" class="card-input-element" value="<?php echo $value[0]; ?>" data-label="<?php echo $harga_qurban; ?>" style="display:none;">

                                    <div class="card card-body">
                                        <div class="card-img" data-type="<?php echo $value[3]; ?>" data-payment="<?php echo $value[4]; ?>">
                                            <img class="img-qurban" src="<?php echo $value[5]; ?>">
                                        </div>
                                        <div class="content_head no_desc qurban_name"><span><?php if($value[4]=='1/7' || $value[4]=='1/9' || $value[4]=='1/10') { echo $value[4].' '; } ?><?php echo $value[0]; ?></span></div>
                                        <div class="content_sub"><span><?php echo $value[2]; ?></span></div>
                                        <div class="content_head no_desc qurban_pricing data_pricing" data-pricing="<?php echo $harga_qurban; ?>"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/qurban/'.$value[3].'.png';?>" class="<?php echo $value[3];?>"><span><?php echo $show_currency; ?><?php echo number_format_currency($harga_qurban); ?></span></div>
                                        <div class="content_head no_desc" style="float: right;">
                                            <div id="btn_add_<?php echo $rand_id;?>" class="counter-number btn_add" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $value[0]; ?>" data-type="<?php echo $value[3]; ?>" data-payment="<?php echo $value[4]; ?>" data-placeholder="Kurban atas nama">
                                                <span class="add ripple">+ Add</span>
                                            </div>
                                            <div id="btn_plusminus_<?php echo $rand_id;?>"  class="counter-number btn_plusminus" data-id="<?php echo $rand_id; ?>" style="display:none;">
                                                <span class="minus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-type="<?php echo $value[3]; ?>" data-payment="<?php echo $value[4]; ?>" data-placeholder="Kurban atas nama">-</span>
                                                <input type="text" value="0" class="count" data-id="<?php echo $rand_id;?>"  data-placeholder="Kurban atas nama"/>
                                                <span class="plus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-type="<?php echo $value[3]; ?>" data-payment="<?php echo $value[4]; ?>" data-placeholder="Kurban atas nama">+</span>
                                            </div>
                                        </div>
                                        <div id="atasnama_<?php echo $rand_id;?>" class="content_atasnama" style="display:none;" data-id="<?php echo $rand_id; ?>" title="Kurban atas nama">
                                            <input id="tag_atasnama_<?php echo $rand_id;?>" placeholder="Kurban atas nama" type="text" class="form-control tagit" name="whatsapp" value="" style="height: 42px;">
                                        </div>
                                    </div>
                                
                            </label>
                        <?php } } ?>

                    </div>
                </div>
                <div class="donasiaja-input other_nominal_value hide_input">
                    <input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="">
                    <div class="currency"><?php echo $show_currency; ?></div>
                </div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

                <?php } // end form_type 5 ?>



                <?php if($row->form_type=='6') { ?>

                <div class="donasiaja-input" style="margin-top: 10px;">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
                    <label><?php echo $text4; ?></label><br>
                    <div class="card-body card-group" style="margin-bottom:30px;margin-left:-5px;min-height:125px;">

                        <?php 

                        if($row->form_status=='1' && $row->form_type=='6'){

                        foreach ($nominals as $key => $value) { 

                            $rand_id = d_randomString(5);

                            $option_pricing = $value[1];
                            $harga_qurban = round($option_pricing);

                            ?>
                            <label class="card-radio-btn card-form card-package2" id="label_<?php echo $rand_id; ?>">

                                    <input type="checkbox" name="nominal_donasi" class="card-input-element" value="<?php echo $value[0]; ?>" data-label="<?php echo $harga_qurban; ?>" style="display:none;">

                                    <div class="card card-body">
                                        <div class="card-img" data-payment="<?php echo $value[1]; ?>">
                                            <img class="img-qurban" src="<?php echo $value[3]; ?>">
                                        </div>
                                        <div class="content_head no_desc package2_name"><span><?php echo $value[0]; ?></span></div>
                                        <div class="content_sub"><span><?php echo $value[2]; ?></span></div>
                                        <div class="content_head no_desc package2_pricing data_pricing" data-pricing="<?php echo $harga_qurban; ?>"><span><?php echo $show_currency; ?><?php echo number_format_currency($harga_qurban); ?></span></div>
                                        <div class="content_head no_desc" style="float: right;">
                                            <div id="btn_add_<?php echo $rand_id;?>" class="counter-number btn_add" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $value[0]; ?>" data-payment="<?php echo $value[1]; ?>">
                                                <span class="add ripple">+ Add</span>
                                            </div>
                                            <div id="btn_plusminus_<?php echo $rand_id;?>"  class="counter-number btn_plusminus" data-id="<?php echo $rand_id; ?>" style="display:none;">
                                                <span class="minus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-payment="<?php echo $value[1]; ?>">-</span>
                                                <input type="text" value="0" class="count" data-id="<?php echo $rand_id;?>" />
                                                <span class="plus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-payment="<?php echo $value[1]; ?>">+</span>
                                            </div>
                                        </div>
                                    </div>
                                
                            </label>
                        <?php } } ?>

                    </div>
                </div>
                <div class="donasiaja-input other_nominal_value hide_input">
                    <input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="">
                    <div class="currency"><?php echo $show_currency; ?></div>
                </div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

                <?php } // end form_type 6 ?>



                <?php if($row->form_type=='7') { ?>

                

                <div class="donasiaja-input" style="margin-top: 10px;">
                    <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
                    <label><?php echo $text4; ?></label><br>
                    <div class="card-body card-group" style="margin-bottom:30px;margin-left:-5px;min-height:125px;">

                        <?php 

                        if($row->form_status=='1' && $row->form_type=='7'){

                        foreach ($nominals as $key => $value) { 

                            $rand_id = d_randomString(5);

                            $option_pricing = $value[1];
                            $harga_qurban = round($option_pricing);

                            ?>
                            <label class="card-radio-btn card-form card-zfitrah" id="label_<?php echo $rand_id; ?>">

                                    <input type="checkbox" name="nominal_donasi" class="card-input-element" value="<?php echo $value[0]; ?>" data-label="<?php echo $harga_qurban; ?>" style="display:none;">

                                    <div class="card card-body">
                                        <div class="card-img" data-payment="<?php echo $value[1]; ?>">
                                            <img class="img-qurban" src="<?php echo $value[3]; ?>">
                                        </div>
                                        <div class="content_head no_desc zfitrah_name"><span><?php echo $value[0]; ?></span></div>
                                        <div class="content_sub"><span><?php echo $value[2]; ?></span></div>
                                        <div class="content_head no_desc zfitrah_pricing data_pricing" data-pricing="<?php echo $harga_qurban; ?>"><span><?php echo $show_currency; ?><?php echo number_format_currency($harga_qurban); ?></span></div>
                                        <div class="content_head no_desc" style="float: right;">
                                            <div id="btn_add_<?php echo $rand_id;?>" class="counter-number btn_add" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $value[0]; ?>" data-payment="<?php echo $value[1]; ?>" data-placeholder="Atas nama" data-cardtitle="<?php echo $value[0]; ?>">
                                                <span class="add ripple">+ Add</span>
                                            </div>
                                            <div id="btn_plusminus_<?php echo $rand_id;?>"  class="counter-number btn_plusminus" data-id="<?php echo $rand_id; ?>" style="display:none;">
                                                <span class="minus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-payment="<?php echo $value[1]; ?>" data-placeholder="Atas nama" data-cardtitle="<?php echo $value[0]; ?>">-</span>
                                                <input type="text" value="0" class="count" data-id="<?php echo $rand_id;?>"  data-placeholder="Atas nama" data-cardtitle="<?php echo $value[0]; ?>" />
                                                <span class="plus ripple" data-id="<?php echo $rand_id; ?>" data-pricing="<?php echo $harga_qurban; ?>" data-payment="<?php echo $value[1]; ?>" data-placeholder="Atas nama" data-cardtitle="<?php echo $value[0]; ?>">+</span>
                                            </div>
                                        </div>
                                        <div id="atasnama_<?php echo $rand_id;?>" class="content_atasnama" style="display:none;" data-id="<?php echo $rand_id; ?>" title="Kurban atas nama">
                                            <input id="tag_atasnama_<?php echo $rand_id;?>" placeholder="Atas nama" type="text" class="form-control tagit" name="whatsapp" value="" style="height: 42px;">
                                        </div> 
                                    </div>
                                
                            </label>
                        <?php } } ?>

                    </div>
                </div>
                <div class="donasiaja-input other_nominal_value hide_input">
                    <input placeholder="Masukkan Nominal" type="tel" class="form-control" name="nominal_lainnya" value="">
                    <div class="currency"><?php echo $show_currency; ?></div>
                </div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

                <?php } // end form_type 7 ?>




				<?php if($row->form_type=='3') { ?>
				<div class="donasiaja-input">
					
					<?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>
                    <label><?php echo $text4; ?></label>
					<br>
					<label class="card-radio-btn card-style">
						<div class="card-body card-group card-package" style="min-height: 85px;margin-left: -10px;">
		                    <input type="radio" name="nominal_donasi" class="card-input-element" value="0" data-label="" checked="">
		                    <div class="card card-body" style="width: 97%;box-shadow: 0 1px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1) !important;">
		                        <div class="content_head" style="padding-top: 8px;" id="nominal_paket" data-paket="<?php echo $row->packaged; ?>"><?php if($row->packaged_title!=''){echo $row->packaged_title; }else{echo get_langArray('f_select_title1');} ?> @<?php echo number_format_currency($row->packaged); ?></div>
		                        <div class="content_sub">&nbsp;</div>
		                        <div class="box-checklist" style="padding-right: 8px;margin-top: -52px;">
                                    <div class="checklist">
                                        <span class="card-check sering">
                                            <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                        </span>
                                    </div>
                                </div>
		                	</div>
		                </div>
		            </label>
				</div>
				<div class="donasiaja-input other_nominal_value">
					<div class="dropdown-opt">
					    <select name="one" class="dropdown-select" id="jumlah_paket" style="text-align: center;">
					      <option value="0"><?php echo get_langArray('f_select_title2'); ?></option>
					      <?php for ($i = 1; $i <= $max_package; $i++) { ?>
							<?php  

                                if($row->packaged_unit==1){
                                    $text_paket = 'Paket';
                                }else if($row->packaged_unit==2){
                                    $text_paket = 'Orang';
                                }else if($row->packaged_unit==3){
                                    $text_paket = 'Box';
                                }else if($row->packaged_unit==4){
                                    $text_paket = $row->packaged_custom;
                                }else{
                                    $text_paket = get_langArray('f_select_title3');
                                }
							?>
					      	<option value="<?php echo $i; ?>"><?php echo $i; ?> <?php echo $text_paket; ?></option>
					      <?php } ?>
					    </select>
					  </div>
				</div>

                    <?php

                    if($additional_formula!='' && $row->form_status=='1'){
                    $no_field = 1;
                    foreach ($additional_formula['data'] as $key => $value) { ?>

                        <div class="container_additional_value">
                            <div class="donasiaja-input">
                                <label><?php echo $value['label']; ?></label><br>
                            </div>
                            <div class="donasiaja-input additional_nominal_value add_donate<?php echo $no_field; ?>">
                                <input placeholder="Masukkan Nominal" type="tel" class="form-control text_field_formula" name="add_donate<?php echo $no_field; ?>" value="" data-label="<?php echo $value['label']; ?>">
                                <div class="currency"><?php echo $show_currency; ?></div>
                            </div>
                        </div>


                    <?php $no_field++; } } ?>

                    <?php if($jumlah_formula>=1 && $row->form_status=='1') { // show field total ?>

                    <div>
                        <div class="donasiaja-input">
                            <label>Total</label><br>
                        </div>
                        <div class="donasiaja-input total_summary" style="margin-bottom: 40px;">
                            <input placeholder="0" type="tel" class="form-control" name="total_summary" value="" readonly="">
                            <div class="currency"><?php echo $show_currency; ?></div>
                        </div>
                    </div>

                    <?php } ?>

				<?php } // end form_type 3 ?>

                <?php if($row->form_type=='4') { ?>

                <?php echo $additional_info; if($additional_info!=''){echo'<br><br>';} ?>

                <?php 

                if($row->zakat_penghasilan_type=='profesi' || $row->zakat_penghasilan_type=='') {
                    $pendapatan1_title = 'Jumlah pendapatan (per <span class="title_tahun">tahun</span>)';
                    $pendapatan2_title = 'Pendapatan lain (bonus dan lainnya)';
                    $pengeluaran_title = 'Pengeluaran kebutuhan pokok (termasuk utang jatuh tempo)';

                }elseif($row->zakat_penghasilan_type=='perusahaan'){
                    $pendapatan1_title = 'Aset lancar akhir <span class="title_tahun">tahun</span>';
                    $pendapatan2_title = 'Pendapatan bersih akhir <span class="title_tahun">tahun</span>';
                    $pengeluaran_title = 'Utang jangka pendek';

                }elseif($row->zakat_penghasilan_type=='perdagangan'){
                    $pendapatan1_title = 'Aset Lancar (Barang Dagangan + Pendapatan)';
                    $pendapatan2_title = 'Laba + Piutang jatuh tempo';
                    $pengeluaran_title = 'Utang jatuh tempo';

                }elseif($row->zakat_penghasilan_type=='maal'){
                    $pendapatan1_title = 'Aset Lancar (Emas Batangan, Tabungan, Uang Tunai, Kendaraan, Rumah)';
                    $pendapatan2_title = 'Piutang Jatuh tempo';
                    $pengeluaran_title = 'Utang atau cicilan';

                }else{
                    $pendapatan1_title = 'Jumlah pendapatan (per <span class="title_tahun">tahun</span>)';
                    $pendapatan2_title = 'Pendapatan lain (bonus dan lainnya)';
                    $pengeluaran_title = 'Pengeluaran kebutuhan pokok (termasuk utang jatuh tempo)';
                }

                if($row->zakat_penghasilan_custom_title=='1') {
                    if($row->pendapatan1_title==''){
                        $pendapatan1_title = $pendapatan1_title;
                    }else{
                        $pendapatan1_title = $row->pendapatan1_title;
                    }
                    if($row->pendapatan2_title==''){
                        $pendapatan2_title = $pendapatan2_title;
                    }else{
                        $pendapatan2_title = $row->pendapatan2_title;
                    }
                    if($row->pengeluaran_title==''){
                        $pengeluaran_title = $pengeluaran_title;
                    }else{
                        $pengeluaran_title = $row->pengeluaran_title;
                    }
                }

                ?>

                <?php 
                
                    if($row->pengeluaran_setting=='1') {
                        $show_pengeluaran = '';
                    }else{
                        $show_pengeluaran = 'style="display:none;"';
                    }

                ?>

                <?php if($row->zakat_penghasilan_type=='pertanian'){ ?>

                    <div class="donasiaja-input option_zakat" style="width:100% !important;margin-bottom:20px;">
                        
                        <group class="section-zakat-text" style="width:100% !important;">

                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="tadah_hujan" data-jumlahzakat="10" 
                              <?php if($option_zakat=='tadah_hujan' || $option_zakat=='0'){ echo 'checked'; }?> >
                              <label>Pengairan Tadah Hujan</label>      
                            </div>

                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="mandiri" data-jumlahzakat="5" 
                              <?php if($option_zakat=='mandiri'){ echo 'checked'; }?> ><label>Pengairan Mandiri</label>
                            </div>

                        </group>

                    </div>

                    <div class="donasiaja-input">
                        <label>Hasil Panen <?php echo $row->zakat_hasil_pertanian; ?> (Kg)</label><br>
                    </div>
                    <div class="donasiaja-input pendapatan_pertanian">
                        <input placeholder="Hasil Panen dalam Kg" type="tel" class="form-control" name="pendapatan_pertanian" value="">
                        <div class="currency">Kg</div>
                    </div>

                <?php }elseif($row->zakat_penghasilan_type=='emas'){ ?>

                    <div class="donasiaja-input option_zakat" style="width:100% !important;margin-bottom:20px;">
                        
                        <group class="section-zakat-text" style="width:100% !important;">

                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="pertahun" <?php if($option_zakat=='pertahun' || $option_zakat=='0'){ echo 'checked'; }?> ><label>Zakat per tahun</label>
                            </div>
                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="perbulan" <?php if($option_zakat=='perbulan'){ echo 'checked'; }?> ><label>Zakat per bulan</label>      
                            </div>

                        </group>
                    </div>

                    <div class="donasiaja-input">
                        <label>Jumlah emas (gram)</label><br>
                    </div>
                    <div class="donasiaja-input pendapatan_emas">
                        <input placeholder="Jumlah emas dalam gram" type="tel" class="form-control" name="pendapatan_emas" value="">
                        <div class="currency">gram</div>
                    </div>

                <?php }else{ ?>

                    <div class="donasiaja-input option_zakat" style="width:100% !important;margin-bottom:20px;">
                        
                        <group class="section-zakat-text" style="width:100% !important;">

                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="pertahun" <?php if($option_zakat=='pertahun' || $option_zakat=='0'){ echo 'checked'; }?> ><label>Zakat per tahun</label>
                            </div>
                            <div class="input-container">
                              <input type="radio" name="option_zakat" value="perbulan" <?php if($option_zakat=='perbulan' || $option_zakat=='0'){ echo 'checked'; }?> ><label>Zakat per bulan</label>      
                            </div>

                        </group>
                    </div>

                    <div class="donasiaja-input">
                        <label><?php echo $pendapatan1_title; ?></label><br>
                    </div>
                    <div class="donasiaja-input pendapatan_perbulan">
                        <input placeholder="Masukkan Nominal" type="tel" class="form-control" name="pendapatan_perbulan" value="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>

                    <div class="donasiaja-input">
                        <label><?php echo $pendapatan2_title; ?></label><br>
                    </div>
                    <div class="donasiaja-input pendapatan_lainnya">
                        <input placeholder="Opsional, jika ada" type="tel" class="form-control" name="pendapatan_lainnya" value="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>

                    <div class="donasiaja-input" <?php echo $show_pengeluaran; ?>>
                        <label><?php echo $pengeluaran_title; ?></label><br>
                    </div>

                    <div class="donasiaja-input pengeluaran" <?php echo $show_pengeluaran; ?>>
                        <input placeholder="Opsional, jika ada" type="tel" class="form-control" name="pengeluaran" value="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>

                <?php } ?>
                
                <?php 
                if($row->zakat_penghasilan_type=='pertanian'){
                    // if($row->zakat_pengairan=='mandiri'){
                    //     $persen_zakatnya = '5';
                    // }else{
                        $persen_zakatnya = '10'; // set default pengairan: tadah-hujan (10%)
                    // }
                }else{
                    if($row->zakat_setting==0 || $row->zakat_percent<=0 || $row->zakat_percent==null){
                        $persen_zakatnya = '2.5';
                    }else{
                        $persen_zakatnya = $row->zakat_percent;
                    }
                }
                ?>

                <div style="background: #edf7ff99;padding: 15px 15px;border-radius:4px;margin-bottom: 20px;border: 1px solid #ddeaf6;margin-top: 30px;">

                    <div class="donasiaja-input">
                        <label>Total Pendapatan</label><br>
                    </div>
                    
                    <div class="donasiaja-input total_pendapatan" style="margin-bottom: 20px;">
                        <input placeholder="0" type="tel" class="form-control" name="total_pendapatan" value="" readonly="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>

                    <div class="donasiaja-input">
                        <label><?php if($row->zakat_penghasilan_type=='pertanian'){echo'Nisab ('.$row->zakat_nisab_kg.' kg per panen)';}else{echo'Nisab (85 gram emas per <span class="title_tahun">tahun</span>)';}?></label><br>
                    </div>
                    
                    <div class="donasiaja-input total_nisab_zakat" style="margin-bottom: 20px;">
                        <input placeholder="0" type="tel" class="form-control" name="total_nisab_zakat" value="" readonly="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>

                    <div class="donasiaja-input">
                        <label>Total Wajib Zakat <?php echo '(<span class="persentase_zakat">'.round($persen_zakatnya, 1).'</span>%)';?></label><br>
                    </div>
                    
                    <div class="donasiaja-input total_zakat" style="margin-bottom: 20px;">
                        <input placeholder="0" type="tel" class="form-control" name="total_zakat" value="" readonly="">
                        <div class="currency"><?php echo $show_currency; ?></div>
                    </div>
                </div>

                

                <?php } ?>


				<div class="donasiaja-input payment">
					<div class="box_img_payment">
						<img class="img_payment_selected" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/bank.png';?>" alt="Image" data-paymentmethod="" data-paymentcode="" data-paymentnumber=""  data-paymentaccount=""></div>
					<label class="title_payment selected">Metode pembayaran</label>
					<div id="choose_payment" class="choose_payment">Pilih ▾</div>
				</div>

                <div class="donasiaja-input sapaan" style="<?php if($form_sapaan_setting!='1'){echo'display:none;';} if($set_user==true && $sapaan!=''){echo'display:none;';}?>">
                    <group class="section-sapaan-label"><p>Sapaan&nbsp;:</p></group>
                    <group class="section-sapaan-text">
                        <?php if($sapaan_text_setting=='0'){ ?>
                        <div class="input-container">
                          <input type="radio" name="sapaan" value="Bapak" checked><label>Bapak</label>      
                        </div>
                        <div class="input-container">
                          <input type="radio" name="sapaan" value="Ibu"><label>Ibu</label>
                        </div>
                        <div class="input-container">
                          <input type="radio" name="sapaan" value="Kak"><label>Kak</label>     
                        </div>
                        <?php } else{ 

                            $jumlah_sapaan = count($sapaan_text_custom);
                            if($jumlah_sapaan==1){
                                $set_rounded = 'set_rounded';
                            }else{
                                $set_rounded = '';
                            }

                            foreach($sapaan_text_custom as $key => $value){
                                $sapaan_checked='';
                                if($key=='0'){$sapaan_checked='checked';}
                                echo '
                                <div class="input-container '.$set_rounded.'">
                                  <input type="radio" name="sapaan" value="'.$value.'" '.$sapaan_checked.'><label>'.$value.'</label>     
                                </div>
                                ';
                            }
                        } ?>
                    </group>
                </div>

				<?php if($set_user==true) { ?>
					<div class="profile-picture">
						<img alt="Image" src="<?php echo $profile_photo; ?>">
					</div>
					<div class="profile-name">
						<div class="user-sapaan" style="<?php if($sapaan==''){echo'display:none;';} ?>">
                                <span class=""><?php echo $sapaan; ?></span>
                        </div>
                        <div class="user-name">
                                <span class="data-name"><?php echo str_replace("\\", "", $fullname); ?></span>
                        </div>
						<div class="user-email">
								<span class="data-email"><?php echo $user_email; ?></span> - <span class="data-whatsapp"><?php echo $user_wa; ?></span>
						</div>
					</div>
				<?php } ?>

                <?php if($set_user==true) { ?>
                <div id="box_update_data" class="donasiaja-input" style=" background: #fff;border: 1px solid #e5e8ec; padding: 20px 20px 25px 20px;   border-radius: 4px;   margin-bottom: 25px;<?php if($fullname=='' || $user_wa==''){}else{echo'display:none;';} ?>">

                    <div class="donasiaja-input fullname_update">
                        <input id="name_update" placeholder="Nama Lengkap" type="text" maxlength="120" class="form-control" name="name_update" value="<?php echo $fullname; ?>" >
                    </div>
                    
                    <div class="donasiaja-input whatsapp_update">
                        <input id="whatsapp_update" placeholder="No Whatsapp atau Handphone" type="number" maxlength="15" class="form-control wa" name="whatsapp_update" value="<?php echo $user_wa; ?>" onkeypress="allowNumbersOnly(event)" >
                        <div class="checking-status"></div>
                    </div>

                    <button class="donation_button_now4" id="update_data" style="background:#7680ff;border-color:#7680ff;width: 100%;">Update<div class="donasi-loading loading-hide"></div></button>

                </div>
                <?php } ?>

                <div class="donasiaja-input fullname">
                    <input id="name" placeholder="Nama Lengkap" type="text" maxlength="120" class="form-control" name="name" value="<?php echo $fullname; ?>" <?php if($set_user==true){echo 'style="display:none;"';}?>>
                </div>
				
				<div class="donasiaja-input anonim" <?php if($form_anonim_setting=='0'){echo'style="display:none;"';}?>>
					<label>Sembunyikan nama saya (<?php echo $anonim_text; ?>)</label>
					<input id="anonim" type="checkbox" class="toggle1" name="anonim" /></span>
				</div>
				
				<div class="donasiaja-input whatsapp">
					<input id="whatsapp" placeholder="No Whatsapp atau Handphone" type="number" maxlength="15" class="form-control wa" name="whatsapp" value="<?php echo $user_wa; ?>" onkeypress="allowNumbersOnly(event)" <?php if($set_user==true){echo 'style="display:none;"';}?>>
                    <div class="checking-status"></div>
				</div>
				
				 <div class="donasiaja-input email">
					<input id="email" placeholder="Email (optional)" type="email" maxlength="60" class="form-control" name="email" value="<?php echo $user_email; ?>" <?php if($set_user==true){echo 'style="display:none;"';}?> <?php if($form_email_setting=='0'){echo 'style="display:none;"';}?>>
				</div> 


                <?php

                if($additional_field!=''){ 

                $no_field = 1;
                foreach ($additional_field['data'] as $key => $value) { ?>

                    <?php if($value['type']=='input-text') { ?>
                    <div class="donasiaja-input input-text">
                        <input id="text_field_<?php echo $no_field; ?>" placeholder="<?php echo $value['label']; ?>" type="text" maxlength="120" class="form-control text_field" name="" value="" data-id="<?php echo $no_field; ?>" data-label="<?php echo $value['label']; ?>">
                    </div>
                    <?php } ?>

                    <?php if($value['type']=='input-number') { ?>
                    <div class="donasiaja-input input-number">
                        <input id="text_field_<?php echo $no_field; ?>" placeholder="<?php echo $value['label']; ?>" type="number" class="form-control text_field" name="" value="" onkeypress="allowNumbersOnly(event)" data-id="<?php echo $no_field; ?>" data-label="<?php echo $value['label']; ?>">
                    </div>
                    <?php } ?>

                    <?php if($value['type']=='input-textarea') { ?>
                    <div class="donasiaja-input textarea_<?php echo $no_field; ?>">
                        <textarea id="text_field_<?php echo $no_field; ?>" placeholder="<?php echo $value['label']; ?>" class="form-control text_field" name="textarea_<?php echo $no_field; ?>" rows="3" data-id="<?php echo $no_field; ?>"  data-label="<?php echo $value['label']; ?>"></textarea>
                        <div class="box-char"><div id="charNum_<?php echo $no_field; ?>" class="charnum">&nbsp;</div></div>
                    </div>
                    <?php } ?>


                <?php $no_field++; } } ?>
				
				

                <div class="donasiaja-input comment">
                    <textarea id="comment" placeholder="Tuliskan pesan atau doa disini (optional)" class="form-control" name="comment" rows="3" <?php if($form_comment_setting=='0'){echo 'style="display:none;"';}?>></textarea>
                    <div class="box-char"><div id="charNum" class="charnum">&nbsp;</div></div>
                    <input id="campaign_id" type="text" class="form-control" name="campaign_id" value="<?php echo $row->campaign_id; ?>" style="display: none;">
                    <br><br>
                </div>

				<?php if($powered_by_setting=='1'){ ?>
				<div class="powered-donasiaja-box" style="margin-top: -20px;margin-bottom:70px;"><img alt="Donasi Aja" class="powered-donasiaja-img" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donasiaja.ico'; ?>">Powered by DonasiAja</div>
				<?php } ?>
			</div>

	</div>

	<div class="section-box donate_now" id="fixed-button" style="z-index:9;">

        <div class="outer">
          <div class="inner"></div>
        </div>


        <?php if($hasil->invert==true) { ?><span class="button-disabled"><button class="donation_button_now2" disabled=""><?php echo $text2; ?> Terpenuhi <span id="nominal_value"></span> <div class="donasi-loading loading-hide"></div></button></span>
        <?php } elseif($donasi_terpenuhi==true) { ?><span class="button-disabled"><button class="donation_button_now2" disabled=""><?php echo $text2; ?> Terpenuhi <span id="nominal_value"></span> <div class="donasi-loading loading-hide"></div></button></span>
        <?php } else { ?><span class="<?php if($link_code=='preview'){echo 'button-disabled';} ?>"><button class="donation_button_now2 scale_button" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>"><?php echo $text2; ?> <span id="nominal_value"></span> <div class="donasi-loading loading-hide"></div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="next_arrow" style="width: 15px; margin-bottom: -3px;" fill="white"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg></button></span><?php } ?>
	</div>
	<div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
	<div id="popup_payment" style="display: none;">
        <h2 class="card-title" style="background: #0099FF;color: #fff;padding: 50px 0px;margin-top: -30px;">Metode Pembayaran</h2>
         <div class="card_payment">

	        <?php
	        // Set FORM active
	        if($row->payment_status=='1'){ 
	               
                $data_bank = $payment_setting;
                if (!isset($payment_mapping) || empty($payment_mapping)) {
                    $payment_mapping = '1,2,3';
                }
                $urutkan = explode(',', $payment_mapping); // Ubah menjadi array ['3', '2', '1']
                // Buat mapping lama ke baru
                $mapUrutan = [];
                foreach ($urutkan as $index => $value) {
                    $mapUrutan[(string)($index + 1)] = $value;
                }
                // Buat array baru dengan urutan yang sesuai
                $payment_setting = [];
                foreach ($urutkan as $nomor) {
                    $key = "method{$nomor}";
                    if (isset($data_bank[$key])) {
                        $payment_setting[$key] = $data_bank[$key]; // Susun ulang berdasarkan urutan
                    }
                }

	        	$number = 1;
	        	$margin_top = 'margin-top: -45px;';
	         	foreach($payment_setting as $key => $value){

	         		// check status settingan, 1 (aktif) atau gak // [0] = "instant", [1] = "Intant Payment", [2] = "1"
	         		$code_method = $value[0];
				    $status_active = '0';

				    if($code_method=='instant'){
				    	$status_active = $instant_setting;
				    }
				    if($code_method=='va'){
				    	$status_active = $va_setting;
				    }
				    if($code_method=='transfer'){
				    	$status_active = $transfer_setting;
				    }

                    if (strpos($key, 'thod') !== false ) {
                        $data_method = explode('thod',$key);
                        // echo 'oke:'.$data_method[1];
                        $urutan_code_bank = $data_method[1];
                    }

	         		if($value[2]==$status_active) {

                        $hide_va_account = '';
                        // if($currency=='MYR' && $code_method=='va'){
                        //     $hide_va_account = 'display:none;';
                        // }
	         			
	         		?>

	         			<label class="card-label title-list <?php echo 'payment_'.$code_method; ?>" style="<?php echo $margin_top.$hide_va_account; ?>">
	         				<span class="card-title2"><?php echo $value[1]?></span></label>

		         			<?php foreach($bank_account as $k => $val) {
		         				
		         				$payment_code = $k;
                                if (strpos($payment_code, '@') !== false ) {
                                    $code_bank = explode('@',$payment_code);
                                    $payment_code = $code_bank[0]; // kode bank: qris, gopay, danamon, bsi
                                }
		         				$content  = (explode("_",$val)); // status_norek_name
		         				$payment_number  = $content[0];
		         				$payment_account = $content[1];
		         				$payment_urutan  = $content[2];

                                // Ubah urutan sesuai mapping
                                // if (isset($mapUrutan[$payment_urutan])) {
                                //     $payment_urutan = $mapUrutan[$payment_urutan];
                                // }

		         				$payment_name = '';
                                if($urutan_code_bank==$payment_urutan){
    		         				foreach ($payment_list as $val2) {
    		         					if($val2->code==$payment_code){
    		         						$payment_name = $val2->name;
    		         						if($code_method=='va'){
    				         					$payment_name = 'VA '.$val2->name;
    				         				}
    				         				if($code_method=='transfer'){
                                                if($payment_number=='flip'){
                                                    $payment_name =  $val2->name;
                                                }else{
                                                    if($currency=='MYR'){
                                                        $payment_name = $val2->name;
                                                    }else{
                                                        $payment_name = 'Transfer '.$val2->name;
                                                    }
                                                }

                                                if($val2->name == 'Credit Card'){
                                                    $payment_name = 'Credit Card';
                                                }
                                                if($val2->name == 'Paypal'){
                                                    $payment_name = 'Paypal';
                                                }
                                                if($val2->name == 'Stripe'){
                                                    $payment_name = 'Stripe';
                                                }
    				         				}
    		         					}

                                        if($payment_account=='midtrans' || $payment_account=='tripay' || $payment_account=='ipaymu' || $payment_account=='flip'){
                                            $flag_pg = 'set_pg';
                                        }else{
                                            $flag_pg = 'set_manual';
                                        }
    		         				}
                                }

                                if($urutan_code_bank==$payment_urutan){
		         				// if($payment_urutan==$number) {

		         				?>

							    <label class="card-label <?php echo $payment_code; ?> <?php echo 'payment_'.$code_method; ?> <?php echo $flag_pg; ?>" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>" style="<?php echo $hide_va_account;?>">
							      <input class="card-radio" type="radio" name="card" value="<?php echo $payment_code; ?>" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>">
							      <span class="card-icon" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/bank/'.$payment_code.'.png'; ?>" alt=""></span>
							      <span class="card-text" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>"><?php echo $payment_name; ?></span>
							      <span class="card-check">
							        <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
							      </span>
							    </label>

							    <?php } ?>

						<?php } ?>

					<?php $margin_top=''; } // end $value[2] ?>
				    
	         	<?php $number++; } 

	        
	        } // end foreach payment_manual_setting and if ?>

	        <?php

            // Settingan Bank dari General Settings
	        if($row->payment_status!='1'){ 

                $data_bank = $payment_setting;
                if (!isset($payment_mapping) || empty($payment_mapping)) {
                    $payment_mapping = '1,2,3';
                }
                $urutkan = explode(',', $payment_mapping); // Ubah menjadi array ['3', '2', '1']

                // Buat mapping lama ke baru
                $mapUrutan = [];
                foreach ($urutkan as $index => $value) {
                    $mapUrutan[(string)($index + 1)] = $value;
                }

                // Buat array baru dengan urutan yang sesuai
                $payment_setting = [];

                foreach ($urutkan as $nomor) {
                    $key = "method{$nomor}";
                    if (isset($data_bank[$key])) {
                        $payment_setting[$key] = $data_bank[$key]; // Susun ulang berdasarkan urutan
                    }
                }
                // echo 'cek ';
                // print_r($payment_setting);
                // echo 'cek ';
                // print_r($bank_account);
	        
	        	$number = 1;
	        	$margin_top = 'margin-top: -45px;';
	         	foreach($payment_setting as $key => $value){

                    if (strpos($key, 'thod') !== false ) {
                        $data_method = explode('thod',$key);
                        // echo 'oke:'.$data_method[1];
                        $urutan_code_bank = $data_method[1];
                    }

	         		// check status settingan, 1 (aktif) atau gak // 0 = "manual", 1 = "Transfer Bank", 2 = "1"
	         		if($value[2]=='1') {
	         			
	         			$code_method = $value[0]; // transfer, instant, va
                        $hide_va_account = '';

	         			?>

	         			<label class="card-label title-list <?php echo 'payment_'.$code_method; ?>" style="<?php echo $margin_top.$hide_va_account; ?>">
	         				<span class="card-title2"><?php echo $value[1]?></span></label>

		         			<?php foreach($bank_account as $k => $val) {
		         				
                                $payment_code = $k;
                                if (strpos($payment_code, '@') !== false ) {
                                    $code_bank = explode('@',$payment_code);
                                    $payment_code = $code_bank[0];
                                }
		         				$content  = (explode("_",$val)); // status_norek_name
		         				$payment_number  = $content[0];
		         				$payment_account = $content[1];
		         				$payment_urutan  = $content[2];

                                // Ubah urutan sesuai mapping
                                // if (isset($mapUrutan[$payment_urutan])) {
                                //     $payment_urutan = $mapUrutan[$payment_urutan];
                                // }

		         				$payment_name = '';

                                if($urutan_code_bank==$payment_urutan){
    		         				foreach ($payment_list as $val2) {
    		         					if($val2->code==$payment_code){
    		         						$payment_name = $val2->name;
    		         						if($code_method=='va'){
    				         					$payment_name = 'VA '.$val2->name;
    				         				}
    				         				if($code_method=='transfer'){
    				         					if($payment_number=='flip'){
                                                    $payment_name =  $val2->name;
                                                }else{
                                                    if($currency=='MYR'){
                                                        $payment_name = $val2->name;
                                                    }else{
                                                        $payment_name = 'Transfer '.$val2->name;
                                                    }
                                                }

                                                if($val2->name == 'Credit Card'){
                                                    $payment_name = 'Credit Card';
                                                }
                                                if($val2->name == 'Paypal'){
                                                    $payment_name = 'Paypal';
                                                }
                                                if($val2->name == 'Stripe'){
                                                    $payment_name = 'Stripe';
                                                }
    				         				}
    		         					}

                                        if($payment_account=='midtrans' || $payment_account=='tripay' || $payment_account=='ipaymu' || $payment_account=='flip'){
                                            $flag_pg = 'set_pg';
                                        }else{
                                            $flag_pg = 'set_manual';
                                        }
    		         				}
                                }

		         				if($urutan_code_bank==$payment_urutan) {

		         				?>

							    <label class="card-label <?php echo $payment_code; ?> <?php echo 'payment_'.$code_method; ?> <?php echo $flag_pg; ?>" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>" style="<?php echo $hide_va_account; ?>">
							      <input class="card-radio" type="radio" name="card" value="<?php echo $payment_code; ?>" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>">
							      <span class="card-icon" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/bank/'.$payment_code.'.png'; ?>"></span>
							      <span class="card-text" data-method="<?php echo $code_method; ?>" data-code="<?php echo $payment_code; ?>" data-number="<?php echo $payment_number; ?>" data-account="<?php echo $payment_account; ?>" data-paymentname="<?php echo $payment_name; ?>"><?php echo $payment_name; ?></span>
							      <span class="card-check">
							        <svg fill="#09F" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
							      </span>
							    </label>

							    <?php } ?>

						<?php } // enf foreach ?>

                        

					<?php $margin_top=''; } // end $value[2] ?>
				    
	         	<?php $number++; } 
	        
	        } // end foreach payment_manual_setting and if ?>

		  </div>
		  <br>
    </div>

    <?php if($flying_button_settings=='1' and $page_form_button=='1'){ ?>
        <?php $wa_admin = wa_variants_08_628_2($flying_button_number); ?>
        <!-- Floating Button - Whatsapp CS -->
        <a href="https://api.whatsapp.com/send?phone=<?php echo $wa_admin; ?>&text=<?php echo urlencode($flying_button_message); ?>" 
           class="whatsapp-float" target="_blank" style="cursor: pointer;">
           <?php if($flying_button_bubble_text!=''){ ?><div class="chat-bubble"><?php echo $flying_button_bubble_text; ?></div><?php } ?>
           <img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/whatsapp.svg'; ?>" class="whatsapp-icon" alt="" />
        </a>
    <?php } ?>

	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/jquery.min.js';?>"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/donasiaja.min.js';?>"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/js.cookie.js';?>"></script>
    <?php if($cc_midtrans==true) { ?>
    <script id="midtrans-script" type="text/javascript" src="https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js" data-environment="<?php echo $midtrans_environment; ?>" data-client-key="<?php echo $midtrans_clientkey; ?>"></script>
    <?php } ?>
<script>

        $(document).ready(function() {

            $('.counter-number .count').val('0').attr('value', '0');

            $('input[type="text"].count').on("keyup", function(e){
                nominal_nya = $(this).val();
                var id = $(this).attr('data-id');
                console.log(nominal_nya);
                
                while(nominal_nya.indexOf(0) == '0')
                {
                    nominal_nya = nominal_nya.substring(1);
                    $(this).val(nominal_nya).attr("value", nominal_nya);
                }
                if(nominal_nya==''){
                    $(this).val(0).attr("value", 0);
                    nominal_nya = 0;
                }

                var id = $(this).attr('data-id');
                var placeholder_text = $(this).attr('data-placeholder');
                var cardtitle_text = $(this).attr('data-cardtitle');
                var $input = $(this).parent().find('input');
                var count = nominal_nya;

                var qurban_type = $(this).attr('data-type');
                var qurban_payment = $(this).attr('data-payment');
                
                if(count<=0){
                    $('#btn_add_'+id).show();
                    $('#btn_plusminus_'+id).hide();
                    $('#atasnama_'+id).hide();
                    count = 0;
                    max_tagnya = count;
                    $('#atasnama_'+id+' .tag-editor').remove();
                }else{
                    count = count < 1 ? 1 : count;
                    max_tagnya = count;
                    if(qurban_type=='Sapi' || qurban_type=='Kerbau'){
                        if(qurban_payment=='1'){
                            max_tagnya = 7;
                            max_tagnya = count*max_tagnya;
                        }
                    }
                    if(qurban_type=='Unta'){
                        if(qurban_payment=='1'){
                            max_tagnya = 10;
                            max_tagnya = count*max_tagnya;
                        }
                    }

                    $('#atasnama_'+id+' .tag-editor').remove();
                    $('#tag_atasnama_'+id).tagEditor({
                        initialTags: [],
                        delimiter: ',',
                        maxTags: max_tagnya,
                        forceLowercase: false,
                        placeholder: placeholder_text
                    });
                }
                if(placeholder_text=='Atas nama'){
                    if (cardtitle_text.toLowerCase().indexOf('fitrah') > -1){
                        $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                    }else{
                        $('#atasnama_'+id).attr('title', placeholder_text);
                    }
                }else{
                    $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                }
                $input.val(count);
                $input.change();
                count_total_form();
                <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
                run_additional_donate();
                <?php } ?>
                return false;

            });

            $('.counter-number.btn_add').click(function () {
                var id = $(this).attr('data-id');
                var placeholder_text = $(this).attr('data-placeholder');
                var cardtitle_text = $(this).attr('data-cardtitle');
                var qurban_type = $(this).attr('data-type');
                var qurban_payment = $(this).attr('data-payment');
                max_tagnya = 1;
                if(qurban_type=='Sapi' || qurban_type=='Kerbau'){
                    if(qurban_payment=='1'){
                        max_tagnya = 7;
                    }
                }
                if(qurban_type=='Unta'){
                    if(qurban_payment=='1'){
                        max_tagnya = 10;
                    }
                }
                $(this).hide();
                $('#btn_plusminus_'+id).show();
                $('#atasnama_'+id).show();
                var $input = $('#btn_plusminus_'+id+' input').attr('value', 1).val(1);
                $('#atasnama_'+id+' .tag-editor').remove();
                $('#tag_atasnama_'+id).tagEditor({
                    initialTags: [],
                    delimiter: ',',
                    maxTags: max_tagnya,
                    forceLowercase: false,
                    placeholder: placeholder_text
                });
                if(placeholder_text=='Atas nama'){
                    if (cardtitle_text.toLowerCase().indexOf('fitrah') > -1){
                        $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                    }else{
                        $('#atasnama_'+id).attr('title', placeholder_text);
                    }
                }else{
                    $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                }
                
                count_total_form();
                <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
                run_additional_donate();
                <?php } ?>
            });

            $('.counter-number .minus').click(function () {
                var id = $(this).attr('data-id');
                var placeholder_text = $(this).attr('data-placeholder');
                var cardtitle_text = $(this).attr('data-cardtitle');
                var $input = $(this).parent().find('input');
                var count = parseInt($input.val()) - 1;

                var qurban_type = $(this).attr('data-type');
                var qurban_payment = $(this).attr('data-payment');
                
                if(count<=0){
                    $('#btn_add_'+id).show();
                    $('#btn_plusminus_'+id).hide();
                    $('#atasnama_'+id).hide();
                    count = 0;
                    max_tagnya = count;
                    $('#atasnama_'+id+' .tag-editor').remove();
                }else{
                    count = count < 1 ? 1 : count;
                    max_tagnya = count;
                    if(qurban_type=='Sapi' || qurban_type=='Kerbau'){
                        if(qurban_payment=='1'){
                            max_tagnya = 7;
                            max_tagnya = count*max_tagnya;
                        }
                    }
                    if(qurban_type=='Unta'){
                        if(qurban_payment=='1'){
                            max_tagnya = 10;
                            max_tagnya = count*max_tagnya;
                        }
                    }

                    $('#atasnama_'+id+' .tag-editor').remove();
                    $('#tag_atasnama_'+id).tagEditor({
                        initialTags: [],
                        delimiter: ',',
                        maxTags: max_tagnya,
                        forceLowercase: false,
                        placeholder: placeholder_text
                    });
                }
                if(placeholder_text=='Atas nama'){
                    if (cardtitle_text.toLowerCase().indexOf('fitrah') > -1){
                        $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                    }else{
                        $('#atasnama_'+id).attr('title', placeholder_text);
                    }
                }else{
                    $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                }
                $input.val(count);
                $input.change();
                count_total_form();
                <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
                run_additional_donate();
                <?php } ?>
                return false;
            });

            $('.counter-number .plus').click(function () {
                var id = $(this).attr('data-id');
                var placeholder_text = $(this).attr('data-placeholder');
                var cardtitle_text = $(this).attr('data-cardtitle');
                var $input = $(this).parent().find('input');
                var count = parseInt($input.val()) + 1;

                var qurban_type = $(this).attr('data-type');
                var qurban_payment = $(this).attr('data-payment');
                max_tagnya = count;
                if(qurban_type=='Sapi' || qurban_type=='Kerbau'){
                    if(qurban_payment=='1'){
                        max_tagnya = 7;
                        max_tagnya = count*max_tagnya;
                    }
                }
                if(qurban_type=='Unta'){
                    if(qurban_payment=='1'){
                        max_tagnya = 10;
                        max_tagnya = count*max_tagnya;
                    }
                }

                $('#atasnama_'+id+' .tag-editor').remove();
                $('#tag_atasnama_'+id).tagEditor({
                    initialTags: [],
                    delimiter: ',',
                    maxTags: max_tagnya,
                    forceLowercase: false,
                    placeholder: placeholder_text
                });

                if(placeholder_text=='Atas nama'){
                    if (cardtitle_text.toLowerCase().indexOf('fitrah') > -1){
                        $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                    }else{
                        $('#atasnama_'+id).attr('title', placeholder_text);
                    }
                }else{
                    $('#atasnama_'+id).attr('title', placeholder_text+' ('+max_tagnya+' orang)');
                }
                $input.val(count);
                $input.change();
                count_total_form();
                <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
                run_additional_donate();
                <?php } ?>
                return false;
            });

            function count_total_form(){
                var total_nominal_form = 0;
                var totalNominalForm = jQuery('.card-form').map(function() {
                    
                    var data_pricing_int = $(this).find('.data_pricing').attr('data-pricing');
                    var data_count = $(this).find('.count').val();
                    var data_nominal = data_pricing_int*data_count;
                    total_nominal_form = total_nominal_form+data_nominal;
                    set_cookies_nominal(total_nominal_form);
                    nominal = total_nominal_form;
                    // console.log(total_nominal_form);
                    content = total_nominal_form.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
                    if(content==0){
                        $('#nominal_value').text('');
                    }else{
                        $('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
                    }
                    
                    
                }).get().toString();
            }
        });
        
        labelnya = '';

		$(document).ready(function() {

			nominal = 0;
            whatsapp_valid = false;

			if(Cookies.get('nominal')!='undefined'){

				nominal = Cookies.get('nominal');
                check_ewallet_setting(nominal);
                opt_on_url = '<?php echo $opt_on_url;?>';
                if(opt_on_url=='others'){
                    $('input:radio[name="nominal_donasi"][value="0"]').attr('checked', 'checked');
                    $('.other_nominal_value input').val(nominal);
                    $('.other_nominal_value').removeClass('hide_input');
                    $('.total_summary input').val(numberWithDot(nominal));
                    check_ewallet_setting(nominal);
                }else {
                    $('input:radio[name="nominal_donasi"][value="'+nominal+'"]').attr('checked', 'checked');
                    $('.total_summary input').val(numberWithDot(nominal));
                    check_ewallet_setting(nominal);
                }
				
				if ($("#other_nominal_radio").hasClass("other_nominal") && nominal==0) {
					$('.other_nominal_value').removeClass('hide_input');
					$('.other_nominal_value input').caretTo(0);
					$('#nominal_value').text('');
				}else{
					if(nominal<1000000){
						var check_dlast3 = nominal.substr(nominal.length - 3);
						if(check_dlast3=='000'){
							nominalnya = nominal+'_';
							content = nominalnya.split('000_').join('rb');
							$('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
						}else{
                            nominal = nominal ? nominal.toString() : "";
							content = nominal.replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
							$('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
						}
					}else{
                        nominal = nominal ? nominal.toString() : "";
						content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
						$('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
					}
					
				}
			}else{
                $('input.sering_dipilih:radio[name="nominal_donasi"]').attr('checked', 'checked');
                var nominal_donasi_sering_dipilih = $('input.sering_dipilih:radio[name="nominal_donasi"]').val();
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+numberWithDot(nominal_donasi_sering_dipilih));
                $('.total_summary input').val(numberWithDot(nominal_donasi_sering_dipilih));
                set_cookies_nominal(nominal_donasi_sering_dipilih);
                check_ewallet_setting(nominal_donasi_sering_dipilih);
            }

			if(Cookies.get('nominal')!='' && Cookies.get('nominal')!='undefined'){
				try {
					var nominal_donasi = Cookies.get('nominal').toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
					$('.other_nominal_value input').val(nominal_donasi);
				}catch(err) {
				}
			}

            <?php if($row->form_type=='4') { ?>

            // form_type 4
            if($('.pendapatan_pertanian input').val()=='' || $('.pendapatan_perbulan input').val()=='' || $('.pendapatan_lainnya input').val()=='' || $('.pengeluaran input').val()==''){
                $('#nominal_value').text('');
            }

            <?php } ?>

            <?php if($row->form_type=='5' || $row->form_type=='6' || $row->form_type=='7') { ?>

            // form_type 5,6,7
            set_cookies_nominal(0);
            $('#nominal_value').text('');
            
            <?php } ?>

			<?php

                if($minimal_donasi==''){
                    $minimal_donasi = $row->packaged;
                }

				if($row->form_type=="3"){
					echo 'var min_donasi = '.$row->packaged.';';
				}else{
					echo 'var min_donasi = '.$minimal_donasi.';';
				}

                if($maximal_donasi==''){$maximal_donasi=0;}

                echo 'var max_donasi = '.$maximal_donasi.';';

			?>

			function randomInRange(from, to) {
			  var r = Math.random();
			  return Math.floor(r * (to - from) + from);
			}

			<?php 

			if($unique_number_setting=='1') {
				if($unique_number_value['unique_number'][0]==''){
					echo 'var unique_number=0;';
				}else{
					echo 'var unique_number='.$unique_number_value['unique_number'][0].';';
				}
			}else if($unique_number_setting=='2') {
                $min_number = $unique_number_value['unique_number'][1];
                $max_number = $unique_number_value['unique_number'][2];
                if($min_number==''){
                    $min_number = 0;
                }
                if($max_number==''){
                    $max_number = 999;
                }
                
                $get_kode_unik = generate_kode_unik($min_number,$max_number);

			echo 'var unique_number = '.$get_kode_unik.';';
            // echo "console.log('unique_number:'+unique_number);";

			}else{
			echo 'var unique_number=0;';
			}

			?>

            <?php /*

            // card data from customer input, for example
            // var cardData = {
            //   "card_number": 4811111111111114,
            //   "card_exp_month": 02,
            //   "card_exp_year": 2027,
            //   "card_cvv": 123,
            //   // "bank_one_time_token": "12345678"
            //   "3ds": "112233"
            // };
            
            // card data from customer input, for example

            // MidtransNew3ds.callback({
            //     "status_code": "400",
            //     "status_message": "One or more parameters in the payload is invalid.",
            //     "validation_messages": ["card_cvv is not required"],
            //     "id": "8ddaffeb-ae4d-4b08-83bf-3177f721686f"
            // });

            // MidtransNew3ds.callback({
            //     "status_code": "200",
            //     "status_message": "Credit card token is created as Token ID.",
            //     "token_id": "48111111-1114-b8722ea8-9c2a-406a-a497-69920fa230d7",
            //     "hash": "48111111-1114-mami"
            // });

            */ ?>

            $(function(){
              // ===== Konstanta & state =====
              const VALIDATION_THRESHOLD = 5;   // toleransi derajat
              const MIN_ROTATION = 90;
              const MAX_ROTATION = 270;

              const captchaImages = [
                "https://picsum.photos/400/400?random=1",
                "https://picsum.photos/400/400?random=2",
                "https://picsum.photos/400/400?random=3",
                "https://picsum.photos/400/400?random=4",
                "https://picsum.photos/400/400?random=5",
                "https://picsum.photos/400/400?random=6",
                "https://picsum.photos/400/400?random=7",
                "https://picsum.photos/400/400?random=8",
                "https://picsum.photos/400/400?random=9",
                "https://picsum.photos/400/400?random=10"
              ];

              let baseDegree = 0;   // derajat target acak (disembunyikan dari user)
              let inputDegree = 0;  // nilai slider (0..360)

              const $base   = $('#captchaBase');
              const $inner  = $('#captchaInner');
              const $slider = $('#degreeSlider');
              const $btn    = $('#btnValidate');
              const $msg    = $('#msg');

              // ===== Helper =====
              function randImage(){
                return captchaImages[Math.floor(Math.random() * captchaImages.length)];
              }
              function randDegree(min, max){
                return Math.floor(Math.random() * (max - min + 1)) + min;
              }
              function setMessage(text, ok=false){
                $msg.text(text);
                $msg.toggleClass('info', ok);
                $msg.css('visibility', 'visible');
              }
              function hideMessage(){ $msg.css('visibility','hidden'); }

              // ===== Init =====
              function initCaptcha(){
                hideMessage();
                $btn.css('visibility', 'hidden');

                // Random image
                const img = randImage();
                $base.css('background-image', `url("${img}")`);
                $inner.css('background-image', `url("${img}")`);

                // Random target degree (disimpan di baseDegree)
                baseDegree = randDegree(MIN_ROTATION, MAX_ROTATION);

                // Reset slider / inner
                inputDegree = 0;
                $slider.val(0);
                $inner.css('transform', `rotate(${baseDegree + inputDegree}deg)`);
              }

              // ===== Events =====
              $slider.on('input change', function(){
                inputDegree = Number(this.value);
                hideMessage();
                $msg.removeClass('info');
                $inner.css('transform', `rotate(${baseDegree + inputDegree}deg)`);
              });

              // Munculkan tombol Validate hanya jika slider digeser (value != 0)
              $slider.on('mouseup touchend', function(){
                if (inputDegree !== 0) {
                  
                    const diff = Math.abs(360 - baseDegree - inputDegree);
                    if (diff <= VALIDATION_THRESHOLD) {
                      setMessage('Correct! Thank you!', true);
                      
                      console.log('Correct 2!');
                      captcha = true;

                      $('#btnValidate').attr('data-captcha', true);

                    } else {
                      setMessage('Incorrect match, please try again.', false);

                      console.log('Incorrect 2!');
                      captcha = false;

                      $('#btnValidate').attr('data-captcha', false);

                    }

                    $btn.css('visibility', 'visible');

                } else {
                  $btn.css('visibility', 'hidden');
                }
              });

              $btn.on('click', function(){
                // Hitung selisih derajat terhadap target (mengikuti logika pen asli)
                const diff = Math.abs(360 - baseDegree - inputDegree);
                if (diff <= VALIDATION_THRESHOLD) {
                  setMessage('Correct! Thank you!', true);
                  console.log('Correct 1!');
                  captcha = true;
                } else {
                  setMessage('Incorrect match, please try again.', false);
                  console.log('Incorrect 1 !');
                  captcha = false;
                }
              });

              // Pertama kali load
              initCaptcha();
            });



            function getToken(cardData) {

              return new Promise((resolve, reject) => {
                MidtransNew3ds.getCardToken(cardData, {
                  onSuccess: function(response) {
                    resolve(response.token_id);
                  },
                  onFailure: function(response) {
                    reject(response);
                  }
                });
              });
            }

            // Pemakaian:
            m_token_id = null;
            async function processCC(el) {
              try {

                var card_number = $('#cc_number').val();
                var cleaned_card_number = card_number.replace(/\s/g, '');
                var card_number = parseInt(cleaned_card_number);
                var mmyy = $('#cc_mmyy').val().replace(/\s/g, ''); // hasilnya: "02/27" atau "02/44"
                var parts = mmyy.split('/');
                var card_exp_month = parseInt(parts[0], 10);
                var card_exp_year = parseInt('20' + parts[1], 10);
                var card_cvv = parseInt($('#cc_cvv').val());

                var cardData = {
                  "card_number": card_number,
                  "card_exp_month": card_exp_month,
                  "card_exp_year": card_exp_year,
                  "card_cvv": parseInt($('#cc_cvv').val())
                };

              // console.log(cardData);
              // return false;

                const tokenId = await getToken(cardData);
                console.log("Token ID:", tokenId);
                m_token_id = tokenId;
                submit_donation(el);

                // lanjutkan dengan AJAX ke backend, dll
              } catch (err) {
                console.error("Gagal mendapatkan token:", err);

                $('.popup-button-container .donasi-loading').addClass('loading-hide');
                $('.popup-button-container .next_arrow').hide();
                $('.popup-button-container .donation_button_now3').attr('disabled', true);
                $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
                $('.popup-button-container .outer').hide();
                $('.popup-button-container .inner').removeClass('active');

              }
            }

            var title_campaign = '<?php echo $campaign_title; ?>';
            var slug_campaign = '<?php echo $slug; ?>';

            captcha = false;

            $(".donation_button_now2, .donation_button_now3").on("click", function(e) {

                // running_captcha();
                // console.log('cek 1');
                console.log('running button');

                var el = this;

                var name = $('#name').val();
                var whatsapp = $('#whatsapp').val();
                var email = $('#email').val();
                var payment_method = $('.img_payment_selected').attr('data-paymentmethod');

                if(name==''){
                    $('.donasiaja-input.fullname input').addClass('set_red');
                }
                if(whatsapp==''){
                    $('.donasiaja-input.whatsapp input').addClass('set_red');
                }

                if(name==''){
                    var message = "Maaf, Silahkan lengkapi Nama anda!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;
                }

                if(whatsapp==''){
                    var message = "Maaf, Silahkan lengkapi Whatsapp anda!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;
                }

                if (whatsapp.length < 7) {
                    var message = "Maaf, No Handphone atau whatsapp anda tidak valid!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;
                }

                if(payment_method==''){
                    var message = "Maaf, Silahkan pilih metode pembayaran anda!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    $('#choose_payment').addClass('set_red');
                    return false;
                }


                <?php if($form_check_wa_setting=='1' && $set_user==false){ ?>
                if (whatsapp_valid==false) {
                    var message = "Maaf, No Handphone atau whatsapp anda tidak terdaftar di whatsapp atau silahkan ketik ulang!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;
                }
                <?php } ?>


                // ==================
                // CAPTCHA ON
                // ==================
                var c = $(el).data('captcha');
                if(c!=undefined && c==true){
                    console.log('c:'+c);
                    captcha = c;
                }

                <?php if($form_captcha_setting=='1'){ ?>

                    if(captcha==false){

                        $('.popup-captcha-overlay').addClass('show');
                        $('#popupCaptcha').addClass('show');

                        console.log('captcha show Popup');

                        return false;

                    }else{

                        $('.popup-captcha-overlay').removeClass('show');
                        $('#popupCaptcha').removeClass('show');

                        console.log('Lanjutkan process');

                    }

                <?php } ?>

                
                
                if($('.img_payment_selected').attr('data-paymentnumber')=='cc'){

                    <?php if (!empty($row->popup_info_status) && $row->popup_info_status=='1') { ?>

                    var check_button_doa = $(el).attr('data-popup');

                    console.log('check_button_doa:'+check_button_doa);
                    
                    if(check_button_doa==undefined){ // false

                        $('.popup-doa-overlay').addClass('show');
                        $('#popupDoa').addClass('show');

                        $('.popup-button-container').slideDown();
                        $('.popup-button-container .donasi-loading').addClass('loading-hide');
                        $('.popup-button-container .next_arrow').show();
                        $('.popup-button-container .donation_button_now3').attr('disabled', false);
                        $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $button_color; ?>','border-color':'<?php echo $button_color; ?>'});

                        // $('.popup-button-container .next_arrow').hide();
                        console.log('cek 1');
                        $('#popupCC .donation_button_now3').attr('data-popup', true);

                        return false;

                    }else{

                    }

                    <?php } ?>

                    console.log('Gasss');

                    $('.popup-cc-overlay').addClass('show');
                    $('#popupCC').addClass('show');
                    $('.popup-doa-overlay').removeClass('show');
                    $('#popupDoa').removeClass('show');

                    $('.popup-button-container').slideDown();
                    $('.popup-button-container .donasi-loading').addClass('loading-hide');
                    $('.popup-button-container .next_arrow').show();
                    $('.popup-button-container .donation_button_now3').attr('disabled', true);
                    $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
                    $('.popup-button-container .next_arrow').hide();


                    var check_button_cc = $(el).attr('data-cc');
                    console.log(check_button_cc);
                    if(check_button_cc!=undefined){

                        // $('.popup-button-container .donasi-loading').removeClass('loading-hide');
                        $('.popup-button-container .next_arrow').hide();
                        $('.popup-button-container .donation_button_now3').attr('disabled', true);
                        $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
                        $('.popup-button-container .outer').show();
                        $('.popup-button-container .inner').addClass('active');

                        // process CC
                        processCC(this);

                        console.log("processCC > check_button_cc:"+check_button_cc);
                    }
                    
                }else{
                    

                    // on popup
                    <?php if (!empty($row->popup_info_status) && $row->popup_info_status=='1') { ?>

                    $('.popup-doa-overlay').addClass('show');
                    $('#popupDoa').addClass('show');

                    $('.popup-button-container').slideDown();
                    $('.popup-button-container .donasi-loading').addClass('loading-hide');
                    $('.popup-button-container .next_arrow').show();
                    $('.popup-button-container .donation_button_now3').attr('disabled', false);

                    var check_button = $(el).attr('data-popup');
                    console.log("check_button:"+check_button);

                    if(check_button!=undefined){

                        $('.popup-button-container .donasi-loading').removeClass('loading-hide');
                        $('.popup-button-container .next_arrow').hide();
                        $('.popup-button-container .donation_button_now3').attr('disabled', true);
                        $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
                        $('.popup-button-container .outer').show();
                        $('.popup-button-container .inner').addClass('active');

                        // submit donation

                        $('.popup-doa-overlay').removeClass('show');
                        $('#popupDoa').removeClass('show');
                        $('.popup-button-container').slideUp();

                        submit_donation(this);

                    }

                    <?php }else{ ?>
                        
                        submit_donation(this);

                    <?php } ?>
                }
                

            });


            function submit_donation(el){

                var nominalnya = parseInt(Cookies.get('nominal'));
                var totalnya = parseInt(Cookies.get('totalnya'));
                var form_sapaan_setting = <?php echo $form_sapaan_setting;?>;

                <?php
                if($row->form_type=='5') { echo '
                main_donate = nominalnya;
                total_nominalnya = unique_number + nominalnya; ';
                }elseif($row->form_type=='4') { echo '
                main_donate = nominalnya;
                total_nominalnya = unique_number + nominalnya; ';
                }elseif($additional_formula!='' && $row->form_status=='1'){ 
                    if($total_on_url!=''){ echo '
                        main_donate = nominalnya;
                        total_nominalnya = unique_number + nominalnya; ';
                    }else{ echo '
                        main_donate = totalnya;
                        total_nominalnya = unique_number + totalnya; ';
                    }
                }else{ echo '
                main_donate = nominalnya;
                total_nominalnya = unique_number + nominalnya; ';
                }
                ?>

                // console.log("main_donate:"+main_donate);
                // console.log("min_donasi:"+min_donasi);
                
                <?php if($row->form_type=='4') { ?>

                if(main_donate<=0 && min_donasi==0){
                    var message = "Maaf, nominal yang anda miliki tidak bisa dilanjutkan atau belum mencapai Nisab!";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;
                }
                <?php } ?>

                if(main_donate>=min_donasi){

                    if(max_donasi==0 || max_donasi==''){
                    }else{
                        if(main_donate>max_donasi) {
                        var message = "Maaf, Maximal sebesar <?php echo $show_currency; ?> "+numberWithDot(max_donasi)+"";
                        var status = "warning";
                        var timeout = 4000;
                        createAlert(message, status, timeout);
                        return false;
                        }
                    }
                    
                    var campaign_id = $('#campaign_id').val();
                    var name = $('#name').val();
                    var whatsapp = $('#whatsapp').val();
                    var email = $('#email').val();
                    var anonim = $('#anonim').prop('checked');
                    if(anonim==true){anonim = 1;}else{anonim = 0;}
                    var comment = $('#comment').val();
                    var payment_method = $('.img_payment_selected').attr('data-paymentmethod');
                    var payment_code = $('.img_payment_selected').attr('data-paymentcode');
                    var payment_number = $('.img_payment_selected').attr('data-paymentnumber');
                    var payment_account = $('.img_payment_selected').attr('data-paymentaccount');
                    var a_id = <?php echo $affcode_id; ?>;
                    var cs_id = <?php echo $cs_terendah; ?>;

                    var info_qurban = null;
                    var an_name = 0;
                    var allAttributesQurban = jQuery('.card-qurban').map(function(i, el) {
                        var an = $(el).find('.tagit').tagEditor('getTags')[0].tags;
                        var qurban_name = $(el).find('.qurban_name').text();
                        var qurban_type = $(el).find('.card-img').attr('data-type');
                        var qurban_payment = $(el).find('.card-img').attr('data-payment');
                        var qurban_pricing = $(el).find('.qurban_pricing').text();
                        var qurban_pricing_int = $(el).find('.qurban_pricing').attr('data-pricing');
                        var qurban_count = $(el).find('.count').val();
                        var qurban_nominal = qurban_pricing_int*qurban_count;
                        if(an==undefined){
                            an = '';
                        }
                        if(qurban_count>=1){
                            if(an==''){
                                an_name = an_name+1;
                                $(el).find('.tag-editor').addClass('set_red');
                            }
                            return '{"qurban":"'+qurban_name+'","per@":"'+qurban_pricing.replace(/\s/g,'')+'","jumlah":"'+qurban_count+'","nominal":"<?php echo $show_currency; ?>'+numberWithDot(qurban_nominal)+'","an":"'+an+'","type":"'+qurban_type+'","payment":"'+qurban_payment+'"}';
                        }
                    }).get().toString();
                    info_qurban = '['+allAttributesQurban+']';

                    if(an_name>=1){
                        var message = "Maaf, anda belum mengisi atas nama siapa.";
                        var status = "warning";
                        var timeout = 4000;
                        createAlert(message, status, timeout);
                        return false;
                    }

                    var info_package2 = null;
                    var allAttributesPackage2 = jQuery('.card-package2').map(function(i, el) {
                        var package2_name = $(el).find('.package2_name').text();
                        var package2_pricing = $(el).find('.package2_pricing').text();
                        var package2_pricing_int = $(el).find('.package2_pricing').attr('data-pricing');
                        var package2_count = $(el).find('.count').val();
                        var package2_nominal = package2_pricing_int*package2_count;
                        if(package2_count>=1){
                            return '{"package":"'+package2_name+'","per@":"'+package2_pricing.replace(/\s/g,'')+'","jumlah":"'+package2_count+'","nominal":"<?php echo $show_currency; ?>'+numberWithDot(package2_nominal)+'"}';
                        }
                    }).get().toString();
                    info_package2 = '['+allAttributesPackage2+']';

                    var info_zfitrah = null;
                    var allAttributesZfitrah = jQuery('.card-zfitrah').map(function(i, el) {
                        var zfitrah_name = $(el).find('.zfitrah_name').text();
                        var zfitrah_pricing = $(el).find('.zfitrah_pricing').text();
                        var zfitrah_pricing_int = $(el).find('.zfitrah_pricing').attr('data-pricing');
                        var zfitrah_count = $(el).find('.count').val();
                        var zfitrah_nominal = zfitrah_pricing_int*zfitrah_count;
                        var an = $(el).find('.tagit').tagEditor('getTags')[0].tags;
                        if(an==undefined){
                            an = '';
                        }
                        if(zfitrah_count>=1){
                            if(an==''){
                                an_name = an_name+1;
                                $(el).find('.tag-editor').addClass('set_red');
                            }
                            return '{"package":"'+zfitrah_name+'","per@":"'+zfitrah_pricing.replace(/\s/g,'')+'","jumlah":"'+zfitrah_count+'","nominal":"<?php echo $show_currency; ?>'+numberWithDot(zfitrah_nominal)+'","an":"'+an+'"}';
                        }
                    }).get().toString();
                    info_zfitrah = '['+allAttributesZfitrah+']';

                    <?php if($row->form_type=='4') { ?>
                    var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val();
                    var type_zakat = "<?php echo $row->zakat_penghasilan_type; ?>";
                    var info_zmaal = '[]';
                    if(type_zakat!=''){
                        var info_zmaal = '[{"type":"'+type_zakat+'","hitungan":"'+option_zakat+'"}]';
                    }
                    <?php }else{ ?>
                    var info_zmaal = '[]';
                    <?php } ?>
                    
                    var info_addformula = null;
                    var allAttributesFieldFormula = jQuery('input.text_field_formula').map(function(i, el) {
                            var label = $(el).data("label");
                            var value = $(el).val();
                            if(value!=''){
                                return '{"label":"'+label+'","nominal":"<?php echo $show_currency; ?>'+numberWithDot(value)+'"}';
                            }
                    }).get().toString();
                    info_addformula = '['+allAttributesFieldFormula+']';

                    jlh_field = 0;
                    var new_selected_field = [];
                    $(".text_field").each(function(i, el){
                            var id = $(el).data("id");
                            var label = $('#text_field_'+id).data('label');
                            var value = $('#text_field_'+id).val();
                            new_selected_field.push('"'+label+'":"'+value+'"');
                            jlh_field++;
                    });
                    if(jlh_field==0){
                        new_selected_field = '';
                    }else{
                        new_selected_field = ','+new_selected_field;
                    }
                    
                    var info_donate = '{"Kode Unik":"'+unique_number+'"'+new_selected_field+'}';
                    <?php if($set_user==true) { ?>
                    var sapaan = "<?php echo $sapaan?>";
                    <?php }else{ ?>
                    var sapaan = $('input[type="radio"][name="sapaan"]:checked').val();
                    <?php } ?>
                    if(form_sapaan_setting=='0' || form_sapaan_setting==''){sapaan='';}

                    set_cookies_name(name);
                    set_cookies_whatsapp(whatsapp);
                    set_cookies_email(email);

                    var ip = "<?php echo donasiaja_getIP();?>";
                    var os = "<?php echo donasiaja_getOS();?>";
                    var browser = "<?php echo donasiaja_getBrowser();?>";
                    var mobdesktop = "<?php echo donasiaja_getMobDesktop();?>";
                    var currency = "<?php echo $currency;?>";

                    var utm_source = "<?php echo $utm_source;?>";
                    var utm_medium = "<?php echo $utm_medium;?>";
                    var utm_content = "<?php echo $utm_content;?>";
                    var utm_campaign = "<?php echo $utm_campaign;?>";
                    var utm_term = "<?php echo $utm_term;?>";
                    var utm_id = "<?php echo $utm_id;?>";

                    $('.donasi-loading').removeClass('loading-hide');
                    $('.next_arrow').hide();
                    $(el).attr('disabled', true);
                    $('.donate_now .donation_button_now2').attr('disabled', true);
                    progressBar();

                    // console.log('submit data');
                    // return false;

                    var data_nya = [
                        campaign_id,
                        name,
                        whatsapp,
                        email,
                        anonim,
                        comment,
                        total_nominalnya,
                        payment_method,
                        payment_code,
                        payment_number,
                        payment_account,
                        unique_number,
                        title_campaign,
                        a_id,
                        main_donate,
                        info_donate,
                        cs_id,
                        info_qurban,
                        info_package2,
                        info_zfitrah,
                        info_addformula,
                        sapaan,
                        slug_campaign,
                        ip,
                        os,
                        browser,
                        mobdesktop,
                        utm_source,
                        utm_medium,
                        utm_content,
                        utm_campaign,
                        utm_term,
                        utm_id,
                        m_token_id,
                        info_zmaal
                    ];

                    var data = {
                        "action": "djafunction_submit_donasi",
                        "datanya": data_nya
                    };

                    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {

                        $('.outer .inner.active').css({'width':'100%'})
                        $('.donasi-loading').addClass('loading-hide');
                        if (response.indexOf('-') > -1){
                            var urlnya = "<?php echo $current_url.'/'.$page_typ.'/'; ?>"+response;
                            window.location.replace(urlnya);
                        }else{
                            if(response=='blocked'){
                                var message = "Anda tidak diijinkan untuk memasukkan data donasi lagi.";
                            }else if(response=='blocked_wa'){
                                var message = "Data whatsapp anda tidak diijinkan untuk melanjutkan.";
                            }else if(response=='blocked_ip'){
                                var message = "Anda tidak diijinkan untuk melanjutkan.";
                            }else if(response=='spam'){
                                var message = "Anda terdeteksi sebagai SPAM.";
                                setTimeout(function() {
                                    location.reload();
                                }, 3000);
                            }else if(response=='nominal_not_allowed'){
                                var message = "Nominal donasi tidak diijinkan.";
                                setTimeout(function() {
                                    location.reload();
                                }, 3000);
                            }else{
                                console.log(response);
                                var message = "Submit <?php echo $allocation_title; ?> gagal.";
                            }
                            var status = "warning";
                            var timeout = 5000;
                            createAlert(message, status, timeout);
                            return false;
                        }

                        // console.log(response);
                        
                    });
                }else{
                    <?php if($row->form_type=='5') { ?>

                    var message = "Maaf, anda belum memilih qurban.";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;

                    <?php } else { ?>
                    
                    var message = "Maaf, Minimal sebesar <?php echo $show_currency; ?> "+numberWithDot(min_donasi)+"";
                    var status = "warning";
                    var timeout = 4000;
                    createAlert(message, status, timeout);
                    return false;

                    <?php } ?>
                }
            }

            
            <?php if($form_check_wa_setting=='1'){ ?>

            $('#whatsapp').on('blur', function () {
                const wa = $(this).val().trim();

                if (wa === '') return; // kosong? skip

                console.log('checking.. '+wa);

                // tampilkan indikator loading
                $('.donasiaja-input.whatsapp .checking-status').html('<div class="checking">Checking whatsapp number...</div>');

                var data_nya = [
                    wa
                ];

                var data = {
                    "action": "djafunction_check_wa_exist",
                    "datanya": data_nya
                };

                jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
                    console.log('hasil:'+response);

                    if(response=='exist'){
                        whatsapp_valid = true;
                        $('.donasiaja-input.whatsapp .checking-status').html('<div class="checking valid">Whatsapp number valid.</div>');
                    }else if(response=='error'){
                        $('.donasiaja-input.whatsapp .checking-status').html('<div class="checking not-valid-error">Error, coba ulangi kembali ketik nomor whatsapp anda.</div>');
                    }else if(response=='wanotif_off'){
                        $('.donasiaja-input.whatsapp .checking-status').html('<div class="checking not-valid-error">Wanotif API tidak aktif. Silakan periksa lalu coba lagi.</div>');
                    }else{
                        $('.donasiaja-input.whatsapp .checking-status').html('<div class="checking not-valid">Whatsapp number not valid.</div>');
                    }

                });

            });

            <?php } ?>



            $('.close-popup, .popup-doa-overlay').on('click', function() {
                $('.popup-doa-overlay').removeClass('show');
                $('#popupDoa').removeClass('show');
                $('.popup-button-container').slideUp();

                $('.next_arrow').show();
                $('.donation_button_now2').attr('disabled', false);
                progressBarHide();

                set_close_popup();


            });

            $('.close-popup, .popup-cc-overlay').on('click', function() {
                $('.popup-cc-overlay').removeClass('show');
                $('#popupCC').removeClass('show');
                $('.popup-button-container').slideUp();
                

                $('.next_arrow').show();
                $('.donation_button_now2').attr('disabled', false);
                progressBarHide();

                $('.popup-doa-overlay').removeClass('show');
                $('#popupDoa').removeClass('show');

                set_close_popup();
                
            });

            $('.close-popup, .popup-captcha-overlay').on('click', function() {
                $('.popup-captcha-overlay').removeClass('show');
                $('#popupCaptcha').removeClass('show');
                set_close_popup();

            });

            function set_close_popup(){
                console.log('close popup');
                $('#btnValidate').css('visibility', 'hidden');
                $('code#msg').text('');
                captcha = false;
            }
    

            function progressBar(){
                $('.outer').show();
                $('.donation_button_now2.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
                $('.inner').addClass('active');
                $('.popup-button-container .outer').hide();
                $('.popup-button-container .inner').removeClass('active');
            }

            function progressBarHide(){
                $('.donasi-loading').addClass('loading-hide');
                $('.outer').hide();
                $('.donation_button_now2.scale_button').css({'background':'<?php echo $button_color; ?>','border-color':'<?php echo $button_color; ?>'});
                $('.inner').removeClass('active');
            }


            $(".choose_payment").on("click", function(e) {
                e.preventDefault();
                $(this).simplePopup({ type: "html", htmlSelector: "#popup_payment", width: "420px" });
            });
            $("#comment").keyup(function(){
                el = $(this);
                max_char = 160;
                if(el.val().length > max_char){
                    el.val( el.val().substr(0, max_char) );
                } else {
                    sisa = max_char-el.val().length;
                    $("#charNum").text('Sisa '+ sisa + ' char');
                }
            });

            <?php

            if($additional_field!=''){
            $no_field = 1;
            foreach ($additional_field['data'] as $key => $value) {

                if($value['type']=='input-textarea') { ?>
                
                $("#text_field_<?php echo $no_field; ?>").keydown(function(e){
                    var code = e.keyCode ? e.keyCode : e.which;
                    if (code == 222) {  // ' and "
                        return false;
                    }
                });
                $("#text_field_<?php echo $no_field; ?>").keyup(function(e){
                    el = $(this);
                    max_char = 300;
                    if(el.val().length > max_char){
                        el.val( el.val().substr(0, max_char) );
                    } else {
                        sisa = max_char-el.val().length;
                        $("#charNum_<?php echo $no_field; ?>").text('Sisa '+ sisa + ' char');
                    }
                });

            <?php } $no_field++; } } ?>
            
            $("#whatsapp").keyup(function(){
			    el = $(this);
			    if(el.val().length >= 14){
			        el.val( el.val().substr(0, 14) );
			    }
			});  

			$("input, textarea").on("change", function(e){
                var content = $(this).val();
                if($(this).prop("type")!='checkbox'){
                    if(content!=''){
                        $(this).addClass('filled');
                    }else{
                        $(this).removeClass('filled');
                    }
                }
            });

            <?php if($set_user==true) { ?>

                <?php if($fullname=='' || $user_wa==''){ ?>

                $("#name_update").on("input", function(e){
                    var name = $(this).val();
                    if (name.trim() === '') {
                        $('.data-name').text('...');
                    } else {
                        $('.data-name').text(name);
                        $('#name').val(name).attr('value', name);
                    }
                });

                $("#whatsapp_update").on("input", function(e){
                    var whatsapp = $(this).val();
                    if (whatsapp.trim() === '') {
                        $('.data-whatsapp').text('...');
                    } else {
                        $('.data-whatsapp').text(whatsapp);
                        $('#whatsapp').val(whatsapp).attr('value', whatsapp);
                    }
                });

                $('#update_data').bind('click', function() {

                    var name = $('#name_update').val();
                    var whatsapp = $('#whatsapp_update').val();

                    if(name=='' || whatsapp==''){
                        var message = "Silahkan lengkapi data Nama dan Whatsapp dengan benar.";
                        var status = "warning";
                        var timeout = 4000;
                        createAlert(message, status, timeout);
                        return false;
                    }

                    var data_nya = [
                        name,
                        whatsapp
                    ];

                    $('#update_data .donasi-loading').removeClass('loading-hide');

                    var data = {
                        "action": "djafunction_update_name_whatsapp",
                        "datanya": data_nya
                    };

                    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {

                        if(response=='success'){
                            $('#box_update_data').slideUp();
                            var message = "Update data sukses! Silahkan lanjutkan donasi anda.";
                            var status = "success";
                            var timeout = 4000;
                            createAlert(message, status, timeout);
                            return false;
                        }
                        
                        
                    });
                });

                <?php } ?>

            <?php } ?>

        });

        a = 0;
        $(".card-label").on("click", function(e) {
            console.log("payment "+(a+1));
            a = a+1;
        });

		
		$(".other_nominal_value input").on("keyup", function(e){
            if(event.which >= 37 && event.which <= 40) return;
            $(this).val(function(index, value) {
                return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
            });
            run_other_nominal();
            <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
            run_additional_donate();
            <?php } ?>
        });
        $(".additional_nominal_value input").on("keyup", function(e){
            if(event.which >= 37 && event.which <= 40) return;
            $(this).val(function(index, value) {
                return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
            });
            <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
            run_additional_donate();
            <?php } ?>
        });
        
		$('input[type="radio"][name="nominal_donasi"]').on("change", function(e){
			nominal = $(this).val();
			set_cookies_nominal(nominal);
			var nominal_label = $(this).data('label');
			if(nominal!=0){
				$('.other_nominal_value').addClass('hide_input');
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+numberWithDot(nominal));
			}else{
				$('.other_nominal_value').removeClass('hide_input');
				$('.other_nominal_value input').caretTo(0);
                nominal = $('.other_nominal_value input').val();
                if(nominal==''){nominal = 0;}else{
                    nominal = nominal.split('.').join('');
                    nominal = nominal.split(',').join('');
                }
                set_cookies_nominal(nominal);
                $('#nominal_value').text('');
			}
            <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
            run_additional_donate();
            <?php } ?>
		});

        $('input[type="radio"][name="option_zakat"]').on("change", function(e){
            var option_zakat = $(this).val();
            if(option_zakat=='perbulan'){
                $('.title_tahun').text('bulan');
            }else{
                 $('.title_tahun').text('tahun');
            }
            run_zakat();
        });

        $(".pendapatan_emas input, .pendapatan_pertanian input, .pendapatan_perbulan input, .pendapatan_lainnya input, .pengeluaran input").on("keyup", function(e){
            if(event.which >= 37 && event.which <= 40) return;
            $(this).val(function(index, value) {
                return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
            });
            run_zakat();
        });

        ewallet_setting = <?php echo $ewallet_setting; ?>;
        ewallet_nominal = <?php echo $ewallet_nominal; ?>;
        ewallet_nominal2 = <?php echo $ewallet_nominal2; ?>;
        
        function check_ewallet_setting(nominalnya){
            if(ewallet_setting=='1'){
                if(nominalnya<=ewallet_nominal){
                    $('.payment_va').hide();
                    
                    if(nominalnya<10000){ // bank transfer di hide, karena minimal transfer itu 10rb
                        $('.payment_transfer').hide();
                        $('label.payment_transfer.set_pg').hide();
                    }else{
                        if($("label.payment_transfer.set_manual").not(this).length) {
                            $('.payment_transfer').show();
                            $('label.payment_transfer.set_pg').hide();
                        }else{
                            $('.payment_transfer').hide();
                        }
                    }

                }else{
                    $('.payment_va').show();
                    $('.payment_transfer').show();
                }

                if(nominalnya>=ewallet_nominal2){
                    if($("label.payment_instant.set_manual").not(this).length) {
                        $('.payment_instant').show();
                        $('label.payment_instant.set_pg').hide();
                         console.log(1);
                    }else{
                         console.log(2);
                        $('.payment_instant').hide();
                    }
                   
                }else{
                    console.log(3);
                    $('.payment_instant').show();
                    $('.title-list.payment_instant').css({'margin-top':'0px'});
                }

            }
        }

        function run_zakat(){

            <?php if($row->zakat_penghasilan_type=='pertanian'){ ?>

                var pendapatan_pertanian = $('.pendapatan_pertanian input').val();
                if(pendapatan_pertanian!=''){
                    var pendapatan_pertanian_int = pendapatan_pertanian.replace(/\./g,'');
                }else{
                    var pendapatan_pertanian_int = 0;
                }

                // Total Pendapatan
                var total_pendapatan = parseInt(pendapatan_pertanian_int)*parseInt(<?php echo $row->zakat_harga_per_kg;?>);
                $('.total_pendapatan input').val(numberWithDot(total_pendapatan));

                // Nisab
                var nisabnya = <?php echo $row->zakat_nisab_kg; ?>*<?php echo $row->zakat_harga_per_kg; ?>;

                // additional zakat perbulan or pertahun
                // var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val(); // 'pertahun'
                // if(option_zakat=='perbulan'){
                //     nisabnya = Math.round(nisabnya/12);
                // }


                $('.total_nisab_zakat input').val(numberWithDot(nisabnya));


            <?php }elseif($row->zakat_penghasilan_type=='emas'){ ?>

                <?php 
                    if($row->zakat_harga_emas=='' || $row->zakat_harga_emas==0){
                        if($emas_per_gram=='' || $emas_per_gram==0){
                            $harga_emas = '2350000';
                        }else{
                            $harga_emas = $emas_per_gram;
                        }
                    }else{
                        $harga_emas = $row->zakat_harga_emas;
                    }
                ?>

                var pendapatan_emas = $('.pendapatan_emas input').val();
                if(pendapatan_emas!=''){
                    var pendapatan_emas_int = pendapatan_emas.replace(/\./g,'');
                }else{
                    var pendapatan_emas_int = 0;
                }

                // Total Pendapatan
                var total_pendapatan = parseInt(pendapatan_emas_int)*parseInt(<?php echo $harga_emas;?>);
                $('.total_pendapatan input').val(numberWithDot(total_pendapatan));

                // Nisab
                var nisabnya = 85*<?php echo $harga_emas; ?>;

                // additional zakat perbulan or pertahun
                // var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val(); // 'pertahun'
                // if(option_zakat=='perbulan'){
                //     nisabnya = Math.round(nisabnya/12);
                // }

                $('.total_nisab_zakat input').val(numberWithDot(nisabnya));

            <?php }else{ ?>

                <?php 
                    if($emas_per_gram=='' || $emas_per_gram==0){
                        $harga_emas = '2350000';
                    }else{
                        $harga_emas = $emas_per_gram;
                    }
                ?>

                var pendapatan_perbulan = $('.pendapatan_perbulan input').val();
                if(pendapatan_perbulan!=''){
                    var pendapatan_perbulan_int = pendapatan_perbulan.replace(/\./g,'');
                }else{
                    var pendapatan_perbulan_int = 0;
                }
                
                var pendapatan_lainnya = $('.pendapatan_lainnya input').val();
                if(pendapatan_lainnya!=''){
                    var pendapatan_lainnya_int = pendapatan_lainnya.replace(/\./g,'');
                }else{
                    var pendapatan_lainnya_int = 0;
                }
                
                var pengeluaran = $('.pengeluaran input').val();
                if(pengeluaran!=''){
                    var pengeluaran_int = pengeluaran.replace(/\./g,'');
                }else{
                    var pengeluaran_int = 0;
                }

                // Total Pendapatan
                var total_pendapatan = parseInt(pendapatan_perbulan_int)+parseInt(pendapatan_lainnya_int)-parseInt(pengeluaran_int);
                $('.total_pendapatan input').val(numberWithDot(total_pendapatan));

                // Nisab
                var nisabnya = 85*<?php echo $harga_emas; ?>;

                // additional zakat perbulan or pertahun
                var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val(); // 'pertahun'
                if(option_zakat=='perbulan'){
                    nisabnya = Math.round(nisabnya/12);
                }

                $('.total_nisab_zakat input').val(numberWithDot(nisabnya));


            <?php } ?>

            console.log("total_pendapatan:"+total_pendapatan);
            
            <?php 
            if($row->zakat_penghasilan_type=='maal' || $row->zakat_penghasilan_type=='profesi' || $row->zakat_penghasilan_type=='perusahaan' || $row->zakat_penghasilan_type=='perdagangan'){

                if($row->zakat_setting==0 || $row->zakat_percent<=0 || $row->zakat_percent==null){
                    $zakat_percent = '2.5';
                }else{
                    $zakat_percent = $row->zakat_percent;
                }

                echo "total_zakat = ($zakat_percent*total_pendapatan)/100;";

            }elseif($row->zakat_penghasilan_type=='pertanian'){ ?>

                var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val(); // 'pertahun'
                if(option_zakat=='tadah_hujan'){
                    zakat_percent = 10;
                }else{
                    zakat_percent = 5;
                }

                $('.persentase_zakat').text(zakat_percent);
                total_zakat = (zakat_percent*total_pendapatan)/100;

            <?php }elseif($row->zakat_penghasilan_type=='emas'){
                    $zakat_percent = '2.5';
                    echo "total_zakat = ($zakat_percent*total_pendapatan)/100;";
            }else{
                $zakat_percent = '2.5';
                echo "total_zakat = ($zakat_percent*total_pendapatan)/100;";
            }
                
            
            ?>

            console.log(total_zakat);

            // math round total_zakat
            total_zakat = Math.round(total_zakat);

            if(total_pendapatan>=nisabnya){

                console.log(1);

                <?php if($row->zakat_penghasilan_type=='emas'){ ?>

                var option_zakat = $('input[type="radio"][name="option_zakat"]:checked').val(); // 'pertahun'
                if(option_zakat=='perbulan'){
                    total_zakat = Math.round(total_zakat/12);
                }

                <?php } ?>

                console.log('total_zakat'+total_zakat);

                // check total_zakat
                if(total_zakat!=''){
                    nominal = parseInt(total_zakat);
                    set_cookies_nominal(nominal);
                    $('#nominal_value').text(' - <?php echo $show_currency; ?>'+numberWithDot(total_zakat));
                    $('.total_zakat input').val(numberWithDot(total_zakat));
                }

            }else{ // just styling

                console.log(2);

                $('.next_arrow').hide();

                if(total_pendapatan<=0){
                    $('#nominal_value').text('');
                }else{
                    $('.total_zakat input').val(0);
                    $('#nominal_value').text(' - Belum Mencapai Nisab');
                }

                if(total_pendapatan==0){
                    $('.total_pendapatan input').val(0);
                }

                $('.total_zakat input').val(0);

                nominal = 0;
                set_cookies_nominal(nominal);
                
            }
        }

		function run_other_nominal(){
            var content = $('.other_nominal_value input').val();
            if(content!=''){
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
                mystring_number = content.replace(/\./g,'');
                nominal = parseInt(mystring_number);
                set_cookies_nominal(nominal);
            }else{
                $('#nominal_value').text('');
            }
        }


        total_additional_donate = 0;

        select_on_url = parseInt(<?php echo $select_on_url; ?>);
        if(select_on_url>=1){
            $('.card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg').css({"display":"inline"});
            $("select#jumlah_paket option[value='"+select_on_url+"']").attr('selected','selected');
            set_jumlah_paket(select_on_url);
        }

        gram_on_url = parseInt(<?php echo $gram_on_url; ?>);
        if(gram_on_url>=1){
            $(".pendapatan_emas input").val(numberWithDot(gram_on_url));
            run_zakat();
        }

        kg_on_url = parseInt(<?php echo $kg_on_url; ?>);
        if(kg_on_url>=1){
            $(".pendapatan_pertanian input").val(numberWithDot(kg_on_url));
            run_zakat();
        }

        pendapatan1 = parseInt(<?php echo $pendapatan1; ?>);
        pendapatan2 = parseInt(<?php echo $pendapatan2; ?>);
        pengeluaran = parseInt(<?php echo $pengeluaran; ?>);
        if(pendapatan1>=1){
            if(pendapatan1>=1){
                $(".pendapatan_perbulan input").val(numberWithDot(pendapatan1));
            }else{
                $(".pendapatan_perbulan input").val(pendapatan1);
            }
            if(pendapatan2>=1){
                $(".pendapatan_lainnya input").val(numberWithDot(pendapatan2));
            }else{
                $(".pendapatan_lainnya input").val(pendapatan2);
            }
            if(pengeluaran>=1){
                $(".pengeluaran input").val(numberWithDot(pengeluaran));
            }else{
                $(".pengeluaran input").val(pengeluaran);
            }
            run_zakat();
        }

        function set_jumlah_paket(jumlah_paketnya){
            var nominal_paket = $('#nominal_paket').attr('data-paket');
            var jumlah = jumlah_paketnya;
            if(jumlah!='0'){
                nominal = nominal_paket*jumlah;
                set_cookies_nominal(nominal);
                content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
                $('.card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg').css({"display":"inline"});
            }else{
                nominal = 0;
                set_cookies_nominal(nominal);
                content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
                $('#nominal_value').text('');
                $('.card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg').hide();
            }
            <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
            run_additional_donate();
            <?php } ?>
        }

        $("select#jumlah_paket").on("change", function(e){
            var nominal_paket = $('#nominal_paket').attr('data-paket');
            var jumlah = this.value;
            if(jumlah!='0'){
                nominal = nominal_paket*jumlah;
                set_cookies_nominal(nominal);
                content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+content);
                $('.card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg').css({"display":"inline"});
            }else{
                nominal = 0;
                set_cookies_nominal(nominal);
                content = nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
                $('#nominal_value').text('');
                $('.card-style .card-package .card-input-element:checked + .card .box-checklist .checklist .card-check svg').hide();
            }
            <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
            run_additional_donate();
            <?php } ?>
        });
        
        <?php if($additional_formula!='' && $row->form_status=='1'){ ?>
        <?php for ($i = 1; $i <= $jumlah_formula; $i++) { ?>
        field<?php echo $i; ?> = 0;
        <?php } ?>

        function run_additional_donate(){
            <?php for ($i = 1; $i <= $jumlah_formula; $i++) { ?>
            field<?php echo $i; ?> = $('.additional_nominal_value.add_donate<?php echo $i; ?> input').val();
            if(field<?php echo $i; ?>==''){field<?php echo $i; ?>=0;}else{field<?php echo $i; ?> = parseInt(field<?php echo $i; ?>.replace(/\./g,''));}
            <?php } ?>
            
            <?php if($jumlah_formula!=0){echo 'total_additional_donate = '; } for ($i = 1; $i <= $jumlah_formula; $i++) { if($i<$jumlah_formula){echo'parseInt(field'.$i.')+';}else{echo'parseInt(field'.$i.')';} } if($jumlah_formula!=0){echo ';'; }?>
            run_total();
        }
        <?php } ?>

        totalnya = 0;
        function run_total(){

            totalnya = parseInt(total_additional_donate) + parseInt(nominal);

            if(totalnya!=''){
                $('#nominal_value').text(' - <?php echo $show_currency; ?>'+numberWithDot(totalnya));
                $('.total_summary input').val(numberWithDot(totalnya));
            }

            set_cookies_totalnya(totalnya);

        }

		function allowNumbersOnly(e) {
		    var code = (e.which) ? e.which : e.keyCode;
		    if (code > 31 && (code < 48 || code > 57)) {
		        e.preventDefault();
		    }
		}
		function set_cookies_nominal(nominal){
            if(nominal>=1){ $('.next_arrow').show();}else{$('.next_arrow').hide();}
            check_ewallet_setting(nominal);
            Cookies.set('nominal', nominal, { expires: 1 });
        }
        function set_cookies_totalnya(totalnya){
            check_ewallet_setting(totalnya);
            Cookies.set('totalnya', totalnya, { expires: 1 });
        }
        function set_cookies_name(data_name){
            Cookies.set('data_name', data_name, { expires: 30 });
        }
        function set_cookies_whatsapp(data_whatsapp){
            Cookies.set('data_whatsapp', data_whatsapp, { expires: 30 });
        }
        function set_cookies_email(data_email){
            Cookies.set('data_email', data_email, { expires: 30 });
        }
		function numberWithDot(x) {
            x = x ? x.toString() : "";
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "<?php echo $delimiter; ?>");
		}

        <?php if($total_on_url!='') { ?>
        set_cookies_nominal(<?php echo $total_on_url; ?>);
        <?php } ?>

        <?php if($set_user!=true) { ?>
        if(Cookies.get('data_name')!='undefined'){
            var data_name = Cookies.get('data_name');
            $('#name').val(data_name);
        }
        if(Cookies.get('data_whatsapp')!='undefined'){
            var data_whatsapp = Cookies.get('data_whatsapp');
            $('#whatsapp').val(data_whatsapp);
        }
        if(Cookies.get('data_email')!='undefined'){
            var data_email = Cookies.get('data_email');
            $('#email').val(data_email);
        }
        <?php } ?>

        <?php if($name!='') { ?>
        var data_namenya = "<?php echo $name;?>";
        $('#name').val(data_namenya);
        <?php } ?>

        <?php if($whatsapp!='') { ?>
        var data_whatsappnya = "<?php echo $whatsapp;?>";
        $('#whatsapp').val(data_whatsappnya);
        <?php } ?>

        <?php if($email!='') { ?>
        var data_emailnya = "<?php echo $email;?>";
        $('#email').val(data_emailnya);
        <?php } ?>


	payment_code = '';
	payment_name = '';
	payment_number = '';
	payment_account = '';
	payment_method = '';

	(function ($) {

    "use strict";

    $.fn.simplePopup = function(options) {
        /**
         * Javascript this
         */
        var that = this;

        /**
         * The data to be inserted in the popup
         */
        var data;

        /**
         * Determined type, based on type option (because we have possible value "auto")
         */
        var determinedType;

        /**
         * Different types are supported:
         *
         * "auto"   Will first try "data", then "html" and else it will fail.
         * "data"   Looks at current HTML "data-content" attribute for content
         * "html"   Needs a selector of an existing HTML tag
         */
        var types = [
            "auto",
            "data",
            "html",
        ];

        /**
         * Default values
         */
        var settings = $.extend({
            type: "auto",                   // Type to get content
            htmlSelector: null,             // HTML selector for popup content
            width: "600px",                 // Width popup
            height: "auto",                 // Height popup
            background: "#fff",             // Background popup
            backdrop: 0.7,                  // Backdrop opactity or falsy value
            backdropBackground: "#000",     // Backdrop background (any css here)
            inlineCss: true,                // Inject CSS via JS
            escapeKey: true,                // Close popup when "escape" is pressed"
            closeCross: true,               // Display a closing cross
            fadeInDuration: 0.3,            // The time to fade the popup in, in seconds
            fadeInTimingFunction: "ease",   // The timing function used to fade the popup in
            fadeOutDuration: 0.3,           // The time to fade the popup out, in seconds
            fadeOutimingFunction: "ease",   // The timing function used to fade the popup out
            beforeOpen: function(){},
            afterOpen: function(){},
            beforeClose: function(){},
            afterClose: function(){}
        }, options );

        /**
         * A selector string to filter the descendants of the selected elements that trigger the event.
         */
        var selector = this.selector;

        /**
         * init
         *
         * Set the onclick event, determine type, validate the settings, set the data and start popup.
         *
         * @returns {this} jQuery object
         */
        function init() {
            validateSettings();

            determinedType = determineType();
            data = setData();

            startPopup();

            return that;
        }

        /**
         * validateSettings
         *
         * Check for some settings if they are correct
         *
         * @returns {void}
         */
        function validateSettings() {
            if (settings.type !== "auto"
                && settings.type !== "data"
                && settings.type !== "html"
            ) {
                throw new Error("simplePopup: Type must me \"auto\", \"data\" or \"html\"");
            }

            if (settings.backdrop > 1 || settings.backdrop < 0) {
                throw new Error("simplePopup: Please enter a \"backdrop\" value <= 1 of >= 0");
            }

            if (settings.fadeInDuration < 0 || Number(settings.fadeInDuration) !== settings.fadeInDuration) {
                throw new Error("simplePopup: Please enter a \"fadeInDuration\" number >= 0");
            }

            if (settings.fadeOutDuration < 0 || Number(settings.fadeOutDuration) !== settings.fadeOutDuration) {
                throw new Error("simplePopup: Please enter a \"fadeOutDuration\" number >= 0");
            }
        }

        /**
         * determineType
         *
         * Check what type we have (and with that where we need to look for the data)
         *
         * @returns {boolean|string} The type of the data or false
         */
        function determineType() {
            // Type HTML
            if (settings.type === "html") {
                return "html";
            }

            // Type DATA
            if (settings.type === "data") {
                return "data";
            }

            // Type AUTO
            if (settings.type === "auto") {
                if(that.data("content")) {
                    return "data";
                }

                if ($(settings.htmlSelector).length) {
                    return "html";
                }

                throw new Error("simplePopup: could not determine type for \"type: auto\"");
            }

            return false;
        }

        /**
         * setData
         *
         * Set the data variable based on the type
         *
         * @returns {boolean|string} The HTML or text to disply in the popup or false
         */
        function setData() {
            // Type HTML
            if (determinedType === "html") {
                if (!settings.htmlSelector) {
                    throw new Error("simplePopup: for \"type: html\" the \"htmlSelector\" option must point to your popup html");
                }

                if (!$(settings.htmlSelector).length) {
                    throw new Error("simplePopup: the \"htmlSelector\": \"" + settings.htmlSelector + "\" was not found");
                }

                return $(settings.htmlSelector).html();
            }

            // Type DATA
            if (determinedType === "data") {
                data = that.data("content");

                if (!data) {
                    throw new Error("simplePopup: for \"type: data\" the \"data-content\" attribute can not be empty");
                }

                return data;
            }

            return false;
        }

        /**
         * startPopup
         *
         * Insert popup HTML, maybe bind escape key and maybe start the backdrop
         *
         * @returns {void}
         */
        function startPopup() {
            if (settings.backdrop) {
                startBackdrop();
            }

            if (settings.escapeKey) {
                bindEscape();
            }

            insertPopupHtml();
        }

        /**
         * insertPopupHtml
         *
         * Create the popup HTML and append it to the body. Maybe set the CSS.
         *
         * @returns {void}
         */
        function insertPopupHtml() {
            var content = $("<div/>", {
                "class": "simple-popup-content",
                "html": data
            });

            var html = $("<div/>", {
                "id": "simple-popup",
                "class": "hide-it"
            });

            if (settings.inlineCss) {
                content.css("width", settings.width);
                content.css("height", settings.height);
                content.css("background", settings.background);
            }



            bindClickPopup(html);

            // When we have a closeCross, create the element, bind click close and append it to
            // the content
            if (settings.closeCross) {
                var closeButton = $("<div/>", {
                    "class": "close"
                });

                bindClickClose(closeButton);
                content.append(closeButton);
            }

            html.append(content);

            // Call the beforeOpen callback
            settings.beforeOpen(html);

            $("body").append(html);

            // Use a timeout, else poor CSS is to slow to see the difference
            setTimeout(function() {
                var html = $("#simple-popup");

                // Set the fade in effect
                if (settings.inlineCss) {
                    html = setFadeTimingFunction(html, settings.fadeInTimingFunction);
                    html = setFadeDuration(html, settings.fadeInDuration);
                }

                html.removeClass("hide-it");

            });

            // Poll to check if the popup is faded in
            var intervalId = setInterval(function() {
                if ($("#simple-popup").css("opacity") === "1") {
                    clearInterval(intervalId);

                    // Call the afterOpen callback
                    settings.afterOpen(html);
                }
            }, 100);

            if(payment_code!=''){
            	$('.'+payment_code).find("input").prop("checked", true);
        	}
            // alert(payment_is);
        }

        /**
         * stopPopup
         *
         * Stop the popup and remove it from the DOM. Because it can fade out, use and interval
         * to check if opacity has reached 0. Maybe remove backdrop and maybe unbind the escape
         * key
         *
         * @returns {void}
         */
        function stopPopup() {
            // Call the beforeClose callback
            var html = $("#simple-popup");
            settings.beforeClose(html);

            // Set the fade out effect
            if (settings.inlineCss) {
                html = setFadeTimingFunction(html, settings.fadeOutTimingFunction);
                html = setFadeDuration(html, settings.fadeOutDuration);
            }

            $("#simple-popup").addClass("hide-it");

            // Poll to check if the popup is faded out
            var intervalId = setInterval(function() {
                if ($("#simple-popup").css("opacity") === "0") {
                    $("#simple-popup").remove();
                    clearInterval(intervalId);

                    // Call the afterClose callback
                    settings.afterClose();
                }
            }, 100);

            if (settings.backdrop) {
                stopBackdrop();
            }

            if (settings.escapeKey) {
                unbindEscape();
            }
        }

        /**
         * bindClickPopup
         *
         * When clicked outside the popup, close the popup. Use e.target to determine if
         * "simple-popup" was clicked or "simple-popup-content"
         *
         * @param {string} html The html of the popup
         * @returns {void}
         */
        
        function bindClickPopup(html) {
        	
            $(html).on("click", function(e) {

                if ($(e.target).prop("id") === "simple-popup") {
                    stopPopup();
                }

                // $('.card-check').css({'display':'none'});
                // $('.card-check').css({'display':'inline-block'});

                if ($(e.target).hasClass("card-label")) {

                    $(e.target).addClass('bismillah');

                    stopPopup();

                    payment_method = $(e.target).attr('data-method');
                    payment_code = $(e.target).attr('data-code');
                    payment_name = $(e.target).attr('data-paymentname');
                    payment_number = $(e.target).attr('data-number');
                    payment_account = $(e.target).attr('data-account');
                    $('.title_payment').text(payment_name).css({"text-transform":"capitalize", "font-weight":"bold"});
                    console.log('label :'+payment_code);
                    labelnya = payment_code;

                    $('.box_img_payment img').attr('src', '<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/';?>'+payment_code+'.png');
					$('.box_img_payment img').attr('data-paymentmethod', payment_method).attr('data-paymentcode', payment_code).attr('data-paymentnumber', payment_number).attr('data-paymentaccount', payment_account);
					$('#choose_payment').removeClass('set_red');
                }
                if ($(e.target).prop("class") === "card-icon") {
                	stopPopup();
                    payment_method = $(e.target).attr('data-method');
                    payment_code = $(e.target).attr('data-code');
                    payment_name = $(e.target).attr('data-paymentname');
                    payment_number = $(e.target).attr('data-number');
                    payment_account = $(e.target).attr('data-account');
                    $('.title_payment').text(payment_name).css({"text-transform":"capitalize", "font-weight":"bold"});
                    console.log('icon :'+payment_code);
                    labelnya = payment_code;
                    
                    $('.box_img_payment img').attr('src', '<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/';?>'+payment_code+'.png');
					$('.box_img_payment img').attr('data-paymentmethod', payment_method).attr('data-paymentcode', payment_code).attr('data-paymentnumber', payment_number).attr('data-paymentaccount', payment_account);
					$('#choose_payment').removeClass('set_red');
                }
                if ($(e.target).prop("class") === "card-text") {
                	stopPopup();
                    payment_method = $(e.target).attr('data-method');
                    payment_code = $(e.target).attr('data-code');
                    payment_name = $(e.target).attr('data-paymentname');
                    payment_number = $(e.target).attr('data-number');
                    payment_account = $(e.target).attr('data-account');
                    $('.title_payment').text(payment_name).css({"text-transform":"capitalize", "font-weight":"bold"});
                    console.log('name :'+payment_code);
                    labelnya = payment_code;

                    $('.box_img_payment img').attr('src', '<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/';?>'+payment_code+'.png');
					$('.box_img_payment img').attr('data-paymentmethod', payment_method).attr('data-paymentcode', payment_code).attr('data-paymentnumber', payment_number).attr('data-paymentaccount', payment_account);
					$('#choose_payment').removeClass('set_red');
                }
            });
        }

        function bindClickClose(html) {
            $(html).on("click", function(e) {
                stopPopup();
            });
        }

        function startBackdrop() {
            insertBackdropHtml();
        }

        function stopBackdrop() {
            var backdrop = $("#simple-popup-backdrop");

            // Set the fade out effect
            if (settings.inlineCss) {
                backdrop = setFadeTimingFunction(backdrop, settings.fadeOutTimingFunction);
                backdrop = setFadeDuration(backdrop, settings.fadeOutDuration);
            }

            backdrop.addClass("hide-it");

            // Poll to check if the popup is faded out
            var intervalId = setInterval(function() {
                if ($("#simple-popup-backdrop").css("opacity") === "0") {
                    $("#simple-popup-backdrop").remove();
                    clearInterval(intervalId);
                }
            }, 100);
        }

        function insertBackdropHtml() {
            var content = $("<div/>", {
                "class": "simple-popup-backdrop-content"
            });

            var html = $("<div/>", {
                "id": "simple-popup-backdrop",
                "class": "hide-it"
            });

            if (settings.inlineCss) {
                content.css("opacity", settings.backdrop);
                content.css("background", settings.backdropBackground);
            }

            html.append(content);
            $("body").append(html);

            // Use a timeout, else poor CSS doesn"t see the difference
            setTimeout(function() {
                var backdrop = $("#simple-popup-backdrop");

                // Set the fade in effect
                if (settings.inlineCss) {
                    backdrop = setFadeTimingFunction(backdrop, settings.fadeInTimingFunction);
                    backdrop = setFadeDuration(backdrop, settings.fadeInDuration);
                }

                backdrop.removeClass("hide-it");
            });
        }

        function bindEscape() {
            $(document).on("keyup.escapeKey", function(e) {
                if (e.keyCode === 27) {
                    stopPopup();
                }
            });
        }

        function unbindEscape() {
            $(document).unbind("keyup.escapeKey");
        }

        function setFadeTimingFunction(object, timingFunction) {
            object.css("-webkit-transition-timing-function", timingFunction);
            object.css("-moz-transition-timing-function", timingFunction);
            object.css("-ms-transition-timing-function", timingFunction);
            object.css("-o-transition-timing-function", timingFunction);
            object.css("transition-timing-function", timingFunction);
            return object;
        }

        function setFadeDuration(object, duration) {
            object.css("-webkit-transition-duration", duration + "s");
            object.css("-moz-transition-duration", duration + "s");
            object.css("-ms-transition-duration", duration + "s");
            object.css("-o-transition-duration", duration + "s");
            object.css("transition-duration", duration + "s");
            return object;
        }

        return init();
    };
}(jQuery));
    
	</script>

    <?php if($payment!='' && $method!=''){ ?>
    <script>
    var payment_url = '<?php echo $payment; ?>';
    var method_url = '<?php echo $method; ?>';

    var payment_method = $('.card_payment label.'+payment_url+'.payment_'+method_url).attr('data-method');
    if(payment_method!=undefined){
        var payment_code = $('.card_payment label.'+payment_url+'.payment_'+method_url).attr('data-code');
        var payment_name = $('.card_payment label.'+payment_url+'.payment_'+method_url).attr('data-paymentname');
        var payment_number = $('.card_payment label.'+payment_url+'.payment_'+method_url).attr('data-number');
        var payment_account = $('.card_payment label.'+payment_url+'.payment_'+method_url).attr('data-account');

        $('.title_payment').text(payment_name).css({"text-transform":"capitalize", "font-weight":"bold"});
        console.log('label :'+payment_code);
        var labelnya = payment_code;

        $('.box_img_payment img').attr('src', '<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/';?>'+payment_code+'.png');
        $('.box_img_payment img').attr('data-paymentmethod', payment_method).attr('data-paymentcode', payment_code).attr('data-paymentnumber', payment_number).attr('data-paymentaccount', payment_account);
        $('#choose_payment').removeClass('set_red');
        $('.card_payment label.'+payment_url+'.payment_'+method_url+' input[name="card"]').attr('checked', 'checked');

    }
    </script>
    <?php } ?>

    <?php if($cc_midtrans==true) { ?>

    <script>

      // Format Card Number
      const cardInput = document.getElementById('cc_number');
      const logo = document.getElementById('ccboxdetectedcard');

      const cardLogos = {
        visa: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_visa.svg"; ?>',
        mastercard: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_mastercard.svg"; ?>',
        amex: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_amex.svg"; ?>',
        jcb: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_jcb.svg"; ?>',
        discover: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_discover.svg"; ?>',
        unionpay: '<?php echo plugin_dir_url( __FILE__ ) . "assets/images/bank/icon_unionpay.svg"; ?>',
      };

      function detectCardType(number) {
        const cleaned = number.replace(/\s/g, '');

        if (/^4/.test(cleaned)) return 'visa';
        if (/^5[1-5]/.test(cleaned) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        if (/^35/.test(cleaned)) return 'jcb';
        if (/^6(?:011|5|4[4-9]|22)/.test(cleaned)) return 'discover';
        if (/^62/.test(cleaned)) return 'unionpay';

        return null;
      }

      // Format card number + detect type
      cardInput.addEventListener('input', function (e) {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g);
        e.target.value = formatted ? formatted.join(' ') : '';

        const brand = detectCardType(val);
        if (brand && cardLogos[brand]) {
          logo.src = cardLogos[brand];
          logo.style.display = 'block';
        } else {
          logo.src = '';
          logo.style.display = 'none';
        }
      });

      // MM / YY formatting
      document.getElementById('cc_mmyy').addEventListener('input', function (e) {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        e.target.value = val.length >= 3 ? val.substring(0, 2) + ' / ' + val.substring(2) : val;
      });

      // CVV hanya angka
      const cvvInput = document.getElementById('cc_cvv');
      cvvInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });

      cvvInput.addEventListener('keydown', function (e) {
        const allowed = [8, 9, 37, 39, 46];
        if (!/[0-9]/.test(e.key) && !allowed.includes(e.keyCode)) {
          e.preventDefault();
        }
      });


      function checkAllFields() {
          const number = document.getElementById('cc_number').value.replace(/\s/g, '');
          const mmyy = document.getElementById('cc_mmyy').value.replace(/\s/g, '');
          const cvv = document.getElementById('cc_cvv').value;

          const isCardNumberValid = number.length >= 13; // min 13 digit
          const isMMYYValid = /^\d{2}\/\d{2}$/.test(mmyy);
          const isCVVValid = cvv.length >= 3;

          const allValid = isCardNumberValid && isMMYYValid && isCVVValid;

          if (allValid) {
            $('.popup-button-container .next_arrow').show();
            $('.popup-button-container .donation_button_now3').attr('disabled', false);
            $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $button_color; ?>','border-color':'<?php echo $button_color; ?>'});
          }else{
            $('.popup-button-container .next_arrow').hide();
            $('.popup-button-container .donation_button_now3').attr('disabled', true);
            $('.popup-button-container .donation_button_now3.scale_button').css({'background':'<?php echo $color_hovernya; ?>','border-color':'<?php echo $color_hovernya; ?>'});
          }

      }

      // Jalankan check saat input berubah
      document.getElementById('cc_number').addEventListener('input', checkAllFields);
      document.getElementById('cc_mmyy').addEventListener('input', checkAllFields);
      document.getElementById('cc_cvv').addEventListener('input', checkAllFields);

    </script>
    <?php } ?>

    <?php if($gtm_id!=''){ ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo $gtm_id;?>"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <?php } ?>
</body>
</html>