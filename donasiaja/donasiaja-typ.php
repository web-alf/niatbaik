<?php

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_users";
    $table_name2 = $wpdb->prefix . "dja_settings";
    $table_name3 = $wpdb->prefix . "dja_donate";
    $table_name4 = $wpdb->prefix . "dja_campaign";
    $table_name5 = $wpdb->prefix . "dja_payment_log";

    // Check IP User
    check_blocked_ip();

	$slug = $donasi_id;
	$campaign = $wpdb->get_results('SELECT * from '.$table_name4.' where slug="'.$slug.'"');
	if($campaign==null){
		wp_redirect( get_site_url() );
		exit;
	}

	// Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name2.' where type="logo_url" or type="app_name" or type="login_setting" or type="login_text" or type="register_setting" or type="register_text" or type="page_login" or type="page_register" or type="theme_color" or type="currency" or type="powered_by_setting" or type="fb_pixel" or type="fb_event" or type="gtm_id" or type="tiktok_pixel" or type="form_confirmation_setting" or type="flip_redirect" or type="metapixel_only" or type="metapixel_convertion" or type="metapixel_convertion_data" or type="flying_button_settings" or type="flying_button_bubble_text" or type="flying_button_message" or type="flying_button_number" or type="flying_button_page_settings"  or type="button_confirmation_setting" or type="button_confirmation_text" or type="button_confirmation_whatsapp" or type="button_confirmation_message" or type="button_confirmation_wa_settings" ORDER BY id ASC');
    $logo_url 		= $query_settings[0]->data;
    $app_name 		= $query_settings[1]->data;
    $login_setting 	= $query_settings[2]->data;
    $login_text 	= $query_settings[3]->data;
    $register_setting = $query_settings[4]->data;
    $register_text 	= $query_settings[5]->data;
    $page_login 	= $query_settings[6]->data;
    $page_register 	= $query_settings[7]->data;
    $general_theme_color = json_decode($query_settings[8]->data, true);
    $currency		= $query_settings[9]->data;
    $powered_by_setting = $query_settings[10]->data;
    $fb_pixel 	 		= $query_settings[11]->data;
    $fb_event  	 		= json_decode($query_settings[12]->data, true);
    $gtm_id             = $query_settings[13]->data;
    $tiktok_pixel       = $query_settings[14]->data;
    $form_confirmation_setting = $query_settings[15]->data;
    $flip_redirect 				= $query_settings[16]->data;
    $metapixel_only             = $query_settings[17]->data;
    $metapixel_convertion       = $query_settings[18]->data;
    $metapixel_convertion_data  = $query_settings[19]->data;
    $flying_button_settings        = $query_settings[20]->data;
    $flying_button_bubble_text     = $query_settings[21]->data;
    $flying_button_message         = $query_settings[22]->data;
    $flying_button_number          = $query_settings[23]->data;
    $flying_button_page_settings   = $query_settings[24]->data;
    $button_confirmation_setting   = $query_settings[25]->data ?? null;
    $button_confirmation_text      = $query_settings[26]->data ?? null;
    $button_confirmation_whatsapp  = $query_settings[27]->data ?? null;
    $button_confirmation_message   = $query_settings[28]->data ?? null;
    $button_confirmation_wa_settings   = $query_settings[29]->data ?? null;

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
        $page_campaign_button = null;
        $page_form_button     = null;
        $page_invoice_button  = null;
    }


    // FB EVENT
    $event_1   	 = $fb_event['event'][0];
    $event_2   	 = $fb_event['event'][1];
    $event_3   	 = $fb_event['event'][2];
    if(isset($fb_event['event'][3])){
        $event_4  = $fb_event['event'][3];
    }else{
        $event_4  = '';
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

	$home_url = get_site_url();
	if($link_code=='campaign'){
		$current_url = $home_url.'/campaign/'.$slug;
	}else{
		$current_url = $home_url.'/preview/'.$slug;
	}

	$donate = $wpdb->get_results('SELECT * from '.$table_name3.' where invoice_id="'.$invoice_id.'"');
	if($donate==null){
		wp_redirect( $current_url );
		exit;
	}

    // CS Button Konfirmasi
    $cs_id = $donate[0]->cs_id;
    $cs_wa_number = '';
    if($button_confirmation_wa_settings=='1'){
        if($cs_id>0){
            $data_cs = $wpdb->get_results('SELECT * from '.$table_name.' where user_id="'.$cs_id.'"');
            if($data_cs!=null){
                if($data_cs[0]->user_wa!=''){
                    $cs_wa_number = $data_cs[0]->user_wa;
                }else{
                    $cs_wa_number = '081';
                }
            }else{
                $cs_wa_number = '08';
            }
            $wa_csnya = $cs_wa_number;
        }else{
            $wa_csnya = $button_confirmation_whatsapp;
        }
    }else{
        $wa_csnya = $button_confirmation_whatsapp;
    }

	// Get DATA
	$total = $donate[0]->nominal;
	if($total>999){
		$total_depan = substr($total, 0, -3);
		$total_depan = number_format($total_depan,0,",",".");
	}else{
		$total_depan = '';
	}
	$total_belakang = substr($total, -3);
	$bank_code = $donate[0]->payment_code;
	$payment_account = $donate[0]->payment_account;
	$payment_number = $donate[0]->payment_number;
	$payment_qrcode = $donate[0]->payment_qrcode;
	$payment_date = $donate[0]->created_at;
	$sapaan = $donate[0]->sapaan;
    $donatur = $donate[0]->name;
	$img_confirmation_url = $donate[0]->img_confirmation_url;
	$payment_method = $donate[0]->payment_method;

	$title = $campaign[0]->title;
	if($campaign[0]->form_status=='1'){
        $form_text   = json_decode($campaign[0]->form_text, true);
        $text1 = $form_text['text'][0];
        $text2 = $form_text['text'][1];
        $text3 = $form_text['text'][2];
        $text4 = $form_text['text'][3];

        $donasi_text = $text2;
        if($campaign[0]->form_type=='5'){
	    	$donasi_text = 'Qurban';
	    }
        if($campaign[0]->form_type=='4' || $campaign[0]->form_type=='7'){
	    	$donasi_text = 'Zakat';
	    }
    }else{
    	$donasi_text = 'Donasi';
    }


    $general_status = $campaign[0]->general_status;
    $allocation_title = $campaign[0]->allocation_title;
    $allocation_others_title = $campaign[0]->allocation_others_title;
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


    // FB EVENT
    if($campaign[0]->pixel_status=='1'){
	    $fb_event  = json_decode($campaign[0]->fb_event, true);
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
    if($campaign[0]->pixel_status=='1' and $campaign[0]->metapixel_only=='1' ){
    	$fb_pixel  = $campaign[0]->fb_pixel;
    }

    if($campaign[0]->pixel_status=='1' and $campaign[0]->metapixel_only==null){
        if (!empty($row->fb_pixel)){
            $fb_pixel  = $row->fb_pixel;
        }
    }

    // meta pixel and convertion
    if($campaign[0]->pixel_status=='1' and $campaign[0]->metapixel_convertion=='1'){

        if($campaign[0]->metapixel_convertion_data!=''){
            $metapixel_convertion_data = json_decode($campaign[0]->metapixel_convertion_data, true);
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

    if($campaign[0]->gtm_status=='1'){
    	$gtm_id  = $campaign[0]->gtm_id;
    }
    if($campaign[0]->tiktok_status=='1'){
    	$tiktok_pixel  = $campaign[0]->tiktok_pixel;
    }

    $theme_color 		= $general_theme_color['color'][0];
	$progressbar_color  = $general_theme_color['color'][1];
	$button_color 		= $general_theme_color['color'][2];

	if($button_color==''){
		$button_color = '#dc2f6a';
	}

    $hex = $button_color;
	list($r, $g, $b) = sscanf($hex, "#%02x%02x%02x");
	$colornya = 'rgba('.$r.','.$g.','.$b.', 0.05)';
	$color_hovernya = 'rgba('.$r.','.$g.','.$b.', 0.15)';

	$id_login = wp_get_current_user()->ID;

	$data_field = array();
    $data_field[ '{payment_account}' ] = '<span style="color:'.$button_color.'">'.$payment_account.'</span>';
    $data_field[ '{payment_number}' ] = '<span style="color:'.$button_color.'">'.$payment_number.'</span>';
    $data_field[ '{nominal}' ] = '<span style="color:'.$button_color.'">'.$total.'</span>';

	if($form_confirmation_setting=='1'){
		$form_konfirmasi = true;
	}elseif($form_confirmation_setting=='2'){
		if($payment_method=='transfer'){
			$form_konfirmasi = true;
		}else{
			$form_konfirmasi = false;
		}
	}else{
		$form_konfirmasi = false;
	}

	// Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name2.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
    
    $show_currency = donasiaja_currency($currency);
    $show_currency2 = donasiaja_currency2($currency);

    // custom whatsapp flying button
    $flying_button_status = $campaign[0]->flying_button_status;
    if($flying_button_status=='1'){
        $flying_button_settings        = $campaign[0]->flying_button_settings;
        $flying_button_bubble_text     = $campaign[0]->flying_button_bubble_text;
        $flying_button_message         = $campaign[0]->flying_button_message;
        $flying_button_number          = $campaign[0]->flying_button_number;
        $flying_button_page_settings   = $campaign[0]->flying_button_page_settings;

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
            $page_campaign_button = null;
            $page_form_button     = null;
            $page_invoice_button  = null;
        }
    }

    // Buttom Konfirmasi Whatsapp CS
    $chat_admin_message = 'Nama: *'.$donatur.'*
Program: '.$title.'
Jumlah Donasi: '.$show_currency.number_format($total,0,",",".").'
Invoice ID: '.$invoice_id.'

'.$button_confirmation_message.'
';

    $chat_admin_phone = djaPhoneFormat($wa_csnya,$currency);

    // =============================================
    // Advanced Matching: Format nama & telepon donatur
    // Ditulis SEKALI di sini, dipakai untuk semua pixel
    // =============================================
    $donatur_firstname = strtolower(trim(explode(' ', $donatur)[0]));
    $donatur_phone = isset($donate[0]->whatsapp) ? preg_replace('/[^0-9]/', '', $donate[0]->whatsapp) : '';
    if(substr($donatur_phone, 0, 1) === '0') { $donatur_phone = '62' . substr($donatur_phone, 1); }
    

?>
<!-- Powered by DonasiAja.id -->
<!DOCTYPE html>
<html lang="en-US">
<head>
    <?php if($donate[0]->status=='1') { ?> 
	<title><?php echo get_langArray('f_typ_desc6'); ?> - <?php echo $app_name; ?></title>
    <?php } else { ?>
    <title><?php echo get_langArray('f_typ_desc5'); ?> - <?php echo $app_name; ?></title>
    <?php } ?>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
	<meta name="application-name" content="<?php echo $home_url; ?>"/>
	<meta property="og:url" content="<?php echo $home_url; ?>" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="<?php echo get_langArray('f_typ_desc5'); ?> - <?php echo $app_name; ?>" />
	<meta property="og:description" content="<?php echo $app_name; ?>" />
	<meta property="og:image" content="<?php echo $logo_url; ?>" />
	<?php dja_set_favicon(); ?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja.css';?>">
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja-style.css';?>">
	<!-- sweetalert2 -->
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>admin/plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>admin/plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>admin/plugins/sweet-alert2/sweetalert2.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">
	<style type="text/css">
		#typ_section{border-radius:12px;padding:20px 40px 40px 40px;margin-top:30px}.loading-section{float:right;height:0;margin-top:-95px;display:none}.typ-box{margin-top:80px;border-radius:12px;padding:30px 30px;border:1px solid #c5cfdd}.typ-total{margin-top:30px;margin-bottom:30px}.typ-total-text{font-size:24px;font-weight:700}.typ-total-text .threelastd{color:#46a9fd}.typ-rek-copy,.typ-total-copy{position:absolute;padding:2px 10px;border-radius:12px;font-size:11px;margin-left:12px;cursor:pointer;color:#fff;background:#52a0fd;background:linear-gradient(to right,#52a0fd 0,#00e2fa 80%,#00e2fa 100%);box-shadow:0 4px 8px rgba(0,0,0,.1)}.typ-card .typ-total-copy{color:#2ab2f1}.animation-target.lala-alert.alert-success{background:linear-gradient(to right,#52a0fd 0,#00e2fa 80%,#00e2fa 100%);padding-top:20px;border:none;border-radius:4px;margin-top:10px;box-shadow:0 6px 24px rgba(164,192,217,.25);-webkit-box-shadow:0 6px 24px rgba(164,192,217,.25);-moz-box-shadow:0 6px 24px rgba(164,192,217,.25)}.typ-rek-copy img,.typ-total-copy img{width:10px;margin-right:3px;filter:brightness(0) invert(1);background:0 0;color:#2bbcf9}p.typ-note{background:#fff2d0;border:1px solid #ece5cc;padding:10px 12px;border-radius:4px;margin-bottom:30px;margin-top:20px;line-height:1.5;font-size:12px;margin-top:40px;box-shadow:0 8px 17px rgba(0,0,0,.1)}.typ-card{background:-webkit-linear-gradient(to left,#0067b3,#164fd7);background:linear-gradient(to left,#0067b3,#164fd7);padding:30px 25px;height:160px;border-radius:16px;box-shadow:0 8px 8px rgba(0,0,0,.1);-webkit-box-shadow:0 8px 8px rgba(0,0,0,.1);-moz-box-shadow:0 8px 8px rgba(0,0,0,.1);border:1px solid #fff}.typ-card .bank-name, .typ-card .qurban-title{text-align:left;color:#2ab2f1;margin-bottom:0;position:absolute;margin-top:10px}.typ-card .bank-number{font-size:25px;font-weight:700;margin-top:0;color:#fff;text-shadow:1px 4px 8px rgba(0,0,0,.2)}.bank-number span{font-size:14px;font-weight:300}.typ-card .bank-logo{text-align:right;margin-top:-40px}.typ-card .bank-logo img{width:120px}.box-card{border:1px solid #e4eaf7;margin-bottom:20px;padding:20px 20px;background:#f3f5fb;border-radius:4px;height:40px;background:linear-gradient(to right,transparent 0,#ffffff45 80%,#fff 100%);background:#ffffff;}.box-card .box-img img{width:70px;float:left;margin-right:1em;position:relative;margin-bottom:10px;border-radius:3px}.box-card li{text-align:left;list-style-position:outside;list-style:none}.box-card ul{padding-left:1.2em;margin-top:0;color:#23374d}.box-card .bank-name, .box-card .qurban-title{margin-bottom:3px;font-weight:700}.box-card .bank-number{margin-bottom:0}.box-copy{float:right;margin-right:70px;margin-top:-58px}.box-copy img{filter:none}.box-copy .typ-rek-copy,.box-copy .typ-total-copy{box-shadow:none}p.typ_text{color:#23374d;margin-top:-8px;text-align:center}ul li.copy{display:none}ul li.copy img{width:10px;margin-right:5px;background:0 0;color:#2bbcf9}@media only screen and (max-width:480px){.typ-box{margin-left:20px;margin-right:20px;border-radius:16px;padding:30px 20px}.typ-card .bank-logo{margin-top:-25px}.typ-card .bank-logo img{width:90px}.typ-card{height:150px;font-size:21px}#typ_section{padding:20px 20px 60px 20px;margin-left:20px;margin-right:20px}.box-copy{display:none}.box-card.total_donasi{margin-bottom:50px}ul li.copy{display:inherit;padding:10px;text-align:center;margin-left:-15px;background:#f2f2fb;margin-top:15px;border-radius:2px;cursor:pointer}.box-card.no_rekening ul li.copy{margin-top:10px}.box-card.no_rekening{margin-bottom:60px}}accordion-container{margin-bottom: 40px;position: relative;max-width: 500px;height: auto;margin: 10px auto;}.accordion-container > h2{text-align: center;color: #fff;padding-bottom: 5px;margin-bottom: 20px;padding-bottom: 15px;}.set{position: relative;width: 100%;height: auto;background-color: #ebeff7; margin-bottom: 8px; border-radius: 4px;}.set > a{display: block;padding: 10px 15px;text-decoration: none;color: #23374d;font-weight: 600;-webkit-transition:all 0.2s linear;-moz-transition:all 0.2s linear;transition:all 0.2s linear;font-size: 14px;}.set > a i{float: right;margin-top: 2px;}.set > a.active{border-top-left-radius: 4px; border-top-right-radius: 4px;background-color:<?php echo $button_color;?>;color: #fff;}.content{background-color: rgba(255, 255, 255, 0.63);display: none;margin-top: 0px;margin-bottom: 0;padding-bottom: 15px;padding-top: 10px;}.content li{padding: 6px 12px;margin: 0;color: #333;font-size: 13px;}.set > a:active{outline: none;}.upload-container {width: 100%;align-items: center;display: flex;justify-content: center;background-color: #fcfcfc;margin-bottom: 40px;}.upload-card {border-radius: 10px;width: 600px;height: 260px;background-color: #ffffff;}.upload-card h3 {font-size: 22px;font-weight: 600;}.upload-container {display: none;}.drop_box {margin: 10px 0;padding: 30px 30px 40px 30px;display: flex;align-items: center;justify-content: center;flex-direction: column;border: 3px dashed #ABCAFF;border-radius: 10px;background: #abcaff21;}.drop_box h4 {font-size: 16px;font-weight: 400;color: #2e2e2e;}.drop_box p {margin-top: 10px;margin-bottom: 20px;font-size: 12px;color: #a3a3a3;}.btn {text-decoration: none;background-color: #005af0;color: #ffffff;padding: 10px 20px;border: none;outline: none;transition: 0.3s;border-radius: 2px;}.btn:hover{text-decoration: none;background-color: #ffffff;color: #005af0;padding: 10px 20px;border: none;outline: 1px solid #010101;}.form input {margin: 10px 0;width: 100%;background-color: #e2e2e2;border: none;outline: none;padding: 12px 20px;border-radius: 4px;}.upload-area {position: relative;height: 9.25rem;display: flex;justify-content: center;align-items: center;flex-direction: column;border: 2px dashed var(--clr-light-blue);border-radius: 15px;cursor: pointer;transition: border-color 300ms ease-in-out;display: none;}#previewImage {height: 130px;transition: opacity 300ms ease-in-out;border-radius: 8px;margin-bottom: 30px;}.close {position: absolute;top: 0;margin: 0 auto;margin-top: 0px;margin-right: auto;background: #e40d6d;width: 25px;height: 25px;border-radius: 40px;text-align: center;color: #fff;right: 0;margin-top: -10px;margin-right: -10px;}.upload_file {display: none;background: #e40d6d;border-radius: 2px;}.btn.upload_file:hover{text-decoration: none;background-color: #ffffff;color: #e40d6d;padding: 10px 20px;border: none;outline: 1px solid #e40d6d;}.box_loading {background: transparent;width: 0;padding: 0;margin-top: 10px;}.btn.box_loading:hover{text-decoration: none;background-color: transparent;color: transparent;}.lds-ellipsis {display: none;position: absolute;margin-left: -38px;margin-top: -30px;}.lds-ellipsis div {position: absolute;top: 33px;width: 13px;height: 13px;border-radius: 50%;background: #e40d6dba;animation-timing-function: cubic-bezier(0, 1, 1, 0);}.lds-ellipsis div:nth-child(1) {left: 8px;animation: lds-ellipsis1 0.6s infinite;}.lds-ellipsis div:nth-child(2) {left: 8px;animation: lds-ellipsis2 0.6s infinite;}.lds-ellipsis div:nth-child(3) {left: 32px;animation: lds-ellipsis2 0.6s infinite;}.lds-ellipsis div:nth-child(4) {left: 56px;animation: lds-ellipsis3 0.6s infinite;}@keyframes lds-ellipsis1 {0% {transform: scale(0);}100% {transform: scale(1);}}@keyframes lds-ellipsis3 {0% {transform: scale(1);}100% {transform: scale(0);}}@keyframes lds-ellipsis2 {0% {transform: translate(0, 0);}100% {transform: translate(24px, 0);}}.swal2-success-circular-line-left, .swal2-success-fix, .swal2-success-circular-line-right, .swal2-icon-success {background-color: #209A45 !important;}.swal2-title, .swal2-content {color:#2d3237;}.swal2-popup {border-radius:16px;}.swal2-icon-success .swal2-confirm {background: #0a7129 !important;margin-bottom: 20px;}.swal2-icon-warning .swal2-title, .swal2-icon-warning #swal2-content {color: #575252;}
		.swal2-popup.swal2-modal.swal2-show {
		  padding-top: 40px;
		  padding-bottom: 40px;
		}
		.swal2-styled.swal2-cancel {
			background-color: #c6d0e3;
		}
		.swal2-styled.swal2-confirm {
			background-color: #E40D6D;
			border-left-color: rgb(228, 13, 109);
			border-right-color: rgb(228, 13, 109);
		}
		.swal2-icon-success .swal2-title {
		  color: #fff !important;
		} 
		.swal2-icon-success .swal2-content {
		  color: #ffffffab !important;
		}
        .swal2-icon-success #swal2-html-container {
            color: #ffffffb8;
        }
		.list-qurban {
			padding-top: 10px;
		}
		.list-qurban li li {
			font-size: 12px;
			line-height: 0.7;
		}
		.box_flip_payment {
			margin-bottom: 30px;font-size: 13px;background:#fff;color: #fff;border-radius: 4px;padding: 25px 25px 25px 25px;text-align: left;border: 1px solid #fd6542;margin-top:25px;
		}
		.btn_flip_payment {
			border: 1px solid #ffffff;padding: 10px 12px;border-radius: 6px;font-size: 13px;cursor: pointer;text-decoration: navajowhite;background: rgb(253, 101, 66);box-shadow: 0px 2px 10px rgba(48, 50, 51, 0.25);-webkit-box-shadow: 0px 2px 10px rgba(48, 50, 51, 0.25);-moz-box-shadow: 0px 2px 10px rgba(48, 50, 51, 0.25);
		}
		.btn_flip_payment:hover {
			background: #fb451b;
		}
		.next_arrow {
		  animation: next_move 1s ease-in-out infinite;
		  margin-left: 9px;
		}

        #popupOverlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);display:none;justify-content:center;align-items:center;z-index:99999}
        #popupBox{width:80%;height:80%;background:#fff;border-radius:10px;position:relative;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.2)}
        #popupBox iframe{width:100%;height:100%;border:none}
        #closePopupBtn{position:absolute;top:10px;right:15px;font-size:28px;font-weight:700;color:#333;cursor:pointer;z-index:10}

		@keyframes next_move {
		  0%,
		  100% {
		    transform: translate(0, 0);
		  }

		  50% {
		    transform: translate(10px, 0);
		  }
		}

        @media only screen and (max-width:768px) {
            .whatsapp-float {
            bottom: 20px;
          }
        }

		@media only screen and (max-width:480px){
			.list-qurban li li {
				line-height: 1;
			}
            #qr-code-remitcepat canvas {
                width: 250px;
            }
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
	fbq('init', '<?php echo $pixel_id; ?>', {
		fn: '<?php echo $donatur_firstname; ?>',
		ph: '<?php echo $donatur_phone; ?>'
	});
	<?php } ?>
	<?php if($donate[0]->status=='1') { ?> 
	fbq('track', '<?php echo $event_4; ?>', {
		value: <?php echo $total; ?>,
		currency: '<?php echo $currency; ?>',
		content_name: '<?php echo addslashes($title); ?>'
	}, {
		eventID: 'purchase_<?php echo $invoice_id; ?>'
	});
	<?php }else{ ?>
	fbq('track', '<?php echo $event_3; ?>', {
		value: <?php echo $total; ?>,
		currency: '<?php echo $currency; ?>',
		content_name: '<?php echo addslashes($title); ?>'
	}, {
		eventID: 'ic_<?php echo $invoice_id; ?>'
	});
	<?php } ?>
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
	fbq('init', '<?php echo $pixel_id; ?>', {
		fn: '<?php echo $donatur_firstname; ?>',
		ph: '<?php echo $donatur_phone; ?>'
	});
	<?php if($donate[0]->status=='1') { ?>
	fbq('track', '<?php echo $event_4; ?>', {
		value: <?php echo $total; ?>,
		currency: '<?php echo $currency; ?>',
		content_name: '<?php echo addslashes($title); ?>'
	}, {
		eventID: 'purchase_<?php echo $invoice_id; ?>'
	});
	<?php }else{ ?>
	fbq('track', '<?php echo $event_3; ?>', {
		value: <?php echo $total; ?>,
		currency: '<?php echo $currency; ?>',
		content_name: '<?php echo addslashes($title); ?>'
	}, {
		eventID: 'ic_<?php echo $invoice_id; ?>'
	});
	<?php } ?>
	</script>

        <?php
    }
    ?>

	<?php if($gtm_id!=''){ ?>
    <script>
      var ptag=<?php echo $total;?>;
      var utag="<?php echo d_randomString(20);?>";
      dataLayer = [{
          'purchase': ptag,
          'uuid': utag,
      }];
    </script>
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
      <?php if($donate[0]->status=='1') { ?> 
        ttq.track('<?php echo $event_4; ?>', {
          content_id: '<?php echo $campaign[0]->campaign_id; ?>',
          content_type: 'product',
          content_name: '<?php echo str_replace("'", "", $campaign[0]->title); ?>',
          value: <?php echo $total;?>,
          currency: '<?php echo $currency?>'
       });
      <?php }else { ?>
        ttq.track('<?php echo $event_3; ?>', {
          content_id: '<?php echo $campaign[0]->campaign_id; ?>',
          content_type: 'product',
          content_name: '<?php echo $campaign[0]->title; ?>',
          value: <?php echo $total;?>,
          currency: '<?php echo $currency?>'
       });
      <?php } ?>
    }(window, document, 'ttq');
    </script>
    <?php } ?>
<script>
  // Pake satpam DOMContentLoaded biar gak error 'not defined'
  window.addEventListener('DOMContentLoaded', (event) => {
    if (typeof zaraz !== 'undefined') {
      zaraz.ecommerce('purchase', {
        value: <?php echo $total; ?>,
        currency: '<?php echo $currency; ?>',
        transaction_id: '<?php echo $invoice_id; ?>'
      });
      console.log('Zaraz Purchase Sent: <?php echo $total; ?>');
    } else {
      console.error('Zaraz ampas! Belum ke-load atau Proxy Cloudflare mati.');
    }
  });
</script>
</head>
<body>
	
	<?php if($donate[0]->status=='1') { ?> 
		<div id="typ_section" class="section-box" style="background: url('<?php echo plugin_dir_url( __FILE__ ).'assets/images/bg5.png'; ?>') no-repeat, #fff;">

			<div class="donasiaja-box" style="margin-bottom: 10px;margin-top: 10px;"><img alt="Image Success" class="" src="<?php echo plugin_dir_url( __FILE__ ).'assets/icons/success.png'; ?>" style="width: 210px;margin-top: 50px;"></div>

				<div class="title" style="margin-bottom: 30px;">
					<p class="typ_text">Terimakasih <b><?php echo $sapaan; ?> <?php echo str_replace('\\', '', $donatur); ?></b>,<br><?php echo $allocation_title; ?> anda pada program
					<b><?php echo $title; ?></b> sudah kami terima.</p>
					<br>
				</div>

				<br>
		</div>


	<?php }else{ ?>

		<div id="typ_section" class="section-box" style="background: url('<?php echo plugin_dir_url( __FILE__ ).'assets/images/bg3.png'; ?>') no-repeat, #fff;">
			<div class="donasiaja-box" style="margin-bottom: 10px;margin-top: 10px;"><a href="<?php echo $home_url; ?>" target="_self"><img alt="Donasi Aja" class="" src="<?php echo $logo_url; ?>" style="width: 120px;border-radius:4px;margin-bottom: 10px;"></a></div>

				<div class="title" style="margin-bottom: 30px;">
					<p class="typ_text">Terimakasih <b><?php echo $sapaan; ?> <?php echo str_replace('\\', '', $donatur); ?></b><br>atas <?php echo $allocation_title; ?> yang akan anda berikan pada program :</p>
					<h2 style="text-align: center;font-size: 16px;"><?php echo $title; ?></h2>
					<br>
				</div>

				<?php 

				$bHasLink = !empty($payment_number) && (strpos($payment_number, 'http') !== false 
                || strpos($payment_number, 'www.') !== false 
                || strpos($payment_number, 'flip') !== false || $payment_account=='QRIS - Remitcepat');

				if($bHasLink){

					$from_ipaymu = false;
					$from_flip = false;

                    $payment_qrcode = $payment_qrcode ?? '';
                    $payment_number = $payment_number ?? '';

					$ipaymuLink = strpos($payment_qrcode, 'ipaymu') !== false;
					$flipLink = strpos($payment_number, 'flip') !== false;
					if($ipaymuLink){
						$content=file_get_contents($payment_qrcode);
						if (preg_match("/src=[\"\'][^\'\']+[\"\']/", $content, $matches)) {
							$payment_qrcode = $matches[0];
						}
						$from_ipaymu = true;
					}

					if($flipLink){
						$from_flip = true;
					}

				?>

				<?php if($from_ipaymu==true) { ?>
					<div class="qrcode" style="border: 1px solid #e4eaf7;border-radius: 4px;margin-bottom: 20px;text-align: center;padding-top: 20px; padding-bottom: 20px;margin-top: -20px;">
					<img <?php echo $payment_qrcode; ?> >
					</div>
				<?php } elseif($from_flip==true) { ?>

                <?php } elseif($bank_code=='cc') { ?>

                <?php } elseif($payment_account=='QRIS - Remitcepat' and $payment_number!='' ) { ?>
					
                    <div class="qr-code" style="border: 1px solid #e4eaf7;border-radius: 4px;margin-bottom: 20px;text-align: center;padding-top: 20px; padding-bottom: 20px;margin-top: -20px;">
                    <div id="qr-code-remitcepat" style="display: block ruby;margin: 40px 0 40px 0;"></div>
                    </div>

				<?php }else{ ?>
					   <?php if(strpos($payment_qrcode, 'midtrans.com') !== false){?>
                            <div style="border: 1px solid #e4eaf7;border-radius: 4px;margin-bottom: 20px;text-align: center;padding-top: 20px;padding-bottom: 20px;margin-top: -20px;">
                            <img src="<?php echo $payment_qrcode; ?>" style="width: 70%;">
                            </div>
                        <?php }else{ ?>
                            <div style="border: 1px solid #e4eaf7;border-radius: 4px;margin-bottom: 20px;text-align: center;padding-top: 20px;padding-bottom: 20px;margin-top: -20px;">
                            <img src="<?php echo $payment_number; ?>" style="width: 70%;">
                            </div>
                        <?php } ?>
				<?php } ?>

				<?php if (preg_match('~[0-9]+~', $payment_account)) { ?>
				    <p class="typ_text" style="margin-bottom: 30px;font-size: 13px;">Scan QR-Code berikut pada aplikasi atau gunakan Payment ID dibawah untuk mentransfer.</p>

				<?php } elseif (strpos($payment_number, 'flip.id') !== false) { ?>

                <?php } elseif ($bank_code=='cc') { ?>
				    
				<?php }else{ ?>
					<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;">Scan QR-Code berikut untuk mentransfer<br>dengan app kesayangan anda.</p>
					
					<?php if($bank_code=='gopay') { ?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><a href="https://gojek.onelink.me/2351932542?af_banner=true&amp;pid=Go-Jek_Web&amp;c=WebToAppBanner&amp;af_adset=bottom-banner&amp;af_ad=%2Fsg%2F&amp;af_dp=gojek%3A%2F%2Fhome"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_gopay.png'; ?>" style="width: 100%;"></a></p>
					<?php }elseif($bank_code=='ovo'){?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_ovo.png'; ?>" style="width: 100%;"></p>
					<?php }elseif($bank_code=='dana'){?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><a href="https://link.dana.id" target="_blank"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_dana.png'; ?>" style="width: 100%;"></a></p>
					<?php }elseif($bank_code=='shopeepay'){?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_shopeepay.png'; ?>" style="width: 100%;"></p>
					<?php }elseif($bank_code=='linkaja'){?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_linkaja.png'; ?>" style="width: 100%;"></p>
					<?php }else{?>
						<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/app_qris_support.png'; ?>" style="width: 70%;"></p>
					<?php } ?>

					<p class="typ_text" style="margin-bottom: 30px;font-size: 13px;"><img src="<?php echo plugin_dir_url( __FILE__ ).'assets/images/scan_qris.png'; ?>" style="width: 70%;"></p>

				<?php } ?>

				<?php 
			    $info_addformula = json_decode($donate[0]->info_addformula, true);
			    $datane_addformula = '';
			    $count_addformula = 0;
			    if($info_addformula){
			    	foreach ( $info_addformula as $key => $value ) {
				    	$count_addformula++;
				    	$datane_addformula .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['label']. ' = '.$value['nominal'].'</li></ul></li></ul>';
				    }
			    }
			    $padding_bottom_addformula = 50*$count_addformula;
				?>

				<?php if($donate[0]->info_qurban!=null && $donate[0]->info_qurban!='[]'){ ?>
				<?php 
				$info_qurban = json_decode($donate[0]->info_qurban, true);
			    $datane2 = '';
			    $count_qurban = 0;
			    foreach ( $info_qurban as $key => $value ) {
			    	$count_qurban++;
			    	$datane2 .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['qurban'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li><li style="line-height: 1.5;"><i>Atas nama : <b>'.$value['an'].'</b></i></li></ul></li></ul>';
			    }
			    $padding_bottom = 40*$count_qurban;
			    $padding_bottom = $padding_bottom+$padding_bottom_addformula;
			    if($count_qurban>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane2; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>

				<?php if($donate[0]->info_package2!=null && $donate[0]->info_package2!='[]'){ ?>
				<?php 
				$info_package2 = json_decode($donate[0]->info_package2, true);
			    $datane3 = '<ul class="list-qurban">';
			    $count_package = 0;
			    foreach ( $info_package2 as $key => $value ) {
			    	$count_package++;
			    	$datane3 .= '<li style="line-height: 0.6;list-style-type:disc;"><ul><li style="line-height:1.8">'.$value['package'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li></ul></li>';
			    }
                $datane3 .= '</ul>';
			    $padding_bottom = 40*$count_package;
			    $padding_bottom = $padding_bottom+$padding_bottom_addformula;
			    if($count_package>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane3; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>

				<?php 
				if($donate[0]->info_zfitrah!=null && $donate[0]->info_zfitrah!='[]'){ ?>
				<?php 
				$info_zfitrah = json_decode($donate[0]->info_zfitrah, true);
			    $datane4 = '';
			    $count_package = 0;
			    foreach ( $info_zfitrah as $key => $value ) {
			    	$count_package++;
			    	$datane4 .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['package'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li><li style="line-height: 1.5;"><i>Atas nama : <b>'.$value['an'].'</b></i></li></ul></li></ul>';
			    }
			    $padding_bottom = 40*$count_package;
			    $padding_bottom = $padding_bottom+$padding_bottom_addformula;
			    if($count_package>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane4; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>


				<div class="box-card no_rekening" <?php if (preg_match('~[0-9]+~', $payment_account)) {}else{ echo 'style="margin-bottom: 20px;"';} ?>>
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/'.$bank_code.'.png'; ?>"></div>
					<ul>
					    <li class="bank-name"></li>
					    <li class="bank-number" style="margin-top: 8px;padding-bottom: 10px;"><?php echo $payment_account; ?></li>
					    <?php
					    if (preg_match('~[0-9]+~', $payment_account)) { ?>
						    <li class="copy copy-rek" data-salin="<?php echo preg_replace('/\D/', '', $payment_account); ?>"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>">Copy ID</li>
						<?php } ?>
					</ul>
					<?php
				    if (preg_match('~[0-9]+~', $payment_account)) { ?>
						    <div class="box-copy"><span class="typ-rek-copy" data-salin="<?php echo preg_replace('/\D/', '', $payment_account); ?>" style="background: transparent;color: #363636;margin-top:17px;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>"> COPY</span></span></div>
					<?php } ?>
				</div>

				<?php }else{ ?>

				<?php 
			    $info_addformula = json_decode($donate[0]->info_addformula, true);
			    $datane_addformula = '';
			    $count_addformula = 0;
			    if($info_addformula){
			    	foreach ( $info_addformula as $key => $value ) {
				    	$count_addformula++;
				    	$datane_addformula .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['label']. ' = '.$value['nominal'].'</li></ul></li></ul>';
				    }
			    }
			    $padding_bottom_addformula = 50*$count_addformula;
				?>

				<?php if($donate[0]->info_qurban!=null && $donate[0]->info_qurban!='[]'){ ?>
				<?php 
				$info_qurban = json_decode($donate[0]->info_qurban, true);
			    $datane2 = '';
			    $count_qurban = 0;
			    foreach ( $info_qurban as $key => $value ) {
			    	$count_qurban++;
			    	$datane2 .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['qurban'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li><li style="line-height: 1.5;"><i>Atas nama : <b>'.$value['an'].'</b></i></li></ul></li></ul>';
			    }
			    $padding_bottom = 40*$count_qurban;
			    if($count_qurban>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane2; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>

				<?php if($donate[0]->info_package2!=null && $donate[0]->info_package2!='[]'){ ?>
				<?php 
				$info_package2 = json_decode($donate[0]->info_package2, true);
			    $datane3 = '';
			    $count_package = 0;
			    foreach ( $info_package2 as $key => $value ) {
			    	$count_package++;
			    	$datane3 .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['package'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li></ul></li></ul>';
			    }
			    $padding_bottom = 40*$count_package;
			    if($count_package>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane3; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>

				<?php 
				if($donate[0]->info_zfitrah!=null && $donate[0]->info_zfitrah!='[]'){ ?>
				<?php 
				$info_zfitrah = json_decode($donate[0]->info_zfitrah, true);
			    $datane4 = '';
			    $count_package = 0;
			    foreach ( $info_zfitrah as $key => $value ) {
			    	$count_package++;
			    	$datane4 .= '<ul class="list-qurban"><li style="line-height: 0.6;list-style-type:disc;"><ul><li>'.$value['package'] .' ('.$value['per@'].') x '.$value['jumlah'].' = '.$value['nominal'].'</li><li style="line-height: 1.5;"><i>Atas nama : <b>'.$value['an'].'</b></i></li></ul></li></ul>';
			    }
			    $padding_bottom = 40*$count_package;
			    $padding_bottom = $padding_bottom+$padding_bottom_addformula;
			    if($count_package>=1){ 
				?>
				<div class="box-card" style="background:none;border-color:#e4eaf7;height:auto;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/resume.png'; ?>" style="width: 45px;margin-left: 6px;margin-right: 34px;padding-bottom:<?php echo $padding_bottom;?>px;"></div>
					<ul>
					    <li class="qurban-title" style="margin-bottom: 2px;">Data Detail :</li>
					    <?php echo $datane4; ?>
					    <?php echo $datane_addformula; ?>
					</ul>
				</div>
				<?php } ?>
				<?php } ?>

                <?php if($bank_code=='cimb'){ $bank_code = 'cimb_niaga'; }?>

				<div class="box-card no_rekening" <?php if($bank_code=='tunai'){echo'style="margin-bottom:20px !important;"';}?>>
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/bank/'.$bank_code.'.png'; ?>"></div>

                    <?php if($payment_account=='QRIS - Remitcepat' and $payment_number!=''){ ?>
                        <ul>
                            <li class="bank-name" style="padding-top:6px;"><?php echo $payment_account; ?></li>
                            <li class="bank-number"></li>
                            <li class="copy copy-rek" data-salin="<?php echo preg_replace('/\D/', '', $payment_number); ?>" <?php if($bank_code=='tunai'){echo'style="display:none;';}?>><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>">Copy Rekening</li>
                        </ul>
                    <?php }else{ ?>
    					<ul>
    					    <li class="bank-name"><?php echo $payment_number; ?></li>
    					    <li class="bank-number"><?php echo $payment_account; ?></li>
    					    <li class="copy copy-rek" data-salin="<?php echo preg_replace('/\D/', '', $payment_number); ?>" <?php if($bank_code=='tunai'){echo'style="display:none;';}?>><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>">Copy Rekening</li>
    					</ul>
    					<div class="box-copy" <?php if($bank_code=='tunai'){echo'style="display:none;"';}?>><span class="typ-rek-copy" data-salin="<?php echo preg_replace('/\D/', '', $payment_number); ?>" style="background: transparent;color: #363636;margin-top:17px;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>"> COPY</span></span></div>
                    <?php } ?>
				</div>

				<?php } ?>


				<div class="box-card total_donasi">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donation_love.png'; ?>" style="width: 35px;margin-left: 15px;margin-right: 35px;"></div>
					<ul>
					<?php if($total_depan==''){ ?>
						<li class="bank-name" style="font-size: 21px;padding-top: 7px;"><?php echo $show_currency2; ?><span style="color: #E40D6D;"><?php echo $total_belakang; ?></span></li>
					<?php }else{ ?>
						<li class="bank-name" style="font-size: 21px;padding-top: 7px;"><?php echo $show_currency2; ?><?php echo $total_depan; ?><?php if($currency=='MYR'){echo',';}else{echo'.';} ?><span style="color: #E40D6D;"><?php echo $total_belakang; ?></span></li>
					<?php } ?>
					    <li class="copy copy-total" data-salin="<?php echo $total; ?>"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>">Copy Total</li>
					</ul>
					<div class="box-copy"><span class="typ-total-copy" data-salin="<?php echo $total; ?>" style="background: transparent;color: #363636;margin-top: 5px;margin-top:20px;"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/copy.png'; ?>"> COPY</span></span></div>
				</div>
				
				<?php 
                    if (!empty($payment_number) && strpos($payment_number, 'flip.id') !== false)
                        { ?>
				    <div class="typ_text box_flip_payment"><a href="<?php echo $payment_number; ?>" target="_self" style="color:#ffffff;text-decoration: none;text-align: center;"><div class="btn_flip_payment">Next untuk Pembayaran <i class="fa fa-arrow-right next_arrow" style="font-size: 16px;margin-right: 8px;"></i></div></a></div>
				<?php } ?>

				<?php if($bank_code=='jemput_donasi') { ?>
					<p class="typ_text" style="text-align: left;margin-bottom: 40px;font-size: 13px;">Dalam waktu dekat kami akan menghubungi dan menjemput Donasi Anda. Terimakasi atas kebaikannya, semoga Allah selalu senantiasa bersama anda.</p>
				<?php }else{ ?>

				<?php if($bank_code=='tunai'){ ?>
					<p class="typ_text" style="text-align: left;margin-bottom: 40px;font-size: 13px;">Berikan uang secara tunai kepada admin agar kebaikan ini dapat kami teruskan. Terimakasih :)</p>
				<?php } else{ ?>
					<p class="typ_text" style="text-align: left;margin-bottom: 40px;font-size: 13px;"><?php echo get_langArray('f_typ_desc1'); ?></p>
				<?php } ?>

                <?php if($button_confirmation_setting=='1' && $button_confirmation_whatsapp!=''){ if($button_confirmation_text==''){$button_confirmation_text=='Konfirmasi ke CS';} ?>
                    <?php if($img_confirmation_url==''){ ?>
                    <a href="https://api.whatsapp.com/send?phone=<?php echo $chat_admin_phone; ?>&text=<?php echo urlencode($chat_admin_message); ?>" target="_blank"><button class="donation_button_now2" style="background:#25D366;border-color:#00AA36;margin:0px 0 20px 0;width:100%;margin-bottom:30px;font-size:14px;cursor:pointer;"><img src="/wp-content/plugins/donasiaja/assets/icons/whatsapp.svg" alt="" class="whatsapp-icon" style="width: 20px;margin-top: -7px;margin-left: -30px;position: absolute;"><?php echo $button_confirmation_text; ?></button></a>
                    <?php } ?>
                <?php } ?>

				<?php if($form_konfirmasi==true){ ?>
					<?php if($img_confirmation_url==''){ ?>
					<div class="upload-container">
					  <div class="upload-card">
					    <div class="drop_box">
					      <header class="title_dropbox">
					        <h4>Select File here</h4>
					      </header>
					      <p class="title_dropbox">Files Supported: JPG, JPEG, PNG</p>
					      <div id="dropZoon" class="upload-area">
						      <img id="previewImage">
						      <div class="close" title="Change Image">x</div>
						  </div>
					      <input type="file" hidden accept=".jpg,.jpeg,.png" id="fileID" style="display:none;">
					      <button class="btn choose_file">Choose File</button><button class="btn upload_file">Upload Now</button>
					      <button class="btn box_loading"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></button>
					    </div>
					  </div>
					</div>
					<?php } ?>
				<?php } ?>

                <?php if($form_konfirmasi==true){ ?>
                    <?php if($img_confirmation_url==''){ ?>
                    <button class="donation_button_now2 confirm_payment" style="background:#23374d;border-color:#23374d;margin:0px 0 20px 0;width:100%;margin-bottom:30px;font-size:14px;"><?php echo get_langArray('f_typ_button1'); ?></button>
                    <button class="donation_button_now2 confirm_process" style="background:#0DAC50;border-color:#109F4D;margin:0px 0 20px 0;width:100%;margin-bottom:30px;font-size:14px;display:none;cursor:default;"><i class="fa fa-check-circle" style="font-size: 16px;margin-right: 8px;"></i> Confirmation on Process</button>
                    <?php }else{ ?>
                    <button class="donation_button_now2 confirm_process" style="background:#0DAC50;border-color:#109F4D;margin:0px 0 20px 0;width:100%;margin-bottom:30px;font-size:14px;cursor:default;"><i class="fa fa-check-circle" style="font-size: 16px;margin-right: 8px;"></i> Confirmation on Process</button>
                    <?php } ?>
                <?php } ?>
				
				<div class="box-card" style="background:#fff5e4;">
					<div class="box-img"><img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/timer.png'; ?>" style="width: 35px;margin-left: 18px;margin-right: 32px;"></div>
					<ul>
					    <li class="bank-number" style="margin-bottom: 2px;">Transfer sebelum :</li>
                        <?php 
                        if($currency=='IDR'){
                            $wib = ' WIB';
                        }else{
                            $wib = '';
                        }
                        $expired_time = donate_expired_time($donate[0]->id, $donate[0]->payment_gateway);
                        if($expired_time==''){ ?>
                            <li class="bank-name"><?php 
                            $time_plus_24 = strtotime('+24 hour',strtotime($payment_date));
                            echo date('d',$time_plus_24).' '.date('M',$time_plus_24).' '.date('Y',$time_plus_24).' - '.date('H:i',$time_plus_24).$wib; ?></li>
                        <?php } else{
                            echo '<li class="bank-name">'.$expired_time.$wib.'</li>';
                        } ?>
					</ul>
				</div>

				<br>
				
				<div class="box-card2">
					<div class="accordion-container">
					<?php 
					$url = plugin_dir_url( __FILE__ )."library/instructions.json";
					$curl = curl_init();
					curl_setopt_array($curl, [
						CURLOPT_URL => $url,
						CURLOPT_RETURNTRANSFER => true,
						CURLOPT_ENCODING => "",
						CURLOPT_MAXREDIRS => 10,
						CURLOPT_TIMEOUT => 30,
						CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
						CURLOPT_CUSTOMREQUEST => "GET",
						CURLOPT_SSL_VERIFYHOST => 0,
						CURLOPT_SSL_VERIFYPEER => 0,
						CURLOPT_HTTPHEADER => [
						  "Accept: application/json",
						],
					]);
					$response = curl_exec($curl);
					$err = curl_error($curl);
					curl_close($curl);
					if ($err) {
						echo "cURL Error #:" . $err;
					} else {
						$array = json_decode($response, true);
					}
					
					$no = 0;
					$i = 0;
					foreach ($array as $a => $b) { if($donate[0]->payment_gateway!=''){ if($array[$no]['pg']!='general'){ if($array[$no]['pg']==$donate[0]->payment_gateway){ if($array[$no]['payment']==$bank_code){ foreach ($array[$no] as $key => $val) { if($key=='pg'){ }elseif($key=='method'){ }elseif($key=='payment'){ }elseif($key=='steps'){ }else{ $i++; } } } } }else{ if($array[$no]['payment']==$bank_code && $donate[0]->payment_method!='va'){ foreach ($array[$no] as $key => $val) { if($key=='pg'){ }elseif($key=='method'){ }elseif($key=='payment'){ }elseif($key=='steps'){ }else{ $i++; } } } } }else{ if($array[$no]['pg']=='general'){ if($array[$no]['payment']==$bank_code){ foreach ($array[$no] as $key => $val) { if($key=='pg'){ }elseif($key=='method'){ }elseif($key=='payment'){ }elseif($key=='steps'){ }else{ $i++; } } } } } $no++; }
					if($i>=0){
						echo '<h3 style="text-align: center;margin-bottom: 20px;margin-top: 20px;">'.get_langArray('f_typ_desc5').'</h3>';
					}

					if($donate[0]->payment_gateway=='tripay'){
						$id_donate = $donate[0]->id;
						$payment_log = $wpdb->get_results('SELECT * from '.$table_name5.' where id_donate="'.$id_donate.'"');
                        if (!empty($payment_log) && isset($payment_log[0])) {
                            $hasil = $payment_log[0]->log;
                            $data_log = json_decode($hasil);
                            if (isset($data_log->data->instructions) && is_array($data_log->data->instructions)) {
                                $tripay_instructions = $data_log->data->instructions;
                                foreach ($tripay_instructions as $value) {
                                    echo '<div class="set">';
                                    echo '<a href="javascript:;">' . $value->title . '<i class="fa fa-plus"></i></a>';
                                    echo '<ol class="content">';
                                    foreach ($value->steps as $value2) {
                                        echo '<li>' . $value2 . '</li>';
                                    }
                                    echo '</ol>';
                                    echo '</div>';
                                }
                            }
                        }
					}else{
						if($donate[0]->payment_gateway=='flip' && $donate[0]->payment_method=='transfer'){
								echo $a = '<div class="set"><a href="javascript:;">Flip<i class="fa fa-plus"></i></a><ol class="content"><li>Klik link Flip di bawah</li><li>Flip : <span style="color:'.$button_color.'"><b><a href="'.$payment_number.'">'.substr($payment_number, 0, 60).'..</a></b></span></li><li>Lalu lanjutkan pembayaran hingga selesai</li></ol></div>';
						}elseif($donate[0]->payment_gateway=='flip' && $donate[0]->payment_method=='instant'){
								echo $a = '<div class="set"><a href="javascript:;">Flip<i class="fa fa-plus"></i></a><ol class="content"><li>Klik link Flip di bawah</li><li>Flip : <span style="color:'.$button_color.'"><a href="'.$payment_number.'">'.substr($payment_number, 0, 60).'..</a></span></li><li>Lalu lanjutkan pembayaran hingga selesai</li></ol></div>';
						}else{
							$no = 0;
							$pg_has_instruction = false;
							foreach ($array as $a => $b) {
								if($donate[0]->payment_gateway!=''){
									if($array[$no]['pg']!='general'){
										if($array[$no]['pg']==$donate[0]->payment_gateway){
											if($array[$no]['payment']==$bank_code){
													$pg_has_instruction = true;
													echo '<div class="set">';
													foreach ($array[$no] as $key => $val) {
														if($key=='pg'){}elseif($key=='method'){}elseif($key=='payment'){}elseif($key=='steps'){
															echo '<ol class="content">';
															foreach ($val as $v) { $v = strtr($v, $data_field); echo '<li>'.$v.'</li>'; }
															echo '</ol>';
														}else{
															echo '<a href="javascript:;">'.$val.'<i class="fa fa-plus"></i></a>';
														}
													}
													echo '</div>';
											}
										}
									}else{
										if($array[$no]['payment']==$bank_code && $donate[0]->payment_method!='va' && $pg_has_instruction==false){
												echo '<div class="set">';
												foreach ($array[$no] as $key => $val) {
													if($key=='pg'){}elseif($key=='method'){}elseif($key=='payment'){}elseif($key=='steps'){
														echo '<ol class="content">';
														foreach ($val as $v) { $v = strtr($v, $data_field); echo '<li>'.$v.'</li>'; }
														echo '</ol>';
													}else{
														echo '<a href="javascript:;">'.$val.'<i class="fa fa-plus"></i></a>';
													}
												}
												echo '</div>';
										}
									}
								}else{
									if($array[$no]['pg']=='general'){
										if($array[$no]['payment']==$bank_code){
												echo '<div class="set">';
												foreach ($array[$no] as $key => $val) {
													if($key=='pg'){}elseif($key=='method'){}elseif($key=='payment'){}elseif($key=='steps'){
														echo '<ol class="content">';
														foreach ($val as $v) { $v = strtr($v, $data_field); echo '<li>'.$v.'</li>'; }
														echo '</ol>';
													}else{
														echo '<a href="javascript:;">'.$val.'<i class="fa fa-plus"></i></a>';
													}
												}
												echo '</div>';
										}
									}
								}
								$no++;
							}
						}
					}
					?>
					</div>
				</div>
				<?php } ?>
				
		</div>

	<?php } ?>


    <?php if($flying_button_settings=='1' and $page_invoice_button=='1'){ ?>
        <?php $wa_admin = wa_variants_08_628_2($flying_button_number); ?>
        <a href="https://api.whatsapp.com/send?phone=<?php echo $wa_admin; ?>&text=<?php echo urlencode($flying_button_message); ?>" 
           class="whatsapp-float" target="_blank" style="cursor: pointer;">
           <?php if($flying_button_bubble_text!=''){ ?><div class="chat-bubble"><?php echo $flying_button_bubble_text; ?></div><?php } ?>
           <img src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/whatsapp.svg'; ?>" class="whatsapp-icon" alt="" />
        </a>
    <?php } ?>


	<div class="section-box box-powered" style="box-shadow: none;background: transparent;">
		<p style="color: #9aabc8;margin-top: -8px;text-align: center;padding-top: 30px;"><?php echo get_langArray('f_typ_desc2'); ?><br><a href="<?php echo $home_url; ?>" target="_self" style="text-decoration: none;color: #1c75ba;">Klik disini</a></p>
		<?php if($powered_by_setting=='1'){ ?>
		<div class="powered-donasiaja-box"><a href="https://donasiaja.id" target="_blank"><img alt="Donasi Aja" class="powered-donasiaja-img" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donasiaja.ico'; ?>">Powered by DonasiAja</a></div>
		<?php } ?>
	</div>
	<div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

    <div id="popupOverlay">
        <div id="popupBox">
            <span id="closePopupBtn">&times;</span>
            <iframe id="popupIframe" src=""></iframe>
        </div>
    </div>

	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/jquery.min.js';?>"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/donasiaja.min.js';?>"></script>
    <?php if($payment_account=='QRIS - Remitcepat'){ ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        generateQRCode();
        function generateQRCode() {
            const textInput = '<?php echo $payment_number; ?>';
            const qrCodeContainer = new QRCode(document.getElementById("qr-code-remitcepat"), {
                text: textInput, width: 300, height: 300,
                colorDark : "#000000", colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            qrCodeContainer.innerHTML = "";
            if (textInput === "") { alert("Please enter some text or a URL!"); return; }
            const containerWidth = qrCodeContainer.offsetWidth;
            const qrCode = new QRCode(qrCodeContainer, {
                text: textInput, width: containerWidth, height: containerWidth,
            });
        }
    </script>
    <?php } ?>

	<script>
    var d_status = "<?php echo $donate[0]->status; ?>";
    var d_id = <?php echo $donate[0]->id; ?>;
    if(d_status!='1'){
    	get_status();
    }

	function get_status() {
		var data_nya = [d_status, d_id];
        var data = { "action": "djafunction_get_status", "datanya": data_nya };
        jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
        	if(response=='success'){
        		location.reload();
        	}else{
        		setTimeout(function() { get_status(); }, 1000 * 3);
        	}
        });
	}

	$(document).ready(function(){$(".set > a").on("click",function(){if($(this).hasClass("active")){$(this).removeClass("active");$(this).siblings(".content").slideUp(200);$(".set > a i").removeClass("fa-minus").addClass("fa-plus")}else{$(".set > a i").removeClass("fa-minus").addClass("fa-plus");$(this).find("i").removeClass("fa-plus").addClass("fa-minus");$(".set > a").removeClass("active");$(this).addClass("active");$(".content").slideUp(200);$(this).siblings(".content").slideDown(200)}})})

	<?php
        if (!empty($payment_number) && strpos($payment_number, 'flip.id') !== false) {
			if($flip_redirect=='1'){
				if($payment_method=='transfer' || $payment_method=='instant'){
				echo '$(function() { setTimeout(loadDeeplink, 2000); }); function loadDeeplink() { window.location="'.$donate[0]->deeplink_url.'"; }';
				}
			}
		}else{
            if($bank_code=='gopay') {
                echo '$(function() { setTimeout(loadDeeplink, 2000); }); function loadDeeplink() { const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); if (isMobile) { window.location="'.$donate[0]->deeplink_url.'"; } }';  
            }elseif($bank_code=='cc') {
                if($donate[0]->status!='1'){
                    echo 'window.onload = function () { document.getElementById("popupOverlay").style.display = "flex"; document.getElementById("popupIframe").src = "'.$donate[0]->deeplink_url.'"; }; document.getElementById("closePopupBtn").onclick = function () { document.getElementById("popupOverlay").style.display = "none"; document.getElementById("popupIframe").src = ""; };';  
                }
            }else{
    			if($donate[0]->deeplink_url!=''){
    			echo '$(function() { setTimeout(loadDeeplink, 2000); }); function loadDeeplink() { window.location="'.$donate[0]->deeplink_url.'"; }';
    			}
            }
		}
	?>

	$(".typ-total-copy, .copy-total").on("click",function(e){var total=$(this).attr('data-salin');copyToClipboard(total);var message="<?php echo get_langArray('f_typ_desc4'); ?>: "+total+" berhasil dicopy.";var status="success";var timeout=3000;createAlert(message,status,timeout)});$(".typ-rek-copy, .copy-rek").on("click",function(e){var rek=$(this).attr('data-salin');copyToClipboard(rek);var message="<?php echo get_langArray('f_typ_desc3'); ?>: "+rek+" berhasil dicopy.";var status="success";var timeout=3000;createAlert(message,status,timeout)})

	function copyToClipboard(string) {
            let textarea;let result;try{textarea=document.createElement("textarea");textarea.setAttribute("readonly",!0);textarea.setAttribute("contenteditable",!0);textarea.style.position="fixed";textarea.value=string;document.body.appendChild(textarea);textarea.focus();textarea.select();const range=document.createRange();range.selectNodeContents(textarea);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);textarea.setSelectionRange(0,textarea.value.length);result=document.execCommand("copy")}catch(err){console.error(err);result=null}finally{document.body.removeChild(textarea)}
        if(!result){const isMac=navigator.platform.toUpperCase().indexOf("MAC")>=0;const copyHotkey=isMac?"⌘C":"CTRL+C";result=prompt(`Press ${copyHotkey}`,string);if(!result){return!1}}
        return!0
            }

    <?php if($donate[0]->status!='1') { ?> 
    <?php if($form_konfirmasi==true){ ?>
    <?php if($img_confirmation_url==''){ ?>
    
    const dropArea = document.querySelector(".drop_box"),
	  button = dropArea.querySelector("button"),
	  dragText = dropArea.querySelector("header"),
	  input = dropArea.querySelector("input");
	let file;
	var filename;

	button.onclick = () => { input.click(); };

	input.addEventListener("change", function (e) {
	  	var file = e.target.files[0];
	    getFile(file).then((customJsonFile) => {
	         var ibase64 = 'data:'+customJsonFile['fileType']+';base64,'+customJsonFile['base64StringFile'];
	         $('#previewImage').attr('src', ibase64);
	         $('.title_dropbox').hide();
	         $('.upload-area').css({ "display": "inline"});
	         $('.choose_file').hide();
	         $('.upload_file').show();
	    });
	});

	$(".close").on("click",function(e){
		$('.choose_file').show();
	    $('.upload_file').hide();
	    $('.upload-area').css({ "display": "none"});
	    $('.title_dropbox').slideDown();
	    $('.lds-ellipsis').css({ "display": "none"});
	});

    function getFile(file) {
        var reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onerror = () => { reader.abort(); reject(new Error("Error parsing file"));}
            reader.onload = function () {
                let bytes = Array.from(new Uint8Array(this.result));
                let base64StringFile = btoa(bytes.map((item) => String.fromCharCode(item)).join(""));
                resolve({ bytes: bytes, base64StringFile: base64StringFile, fileName: file.name, fileType: file.type });
            }
            reader.readAsArrayBuffer(file);
        });
    }

    $(document).ready(function() {
    	
    $(".upload_file").click(function(event) {
    	event.preventDefault();
    	swal.fire({
          title: 'Apakah data sudah sesuai?',
          text: "Hanya bisa upload data sekali, klik Lanjut jika sudah sesuai.",
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Lanjut!',
          cancelButtonText: 'Cancel',
          reverseButtons: true
        }).then(function(result) {
          	if (result.value) {
		        var ajaxurl = "<?php echo admin_url('admin-ajax.php'); ?>";
		        var formData = new FormData();
		        formData.append('updoc', $('input[type = file]')[0].files[0]);
		        formData.append('action', "donasiaja_upload_confirmation");
		        $('.lds-ellipsis').css({ "display": "inline-block"});
		        $.ajax({
		            url: ajaxurl, type: "POST", data: formData,
		            cache: false, processData: false, contentType: false,
		            success: function(data) {
		                if(data!='failed'){
		                	var link_image = data;
		                	var invoice_id = "<?php echo $invoice_id;?>";
		                	var data_nya = [link_image, invoice_id];
			                var data = { "action": "djafunction_update_confirmation", "datanya": data_nya };
			                jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {
			                	if(response=='success'){
							        swal.fire('Success!', "Terimakasih, data konfirmasi berhasil kami terima!", 'success');
						            $('.lds-ellipsis').css({ "display": "none"});
					                $('.upload_file, .close, .upload-container').hide();
					                $('.confirm_process').show();
			                	}else{
				                	swal.fire('Failed!', "File gagal di Upload!", 'warning');
						            $('.lds-ellipsis').css({ "display": "none"});
			                	}
			                });
		                }else{
		                	swal.fire('Failed!', "File gagal di Upload!", 'warning');
		                }
		            },
		        });
          	}
      	})
	    });

	    $(".confirm_payment").click(function(event) {
	    	$('.upload-container').css({'display':'inline-flex'});
	    	$(this).hide();
	    });
	});

	<?php } ?>
	<?php } ?>
	<?php } ?>

	</script>

	<?php if($gtm_id!=''){ ?>
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo $gtm_id;?>"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <?php } ?>
    
</body>
</html>