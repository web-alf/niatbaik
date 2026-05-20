<?php

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_users";
    $table_name2 = $wpdb->prefix . "dja_settings";
    $table_name3 = $wpdb->prefix . "dja_donate";
    $table_name4 = $wpdb->prefix . "dja_campaign";
    $table_name5 = $wpdb->prefix . "options";
    $table_name6 = $wpdb->prefix . "dja_users";

	if (isset($_GET['inv'])) {
		$invoice_id = $_GET['inv'];
	}else{
		$invoice_id = $donasi_id;
	}
	
	// Data Donasi
	$donation = $wpdb->get_results('SELECT a.*, b.title, b.slug from '.$table_name3.' a 
    left JOIN '.$table_name4.' b ON b.campaign_id = a.campaign_id where a.invoice_id="'.$invoice_id.'" ')[0];
	if($donation==null){
		wp_redirect( get_site_url() );
		exit;
	}

	$nama = '-';
	$whatsapp = '-';
	$email = '-';
	$alamat = '-';

	if($donation->name!=''){
		$nama = $donation->name;
	}
	if($donation->whatsapp!=''){
		$whatsapp = $donation->whatsapp;
	}
	if($donation->email!=''){
		$email = $donation->email;
	}

	$metode_transaksi = strtoupper(str_replace("instant", "e-wallet", $donation->payment_method)).' '.strtoupper(str_replace("_", " ", $donation->payment_code));

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

	$qr_link = get_site_url().'/ekuitansi/'.$invoice_id;

	// Data USer admin
	$profile = $wpdb->get_results('SELECT *, user_pp_img as photo from '.$table_name6.' where user_id="1"');

	// Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name2.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');

    $show_currency = donasiaja_currency($currency);
    $show_currency2 = donasiaja_currency2($currency);

	$datenya = new DateTime($donation->created_at);
	$m = $datenya->format('F');

    if (strpos($m, 'January') !== false ) { $m = 'Januari'; }
    elseif(strpos($m, 'February') !== false ) { $m = 'Februari'; }
    elseif(strpos($m, 'March') !== false ) { $m = 'Maret'; }
    elseif(strpos($m, 'April') !== false ) { $m = 'April'; }
    elseif(strpos($m, 'May') !== false ) { $m = 'Mei'; }
    elseif(strpos($m, 'June') !== false ) { $m = 'Juni'; }
    elseif(strpos($m, 'July') !== false ) { $m = 'Juli'; }
    elseif(strpos($m, 'August') !== false ) { $m = 'Agustus'; }
    elseif(strpos($m, 'September') !== false ) { $m = 'September'; }
    elseif(strpos($m, 'October') !== false ) { $m = 'Oktober'; }
    elseif(strpos($m, 'November') !== false ) { $m = 'Nopember'; }
    elseif(strpos($m, 'December') !== false ) { $m = 'Desember'; }
    else{}

    $date_donation = $datenya->format('d').'&nbsp;'.$m.'&nbsp;'.$datenya->format('Y').' - '.$datenya->format('H').':'.$datenya->format('i').' WIB';
	
	$nominal_donasi = number_format_currency($donation->nominal);
	if($nominal_donasi == '' || $nominal_donasi == null){
		$nominal_donasi = '0';
	}

	if($donation->info_donate!=null && $donation->info_donate!='[]') { 

		$info_donate = json_decode($donation->info_donate, true);
		$count_qurban = 0;
	    foreach ( $info_donate as $key => $value ) {
	    	if(strpos(strtolower($key), 'alamat') !== false){
	    		$alamat = $value;
	    	}
	    }

	}

?>

<html>
	<head>
		<meta charset="UTF-8">
	    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	    <title>Kuitansi <?php if (strpos(strtolower($donation->title), 'wakaf') !== false ) { echo 'WAKAF';}else{echo'ZIS';}?> / <?php echo $nama; ?> / <?php echo $donation->invoice_id; ?></title>
		<style>@page { size: A4 }</style>
		<style>		
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

		body {
	        width: 100%;
	        height: 100%;
	        margin: 0;
	        padding: 0;
	        background-color: #FAFAFA;
	        font: 12pt "Tahoma";
	    }
	    * {
	        box-sizing: border-box;
	        -moz-box-sizing: border-box;
	    }
	    .page {
	        width: 210mm;
	        min-height: 297mm;
	        margin: 10mm auto;
	        border: 1px #D3D3D3 solid;
	        border-radius: 5px;
	        background: white;
	        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
	    }
	    .subpage {
	        border: 5px transparent solid;
	        height: 257mm;
	    }
	    
	    @page {
	        size: A4;
	        margin: 0;
	    }
	    @media print {
	        html, body {
	            width: 210mm;
	            height: 297mm;        
	        }
	        .page {
	            margin: 0;
	            border: initial;
	            border-radius: initial;
	            width: initial;
	            min-height: initial;
	            box-shadow: initial;
	            background: initial;
	            page-break-after: always;
	        }
	    }

	    footer {
		    border-top: 1px solid #eeeeee;;
		    padding: 15px 20px;
		}
		.effect2
		{
		  position: relative;
		}

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
			background: #222;
		}
		span.finder-dot {
			background: #222;
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
			background: #fff;
		}
		tr td {
			font-size: 15px;
			vertical-align: top;
		}
		tr td.content {
			font-weight: 800; font-style: normal;
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
	<div id="invoiceholder" style="width: 21cm;height: 29.7cm;margin:0 auto;padding:0;">

		<div class="book">
		    <div class="page">
			    
			    <div class="subpage" style="text-align: center;">

			        <?php if (strpos(strtolower($donation->title), 'wakaf') !== false ) { ?>
			        <img style="width: 100%;border-radius: 4px;" src="https://res.cloudinary.com/dnxwdyrjq/image/upload/v1741662543/bg_kuitansi_wakaf_odkeiw.jpg" />
				    <?php }else { ?>
				    <img style="width: 100%;border-radius: 4px;" src="https://res.cloudinary.com/dnxwdyrjq/image/upload/v1742880297/bg_kuitansi_zis_dfqma5.jpg" />
				    <?php } ?>


				    <div style="position: absolute; width: 207mm;margin-top:-250mm">
				        <table style="width: 162mm;margin-top: 14mm;margin-left:30mm;line-height:6.5mm;color:#2C2E35;">
				        	<tr><td style="width: 55mm;">ID Transaksi</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $donation->invoice_id; ?></b></td></tr>
				        	<tr><td style="width: 50mm;">Tanggal transaksi</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $date_donation; ?></b></td></tr>
				        	
				        	<tr><td style="width: 50mm;"></td><td style="width:7mm;"></td><td>&nbsp;</td></tr>
				        	
				        	<tr><td style="width: 50mm;">Nama</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $nama; ?></b></td></tr>
				        	<tr><td style="width: 50mm;">Email</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $email; ?></b></td></tr>
				        	<tr><td style="width: 50mm;">No. HP</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $whatsapp; ?></b></td></tr>
				        	<tr><td style="width: 50mm;">Metode Transaksi</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $metode_transaksi; ?></b></td></tr>
				        	
				        	<tr><td style="width: 50mm;"></td><td style="width:7mm;"></td><td>&nbsp;</td></tr>
				        	
				        	<tr><td style="width: 50mm;">Program Donasi</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $donation->title; ?></b></td></tr>
				        	<tr><td style="width: 50mm;">Total Donasi</td><td style="width:7mm;">:</td><td class="content"><b><?php echo $show_currency2.$nominal_donasi;?></b><br>(<?php echo ucwords(angka_terbilang($donation->nominal)).$value_currency; ?> )</td></tr>
				        </table>
				    </div>

				    <?php if (strpos(strtolower($donation->title), 'wakaf') !== false ) { ?>
			        <div class="col-right" style="text-align: right;position: absolute;margin-top: -440px;margin-left: 103px;">
			        	<a href="<?php echo $qr_link; ?>" target="_blank"><div class="container" id="qrcode-container-html"></div></a>
			        </div>
				    <?php } else{ ?>
				    <div class="col-right" style="text-align: right;position: absolute;margin-top: -463px;margin-left: 103px;">
			        	<a href="<?php echo $qr_link; ?>" target="_blank"><div class="container" id="qrcode-container-html"></div></a>
			        </div>
				    <?php } ?>

				</div>
			</div>
		</div>

	</div><!-- End Invoice Holder-->

	
	<script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/zoom/medium-zoom.min.js"></script>
	<script type="module">
		import {
			QRCode, QROptions, OUTPUT_MARKUP_HTML, IS_DARK,
			M_DATA, M_FINDER, M_FINDER_DOT, M_ALIGNMENT, M_TIMING, M_FORMAT,
			M_VERSION, M_DARKMODULE, M_SEPARATOR, M_QUIETZONE
		} from '<?php echo plugin_dir_url( __FILE__ ); ?>../plugins/qr/index.js';

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