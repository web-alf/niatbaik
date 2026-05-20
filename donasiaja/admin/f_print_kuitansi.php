<?php

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_users";
    $table_name2 = $wpdb->prefix . "dja_settings";
    $table_name3 = $wpdb->prefix . "dja_donate";
    $table_name4 = $wpdb->prefix . "dja_campaign";
    $table_name5 = $wpdb->prefix . "options";
    $table_name6 = $wpdb->prefix . "dja_users";

    // $id_login = wp_get_current_user()->ID;
    // if($id_login==null){
    // 	echo 'You are not allowed.';
    // 	die;
    // }

	if (isset($_GET['inv'])) {
		$invoice_id = $_GET['inv'];
	}else{
		$invoice_id = $donasi_id;
	}

	// role
    $cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
    $roles = array_keys((array)$cap);
    $role = $roles[0];

    $id_login = wp_get_current_user()->ID;

    // Data Donasi
	if($role=='administrator'){
		$donation = $wpdb->get_results('SELECT a.*, b.title, b.slug from '.$table_name3.' a 
	    left JOIN '.$table_name4.' b ON b.campaign_id = a.campaign_id where a.invoice_id="'.$invoice_id.'" ')[0];
	}else{
		$donation = $wpdb->get_results('SELECT a.*, b.title, b.slug from '.$table_name3.' a 
	    left JOIN '.$table_name4.' b ON b.campaign_id = a.campaign_id where a.invoice_id="'.$invoice_id.'" and a.user_id="'.$id_login.'" ')[0];
	}
	
	if($donation==null){
		wp_redirect( get_site_url() );
		exit;
	}

	// Data Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name2.' where type="logo_url" or type="app_name" or type="page_typ" or type="theme_color" or type="currency" ORDER BY id ASC');
    $logo_url 		= $query_settings[0]->data;
    $app_name 		= $query_settings[1]->data;
    $page_typ 			 = $query_settings[2]->data;
    $general_theme_color = json_decode($query_settings[3]->data, true);
    $currency			 = $query_settings[4]->data;

    $theme_color 		= $general_theme_color['color'][0];
	$progressbar_color  = $general_theme_color['color'][1];
	$button_color 		= $general_theme_color['color'][2];

	if($button_color==''){
		$button_color = '#dc2f6a';
	}
	if($theme_color==''){
        $theme_color = '#000';
    }

	if($currency=='IDR'){
    	$value_currency = ' Rupiah';
    }elseif($currency=='MYR'){
    	$value_currency = ' Ringgit';
    }else{
    	$value_currency = ' Rupiah';
    }

	// GET URL WEB
	$row = $wpdb->get_results('SELECT option_value from '.$table_name5.' where option_name="siteurl"');
	$row = $row[0];

    $protocols = array('http://', 'http://www.', 'www.', 'https://', 'https://www.');
	$server = str_replace($protocols, '', $row->option_value);

	$qr_link = get_site_url().'/campaign/'.$donation->slug.'/'.$page_typ.'/'.$invoice_id;

	// Data USer admin
	$profile = $wpdb->get_results('SELECT *, user_pp_img as photo from '.$table_name6.' where user_id="1"');

	// Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name2.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');

    $show_currency = donasiaja_currency($currency);
    $show_currency2 = donasiaja_currency2($currency);

    $alamat = '-';
    if($donation->info_donate!=null && $donation->info_donate!='[]') { 

		$info_donate = json_decode($donation->info_donate, true);
		$count_qurban = 0;
	    foreach ( $info_donate as $key => $value ) {
	    	if(strpos(strtolower($key), 'alamat') !== false){
	    		$alamat = $value;
	    	}
	    }

	}

	if($alamat == ''){$alamat = '-';}

?>

<html>
	<head>
		<title><?php echo $app_name; ?> - <?php echo get_langArray('kuitansi_title');?> <?php echo $invoice_id; ?></title>
		<!-- Normalize or reset CSS with your favorite library -->
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.css">
		<style>@page { size: A4 }</style>
		<style>
		@import url(https://fonts.googleapis.com/css?family=Roboto:100,300,400,900,700,500,300,100);
		*{
		  margin: 0;
		  box-sizing: border-box;
		  -webkit-print-color-adjust: exact;
		}
		@media print {

		  html, body {
		    height:100%; 
		    margin: 0 !important; 
		    padding: 0 !important;
		    overflow: hidden;
		  }

		}

		body{
		  background: #E0E0E0;
		  font-family: 'Roboto', sans-serif;
		}
		.clearfix::after {
		    content: "";
		    clear: both;
		    display: table;
		}
		.col-left {
		    float: left;
		}
		.col-right {
		    float: right;
		}
		h1{
		  font-size: 1.5em;
		  color: #444;
		}
		h2{font-size: .9em;}
		h3{
		  font-size: 1.2em;
		  font-weight: 300;
		  line-height: 2em;
		}
		p{
		  font-size: .75em;
		  color: #444;
		  line-height: 1.2em;
		}
		a {
		    text-decoration: none;
		    color: #00a63f;
		}

		#invoiceholder{
		  width:100%;
		  height: 100%;
		  padding: 20px 20px;
		}

		#invoice{
		  position: relative;
		  margin: 0 auto;
		  background: #FFF;
		  border-radius: 3px;
		  margin-bottom: 20px;
		}

		[id*='invoice-']{
		  padding: 30px;
		}

		#invoice-top{border-bottom: 2px solid <?php echo $theme_color; ?>;}
		#invoice-mid{min-height: 110px;}
		#invoice-bot{ min-height: 240px;}

		.logo{
		    display: inline-block;
		    vertical-align: middle;
		    overflow: hidden;
		}
		.info{
		    display: inline-block;
		    vertical-align: middle;
		    margin-left: 20px;
		}
		.logo img {
			width: 60px !important;
		}
		.logo img,
		.clientlogo img {
		    width: 100%;
		}
		.clientlogo{
		    display: inline-block;
		    vertical-align: middle;
			width: 50px;
		}
		.clientinfo {
		    display: inline-block;
		    vertical-align: middle;
		    margin-left: 20px
		}
		.title{
		  float: right;
		}
		.title p{text-align: right;}
		#message{margin-bottom: 30px; display: block;}
		h2 {
		    margin-bottom: 5px;
		    color: #444;
		}
		.col-right td {
		    color: #666;
		    padding: 5px 8px;
		    border: 0;
		    font-size: 0.75em;
		    border-bottom: 1px solid #eeeeee;
		}
		.col-right td label {
		    margin-left: 5px;
		    font-weight: 600;
		    color: #444;
		}
		.cta-group a {
		    display: inline-block;
		    padding: 7px;
		    border-radius: 4px;
		    background: rgb(196, 57, 10);
		    margin-right: 10px;
		    min-width: 100px;
		    text-align: center;
		    color: #fff;
		    font-size: 0.75em;
		}
		.cta-group .btn-primary {
		    background: #00a63f;
		}
		.cta-group.mobile-btn-group {
		    display: none;
		}
		table{
		  width: 100%;
		  border-collapse: collapse;
		}
		td{
		    padding: 10px;
		    border-bottom: 1px solid #cccaca;
		    font-size: 0.70em;
		    text-align: left;
		}

		.tabletitle th {
		  border-bottom: 2px solid #ddd;
		  text-align: right;
		}
		.tabletitle th:nth-child(2) {
		    text-align: left;
		}
		th {
		    font-size: 0.7em;
		    text-align: left;
		    padding: 5px 10px;
		}
		.item{width: 50%;}
		.list-item td {
		    text-align: right;
		}
		.list-item td:nth-child(2) {
		    text-align: left;
		}
		.total-row th,
		.total-row td {
		    text-align: right;
		    font-weight: 700;
		    font-size: .75em;
		    border: 0 none;
		}
		.table-main {
		    
		}
		footer {
		    border-top: 1px solid #eeeeee;;
		    padding: 15px 20px;
		}
		.effect2
		{
		  position: relative;
		}

	</style>

	<style>
		/* wrapper - css class specified with QROptions.cssClass */
		div.qr{
			margin: 0em;
		}

		/* rows */
		div.qr > div {
			height: 3px;
		}

		/* modules */
		div.qr > div > span {
			display: inline-block;
			width: 3px;
			height: 3px;
		}

		/* default values specified with QROptions.markupDark and QROptions.markupLight*/
		span.dark{
			background: #000;
		}
		span.light{
			background: #fff;
		}

		/* custom module values */
		span.data {
			background: #fff;
		}
		span.data-dark {
			background: #000;
		}
		span.finder {
			background: #fff;
		}
		span.finder-dark {
			background: <?php echo $theme_color; ?>;
		}
		span.finder-dot {
			background: <?php echo $theme_color; ?>;
		}
		span.alignment {
			background: #fff;
		}
		span.alignment-dark {
			background: #000;
		}
		span.timing {
			background: #fff;
		}
		span.timing-dark {
			background: #000;
		}
		span.format {
			background: #fff;
		}
		span.format-dark {
			background: #000;
		}
		span.version {
			background: #fff;
		}
		span.version-dark {
			background: #000;
		}
		span.darkmodule {
			background: #080063;
		}
		span.separator {
			background: #fff;
		}
		span.quietzone {
			background: #F2F2F2;
		}
	</style>


	</head>

	<?php 

	$datenya = new DateTime($donation->created_at);
    $date_donation = $datenya->format('d').'&nbsp;'.$datenya->format('M').'&nbsp;'.$datenya->format('Y').'&nbsp;-&nbsp;'.$datenya->format('H').':'.$datenya->format('i');

	?>

	<!-- Set "A5", "A4" or "A3" for class name -->
	<!-- Set also "landscape" if you need -->
	<body class="A4" onload="window.print()">
	<!-- <body class="A4"> -->

	<div id="invoiceholder">
	  	<div id="invoice" class="effect2" style="border:1px solid #E0E0E0;">
	    <div id="invoice-top" style="background: url('<?php echo plugin_dir_url( __FILE__ ).'../assets/images/bg6.png'; ?>') no-repeat, #fff;background-position-x: right;">
	      <div class="logo"><img alt="Donasi Aja" class="" src="<?php echo $logo_url; ?>" style="border-radius:4px;margin-bottom: 10px;">
	      	<h2 style="position: absolute;margin-top: -60px;margin-left: 85px;font-size: 21px;"><?php echo $app_name; ?></h2>
	      	<h2 style="position: absolute;margin-top: -32px;margin-left: 85px;font-size: 16px;color:#acacac;"><?php echo $server; ?></h2>
	      </div>
	      <div class="title">
	      	
	        <p style="font-size: 21px;margin: 0;padding: 0;font-style: italic;font-weight: bold;color: #e32999;">E-<?php echo get_langArray('kuitansi_title');?></p>
	        <h1 style="margin-top:5px;margin-bottom:5px;font-size:21px;">#<span class="invoiceVal invoice_num"><?php echo $invoice_id; ?></span></h1>
	        
	      </div><!--End Title-->
	    </div><!--End InvoiceTop-->


	    
	    <div id="invoice-mid">
	    	<div class="clearfix">
	            <div class="col-right">
	                <p style="font-size: 13px;">Date: <span id="invoice_date"><b><?php echo $date_donation; ?></b></span></p><br>
	            </div>
	            
	        </div>  

	      <div id="message">
	        <h2 style="color:#ababab;"><?php echo get_langArray('kuitansi_label1');?></h2>
	        <p style="font-size: 16px;border-bottom: 1px solid #ccc; padding-bottom: 10px; padding-top: 10px;"><b><?php echo $donation->name ?> (<?php echo $donation->whatsapp ?>)</b></p>
	      </div>
	      <?php if (strpos(strtolower($donation->title), 'zakat') !== false ) { ?>
	      <div id="message">
	        <h2 style="color:#ababab;"><?php echo get_langArray('kuitansi_label4');?></h2>
	        <p style="font-size: 16px;border-bottom: 1px solid #ccc; padding-bottom: 10px; padding-top: 10px;"><b><?php echo $alamat ?></b></p>
	      </div> 
		  <?php } ?>
	      <div id="message">
	        <h2 style="color:#ababab;"><?php echo get_langArray('kuitansi_label2');?></h2>
	        <p style="font-size: 16px;border-bottom: 1px solid #ccc; padding-bottom: 10px; padding-top: 10px;"><b><i><?php echo ucwords(angka_terbilang($donation->nominal)).$value_currency; ?></i></b></p>
	      </div>
	      <div id="message">
	        <h2 style="color:#ababab;">Untuk Program</h2>
	        <p style="font-size: 18px;border-bottom: 1px solid #ccc; padding-bottom: 10px; padding-top: 10px;"><b><?php echo $donation->title; ?></b></p>
	      </div>
	      

	       	<div class="cta-group mobile-btn-group">
	            <a href="javascript:void(0);" class="btn-primary">Approve</a>
	            <a href="javascript:void(0);" class="btn-default">Reject</a>
	        </div> 
	        <div class="clearfix">
	            <div class="col-left">
	                <!-- <div class="clientinfo"> -->
	                    <p style="font-size: 21px;font-weight: bold;color: #fff;background:#444;margin: 20px;display: inline-block;transform: skewX(-10deg); padding: 10px 20px;margin-left: 5px;border: 1px solid #444;"><?php echo $show_currency2.number_format_currency($donation->nominal)?></p>
	                    <?php if($donation->status=='1'){ ?>
	                    <p style="font-size: 21px;font-weight: bold;color: #fff;background:#00A63F;margin: 20px;display: inline-block;transform: skewX(-10deg); padding: 10px 20px;margin-left:-21px;border: 1px solid #00A63F; ?>;"><?php echo get_langArray('kuitansi_label3');?></p>
		                <?php } else{ ?>
		                <p style="font-size: 21px;font-weight: bold;color: #fff;background:#FF8300;margin: 20px;display: inline-block;transform: skewX(-10deg); padding: 10px 20px;margin-left:-21px;border: 1px solid #FF8300; ?>;">BELUM <?php echo get_langArray('kuitansi_label3');?></p>
		                <?php } ?>
	                <!-- </div> -->
	            </div>

	            <div class="col-right" style="text-align: right;">
	            	<a href="<?php echo $qr_link; ?>" target="_blank"><div class="container" id="qrcode-container-html"></div></a>
	            	<p class="col-left" style="padding: 5px 10px;">Please scan to validate this Invoice #<?php echo $invoice_id; ?></p>
	                
	            </div>
	        </div>       
	    </div><!--End Invoice Mid-->
	    
	    <footer>
	      <div id="legalcopy" class="clearfix">
	        <p class="col-left" style="padding: 5px 10px;"><?php echo $app_name; ?> | <?php echo $profile[0]->user_alamat; ?> - <?php echo $profile[0]->user_kecamatan; ?>, <?php echo $profile[0]->user_kabkota; ?>, <?php echo $profile[0]->user_provinsi; ?></span>
	        </p>
	        <br>
	        <div class="container" id="qrcode-container-html"></div>
	      </div>
	    </footer>
	     
	  </div><!--End Invoice-->
	</div><!-- End Invoice Holder-->

	
	<script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/zoom/medium-zoom.min.js"></script>
	<script type="module">
	import {
		QRCode, QROptions, OUTPUT_MARKUP_HTML, IS_DARK,
		M_DATA, M_FINDER, M_FINDER_DOT, M_ALIGNMENT, M_TIMING, M_FORMAT,
		M_VERSION, M_DARKMODULE, M_SEPARATOR, M_QUIETZONE
	} from '<?php echo plugin_dir_url( __FILE__ ); ?>plugins/qr/index.js';

	let mv = {};

	// data
	mv[M_DATA]               = 'data';      // (false)
	mv[M_DATA|IS_DARK]       = 'data-dark'; // (true)
	// finder
	mv[M_FINDER]             = 'finder';
	mv[M_FINDER|IS_DARK]     = 'finder-dark';
	mv[M_FINDER_DOT|IS_DARK] = 'finder-dot';
	// alignment
	mv[M_ALIGNMENT]          = 'alignment';
	mv[M_ALIGNMENT|IS_DARK]  = 'alignment-dark';
	// timing
	mv[M_TIMING]             = 'timing';
	mv[M_TIMING|IS_DARK]     = 'timing-dark';
	// format
	mv[M_FORMAT]             = 'format';
	mv[M_FORMAT|IS_DARK]     = 'format-dark';
	// version
	mv[M_VERSION]            = 'version';
	mv[M_VERSION|IS_DARK]    = 'version-dark';
	// darkmodule
	mv[M_DARKMODULE|IS_DARK] = 'darkmodule';
	// separator
	mv[M_SEPARATOR]          = 'separator';
	// quietzone
	mv[M_QUIETZONE]          = 'quietzone';


	let options = new QROptions({
		outputType               : OUTPUT_MARKUP_HTML,
		version                  : 7,
		cssClass                 : 'qr',
		markupDark               : 'dark',
		markupLight              : 'light',
		moduleValues             : mv,
		eol                      : '',
		returnMarkupAsHtmlElement: true,
	});

	let qrcode = (new QRCode(options)).render('<?php echo $qr_link; ?>');

	document.getElementById('qrcode-container-html').appendChild(qrcode);
</script>
	  

	</body>




</html>