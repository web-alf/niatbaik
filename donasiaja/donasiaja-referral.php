<?php

	global $wpdb;
	global $wp;
    $table_name = $wpdb->prefix . "dja_campaign";
    $table_name2 = $wpdb->prefix . "dja_donate";
    $table_name3 = $wpdb->prefix . "dja_users";
    $table_name4 = $wpdb->prefix . "dja_love";
    $table_name5 = $wpdb->prefix . "dja_settings";
    $table_name6 = $wpdb->prefix . "dja_campaign_update";
    $table_name7 = $wpdb->prefix . "users";

    $table_name8 = $wpdb->prefix . "dja_aff_code";
    $table_name9 = $wpdb->prefix . "dja_aff_click";
    $table_name10 = $wpdb->prefix . "dja_aff_submit";

    // Check IP User
    check_blocked_ip();

    // Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name5.' where type="app_name" or type="theme_color" or type="powered_by_setting" or type="fundraiser_on" ORDER BY id ASC');
    $app_name	 = $query_settings[0]->data;
    $general_theme_color = json_decode($query_settings[1]->data, true);
    $powered_by_setting = $query_settings[2]->data;
    $fundraiser_on = $query_settings[3]->data;

    $theme_color 			= $general_theme_color['color'][0];
	$progressbar_color  	= $general_theme_color['color'][1];
	$button_color 			= $general_theme_color['color'][2];
	$button_color2 			= $general_theme_color['color'][3];

	if($theme_color==''){
    	$theme_color = '#009F61';
    }
    if($progressbar_color==''){
    	$progressbar_color = '#009F61';
    }

	$user_randid = $donasi_id;
	$home_url = get_site_url();

	if($fundraiser_on!='1'){
		wp_redirect( get_site_url() );
		exit;
	}


    // GET PROFILE PICTURE
	$get_user = $wpdb->get_results('SELECT ID from '.$table_name7.' where user_nicename="'.$user_randid.'"');
	if($get_user!=null){
		$id_usernya = $get_user[0]->ID;
		$profile = $wpdb->get_results('SELECT *, user_pp_img as photo from '.$table_name3.' where user_id="'.$id_usernya.'"');
	}else{
		$profile = $wpdb->get_results('SELECT *, user_pp_img as photo from '.$table_name3.' where user_randid="'.$user_randid.'"');
		
		if($profile==null){
    		wp_redirect( get_site_url() );
			exit;
		}
	}

	
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


	$user_info = get_userdata($profile[0]->user_id);
  	$fullname = $user_info->first_name.' '.$user_info->last_name;
  	$fullname = str_replace('\\', '', $fullname);

  	$id_usernya = $profile[0]->user_id;

  	
  	/*
  	$data_click = $wpdb->get_results("SELECT a.id, a.user_id, a.aff_code, b.id as id_click, b.created_at as date_click from $table_name8 a 
	            left JOIN $table_name9 b ON a.id = b.affcode_id
	            where a.user_id=$id_usernya
	            ORDER BY a.id DESC");

  	$no = 1;
  	foreach($data_click as $value){
  		echo $no.'. '.$value->id.' - '.$value->aff_code.' - '.$value->id_click.' - '.$value->date_click;
  		echo '<br>';
  		$no++;
  	}
  	print_r(COUNT($data_click));
  	ECHO '<br>';
  	*/

	$total_click_and_view = get_aff_stat('view',$id_usernya);
	$total_click_and_submit = get_aff_stat('submit',$id_usernya);
	$total_click_submit_and_success = get_aff_stat('paid',$id_usernya);


  	// Currency
  	$query_currency = $wpdb->get_results('SELECT data from '.$table_name5.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
    $show_currency = donasiaja_currency($currency);

?>

<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
	<meta name="application-name" content="<?php echo $home_url; ?>"/>
	<meta property="og:url" content="<?php echo $home_url; ?>" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="<?php echo $fullname; ?> - Referral" />
	<meta property="og:description" content="<?php echo strip_tags($profile[0]->user_bio); ?>" />
<?php if($profile[0]->user_cover_img!=null){?>
	<meta property="og:image" content="<?php echo $profile[0]->user_cover_img; ?>" />
<?php }else{?>
	<meta property="og:image" content="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>" />
<?php } ?>
	<title><?php echo $fullname; ?> - Referral</title>
	<?php dja_set_favicon(); ?>
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja.css';?>">
	<link rel="stylesheet" type="text/css" href="<?php echo plugin_dir_url( __FILE__ ) . 'assets/css/donasiaja-style.css';?>">
	<style type="text/css">
		.card__content.content_2 {
			height: auto;
		}
		a:active, a:focus, a:visited {
	      box-shadow: none !important;
	      outline: none;
	      box-shadow: 0 4px 15px 0 rgba(0,0,0,.1);
	    }
	    .cards__campaign.cards__list .cards__item .card__content.content_2 {
	    	padding-top: 0;
	    }
	    .cards__campaign.cards__list .cards__item {
	    	box-shadow: none;
	    	margin:0;
	    	margin-top:20px;
	    }
	    .cards__campaign.cards__list .cards__item a {
	    	text-decoration: none;
	    }
	    
	    #section-campaign {
	    	padding-bottom: 30px;
	    }
	    .campaign-header-title2 {
	    	color: transparent;
	    }
	    .campaign-header-title2.show-title {
	    	color: #343434;
	    }
	    .section-image {
	    	/*margin-top: 51px;*/
	    }
	    @media only screen and (max-width:480px) {
		    #section-campaign {
		    	padding: 0 !important;
		    	padding-bottom: 20px !important;
		    }
		    .section-title {
		    	padding:20px;
		    }
		    .cards__campaign {
		    	margin-top: -40px;
		    }
		    .cards__campaign.cards__list .cards__item {
		    	padding-left: 20px;
		    	margin-top: 0;
		    }
		    .cards__campaign.cards__list .cards__item .card__content.content_2 {
		    	height: 95px;
		    }
		}
	
	</style>
</head>
<body>
	<?php
	

	?>
	<div id="header-title" class="section-box"><span class="nav-icon"><a href="<?php echo get_site_url();?>"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/home.png'; ?>" title="Back to Homepage"></a></span><span class="campaign-header-title2"><?php echo $fullname; ?> - Profile</span></div>

	<?php if($profile[0]->user_cover_img!=null){?>
	<div class="section-image"><img alt="Image" src="<?php echo $profile[0]->user_cover_img; ?>"></div>
	<?php }else{?>
	<div class="section-image"><img alt="Imagenya" src="<?php echo plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg'; ?>"></div>
	<?php } ?>	
	
	
	<div class="section-box" style="min-height: 95px;">
		<div class="penggalang-dana">
			<div class="profile-picture">
				<img alt="Image" src="<?php echo $profile_photo; ?>" style="border-radius: 120px;border: 1px solid #dde4ec;width: 88px;">
			</div>
			<div class="profile-name" style="margin-left: 120px;margin-bottom: 20px;<?php if($profile[0]->user_type=='org'){echo'padding-top: 15px;';}else{echo'padding-top: 25px;';} ?>">
				<?php if($profile[0]->user_type=='org' && $profile[0]->user_verification=='1') { ?>
					<div class="user-link">
						<a href="javascript:;">
							<span class=""><?php echo $fullname; ?></span>
						</a>
					</div>
					<div class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/check-org2.png'; ?>" style="width:42px !important;"></div><div class="user-verified" style="margin-left: 48px;font-style: italic;color: #a2b0ca;">Verified Organization</div>
				<?php } elseif($profile[0]->user_type=='personal' && $profile[0]->user_verification=='1') { ?>
					<div class="user-link">
						<a href="javascript:;">
							<span class=""><?php echo $fullname; ?></span>
						</a>
					</div>
					<div class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/images/check.png'; ?>"></div><div class="user-verified" style="font-style: italic;color: #a2b0ca;">Verified User</div>
				<?php } else { ?>
					<div class="user-link" style="padding-top: 10px;">
						<a href="javascript:;">
							<span class=""><?php echo $fullname; ?></span>
						</a>
					</div>
				<?php } ?>
				<?php if($profile[0]->user_type=='org') { ?>
				<div class="d_map" style="font-size: 12px;margin-top: 20px;padding-right: 20px;line-height: 1.5;color: #727e95;"><div><?php echo $profile[0]->user_alamat; ?><?php if($profile[0]->user_alamat!=''){echo' - ';}?><?php echo $profile[0]->user_kecamatan; ?><?php if($profile[0]->user_kecamatan!=''){echo', ';}?><?php echo $profile[0]->user_kabkota; ?><?php if($profile[0]->user_kabkota!=''){echo', ';}?><?php echo $profile[0]->user_provinsi; ?></div></div>
				<?php } ?>
		
			</div>
		</div>
	</div>

	
	<div class="section-box" style="padding-bottom: 30px;">
		<h3>Statistics</h3>
		<div style="font-size: 15px;line-height: 1.6;color: #727e95;">
		Page View : <?php echo $total_click_and_view; ?>
		</div>
		<div style="font-size: 15px;line-height: 1.6;color: #727e95;">
		Submit Donation : <?php echo $total_click_and_submit; ?>
		</div>
		<div style="font-size: 15px;line-height: 1.6;color: #727e95;">
		Success Donation : <?php echo $total_click_submit_and_success; ?>
		</div>
	</div>

	<?php

	$user_id = $profile[0]->user_id;

	$campaign = $wpdb->get_results("SELECT a.aff_code, b.* FROM $table_name8 a 
	            left JOIN $table_name b ON a.campaign_id = b.campaign_id
	            where a.user_id=$user_id and b.publish_status='1' 
	            ORDER BY id DESC LIMIT 0,3 ");

	$hasil_list = '';
	$count_campaign = (int) $wpdb->get_var(
				  $wpdb->prepare(
				    "SELECT COUNT(*)
				     FROM {$table_name8} a
				     LEFT JOIN {$table_name} b ON a.campaign_id = b.campaign_id
				     WHERE a.user_id = %d AND b.publish_status = %s",
				    $user_id,
				    '1'
				  )
				);

	$jumlah_campaign = $count_campaign;

	foreach ($campaign as $value) {

			// Waktu Berakhir
		    $date_now = date('Y-m-d');
		    
		    // $datetime1 = new DateTime($date_now);
		    // $datetime2 = new DateTime($value->end_date);
		    // $hasil = $datetime1->diff($datetime2);

		    if (!empty($value->end_date)) {
			    $datetime1 = new DateTime($date_now);
			    $datetime2 = new DateTime($value->end_date);
			    $hasil = $datetime1->diff($datetime2);

			    $year = $hasil->y;
			    $month = $hasil->m;
			    $day = $hasil->d;

			} else {
			    // Tindakan jika $value->end_date null
			    $hasil = null; // Atau nilai default yang sesuai

			    $year = null;
			    $month = null;
			    $day = null;
			}
		    
		    

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

		        	if($day==null){
		        		$sisa_waktu = null;
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
		    }

		    if($value->end_date==null){
		    	$sisa_waktu = '∞';
		    }


			$total_donasi = $wpdb->get_results("SELECT SUM(nominal) as total, COUNT(id) as jumlah FROM $table_name2 where campaign_id='$value->campaign_id' and status='1' ")[0];

			if($value->target==0){
				// $persen = 100;
				$persen_width = 100;
			}else{
				// $persen = ($total_donasi->total/$row->target)*100;
				$persen_width = ($total_donasi->total/$value->target)*100;
				if($persen_width>100){
					$persen_width = 100;
				}
			}

			$data_donasinya = '';
            if($total_donasi==null){
                $total_terkumpul = 0;
                $jumlah_donasi = 0;
                $data_donasi = 0;
            }else{
                $total_terkumpul = $total_donasi->total;
                $jumlah_donasi = $total_donasi->jumlah;

                $data_donasi = $wpdb->get_results("SELECT user_id, name FROM $table_name2 where campaign_id='$value->campaign_id' and status='1' ORDER BY id ASC LIMIT 0,3 ");

                // GET INISAL DONATUR / PP URL
                foreach ($data_donasi as $data) {
                	if($data->user_id==null || $data->user_id==0){
                		$first_char = strtoupper(mb_substr($data->name, 0, 1));
                		$data_donasinya .= '<span class="u_image u_inisial"> '.$first_char.' </span>';
                	}else{
                		$first_char = strtoupper(mb_substr($data->name, 0, 1));
                		$user_profile = $wpdb->get_results('SELECT user_pp_img as photo from '.$table_name3.' where user_id="'.$data->user_id.'"');
						if(isset($user_profile[0])){
							if($user_profile==null){
								$first_char = strtoupper(mb_substr($data->name, 0, 1));
		                		$data_donasinya .= '<span class="u_image u_inisial"> '.$first_char.' </span>';
							}else{
								$url_photo = $user_profile[0]->photo;
								if($url_photo==''){
									$first_char = strtoupper(mb_substr($data->name, 0, 1));
			                		$data_donasinya .= '<span class="u_image u_inisial"> '.$first_char.' </span>';
								}else{
									$data_donasinya .= '<img src="'.$url_photo.'" alt="User Image" class="u_image">';
								}
								
							}
						}else{
							$first_char = strtoupper(mb_substr($data->name, 0, 1));
	                		$data_donasinya .= '<span class="u_image u_inisial"> '.$first_char.' </span>';
						}
                	}
                }
            }

			if($value->image_url==null){
                $image_url = plugin_dir_url( __FILE__ ).'assets/images/cover_donasiaja.jpg';
            }else{
                $image_url = $value->image_url;
                // $image_url = str_replace('localhost', '192.168.0.102', $image_url);
            }

            if($jumlah_donasi==0){
            	$icon_donasi = '
            	<div class="u_campaign u_icon">
				  <div class="campaign_days no_donation" style="padding-top:5px;">'.$sisa_waktu.'</div>
				</div>
				';
            }else{
            	$donasi_plusmore = '';
            	if($jumlah_donasi>=4){
	            	
            		$total_min_three = $jumlah_donasi-3;
            		$donasi_totalnya = shortDisplayNumber($total_min_three).'+';

	            	if(strlen($donasi_totalnya)>=4){
	            		$donasi_totalnya = '<span style="font-size:7px;">'.$donasi_totalnya.'</span>';
	            	}elseif(strlen($donasi_totalnya)==3){
	            		$donasi_totalnya = '<span style="font-size:8px;">'.$donasi_totalnya.'</span>';
	            	}else{
	            		$donasi_totalnya = $donasi_totalnya;
	            	}

	            	// >= 4 char = 7px
	            	// 3 char = 8px
	            	// 2 char = 9px

	            	$donasi_plusmore = '<span class="u_image u_inisial">'.$donasi_totalnya.'</span>';
            	}


				$icon_donasi = '
            	<div class="u_campaign u_donasi">
				  <div class="u_photo">
				  	'.$data_donasinya.'
				  	'.$donasi_plusmore.'
				  </div>
				  <div class="campaign_days" style="margin-top:5px;font-size:11px;">'.$sisa_waktu.'</div>
				</div>
				';
            }

            if($value->publish_status=='1'){
                $campaign_url = get_site_url().'/campaign/'.$value->slug.'?ref='.$value->aff_code;
            }else{
                $campaign_url = get_site_url().'/preview/'.$value->slug.'?ref='.$value->aff_code;
            }


            // GET PROFILE PICTURE CAMPAIGNER
			$profile = $wpdb->get_results('SELECT user_pp_img as photo, user_verification from '.$table_name3.' where user_id="'.$value->user_id.'"');
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

			// GET USER NAME
			$args2 = array( 'blog_id' => 0, 'search' => $value->user_id, 'search_columns' => array( 'ID' ) );
            $get_name = get_users( $args2 );

            if($get_name==null){
                $campaigner_name = '-';
            }else{
                $nama_user = str_replace("'", "&#39;", $get_name[0]->user_firstname.' '.$get_name[0]->user_lastname);
		        $campaigner_name = str_replace('\\', '', $nama_user); // nama asli
            }
            // user_firstname
            
            if($profile[0]->user_verification=='1'){
            	$verified_user = '<div class="verified_checklist"><img alt="Image" src="'.plugin_dir_url( __FILE__ ).'assets/images/check.png"></div>';
            }else{
            	$verified_user = '';
            }

            $hasil_list .= '
            <li class="cards__item">
			  <a href="'.$campaign_url.'">
		      <div class="card__">
		        <div class="card__image"><img src="'.$image_url.'"></div>
		        <div class="card__content content_1">
		          <!-- 80 char -->
		          <h2 class="card__title">'.$value->title.'</h2>
		        </div>
		        <div class="card__content content_2">
		          <div class="card__text">'.$campaigner_name.$verified_user.'</div>
		          <div class="card__text donation_collected" style="color:'.$theme_color.'">'.$show_currency.number_format_currency($total_terkumpul).'<span class="donation_collected_text">terkumpul</span></div>
		          <div style="height:4px; width:100%;background:'.$progressbar_color.';border-radius:4px;"><div style="height:4px; width:'.$persen_width.'%;background:'.$progressbar_color.';border-radius:4px;" title="'.$persen_width.'%"></div></div>
		          '.$icon_donasi.'
		        </div>
		      </div>
		      </a>
		    </li>
		    ';
			
		}

		?>
	<div class="section-box" id="section-campaign">
		<h3 class="section-title">Campaign (<?php echo $jumlah_campaign; ?>)</h3>
		<div style="font-size: 15px;line-height: 1.6;">
		<?php

			$id = $user_randid;
			echo '<ul id="section_'.$id.'" class="cards__campaign cards__list">'.$hasil_list.'</ul>';
			if($jumlah_campaign>=4){
				echo '<div id="box_button_'.$id.'" class="btn_loadmore_list" style="margin-top:40px;"><div class="donasiaja_loadmore_info"></div><button class="load_campaign" data-id="'.$id.'" data-count="2" data-uid="'.$user_id.'" style="color:'.$button_color.';border:1px solid '.$button_color.';">Load more</button></div>';
			}

		?>
		</div>
	</div>

	<?php if($powered_by_setting=='1'){ ?>
	<div class="section-box box-powered">
		<div class="powered-donasiaja-box"><a href="https://donasiaja.id" target="_blank"><img alt="Donasi Aja" class="powered-donasiaja-img" src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/icons/donasiaja.ico'; ?>">Powered by DonasiAja</a></div>
	</div>
	<?php } ?>
	<div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>


	<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	<script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/donasiaja.min.js';?>"></script>
	<!-- <script src="<?php echo plugin_dir_url( __FILE__ ) . 'assets/js/hello.donasiaja.js';?>"></script> -->
	<script>

	jQuery(document).ready(function($) {

		$(".load_campaign").bind("click", function(){
			var id = $(this).attr('data-id');
			var uid = $(this).attr('data-uid');
			var load_count = $(this).attr('data-count');
			var type = 'referral';
			$(this).text('Load more...');

			var data_nya = [id, load_count, uid, '', type];
		    var data = {
		        "action": "donasiaja_load_campaign",
		        "datanya": data_nya
		    };

		    jQuery.post("<?php echo $home_url; ?>/wp-admin/admin-ajax.php", data, function(response) {

		    	if(response==''){
					$('#box_button_'+id+' .donasiaja_loadmore_info').text('No more data').slideDown();
			        setTimeout(function() {
			            $('#box_button_'+id+' .donasiaja_loadmore_info').hide()
			        }, 5000);
			        $('#box_button_'+id+' button').text('Loadmore');
				}else{
					load_count = parseFloat(load_count)+1;
			        $('#box_button_'+id+' button').attr('data-count', load_count);
			        $('#box_button_'+id+' button').text('Load more');

					$('#section_'+id).append(response);
				}

		    });
		});

		$(function() {
		    var header = $("#header-title");
		    var header2 = $('.campaign-header-title2');
		    var footer = $("#fixed-button");
		    $(window).scroll(function() {
		        var scroll = $(window).scrollTop();

		        if (scroll >= 300) {
		            header.addClass("flying-header");
		            header2.addClass("show-title");
		            footer.addClass("flying-button");
		        } else {
		            header.removeClass("flying-header");
		            header2.removeClass("show-title");
		            footer.removeClass("flying-button");
		            $('#fixed-share-button').removeClass("show-button");
		        }
		    });
		});

	});

		

		
	</script>
</body>
</html>

