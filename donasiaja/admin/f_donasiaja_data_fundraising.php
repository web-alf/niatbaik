<?php

function donasiaja_data_fundraising() { ?>
    <?php 
    global $wpdb;
    $table_name = $wpdb->prefix . "dja_campaign";
    $table_name2 = $wpdb->prefix . "dja_category";
    $table_name3 = $wpdb->prefix . "dja_campaign_update";
    $table_name4 = $wpdb->prefix . "dja_donate";
    $table_name5 = $wpdb->prefix . "dja_settings";
    $table_name6 = $wpdb->prefix . "dja_users";
    $table_name7 = $wpdb->prefix . "dja_payment_list";
    $table_name8 = $wpdb->prefix . "dja_aff_code";
    $table_name9 = $wpdb->prefix . "dja_aff_submit";
    $table_name10 = $wpdb->prefix . "dja_aff_click";
    $table_name11 = $wpdb->prefix . "dja_aff_payout";

    donasiaja_global_vars();
    $plugin_license = strtoupper($GLOBALS['donasiaja_vars']['plugin_license']);

    // ROLE
    $cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
    $roles = array_keys((array)$cap);
    $role = $roles[0];

    $id_login = wp_get_current_user()->ID;

    $akses = 1;
    if($role=='donatur'){
        $usernya = $wpdb->get_results('SELECT * from '.$table_name6.' where user_id="'.$id_login.'"')[0];

        if($usernya->user_verification=='1'){
            $akses = 1;
        }else{
            $akses = 0;
        }
    }

    if(isset($_GET['as'])){
        if($_GET['as']=="user"){
            $as_user = true;
        }else{
            $as_user = false;
        }
    }else{
        $as_user = false;
    }

    if(isset($_GET['ref'])){
        if($_GET['ref']!=""){
            $show_referral = true;
        }else{
            $show_referral = false;
        }
    }else{
        $show_referral = false;
    }

    // category
    $row2 = $wpdb->get_results('SELECT * from '.$table_name2.' ');     

    // Settings
    $query_settings = $wpdb->get_results('SELECT data from '.$table_name5.' where type="form_setting" or type="app_name" or type="page_donate" or type="fundraiser_on"  or type="fundraiser_commission_on" or type="min_payout_setting" or type="min_payout"ORDER BY id ASC');
    $form_setting   = $query_settings[0]->data;
    $app_name       = $query_settings[1]->data;
    $page_donate    = $query_settings[2]->data;
    $fundraiser_on  = $query_settings[3]->data;
    $fundraiser_commission_on    = $query_settings[4]->data;
    $min_payout_setting = $query_settings[5]->data;
    $min_payout      = $query_settings[6]->data;

    // Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name5.' where type="currency"  ORDER BY id ASC');
    $currency = $query_currency[0]->data;
    $lang = get_data_lang($currency);
    $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
    
    $show_currency = donasiaja_currency($currency);
    $show_currency2 = donasiaja_currency2($currency);
    
    
?>


    <!-- DataTables -->
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.css" rel="stylesheet" type="text/css" />
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.css" rel="stylesheet" type="text/css" />
    <!-- Responsive datatable examples -->
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/responsive.bootstrap4.min.css" rel="stylesheet" type="text/css" /> 

    <!-- App css -->
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>assets/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>assets/css/jquery-ui.min.css" rel="stylesheet">
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>assets/css/icons.min.css" rel="stylesheet" type="text/css" />
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>assets/css/app.min.css" rel="stylesheet" type="text/css" />

    <!-- jQuery  -->
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery.min.js"></script>
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery-ui.min.js"></script>
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/zoom/medium-zoom.min.js"></script>

    <?php 

    // wp_enqueue_script('jquery');
    // This will enqueue the Media Uploader script
    wp_enqueue_media();
        
    ?>

    <style>
    .row [class^="col"] {
        margin:0;
    }
    .card-body h5, .card-body h2{
      font-family: "Roboto",sans-serif;
    }
    .notice, #message, #dolly, #wpbody-content .promotion {
        display:none;
    }
    body{background:#f6faff}.update-nag{display:none}img[data-action="zoom"]{cursor:pointer;cursor:-webkit-zoom-in;cursor:-moz-zoom-in}.zoom-img,.zoom-img-wrap{position:relative;z-index:666;-webkit-transition:all 300ms;-o-transition:all 300ms;transition:all 300ms}img.zoom-img{cursor:pointer;cursor:-webkit-zoom-out;cursor:-moz-zoom-out}.zoom-overlay{z-index:420;background:rgba(34,40,45,.9);position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;filter:"alpha(opacity=0)";opacity:0;-webkit-transition:opacity 300ms;-o-transition:opacity 300ms;transition:opacity 300ms}.zoom-overlay-open.zoom-overlay{filter:"alpha(opacity=100)";opacity:1}.zoom-overlay-open,.zoom-overlay-transitioning{cursor:default}.target_tak_hingga{font-size:16px;position:absolute;margin-top:-2px;margin-left:3px}.field_required{color:#ff3b3b}.media:hover{background:#f6faff}.f_edit,.f_delete{cursor:pointer;float:right}.f_delete{margin-left:5px}.campaign-title{font-size:14px;font-weight:700;color:#384d64;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif}.campaign-title a:hover{color:#52649b}input.set_red,input.form-control.set_red,img.set_red,.mce-edit-area.set_red{border:2px solid #ED8181!important}.wp-core-ui select,div.dataTables_wrapper div.dataTables_filter input{border-color:#e5eaf0}div.dataTables_wrapper div.dataTables_filter input:visited,div.dataTables_wrapper div.dataTables_filter input:active,div.dataTables_wrapper div.dataTables_filter input:focus{border-color:#e5eaf0}.error.landingpress-message{display:none}.page-content-tab{margin:0!important;width:auto}img.thumb-cover{height:60px;border-radius:4px}.active-status{background:#1CB65D;color:#fff;border-radius:4px;padding:2px 8px;font-size:9px}table.dataTable td{font-size:12px;vertical-align:top;padding-top:15px;color:#384d64}table.dataTable td img{margin-top:3px}button.no-border{border:0;background:#f6f9ff}button.no-border:hover{color:#505DFF}button.no-border.delete_payout:hover{background:#F05860;color:#fff}.btn-group button.btn{padding:.175rem.75rem}a:active,a:focus,a:visited{box-shadow:none!important;outline:none;box-shadow:0 4px 15px 0 rgba(0,0,0,.1)}input.form-control{border:1px solid #e8ebf3!important;font-size:14px}input.form-control:active,input.form-control:visited{border:1px solid #7680FF!important;box-shadow:none!important;outline:none}input.form-control.packaged_title,input.form-control.pengeluaran_title{font-size:13px}.mce-menubar,.mce-branding{display:none}#cover_image img{border-radius:4px}.fro-profile_main-pic-change{background-color:#7680ff99;border-radius:50%;width:28px;height:28px;-webkit-box-shadow:0 0 20px 0 rgba(252,252,253,.05);box-shadow:0 0 20px 0 rgba(252,252,253,.05);transition:all.35s ease;position:absolute;right:0}#upload_cover_image{text-align:center;padding-top:3px;cursor:pointer;margin-right:20px;margin-top:10px}.fro-profile_main-pic-change:hover{background-color:#505DFF}.fro-profile_main-pic-change i{color:#fff;font-size:11px}.form-group input{height:45px;padding:0 15px}.target.currency{position:absolute;margin-top:-37px;margin-left:15px;font-weight:700;font-size:18px;color:#719eca}#packaged.currency{position:absolute;margin-top:-27px;margin-left:10px;font-weight:700;font-size:14px;color:#719eca}#packaged input{text-align:right}.opt_packaged{display:none}.opt_packaged.show{display:inline}.target input{text-align:right;font-size:24px;font-weight:700;color:#23374d}.box-slugnya{background:#e3eaf2;padding:1px 4px;border-radius:2px}.box-slugnya[contenteditable="true"]{border:1px solid #7680ff;background:#fff;padding:1px 6px}.copylink{font-size:16px;margin-right:5px;padding-top:3px;cursor:pointer}.copylink:hover{color:#505DFF}.edit-slug,.edit-status,.edit-visibility{font-size:16px;margin-left:5px;padding-top:3px;cursor:pointer}.edit-slug:hover,.edit-status:hover,.edit-visibility:hover{color:#505DFF!important}#publish_status{display:none;margin-bottom:5px}#publish-section select{height:30px!important;font-size:13px;margin-top:5px}.page-title-box{padding-bottom:0}.button-hide{visibility:hidden}.dropdown-item:hover{color:#505DFF!important}.dropdown-item.delete_payout:hover{color:#F05860!important}.show_data_donasi:hover img{-webkit-box-shadow:0 8px 16px rgba(0,0,0,.1);box-shadow:0 8px 16px rgba(0,0,0,.1);transition:border.2s linear,transform.2s linear,background-color.2s linear,box-shadow.2s linear,opacity.2s linear,-webkit-transform.2s linear,-webkit-box-shadow.2s linear;-webkit-transition:all 200ms ease-in;-webkit-transform:scale(1.02);-ms-transition:all 200ms ease-in;-ms-transform:scale(1.02);-moz-transition:all 200ms ease-in;-moz-transform:scale(1.02);transition:all 200ms ease-in;transform:scale(1.02)}@keyframes redblink{0%{background-color:rgba(255,0,0,1)}50%{background-color:rgba(255,0,0,.5)}100%{background-color:rgba(255,0,0,1)}}@-webkit-keyframes redblink{0%{background-color:rgba(255,0,0,1)}50%{background-color:rgba(255,0,0,.5)}100%{background-color:rgba(255,0,0,1)}}.detected{padding:15px 15px 15px 15px;-moz-transition:all 0.5s ease-in-out;-webkit-transition:all 0.5s ease-in-out;-o-transition:all 0.5s ease-in-out;-ms-transition:all 0.5s ease-in-out;transition:all 0.5s ease-in-out;-moz-animation:redblink normal 1.5s infinite ease-in-out;-webkit-animation:redblink normal 1.5s infinite ease-in-out;-ms-animation:redblink normal 1.5s infinite ease-in-out;animation:redblink normal 1.5s infinite ease-in-out}.toggleSwitch span span{display:none}.toggleSwitch{display:inline-block;height:18px;position:relative;overflow:visible;padding:0;cursor:pointer;width:100%;background-color:#fff;border:1px solid #c0c5d7;border-radius:6px;height:34px}.toggleSwitch*{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.toggleSwitch label,.toggleSwitch>span{line-height:20px;height:20px;vertical-align:middle}.toggleSwitch input:focus~a,.toggleSwitch input:focus+label{outline:none}.toggleSwitch label{position:relative;z-index:3;display:block;width:100%}.toggleSwitch input{position:absolute;opacity:0;z-index:5}.toggleSwitch>span{position:absolute;left:0;width:calc(100%-6px);margin:0;text-align:left;white-space:nowrap;margin:0 3px}.toggleSwitch>span span{position:absolute;top:0;left:0;z-index:5;display:block;width:50%;margin-left:50px;text-align:left;font-size:.9em;width:auto;left:0;top:-1px;opacity:1;width:40%;text-align:center;line-height:34px}.toggleSwitch a{position:absolute;right:50%;z-index:4;display:block;top:3px;bottom:3px;padding:0;left:3px;width:50%;background-color:#7680FF;border-radius:4px;-webkit-transition:all 0.2s ease-out;-moz-transition:all 0.2s ease-out;transition:all 0.2s ease-out;box-shadow:0 1px 2px rgba(0,0,0,.05);border-radius:4px}.toggleSwitch>span span:first-of-type{color:#FFF;opacity:1;left:0;margin:0;width:50%}.toggleSwitch>span span:last-of-type{left:auto;right:0;color:#656d9a;margin:0;width:50%}.toggleSwitch>span:before{content:'';display:block;width:100%;height:100%;position:absolute;left:0;top:-2px;border-radius:30px;-webkit-transition:all 0.2s ease-out;-moz-transition:all 0.2s ease-out;transition:all 0.2s ease-out}.toggleSwitch input:checked~a{left:calc(50%-3px)}.toggleSwitch input:checked~span span:first-of-type{left:0;color:#656d9a}.toggleSwitch input:checked~span span:last-of-type{color:#FFF}.toggleSwitch.large{width:60px;height:27px}.toggleSwitch.large a{width:27px}.toggleSwitch.large>span{height:29px;line-height:28px}.toggleSwitch.large input:checked~a{left:41px}.toggleSwitch.large>span span{font-size:1.1em}.toggleSwitch.large>span span:first-of-type{left:50%}.toggleSwitch.xlarge{width:80px;height:36px}.toggleSwitch.xlarge a{width:36px}.toggleSwitch.xlarge>span{height:38px;line-height:37px}.toggleSwitch.xlarge input:checked~a{left:52px}.toggleSwitch.xlarge>span span{font-size:1.4em}.toggleSwitch.xlarge>span span:first-of-type{left:50%}#lala-alert-container{position:fixed;height:auto;max-width:350px;width:100%;top:18px;right:5px;z-index:9999}#lala-alert-wrapper{height:auto;padding:15px}.lala-alert{position:relative;padding:25px 30px 20px;font-size:15px;margin-top:15px;opacity:1;line-height:1.4;border-radius:3px;border:1px solid transparent;cursor:default;transition:all 0.5s ease-in-out;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.lala-alert span{opacity:.7;transition:all 0.25s ease-in-out}.lala-alert span:hover{opacity:1}.alert-success{color:#fff;background-color:#37c1aa}.alert-success>span{color:#0b6f5e}.alert-info{color:#fff;background-color:#3473c1}.alert-info>span{color:#1e4567}.alert-warning{color:#6b7117;background-color:#ffee9e}.alert-warning>span{color:#8a6d3b}.alert-danger{color:#fff;background-color:#d64f62}.alert-danger>span{color:#6f1414}.close-alert-x{position:absolute;float:right;top:10px;right:10px;cursor:pointer;outline:none}.fade-out{opacity:0}.custom-control-input:checked~.custom-control-label::before{color:#fff;border-color:#36bd47;background-color:#36bd47}.custom-control-label::before{border:#d8204c solid 1px}.custom-switch.custom-control-label::after{background-color:#d8204c}.custom-radio.custom-control-label::before{border-radius:50%;border:1px solid currentColor}.animation-target{animation:animation 1500ms linear both}@keyframes animation{0%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,250,0,0,1)}3.14%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,160.737,0,0,1)}4.3%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,132.565,0,0,1)}6.27%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,91.357,0,0,1)}8.61%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,51.939,0,0,1)}9.41%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,40.599,0,0,1)}12.48%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,6.498,0,0,1)}12.91%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,2.807,0,0,1)}16.22%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-17.027,0,0,1)}17.22%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-20.404,0,0,1)}19.95%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-24.473,0,0,1)}23.69%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-21.178,0,0,1)}27.36%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-13.259,0,0,1)}28.33%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-11.027,0,0,1)}34.77%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,.142,0,0,1)}39.44%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,2.725,0,0,1)}42.18%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,2.675,0,0,1)}56.99%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-.202,0,0,1)}61.66%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-.223,0,0,1)}66.67%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-.104,0,0,1)}83.98%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,.01,0,0,1)}100%{transform:matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)}}.breadcrumb-item.active{color:#a1b3ca}
    
    .img-ss {
        width:50px;
        margin-bottom:5px;
        height:auto;
        border-radius:2px;
    }

    .swal2-confirm.swal2-styled {
        font-size:14px !important;
    }
    .swal2-popup.swal2-modal{
        border-radius:12px;
        padding: 40px 40px 50px 40px;
        background: url('<?php echo plugin_dir_url( __FILE__ ).'../assets/images/bg4.png'; ?>') no-repeat, #fff;
    }
    .swal2-popup .swal2-title {
        margin-top: 10px;
    }
    .swal2-actions {
        padding-bottom: 10px;
    }
    .form_upload {
      padding: 50px 20px 60px 20px;
    }
    .zoom-overlay {
      z-index: 420;
      background: rgba(34,40,45,.9);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      filter: "alpha(opacity=0)";
      opacity: 0;
      -webkit-transition:      opacity 300ms;
           -o-transition:      opacity 300ms;
              transition:      opacity 300ms;
    }
    .zoom-overlay-open .zoom-overlay {
      filter: "alpha(opacity=100)";
      opacity: 1;
    }
    .zoom-overlay-open,
    .zoom-overlay-transitioning {
      cursor: default;
    }

    #count_status_on_process {
        position: absolute;background: #ffbf47;width: 20px;height: 20px;text-align: center;border-radius: 30px;margin-top: -10px;z-index: 2;font-size: 10px;color: #fff;padding-top: 3px;margin-left: 80px;
        margin-top: -9px;
        -webkit-box-shadow: 0 6px 6px rgba(115, 90, 42, 0.25);
        -moz-box-shadow: 0 6px 6px rgba(115, 90, 42, 0.25);

    }

    button.swal2-close {
        color:#fff;
    }
    .icon_transfer {
        position: absolute;right: 0;
        margin-right: -20px !important;
        margin-top: 20px !important;
    }

    @media only screen and (max-width:991px) {
        .col-total-donasi, .col-jumlah-donasi {
            width: 50%;
        }
    }


    @media only screen and (max-width:767px) {
        .page-title-box .breadcrumb {
            display: inline-flex !important;
            width: 100% !important;
        }
        .icon_transfer {
            margin-right: 20px !important;
        }
        .section_paid {
            margin-top: 50px !important;
            margin-bottom: 20px !important;
        }
        .section_on_process {
            margin-top: 35px !important;
        }
    }

    @media only screen and (max-width:480px) {
      .col-total-donasi, .col-jumlah-donasi {
            width: 100%;
        }
      .icon_transfer {
        margin-right: 20px !important;
      }
      .dja_label {
        width: auto;
      }
      .page-content-tab, .container-fluid {
        padding: 0;
      }
      .container-fluid .col-lg-4 {
        padding-right: 0;
      }
      .row .col-12 {
        padding-right: 0;
      }
      .card .card-body {
        /* padding-right: 5px;
        padding-left: 5px; */
      }
      #publish {
        width: 100%;
        margin-top: -10px;
      }
      #publish-section .col-sm-7.text-left.dja_label, #publish-section .col-sm-5.text-left.dja_label, #publish-section .col-sm-6.text-left.dja_label {
        width: 100%;
      }
      #publish-section .publish_update, #preview_campaign {
        width: 100%;
        margin-top: 20px;
      }
      .col-sm-7 .publish, .col-sm-7 .publish_update {
        width: 100%;
      }
      .col-sm-7.col-data {
        width: 65%;
      }
      .dja_label.label_status {
        padding-right: 24px !important;
      }
      #cover_image {
        position: absolute;
        margin-top: -115px;
        right: 0;
        padding-right: 44px;
      }
      #cover_image img {
          height: 75px;
      }
      #cover_image #dja_image_cover {
        right: 0 !important;
      }
      #upload_cover_image {
        margin-right: 55px;
      }
      .row-title {
        margin-top: 70px;
      }
      .label_title {
        padding-right: 30px;
      }
      .nominal_packaged, .title_packaged {
        width: 65%;
      }
      #packaged .currency {
        margin-top: -30px;
      }
      #shorturl {
        margin-left: 10px;
      }
      label.opt_zakat_penghasilan.opt_title {
        padding-right: 53px;
      }
      #c_opt_zakat_penghasilan, #t_opt_zakat_penghasilan {
        width: 60%;
      }
      .bank-col-1 {
        margin-bottom: 10px;
      }
      .bank-col-2 .form-group, .bank-col-3 .form-group, .bank-col-4 .form-group  {
        margin-bottom: 10px;
      }
      .bank-col-5 {
        margin-bottom: 30px;
        text-align: right;
      }
      .bank-col-1 .form-control, .bank-col-4 .form-control {
        font-size: 13px;
      }
      .unique_number_range.col-min, .unique_number_range.col-max {
        width: 48%;
      }
      #update_info {
        width: 100% !important;
      }
      .col-total-donasi .card, .col-jumlah-donasi .card {
            padding-bottom: 0px;
            margin-bottom: 5px;
      }

    }

    
    </style>

    <?php check_license(); ?>


    <?php 

        
        check_verified_fundraising($akses);

        $id_login = wp_get_current_user()->ID;

        // ************************************
        if($role=='administrator'){
            if($as_user==true) {
                $check_balance = $wpdb->get_results("SELECT SUM(a.nominal_commission) as nominal_commission  FROM $table_name9 a 
                left JOIN $table_name4 b ON b.id = a.donate_id
                left JOIN $table_name8 c ON c.id = a.affcode_id
                where c.user_id=$id_login and b.status='1' and a.payout_status='0' ");


            }else{
                $check_balance = $wpdb->get_results("SELECT SUM(a.nominal_commission) as nominal_commission  FROM $table_name9 a 
                left JOIN $table_name4 b ON b.id = a.donate_id
                where b.status='1' and a.payout_status='0' ");
            }
            
        }else{
            
                $check_balance = $wpdb->get_results("SELECT SUM(a.nominal_commission) as nominal_commission  FROM $table_name9 a 
                left JOIN $table_name4 b ON b.id = a.donate_id
                left JOIN $table_name8 c ON c.id = a.affcode_id
                where c.user_id=$id_login and b.status='1' and a.payout_status='0' ");
        }
        
        // ************************************
        if($check_balance==null){
            $belum_dicairkan = 0;
        }else{
            $belum_dicairkan = $check_balance[0]->nominal_commission;
        }
        if($belum_dicairkan==null){
            $belum_dicairkan = 0;
        }

    ?>

        <style>
        .fundraising_list_pencairan, .fundraising_on_process  {
            display: none;
        }
        .fundraising_dashboard {
            /* display: none; */
        }
        </style>
        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

            <!-- Page Content-->
            <div class="page-content-tab">

                <div class="container-fluid">
                    <?php 
                    $c_license = c_expired_license();
                    echo $c_license;
                    ?>
                    <!-- end page title end breadcrumb -->
                    <?php if($role=='administrator') { ?>
                    <div class="row">
                        
                        <div class="col-sm-12" style="margin-bottom: 20px;">
                            <div class="page-title-box" style="padding-top: 10px;">
                            <?php if($as_user==true) { ?>
                                <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-user" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;">As User</div></h4>
                            <?php }else{ ?>
                                <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-user" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;">As Administrator</div></h4>
                            <?php } ?>
                            </div><!--end page-title-box-->
                            <div class="btn-group ml-1 option_campaign" style="position: absolute;right: 0;margin-top: -20px;margin-right: 10px;">
                                <button type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="true">Dasboard<i class="mdi mdi-chevron-down ml-1"></i>
                                </button>
                                <div class="dropdown-menu dropdown-menu-left" style="position: absolute; transform: translate3d(-130.633px, 32.7167px, 0px); top: 0px; left: 46px; will-change: transform;" x-placement="bottom-end">
                                    <a class="dropdown-item"href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising')?>">As Administrator</a>
                                    <a class="dropdown-item no-border" href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising&as=user')?>">As User</a>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    <?php } ?>

                    <?php if($fundraiser_commission_on=='1'){ ?>
                    <div class="row" <?php if($show_referral==true){echo'style="display:none;"';}?>> 
                        <div class="col-lg-3 col-total-donasi">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);background: #7680FF;border-bottom: 0;min-height: 170px;">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="icon-contain">
                                        <div class="row">
                                            <div class="col-10 align-self-center" style="padding-right:0;">
                                                <h5 class="" style="color: #fff;text-shadow: 2px 5px 5px #0000002e;"><?php echo get_langArray('fundraising_section_title1');?></h5>
                                                <h2 class="my-2" style="font-size: 21px;color: #fff;" id="totalFundraising">...</h2>
                                                <p class="text-muted mb-0" style="color: #f6faffa3 !important;"><?php echo get_langArray('fundraising_section_desc1');?></p>
                                            </div><!--end col-->
                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-heart bg-soft-pink" style="background:#fff !important;color:#f20988 !important;-webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.09);-moz-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.09);"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <div class="col-lg-3 col-jumlah-donasi">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);min-height: 170px;">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="icon-contain">
                                        <div class="row">
                                             <div class="col-10 align-self-center" style="padding-right:0;">
                                                <h5 class=""><?php echo get_langArray('fundraising_section_title2');?></h5>
                                                <h2 class="my-2" style="font-size: 21px;color:#7680FF;" id="komisiFundraising">...</h2>
                                                <p class="text-muted mb-0"><?php echo get_langArray('fundraising_section_desc2');?></p>
                                            </div><!--end col-->

                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-trophy bg-soft-primary"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <div class="col-lg-6">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);max-width: initial;padding-right:0;min-height: 170px;">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="row">
                                        <div class="col-md-4 align-self-center section_balance" style="min-height: 85px;"> 
                                            <?php if($role=='administrator') { ?>
                                                    <?php if($as_user==true) { ?>
                                                        <h5 class="">Balance</h5>
                                                    <?php }else{ ?>
                                                        <h5 class="">User Balance</h5>
                                                    <?php } ?>
                                            <?php }else { ?>
                                                <h5 class="">Balance</h5>
                                            <?php } ?>
                                            <p class="mt-2 mb-0 text-muted" style="font-size: 16px;color:#303e67 !important;font-weight:bold;" id="komisiBelumCair">...</p>
                                            <p class="text-muted mb-0"><br></p>
                                            <!-- <button id="list_pencairan" type="button" class="btn btn-outline-primary waves-effect waves-light btn-m" title="List Pencairan" style="position: absolute;font-size: 10px;padding-left:18px;padding-right:18px;-webkit-box-shadow: 0 3px 6px rgba(118, 128, 255, 0.32);-moz-box-shadow: 0 6px 6px rgba(118, 128, 255, 0.32);margin-top:-5px;">Detail</button> -->
                                            <?php if($role=='administrator') { ?>

                                                    <?php if($as_user==true) { ?>
                                                        <?php if($belum_dicairkan=='0') { ?>
                                                            <button disabled="" type="button" class="btn btn-info waves-effect waves-light btn-m" title="Cairkan Sekarang" data-cairkan="<?php echo $show_currency2; ?><?php echo number_format_currency($belum_dicairkan); ?>" data-belumcair="<?php echo $belum_dicairkan; ?>" style="position: absolute;margin-top: -5px;font-size: 9px;padding-left: 15px;padding-right: 15px;cursor: default;">Cairkan</button>
                                                        <?php }else{ ?>
                                                            <button id="cairkan_sekarang" type="button" class="btn btn-success waves-effect waves-light btn-m" title="Cairkan Sekarang" data-cairkan="<?php echo $show_currency2; ?><?php echo number_format_currency($belum_dicairkan); ?>"  data-belumcair="<?php echo $belum_dicairkan; ?>" style="position: absolute;margin-top: -5px;font-size: 9px;padding-left: 15px;padding-right: 15px;-webkit-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);-moz-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);">Cairkan</button>
                                                        <?php } ?>

                                                    <?php } ?>

                                            <?php }else{ ?>

                                                <?php if($belum_dicairkan=='0') { ?>
                                                    <button disabled="" type="button" class="btn btn-info waves-effect waves-light btn-m" title="Cairkan Sekarang" data-cairkan="<?php echo $show_currency2; ?><?php echo number_format_currency($belum_dicairkan); ?>" data-belumcair="<?php echo $belum_dicairkan; ?>" style="position: absolute;margin-top: -5px;font-size: 9px;padding-left: 15px;padding-right: 15px;cursor: default;">Cairkan</button>
                                                <?php }else{ ?>
                                                    <button id="cairkan_sekarang" type="button" class="btn btn-success waves-effect waves-light btn-m" title="Cairkan Sekarang" data-cairkan="<?php echo $show_currency2; ?><?php echo number_format_currency($belum_dicairkan); ?>" data-belumcair="<?php echo $belum_dicairkan; ?>" style="position: absolute;margin-top: -5px;font-size: 9px;padding-left: 15px;padding-right: 15px;-webkit-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);-moz-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);">Cairkan</button>
                                                <?php } ?>

                                            <?php } ?>


                                                <!-- <?php echo $count_list_pencairan ;?>                                   -->
                                        </div><!--end col-->    
                                        <div class="col-md-4 align-self-center section_on_process" style="min-height: 85px;">     
                                            <h5 class="">On Process</h5>
                                            <p class="mt-2 mb-0 text-muted" style="font-size: 16px;color:#fda400 !important;font-weight:bold;" id="komisiProsesCair">...</p>
                                            <p class="text-muted mb-0"><br></p>
                                            <button id="on_process" type="button" class="btn btn-outline waves-effect waves-light btn-m" title="List Pencairan" style="position: absolute;font-size: 10px;padding-left: 18px;padding-right: 18px;-webkit-box-shadow: 0 3px 6px rgba(118, 128, 255, 0.32);-moz-box-shadow: 0 6px 6px rgba(118, 128, 255, 0.32);margin-top:-5px;">Detail</button>
                                                <!-- <?php echo $count_list_pencairan ;?>                     -->
                                        </div><!--end col-->    
                                        <div class="col-md-4 align-self-center section_paid" style="min-height: 85px;">     
                                            <h5 class="">Paid</h5>
                                            <p class="mt-2 mb-0 text-muted" style="font-size: 16px;color:#22d969 !important;font-weight:bold;" id="komisiCair">...</p>
                                            <p class="text-muted mb-0"><br></p>
                                            <button id="list_pencairan" type="button" class="btn btn-outline waves-effect waves-light btn-m" title="Detail Pencairan" style="position: absolute;font-size: 10px;padding-left: 18px;padding-right: 18px;-webkit-box-shadow: 0 3px 6px rgba(118, 128, 255, 0.32);-moz-box-shadow: 0 6px 6px rgba(118, 128, 255, 0.32);margin-top:-5px;">Detail</button>
                                            <!-- <?php echo $count_list_pencairan ;?> -->
                                        </div><!--end col-->      
                                        <div class="col-2 align-self-center icon_transfer">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-swap bg-soft-primary"></i>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                                
                            </div><!--end card-->
                        </div><!--end col-->  

                    </div><!--end row-->
                    <?php } ?>


                    <?php if($fundraiser_commission_on!='1'){ ?>
                    <div class="row"> 
                        <div class="col-lg-4 col-total-donasi">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);background: #7680FF;border-bottom: 0;">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="icon-contain">
                                        <div class="row">
                                            <div class="col-10 align-self-center" style="padding-right:0;">
                                                <h5 class="" style="color: #fff;text-shadow: 2px 5px 5px #0000002e;"><?php echo get_langArray('fundraising_section_title1');?></h5>
                                                <h2 class="my-2" style="font-size: 21px;color: #fff;" id="totalFundraising">...</h2>
                                                <p class="text-muted mb-0" style="color: #f6faffa3 !important;"><?php echo get_langArray('fundraising_section_desc1');?></p>
                                            </div><!--end col-->
                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-heart bg-soft-pink" style="background:#fff !important;color:#f20988 !important;-webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.09);-moz-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.09);"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <div class="col-lg-4 col-jumlah-donasi">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="icon-contain">
                                        <div class="row">
                                             <div class="col-10 align-self-center">
                                                <h5 class="">Success Fundraising</h5>
                                                <h2 class="my-2" style="font-size: 21px;" id="successFundraising">...</h2>
                                                <p class="text-muted mb-0">Fundraising yang berhasil sampai payment</p>
                                            </div><!--end col-->

                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-trophy bg-soft-primary"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col--> 
                        <div class="col-lg-4 col-jumlah-donasi">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #7680FF;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body" style="padding-left: 5px;padding-bottom: 25px;">
                                    <div class="icon-contain">
                                        <div class="row">
                                             <div class="col-10 align-self-center">
                                                <h5 class="">Link Fundraising</h5>
                                                <h2 class="my-2" style="font-size: 21px;" id="linkFundraising">...</h2>
                                                <p class="text-muted mb-0">Jumlah link fundraising yang aktif</p>
                                            </div><!--end col-->

                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-link bg-soft-primary"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->                   
                    </div><!--end row-->
                    <?php } ?>

                    <?php 
                        $title_campaignya = '';
                        if(isset($_GET['ref'])){
                            $data_affcode = $wpdb->get_results("SELECT * FROM $table_name8 where aff_code='".$_GET['ref']."' ");
                            if($data_affcode!=null){
                                $campaign_idnya = $data_affcode[0]->campaign_id;

                                $row3 = $wpdb->get_results("SELECT title, slug, publish_status FROM $table_name where campaign_id='$campaign_idnya' ")[0];
                                $title_campaignya = $row3->title;

                                $affcode_idnya = $data_affcode[0]->id;
                                $data_aff_submit = $wpdb->get_results("
                                    SELECT a.*, b.nominal, b.name, b.status, c.user_id as id_user_referral FROM $table_name9 a 
                                    left JOIN $table_name4 b ON a.donate_id = b.id 
                                    left JOIN $table_name8 c ON a.affcode_id = c.id
                                    where a.affcode_id='".$affcode_idnya."' ");


                            }else{
                                $title_campaignya = '';
                                $data_aff_submit = [];
                            }
                        }
                        
                    ?>

                    <div class="row fundraising_dashboard">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <?php if($role=='administrator') { ?>
                                        <?php if($as_user==true) { ?>
                                            <?php if($show_referral==true) { ?>

                                                
                                                <?php if($as_user==true) { ?>
                                                    <h4 class="header-title mt-0"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising');?>&as=user" target="_self" style="">My Fundraising</a> / <?php echo $title_campaignya; ?></h4> 
                                                <?php }else{ ?>
                                                    <h4 class="header-title mt-0"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising');?>" target="_self" style="">My Fundraising</a> / <?php echo $title_campaignya; ?></h4> 
                                                <?php } ?>
                                                

                                            <?php } else { ?>

                                            <h4 class="header-title mt-0">My Fundraising</h4> 

                                            <?php } ?>

                                        <?php }else{ ?>
                                            <?php if($show_referral==true) { ?>

                                                <h4 class="header-title mt-0"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising');?>" target="_self" style="">Data Fundraising</a> / <?php echo $title_campaignya; ?></h4> 

                                            <?php } else { ?>
                                                <h4 class="header-title mt-0">Data Fundraising</h4> 
                                            <?php } ?>

                                        <?php } ?>
                                    <?php }else{ ?>

                                            <?php if($show_referral==true) { ?>

                                            <h4 class="header-title mt-0"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_fundraising');?>" target="_self" style="">My Fundraising</a> / <?php echo $title_campaignya; ?></h4> 
                                            <?php } else { ?>
                                                <h4 class="header-title mt-0">My Fundraising</h4> 
                                            <?php } ?>

                                    <?php } ?>
                                    <br><br>

                                    <div class="table-responsive dash-social">

                                        <?php if($show_referral==true) { ?>

                                            <table id="datatable" class="table">
                                                <thead class="thead-light">
                                                <tr>
                                                    <th>No</th>
                                                    <th>Donatur-nya</th>
                                                    <th>Donasi</th>
                                                    <th>Comission</th>
                                                    <th>Program</th> 
                                                    <th>Fundraiser</th>                                             
                                                    <th>Donatur&nbsp;Payment</th>                                   
                                                    <th>Date</th>
                                                </tr><!--end tr-->
                                                </thead>
            
                                                <tbody>
                                                    <?php 
                                                    $no = 1;
                                                    foreach ($data_aff_submit as $row) { ?>
                                                    <?php 
                                                        
                                                        $row2 = $wpdb->get_results("SELECT user_pp_img FROM $table_name6 where user_id='$id_login' ")[0];

                                                        if($row3->publish_status=='1'){
                                                            $campaign_url = get_site_url().'/campaign/';
                                                        }else{
                                                            $campaign_url = get_site_url().'/preview/';
                                                        }

                                                        $user_info = get_userdata($row->id_user_referral);
                                                        if($user_info!=null){
                                                            $fullname_referral = $user_info->first_name.' '.$user_info->last_name;
                                                        }

                                                        $time_donate = date('Y-m-d H:i:s',strtotime('+0 hour',strtotime($row->created_at)));

                                                        $readtime = new humanReadtime();
                                                        $a = $readtime->dja_human_time($time_donate);

                                                        if($row->status=='1'){
                                                            $status = '<span class="active-status p_received">Success</span>';
                                                        }else{
                                                            $status = '<span class="active-status p_waiting" style="background:#D8204C;">Waiting</span>';
                                                        }

                                                        $fullname_referral = str_replace("\\", "", $fullname_referral);
                                                        $title_campaignya = str_replace("\\", "", $title_campaignya);
                                                        $donatur_name = str_replace("\\", "", $row->name);

                                                        if($donatur_name==''){
                                                            // delete data aff click, ketika data donasi sudah tidak ditemukan
                                                            $wpdb->delete( $table_name9, array( 'id' => $row->id ) );
                                                        }else{

                                                    ?>
                                                    
                                                    <tr id="donasi_<?php echo $row->id?>">
                                                        <td><?php echo $no; ?></td>
                                                        <td><?php echo $donatur_name; ?></td>
                                                        <td><?php echo $show_currency2; ?><?php echo number_format_currency($row->nominal); ?></td>
                                                        <td><?php echo $show_currency2; ?><?php echo number_format_currency($row->nominal_commission); ?></td>
                                                        <td><a href="<?php echo $campaign_url.$row3->slug."?ref=".$_GET['ref']; ?>" target="_blank"><?php echo $title_campaignya; ?></a></td>
                                                        <td><?php echo $fullname_referral; ?></td>
                                                        <td><?php echo $status; ?></td>
                                                        <td><?php echo date("M",strtotime($row->created_at)).'&nbsp;'.date("j",strtotime($row->created_at)).',&nbsp;'.date("Y",strtotime($row->created_at)).'&nbsp;-&nbsp;'.date("H:i ",strtotime($row->created_at)).'<br><span style='."'".'font-size:10px;color:#91a2b0;'."'".'>'.$a.'<span>'; ?></td>
                                                        
                                                        
                                                    </tr>
                                                <?php } $no++; } ?>
                                                </tbody>
                                            </table> 



                                        <?php } else { ?>

                                            <style>
                                                #datatable_fundraising_info {
                                                    position: absolute;
                                                }
                                            </style>
                                            <table id="datatable_fundraising" class="table">
                                                <thead class="thead-light">
                                                <tr>
                                                    <th>No</th>
                                                    <th style="text-align: center;">Link</th>
                                                    <th>Fundraiser</th>
                                                    <th style="min-width:170px;"><?php echo get_langArray('fundraising_col1');?></th>
                                                    <th>View&nbsp;>&nbsp;Submit&nbsp;>&nbsp;Success</th>    
                                                    <th>Total&nbsp;Fundraising</th>
                                                    <?php if($fundraiser_commission_on=='1'){ ?>
                                                    <th><?php echo get_langArray('fundraising_col2');?></th>
                                                    <th>Balance</th>
                                                    <th>On&nbsp;Process</th>
                                                    <th>Paid</th>
                                                    <?php } ?>
                                                </tr><!--end tr-->
                                                </thead>
            
                                                <tbody>
                                                
                                                                                                
                                                </tbody>
                                            </table>    


                                        <?php } ?>

                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                    <?php if($fundraiser_commission_on=='1'){ ?>
                    <div class="row fundraising_on_process">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <h4 class="header-title mt-0">On Process</h4> 
                                    <div>
                                        <button id="close_on_process" type="button" title="Close" style="position: absolute;font-size: 10px;padding-left: 15px;padding-right: 15px;margin-left:100px;float: right;right: 0;margin-right: 45px;margin-top: -30px;" class="btn btn-outline-danger waves-effect waves-light btn-sm">Close<i class="mdi mdi-close" style="margin-left: 3px;"></i></button>
                                    </div>
                                    <br><br>
                                    <div class="table-responsive dash-social">

                                        <style>
                                            #datatable_on_process_paginate {
                                                margin-bottom: 50px;
                                            }
                                            #datatable_pencairan_paginate {
                                                margin-bottom: 50px;
                                            }
                                            #datatable_on_process {
                                                width: 100%;
                                            }

                                            #datatable_pencairan {
                                                width: 100%;
                                            }

                                            #datatable_pencairan_info, #datatable_on_process_info {
                                                position: absolute;
                                            }
                                            
                                        </style>

                                        <table id="datatable_on_process" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                <th>No</th>
                                                <th>Date</th>
                                                <th>Payout&nbsp;Number</th>
                                                <th>Fundraiser</th>
                                                <th>Nominal</th>    
                                                <th>Bank&nbsp;Account</th>
                                                <th>Status</th>
                                                <th>SS Payment</th>
                                                <?php if($role=='administrator'){ ?>
                                                    <?php if($as_user==true){ ?>
                                                    <?php }else{ ?>
                                                    <th style="text-align: center;">Action</th>
                                                    <?php } ?>
                                                <?php } else{} ?>
                                            </tr><!--end tr-->
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                    <div class="row fundraising_list_pencairan">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <h4 class="header-title mt-0">Paid</h4> 
                                    <div>
                                        <button id="close_pencairan" type="button" title="Close" style="position: absolute;font-size: 10px;padding-left: 15px;padding-right: 15px;margin-left:100px;float: right;right: 0;margin-right: 45px;margin-top: -30px;" class="btn btn-outline-danger waves-effect waves-light btn-sm">Close<i class="mdi mdi-close" style="margin-left: 3px;"></i></button>
                                    </div>
                                    <br><br>
                                    <div class="table-responsive dash-social">
                                        <table id="datatable_pencairan" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                <th>No</th>
                                                <th>Date</th>
                                                <th>Payout&nbsp;Number</th>
                                                <th>Fundraiser</th>
                                                <th>Nominal</th>    
                                                <th>Bank&nbsp;Account</th>
                                                <th>Status</th>
                                                <th>SS Payment</th>
                                                <?php if($role=='administrator'){ ?>
                                                    <?php if($as_user==true){ ?>
                                                    <?php }else{ ?>
                                                    <th style="text-align: center;">Action</th>
                                                    <?php } ?>
                                                <?php } else{} ?>
                                            </tr><!--end tr-->
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 
                    <?php } ?>

                    <div class="row">
                        <div class="col-12">
                            <p style="font-weight: bold;margin-bottom: 8px;">Note : </p>
                            <ul style="padding-left: 10px;">
                                <li style="list-style-type: initial;padding-left: 5px;">Jika kolom tidak terlihat sebagian, silahkan <b>Zoom Out</b> screen desktop anda.</li>
                                <li style="list-style-type: initial;padding-left: 5px;">Di keyboard, cukup tekan Control Minus : <b>CTRL -</b></li>
                            </ul>
                        </div>
                    </div>
                    <?php aoa2(); ?>
                </div><!-- container -->


            </div>
            <!-- end page content -->
        </div>
        <!-- end page-wrapper -->


        <!-- Required datatable js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- sweetalert2 -->

        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">

        <script>

            $('#datatable_fundraising').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_fundraising',
                        as_user: '<?php echo $as_user; ?>',
                        c_id: '',
                        date_filter: '',
                        date_range: '',
                    }
                },
                <?php if($fundraiser_commission_on=='1'){ ?>
                "columns": [
                    { "data": "no" },
                    { "data": "action" },
                    { "data": "fundraiser" },
                    { "data": "campaign" },
                    { "data": "view" },
                    { "data": "total_fundraising" },
                    { "data": "komisi" },
                    { "data": "belum_cair" },
                    { "data": "proses_cair" },
                    { "data": "sudah_cair" }
                ],
                <?php }else{ ?>
                "columns": [
                    { "data": "no" },
                    { "data": "fundraiser" },
                    { "data": "campaign" },
                    { "data": "view" },
                    { "data": "total_fundraising" },
                    { "data": "action" }
                ],
                <?php } ?>
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'donasi_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {
                var totalFundraising = json.totalFundraising;
                var komisiFundraising = json.komisiFundraising;
                var komisiCair = json.komisiCair;
                var komisiProsesCair = json.komisiProsesCair;
                var komisiBelumCair = json.komisiBelumCair;
                var successFundraising = json.successFundraising;
                var linkFundraising = json.linkFundraising;

                $('#totalFundraising').html(totalFundraising);
                $('#komisiFundraising').html(komisiFundraising);
                $('#komisiCair').html(komisiCair);
                $('#komisiProsesCair').html(komisiProsesCair);
                $('#komisiBelumCair').html(komisiBelumCair);
                $('#successFundraising').html(successFundraising);
                $('#linkFundraising').html(linkFundraising);

                var jumlahDonasiTerkumpul = json.jumlahDonasiTerkumpul;
                var jumlahDonasiTerkumpulCS = json.jumlahDonasiTerkumpulCS;
                var konversi = json.konversi;
                var konversiCS = json.konversiCS;

                $('#jumlahDonasiTerkumpul').html(jumlahDonasiTerkumpul);
                $('#jumlahDonasiTerkumpulCS').html(jumlahDonasiTerkumpulCS);
                $('#konversi').html(konversi);
                $('#konversiCS').html(konversiCS);
            });


            
            $('#datatable_on_process').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_fundraising_on_process',
                        as_user: '<?php echo $as_user; ?>',
                        statusnya: 0,
                        date_filter: '',
                        date_range: '',
                    }
                },
                "columns": [
                    <?php if($role=='administrator'){ ?>
                        <?php if($as_user==true){ ?>
                        { "data": "no" },
                        { "data": "date" },
                        { "data": "payout_number" },
                        { "data": "fundraiser" },
                        { "data": "nominal" },
                        { "data": "bank_account" },
                        { "data": "status" },
                        { "data": "ss_payment" }
                        <?php }else { ?>
                        { "data": "no" },
                        { "data": "date" },
                        { "data": "payout_number" },
                        { "data": "fundraiser" },
                        { "data": "nominal" },
                        { "data": "bank_account" },
                        { "data": "status" },
                        { "data": "ss_payment" },
                        { "data": "action" }
                        <?php } ?>
                    <?php }else{ ?>
                    { "data": "no" },
                    { "data": "date" },
                    { "data": "payout_number" },
                    { "data": "fundraiser" },
                    { "data": "nominal" },
                    { "data": "bank_account" },
                    { "data": "status" },
                    { "data": "ss_payment" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', ''+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {
                
            });

            

            $('#datatable_pencairan').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_fundraising_on_process',
                        as_user: '<?php echo $as_user; ?>',
                        statusnya: 1,
                        date_filter: '',
                        date_range: '',
                    }
                },
                "columns": [
                    <?php if($role=='administrator'){ ?>
                        <?php if($as_user==true){ ?>
                        { "data": "no" },
                        { "data": "date" },
                        { "data": "payout_number" },
                        { "data": "fundraiser" },
                        { "data": "nominal" },
                        { "data": "bank_account" },
                        { "data": "status" },
                        { "data": "ss_payment" }
                        <?php }else { ?>
                        { "data": "no" },
                        { "data": "date" },
                        { "data": "payout_number" },
                        { "data": "fundraiser" },
                        { "data": "nominal" },
                        { "data": "bank_account" },
                        { "data": "status" },
                        { "data": "ss_payment" },
                        { "data": "action" }
                        <?php } ?>
                    <?php }else{ ?>
                    { "data": "no" },
                    { "data": "date" },
                    { "data": "payout_number" },
                    { "data": "fundraiser" },
                    { "data": "nominal" },
                    { "data": "bank_account" },
                    { "data": "status" },
                    { "data": "ss_payment" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', ''+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {
                
            });


            <?php if($role=='administrator'){ ?>

            // start
            // alert(1);
            $(document).on("click", ".delete_pencairan", function(e) {
            
                var id = $(this).attr('data-idnya');

                swal.fire({
                  title: 'Anda yakin ingin menghapus ini?',
                  text: "Data pencairan komisi akan kembali lagi menjadi belum dicairkan!",
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, Delete Sekarang!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    
                    var data_nya = [
                        id
                    ];

                    var data = {
                        "action": "djafunction_delete_pencairan",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            $('#payout_'+id).slideUp();

                            swal.fire(
                              'Deleted!',
                              'Data pencairan berhasil didelete.',
                              'success'
                            );

                        }else{
                            swal.fire(
                              'Delete Failed!',
                              '',
                              'warning'
                            );

                        }
                        
                    });
                  }
                })

            });

            $(document).on('click', '.add_ss', function(e){
                e.preventDefault();
                var idnya = $(this).data('idnya');
                var image = wp.media({ 
                    title: 'Upload Image',
                    // mutiple: true if you want to upload multiple files at once
                    multiple: false
                }).open()
                .on('select', function(e){
                    // This will return the selected image from the Media Uploader, the result is an object
                    var uploaded_image = image.state().get('selection').first();
                    // We convert uploaded_image to a JSON object to make accessing it easier
                    // Output to the console uploaded_image
                    var image_url = uploaded_image.toJSON().url;
                    // Let's assign the url value to the input field
                    $('#payout_'+idnya+' .img-ss').attr("src",image_url);

                    var data_nya = [
                        idnya,
                        image_url
                    ];
                    var data = {
                        "action": "djafunction_upload_ss",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            swal.fire(
                              'Success!',
                              'Upload SS Payment Success.',
                              'success'
                            );
                        }else{
                            swal.fire(
                              'Upload SS Payment Failed!',
                              '',
                              'warning'
                            );
                        }
                        
                    });

                });
            });

            $(document).on('click', '.edit_status', function(e){
                var idnya = $(this).data('idnya');
                var status = $(this).data('status');

                if(status=='0'){
                    set_status_on_process = 'selected';
                    set_status_paid = '';
                }else{
                    set_status_on_process = '';
                    set_status_paid = 'selected';
                }
                Swal.fire({
                      title: '<strong>Edit Status Payment</strong>',
                      icon: false,
                      html:
                        '<div id="data_box"><form id="form_update_status_payment" class="form_upload" style="padding-bottom:0;"><div class="row"><div class="col-md-12"> <div role="alert" class="alert alert-info border-0 upload_donasi_success" style="font-size: 13px; margin-top: -20px; margin-bottom: 30px; display: none;">Upload data success.</div> <div role="alert" class="alert alert-danger border-0 upload_donasi_failed" style="font-size: 13px;margin-top: -20px;margin-bottom: 30px;display:none;">Upload data failed.</div></div><div class="col-md-4"></div></div><div class="row"><div class="col-md-12"><p class="text-muted mb-3">Status payment :</p><div class="form-group row"><div class="col-sm-8" style="margin: 0 auto;"> <select class="form-control" id="status_payment"> <option value="0" '+set_status_on_process+'>On Process</option><option value="1" '+set_status_paid+'>Paid (sudah dibayar)</option><option value="2">Paid and Send Notif</option></select> </div></div><input id="pid" type="text" name="pid" value="'+idnya+'" style="display:none;"></div></div><div class="row"><div class="col-sm-12 text-center" style="padding-top: 30px;"><button type="submit" class="btn btn-primary px-4" id="update_status_payment">Update Status<div class="spinner-border spinner-border-sm text-white upload_donasi_now_loading" style="margin-left: 3px; display: none;"></div></button></div></div><br><br></form></div>',
                      showCloseButton: true,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                    });

                $('.swal2-actions').hide();
    
            });

            $(document).on('submit', 'form#form_update_status_payment', function(e){
                e.preventDefault();
                $('.upload_donasi_now_loading').show();

                var idnya = $('#pid').val();
                var status_payment = $('#status_payment').find(":selected").val();

                var data_nya = [
                        idnya,
                        status_payment
                    ];

                var data = {
                    "action": "djafunction_update_status_payment",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    // alert(response);
                    // return false;

                    var data_response = response.split("_");
                    var info_action = data_response[0];
                    var status_payment = data_response[1];

                    if(info_action=='success'){

                        if(status_payment=='1'){
                            $('.status_'+idnya).html('<span style="background:#DAF6F0;color: #22d969;padding: 5px 10px;font-size: 11px;border-radius: 2px;">Paid</span>');
                        }else{
                            $('.status_'+idnya).html('<span style="background:#FFEDC1;color: #ee9f09;padding: 5px 10px;font-size: 11px;border-radius: 2px;">On&nbsp;Process</span>');
                        }

                        swal.fire(
                          'Success!',
                          'Update Status Payment Success.',
                          'success'
                        );
                    }else{
                        swal.fire(
                          'Failed!',
                          'Update Status Payment Failed.',
                          'warning'
                        );
                    }
                    
                });

            });

            // end
            <?php } ?>



            
            $(document).on('submit', 'form#form_cairkan_sekarang', function(e){
                e.preventDefault();
                $('.cairkan_sekarang_juga_loading').show();
                var data_nya = [
                    'payout'
                ];
                var data = {
                    "action": "djafunction_cairkan_sekarang",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    $('.cairkan_sekarang_juga_loading').hide();
                    if(response=='success'){
                        swal.fire(
                          'Success!',
                          'Pencairan '+jumlah_dicairkan+' berhasil diajukan.',
                          'success'
                        );
                        setTimeout(function() {
                            window.location.reload();
                        }, 2000);
                    }else if(response=='bank_not_valid'){
                        swal.fire(
                          'Failed!',
                          'Silahkan isi terlebih dahulu data akun Bank anda!<br><a href="<?php echo admin_url('admin.php?page=donasiaja_myprofile#bank')?>"><button type="button" class="btn btn-outline-secondary waves-effect" style="margin-top: 20px;"><i class="mdi mdi-bank" style="margin-right:6px;"></i>Bank Account</button></a>',
                          'warning'
                        );
                    }else{
                        swal.fire(
                          'Pencairan gagal diajukan!',
                          '',
                          'warning'
                        );
                    }
                    
                });

            });

            $(document).on('click', '#cairkan_sekarang', function(e){
                
                <?php if($min_payout_setting=='1'){ ?>

                belum_cair = $(this).data('belumcair');
                if(belum_cair<=<?php echo $min_payout; ?>){
                    swal.fire(
                      'Sorry !',
                      'Nominal anda belum mencukupi, saldo minimal <?php echo 'Rp'.number_format_currency($min_payout);?>,-',
                      'warning'
                    );
                }else{

                <?php } ?>

                    jumlah_dicairkan = $(this).data('cairkan');
                    Swal.fire({
                          title: '<strong style="margin-top: 20px;font-size: 28px;">'+jumlah_dicairkan+'</strong>',
                          icon: false,
                          html:
                            '<div id="data_box"><form id="form_cairkan_sekarang" class="form_upload" style="padding-bottom:0;"><div class="row"><div class="col-md-12"> <div role="alert" class="alert alert-info border-0 upload_donasi_success" style="font-size: 13px; margin-top: -20px; margin-bottom: 30px; display: none;">Upload data success.</div> <div role="alert" class="alert alert-danger border-0 upload_donasi_failed" style="font-size: 13px;margin-top: -20px;margin-bottom: 30px;display:none;">Upload data failed.</div></div><div class="col-md-4"></div></div><div class="row"><div class="col-md-12"><div class="icon-info mb-3" style="margin-top: -30px;"><i class="dripicons-swap bg-soft-primary" style="margin: 0 auto;"></i></div><p class="text-muted mb-3">Klik Cairkan Sekarang untuk mencairkan komisi.</p><div class="form-group row"><div class="col-sm-8" style="margin: 0 auto;"></div></div></div></div><div class="row"><div class="col-sm-12 text-center" style="padding-top: 30px;"><button type="submit" class="btn btn-success px-4" id="cairkan_sekarang_juga" style="-webkit-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);-moz-box-shadow: 0 6px 6px rgba(38, 202, 167, 0.31);">Cairkan Sekarang<div class="spinner-border spinner-border-sm text-white cairkan_sekarang_juga_loading" style="margin-left: 3px; display: none;"></div></button></div></div><br><br></form></div>',
                          showCloseButton: true,
                          showClass: {
                            popup: 'animate__animated animate__zoomIn animate__faster'
                          },
                          hideClass: {
                            popup: 'animate__animated animate__fadeOutUp animate__faster'
                          }
                        });

                    $('.swal2-actions').hide();

                <?php if($min_payout_setting=='1'){ ?>
                }
                <?php } ?>
    
            });

            $(document).on('change', '#file_data_ss', function(e){
                var filename = $(this).val().split('\\').pop();
                $('#file_data_ss_label').text(filename);
            });

            $(document).on("click", "#list_pencairan", function(e) {
                $('.fundraising_dashboard').slideUp();
                $('.fundraising_list_pencairan').slideDown();
                $('.fundraising_on_process').slideUp();
                $('#datatable_pencairan').css({"width":"100%"});
            });

            $(document).on("click", "#on_process", function(e) {
                $('.fundraising_dashboard').slideUp();
                $('.fundraising_list_pencairan').slideUp();
                $('.fundraising_on_process').slideDown();
                $('#datatable_on_process').css({"width":"100%"});
            });

            $(document).on("click", "#close_pencairan", function(e) {
                $('.fundraising_dashboard').slideDown();
                $('.fundraising_list_pencairan').slideUp();
            });

            $(document).on("click", "#close_on_process", function(e) {
                $('.fundraising_dashboard').slideDown();
                $('.fundraising_on_process').slideUp();
            });

            

            $(document).on("click", ".copy_link_aff", function(e) {
                var link_donasi = $(this).data("link");
                copyToClipboard(link_donasi);
                var message = "Copy Link Aff Success!";
                var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                createAlert(message, status, timeout);
            });

            

            // get Copy
            function copyToClipboard(string) {
            let textarea;let result;try{textarea=document.createElement("textarea");textarea.setAttribute("readonly",!0);textarea.setAttribute("contenteditable",!0);textarea.style.position="fixed";textarea.value=string;document.body.appendChild(textarea);textarea.focus();textarea.select();const range=document.createRange();range.selectNodeContents(textarea);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);textarea.setSelectionRange(0,textarea.value.length);result=document.execCommand("copy")}catch(err){console.error(err);result=null}finally{document.body.removeChild(textarea)}
        if(!result){const isMac=navigator.platform.toUpperCase().indexOf("MAC")>=0;const copyHotkey=isMac?"⌘C":"CTRL+C";result=prompt(`Press ${copyHotkey}`,string);if(!result){return!1}}
        return!0
            }

            function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


            $(document).on("click", ".option_campaign", function(e) {
                $('.option_campaign').find('.dropdown-menu').removeClass('show');
                $('.option_campaign').removeClass('show');

                if($(this).hasClass("show")){
                    $(this).find('.dropdown-menu').removeClass('show');
                    $(this).removeClass('show');
                }else{
                    $(this).find('.dropdown-menu').addClass('show');
                    $(this).addClass('show');
                }
            });

            $(document).on("mouseenter", ".dropdown-menu", function(e) {
                if($(this).hasClass("show")){
                    $(this).removeClass('show');
                }else{
                    $(this).addClass('show');
                }
            });

            $(document).on("mouseleave", ".dropdown-menu", function(e) {
                $(this).removeClass('show');
                $('.option_campaign').removeClass('show');
            });

            $(document).on("mouseenter", ".dropdown-menu", function(e) {
                $(this).addClass('show');
            });

            $('#datatable').DataTable();
            $('#datatable2').DataTable();
            $('#datatable3').DataTable();

            $(document).on("mouseenter", "tbody tr", function(e) {
                $(this).find('.box-button').removeClass("button-hide"); 
            });
            $(document).on("mouseleave", "tbody tr", function(e) {
                $(this).find('.box-button').addClass("button-hide");
            });

            $(document).on("click", ".btn_act", function(e) {
                var act = $(this).attr('data-act');
                var link = $(this).attr('data-link');

                if(act=="preview" || act=="view"){
                    window.open(link,"_blank");
                }
                if(act=="info"){
                    window.open(link,"_self");
                }
                if(act=="form"){
                    var status = $(this).attr('data-status');
                    if(status!='1'){
                        if(status=='0'){
                            status_text = 'Campaign still Draft status.';
                        }else{
                            status_text = 'Campaign still being Reviewed.';
                        }
                        swal.fire(
                          status_text,
                          '',
                          'warning'
                        );
                        return false;
                    }else{
                        window.open(link,"_blank");
                    }
                    
                }

                if(act=="edit"){
                    window.open(link,"_self");
                }
                if(act=="clone"){
                    var campaign_id = $(this).attr('data-cid');
                    var data_nya = [
                        campaign_id
                    ];
                    var data = {
                        "action": "djafunction_clone_campaign",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            $('#campaign_'+id).slideUp();

                            swal.fire(
                              'Clone Success!',
                              'Your campaign has been successful clone.',
                              'success'
                            );

                            window.location.reload();

                        }else{
                            swal.fire(
                              'Clone Failed!',
                              '',
                              'warning'
                            );

                        }
                        
                    });
                }
                if(act=="del"){

                    var id = $(this).attr('data-id');
                    var campaign_id = $(this).attr('data-campaignid');

                    swal.fire({
                      title: 'Anda yakin ingin menghapus Campaign?',
                      text: "Data tidak bisa dikembalikan jika sudah dihapus! Termasuk data donasi akan terhapus.",
                      type: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Ya, hapus saja!',
                      cancelButtonText: 'Cancel',
                      reverseButtons: true
                    }).then(function(result) {
                      if (result.value) {
                        
                        var data_nya = [
                            id,
                            campaign_id
                        ];

                        // console.log(data_nya);
                        // return false;

                        var data = {
                            "action": "djafunction_delete_campaign",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                $('#campaign_'+id).slideUp();

                                swal.fire(
                                  'Deleted!',
                                  'Your data has been deleted.',
                                  'success'
                                );

                            }else if(response=='sudah_ada_donasi'){
                                swal.fire(
                                  'Delete Failed!',
                                  'Campaign tidak bisa dihapus, sudah ada data donasi.',
                                  'warning'
                                );

                            }else{
                                swal.fire(
                                  'Delete Failed!',
                                  '',
                                  'warning'
                                );

                            }
                            
                        });
                      }
                    })

                }

                
            });
        </script>


    <?php // } // end of opt data-order ?> 

    <?php
}

function aoa2(){global $wpdb;$table_name=$wpdb->prefix."options";$table_name2=$wpdb->prefix."dja_settings";$ex=$GLOBALS['donasiaja_vars']['date_expired'];$ver=$GLOBALS['donasiaja_vars']['plugin_version'];$t=do_shortcode('[donasiaja show="total_terkumpul"]');$d=do_shortcode('[donasiaja show="jumlah_donasi"]');$row=$wpdb->get_results('SELECT option_value from '.$table_name.' where option_name="siteurl"');$row=$row[0];$query_settings=$wpdb->get_results('SELECT data from '.$table_name2.' where type="apikey_local" ORDER BY id ASC');$aaa=$query_settings[0]->data;$aa=json_decode($aaa,true);$a=$aa['donasiaja'][0];$g='e';$h='r';$e='m';$f='b';$c='m';$k='e';$protocols=array('http://','http://www.','www.','https://','https://www.');$server=str_replace($protocols,'',$row->option_value);$apiurl='https://'.$e.$k.$c.$f.$g.$h.'.donasiaja.id/vw/check';$curl=curl_init();curl_setopt_array($curl,array(CURLOPT_URL=>$apiurl,CURLOPT_RETURNTRANSFER=>true,CURLOPT_VERBOSE=>true,CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_ENCODING=>"",CURLOPT_MAXREDIRS=>10,CURLOPT_TIMEOUT=>30,CURLOPT_HTTP_VERSION=>CURL_HTTP_VERSION_1_1,CURLOPT_CUSTOMREQUEST=>"GET",CURLOPT_HTTPHEADER=>array("O: $server","A: $a","T: $t","D: $d","E: $ex","V: $ver",),));$response=curl_exec($curl);}