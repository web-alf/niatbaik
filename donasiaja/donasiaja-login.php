<?php

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_users";
    $table_name2 = $wpdb->prefix . "dja_settings";

    // Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name2.' where type="logo_url" or type="app_name" or type="login_setting" or type="login_text" or type="register_setting" or type="register_text" or type="page_login" or type="page_register" or type="theme_color" or type="powered_by_setting" or type="changepass_setting" ORDER BY id ASC');
    $logo_url 			= $query_settings[0]->data;
    $app_name 			= $query_settings[1]->data;
    $login_setting 		= $query_settings[2]->data;
    $login_text 		= $query_settings[3]->data;
    $register_setting 	= $query_settings[4]->data;
    $register_text 		= $query_settings[5]->data;
    $page_login 		= $query_settings[6]->data;
    $page_register 		= $query_settings[7]->data;
    $general_theme_color = json_decode($query_settings[8]->data, true);
    $powered_by_setting = $query_settings[9]->data;
    $changepass_setting = $query_settings[10]->data;
    

	$id_login = wp_get_current_user()->ID;

	// if($id_login!=''){
	if (!empty($id_login)) {
		wp_redirect( get_site_url().'/wp-admin/admin.php?page=donasiaja_myprofile' );
		exit;
	}
	if ($login_setting !== '1') {
		wp_redirect( get_site_url() );
		exit;
	}

	$home_url = get_site_url();

	// set the color
    $theme_color 		= $general_theme_color['color'][0];
	$progressbar_color  = $general_theme_color['color'][1];
	$button_color 		= $general_theme_color['color'][2];


?>

<!DOCTYPE html>
<html lang="en-US">
<head>

	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
	<meta name="application-name" content="<?php echo $home_url; ?>"/>
	<meta property="og:url" content="<?php echo $home_url; ?>" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Login - <?php echo $app_name; ?>" />
	<meta property="og:description" content="<?php echo $app_name; ?>" />
	<meta property="og:image" content="<?php echo $logo_url; ?>" />
	<title>Login - <?php echo $app_name; ?></title>
	<?php dja_set_favicon(); ?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja.css';?>">
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja-style.css';?>">
	<style type="text/css">
		a:active, a:focus, a:visited {box-shadow: none !important;outline: none;box-shadow: 0 4px 15px 0 rgba(0,0,0,.1);}.form-group label {font-size: 14px;}.donasiaja-input {margin: 0px 0px 16px 0px;}.donasiaja-input input, .donasiaja-input textarea { color: #475666;font-family: "Roboto", sans-serif;outline: 0;background: #ffffff;width: 100%;padding: 15px;box-sizing: border-box;font-size: 14px;border: 1px solid #e5e8ec !important;border-radius: 4px;transition: all 0.2s ease;}.donasiaja-input input[type="text"], .donasiaja-input input[type="number"], .donasiaja-input input[type="tel"], .donasiaja-input input[type="email"] {height: 50px;}.donasiaja-input input:visited, .donasiaja-input input:focus, .donasiaja-input textarea:visited, .donasiaja-input textarea:focus {border: 1px solid #719ECA !important;}.donasiaja-input.anonim {padding-top: 5px;padding-bottom: 10px;}.donasiaja-input.comment {padding-top: 0px;margin-top: -10px;}.donasiaja-input .donation_button_now {margin-top: 5px;margin-bottom: 10px;height: 50px;}.donasiaja-input .choose_payment {/*background: #c5e8ff;*/background: #fff;color: #719eca;font-size: 12px;padding: 6px 10px 0px 12px;width: 60px;text-align: center;height: 24px;float: right;border-radius: 4px;border: 1px solid #719eca;cursor: pointer;transition: all 0.4s ease;margin-top: -5px;}.donasiaja-input .choose_payment:hover {background: #edf8ff;}.donasiaja-input.payment {background: #edf7ff;border: none;padding: 28px 12px;border-radius: 4px;margin-bottom: 25px;}.donasiaja-input.payment img.img_payment_selected {position: absolute;width: 70px;border: 1px solid #719eca;border-radius: 4px;margin-top: -9px;padding: 2px 5px;background: #fff;}.donasiaja-input.payment .title_payment.selected {margin-left: 99px;text-transform: capitalize:}.anonim .toggle1 {background: #DDD;width: 60px;height: 25px;border-radius: 100px;display: block;appearance: none;-webkit-appearance: none;position: relative;cursor: pointer;float: right;margin-top: -5px;}.anonim .toggle1:after {content: "";background: #999;display: block;height: 30px;width: 30px;border-radius: 100%;position: absolute;left: 0px;transform: scale(0.9);cursor: pointer;transition: all 0.4s ease;margin-top: -15px;}.anonim .toggle1:checked {background: #C5E8FF;border: 1px solid #acdeff !important;}.anonim .toggle1:checked:after {background: #09F;left: 28px;}.comment textarea {margin-top: 10px;line-height: 1.2;}/*card radio */.card-group{margin-top: 15px;min-height: 175px;}.donasiaja-input .card-body {display: flow-root;}.card-radio-btn input[type="radio"] {display: none;opacity: 0;width: 0;}.card-radio-btn .content_head {color: #333;font-size: 16px;line-height: 30px;font-weight: 500;}.card-radio-btn .content_sub {color: #9e9e9e;font-size: 11px;}.card-radio-btn .content_head.no_desc {padding-top: 9px;}.card-radio-btn .content_sub.no_desc {display: none;}.card-input-element + .card {width: 28%;height: 55px;margin:2%;justify-content: center;color: var(--primary);-webkit-box-shadow: none;box-shadow: none;border: 2px solid transparent;border-radius: 10px;text-align: center;-webkit-box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);float: left;padding-top: 5px;}.other_nominal_value input {text-align: right;font-size: 24px;font-weight: bold;color: #23374d;}.other_nominal_value.hide_input {display: none;}.other_nominal_value .currency {position: absolute;margin-top: -37px;margin-left: 15px;font-weight: bold;font-size: 18px;color: #719eca;}.other_nominal_value input::-webkit-input-placeholder {font-size: 16px;font-weight: normal;}.other_nominal_value input:-moz-placeholder {font-size: 16px;font-weight: normal;}.other_nominal_value input::placeholder {font-size: 16px;font-weight: normal;margin-top: -4px;}.donasiaja-input .filled {border: 1px solid #C6D5E3 !important;}.card-input-element + .card:hover {cursor: pointer;}.card-input-element:checked + .card {border: 2px solid #719eca;-webkit-transition: border 0.3s;-o-transition: border 0.3s;transition: border 0.3s;}.card-input-element:checked + .card .box-checklist {text-align: right;padding-right: 4px;margin-top: -47px;}.card-input-element:checked + .card .box-checklist.no_desc {text-align: right;padding-right: 4px;margin-top: -42px;}.card-input-element:checked + .card .box-checklist .checklist::after {content: "✓";color: rgb(255, 255, 255);font-style: normal;font-size: 10px;font-weight: 900;line-height: 1;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;-webkit-animation-name: fadeInCheckbox;animation-name: fadeInCheckbox;-webkit-animation-duration: 0.3s;animation-duration: 0.3s;-webkit-animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);background: #719eca;padding: 2px 4px;border-radius: 12px;}#popup_payment {/*width: 520px !important;*/}@-webkit-keyframes fadeInCheckbox {from {opacity: 0;-webkit-transform: rotateZ(-20deg);}to {opacity: 1;-webkit-transform: rotateZ(0deg);}}@keyframes fadeInCheckbox {from {opacity: 0;transform: rotateZ(-20deg);}to {opacity: 1;transform: rotateZ(0deg);}}/*card payment method*/.card_payment {/*width: 370px;*/max-width: 100%;background-color: #fff;padding-top: 1.5rem;}.card-title {width: 100%;margin-top: 0;text-align: center;}.title-list {background: #EDF7FF;border: none !important;}.card-title2 {width: 100%;margin:0;text-align: left;font-size: 14px;color: #485c71;font-weight: bold;}.card-label {display: flex;align-items: center;/*width: 100%;*/height: 50px;border-top: 1px solid #d7d7d7;padding: 0 2rem;cursor: pointer;}.card-icon {max-width: 3rem;margin-right: 2.5em;text-align: center;}.card-icon svg {width: 100%;}.card-text {/*color: lightgray;*/color: #3f4e5e;}.card-radio {display: none;margin-left: auto;}.card-radio:checked ~ .card-text {/*color: inherit;*/color: #09F;font-weight: bold;}.card-radio:checked ~ .card-check {display: inline-block;}.card-check {display: none;margin-left: auto;}.card-button {background-color: transparent;border: none;cursor: pointer;outline: none;padding: 0;-webkit-appearance: none;-moz-appearance: none;appearance: none;display: block;width: 100%;height: 50px;background-color: #598bdd;color: #fff;text-transform: uppercase;letter-spacing: 0.1em;}.card-button:hover {background-color: #6191df;}.box-char {text-align: right;font-size: 11px;}.donate_now {position: fixed;bottom: 0;width: 481px;margin-bottom: 0;}.donate_now .donation_button_now2 {width: 100%;}.img-box {width: 89%;padding: 80px 20px 20px 25px;min-height: 100px;}.img-box img {width: 160px;display: inline-block;position: absolute;border-radius: 4px;box-shadow: 0 8px 12px 0 rgba(0, 0, 0, 0.2);}.img-box span {font-size: 12px;margin-left: 180px;color: #aabdce;}.img-box h1 {font-size: 16px;margin-left: 180px;}@media only screen and (max-width:480px) {#login_section {margin-left: 20px;margin-right: 20px;}}
			.lds-ellipsis {   display: inline-block;   position: relative;   width: 80px;   height: 80px; } .lds-ellipsis div {   position: absolute;   top: 33px;   width: 13px;   height: 13px;   border-radius: 50%;   background: #efedfb;   animation-timing-function: cubic-bezier(0, 1, 1, 0); } .lds-ellipsis div:nth-child(1) {   left: 8px;   animation: lds-ellipsis1 0.6s infinite; } .lds-ellipsis div:nth-child(2) {   left: 8px;   animation: lds-ellipsis2 0.6s infinite; } .lds-ellipsis div:nth-child(3) {   left: 32px;   animation: lds-ellipsis2 0.6s infinite; } .lds-ellipsis div:nth-child(4) {   left: 56px;   animation: lds-ellipsis3 0.6s infinite; } @keyframes lds-ellipsis1 {   0% {     transform: scale(0);   }   100% {     transform: scale(1);   } } @keyframes lds-ellipsis3 {   0% {     transform: scale(1);   }   100% {     transform: scale(0);   } } @keyframes lds-ellipsis2 {   0% {     transform: translate(0, 0);   }   100% {     transform: translate(24px, 0);   } }
			.loading-section {float: right;height: 0;margin-top: -95px;display: none;}
			.password-wrapper{position:relative}.password-wrapper .form-control{padding-right:40px}.toggle-password{position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;user-select:none;display:flex;align-items:center;justify-content:center}.icon-eye{width:20px;height:20px;opacity:.7}.toggle-password:hover .icon-eye{opacity:1}.hidden{display:none}


	</style>
</head>
<body>
	
	<div id="login_section" class="section-box" style="border-radius:12px;padding:40px 40px 60px 40px;background: url('<?php echo plugin_dir_url( __FILE__ ).'assets/images/bg2.png'; ?>') no-repeat, #fff;margin-top: 30px;">
		<div class="donasiaja-box" style="margin-bottom: 10px;margin-top: 10px;"><a href="<?php echo $home_url; ?>" target="_self"><img alt="Donasi Aja" class="" src="<?php echo $logo_url; ?>" style="width: 120px;border-radius: 4px;"></a></div>

			<div class="title" style="margin-bottom: 30px;">
				<h1>Login</h1>
				<p style="color: #8399a6;margin-top: -8px;"><?php echo $login_text; ?></p>
				<div class="loading-section"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>
			</div>
			<div class="form-group" id="form-group">
				<div class="donasiaja-input">
					<input id="email" placeholder="Email / Username" type="text" class="form-control" name="email" value="">
				</div>
				<div class="donasiaja-input password-wrapper">
					<input id="password" placeholder="Password" type="password" class="form-control" name="password" value="" style="height:50px;">
					<span class="toggle-password" id="togglePassword" aria-label="Show password" role="button">
					<!-- Mata terbuka -->
					<svg class="icon-eye icon-eye-open hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12c-2.76 0-5-2.24-5-5
						s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/>
					</svg>

					<!-- Mata tertutup (ada garis) -->
					<svg class="icon-eye icon-eye-closed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<path d="M2.81 2.81L1.39 4.22 4.3 7.13C3.05 8.06 2.06 9.23 1.34 10.5
						2.94 13.43 7 17 12 17c1.52 0 2.96-.3 4.28-.84l3.5 3.5 1.41-1.41L2.81 2.81zM12 15
						c-2.21 0-4-1.79-4-4 0-.46.08-.9.23-1.31l1.54 1.54A1.99 1.99 0 0010 11
						c0 1.1.9 2 2 2 .22 0 .43-.04.63-.1l1.54 1.54c-.41.15-.85.23-1.17.23zM9.37 5.51
						C10.23 5.19 11.1 5 12 5c5 0 9.06 3.57 10.66 6.5-.7 1.31-1.71 2.53-2.96 3.53l-3.16-3.16
						c.29-.59.46-1.25.46-1.96 0-2.21-1.79-4-4-4-.71 0-1.37.17-1.96.46L9.37 5.51z"/>
					</svg>
				</span>
				</div>
				<div class="donasiaja-input" style="margin-top: 40px;">
				<button class="donation_button_now" id="login_now" style="background:<?php echo $button_color;?>;border-color:<?php echo $button_color;?>">Sign In</button>
				</div>

				<?php if($register_setting=='1'){ ?>
		<p style="color: #8399a6;text-align: center;padding-top:20px;margin-bottom:-10px;">Belum punya akun?<a href="<?php echo $home_url; ?>/<?php echo $page_register; ?>" target="_self" style="padding-left: 10px;text-decoration: none;color: <?php echo $button_color;?>;">Register di sini</a></p>
		<?php } ?>

			</div>
	</div>

	<div class="section-box box-powered" style="box-shadow: none;background: transparent;">
		<?php if($changepass_setting=='1'){ ?>
		<p style="color: #9aabc8;margin-top: -8px;text-align: center;padding-top: 30px;">Lupa Password?<br><a href="<?php echo $home_url; ?>/changepass" target="_self" style="text-decoration: none;color: #1c75ba;">Ubah Password di sini</a></p>
		<?php } ?>

		<?php if($register_setting=='1'){ /* ?>
		<p style="color: #9aabc8;margin-top: -8px;text-align: center;padding-top: 30px;">Belum punya akun?<br><a href="<?php echo $home_url; ?>/<?php echo $page_register; ?>" target="_self" style="text-decoration: none;color: #1c75ba;">Register disini</a></p>
		<?php */ } ?>

		<?php if($register_setting=='1'){ /* ?>
				<p style="color: #9aabc8;margin-top: -8px;text-align: center;padding-top: 30px;">Belum punya akun?<br></p>
		
				<div class="donasiaja-input" style="margin-top: 40px;">
				<button class="donation_button_now" style="background:none;border-color:#acb2ca;color:<?php echo $button_color;?>;">Register</button>
				</div>
				<?php */ } ?>

		<?php if($powered_by_setting=='1'){ ?>
		<div class="powered-donasiaja-box"><a href="https://donasiaja.id" target="_blank"><img alt="Donasi Aja" class="powered-donasiaja-img" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donasiaja.ico'; ?>">Powered by DonasiAja</a></div>
		<?php } ?>
	</div>
	<div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/jquery.min.js';?>"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/donasiaja.min.js';?>"></script>
	<script>

	jQuery(document).ready(function($) {

		$("#login_now").bind("click", function(){
			
			var email = $('#email').val();
			var password = $('#password').val();

			if(email=='' || password==''){
				var message = "Maaf, silahkan isi semua field!";
				var status = "danger";
				var timeout = 3000;
				createAlert(message, status, timeout);
				return false;
			}
			$('.loading-section').show();

			var data_nya = [email, password];
		    var data = {
		        "action": "djafunction_login_user",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {

		    	$('.loading-section').hide();

		    	if(response=='email_failed'){
					var message = "Maaf, login gagal! Periksa kembali email dan password anda.";
					var status = "danger";
					var timeout = 3000;
					createAlert(message, status, timeout);
					return false;
				}else if(response=='phone_failed'){
					var message = "Maaf, login gagal! Periksa kembali phone number dan password anda.";
					var status = "danger";
					var timeout = 3000;
					createAlert(message, status, timeout);
					return false;
				}else if(response=='username_failed'){
					var message = "Maaf, login gagal! Periksa kembali username dan password anda.";
					var status = "danger";
					var timeout = 3000;
					createAlert(message, status, timeout);
					return false;
				}else if(response=='not_allowed'){
					var message = "Not Allowed!";
					var status = "danger";
					var timeout = 3000;
					createAlert(message, status, timeout);
					return false;
				}else{
					var new_response = "<?php echo $home_url; ?>"+response;
					var redirectWindow = window.open(new_response, "_self");
	                redirectWindow.location;
				}


		    });
		    
		});

	});

	document.addEventListener('DOMContentLoaded', function () {
		const passwordInput  = document.getElementById('password');
		const togglePassword = document.getElementById('togglePassword');

		if (passwordInput && togglePassword) {
			const eyeOpen   = togglePassword.querySelector('.icon-eye-open');   // mata kebuka
			const eyeClosed = togglePassword.querySelector('.icon-eye-closed'); // mata ketutup garis

			togglePassword.addEventListener('click', function () {
				const isPassword = passwordInput.getAttribute('type') === 'password';

				// Ganti tipe input
				passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

				// Sekarang logika icon dibalik:
				// - Kalau sedang TAMPIL (type = text) -> icon mata KEBUKA
				// - Kalau sedang DISENSOR (type = password) -> icon mata KETUTUP GARIS
				if (isPassword) {
					// Baru diubah jadi text → tampilkan mata kebuka
					eyeOpen.classList.remove('hidden');
					eyeClosed.classList.add('hidden');
					togglePassword.setAttribute('aria-label', 'Hide password');
				} else {
					// Baru diubah jadi password → tampilkan mata tertutup
					eyeOpen.classList.add('hidden');
					eyeClosed.classList.remove('hidden');
					togglePassword.setAttribute('aria-label', 'Show password');
				}
			});
		}
	});

		
	</script>
</body>
</html>


