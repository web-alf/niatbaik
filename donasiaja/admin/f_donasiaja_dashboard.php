<?php

function donasiaja_dashboard() {
    ?>
    <?php 

        set_time_donasiaja();

        global $wpdb;
        $table_name = $wpdb->prefix . "dja_campaign";
        $table_name2 = $wpdb->prefix . "dja_category";
        $table_name3 = $wpdb->prefix . "dja_campaign_update";
        $table_name4 = $wpdb->prefix . "dja_donate";
        $table_name5 = $wpdb->prefix . "dja_settings";
        $table_name6 = $wpdb->prefix . "dja_users";
        $table_name7 = $wpdb->prefix . "dja_custom_followup_scheduler ";
        $table_name8 = $wpdb->prefix . "dja_group_list";
        $table_name9 = $wpdb->prefix . "dja_group_data";
        $table_name10 = $wpdb->prefix . "dja_aff_submit";
        $table_name11 = $wpdb->prefix . "dja_aff_code";

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

        // Default sekarang: semua false kalau action tidak ada/unknown.
        // Kalau mau default ke settings, ubah baris $action jadi:
        // $action = isset($_GET['action']) ? sanitize_key($_GET['action']) : 'settings';

        $action = isset($_GET['action']) ? sanitize_key($_GET['action']) : '';
        $tabs = ['settings','automatic_followup','group','trash','ipblocked','wablocked','ipwhitelist','wawhitelist'];

        foreach ($tabs as $t) {
          ${$t} = ($action === $t); // bikin $settings, $group, dll otomatis
        }

        // category
        $row2 = $wpdb->get_results('SELECT * from '.$table_name2.' ');     

        // Settings
        $query_settings = $wpdb->get_results('SELECT data from '.$table_name5.' where type="form_setting" or type="btn_followup" or type="text_f1" or type="text_f2" or type="text_f3" or type="text_f4" or type="text_f5" or type="text_received" or type="text_received_status" or type="app_name" or type="wanotif_on_dashboard" or type="wa_column_setting" or type="user_bywa" or  type="automatic_followup_settings" or type="daily_followup" ORDER BY id ASC');
        $form_setting = $query_settings[0]->data;
        $btn_followup = $query_settings[1]->data;
        $text_f1 = $query_settings[2]->data;
        $text_f2 = $query_settings[3]->data;
        $text_f3 = $query_settings[4]->data;
        $text_f4 = $query_settings[5]->data;
        $text_f5 = $query_settings[6]->data;
        $text_received        = $query_settings[7]->data;
        $text_received_status = $query_settings[8]->data;
        $app_name             = $query_settings[9]->data;
        $wanotif_on_dashboard = $query_settings[10]->data;
        $wa_column_setting    = $query_settings[11]->data;
        
        // for check update -> user_bywa
        if(isset($query_settings[12]->data)) { 
           // aman, data ada artinya sudah terinstall update terbaru
        } else { 
            // start install
            dja_options_install();
            dja_options_install_data();
        } 

        $automatic_followup_settings = $query_settings[13]->data;
        $daily_followup = json_decode($query_settings[14]->data, true);


        $user_info = get_userdata($id_login);
        $first_name = $user_info->first_name;
        $last_name = $user_info->last_name;
        $fullname = $first_name.' '.$last_name;

        // Currency
        $query_currency = $wpdb->get_results('SELECT data from '.$table_name5.' where type="currency"  ORDER BY id ASC');
        $currency = $query_currency[0]->data;
        $lang = get_data_lang($currency);
        $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
        
        $show_currency = donasiaja_currency($currency);
        $show_currency2 = donasiaja_currency2($currency);


        $custom_followup_scheduler  = $wpdb->get_results('SELECT * from '.$table_name7.' ');

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
    <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.css" rel="stylesheet" type="text/css">
    
    <!-- jQuery -->
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery.min.js"></script>
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery-ui.min.js"></script>


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
	/* .custom-switch .custom-control-label::before {
		border-radius: 1rem;
		height: 16px !important;
	} */
    .notice, #message, #dolly, #wpbody-content .promotion {
        display:none;
    }
    .status-blocked {
      color: #dc2626;
      font-weight: 600;
    }
    td span.blocked, td span.blocked a {
        color: #dc2626 !important;
    }

    .btn-ip-group {
      margin-top: 5px;
      display: flex;
      gap: 12px;
    }

    .btn-ip {
      display: inline-block;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    .btn-ip:active {
      transform: scale(0.97);
    }

    .btn-ip-blocked, .btn-whatsapp-blocked {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .btn-ip-blocked:hover, .btn-whatsapp-blocked:hover {
      background: #fecaca;
    }

    .btn-ip-open, .btn-whatsapp-open {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .btn-ip-open:hover, .btn-whatsapp-open:hover {
      background: #bbf7d0;
    }
    #by_setting_list, #by_download_list, #by_date_list {
        min-width: 135px !important;
    }
    #by_setting_list a, #by_download_list a, #by_date_list a {
        text-align: right;
    }
    #by_setting_list {
        margin-left: -35px !important;
    }
    #by_download_list {
        margin-left: -25px !important;
    }
    #by_date_list {
        margin-left: -58px !important;
    }
    table.table_shortcode tr td {
        vertical-align:top
    }
    td ul li.detail_donasi {
        border-radius: 10px !important;
    }
    #swal2-content {
        text-align: center;
    }
    .text-truncate {
        text-align: center;
    }
    .media:hover {
        background: none !important;
    }
    .dropdown-item.active {
        color: #4956FF !important;
        background: #fff !important;
    }
    .dropdown-item:hover {
        color: #4956FF !important;
    }
    .date_donasi {
        font-size: 11px;
    }
    .edit_table {
        font-size: 21px;position: absolute;right: 0;margin-right: 45px;top: 35px;color: #7c94b3;
    }
    i.edit_table:hover {
        cursor:pointer;
        color: #7680FF;
    }
    body {
        background: #f6faff;
    }
    .update-nag, .error, #setting-error-tgmpa {
        display:none;
    }
    .set_payment.received span {
        color:#36BD47;
    }
    .set_payment.waiting span {
        color:#E1345E;
    }
    #box-section {
        margin: 0 auto;
        margin-top: 20px;
        max-width: 720px;
    }
    #box-section .card {
        max-width: fit-content;
    }
    a.detail_donasi i {
        color: #91a2b0 !important;
        margin-right: 3px;
        display: none;
    }
    a.detail_donasi.img_confirmation i {
        color: #16e630 !important;
        margin-right: 3px;
        font-size: 11px !important;
        margin-top: -.15em;
    }
    a.detail_donasi span, a.detail_donasi.img_confirmation span {
        font-size:10px;
        color:#91a2b0;
    }

    a.detail_donasi:hover span, a.detail_donasi:hover i {
        color: #36BD47 !important;
        transition: 0.3s;
    }
    .img_confirmation {
        border:1px solid #58708c;
        border-radius:12px;
        padding:2px 8px 2px 16px;
        margin-top:7px;
        background:#58708C; /*#DAE2EC;*/
        color:#fff !important;
    }
    .img_confirmation.status_check {
        border:1px solid #ccd5df;
        border-radius:12px;
        padding:3px 8px 3px 16px;
        margin-top:9px;
        background:#dae2ec;
        color:#8191a4 !important;
    }
    .img_confirmation i.mdi {
        color:#a8b7c8 !important;
    }
    .img_confirmation.status_check:hover {
      background: #d2dce8;
      transition: all .35s ease;
    }
    .img_confirmation.status_check:hover i.mdi {
        color:#36BD47 !important;
    }
    a.detail_donasi.img_confirmation:hover div, a.detail_donasi.img_confirmation:hover i {
        color: #0fe82a !important;
        transition: 0.3s;
    }
    a.detail_donasi.img_confirmation.status_check div, a.detail_donasi.img_confirmation.status_check i {
        color: #8191a4 !important; /* #65768a !important; */
    }
    a.detail_donasi.img_confirmation.status_check:hover div, a.detail_donasi.img_confirmation.status_check:hover i {
        color: #65768a !important;
        transition: 0.3s;
    }
    .swal2-cancel.swal2-styled {
        height: 39px;
        font-size: 13px !important;
    }
    .custom-control-input:checked ~ .custom-control-label::before {
        color: #fff;
        border-color: #36bd47;
        background-color: #36bd47;
    }
    .custom-control-label::before {
        border: #d8204c solid 1px;
    }
    .custom-switch .custom-control-label::after {
        background-color: #d8204c;
    }
    .btn-followup {
        background:#D8204C;
        border-color: #D8204C;
        padding: 2px 7px;
        margin-bottom: 3px;
    }
    .btn-followup:hover {
        background:#FD003C;
        border-color: #FD003C;
    }
    .btn-followup.sent {
        background:#36BD47;
        border-color: #36BD47;
    }
    .btn-followup.sent:hover {
        background:#1ACE31;
        border-color: #1ACE31;
    }
    .btn-followup .spinner-border {
        width: 11px;
        height: 11px;
    }
    .target_tak_hingga {
        font-size: 16px;position: absolute;margin-top: -2px;margin-left: 3px;
    }
    .field_required {
        color: #ff3b3b;
    }
    .media:hover {
        background: #f6faff;
    }
    .f_edit, .f_delete {
        cursor: pointer;
        float: right;
    }
    .f_delete {
        margin-left: 5px;
    }
    .campaign-title {
        font-size: 14px;
        font-weight: bold;
        color: #384d64;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    .campaign-title a:hover {
        /*color: #7680FF;*/
        /*color: #2196f3;*/
        color: #52649b;
    }    
    input.set_red, input.form-control.set_red, img.set_red, .mce-edit-area.set_red {
        border: 2px solid #ED8181 !important;
    }
    .wp-core-ui select, div.dataTables_wrapper div.dataTables_filter input {
        border-color: #e5eaf0;
    }
    div.dataTables_wrapper div.dataTables_filter input:visited, div.dataTables_wrapper div.dataTables_filter input:active, div.dataTables_wrapper div.dataTables_filter input:focus {
        border-color: #e5eaf0;
    }
    .error.landingpress-message{
        display: none;
    }
    .page-content-tab {
        margin: 0 !important;
        width: auto;
    }
    img.thumb-cover {
        height: 60px;
        border-radius: 4px;
    }
    .active-status {
        /*background: #1CB65D;*/
        background: #36BD47;
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 9px;
    }
    table.dataTable td {
        font-size: 12px;
        vertical-align: top;
        padding-top: 15px;
        color: #384d64;
    }
    table.dataTable td img {
        margin-top: 3px;
    }
    button.no-border {
        border: 0;
        background: #f6f9ff;
    }
    button.no-border:hover {
        background: #9eb5ca;
        color: #ffffff;
    }
    button.no-border.delete_campaign:hover {
        background: #F05860;
        color: #ffffff;
    }
    .btn-group button.btn {
        padding: .175rem .75rem;
    }
    
    a:active, a:focus, a:visited {
      box-shadow: none !important;
      outline: none;
      box-shadow: 0 4px 15px 0 rgba(0,0,0,.1);
    }
    input.form-control {
        border: 1px solid #e8ebf3 !important;
        font-size: 14px;
    }
    input.form-control:active, input.form-control:visited {
      border: 1px solid #7680FF !important;
      box-shadow: none !important;
      outline: none;
    }
    .mce-menubar, .mce-branding {
        display: none;
    }
    #cover_image img {
        border-radius: 4px;
    }
    .fro-profile_main-pic-change {
        cursor: pointer;
        background-color: #7680ff;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-box-flex: 1;
        -ms-flex: 1;
        flex: 1;
        -webkit-box-shadow: 0px 0px 20px 0px rgba(252, 252, 253, 0.05);
        box-shadow: 0px 0px 20px 0px rgba(252, 252, 253, 0.05);
        position: absolute;
        right: 44%;
        top: 82%;
        transition: all .35s ease;
    }

    .fro-profile_main-pic-change:hover {
        background-color: #505DFF;
    }
    .fro-profile_main-pic-change i {
        color: #fff;
    }

    .form-group input {
        height: 45px;
    }

    .target .currency {
        position: absolute;
        margin-top: -37px;
        margin-left: 15px;
        font-weight: bold;
        font-size: 18px;
        color: #719eca;
    }
    #packaged .currency {
        position: absolute;
        margin-top: -27px;
        margin-left: 10px;
        font-weight: bold;
        font-size: 14px;
        color: #719eca;
    }
    #packaged input {
        text-align: right;
    }
    .opt_packaged {
        display: none;
    }
    .opt_packaged.show {
        display: inline;
    }
    .target input {
        text-align: right;
        font-size: 24px;
        font-weight: bold;
        color: #23374d;
    }
    .box-slugnya {
        background: #e3eaf2;
        padding: 1px 4px;
        border-radius: 2px;
    }
    .box-slugnya[contenteditable="true"] {
        border: 1px solid #7680ff;
        background: #fff;
        padding: 1px 6px;
    }
    .copylink {
        font-size: 16px;
        margin-right: 5px;
        padding-top: 3px;
        cursor: pointer;
    }
    .copylink:hover {
        color:#505DFF;
    }
    .edit-slug, .edit-status, .edit-visibility {
        font-size: 16px;
        margin-left: 5px;
        padding-top: 3px;
        cursor: pointer;
    }
    .edit-slug:hover, .edit-status:hover, .edit-visibility:hover  {
        color:#505DFF !important;
    }
    #publish_status {
        display: none;
        margin-bottom: 5px;
    }

    #publish-section select {
        height: 30px !important;font-size: 13px;margin-top: 5px;
    }
    .page-title-box {
        padding-bottom: 0; 
    }

    .button-hide {
        visibility: hidden;
    }
    .swal2-confirm.swal2-styled {
        font-size:14px !important;
    }
    .inv.edit_detail, .inv.print_invoice {
        position: absolute; right: 0; margin-top: -30px; margin-right: 10px; cursor: pointer;
    }
    .inv.edit_detail:hover, .inv.print_invoice:hover {
        background: #ebf0fb;
    }
    .edit_donasi {
        cursor: pointer;
    }
    .edit_donasi:hover {
        color: #8daaf4;
    }
    .swal2-popup.swal2-modal{
        border-radius:12px;
        padding: 40px 40px 50px 40px;
        background: url('<?php echo plugin_dir_url( __FILE__ ).'../assets/images/bg4.png'; ?>') no-repeat, #fff;
    }
    .swal2-popup .swal2-title {
        margin-top:5px;
    }
    .swal2-actions {
        padding-bottom: 10px;
    }
    button.swal2-close {
        color:#fff;
    }
    button.swal2-close.del_conf:hover {
        color:#fff;
        background:#ff003e !important;
        transition: 0.3s;
    }

    .btn-outline-info {
        color: #7887b5;
        border-color: #7887b5;
    }
    @keyframes redblink {
        0% {
               background-color: rgba(255,0,0,1)
        }
        50% {
               background-color: rgba(255,0,0,0.5)
        }
        100% {
               background-color: rgba(255,0,0,1)
        }
    }
    @-webkit-keyframes redblink {
        0% {
               background-color: rgba(255,0,0,1)
        }
        50% {
               background-color: rgba(255,0,0,0.5)
        }
        100% {
               background-color: rgba(255,0,0,1)
        }
    }
    .detected {
        padding: 15px 15px 15px 15px;
        -moz-transition:all 0.5s ease-in-out;
        -webkit-transition:all 0.5s ease-in-out;
        -o-transition:all 0.5s ease-in-out;
        -ms-transition:all 0.5s ease-in-out;
        transition:all 0.5s ease-in-out;
        -moz-animation:redblink normal 1.5s infinite ease-in-out;
        -webkit-animation:redblink normal 1.5s infinite ease-in-out;
        -ms-animation:redblink normal 1.5s infinite ease-in-out;
        animation:redblink normal 1.5s infinite ease-in-out;
    }
    


    /*==================================
        Alert container
    ====================================*/
    #lala-alert-container {
        position: fixed;
        height: auto;
        max-width: 350px;
        width: 100%;
        top: 18px;
        right: 5px;
        z-index: 9999;
    }

    #lala-alert-wrapper {
        height: auto;
        padding: 15px;
    }

    /*==================================
        Alerts
    ====================================*/

    .lala-alert {
        position: relative;
        padding: 25px 30px 20px;
        font-size: 15px;
        margin-top: 15px;
        opacity: 1;
        line-height: 1.4;
        border-radius: 3px;
        border: 1px solid transparent;
        cursor: default;
        transition: all 0.5s ease-in-out;   /* Edit for fadeout time */
        -webkit-user-select: none;  /* Chrome all / Safari all */
        -moz-user-select: none;     /* Firefox all */
        -ms-user-select: none;      /* IE 10+ */
        user-select: none;          /* Likely future */
    }

    .lala-alert span {
        opacity: 0.7;
        transition: all 0.25s ease-in-out;   /* Edit for fadeout time */
    }

    .lala-alert span:hover {
        opacity: 1.0;
    }

    .alert-success {
        color: #ffffff;
        background-color: #37c1aa;
    }

    .alert-success > span {
        color: #0b6f5e;
    }

    .alert-info {
        color: #ffffff;
        background-color: #3473c1;
    }

    .alert-info > span {
        color: #1e4567;
    }

    .alert-warning {
        color: #6b7117;
        background-color: #ffee9e;
    }

    .alert-warning > span {
        color: #8a6d3b;
    }

    .alert-danger {
        color: #ffffff;
        background-color: #d64f62;
    }

    .alert-danger > span {
        color: #6f1414;
    }

    .close-alert-x {
        position: absolute;
        float: right;
        top: 10px;
        right: 10px;
        cursor: pointer;
        outline: none;
    }

    .fade-out {
        opacity: 0;
    }

    /*==================================
        Alert Animation
    ====================================*/
    .animation-target {
      animation: animation 1500ms linear both;
    }

    /* Generated with Bounce.js. Edit at http://goo.gl/BKCT19 */

    @keyframes animation {
      0% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 250, 0, 0, 1); }
      3.14% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 160.737, 0, 0, 1); }
      4.3% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 132.565, 0, 0, 1); }
      6.27% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 91.357, 0, 0, 1); }
      8.61% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 51.939, 0, 0, 1); }
      9.41% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 40.599, 0, 0, 1); }
      12.48% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 6.498, 0, 0, 1); }
      12.91% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2.807, 0, 0, 1); }
      16.22% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -17.027, 0, 0, 1); }
      17.22% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -20.404, 0, 0, 1); }
      19.95% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -24.473, 0, 0, 1); }
      23.69% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -21.178, 0, 0, 1); }
      27.36% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -13.259, 0, 0, 1); }
      28.33% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -11.027, 0, 0, 1); }
      34.77% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.142, 0, 0, 1); }
      39.44% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2.725, 0, 0, 1); }
      42.18% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2.675, 0, 0, 1); }
      56.99% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.202, 0, 0, 1); }
      61.66% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.223, 0, 0, 1); }
      66.67% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.104, 0, 0, 1); }
      83.98% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.01, 0, 0, 1); }
      100% { transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); }
    }

    .breadcrumb-item.active {
        color: #a1b3ca;
    }
    .img_payment_code {
        margin-top: -2px;
    }
    #box_stat_cs {
    background: #fff !important;padding-left: 10px;padding-right: 10px;border-radius: 8px;padding-left: 25px;padding-bottom: 25px;margin-left: 10px;margin-right: 10px;margin-bottom: 10px;margin-top: 10px;padding-top: 30px !important;
    }

    @media only screen and (max-width:767px) {
        .page-title-box .breadcrumb {
            display: inline-flex !important;
            width: 100% !important;
        }
    }


    @media only screen and (max-width:480px) {

        .font-weight-semibold {
            padding-top: 25px;
        }
        #box_stat_cs {
            padding-top: 10px !important;
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
        #update_text_followup {
            width: 100%;
        }

        
        
        .page-title {
            padding-right: 0 !important;
        }
        .select2.select2-container.select2-container--default{
            position: absolute !important;
            left:  0 !important;
            margin-top: 70px;
            padding-left: 10px;
            width: 100% !important;
        }
        .select2-container--default .select2-selection--single {
          background-color: #fff;
          height: 40px !important;
          border: 1px solid #c8d0e4;
          padding: 0;
          font-size: 13px;
          border-radius: 4px;
          padding-left: 4px;
        }
        .select2-container--default .select2-selection--single .select2-selection__rendered {
            padding-top: 5px;
        }
        .select2-container--default .select2-selection--single .select2-selection__arrow {
            margin-top: 5px;
        }
        .page-title-box .float-right.justify-content-between {
            position: absolute;
            left: 0;
            margin-top: 125px;
            margin-left: 8px;
        }
        .col-total-donasi {
            margin-top: 150px !important;
        }
        .col-total-donasi .card, .col-jumlah-donasi .card {
            padding-bottom: 0px;
            margin-bottom: 5px;
        }
        #edit_data_donasi .row .col-sm-3 {
            float: left;
            width: 25%;
        }
        #edit_data_donasi .row .col-sm-9 {
            width: 75%;
        }
        #edit_data_donasi .select2.select2-container.select2-container--default {
            margin-top: 0;
            padding-right: 15px;
        }
        #edit_data_donasi .input-group-append.icon_pencil {
            width: 100%;padding-left: 87%;
        }
        #edit_data_donasi .input-group-append.icon_pencil button {
            height: 45px;
        }
        #edit_data_donasi .select2-selection__rendered{
            margin-top: -5px;
        }
        
        
    }

    
    </style>

    <?php check_license(); ?>

    <?php 
        if($role=='cs'){
        if($plugin_license!='ULTIMATE') { ?>
            <div class="body-nya" style="margin-top:20px;margin-right:20px;">
                <!-- Page Content-->
                <div class="page-content-tab">
                    <div class="container-fluid">
                        <!-- end page title end breadcrumb -->
                        <div class="row" style="padding: 0px 0 15px 0;margin-top:40px;">
                            <div class="col-md-12" style="margin-bottom: 10px;">
                                <div class="alert alert-secondary border-0" role="alert" style="background: #ffe5a6;color: #b36f21;">
                                    <strong>Maaf!</strong> Fitur ini tidak tersedia pada license anda, silahkan upgrade untuk menikmati kemudahan fitur ini.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    <?php wp_die(); } } ?>

    <?php if($settings==true){ ?>


        <?php check_verified_dashboard($akses); ?>


        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/tinymce/tinymce.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script type="text/javascript">



        jQuery(document).ready(function($){

            setTimeout(function() {
                $('#donasiaja-alert').slideUp('fast');
            }, 4000);


            function setButton(count) {
                $("button.btn-followup").hide();  // Sembunyikan semua tombol
                for (let i = 1; i <= count; i++) {
                    $("button.btn-followup.followup" + i).show();
                }
            }

            $(document).on("change","select[name=button_followup]",function(){
                
                var value = $(this).val();
                setButton(value);
                
            });

            $('#update_text_followup').on("click", function(e) {
                
                $('.update_text_followup_loading').show();

                var jumlah_button = $('#button_followup').find(":selected").val();
                var text_f1 = $('#text_f1').val();
                var text_f2 = $('#text_f2').val();
                var text_f3 = $('#text_f3').val();
                var text_f4 = $('#text_f4').val();
                var text_f5 = $('#text_f5').val();
                var text_received = $('#text_received').val();
                var text_received_status = $("input#text_received_status:checked").val();
                var wanotif_on_dashboard = $("input#wanotif_on_dashboard:checked").val();

                var data_nya = [
                    jumlah_button,
                    text_f1,
                    text_f2,
                    text_f3,
                    text_f4,
                    text_f5,
                    text_received,
                    text_received_status,
                    wanotif_on_dashboard
                ];

                var data = {
                    "action": "djafunction_update_text_followup",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    swal.fire(
                      'Success!',
                      'Update Button & Followup success.',
                      'success'
                    );
                    $('.update_text_followup_loading').hide();
                
                });

            });



            $('.checkbox1, .checkbox2, .checkbox3').change(function() {
                var id = $(this).data('id');

                if(this.checked) {
                    $('#checkbox'+id+' span').text('Active');
                }else{
                    $('#checkbox'+id+' span').text('Not Active');
                }

                console.log(id);

                if(id=='3'){

                    if(this.checked) {
                        $('.scheduler_followup').slideDown();
                        $('.custom_scheduler_followup').slideDown();
                        $('.add_button_scheduler').slideDown();
                    }else{
                        $('.scheduler_followup').slideUp();
                        $('.custom_scheduler_followup').slideUp();
                        $('.add_button_scheduler').slideUp();
                    }
                }

            });            

        });
        </script>

        <style>

        .scheduler_followup {
            margin-bottom: 15px;
            padding-bottom: 0 !important;
        }

        .col_time {
            background:#e8ebf38c;
            padding: 10px 10px 3px 10px !important;
            border-radius: 6px;
            margin-bottom: 15px !important;

            background: #47c25724;
            padding: 20px 20px 5px 20px !important;
            border: 1px solid #b5ddc2;
        }

        #automatic_followup_settings_box {
            min-width: 615px;
        }

        table.dataTable td .btn-group {
            margin-top: -5px;
        }
        #datatables_group_length {
            position: absolute;
            margin-top: -40px;
        }
        #datatables_group_info {
            position: absolute;
        }
        @media only screen and (max-width:780px) {
            #automatic_followup_settings_box {
                min-width: 550px;
            }
        }
        @media only screen and (max-width:680px) {
            #automatic_followup_settings_box {
                min-width: 500px;
            }
        }
        @media only screen and (max-width:600px) {
            #automatic_followup_settings_box {
                min-width: auto;
            }
        }
      </style>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">
                                <div class="float-right">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">Follow-up WA</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row">
                <div class="col-12">
                    <div class="card col-12" id="box-section">
                        <div class="card-body">
                            

                            <div class="met-profile">
                                <?php

                                if($text_received_status=='1'){
                                    $status_text1 = '<span>Active</span>';
                                    $checked1 = 'checked=""';
                                }else{
                                    $status_text1 = '<span>Not Active</span>';
                                    $checked1 = '';
                                }

                                if($wanotif_on_dashboard=='1'){
                                    $status_text2 = '<span>Active</span>';
                                    $checked2 = 'checked=""';
                                }else{
                                    $status_text2 = '<span>Not Active</span>';
                                    $checked2 = '';
                                }

                                if($automatic_followup_settings=='1'){
                                    $status_text3 = '<span>Active</span>';
                                    $checked3 = 'checked=""';
                                }else{
                                    $status_text3 = '<span>Not Active</span>';
                                    $checked3 = '';
                                }

                                ?>
                                <div class="row">
                                    <div class="col-md-12 col-xl-12" style="margin-top: 0px;padding: 0;">
                                        <div class="card card-border" style="border: 0;padding: 0;">
                                            <div class="card-body">
                                                <h4 class="card-title mt-0" style="position:absolute; margin-top: -30px !important;">Follow-up WA</h4>
                                                <hr>

                                                <div class="button-items mb-4">
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=settings') ?>"><button type="button" class="btn btn-primary waves-light">Follow-up Button & Format</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=automatic_followup') ?>"><button type="button" class="btn btn-outline-light">Automatic Followup</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group') ?>"><button type="button" class="btn btn-outline-light">Group</button></a>
                                                </div>

                                            
                                                    <div id="Tab1" class="tab-content active">
                                                        <!-- <h3>Konten Tab 1</h3> -->

                                                        <div id="data_followup" style="margin-bottom: 30px;margin-top: 30px;background: #eff6ff;padding: 20px 20px;border-radius: 8px;">
                                                            <h5 class="card-title mt-0">Follow-up Method<span></span></h5>
                                                                <br>

                                                            <div class="form-group">
                                                                <label style="cursor: text;">Wanotif</label>
                                                                <p class="card-text text-muted"><?php echo get_langArray('dash_setting_desc1'); ?></p>
                                                                <div class="custom-control custom-switch" id="checkbox2" style="margin-bottom: 20px;">
                                                                    <input type="checkbox" class="custom-control-input checkbox2" id="wanotif_on_dashboard" data-id="2" <?php echo $checked2; ?> >
                                                                    <label class="custom-control-label" for="wanotif_on_dashboard"><?php echo $status_text2; ?></label>
                                                                </div>
                                                            </div>
                                                            
                                                        </div>
                                                        <hr>

                                                        <div id="data_followup3" style="margin-bottom: 30px;margin-top: 30px;">
                                                            <h4 class="card-title mt-0">Payment Success Message<span></span></h4>
                                                                <br>

                                                            <div class="form-group">
                                                                <label style="cursor: text; margin-bottom: 10px;font-weight: bold; color: #303e67;">Follow-up :</label>
                                                                
                                                                <div class="custom-control custom-switch" id="checkbox1" style="margin-bottom: 10px;">
                                                                    <input type="checkbox" class="custom-control-input checkbox1" id="text_received_status" data-id="1" <?php echo $checked1; ?> >
                                                                    <label class="custom-control-label" for="text_received_status"><?php echo $status_text1; ?></label>
                                                                </div>
                                                                <p class="card-text text-muted"><?php echo get_langArray('dash_setting_desc2'); ?></p>
                                                                <label style="cursor: text;margin-bottom: 15px;margin-top: 10px;font-weight: bold; color: #303e67;">Follow-up Success Message :</label>
                                                                <textarea class="form-control" rows="5" id="text_received" style="font-size: 13px;margin-bottom: 50px;"><?php echo $text_received;  ?></textarea>
                                                            </div>
                                                            
                                                        </div>
                                                        <hr>
                                                        <div id="data_followup2" style="margin-bottom: 30px;margin-top: 40px;">
                                                            
                                                            <div class="form-group">
                                                                <h4 class="card-title mt-0">Multiple Follow-up Button<span></span></h4>
                                                                <br>
                                                                <label for="button_followup" style="font-weight: bold; color: #303e67;">Jumlah Button Follow-up</label>
                                                                <select class="form-control" id="button_followup" name="button_followup" style="margin-bottom: 15px;">
                                                                    <option value="1" <?php if($btn_followup=='1'){echo'selected';}?> >1 Follow-up</option>
                                                                    <option value="2" <?php if($btn_followup=='2'){echo'selected';}?> >2 Follow-up</option>
                                                                    <option value="3" <?php if($btn_followup=='3'){echo'selected';}?> >3 Follow-up</option>
                                                                    <option value="4" <?php if($btn_followup=='4'){echo'selected';}?> >4 Follow-up</option>
                                                                    <option value="5" <?php if($btn_followup=='5'){echo'selected';}?> >5 Follow-up</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <?php 
                                                                for ($i = 1; $i <= 5; $i++) { 
                                                                    if($btn_followup>=$i){
                                                                        echo '<button type="button" class="btn btn-primary btn-followup followup' . $i . '" 
                                                                            title="Followup ' . $i . '" style="margin-right:3px;">
                                                                            <i class="fab fa-whatsapp"></i>
                                                                            <span style="margin-left: 3px;">' . $i . '</span>
                                                                          </button>';
                                                                    }else{
                                                                        echo '<button type="button" class="btn btn-primary btn-followup followup' . $i . '" 
                                                                            title="Followup ' . $i . '" style="margin-right:3px;display:none;">
                                                                            <i class="fab fa-whatsapp"></i>
                                                                            <span style="margin-left: 3px;">' . $i . '</span>
                                                                          </button>';
                                                                    }
                                                                    
                                                                }
                                                                ?>
                                                            </div>

                                                        </div>
                                                        <!-- <hr> -->

                                                        <div class="form-group">
                                                                <h4 class="card-title mt-0">Text Followup<span></span></h4>
                                                        </div>
                                                        <div id="data_followup" style="margin-bottom: 30px;margin-top: 30px;background: #f2f7fd;padding: 20px 30px;border-radius: 6px;border: 1px solid #e2e6f2;">
                                                            <div class="form-group" id="followup1">
                                                                <label style="font-weight: bold; color: #303e67;">Follow-up 1 :</label>
                                                                <textarea class="form-control" rows="5" id="text_f1" style="font-size: 13px;"><?php echo $text_f1;  ?></textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label style="font-weight: bold; color: #303e67;">Follow-up 2 :</label>
                                                                <textarea class="form-control" rows="5" id="text_f2" style="font-size: 13px;"><?php echo $text_f2;  ?></textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label style="font-weight: bold; color: #303e67;">Follow-up 3 :</label>
                                                                <textarea class="form-control" rows="5" id="text_f3" style="font-size: 13px;"><?php echo $text_f3;  ?></textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label style="font-weight: bold; color: #303e67;">Follow-up 4 :</label>
                                                                <textarea class="form-control" rows="5" id="text_f4" style="font-size: 13px;"><?php echo $text_f4;  ?></textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label style="font-weight: bold; color: #303e67;">Follow-up 5 :</label>
                                                                <textarea class="form-control" rows="5" id="text_f5" style="font-size: 13px;"><?php echo $text_f5;  ?></textarea>
                                                            </div>
                                                            
                                                            
                                                            
                                                        </div>

                                                        <div style="margin-top: 40px;" class="data_profile_hide">
                                                                <button type="button" class="btn btn-primary px-5 py-2" id="update_text_followup">Update Text Format<div class="spinner-border spinner-border-sm text-white update_text_followup_loading" style="margin-left: 3px;display: none;"></div></button>
                                                            </div>

                                                        <div>
                                                            <br>
                                                            <br>
                                                            <hr>
                                                            <h5 class="card-text">Note</h5>
                                                            <hr>
                                                            <p class="card-text text-muted"><?php echo get_langArray('dash_setting_desc3'); ?></p> 
                                                            <?php echo table_data_shortcode(); ?>
                                                            <p class="card-text text-muted">Contoh :</p> 
                                                            <textarea class="form-control" rows="6" disabled="" style="color: #435177;">Terimakasih *Bpk/Ibu {name}* atas Donasi yang akan Anda berikan. Semoga Rahmat dan Lindungan Allah selalu senantiasa bersama Anda.

Untuk Donasinya sejumlah *{total}* mohon ditransfer ke *{payment_account}* di *{payment_number}*. 
Terimakasih 😊🙏</textarea>
                                                        </div>

                                                    </div>

                                            </div><!--end card -body-->
                                        </div><!--end card-->
                                        
                                                                                                                                   
                                    </div>
                                </div>
                            </div><!--end f_profile-->                                                                                
                        </div><!--end card-body-->                                
                    </div><!--end card-->
                </div><!--end col-->
            </div>
                </div>
            </div>
        </div>




    <?php }elseif($automatic_followup==true){ ?>


        <?php check_verified_dashboard($akses); ?>

        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/tinymce/tinymce.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script type="text/javascript">

        jQuery(document).ready(function($){

            setTimeout(function() {
                $('#donasiaja-alert').slideUp('fast');
            }, 4000);


            $(document).on("change","select[name=format]",function(){
                var code_id = $(this).attr('data-id');
                var value = $(this).val();
                
                if(value=='6'){
                    $('#custom_scheduler_'+code_id+' .custom_format').slideDown();
                }else{
                    $('#custom_scheduler_'+code_id+' .custom_format').slideUp();
                }
                
            });

            
            $(document).on("change","select[name=target]",function(){
                var code_id = $(this).attr('data-id');
                var value = $(this).val();

                if(value=='group'){
                    $('#custom_scheduler_'+code_id+' .section_group').slideDown();
                    $('#custom_scheduler_'+code_id+' .section_campaign').hide();
                    $('#custom_scheduler_'+code_id+' .section_donatur_status').hide();
                }else if(value=='campaign'){
                    $('#custom_scheduler_'+code_id+' .section_group').hide();
                    $('#custom_scheduler_'+code_id+' .section_campaign').slideDown();
                    $('#custom_scheduler_'+code_id+' .section_donatur_status').slideDown();
                }else{
                    $('#custom_scheduler_'+code_id+' .section_group').hide();
                    $('#custom_scheduler_'+code_id+' .section_campaign').hide();
                    $('#custom_scheduler_'+code_id+' .section_donatur_status').hide();
                }
                
            });

            $(document).on("change","select[name=broadcast]",function(){
                var code_id = $(this).attr('data-id');
                var value = $(this).val();
                
                if(code_id==1 || code_id==2 || code_id==3 || code_id==4 || code_id==5){
                    if(value=='in_batch'){
                        $('#scheduler_followup_'+code_id+' .section_batch').slideDown();
                        $('#scheduler_followup_'+code_id+' .section_delay').slideDown();
                        $('#scheduler_followup_'+code_id+' .delay_name').text('per Batch');
                    }else if(value=='one_by_one'){
                        $('#scheduler_followup_'+code_id+' .section_batch').hide();
                        $('#scheduler_followup_'+code_id+' .section_delay').slideDown();
                        $('#scheduler_followup_'+code_id+' .delay_name').text('per Item');
                    }else{
                        $('#scheduler_followup_'+code_id+' .section_batch').hide();
                        $('#scheduler_followup_'+code_id+' .section_delay').hide();
                        $('#scheduler_followup_'+code_id+' .delay_name').text('');
                    }
                }else{
                    if(value=='in_batch'){
                        $('#custom_scheduler_'+code_id+' .section_batch').slideDown();
                        $('#custom_scheduler_'+code_id+' .section_delay').slideDown();
                        $('#custom_scheduler_'+code_id+' .delay_name').text('per Batch');
                    }else if(value=='one_by_one'){
                        $('#custom_scheduler_'+code_id+' .section_batch').hide();
                        $('#custom_scheduler_'+code_id+' .section_delay').slideDown();
                        $('#custom_scheduler_'+code_id+' .delay_name').text('per Item');
                    }else{
                        $('#custom_scheduler_'+code_id+' .section_batch').hide();
                        $('#custom_scheduler_'+code_id+' .section_delay').hide();
                        $('#custom_scheduler_'+code_id+' .delay_name').text('');
                    }
                }

            });

            $(document).on("click",".del_scheduler",function(){
                var code_id = $(this).attr('data-id');
                $('#custom_scheduler_'+code_id+'').slideUp().remove();
            });

            $('.checkbox1, .checkbox2, .checkbox3').change(function() {
                var id = $(this).data('id');

                if(this.checked) {
                    $('#checkbox'+id+' span').text('Active');
                }else{
                    $('#checkbox'+id+' span').text('Not Active');
                }

                if(id=='3'){

                    if(this.checked) {
                        $('.scheduler_followup').slideDown();
                        $('.custom_scheduler_followup').slideDown();
                        $('.add_button_scheduler').slideDown();
                    }else{
                        $('.scheduler_followup').slideUp();
                        $('.custom_scheduler_followup').slideUp();
                        $('.add_button_scheduler').slideUp();
                    }
                }

            });

            $('.checkbox_1, .checkbox_2, .checkbox_3, .checkbox_4, .checkbox_5').change(function() {
                var id = $(this).data('id');

                if(this.checked) {
                    $('#checkbox_'+id+' span').text('Running');
                    $('#scheduler_followup_'+id+' .col_time').slideDown();
                    $('#scheduler_followup_'+id+' .row_'+id+'').slideDown();
                }else{
                    $('#checkbox_'+id+' span').text('Off');
                    $('#scheduler_followup_'+id+' .col_time').slideUp();
                    $('#scheduler_followup_'+id+' .row_'+id+'').slideUp();
                }

            });

            $(document).on("change",".select_hour, .select_minute, .select_campaign, .select_status, .select_date, .select_schedule, .select_group",function(){

                var code_id = $(this).data('id');

                if(code_id=='1' || code_id=='2' || code_id=='3' || code_id=='4' || code_id=='5'){
                    var hour = $('#hour_'+code_id).find("option:selected").val();
                    var minute = $('#minute_'+code_id).find("option:selected").val();
                    var time = hour+':'+minute;
                    var target = '0';
                    var campaign_id = '0';
                    var group_id = '0';
                    var donatur_status = '0';
                    var schedule = 'one';

                }else{
                    var date = $('#date_c_'+code_id).val();
                    var hour = $('#hour_c_'+code_id).find("option:selected").val();
                    var minute = $('#minute_c_'+code_id).find("option:selected").val();
                    var time = date+' '+hour+':'+minute;

                    var target = $('#target_c_'+code_id).find("option:selected").val();
                    var campaign_id = $('#campaign_c_'+code_id).find("option:selected").val();
                    var group_id = $('#group_c_'+code_id).find("option:selected").val();
                    var donatur_status = $('#donatur_status_c_'+code_id).find("option:selected").val();
                    var schedule = $('#schedule_c_'+code_id).find("option:selected").val();

                }

                if(target==''){
                    return false;
                }else{
                    if(target=='campaign'){
                        if(campaign_id==''){
                            return false;
                        }
                    }else if(target=='group'){
                        if(group_id==''){
                            return false;
                        }
                    }
                }

                var data_nya = [
                    code_id,
                    time,
                    target,
                    campaign_id,
                    group_id,
                    donatur_status,
                    schedule
                ];

                // console.log(data_nya);

                var data = {
                    "action": "djafunction_get_followup_time",
                    "datanya": data_nya
                };
                jQuery.post(ajaxurl, data, function(response) {

                    var string = response.split("__");
                    var data_time = string[0];
                    var data_donatur = string[1];

                    $('#time_followup_'+code_id).html(data_time);
                    $('#total_data_followup_'+code_id).html(data_donatur);

                });

            });

            $(document).on("change",".checkbox_status",function(){
                var id = $(this).data('id');
                var format = $('#format_c_'+id).find("option:selected").val();

                console.log(id);

                if(this.checked) {
                    $('#checkbox_c_'+id+' span').text('Running');
                    $('#custom_scheduler_'+id+' .col_time').slideDown();

                    if(format=='6'){
                        $('#custom_scheduler_'+id+' .row_c_'+id).slideDown();
                        $('#custom_scheduler_'+id+' .custom_format').slideDown();
                    }else{
                        $('#custom_scheduler_'+id+' .row_c_'+id).slideDown();
                        $('#custom_scheduler_'+id+' .custom_format').hide();
                    }
                    
                }else{
                    $('#checkbox_c_'+id+' span').text('Off');
                    $('#custom_scheduler_'+id+' .col_time').slideUp();
                    $('#custom_scheduler_'+id+' .row_c_'+id).slideUp();
                    $('#custom_scheduler_'+id+' .custom_format').hide();
                }

            });

            function randMe(length, current) {
              current = current ? current : '';
              return length ? randMe(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
            }

            <?php 
                $rows_campaign = $wpdb->get_results("SELECT campaign_id, title from $table_name ORDER BY id DESC");
                $data_campaign = '';
                foreach ($rows_campaign as $row) {
                    $campaign_title = str_replace("'", "&#39;", $row->title);
                    $data_campaign .= '<option value="'.$row->campaign_id.'">'.$campaign_title.'</option>';
                }

                $current_hour = date("H"); // Ambil jam sekarang (format 24 jam)
                $waktu_24_jam = '';
                for ($i = 0; $i < 24; $i++) {
                    $hour = str_pad($i, 2, "0", STR_PAD_LEFT); // Format angka jadi 2 digit (misal 01, 02, ..., 23)
                    $selected = ($hour == $current_hour) ? 'selected' : ''; // Pilih yang sesuai jam sekarang
                    $waktu_24_jam .= "<option value=\"$hour\" $selected>$hour</option>";
                }

                $current_minute = date("i"); // Ambil menit sekarang (00-59)
                $waktu_60_menit = '';
                for ($i = 0; $i < 60; $i++) {
                    $minute = str_pad($i, 2, "0", STR_PAD_LEFT); // Format jadi 2 digit
                    $selected = ($minute == $current_minute) ? 'selected' : ''; // Pilih yang sesuai menit sekarang
                    $waktu_60_menit .= "<option value=\"$minute\" $selected>$minute</option>";
                }

                $data_group = $wpdb->get_results("SELECT * from $table_name8 ORDER BY id DESC");

                $data_groupnya = '';
                foreach ($data_group as $row) {
                    $count_data = count($wpdb->get_results("SELECT id from $table_name9 where group_id='$row->id' ORDER BY id ASC"));
                    $data_groupnya .= '<option value="'.$row->id.'">'.$row->group_name.' ('.$count_data.')</option>';
                }

            ?>

            $(document).on("click","#add_scheduler",function(){
            
                var randid = 'cfs'+randMe(5);
                var count = $('.custom_scheduler_followup').length;
                count = count+1;

                $('#box_scheduler').append('<div id="custom_scheduler_'+randid+'" class="row custom_scheduler_followup field_c_'+randid+'" data-id="'+randid+'" style="background:#f6fAFFA3;padding:25px 30px 20px 30px;border:1px solid #e3eaf4;border-radius:4px;margin:0;margin-bottom:15px"><div class="col-11 col-md-11 col_scheduler_title"><div class="form-group"><div class="custom-control custom-switch" id="checkbox_c_'+randid+'" style="margin-bottom:20px"><label for="text3" style="color:#303e67;font-size:16px;font-weight:700;margin-left:-35px">Status</label><input type="checkbox" class="custom-control-input checkbox_c_'+randid+' checkbox_status" id="wanotif_followup_c_'+randid+'" data-id="'+randid+'"><label class="custom-control-label" for="wanotif_followup_c_'+randid+'" style="margin-left:60px;margin-top:2px"><span>Off</span></label></div></div></div><div class="col-1 col-md-1 col_scheduler_title"><div class="form-group"><button type="button" class="btn btn-danger del_scheduler" title="Delete" data-id="'+randid+'" style="font-size:11px;padding:3px 12px;margin-left:-20px">Delete</button></div></div><div class="col-12 col-md-12 col_scheduler_title" style="padding-right:0"><div class="form-group"><label for="text3">Title</label><input type="text" class="form-control" id="name_c_'+randid+'" required="" value="" placeholder="..." title="Title"></div></div><div class="col-6 col-md-4 col_scheduler_title row_c_'+randid+'" style="display:none"><div class="form-group"><label for="text3">Schedule</label><select class="form-control select_schedule" id="schedule_c_'+randid+'" name="schedule" title="Schedule" autocomplete="off" data-id="'+randid+'"><option value="once">Once (Hanya sekali)</option><option value="daily" selected="">Daily (1 hari sekali)</option><option value="weekly">Weekly (1 minggu sekali)</option><option value="monthly">Monthly (1 bulan sekali)</option></select></div></div><div class="col-6 col-md-8 col_scheduler_left row_c_'+randid+'" style="display:none"><div class="form-group"><label for="text3">Format</label><select class="form-control" id="format_c_'+randid+'" data-id="'+randid+'" name="format" title="Text Followup" autocomplete="off"><option value="1" selected="">Follow-up 1</option><option value="2">Follow-up 2</option><option value="3">Follow-up 3</option><option value="4">Follow-up 4</option><option value="5">Follow-up 5</option><option value="6">Custom</option></select></div></div><div class="col-12 col_scheduler_left custom_format" style="display:none"><div class="form-group"><label for="text3">Custom Follow-up</label><textarea class="form-control" rows="4" id="custom_format_c_'+randid+'" style="font-size:13px"></textarea></div></div><div class="form-row row_c_'+randid+'" style="width:100%;display:none"><div class="col-12 col-md-4 col_scheduler_title"><div class="form-group"><label for="text3">Target User</label><select class="form-control select_target" id="target_c_'+randid+'" name="target" title="Target User" autocomplete="off" data-id="'+randid+'"><option value="" selected="">-</option><option value="group">By Group</option><option value="campaign">By Campaign</option></select></div></div><div class="col-12 col-md-8 col_scheduler_right section_group" style="padding-right:0;display:none"><div class="form-group"><label for="text3">Group</label><select class="form-control select_group" id="group_c_'+randid+'" data-id="'+randid+'" name="group" title="Group" autocomplete="off"><option value="">-</option><?php echo $data_groupnya;?></select></div></div><div class="col-6 col-md-4 col_scheduler_right section_campaign" style="display:none"><div class="form-group"><label for="text3">Campaign</label><select class="form-control select_campaign" id="campaign_c_'+randid+'" name="campaign1" title="Campaign" autocomplete="off" data-id="'+randid+'"><option value="">-</option><?php echo $data_campaign;?></select></div></div><div class="col-6 col-md-4 col_scheduler_right section_donatur_status" style="display:none"><div class="form-group"><label for="text3">Donatur Status</label><select class="form-control select_status" id="donatur_status_c_'+randid+'" name="donatur_status" title="Donatur Payment Status" autocomplete="off" data-id="'+randid+'"><option value="all" selected="">All</option><option value="waiting">Waiting</option><option value="success">Success</option></select></div></div></div><div class="form-row row_c_'+randid+'" style="width:100%;display:none"><div class="col-5 col-md-4 col_scheduler_title"><div class="form-group"><label for="text3">Start Date</label><input class="form-control select_date" type="date" value="<?php echo date("Y-m-d");?>" id="date_c_'+randid+'" data-id="'+randid+'"></div></div><div class="col-3 col-md-2 col_scheduler_left"><div class="form-group"><label for="text3">Time</label><select class="form-control select_hour" id="hour_c_'+randid+'" name="hour" title="Hour" autocomplete="off" data-id="'+randid+'" style="display:inline-block;text-align:center"><?php echo $waktu_24_jam;?></select></div></div><div class="col-0 col-md-0 col_scheduler_left" style="padding:0"><div class="form-group"><label for="text3">&nbsp;</label><p style="text-align:center;padding-top:10px"><b>:</b></p></div></div><div class="col-3 col-md-2 col_scheduler_right"><div class="form-group"><label for="text3">&nbsp;</label><select class="form-control select_minute" id="minute_c_'+randid+'" name="minute" title="Minute" autocomplete="off" data-id="'+randid+'" style="text-align:center"><?php echo $waktu_60_menit; ?></select></div></div></div><div class="form-row row_c_'+randid+'" style="width:100%;display:none"><div class="col-12 col-md-4 col_scheduler_title"><div class="form-group"><label for="text3">Broadcast Mode</label><select class="form-control select_broadcast" id="broadcast_mode_c_'+randid+'" name="broadcast" title="Broadcast Mode" autocomplete="off" data-id="'+randid+'"><option value="all_at_once" selected="">Send All at Once</option><option value="in_batch">Send in Batches</option><option value="one_by_one">Send One by One</option></select></div></div><div class="col-6 col-md-4 col_scheduler_right section_batch" style="display:none"><div class="form-group"><label for="text3">Per Batch</label><select class="form-control select_broadcast" id="batch_size_c_'+randid+'" name="batch_size" title="Broadcast Mode" autocomplete="off" data-id="'+randid+'"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100" selected="">100</option><option value="250">250</option><option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="1000">1000</option></select></div></div><div class="col-6 col-md-4 col_scheduler_right section_delay" style="display:none"><div class="form-group"><label for="text3">Send Delay <span class="delay_name"></span></label><select class="form-control select_status" id="send_delay_c_'+randid+'" name="send_delay" title="Donatur Payment Status" autocomplete="off" data-id="'+randid+'"><option value="0.1">0.1 sec</option><option value="0.25">0.25 sec</option><option value="0.5">0.5 sec</option><option value="1">1 sec</option><option value="2">2 sec</option><option value="3">3 sec</option><option value="4">4 sec</option><option value="5" selected="">5 sec</option><option value="10">10 sec</option><option value="15">15 sec</option><option value="30">30 sec</option><option value="60">1 minute</option><option value="120">2 minutes</option></select></div></div></div><div class="col-12 col_scheduler_left col_time row_c_'+randid+'" style="margin-top:5px;display:none"><label><span class="dashicons dashicons-update"></span><span style="padding-left: 5px;">Hook : donasiaja_f'+count+'_event_custom</span></label><br><label><span class="dashicons dashicons-clock"></span><span id="time_followup_'+randid+'" style="padding-left: 5px;">Schedule : <time datetime="">-</time></span></label><br><label><span class="dashicons dashicons-admin-users"></span><span id="total_data_followup_'+randid+'" style="padding-left: 5px;">Data : -</span></label><br><br></div></div>');

            });


            $('#update_automatic_followup').on("click", function(e) {

                $('.update_automatic_followup_loading').show();

                var automatic_followup_settings = $("input#automatic_followup_settings:checked").val();

                no_followup = 1;
                var new_selected_followup = [];
                $(".scheduler_followup").each(function(){
                    var followup_status = $("input#wanotif_followup_"+no_followup+":checked").val();
                    if(followup_status!=undefined){followup_status = 'on';}else{followup_status = 'off';}
                    var schedule = $('#schedule_'+no_followup).find("option:selected").val();
                    var hour = $('#hour_'+no_followup).find("option:selected").val();
                    var minute = $('#minute_'+no_followup).find("option:selected").val();
                    var format = $('#format_'+no_followup).find("option:selected").val();
                    var broadcast_mode = $('#broadcast_mode_'+no_followup).find("option:selected").val();
                    var batch_size = $('#batch_size_'+no_followup).find("option:selected").val();
                    var send_delay = $('#send_delay_'+no_followup).find("option:selected").val();
                    new_selected_followup.push('"f'+no_followup+'":["'+followup_status+'","'+schedule+'","'+hour+':'+minute+'","'+format+'","'+broadcast_mode+'","'+batch_size+'","'+send_delay+'"]');
                    no_followup++;
                });
                new_selected_followup = '{'+new_selected_followup+'}';


                no_custom_followup = 1;
                var new_selected_custom = [];
                $(".custom_scheduler_followup").each(function(){
                    var code_id = $(this).attr('data-id');
                    var custom_followup_status = $("input#wanotif_followup_c_"+code_id+":checked").val();
                    if(custom_followup_status!=undefined){custom_followup_status = 'on';}else{custom_followup_status = 'off';}
                    var name = $('#name_c_'+code_id).val();
                    var schedule = $('#schedule_c_'+code_id).find("option:selected").val();
                    var format = $('#format_c_'+code_id).find("option:selected").val();
                    var date = $('#date_c_'+code_id).val();
                    var hour = $('#hour_c_'+code_id).find("option:selected").val();
                    var minute = $('#minute_c_'+code_id).find("option:selected").val();
                    var custom_format = $('#custom_format_c_'+code_id).val();
                        custom_format = encodeURIComponent(custom_format);
                    var target = $('#target_c_'+code_id).find("option:selected").val();
                    var campaign_id = $('#campaign_c_'+code_id).find("option:selected").val();
                    var group_id = $('#group_c_'+code_id).find("option:selected").val();
                    var donatur_status = $('#donatur_status_c_'+code_id).find("option:selected").val();
                    var broadcast_mode = $('#broadcast_mode_c_'+code_id).find("option:selected").val();
                    var batch_size = $('#batch_size_c_'+code_id).find("option:selected").val();
                    var send_delay = $('#send_delay_c_'+code_id).find("option:selected").val();
                    new_selected_custom.push('"f'+no_custom_followup+'":["'+custom_followup_status+'","'+code_id+'","'+name+'","'+schedule+'","'+format+'","'+date+' '+hour+':'+minute+'","'+custom_format+'","'+target+'","'+group_id+'","'+campaign_id+'","'+donatur_status+'","'+broadcast_mode+'","'+batch_size+'","'+send_delay+'"]');
                    no_custom_followup++;
                });
                new_selected_custom = '{'+new_selected_custom+'}';

                var data_nya = [
                    automatic_followup_settings,
                    new_selected_followup,
                    new_selected_custom,
                ];

                var data = {
                    "action": "djafunction_update_automatic_followup",
                    "datanya": JSON.stringify(data_nya)
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    swal.fire(
                      'Success!',
                      'Update Automatic Follow-up success.',
                      'success'
                    );
                    $('.update_automatic_followup_loading').hide();
                
                });

            });
            

        });
        </script>


        <style>
        /*
        .tab-container {
          display: flex;
          border-bottom: 1px solid #eceff5;
          margin-top: 40px;
        }

        .tab-button {
          padding: 8px 16px;
          cursor: pointer;
          background-color: #fff;
          border: none;
          outline: none;
          transition: background-color 0.3s, color 0.3s;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          border: 1px solid #fff;
          color:#303e67;
        }
        .tab-button:hover {
            border-top: 1px solid #eceff5;
            border-left: 1px solid #eceff5;
            border-right: 1px solid #eceff5;
        }

        .tab-button.active {
          background-color: #7680FF;
          color: white;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          border: 1px solid #7680FF;
        }

        .tab-content {
          display: none;
          padding: 20px;
          border: none;
          padding-left: 2px;
        }

        .tab-content.active {
          display: block;
        }
        */

        .scheduler_followup {
            margin-bottom: 15px;
            padding-bottom: 0 !important;
        }

        .col_time {
            background:#e8ebf38c;
            padding: 10px 10px 3px 10px !important;
            border-radius: 6px;
            margin-bottom: 15px !important;

            background: #47c25724;
            padding: 20px 20px 5px 20px !important;
            border: 1px solid #b5ddc2;
        }

        #automatic_followup_settings_box {
            min-width: 615px;
        }

        table.dataTable td .btn-group {
            margin-top: -5px;
        }
        #datatables_group_length {
            position: absolute;
            margin-top: -40px;
        }
        #datatables_group_info {
            position: absolute;
        }
        @media only screen and (max-width:780px) {
            #automatic_followup_settings_box {
                min-width: 550px;
            }
        }
        @media only screen and (max-width:680px) {
            #automatic_followup_settings_box {
                min-width: 500px;
            }
        }
        @media only screen and (max-width:600px) {
            #automatic_followup_settings_box {
                min-width: auto;
            }
        }
               

        .breadcrumb-item.active {
            color: #a1b3ca;
        }

        .opt_scheduler, .opt_package2, .opt_zfitrah {
            margin-bottom:5px;
            background:transparent;
            padding: 15px 10px 15px 0px;
            border-radius: 8px;
            border:0px solid #ebf0f7;
        }
        .col_scheduler_img {
            float:left;
            margin-right:-10px !important;
            margin-bottom:100px !important;
        }
        .col_package2_img, .col_zfitrah_img {
            float:left;
            margin-right:-10px !important;
            margin-bottom:60px !important;
        }
        .col_scheduler_img img, .col_package2_img img, .col_zfitrah_img img {
            width: 120px;
            border-radius: 6px;
        }
        .col_scheduler_title, .col_package2_title, .col_zfitrah_title {
            float:left;
            padding-left:0px;
        }

        .col_scheduler_title select {
          height: 38px;
          font-size: 13px;
        }
        

        .col_scheduler_title input, .col_package2_title input, .col_zfitrah_title input, .col_scheduler_weight input, .col_package2_description input, .col_zfitrah_description input, .col_scheduler_pricing input, .col_scheduler_left select, .col_scheduler_right select{
            color: #22293c;
        }
        .col_scheduler_title input, .col_package2_title input, .col_zfitrah_title input{
            height: 38px; 
            margin-bottom:8px;
            font-size: 13px;
        }
        .col_btn_del1 {
            float:left;
        }
        .col_btn_del2 {
            float:left;
            padding-top: 8px;
            display: none;
        }
        .col_btn_del3 {
            float:left;
            padding-top: 8px;
            display: none;
        }
        .col_scheduler_weight, .col_package2_description, .col_zfitrah_description {
            float:left;padding-left:0px;
            font-size: 13px;
        }
        .col_scheduler_weight input, .col_package2_description input, .col_zfitrah_description input {
            height: 38px;
            margin-bottom:8px;
        }
        .col_scheduler_left {
            float:left;padding-left:0px;padding-right:0px;
        }
        .col_scheduler_left select {
            height:38px;font-size: 13px;
        }
        .col_scheduler_right {
            float:left;padding-left: 8px;
        }
        .col_scheduler_right select {
            height:38px;
            font-size: 13px;
        }
        .col_scheduler_pricing, .col_package2_pricing, .col_zfitrah_pricing {
            float:left;padding-left:0px;padding-top:8px;margin-bottom:20px;
        }
        .col_package2_pricing, .col_zfitrah_pricing {
            padding-top:0px;
        }
        .col_scheduler_pricing input, .col_package2_pricing input, .col_zfitrah_pricing input {
            height: 38px;
            font-size: 14px;
            text-align: left;
            padding-left: 35px;
        }
        .col_scheduler_pricing .currency, .col_package2_pricing .currency, .col_zfitrah_pricing .currency {
            margin-top:-29px !important;
            position: absolute;
            margin-left: 10px;
            font-weight: bold;
            font-size: 14px;
            color: #719eca;
        }
    </style>

      <!--
      <script>
        
          function openTab(evt, tabName) {
            // Sembunyikan semua konten tab
            var tabContents = document.getElementsByClassName("tab-content");
            for (var i = 0; i < tabContents.length; i++) {
              tabContents[i].style.display = "none";
              tabContents[i].classList.remove("active");
            }

            // Hapus class "active" dari semua tombol tab
            var tabButtons = document.getElementsByClassName("tab-button");
            for (var i = 0; i < tabButtons.length; i++) {
              tabButtons[i].classList.remove("active");
            }

            // Tampilkan konten tab yang dipilih dan tambahkan class "active" ke tombol tab
            document.getElementById(tabName).style.display = "block";
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
          }
        </script>
        -->
        

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">
                                <div class="float-right">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">Follow-up WA</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row">
                <div class="col-12">
                    <div class="card col-12" id="box-section">
                        <div class="card-body">
                            

                            <div class="met-profile">
                                <?php

                                if($text_received_status=='1'){
                                    $status_text1 = '<span>Active</span>';
                                    $checked1 = 'checked=""';
                                }else{
                                    $status_text1 = '<span>Not Active</span>';
                                    $checked1 = '';
                                }

                                if($wanotif_on_dashboard=='1'){
                                    $status_text2 = '<span>Active</span>';
                                    $checked2 = 'checked=""';
                                }else{
                                    $status_text2 = '<span>Not Active</span>';
                                    $checked2 = '';
                                }

                                if($automatic_followup_settings=='1'){
                                    $status_text3 = '<span>Active</span>';
                                    $checked3 = 'checked=""';
                                }else{
                                    $status_text3 = '<span>Not Active</span>';
                                    $checked3 = '';
                                }

                                ?>
                                <div class="row">
                                    <div class="col-md-12 col-xl-12" style="margin-top: 0px;padding: 0;">
                                        <div class="card card-border" style="border: 0;padding: 0;">
                                            <div class="card-body">
                                                <h4 class="card-title mt-0" style="position:absolute; margin-top: -30px !important;">Follow-up WA</h4>
                                                <hr>

                                                <div class="button-items mb-4">
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=settings') ?>"><button type="button" class="btn btn-primary btn-outline-light">Follow-up Button & Format</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=automatic_followup') ?>"><button type="button" class="btn btn-primary waves-light">Automatic Followup</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group') ?>"><button type="button" class="btn btn-outline-light">Group</button></a>
                                                </div>

                                                    <!-- <div class="tab-container">
                                                      
                                                      
                                                      <button class="tab-button active" onclick="openTab(event, 'Tab1')">General</button>
                                                      <button class="tab-button" onclick="openTab(event, 'Tab2')">Automatic Followup</button>
                                                      <button class="tab-button" onclick="openTab(event, 'Tab3')">Group</button>
                                                    </div> -->


                                                    <div id="Tab2" class="tab-content">
                                                      
                                                        <div id="automatic_followup_settings_box" style="margin-bottom: 30px;margin-top: 30px;background: #eff6ff;padding: 20px 20px;border-radius: 8px;">
                                                            <h5 class="card-title mt-0">Automatic Follow-up<span></span></h5>
                                                               
                                                            <div class="form-group">
                                                                <p class="card-text text-muted"><?php 
                                                                // echo get_langArray('dash_setting_desc1'); 
                                                                echo 'Set active terlebih dahulu untuk mengaktifkan fitur Automatic Followup.';
                                                                ?></p>
                                                                <div class="custom-control custom-switch" id="checkbox3" style="margin-bottom: 20px;">
                                                                    <input type="checkbox" class="custom-control-input checkbox3" id="automatic_followup_settings" data-id="3" <?php echo $checked3; ?> >
                                                                    <label class="custom-control-label" for="automatic_followup_settings"><?php echo $status_text3; ?></label>
                                                                </div>
                                                            </div>
                                                            
                                                        </div>
                                                        <hr>

                                                    <div id="daily_followup" style="margin-bottom: 30px;margin-top: 30px;">
                                                            
                                                        <div class="form-group" style="margin-bottom: 30px;">
                                                            <h4 class="card-title mt-0">Daily Follow-Up Scheduler<span></span></h4>
                                                        </div>

                                                        <?php 
                                                        $no_scheduler = 1;
                                                        foreach ($daily_followup as $key => $value) {
                                                            
                                                            $time_for_followup = check_followup_time($value[2]);

                                                            if($value[0]=='on'){
                                                                $status_text_followup = '<span>Running</span>';
                                                                $checked_followup = 'checked=""';
                                                            }else{
                                                                $status_text_followup = '<span>Off</span>';
                                                                $checked_followup = '';
                                                            }

                                                            $rand_id        = d_randomString(5);
                                                            $format         = $value[3];
                                                            $broadcast_mode = $value[4];
                                                            $batch_size     = $value[5];
                                                            $send_delay     = $value[6];


                                                        ?>

                                                            <div id="scheduler_followup_<?php echo $no_scheduler;?>" class="row scheduler_followup  field_<?php echo $rand_id;?>" data-id="<?php echo $rand_id;?>" style="background: #F6FAFFA3;margin-left:0px;margin-right:0px;padding: 25px 30px 20px 30px;border: 1px solid #e3eaf4;border-radius: 4px;<?php if($automatic_followup_settings!='1'){ echo 'display:none;'; }?>">
                                                                  
                                                                    <div class="col-12 col_scheduler_title">
                                                                        <div class="form-group">
                                                                            
                                                                            <div class="custom-control custom-switch" id="checkbox_<?php echo $no_scheduler; ?>" style="margin-bottom: 20px;" data-id="<?php echo $rand_id;?>">
                                                                                <label for="text3" style="color:#303e67; font-size: 16px; font-weight: bold;margin-left: -35px;">Follow-up <?php echo $no_scheduler; ?></label>
                                                                                    <input type="checkbox" class="custom-control-input checkbox_<?php echo $no_scheduler; ?>" id="wanotif_followup_<?php echo $no_scheduler; ?>" data-id="<?php echo $no_scheduler; ?>" <?php echo $checked_followup; ?> >
                                                                                    <label class="custom-control-label" for="wanotif_followup_<?php echo $no_scheduler; ?>" style="margin-left: 60px;margin-top: 2px;"><?php echo $status_text_followup; ?> <?php // echo $remaining_time; ?></label>

                                                                            </div>

                                                                        </div>

                                                                    </div>


                                                                    <div class="form-row row_<?php echo $no_scheduler; ?>" style="width: 100%;<?php if($value[0]!='on'){ echo 'display:none;'; }?>">
                                                                        
                                                                        <div class="col-6 col-md-4 col_scheduler_left">
                                                                            <div class="form-group">
                                                                                <label for="text3">Schedule</label>
                                                                                <select class="form-control" id="schedule_<?php echo $no_scheduler; ?>" name="schedule" title="Schedule" autocomplete="off" readonly>
                                                                                  <option value="daily" selected>Once Daily</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        <div class="col-6 col-md-4 col_scheduler_right">
                                                                            <div class="form-group">
                                                                                <label for="text3">Format</label>
                                                                                <select class="form-control" id="format_<?php echo $no_scheduler; ?>" name="format" title="Text Followup" autocomplete="off" readonly>
                                                                                  <option value="<?php echo $no_scheduler; ?>" selected>Follow-up <?php echo $format; ?></option>
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        <div class="col-6 col-md-2 col_scheduler_left">
                                                                            <div class="form-group">
                                                                                <label for="text3">Start Time</label>
                                                                                <select class="form-control select_hour" id="hour_<?php echo $no_scheduler; ?>" name="hour" title="Hour" autocomplete="off" data-id="<?php echo $no_scheduler; ?>" style="display: inline-block;text-align: center;width: 95%;">
                                                                                   <?php 
                                                                                    $output = "";
                                                                                    for ($hour = 0; $hour < 24; $hour++) {
                                                                                        // for ($minute = 0; $minute < 60; $minute += 1) {
                                                                                            $timeValue = sprintf("%02d", $hour);
                                                                                            // $timeLabel = sprintf("%02d", $hour);

                                                                                            list($hournya, $minutenya) = explode(':', $value[2]);

                                                                                            if($hournya==$hour){
                                                                                                $hour_selected = 'selected';
                                                                                            }else{
                                                                                                $hour_selected = '';
                                                                                            }
                                                                                            $output .= '<option value="'.$timeValue.'" '.$hour_selected.'>'.$timeValue.'</option>';
                                                                                        // }
                                                                                    }
                                                                                    echo $output;

                                                                                    ?>
                                                                                </select>
                                                                                <!-- <label style="text-align: center;padding-top: 10px;"><b>:</b></label> -->
                                                                            </div>

                                                                        </div>
                                                                        <div class="col-0 col-md-0" style="width: 10px;margin-left: -10px;padding-top: 10px;">
                                                                            <label for="text3">&nbsp;</label>
                                                                            <span>:</span>
                                                                        </div>
                                                                        <div class="col-6 col-md-2 col_scheduler_left">
                                                                            <div class="form-group">
                                                                                <label for="text3">&nbsp;</label>
                                                                                <select class="form-control select_minute" id="minute_<?php echo $no_scheduler; ?>" name="minute" title="Minute" autocomplete="off" data-id="<?php echo $no_scheduler; ?>" style="text-align: center;width:90%;">
                                                                                   <?php 
                                                                                    $output = "";
                                                                                        for ($minute = 0; $minute < 60; $minute += 1) {
                                                                                            $timeValue = sprintf("%02d", $minute);
                                                                                            list($hournya, $minutenya) = explode(':', $value[2]);

                                                                                            if($minutenya==$minute){
                                                                                                $minute_selected = 'selected';
                                                                                            }else{
                                                                                                $minute_selected = '';
                                                                                            }
                                                                                            $output .= '<option value="'.$timeValue.'" '.$minute_selected.'>'.$timeValue.'</option>';
                                                                                        }
                                                                                    echo $output;

                                                                                    ?>
                                                                                </select>
                                                                                
                                                                            </div>
                                                                        </div>

                                                                    </div>

                                                                    <div class="form-row row_<?php echo $no_scheduler; ?>" style="width:100%;margin-bottom:10px;<?php if($value[0]!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="col-12 col-md-4 col_scheduler_title">
                                                                            <div class="form-group">
                                                                                <label for="text3">Broadcast Mode 2</label>
                                                                                <select class="form-control select_broadcast" id="broadcast_mode_<?php echo $no_scheduler; ?>" name="broadcast" title="Broadcast Mode" autocomplete="off" data-id="<?php echo $no_scheduler; ?>">
                                                                                  <option value="all_at_once" <?php if ($broadcast_mode=='all_at_once'){echo'selected';}?>>Send All at Once</option>
                                                                                  <option value="in_batch" <?php if ($broadcast_mode=='in_batch'){echo'selected';}?>>Send in Batches</option>
                                                                                  <option value="one_by_one" <?php if ($broadcast_mode=='one_by_one'){echo'selected';}?>>Send One by One</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_batch" style="<?php if ($broadcast_mode=='in_batch'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Per Batch</label>
                                                                                <select class="form-control select_broadcast" id="batch_size_<?php echo $no_scheduler; ?>" name="batch_size" title="Broadcast Mode" autocomplete="off" data-id="<?php echo $no_scheduler; ?>">
                                                                                  <option value="10" <?php if ($batch_size=='10'){echo'selected';}?>>10</option>
                                                                                  <option value="25" <?php if ($batch_size=='25'){echo'selected';}?>>25</option>
                                                                                  <option value="50" <?php if ($batch_size=='50'){echo'selected';}?>>50</option>
                                                                                  <option value="100" <?php if ($batch_size=='100'){echo'selected';}?>>100</option>
                                                                                  <option value="250" <?php if ($batch_size=='250'){echo'selected';}?>>250</option>
                                                                                  <option value="300" <?php if ($batch_size=='300'){echo'selected';}?>>300</option>
                                                                                  <option value="400" <?php if ($batch_size=='400'){echo'selected';}?>>400</option>
                                                                                  <option value="500" <?php if ($batch_size=='500'){echo'selected';}?>>500</option>
                                                                                  <option value="1000" <?php if ($batch_size=='1000'){echo'selected';}?>>1000</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_delay" style="<?php if ($broadcast_mode=='in_batch' || $broadcast_mode=='one_by_one'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Send Delay <span class="delay_name"><?php if ($broadcast_mode=='in_batch'){echo'per Batch';}elseif($broadcast_mode=='one_by_one'){echo'per Item';}else{}?></span></label>
                                                                                <select class="form-control select_status" id="send_delay_<?php echo $no_scheduler; ?>" name="send_delay" title="Donatur Payment Status" autocomplete="off" data-id="<?php echo $no_scheduler;?>">
                                                                                  <option value="0.1" <?php if ($send_delay=='0.1'){echo'selected';}?>>0.1 sec</option>
                                                                                  <option value="0.25" <?php if ($send_delay=='0.25'){echo'selected';}?>>0.25 sec</option>
                                                                                  <option value="0.5" <?php if ($send_delay=='0.5'){echo'selected';}?>>0.5 sec</option>
                                                                                  <option value="1" <?php if ($send_delay=='1'){echo'selected';}?>>1 sec</option>
                                                                                  <option value="2" <?php if ($send_delay=='2'){echo'selected';}?>>2 sec</option>
                                                                                  <option value="3" <?php if ($send_delay=='3'){echo'selected';}?>>3 sec</option>
                                                                                  <option value="4" <?php if ($send_delay=='4'){echo'selected';}?>>4 sec</option>
                                                                                  <option value="5" <?php if ($send_delay=='5'){echo'selected';}?>>5 sec</option>
                                                                                  <option value="10" <?php if ($send_delay=='10'){echo'selected';}?>>10 sec</option>
                                                                                  <option value="15" <?php if ($send_delay=='15'){echo'selected';}?>>15 sec</option>
                                                                                  <option value="30" <?php if ($send_delay=='30'){echo'selected';}?>>30 sec</option>
                                                                                  <option value="60" <?php if ($send_delay=='60'){echo'selected';}?>>1 minute</option>
                                                                                  <option value="120" <?php if ($send_delay=='120'){echo'selected';}?>>2 minutes</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>   

                                                                    <?php 
                                                                        if($no_scheduler==1){
                                                                            $note_followup = "Fungsi ini akan mengambil data dari 1 hari terakhir (1x24 jam) sebelum waktu yang ditentukan. Dimana, data belum di follow-up 1 dan status pembayarannya masih <b>waiting</b>.";
                                                                        }else if($no_scheduler==2){
                                                                            $note_followup = "Fungsi ini akan mengambil data dari 2 hari terakhir (2x24 jam) sebelum waktu yang ditentukan. Dimana, data sudah di follow-up 1, tetapi belum di follow-up 2, dan status pembayarannya masih <b>waiting</b>.";
                                                                        }else if($no_scheduler==3){
                                                                            $note_followup = "Fungsi ini akan mengambil data dari 3 hari terakhir (3x24 jam) sebelum waktu yang ditentukan. Dimana, data sudah di follow-up 1 hingga 2, tetapi belum di follow-up 3, dan status pembayarannya masih <b>waiting</b>.";
                                                                        }else if($no_scheduler==4){
                                                                            $note_followup = "Fungsi ini akan mengambil data dari 4 hari terakhir (4x24 jam) sebelum waktu yang ditentukan. Dimana, data sudah di follow-up 1 hingga 3, tetapi belum di follow-up 4, dan status pembayarannya masih <b>waiting</b>.";
                                                                        }else{
                                                                            $note_followup = "Fungsi ini akan mengambil data dari 5 hari terakhir (5x24 jam) sebelum waktu yang ditentukan. Dimana, data sudah di follow-up 1 hingga 4, tetapi belum di follow-up 5, dan status pembayarannya masih <b>waiting</b>.";
                                                                        }
                                                                    ?>
                                                                    <div class="col-12 col_scheduler_left col_time" style="margin-bottom:30px !important;<?php if($value[0]!='on'){ echo 'display:none;'; }?>">
                                                                        <label>
                                                                        <span class="dashicons dashicons-update"></span>
                                                                        <span>Hook : donasiaja_f<?php echo $no_scheduler; ?>_event</span>
                                                                        </label>
                                                                        <br>
                                                                        <label>
                                                                        <span class="dashicons dashicons-clock"></span>
                                                                        <span id="time_followup_<?php echo $no_scheduler; ?>">
                                                                        <?php  
                                                                        $time_for_followup = check_followup_time($value[2]);
                                                                        echo 'Schedule : '. $time_for_followup;
                                                                        ?>
                                                                        </span>
                                                                        </label>
                                                                        <br>
                                                                        <label>
                                                                        <span class="dashicons dashicons-admin-users"></span>
                                                                        <span id="total_data_followup_<?php echo $no_scheduler; ?>">Data : <?php echo get_data_followup($no_scheduler);?> Donatur</span>
                                                                        </label>
                                                                        <br>
                                                                        <br>
                                                                        <label>
                                                                        <span>
                                                                        <b>Note</b> : <br><p><?php echo $note_followup; ?></p>
                                                                        </span>
                                                                        </label>
                                                                    </div>

                                                            </div>

                                                        <?php $no_scheduler++; } ?>

                                                        <br>
                                                        <hr>
                                                        <div class="form-group" style="margin-bottom: 30px;margin-top: 40px;">
                                                                <h4 class="card-title mt-0">Custom Follow-Up Scheduler<span></span></h4>
                                                        </div>


                                                        <div id="box_scheduler">
                                                        <?php 

                                                        
                                                        $rows_campaign = $wpdb->get_results("SELECT campaign_id, title from $table_name ORDER BY id DESC");

                                                        $no_followup = 1;
                                                        foreach ($custom_followup_scheduler as $followup) {

                                                            if($followup->status=='on'){
                                                                $status_text_followup = '<span>Running</span>';
                                                                $checked_followup = 'checked=""';
                                                            }else{
                                                                $status_text_followup = '<span>Off</span>';
                                                                $checked_followup = '';
                                                            }


                                                        ?>

                                                            <div id="custom_scheduler_<?php echo $followup->code_id; ?>" class="row custom_scheduler_followup field_c_<?php echo $followup->code_id; ?>" data-id="<?php echo $followup->code_id;?>" style="background: #F6FAFFA3;padding: 25px 30px 20px 30px;border: 1px solid #e3eaf4;border-radius: 4px;margin:0;margin-bottom: 15px;<?php if($automatic_followup_settings!='1'){ echo 'display:none;'; }?>">
                                                                    

                                                                    <div class="col-11 col-md-11 col_scheduler_title">
                                                                        <div class="form-group">
                                                                            
                                                                            <div class="custom-control custom-switch" id="checkbox_c_<?php echo $followup->code_id; ?>" style="margin-bottom: 20px;">
                                                                                <label for="text3" style="color:#303e67; font-size: 16px; font-weight: bold;margin-left: -35px;">Status</label>
                                                                                    <input type="checkbox" class="custom-control-input checkbox_c_<?php echo $followup->code_id; ?> checkbox_status" id="wanotif_followup_c_<?php echo $followup->code_id; ?>" data-id="<?php echo $followup->code_id; ?>" <?php echo $checked_followup; ?> >
                                                                                    <label class="custom-control-label" for="wanotif_followup_c_<?php echo $followup->code_id; ?>" style="margin-left: 60px;margin-top: 2px;"><?php echo $status_text_followup; ?></label>

                                                                            </div>

                                                                        </div>

                                                                    </div>

                                                                    <div class="col-1 col-md-1 col_scheduler_title">
                                                                        <div class="form-group">
                                                                            <button type="button" class="btn btn-danger del_scheduler" title="Delete" data-id="<?php echo $followup->code_id; ?>" style="font-size: 11px;padding: 3px 12px;margin-left: -20px;">
                                                                            Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div class="col-12 col-md-12 col_scheduler_title" style="padding-right: 0;">
                                                                        <div class="form-group">
                                                                            <label for="text3">Title</label>
                                                                            <input type="text" class="form-control" id="name_c_<?php echo $followup->code_id; ?>" required="" value="<?php echo $followup->name; ?>" placeholder="..." title="Title">
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div class="col-6 col-md-4 col_scheduler_title row_c_<?php echo $followup->code_id; ?>" style="<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="form-group">
                                                                            <label for="text3">Schedule</label>
                                                                            <select class="form-control select_schedule" id="schedule_c_<?php echo $followup->code_id; ?>" name="schedule" title="Schedule" autocomplete="off" data-id="<?php echo $followup->code_id; ?>">
                                                                              <option value="once" <?php if ($followup->schedule=='once'){echo'selected';}?>>Once (Hanya sekali)</option>
                                                                              <option value="daily" <?php if ($followup->schedule=='daily'){echo'selected';}?>>Daily (1 hari sekali)</option>
                                                                              <option value="weekly" <?php if ($followup->schedule=='weekly'){echo'selected';}?>>Weekly (1 minggu sekali)</option>
                                                                              <option value="monthly" <?php if ($followup->schedule=='monthly'){echo'selected';}?>>Monthly (1 bulan sekali)</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div class="col-6 col-md-8 col_scheduler_left row_c_<?php echo $followup->code_id; ?>" style="<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="form-group">
                                                                            <label for="text3">Format</label>
                                                                            <select class="form-control" id="format_c_<?php echo $followup->code_id; ?>" data-id="<?php echo $followup->code_id; ?>" name="format" title="Text Followup" autocomplete="off">
                                                                              <option value="1" <?php if ($followup->format=='1'){echo'selected';}?>>Follow-up 1</option>
                                                                              <option value="2" <?php if ($followup->format=='2'){echo'selected';}?>>Follow-up 2</option>
                                                                              <option value="3" <?php if ($followup->format=='3'){echo'selected';}?>>Follow-up 3</option>
                                                                              <option value="4" <?php if ($followup->format=='4'){echo'selected';}?>>Follow-up 4</option>
                                                                              <option value="5" <?php if ($followup->format=='5'){echo'selected';}?>>Follow-up 5</option>
                                                                              <option value="6" <?php if ($followup->format=='6'){echo'selected';}?>>Custom</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    
                                                                    <div class="col-12 col_scheduler_left custom_format" style="<?php if ($followup->format!='6'){echo'display:none;';}?><?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="form-group">
                                                                            <label for="text3">Custom Follow-up</label>
                                                                            <textarea class="form-control" rows="4" id="custom_format_c_<?php echo $followup->code_id; ?>" style="font-size: 13px;"><?php echo urldecode($followup->custom_format) ?></textarea>
                                                                        </div>
                                                                    </div>

                                                                    <div class="form-row row_c_<?php echo $followup->code_id; ?>" style="width:100%;<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="col-12 col-md-4 col_scheduler_title">
                                                                            <div class="form-group">
                                                                                <label for="text3">Target User</label>
                                                                                <select class="form-control select_target" id="target_c_<?php echo $followup->code_id; ?>" name="target" title="Target User" autocomplete="off" data-id="<?php echo $followup->code_id; ?>">
                                                                                  <option value="">-</option>
                                                                                  <option value="group" <?php if ($followup->target=='group'){echo'selected';}?>>By Group</option>
                                                                                  <option value="campaign" <?php if ($followup->target=='campaign'){echo'selected';}?>>By Campaign</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-12 col-md-8 col_scheduler_right section_group" style="padding-right: 0;<?php if ($followup->target=='group'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Group</label>
                                                                                <select class="form-control select_group" id="group_c_<?php echo $followup->code_id; ?>" name="group" title="Group" autocomplete="off" data-id="<?php echo $followup->code_id;?>">
                                                                                  <option value="">-</option>
                                                                                  <?php 
                                                                                    foreach ($data_group as $row) {
                                                                                        $count_data = count($wpdb->get_results("SELECT id from $table_name9 where group_id='$row->id' ORDER BY id ASC"));

                                                                                        $selected = '';
                                                                                        if($followup->group_id==$row->id){
                                                                                            $selected = 'selected';
                                                                                        }
                                                                                        echo '<option value="'.$row->id.'" '.$selected.'>'.$row->group_name.' ('.$count_data.')</option>';
                                                                                    }
                                                                                  ?>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_campaign" style="<?php if ($followup->target=='campaign'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Campaign</label>
                                                                                <select class="form-control select_campaign" id="campaign_c_<?php echo $followup->code_id; ?>" name="campaign1" title="Campaign" autocomplete="off" data-id="<?php echo $followup->code_id;?>">
                                                                                  <option value="">-</option>
                                                                                  <?php 
                                                                                    foreach ($rows_campaign as $row) {
                                                                                        $selected = '';
                                                                                        if($followup->campaign_id==$row->campaign_id){
                                                                                            $selected = 'selected';
                                                                                        }
                                                                                        echo '<option value="'.$row->campaign_id.'" '.$selected.'>'.$row->title.'</option>';
                                                                                    }
                                                                                  ?>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_donatur_status" style="<?php if ($followup->target=='campaign'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Donatur Status</label>
                                                                                <select class="form-control select_status" id="donatur_status_c_<?php echo $followup->code_id; ?>" name="donatur_status" title="Donatur Payment Status" autocomplete="off" data-id="<?php echo $followup->code_id;?>">
                                                                                  <option value="all" <?php if ($followup->donatur_status=='all'){echo'selected';}?>>All</option>
                                                                                  <option value="waiting" <?php if ($followup->donatur_status=='waiting'){echo'selected';}?>>Waiting</option>
                                                                                  <option value="success" <?php if ($followup->donatur_status=='success'){echo'selected';}?>>Success</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="form-row row_c_<?php echo $followup->code_id; ?>" style="width:100%;<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <?php 

                                                                        if (!empty($followup->date_time) && is_string($followup->date_time)) {
                                                                            $datenya = explode(' ', $followup->date_time);
                                                                            $date = $datenya[0];
                                                                            $time = $datenya[1];
                                                                        } else {
                                                                            $date = '';
                                                                            $time = '00:00';
                                                                        }

                                                                        ?>
                                                                        <div class="col-5 col-md-4 col_scheduler_title">
                                                                            <div class="form-group">
                                                                                <label for="text3">Start Date</label>
                                                                                <input class="form-control select_date" type="date" value="<?php echo $date; ?>" id="date_c_<?php echo $followup->code_id; ?>" data-id="<?php echo $followup->code_id;?>">
                                                                            </div>
                                                                        </div>

                                                                        <div class="col-3 col-md-2 col_scheduler_left">
                                                                            <div class="form-group">
                                                                                <label for="text3">Time</label>
                                                                                <select class="form-control select_hour" id="hour_c_<?php echo $followup->code_id; ?>" name="hour" title="Hour" autocomplete="off" data-id="<?php echo $followup->code_id;?>" style="display: inline-block;text-align: center;">
                                                                                   <?php 
                                                                                    $output = "";
                                                                                    for ($hour = 0; $hour < 24; $hour++) {
                                                                                            $timeValue = sprintf("%02d", $hour);

                                                                                            list($hournya, $minutenya, $secondnya) = explode(':', $time);

                                                                                            if($hournya==$hour){
                                                                                                $hour_selected = 'selected';
                                                                                            }else{
                                                                                                $hour_selected = '';
                                                                                            }
                                                                                            $output .= '<option value="'.$timeValue.'" '.$hour_selected.'>'.$timeValue.'</option>';
                                                                                    }
                                                                                    echo $output;

                                                                                    ?>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-0 col-md-0 col_scheduler_left" style="padding: 0;">
                                                                            <div class="form-group">
                                                                                <label for="text3">&nbsp;</label>
                                                                                <p style="text-align: center;padding-top: 10px;"><b>:</b></p>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-3 col-md-2 col_scheduler_right">
                                                                            <div class="form-group">
                                                                                <label for="text3">&nbsp;</label>
                                                                                <select class="form-control select_minute" id="minute_c_<?php echo $followup->code_id; ?>" name="minute" title="Minute" autocomplete="off" data-id="<?php echo $followup->code_id;?>" style="text-align: center;">
                                                                                   <?php 
                                                                                    $output = "";
                                                                                        for ($minute = 0; $minute < 60; $minute += 1) {
                                                                                            $timeValue = sprintf("%02d", $minute);
                                                                                            list($hournya, $minutenya, $secondnya) = explode(':', $time);

                                                                                            if($minutenya==$minute){
                                                                                                $minute_selected = 'selected';
                                                                                            }else{
                                                                                                $minute_selected = '';
                                                                                            }
                                                                                            $output .= '<option value="'.$timeValue.'" '.$minute_selected.'>'.$timeValue.'</option>';
                                                                                        }
                                                                                    echo $output;

                                                                                    ?>
                                                                                </select>
                                                                                
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div class="form-row row_c_<?php echo $followup->code_id; ?>" style="width:100%;<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <div class="col-12 col-md-4 col_scheduler_title">
                                                                            <div class="form-group">
                                                                                <label for="text3">Broadcast Mode</label>
                                                                                <select class="form-control select_broadcast" id="broadcast_mode_c_<?php echo $followup->code_id; ?>" name="broadcast" title="Broadcast Mode" autocomplete="off" data-id="<?php echo $followup->code_id; ?>">
                                                                                  <option value="all_at_once" <?php if ($followup->broadcast_mode=='all_at_once'){echo'selected';}?>>Send All at Once</option>
                                                                                  <option value="in_batch" <?php if ($followup->broadcast_mode=='in_batch'){echo'selected';}?>>Send in Batches</option>
                                                                                  <option value="one_by_one" <?php if ($followup->broadcast_mode=='one_by_one'){echo'selected';}?>>Send One by One</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_batch" style="<?php if ($followup->broadcast_mode=='in_batch'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Per Batch</label>
                                                                                <select class="form-control select_broadcast" id="batch_size_c_<?php echo $followup->code_id; ?>" name="batch_size" title="Broadcast Mode" autocomplete="off" data-id="<?php echo $followup->code_id; ?>">
                                                                                  <option value="10" <?php if ($followup->batch_size=='10'){echo'selected';}?>>10</option>
                                                                                  <option value="25" <?php if ($followup->batch_size=='25'){echo'selected';}?>>25</option>
                                                                                  <option value="50" <?php if ($followup->batch_size=='50'){echo'selected';}?>>50</option>
                                                                                  <option value="100" <?php if ($followup->batch_size=='100'){echo'selected';}?>>100</option>
                                                                                  <option value="250" <?php if ($followup->batch_size=='250'){echo'selected';}?>>250</option>
                                                                                  <option value="300" <?php if ($followup->batch_size=='300'){echo'selected';}?>>300</option>
                                                                                  <option value="400" <?php if ($followup->batch_size=='400'){echo'selected';}?>>400</option>
                                                                                  <option value="500" <?php if ($followup->batch_size=='500'){echo'selected';}?>>500</option>
                                                                                  <option value="1000" <?php if ($followup->batch_size=='1000'){echo'selected';}?>>1000</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-6 col-md-4 col_scheduler_right section_delay" style="<?php if ($followup->broadcast_mode=='in_batch' || $followup->broadcast_mode=='one_by_one'){}else{echo'display:none;';}?>">
                                                                            <div class="form-group">
                                                                                <label for="text3">Send Delay <span class="delay_name"><?php if ($followup->broadcast_mode=='in_batch'){echo'per Batch';}elseif($followup->broadcast_mode=='one_by_one'){echo'per Item';}else{}?></span></label>
                                                                                <select class="form-control select_status" id="send_delay_c_<?php echo $followup->code_id; ?>" name="send_delay" title="Donatur Payment Status" autocomplete="off" data-id="<?php echo $followup->code_id;?>">
                                                                                  <option value="0.1" <?php if ($followup->send_delay=='0.1'){echo'selected';}?>>0.1 sec</option>
                                                                                  <option value="0.25" <?php if ($followup->send_delay=='0.25'){echo'selected';}?>>0.25 sec</option>
                                                                                  <option value="0.5" <?php if ($followup->send_delay=='0.5'){echo'selected';}?>>0.5 sec</option>
                                                                                  <option value="1" <?php if ($followup->send_delay=='1'){echo'selected';}?>>1 sec</option>
                                                                                  <option value="2" <?php if ($followup->send_delay=='2'){echo'selected';}?>>2 sec</option>
                                                                                  <option value="3" <?php if ($followup->send_delay=='3'){echo'selected';}?>>3 sec</option>
                                                                                  <option value="4" <?php if ($followup->send_delay=='4'){echo'selected';}?>>4 sec</option>
                                                                                  <option value="5" <?php if ($followup->send_delay=='5'){echo'selected';}?>>5 sec</option>
                                                                                  <option value="10" <?php if ($followup->send_delay=='10'){echo'selected';}?>>10 sec</option>
                                                                                  <option value="15" <?php if ($followup->send_delay=='15'){echo'selected';}?>>15 sec</option>
                                                                                  <option value="30" <?php if ($followup->send_delay=='30'){echo'selected';}?>>30 sec</option>
                                                                                  <option value="60" <?php if ($followup->send_delay=='60'){echo'selected';}?>>1 minute</option>
                                                                                  <option value="120" <?php if ($followup->send_delay=='120'){echo'selected';}?>>2 minutes</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>   

                                                                    
                                                                    <div class="col-12 col_scheduler_left col_time row_c_<?php echo $followup->code_id; ?>" style="margin-top:5px;<?php if($followup->status!='on'){ echo 'display:none;'; }?>">
                                                                        <label>
                                                                        <span class="dashicons dashicons-update"></span>
                                                                        <span>Hook : donasiaja_f<?php echo $no_followup; ?>_event_custom</span>
                                                                        </label>
                                                                        <br>
                                                                        <label>
                                                                        <span class="dashicons dashicons-clock"></span>
                                                                        <span id="time_followup_<?php echo $followup->code_id; ?>">
                                                                        <?php  
                                                                        $time_for_followup = check_followup_time($followup->code_id.'_customscheduler');
                                                                        echo 'Schedule : '. $time_for_followup;
                                                                        ?>
                                                                        </span>
                                                                        </label>
                                                                        <br>
                                                                        <label>
                                                                        <span class="dashicons dashicons-admin-users"></span>
                                                                        <span id="total_data_followup_<?php echo $followup->code_id; ?>">Data : <?php echo get_data_followup($followup->code_id.'_customscheduler_fromdb');?> Donatur</span>
                                                                        </label>
                                                                        <br>
                                                                        <br>
                                                                    </div>

                                                                <!-- </div> -->

                                                            </div>

                                                        <?php $no_followup++; } ?>


                                                        </div>

                                                            <div class="col-md-12 add_button_scheduler" style="margin-bottom: 30px;margin-left: -10px;margin-top: 30px;<?php if($automatic_followup_settings!='1'){ echo 'display:none;'; }?>">
                                                                <button type="button" class="btn btn-outline-light waves-effect waves-light" id="add_scheduler">+ Add Scheduler</button>
                                                            </div>
                                                            <hr style="margin-top: 30px;">
                                                            <div style="margin-top: 40px;" class="data_profile_hide">
                                                                <button type="button" class="btn btn-primary px-5 py-2" id="update_automatic_followup">Update Automatic Followup<div class="spinner-border spinner-border-sm text-white update_automatic_followup_loading" style="margin-left: 3px;display: none;"></div></button>
                                                            </div>

                                                        </div>

                                                        <div>
                                                            <br>
                                                            <hr>
                                                            <h5 class="card-text">Note</h5>
                                                            <hr>
                                                            <p class="card-text text-muted"><?php echo get_langArray('dash_setting_desc3'); ?></p> 
                                                            <?php echo table_data_shortcode(); ?>
                                                            <p class="card-text text-muted">Contoh :</p> 
                                                            <textarea class="form-control" rows="6" disabled="" style="color: #435177;">Terimakasih *Bpk/Ibu {name}* atas Donasi yang akan Anda berikan. Semoga Rahmat dan Lindungan Allah selalu senantiasa bersama Anda.

Untuk Donasinya sejumlah *{total}* mohon ditransfer ke *{payment_account}* di *{payment_number}*. 
Terimakasih 😊🙏</textarea>
                                                        </div>

                                                        

                                                    </div>

                                                

                                            </div><!--end card -body-->
                                        </div><!--end card-->
                                        
                                                                                                                                   
                                    </div>
                                </div>
                            </div><!--end f_profile-->                                                                                
                        </div><!--end card-body-->                                
                    </div><!--end card-->
                </div><!--end col-->
            </div>
                </div>
            </div>
        </div>





    <?php }elseif($group==true){ ?>


        <?php check_verified_dashboard($akses); ?>


        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/tinymce/tinymce.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

    <script type="text/javascript">


        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


        jQuery(document).ready(function($){


            <?php 
            if(isset($_GET['id'])){
                $group_id = $_GET['id'];
            }else{
                $group_id = 1;
            }
            
            ?>

            $('#datatables_group_list').DataTable( {
                "autoWidth": false,
                "processing": true,
                "serverSide": true,
                // "dom": "lifrtp",
                "dom": '<"top d-flex justify-content-between"l<"d-flex"fB>>rtip',
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_group_list',
                        group_id: '<?php echo $group_id; ?>'
                    }
                },
                "buttons": [
                    {
                        text: '<i class="mdi mdi-plus mr-1" style="position:absolute;margin-left: -13px;"></i><span style="padding-left:5px;">Add&nbsp;Group</span>',
                        className: 'btn btn-success',
                        action: function (e) {

                            Swal.fire({
                                  title: '<strong id="popup_title">Add New Group</strong>',
                                  icon: false,
                                  showConfirmButton: false,
                                  html:
                                    '<div id="data_box" style="margin-bottom:30px;"><div class="spinner-border text-primary" role="status"></div></div>',
                                  showCloseButton: true,
                                  showClass: {
                                    popup: 'animate__animated animate__zoomIn animate__faster'
                                  },
                                  hideClass: {
                                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                                  }
                                })

                            var id = 0;

                            var data_nya = [
                                id
                            ];

                            var data = {
                                "action": "djafunction_get_group_list_name",
                                "datanya": data_nya
                            };
                            
                            jQuery.post(ajaxurl, data, function(response) {
                                $('#data_box').html(response);
                            });

                        }
                    }
                ],
                "columns": [
                    { "data": "no" },
                    { "data": "name" },
                    { "data": "data" },
                    { "data": "action" }
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'group_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });

            $('#datatables_group').DataTable( {
                "autoWidth": false,
                "processing": true,
                "serverSide": true,
                // "dom": "lifrtp",
                "dom": '<"top d-flex justify-content-between"l<"d-flex"fB>>rtip',
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_group_data',
                        group_id: '<?php echo $group_id; ?>'
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "name" },
                    { "data": "whatsapp" },
                    { "data": "sapaan" },
                    { "data": "action" }
                ],
                "buttons": [
                    {
                        text: '<i class="mdi mdi-plus mr-1" style="position:absolute;margin-left: -13px;"></i><span style="padding-left:5px;">Add&nbsp;Data</span>',
                        className: 'btn btn-success',
                        action: function (e) {

                            Swal.fire({
                                  title: '<strong id="popup_title">Add New Data</strong>',
                                  icon: false,
                                  showConfirmButton: false,
                                  html:
                                    '<div id="data_box" style="margin-bottom:30px;"><div class="spinner-border text-primary" role="status"></div></div>',
                                  showCloseButton: true,
                                  showClass: {
                                    popup: 'animate__animated animate__zoomIn animate__faster'
                                  },
                                  hideClass: {
                                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                                  }
                                })

                            var id = 0;
                            var group_id = '<?php echo $group_id; ?>';

                            var data_nya = [
                                id,
                                group_id
                            ];

                            var data = {
                                "action": "djafunction_get_group_data_detail",
                                "datanya": data_nya
                            };
                            
                            jQuery.post(ajaxurl, data, function(response) {
                                $('#data_box').html(response);
                            });

                        }
                    }
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'data_'+row_id);
                    $(row).find('td:eq(1)').addClass('td-name');
                    $(row).find('td:eq(2)').addClass('td-whatsapp');
                    $(row).find('td:eq(3)').addClass('td-sapaan');
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });

            
            $(document).on('click', '.edit_group_name', function(e){

                if($(this).hasClass("img_confirmation")){
                    return false;
                }
                
                Swal.fire({
                      title: '<strong id="popup_title">Data Group</strong>',
                      icon: false,
                      showConfirmButton: false,
                      html:
                        '<div id="data_box" style="margin-bottom:30px;"><div class="spinner-border text-primary" role="status"></div></div>',
                      showCloseButton: true,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                    })

                var id = $(this).data('id');

                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_get_group_list_name",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    $('#data_box').html(response);
                });
            });


            $(document).on('click', '.edit_data', function(e){

                if($(this).hasClass("img_confirmation")){
                    return false;
                }
                
                Swal.fire({
                      title: '<strong id="popup_title">Data Detail</strong>',
                      icon: false,
                      showConfirmButton: false,
                      html:
                        '<div id="data_box" style="margin-bottom:30px;"><div class="spinner-border text-primary" role="status"></div></div>',
                      showCloseButton: true,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                    })

                var id = $(this).data('id');

                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_get_group_data_detail",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    $('#data_box').html(response);
                });
            });


            $(document).on('click', '.update_group_name', function(e){
                
                $('.update_data_loading').show();

                var id = $('#inp_id').val();
                var group_name = $('#inp_group_name').val();

                var data_nya = [
                    id,
                    group_name,
                ];

                var data = {
                    "action": "djafunction_update_group_name",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    $('.update_data_loading').hide();

                    var response_text = response.split("_");
                    response_info = response_text[0];
                    response_id = response_text[1];

                    if(response_info=='success' && id=='0'){
                        $('.update_data_success').text('Add New Group Success.').slideDown();

                        $('#datatables_group_list tbody').prepend('<tr id="group_4" role="row" class="odd"><td class="sorting_1"><span data-id="4"></span></td><td><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group&')?>id='+response_id+'">'+group_name+'</a></td><td>0</td><td><div class="btn-group" role="group"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group&')?>id='+response_id+'"><button type="button" class="btn btn-outline-light group_detail" data-id="'+response_id+'" title="Data Detail" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-file-document-outline mr-2" style="margin: 0 4px 0 2px !important;color:#7680FF;"></i></button></a><button type="button" class="btn btn-outline-light del_group" data-id="'+response_id+'" title="Delete"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');

                        setTimeout(function() {
                            $('.update_data_success').slideUp('fast');
                            Swal.close();
                        }, 1000);

                    }else if(response_info=='success'){
                        $('.update_data_success').slideDown();

                        $('#data_group_name').text(group_name);

                        setTimeout(function() {
                            $('.update_data_success').slideUp('fast');
                            Swal.close();
                        }, 1000);

                    }else{
                        $('.update_data_failed').slideDown();
                        setTimeout(function() {
                            $('.update_data_failed').slideUp('fast');
                        }, 4500);
                    }

                });

            });


            $(document).on('click', '.update_group_data_detail', function(e){
                
                $('.update_data_loading').show();

                var id = $('#inp0').val();
                var name = $('#inp1').val();
                var whatsapp = $('#inp2').val();
                var sapaan = $('#inp3').val();
                var group_id = $('#inp4').val();

                var data_nya = [
                    id,
                    name,
                    whatsapp,
                    sapaan,
                    group_id
                ];

                var data = {
                    "action": "djafunction_update_group_data_detail",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    $('.update_data_loading').hide();

                    var response_text = response.split("_");
                    response_info = response_text[0];
                    response_id = response_text[1];

                    if(response_info=='success' && id=='0'){

                        $('.update_data_success').slideDown();

                        $('#datatables_group tbody').prepend('<tr id="data_1" role="row" class="odd"><td class="sorting_1"><span data-id="'+response_id+'"></span></td><td class="td-name">'+name+'</td><td class="td-whatsapp">'+whatsapp+'</td><td class="td-sapaan">'+sapaan+'</td><td><div class="btn-group" role="group"><button type="button" class="btn btn-outline-light edit_data" data-id="'+response_id+'" title="Edit Data" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-pencil  mr-2" style="margin: 0 4px 0 2px !important;color:#7680FF;"></i></button><button type="button" class="btn btn-outline-light del_donasi" data-id="'+response_id+'" title="Delete"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');


                        $('#data_'+id+' .td-name').text(name);
                        $('#data_'+id+' .td-whatsapp').text(whatsapp);
                        $('#data_'+id+' .td-sapaan').text(sapaan);

                        setTimeout(function() {
                            $('.update_data_success').slideUp('fast');
                        }, 4500);

                    }else if(response_info=='success'){

                        $('.update_data_success').slideDown();

                        $('#data_'+id+' .td-name').text(name);
                        $('#data_'+id+' .td-whatsapp').text(whatsapp);
                        $('#data_'+id+' .td-sapaan').text(sapaan);

                        setTimeout(function() {
                            $('.update_data_success').slideUp('fast');
                        }, 4500);

                    }else{

                        if(response_id=='0'){
                            $('.update_data_failed').text('No Whatsapp sudah terdaftar di Group ini.');
                            $('.update_data_failed').slideDown();
                            setTimeout(function() {
                                $('.update_data_failed').slideUp('fast');
                            }, 4500);
                        }else{
                            $('.update_data_failed').slideDown();
                            setTimeout(function() {
                                $('.update_data_failed').slideUp('fast');
                            }, 4500);
                        }
                        
                    }

                });

            });

            <?php
            if(isset($_GET['id'])){ 

                $data_group = $wpdb->get_results("SELECT * from $table_name8 where id='$group_id' ORDER BY id ASC");
                if($data_group!=null){
                    $group_name = $data_group[0]->group_name;
                }else{
                    // $group_name = '-';
                    echo 'window.location.href = "'.admin_url('admin.php?page=donasiaja_dashboard&action=group').'";';
                }
            }else{
                $group_id = '';
            }

            ?>

            $(document).on('change', '#file_data_excel', function(e){
                var filename = $(this).val().split('\\').pop();
                $('#file_data_label').text(filename);
            });

            $(document).on('click', '#import_data', function(e){
                var group_id = $(this).data('id');
                var group_name = $(this).data('gname');
                Swal.fire({
                      title: '<strong>Upload Data</strong>',
                      icon: false,
                      html:
                        '<div id="data_box"><form id="form_upload_data" class="form_upload" style="padding-bottom:0;"><div class="row"><div class="col-md-12"> <h4 class="mt-0 header-title">Group: '+group_name+'</h4><div role="alert" class="alert alert-info border-0 upload_data_success" style="font-size: 13px; margin-bottom: 30px; display: none;">Upload data success.</div> <div role="alert" class="alert alert-danger border-0 upload_data_failed" style="font-size: 13px;margin-top: -20px;margin-bottom: 30px;display:none;">Upload data failed.</div><div class="form-group"></div></div><div class="col-md-4"></div></div><div class="row"><div class="col-md-12"><h4 class="mt-0 header-title">File Upload</h4><p class="text-muted mb-3">Pilih file data upload anda.</p><div class="custom-file"><input id="file_data_excel" type="file" name="file" accept=".xlsx, .xls" class="custom-file-input"><input id="cid" type="text" name="gid" value="<?php echo $group_id; ?>" style="display:none;"><label class="custom-file-label" for="inputGroupFile04" style="text-align: left;" id="file_data_label">Choose file</label></div></div></div><div class="row"><div class="col-sm-12 text-center" style="padding-top: 30px;"><button type="submit" class="btn btn-primary px-4" id="upload_data_now">Upload Now<div class="spinner-border spinner-border-sm text-white upload_data_now_loading" style="margin-left: 3px; display: none;"></div></button></div></div><br><br><p class="text-muted mb-3"><span style="color:red;">*</span> <a href="<?php echo admin_url('admin-post.php?action=download_template_excel2') ?>" targe="_blank"><i class="mdi mdi-file-table-outline" style="margin-right:3px;"></i>Download Template Table</a></p></form></div>',
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
            
            $(document).on('submit', 'form#form_upload_data', function(e){
                e.preventDefault();
                $('.upload_data_now_loading').show();

                var formData = new FormData(this);

                jQuery.ajax({
                    type: 'POST',
                    url: '<?php echo admin_url('admin-post.php?action=upload_data_group') ?>',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response){

                        console.log(response);
                        
                        if(response!='failed'){
                            $('.upload_data_success').html(response).slideDown();

                            // setTimeout(function() {
                            //     $('.upload_data_success').slideUp('fast');
                            // }, 6500);

                        }else{
                            $('.upload_data_failed').slideDown();
                            // $('.upload_data_failed').slideUp('fast');
                        }

                        $('.upload_data_now_loading').hide();

                    }
                });

            });


            $(document).on("click", ".del_data", function(e) {
            
                var id = $(this).attr('data-id');
                var name = $(this).attr('data-name');
                var whatsapp = $(this).attr('data-whatsapp');
                var sapaan = $(this).attr('data-sapaan');
                $('#data_'+id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

                swal.fire({
                  title: '<h4>Anda yakin ingin menghapus data ini?</h4>',
                  text: '('+sapaan+') '+name+' - '+whatsapp,
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, Hapus sekarang!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    
                    var data_nya = [
                        id
                    ];

                    var data = {
                        "action": "djafunction_del_data_group",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {

                        if(response=='success'){
                            $('#data_'+id).slideUp();
                            var message = "Successfully deleted permanently.";
                            var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);

                        }else{
                            var message = "Deleted Failed!";
                            var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);
                        }
                        
                    });
                  }else{
                    $('tbody tr').css({"background":"#ffffff"});
                  }
                })

            });



            $(document).on("click", "#delete_data_group", function(e) {
                
                $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});
                var group_id = $(this).attr('data-id');
                var gname = $(this).attr('data-gname');

                swal.fire({
                  title: 'Anda yakin ingin menghapus data di Group ini?',
                  text: "",
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, Hapus sekarang!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    
                    var data_nya = [
                        group_id
                    ];

                    var data = {
                        "action": "djafunction_del_data_group_only",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {

                        if(response=='success'){
                            $('tbody tr').slideUp();
                            var message = "Successfully deleted permanently.";
                            var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);

                        }else{
                            var message = "Deleted Failed!";
                            var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);
                        }
                        
                    });
                  }else{
                    $('tbody tr').css({"background":"#ffffff"});
                  }
                })

            });


            $(document).on("click", ".del_data_group_all", function(e) {
            
                var group_id = $(this).attr('data-id');
                var gname = $(this).attr('data-gname');

                $('#group_'+group_id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

                swal.fire({
                  title: '<h4>Anda yakin ingin menghapus data ini?</h4>',
                  text: 'Group: '+gname,
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, Hapus sekarang!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    
                    var data_nya = [
                        group_id
                    ];

                    var data = {
                        "action": "djafunction_del_data_group_all",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {

                        if(response=='success'){
                            $('#group_'+group_id).slideUp();
                            var message = "Successfully deleted permanently.";
                            var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);

                        }else{
                            var message = "Deleted Failed!";
                            var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                            var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                            createAlert(message, status, timeout);
                        }
                        
                    });
                  }else{
                    $('tbody tr').css({"background":"#ffffff"});
                  }
                })

            });

        });
    </script>

    <style>

        div:where(.swal2-container).swal2-center > .swal2-popup {
            padding-left: 60px !important;
            padding-right: 60px !important;
        }

        #inp_id, #inp_group_name,  #inp1, #inp2, #inp3 {
            padding-left: 15px;
        }

        #datatables_group_list_wrapper, .datatables_group_wrapper {
            margin-top: 60px;
        }
        #datatables_group_list_wrapper .d-flex, #datatables_group_wrapper .d-flex {
            position: absolute;
            right: 0;
            margin-right: 11px;
            margin-top: -28px;
        }
        #datatables_group_list_wrapper .d-flex button.btn, #datatables_group_wrapper .d-flex button.btn {
            height: 33px;
            margin-left: 8px;
            padding-left: 23px;
        }
        #datatables_group_list_wrapper .d-flex input, #datatables_group_wrapper .d-flex input {
            height: 34px;
        }

        button.swal2-close {
          font-size: 28px;
          margin-top: 8px;
          margin-right: 8px;
        }

        #datatables_group_list_processing {
            padding: 10px !important;
            margin-top:0px;
        }
        #datatables_group_processing {
            padding: 10px !important;
            margin-top: 30px;
        }
        .scheduler_followup {
            margin-bottom: 15px;
            padding-bottom: 0 !important;
        }

        .col_time {
            background:#e8ebf38c;
            padding: 10px 10px 3px 10px !important;
            border-radius: 6px;
            margin-bottom: 15px !important;

            background: #47c25724;
            padding: 20px 20px 5px 20px !important;
            border: 1px solid #b5ddc2;
        }

        #automatic_followup_settings_box {
            min-width: 615px;
        }

        table.dataTable td .btn-group {
            margin-top: -5px;
        }
        #datatables_group_length {
           position: absolute;
              margin-left: -640px;
              margin-top: -30px;
        }
        #datatables_group_info {
            position: absolute;
        }
        .icon-lg {
            height: 25px;
            width: 25px;
        }
        @media only screen and (max-width:780px) {
            #automatic_followup_settings_box {
                min-width: 550px;
            }
        }
        @media only screen and (max-width:680px) {
            #automatic_followup_settings_box {
                min-width: 500px;
            }
        }
        @media only screen and (max-width:600px) {
            #automatic_followup_settings_box {
                min-width: auto;
            }
        }
    </style>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">
                                <div class="float-right">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">Follow-up WA</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row">
                <div class="col-12">
                    <div class="card col-12" id="box-section">
                        <div class="card-body">
                            

                            <div class="met-profile">
                                
                                <div class="row">
                                    <div class="col-md-12 col-xl-12" style="margin-top: 0px;padding: 0;">
                                        <div class="card card-border" style="border: 0;padding: 0;">
                                            <div class="card-body">
                                                <h4 class="card-title mt-0" style="position:absolute; margin-top: -30px !important;">Follow-up WA</h4>
                                                <hr>

                                                <div class="button-items mb-4">
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=settings') ?>"><button type="button" class="btn btn-outline-light">Follow-up Button & Format</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=automatic_followup') ?>"><button type="button" class="btn btn-primary btn-outline-light">Automatic Followup</button></a>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group') ?>"><button type="button" class="btn btn-primary waves-light">Group</button></a>
                                                </div>

                                                <style>
                                                    #datatables_group_list_length, #datatables_group_list_info {
                                                        display: none;
                                                    }
                                                    table.dataTable {
                                                        border-collapse: collapse;
                                                        border: 1px solid #F1F5FA;
                                                    }

                                                </style>

                                                <div id="Tab3" class="tab-content">
                                                      
                                                    <?php
                                                    if(isset($_GET['id'])){ 

                                                        $data_group = $wpdb->get_results("SELECT * from $table_name8 where id='$group_id' ORDER BY id ASC");
                                                        if($data_group!=null){
                                                            $group_name = $data_group[0]->group_name;
                                                        }else{
                                                            $group_name = '-';
                                                        }

                                                    ?>

                                                    <div class="row">
                                                        <div class="col-lg-12">
                                                            
                                                           

                                                            <div class="card" style="max-width: inherit;padding: 0;">
                                                                <div class="card-body" style="background: #f1f5fa;">
                                                                    <div class="row">
                                                                        <div class="col-6 align-self-center">
                                                                           <div class="media">
                                                                                
                                                                                <div class="icon-info align-self-center" style="background: white;padding: 8px;border-radius: 20px;">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users align-self-center icon-lg icon-dual-purple"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>

                                                                                </div> 

                                                                                <div class="media-body align-self-center">

                                                                                    <h4 class="mt-0 mb-2 font-16" style="margin-left: 10px;padding-top: 8px;"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=group') ?>" style="color: #7680ff;">Group</a> / <span id="data_group_name"><?php echo $group_name; ?></span> 

                                                                                        <i class="fas fa-edit text-info font-16 dashicons-edit edit_group_name" data-id="<?php echo $group_id; ?>" style="cursor:pointer;font-size: 14px !important;margin-left: 5px;"></i>
                                                                                    </h4>
                                                    
                                                                                </div><!--end media-body-->
                                                                            </div><!--end media-->
                                                                        </div>
                                                                        <div class="col-6 align-self-center text-right" style="padding-right:0;">
                                                                            <div class="ml-2">
                                                                                <button class="btn btn-danger float-right" id="delete_data_group" data-id="<?php echo $group_id; ?>" data-gname="<?php echo $group_name; ?>" title="Delete Data on Group" style="padding: 3px 12px 3px 7px;font-size: 10px;margin-right: 10px;width: auto;"><i class="mdi mdi-trash-can mr-1"></i>Empty</button>
                                                                                <button class="btn btn-outline-primary float-right" id="import_data" data-id="<?php echo $group_id; ?>" data-gname="<?php echo $group_name; ?>" title="Delete Group" style="padding: 3px 12px 3px 7px;font-size: 10px;margin-right: 5px;width: 65px;"><i class="mdi mdi-arrow-down-bold-box mr-1"></i>Import</button>
                                                                            </div>
                                                                        </div>                    
                                                                    </div>
                                                                </div><!--end card-body-->
                                                            </div><!--end card-->
                                                        </div>
                                                    </div>

                                                    <div class="card-body" style="padding-left:0px;padding-right:0px;margin-top: -30px;">
                                                        
                                                        <br>
                                                        <br>
                                                        <br>
                                                        <br>
                                                        
                                                        <div class="table-responsive dash-social">

                                                            <table id="datatables_group" class="table" style="width:630px;">
                                                                <thead class="thead-light">
                                                                    <tr>
                                                                        <th>No</th>
                                                                        <th>Nama</th>
                                                                        <th>Whatsapp</th>
                                                                        <th>Sapaan</th>
                                                                        <th style="width:10%;">Action</th>
                                                                    </tr>
                                                                </thead>

                                                            </table>                    
                                                        </div>                                         
                                                    </div><!--end card-body--> 

                                                    <div>
                                                            <br>
                                                            <br>
                                                            <hr>
                                                            <h5 class="card-text">Note</h5>
                                                            <hr>
                                                            <table class="table_shortcode" style="margin-bottom:30px;">
                                                                <tbody>
                                                                    <ol style="margin-left: 12px;">
                                                                        <li><a href="<?php echo admin_url('admin-post.php?action=download_template_excel2') ?>" targe="_blank"><i class="mdi mdi-file-table-outline" style="margin-right:3px;"></i>Download Template Table - Data Group</a></li>
                                                                        <li>No Whatsapp tidak boleh ada yang sama dalam 1 Group</li>
                                                                    </ol>
                                                                </tbody>
                                                            </table> 
                                                        </div>

                                                    

                                                    <?php }else{ ?>

                                                    <div class="card-body" style="padding-left:0px;padding-right:0px;">
                                                        <h4 style="position: absolute;">Group</h4>
                                                        <div class="table-responsive dash-social">
                                                            
                                                            <table id="datatables_group_list" class="table" style="width:630px;">
                                                                <thead class="thead-light">
                                                                    <tr>
                                                                        <th>No</th>
                                                                        <th>Group Name</th>
                                                                        <th>Data</th>
                                                                        <th style="width:10%;">Action</th>
                                                                    </tr>
                                                                </thead>
                                                            </table>                    
                                                        </div>                                         
                                                    </div><!--end card-body--> 

                                                    <?php } ?>
                                                    

                                                    


                                                </div>
                                                

                                            </div><!--end card -body-->
                                        </div><!--end card-->
                                        
                                                                                                                                   
                                    </div>
                                </div>
                            </div><!--end f_profile-->                                                                                
                        </div><!--end card-body-->                                
                    </div><!--end card-->
                </div><!--end col-->
            </div>
                </div>
            </div>
        </div>


    <?php }elseif($trash==true){ ?>

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">
                                <div class="float-right">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">Trash</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>


                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">

                                <div class="card-body">
                                    <div><button class="btn btn-danger px-3 float-right mt-0 mb-2" id="delete_all_trash"><i class="mdi mdi-trash-can mr-2"></i>Delete All Trash</button></div>
                                    <h3 class="header-title mt-0">Data Trash</h3>
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }

                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th>No</th>
                                                    <th></th>
                                                    <th><?php echo get_langArray('dash_table_col1'); ?></th>
                                                    <th>Whatsapp</th>
                                                    <th style="width: 120px;"><?php echo get_langArray('dash_table_col2'); ?></th>
                                                    <th>Program</th>
                                                    <?php if($role!='donatur'){ ?>
                                                    <?php } ?>                              
                                                    <th>Payment</th>                             
                                                    <th style="width: 105px;">Deleted&nbsp;at</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th>Deleted&nbsp;by</th>
                                                    <th style="text-align: center;">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div>
            </div>




        </div>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

        #datatables_info {
            position: absolute;
        }
        @media only screen and (max-width:480px) {
            #datatables_info {
                display: none;
            }
            input.input_daterangepicker {
            left: 0 !important;
            margin-top: 145px !important;
            margin-left: 10px !important;
            }
        }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>

        jQuery(document).ready(function($){

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_trash',
                        c_id: '<?php echo $c_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "picture" },
                    { "data": "name" },
                    { "data": "whatsapp" },
                    { "data": "total_donate" },
                    { "data": "program" },
                    { "data": "payment_status" },
                    { "data": "date" },
                    <?php if($role!='donatur'){ ?>
                    { "data": "cs" },
                    <?php } ?>
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
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

            });

            function dotToNumber(nStr){
                var a = nStr.split('.').join("");
                return parseInt(a);
            }

            function numberWithDot(x) {
                <?php if($currency=='MYR'){ ?>
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                <?php }else{ ?>
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                <?php } ?>
            }

            // Initialize the plugin
            $(document).on('click', '.detail_donasi', function(e){

                if($(this).hasClass("img_confirmation")){
                    return false;
                }
                
                Swal.fire({
                      title: '<strong id="popup_title">Data Detail</strong>',
                      icon: false,
                      html:
                        '<div id="data_box"><div class="spinner-border text-primary" role="status"></div></div>',
                      showCloseButton: true,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                    })

                var donasi_id = $(this).data('id');

                var data_nya = [
                    donasi_id,
                    'ontrash'
                ];

                var data = {
                    "action": "djafunction_get_donasi",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    $('#data_box').html(response);
                });
            });


            $(document).on('click', '.restore_data', function(e){

                if($(this).hasClass("img_confirmation")){
                    return false;
                }
                
                var donasi_id = $(this).data('id');
                $('#donasi_'+donasi_id).css({"background":"linear-gradient(90deg, rgb(238, 255, 241) 0%, rgb(250, 250, 250) 100%)"});

                var data_nya = [
                    donasi_id
                ];

                var data = {
                    "action": "djafunction_restore_data",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#donasi_'+donasi_id).slideUp();
                        var message = "Successfully restore data.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Restore Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }

                });

                
            });
            

        });

        $(document).on("click",".btn-ip-blocked",function(){
                
                var ip = $(this).attr('data-ip');
                var id = $(this).attr('data-id');

                var data_nya = [
                    ip,
                    id
                ];

                var data = {
                    "action": "djafunction_blocked_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='exist'){
                        var message = "IP sudah diblocked sebelumnya.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_csip').html(response);
                        var message = "IP berhasil diblock.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });


            $(document).on("click",".btn-ip-open",function(){
                
                var ip = $(this).attr('data-ip');

                var data_nya = [
                    ip
                ];

                var data = {
                    "action": "djafunction_open_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='not exist'){
                        var message = "IP tidak ditemukan.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_csip').html(response);
                        var message = "IP berhasil dibuka kembali blocknya.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });

            $(document).on("click",".btn-whatsapp-blocked",function(){
                
                var whatsapp = $(this).attr('data-whatsapp');
                var id = $(this).attr('data-id');

                var data_nya = [
                    whatsapp,
                    id
                ];

                var data = {
                    "action": "djafunction_blocked_whatsapp",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='exist'){
                        var message = "No Whatsapp sudah diblocked sebelumnya.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_wa').html(response);
                        var message = "Whatsapp berhasil diblock.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });
            


            $(document).on("click",".btn-whatsapp-open",function(){
                
                var whatsapp = $(this).attr('data-whatsapp');

                var data_nya = [
                    whatsapp
                ];

                var data = {
                    "action": "djafunction_open_whatsapp",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='not exist'){
                        var message = "No Whatsapp tidak ditemukan.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_wa').html(response);
                        var message = "No Whatsapp berhasil dibuka kembali blocknya.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });
    
        


        $(document).on("click", ".del_donasi", function(e) {
            
            var donasi_id = $(this).attr('data-id');
            $('#donasi_'+donasi_id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda yakin ingin menghapus donasi ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    donasi_id
                ];

                var data = {
                    "action": "djafunction_del_donasi_trash",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#donasi_'+donasi_id).slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });



        $(document).on("click", "#delete_all_trash", function(e) {
            
            $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda yakin ingin menghapus semua data ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    'delete_all_trash'
                ];

                var data = {
                    "action": "djafunction_del_donasi_trash_all",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('tbody tr').slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(function() {
            $('tbody tr').hover(function() { 
                $(this).find('.box-button').removeClass("button-hide"); 
            }, function() { 
                $(this).find('.box-button').addClass("button-hide");
            });
        });

        $(document).on("click", ".img_confirmation", function(e) {
            $(this).addClass('status_check');
        });


        $(document).on("click", ".btn-followup", function(e) {

            var donasi_id = $(this).data('id');
            var followup_number = $(this).data('followup');

            $('.followup'+followup_number).find(".spinner-border").remove();
            $(this).find("span").before('<div class="spinner-border spinner-border-sm" role="status"></div>');
            $(this).find("i").hide();
            $(this).addClass('sent');

            var data_nya = [
                donasi_id,
                followup_number
            ];

            var data = {
                "action": "djafunction_send_wa",
                "datanya": data_nya
            };
            
            jQuery.post(ajaxurl, data, function(response) {
                
                if(response.length<=7){
                    if(response=='success'){
                        // alert('success');

                        var message = "Followup "+followup_number+" - Message was sent to whatsapp.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Send message failed.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    $('.followup'+followup_number).find("i").show();
                    $('.followup'+followup_number).find(".spinner-border").remove();
                }else{
                    // redirect WA
                    var redirectWindow = window.open(response, "_blank");
                    redirectWindow.location;
                }
                

            });

        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>

    <?php }elseif($ipblocked==true){ ?>

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">


                            <div class="page-title-box">

                                <div class="button-items mb-1">
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=ipblocked');?>"><button type="button" class="btn btn-primary waves-light">IP Blocked</button></a>
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=ipwhitelist');?>"><button type="button" class="btn btn-outline-light">IP Whitelist</button></a>
                                </div>
                                

                                <div class="float-right" style="margin-top: -40px;">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">IP Blocked</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">

                                <div class="card-body">
                                    
                                    <div><button class="btn btn-danger px-3 float-right mt-0 mb-2" id="delete_all_ip"><i class="mdi mdi-trash-can mr-1"></i>Delete All IP</button></div>

                                    <div><button class="btn btn-success px-3 float-right mt-0 mb-2 mr-2" id="add_new_ip"><i class="mdi mdi-plus mr-1"></i>Add New IP</button></div>

                                    <h3 class="header-title mt-0">Data IP Blocked</h3>
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }
                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th style="width: 20px;">No</th>
                                                    <th>IP</th>                         
                                                    <th>Note</th>                         
                                                    <th>Date</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th style="text-align: center; width:80px; ">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div>
            </div>




        </div>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

        #datatables_info {
            position: absolute;
        }
        table.dataTable td {
/*             padding-bottom: 0px; */
        }
        @media only screen and (max-width:480px) {
            #datatables_info {
                display: none;
            }
            input.input_daterangepicker {
            left: 0 !important;
            margin-top: 145px !important;
            margin-left: 10px !important;
            }
        }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>

        jQuery(document).ready(function($){

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_ip',
                        c_id: '<?php echo $c_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                        status: 'blocked',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "ip" },
                    { "data": "note" },
                    { "data": "date" },
                    // { "data": "created_by" },
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'ip_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });


            $('.select2').select2();
            

        });
    
        
        $(document).on("click", ".edit_ip", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = $(this).attr("data-id");

            Swal.fire({

                title: '<strong id="popup_title">Data IP</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_ip",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Data IP",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan edit data IP</div><br><div id='box_ip'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Update Now!",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var id = $('.swal2-container').find('#data_id').val();
                        var ip = $('.swal2-container').find('#data_ip').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            id,
                            ip,
                            note
                        ];

                        var data = {
                            "action": "djafunction_update_ip",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){

                                const $row = $('#ip_' + id);
                                $row.find('td:eq(1)').text(ip);
                                $row.find('td:eq(2)').text(note);
                                
                                $('.update_ip_success').slideDown();

                                setTimeout(function() {
                                    $('.update_ip_success').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.update_ip_failed').slideDown();
                                setTimeout(function() {
                                    $('.update_ip_failed').slideUp('fast');
                                }, 4500);
                            }
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });


        $(document).on("click", ".del_ip", function(e) {
            
            var id = $(this).attr('data-id');
            $('#ip_'+id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus IP ini?',
              text: "",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_del_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#ip_'+id).slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });



        $(document).on("click", "#delete_all_ip", function(e) {
            
            $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus semua data ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    'delete_all_ip',
                    'blocked'
                ];

                var data = {
                    "action": "djafunction_del_all_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('tbody tr').slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(document).on("click", "#add_new_ip", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = 'new';

            Swal.fire({

                title: '<strong id="popup_title">Add New IP</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_ip",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Add New IP",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan tambahkan IP</div><br><div id='box_ip'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Add IP",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var ip = $('.swal2-container').find('#data_ip').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            ip,
                            note,
                            'blocked'
                        ];

                        var data = {
                            "action": "djafunction_add_ip",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {

                            var response_text = response.split("_");
                            response_info = response_text[0];
                            response_id = response_text[1];

                            if(response_info=='success'){

                                $('.swal2-container').find('#data_ip').val('');
                                $('.swal2-container').find('#data_note').val('');

                                $('.add_ip_success').slideDown();

                                setTimeout(function() {
                                    $('.add_ip_success').slideUp('fast');
                                }, 4500);

                                $('#datatables tbody').prepend('<tr id="ip_"'+response_id+'"" role="row" class="odd"><td class="sorting_1"><span data-id="'+response_id+'"></span></td><td>'+ip+'</td><td>'+note+'</td><td><div class="btn-group mb-4" role="group" aria-label="Basic example"><button type="button" class="btn btn-outline-light edit_ip" data-action="ontrash" data-id="'+response_id+'" title="" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-pencil mr-2" style="margin: 0 4px 0 2px !important;color:;"></i></button><button type="button" class="btn btn-outline-light del_ip" data-id="'+response_id+'" title="Delete Permanently"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');

                            }else if(response_info=='whitelistexist'){
                                $('.add_ip_failed2').slideDown();
                                setTimeout(function() {
                                    $('.add_ip_failed').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.add_ip_failed').slideDown();
                                setTimeout(function() {
                                    $('.add_ip_failed').slideUp('fast');
                                }, 4500);
                            }
                           
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>

    <?php }elseif($ipwhitelist==true){ ?>

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">


                            <div class="page-title-box">

                                <div class="button-items mb-1">
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=ipblocked');?>"><button type="button" class="btn btn-outline-light">IP Blocked</button></a>
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=ipwhitelist');?>"><button type="button" class="btn btn-primary waves-light">IP Whitelist</button></a>
                                </div>
                                
                                <div class="float-right" style="margin-top: -40px;">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">IP Whitelist</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">

                                <div class="card-body">
                                    
                                    <div><button class="btn btn-danger px-3 float-right mt-0 mb-2" id="delete_all_ip"><i class="mdi mdi-trash-can mr-1"></i>Delete All IP</button></div>

                                    <div><button class="btn btn-success px-3 float-right mt-0 mb-2 mr-2" id="add_new_ip"><i class="mdi mdi-plus mr-1"></i>Add New IP</button></div>

                                    <h3 class="header-title mt-0">Data IP Whitelist</h3>
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }
                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th style="width: 20px;">No</th>
                                                    <th>IP</th>                         
                                                    <th>Note</th>                         
                                                    <th>Date</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th style="text-align: center; width:80px; ">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div>
            </div>




        </div>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

        #datatables_info {
            position: absolute;
        }
        table.dataTable td {
/*             padding-bottom: 0px; */
        }
        @media only screen and (max-width:480px) {
            #datatables_info {
                display: none;
            }
            input.input_daterangepicker {
            left: 0 !important;
            margin-top: 145px !important;
            margin-left: 10px !important;
            }
        }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>

        jQuery(document).ready(function($){

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_ip',
                        c_id: '<?php echo $c_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                        status: 'whitelist',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "ip" },
                    { "data": "note" },
                    { "data": "date" },
                    // { "data": "created_by" },
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'ip_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });


            $('.select2').select2();
            

        });
    
        
        $(document).on("click", ".edit_ip", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = $(this).attr("data-id");

            Swal.fire({

                title: '<strong id="popup_title">Data IP</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_ip",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Data IP",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan edit data IP</div><br><div id='box_ip'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Update Now!",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var id = $('.swal2-container').find('#data_id').val();
                        var ip = $('.swal2-container').find('#data_ip').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            id,
                            ip,
                            note
                        ];

                        var data = {
                            "action": "djafunction_update_ip",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){

                                const $row = $('#ip_' + id);
                                $row.find('td:eq(1)').text(ip);
                                $row.find('td:eq(2)').text(note);
                                
                                $('.update_ip_success').slideDown();

                                setTimeout(function() {
                                    $('.update_ip_success').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.update_ip_failed').slideDown();
                                setTimeout(function() {
                                    $('.update_ip_failed').slideUp('fast');
                                }, 4500);
                            }
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });


        $(document).on("click", ".del_ip", function(e) {
            
            var id = $(this).attr('data-id');
            $('#ip_'+id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus IP ini?',
              text: "",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_del_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#ip_'+id).slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });



        $(document).on("click", "#delete_all_ip", function(e) {
            
            $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus semua data ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    'delete_all_ip',
                    'whitelist'
                ];

                var data = {
                    "action": "djafunction_del_all_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('tbody tr').slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(document).on("click", "#add_new_ip", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = 'new';

            Swal.fire({

                title: '<strong id="popup_title">Add New IP</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_ip",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Add New IP",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan tambahkan IP</div><br><div id='box_ip'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Add IP",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var ip = $('.swal2-container').find('#data_ip').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            ip,
                            note,
                            'whitelist'
                        ];

                        var data = {
                            "action": "djafunction_add_ip",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {

                            var response_text = response.split("_");
                            response_info = response_text[0];
                            response_id = response_text[1];

                            if(response_info=='success'){

                                $('.swal2-container').find('#data_ip').val('');
                                $('.swal2-container').find('#data_note').val('');

                                $('.add_ip_success').slideDown();

                                setTimeout(function() {
                                    $('.add_ip_success').slideUp('fast');
                                }, 4500);

                                $('#datatables tbody').prepend('<tr id="ip_"'+response_id+'"" role="row" class="odd"><td class="sorting_1"><span data-id="'+response_id+'"></span></td><td>'+ip+'</td><td>'+note+'</td><td><div class="btn-group mb-4" role="group" aria-label="Basic example"><button type="button" class="btn btn-outline-light edit_ip" data-action="ontrash" data-id="'+response_id+'" title="" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-pencil mr-2" style="margin: 0 4px 0 2px !important;color:;"></i></button><button type="button" class="btn btn-outline-light del_ip" data-id="'+response_id+'" title="Delete Permanently"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');

                            }else{
                                $('.add_ip_failed').slideDown();
                                setTimeout(function() {
                                    $('.add_ip_failed').slideUp('fast');
                                }, 4500);
                            }
                           
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>

<?php }elseif($wablocked==true){ ?>

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">

                                <div class="button-items mb-1">
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=wablocked');?>"><button type="button" class="btn btn-primary waves-light">WA Blocked</button></a>
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=wawhitelist');?>"><button type="button" class="btn btn-outline-light">WA Whitelist</button></a>
                                </div>
                                
                                <div class="float-right" style="margin-top: -40px;">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">WA Blocked</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">

                                <div class="card-body">
                                    
                                    <div><button class="btn btn-danger px-3 float-right mt-0 mb-2" id="delete_all_wa"><i class="mdi mdi-trash-can mr-1"></i>Delete All WA</button></div>

                                    <div><button class="btn btn-success px-3 float-right mt-0 mb-2 mr-2" id="add_new_wa"><i class="mdi mdi-plus mr-1"></i>Add New WA</button></div>

                                    <h3 class="header-title mt-0">Data WA Blocked</h3>
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }
                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th style="width: 20px;">No</th>
                                                    <th>Whatsapp</th>                         
                                                    <th>Note</th>
                                                    <th>Date</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th style="text-align: center; width:80px; ">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div>
            </div>




        </div>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

        #datatables_info {
            position: absolute;
        }
        table.dataTable td {
/*             padding-bottom: 0px; */
        }
        @media only screen and (max-width:480px) {
            #datatables_info {
                display: none;
            }
            input.input_daterangepicker {
            left: 0 !important;
            margin-top: 145px !important;
            margin-left: 10px !important;
            }
        }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>

        jQuery(document).ready(function($){

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_wa',
                        c_id: '<?php echo $c_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                        status: 'blocked',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "wa" },
                    { "data": "note" },
                    { "data": "date" },
                    // { "data": "created_by" },
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'wa_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });


            $('.select2').select2();
            

        });
    
        
        $(document).on("click", ".edit_wa", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = $(this).attr("data-id");

            Swal.fire({

                title: '<strong id="popup_title">Data WA</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_wa",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Data WA",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan edit data Whatsapp</div><br><div id='box_wa'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Update Now!",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var id = $('.swal2-container').find('#data_id').val();
                        var wa = $('.swal2-container').find('#data_wa').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            id,
                            wa,
                            note
                        ];

                        var data = {
                            "action": "djafunction_update_wa",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){

                                const $row = $('#wa_' + id);
                                $row.find('td:eq(1)').text(wa);
                                $row.find('td:eq(2)').text(note);
                                
                                $('.update_wa_success').slideDown();

                                setTimeout(function() {
                                    $('.update_wa_success').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.update_wa_failed').slideDown();
                                setTimeout(function() {
                                    $('.update_wa_failed').slideUp('fast');
                                }, 4500);
                            }
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });


        $(document).on("click", ".del_wa", function(e) {
            
            var id = $(this).attr('data-id');
            $('#wa_'+id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus WA ini?',
              text: "",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_del_wa",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#wa_'+id).slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });



        $(document).on("click", "#delete_all_wa", function(e) {
            
            $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus semua data ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    'delete_all_wa',
                    'blocked'
                ];

                var data = {
                    "action": "djafunction_del_all_wa",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('tbody tr').slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(document).on("click", "#add_new_wa", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = 'new';

            Swal.fire({

                title: '<strong id="popup_title">Add New WA</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_wa",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Add New WA",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan tambahkan WA</div><br><div id='box_wa'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Add WA",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var wa = $('.swal2-container').find('#data_wa').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            wa,
                            note,
                            'blocked'
                        ];

                        var data = {
                            "action": "djafunction_add_wa",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {

                            var response_text = response.split("_");
                            response_info = response_text[0];
                            response_id = response_text[1];

                            if(response_info=='success'){

                                $('.swal2-container').find('#data_wa').val('');
                                $('.swal2-container').find('#data_note').val('');

                                $('.add_wa_success').slideDown();

                                setTimeout(function() {
                                    $('.add_wa_success').slideUp('fast');
                                }, 4500);

                                $('#datatables tbody').prepend('<tr id="wa_"'+response_id+'"" role="row" class="odd"><td class="sorting_1"><span data-id="'+response_id+'"></span></td><td>'+wa+'</td><td>'+note+'</td><td><div class="btn-group mb-4" role="group" aria-label="Basic example"><button type="button" class="btn btn-outline-light edit_wa" data-action="ontrash" data-id="'+response_id+'" title="" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-pencil mr-2" style="margin: 0 4px 0 2px !important;color:;"></i></button><button type="button" class="btn btn-outline-light del_wa" data-id="'+response_id+'" title="Delete Permanently"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');

                            }else if(response_info=='whitelistexist'){
                                $('.add_wa_failed2').slideDown();
                                setTimeout(function() {
                                    $('.add_ip_failed').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.add_wa_failed').slideDown();
                                setTimeout(function() {
                                    $('.add_wa_failed').slideUp('fast');
                                }, 4500);
                            }
                           
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>


<?php }elseif($wawhitelist==true){ ?>

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">
            <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>
            
            <!-- Page Content-->
            <div class="page-content-tab">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="page-title-box">

                                <div class="button-items mb-1">
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=wablocked');?>"><button type="button" class="btn btn-outline-light">WA Blocked</button></a>
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=wawhitelist');?>"><button type="button" class="btn  btn-primary waves-light">WA Whitelist</button></a>
                                </div>
                                
                                <div class="float-right" style="margin-top: -40px;">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard') ?>">Dashboard</a></li>
                                        <li class="breadcrumb-item active">WA Blocked</li>
                                    </ol>
                                </div>
                                <!-- <h4 class="page-title">Dashboard Settings</h4> -->
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">

                                <div class="card-body">
                                    
                                    <div><button class="btn btn-danger px-3 float-right mt-0 mb-2" id="delete_all_wa"><i class="mdi mdi-trash-can mr-1"></i>Delete All WA</button></div>

                                    <div><button class="btn btn-success px-3 float-right mt-0 mb-2 mr-2" id="add_new_wa"><i class="mdi mdi-plus mr-1"></i>Add New WA</button></div>

                                    <h3 class="header-title mt-0">Data WA Whitelist</h3>
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }
                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th style="width: 20px;">No</th>
                                                    <th>Whatsapp</th>                         
                                                    <th>Note</th>                         
                                                    <th>Date</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th style="text-align: center; width:80px; ">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div>
            </div>




        </div>

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

        #datatables_info {
            position: absolute;
        }
        table.dataTable td {
/*             padding-bottom: 0px; */
        }
        @media only screen and (max-width:480px) {
            #datatables_info {
                display: none;
            }
            input.input_daterangepicker {
            left: 0 !important;
            margin-top: 145px !important;
            margin-left: 10px !important;
            }
        }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>

        jQuery(document).ready(function($){

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_wa',
                        c_id: '<?php echo $c_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                        status: 'whitelist',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "wa" },
                    { "data": "note" },
                    { "data": "date" },
                    // { "data": "created_by" },
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
                "lengthMenu": [
                    [ 10, 25, 50, 100, -1 ],
                    [ '10', '25', '50', '100', 'All' ]
                ],
                "createdRow": function( row, data, dataIndex, recordsTotal ) {
                    // add ID on TR
                    var row_id = $(row).find('td:eq(0) span').data('id');
                    $(row).attr('id', 'wa_'+row_id);
                }
            }).on('xhr.dt', function ( e, settings, json, xhr ) {

            });


            $('.select2').select2();
            

        });
    
        
        $(document).on("click", ".edit_wa", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = $(this).attr("data-id");

            Swal.fire({

                title: '<strong id="popup_title">Data WA</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_wa",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Data WA",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan edit data Whatsapp</div><br><div id='box_wa'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Update Now!",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var id = $('.swal2-container').find('#data_id').val();
                        var wa = $('.swal2-container').find('#data_wa').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            id,
                            wa,
                            note
                        ];

                        var data = {
                            "action": "djafunction_update_wa",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){

                                const $row = $('#wa_' + id);
                                $row.find('td:eq(1)').text(wa);
                                $row.find('td:eq(2)').text(note);
                                
                                $('.update_wa_success').slideDown();

                                setTimeout(function() {
                                    $('.update_wa_success').slideUp('fast');
                                }, 4500);

                            }else{
                                $('.update_wa_failed').slideDown();
                                setTimeout(function() {
                                    $('.update_wa_failed').slideUp('fast');
                                }, 4500);
                            }
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });


        $(document).on("click", ".del_wa", function(e) {
            
            var id = $(this).attr('data-id');
            $('#wa_'+id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus WA ini?',
              text: "",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    id
                ];

                var data = {
                    "action": "djafunction_del_wa",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#wa_'+id).slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });



        $(document).on("click", "#delete_all_wa", function(e) {
            
            $('tbody tr').css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus semua data ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Hapus sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    'delete_all_wa',
                    'whitelist'
                ];

                var data = {
                    "action": "djafunction_del_all_wa",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('tbody tr').slideUp();
                        var message = "Successfully deleted permanently.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(document).on("click", "#add_new_wa", function (e) {
            e.preventDefault(); // Mencegah aksi default

            var id = 'new';

            Swal.fire({

                title: '<strong id="popup_title">Add New WA</strong>',
                  icon: false,
                  html:
                    '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                  showCloseButton: false,
                  showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                  }
            });

            var data = {
                action: "djafunction_get_data_wa",
                datanya: [id]
            };

            // Panggil AJAX
            jQuery.post(ajaxurl, data, function (response) {

                Swal.fire({
                    title: "Add New WA",
                    html: "<div style='font-size: 15px;margin-top: 10px;font-weight: normal;color: #6877a4;'>Silahkan tambahkan WA</div><br><div id='box_wa'>" + response + "</div>",
                    icon: false,
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: "Add WA",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    didOpen: (modal) => {
                    },
                    preConfirm: () => {

                        var wa = $('.swal2-container').find('#data_wa').val();
                        var note = $('.swal2-container').find('#data_note').val();
                        note = note.replace(/'/g, "&#39;");
                        
                        var data_nya = [
                            wa,
                            note,
                            'whitelist'
                        ];

                        var data = {
                            "action": "djafunction_add_wa",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {

                            var response_text = response.split("_");
                            response_info = response_text[0];
                            response_id = response_text[1];

                            if(response_info=='success'){

                                $('.swal2-container').find('#data_wa').val('');
                                $('.swal2-container').find('#data_note').val('');

                                $('.add_wa_success').slideDown();

                                setTimeout(function() {
                                    $('.add_wa_success').slideUp('fast');
                                }, 4500);

                                $('#datatables tbody').prepend('<tr id="wa_"'+response_id+'"" role="row" class="odd"><td class="sorting_1"><span data-id="'+response_id+'"></span></td><td>'+wa+'</td><td>'+note+'</td><td><div class="btn-group mb-4" role="group" aria-label="Basic example"><button type="button" class="btn btn-outline-light edit_wa" data-action="ontrash" data-id="'+response_id+'" title="" style="border-top-right-radius:0;border-bottom-right-radius:0;"><i class="mdi mdi-pencil mr-2" style="margin: 0 4px 0 2px !important;color:;"></i></button><button type="button" class="btn btn-outline-light del_wa" data-id="'+response_id+'" title="Delete Permanently"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px 0 2px !important;color:#EF4D56;"></i></button></div></td></tr>');

                            }else{
                                $('.add_wa_failed').slideDown();
                                setTimeout(function() {
                                    $('.add_wa_failed').slideUp('fast');
                                }, 4500);
                            }
                           
                        });

                        return false;
                        
                    }

                }).then(function (result) {

                });
            }).fail(function () {
                // Jika AJAX gagal
                Swal.fire("Error!", "Gagal mengambil data.", "error");
            });
        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>

    <?php }else{ ?>
            

        <?php check_verified_dashboard($akses); ?>

        <?php 

        if(isset($_GET['id'])){
            $c_id = $_GET['id'];
        }else{
            $c_id = null;
        }

        if(isset($_GET['affuid'])){
            $aff_user_id = $_GET['affuid'];
            $filer_by_aff_user_id = '&affuid='.$aff_user_id;
        }else{
            $aff_user_id = null;
            $filer_by_aff_user_id = "";
        }

        if(isset($_GET['date'])){
            $c_date = $_GET['date'];
        }else{
            $c_date = null;
        }
        if(isset($_GET['range'])){
            $c_range = $_GET['range'];
        }else{
            $c_range = null;
        }
        djavv();

        ?>


        <div class="body-nya" style="margin-top:20px;margin-right:20px;">

            <!-- Page Content-->
            <div class="page-content-tab">

                <div class="container-fluid">    

                    <?php 

                        $date_title = '';
                        $date_filter_title = '';
                        if(isset($_GET['date'])){

                            $date_filter_title = $_GET['date'];

                            if($date_filter_title=='today'){
                                $date_title = ' - Today';
                            }elseif($date_filter_title=='yesterday'){
                                $date_title = ' - Yesterday';
                            }elseif($date_filter_title=='7lastdays'){
                                $date_title = ' - 7 Last days';
                            }elseif($date_filter_title=='30lastdays'){
                                $date_title = ' - 30 Last days';
                            }elseif($date_filter_title=='thismonth'){
                                $date_title = ' - This Month';
                            }elseif($date_filter_title=='lastmonth'){
                                $date_title = ' - Last Month';
                            }elseif($date_filter_title=='thisyear'){
                                $date_title = ' - This Year';
                            }elseif($date_filter_title=='lastyear'){
                                $date_title = ' - Last Year';
                            }elseif($date_filter_title=='last2years'){
                                $date_title = ' - Last 2 Years';
                            }elseif($date_filter_title=='last3years'){
                                $date_title = ' - Last 3 Years';
                            }elseif($date_filter_title=='daterange'){
                                $date_title = ' - '.explode('_',$_GET['range'])[0].' s.d '.explode('_',$_GET['range'])[1];
                            }else{
                                $date_title = ' - All';
                            }
                        }else{
                            $date_title = ' - All';
                        }


                        // $referral_name = '';
                        // if($aff_user_id!=null){
                        //     $row3 = $wpdb->get_results("SELECT b.user_id as aff_user_id from $table_name10 a 
                        //     left JOIN $table_name11 b ON b.id = a.affcode_id where a.donate_id='$aff_user_id' ");
                        //     if($row3!=null){
                        //         $user_info_cs = get_userdata($row3[0]->aff_user_id);
                        //         if($user_info_cs->last_name==''){
                        //             $referral_name = ' ('.$user_info_cs->first_name.')';
                        //         }else{
                        //             $referral_name = ' ('.$user_info_cs->first_name.'&nbsp;'.$user_info_cs->last_name.')';
                        //         }
                        //     }
                        // }

                        $referral_name = get_referral_name_by_user_id($aff_user_id);
                        if($referral_name!=null){
                            $referral_name = ' (Aff: '.$referral_name.')';
                        }

                        if(isset($_GET['id'])){
                            $c_id = $_GET['id'];

                            $get_title = $wpdb->get_results("SELECT * from $table_name where campaign_id = '$c_id'");
                            if ($get_title==null) {
                               $titlenya = 'Show All'.$date_title.$referral_name;
                            }else{
                                $titlenya = $get_title[0]->title.$date_title.$referral_name;
                            }
                            
                        }else{
                            $c_id = 'all';
                            $titlenya = 'Show All'.$date_title.$referral_name;
                        }
                    
                    ?>



                    <div class="row"> 

                        <div class="col-sm-12" style="margin-bottom: 10px;">
                            <?php 
                            $c_license = c_expired_license();
                            echo $c_license;
                            ?>
                            <div class="page-title-box" style="padding-top: 10px;">

                                <div class="float-right" style="margin-left: 80px;">
                                    <input type="text" class="form-control input_daterangepicker" name="dates" style="width: 0;margin: 0;padding: 0;position:absolute;border: 0 !important;font-size: 0;min-height: 0 !important;">
                                    <select id="campaign_select" class="select2 form-control-primary mb-3 custom-select campaign_select" style="width: 240px;margin-bottom: 20px !important;">
                                        <option value="show_all">Show All Campaign</option>
                                        
                                        <?php

                                            if($role=='donatur'){
                                                $rows_campaign = $wpdb->get_results("SELECT campaign_id, title from $table_name where user_id='$id_login' ORDER BY id DESC");
                                                foreach ($rows_campaign as $row) {
                                                    $selected = '';
                                                    if($c_id==$row->campaign_id){
                                                        $selected = 'selected';
                                                    }
                                                    echo '<option value="'.$row->campaign_id.'" '.$selected.'>'.$row->title.'</option>';
                                                }
                                            }else{
                                                if($role=='cs'){

                                                    $rows_campaign = $wpdb->get_results("SELECT a.campaign_id, b.id, b.title FROM $table_name4 a
                                                        LEFT JOIN $table_name b on a.campaign_id=b.campaign_id
                                                        where a.cs_id=10 and b.id!='' GROUP BY b.id ORDER BY b.id DESC");
                                                    foreach ($rows_campaign as $row) {
                                                        $selected = '';
                                                        if($c_id==$row->campaign_id){
                                                            $selected = 'selected';
                                                        }
                                                        echo '<option value="'.$row->campaign_id.'" '.$selected.'>'.$row->title.'</option>';
                                                    }

                                                }else{
                                                    $rows_campaign = $wpdb->get_results("SELECT campaign_id, title from $table_name ORDER BY id DESC");
                                                    foreach ($rows_campaign as $row) {
                                                        $selected = '';
                                                        if($c_id==$row->campaign_id){
                                                            $selected = 'selected';
                                                        }
                                                        echo '<option value="'.$row->campaign_id.'" '.$selected.'>'.$row->title.'</option>';
                                                    }
                                                }
                                            }
                                            
                                        ?>

                                    </select>


                                            
                                            
                                    <div class="float-right d-flex justify-content-between">

                                       


                                        <div id="by_date_box" class="btn-group ml-1" style="background: #fff;">
                                            <button id="by_date_button" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false" title="Filter by Date">
                                                <i class="fas fa-calendar-alt"></i><i class="mdi mdi-chevron-down ml-1"></i>
                                            </button>
                                            
                                            <div id="by_date_list" class="dropdown-menu" style="<?php if($role=='donatur' || $role=='cs'){echo 'margin-left:-108px;}';}?>">
                                                <?php if(isset($_GET['id'])){ ?>
                                                    <a class="dropdown-item <?php if($date_filter_title=='today'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=today'.$filer_by_aff_user_id;?>">Today</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='yesterday'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=yesterday'.$filer_by_aff_user_id;?>">Yesterday</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='7lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=7lastdays'.$filer_by_aff_user_id;?>">7 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='30lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=30lastdays'.$filer_by_aff_user_id;?>">30 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thismonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=thismonth'.$filer_by_aff_user_id;?>">This Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastmonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=lastmonth'.$filer_by_aff_user_id;?>">Last Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thisyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=thisyear'.$filer_by_aff_user_id;?>">This Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=lastyear'.$filer_by_aff_user_id;?>">Last Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last2years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=last2years'.$filer_by_aff_user_id;?>">Last 2 Years</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last3years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=last3years'.$filer_by_aff_user_id;?>">Last 3 Years</a>
                                                    <a class="dropdown-item daterange <?php if($date_filter_title=='daterange'){echo'active';}?>" href="javascript:;" data-link="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=daterange'.$filer_by_aff_user_id;?>">Date Range</a>
                                                    <a class="dropdown-item <?php if($date_filter_title==null || $date_filter_title=='all'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=').$_GET['id'].'&date=all'.$filer_by_aff_user_id;?>">All</a>
                                                <?php } else { ?>
                                                    <a class="dropdown-item <?php if($date_filter_title=='today'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=today'.$filer_by_aff_user_id;?>">Today</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='yesterday'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=yesterday'.$filer_by_aff_user_id;?>">Yesterday</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='7lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=7lastdays'.$filer_by_aff_user_id;?>">7 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='30lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=30lastdays'.$filer_by_aff_user_id;?>">30 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thismonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=thismonth'.$filer_by_aff_user_id;?>">This Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastmonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=lastmonth'.$filer_by_aff_user_id;?>">Last Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thisyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=thisyear'.$filer_by_aff_user_id;?>">This Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=lastyear'.$filer_by_aff_user_id;?>">Last Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last2years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=last2years'.$filer_by_aff_user_id;?>">Last 2 Years</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last3years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=last3years'.$filer_by_aff_user_id;?>">Last 3 Years</a>
                                                    <a class="dropdown-item daterange <?php if($date_filter_title=='daterange'){echo'active';}?>" href="javascript:;" data-link="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=daterange'.$filer_by_aff_user_id;?>">Date Range</a>
                                                    <a class="dropdown-item <?php if($date_filter_title==null || $date_filter_title=='all'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard').'&date=all'.$filer_by_aff_user_id;?>">All</a>
                                                <?php } ?>
                                            </div>
                                        </div>

                                         <div class="btn-group ml-1" style="background: #fff;">
                                            <button id="by_affiliate_user" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false" title="Filter by Affiliate User">
                                                <i class="fa fa-users"></i>
                                            </button>
                                        </div>

                                        <?php if($role=='donatur' || $role=='cs'){ } else { ?>

                                        <div id="by_date_box2" class="btn-group ml-1" style="background: #fff;">
                                            <button id="by_download_button" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                <i class="dripicons-download mr-1"></i>Download<i class="mdi mdi-chevron-down ml-1"></i>
                                            </button>
                                            
                                            <div id="by_download_list" class="dropdown-menu" style="display: none;">
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $c_id; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="waiting">Waiting</a>
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $c_id; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="success">Success</a>
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $c_id; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="all">All</a>
                                            </div>

                                        </div>

                                        <div class="btn-group ml-1" style="background: #fff;">
                                            <button id="upload_donasi" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false" style="height: 32px;" <?php if($c_id=='all'){ echo 'disabled="" title="Pilih Campaign terlebih dahulu"';}else{echo 'title="Upload Data Donasi" data-ctitle="'.$titlenya.'" data-cid="'.$c_id.'"';}?>>
                                                <i class="dripicons-upload mr-1"></i>Upload Data
                                            </button>
                                        </div>
                                        <?php } ?>

                                        

                                        <?php if($role=='donatur' || $role=='cs'){ } else { ?>
                                        <!-- <div class="btn-group ml-1" style="background: #fff;">
                                            <a href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=settings');?>" data-id="<?php echo $c_id; ?>">
                                            <button type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect" style="height: 32px;" title="Settings Follow-up">
                                                <i class="dripicons-user-group mr-1"></i>Follow-up WA</button>
                                            </a>
                                        </div> -->

                                        <div id="by_setting_box" class="btn-group ml-1" style="background: #fff;">
                                            <button id="by_setting_button" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                <i class="fas fa-cog"></i>&nbsp;&nbsp;Options<i class="mdi mdi-chevron-down ml-1"></i>
                                            </button>
                                            
                                            <div id="by_setting_list" class="dropdown-menu" style="display: none;">
                                                <a class="dropdown-item download_donasi" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=trash');?>" data-id="<?php echo $c_id; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="success">Data Trash</a>
                                                <a class="dropdown-item download_donasi" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=ipblocked');?>">IP Blocked</a>
                                                <a class="dropdown-item download_donasi" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=wablocked');?>">WA Blocked</a>
                                                <a class="dropdown-item download_donasi" href="<?php echo admin_url('admin.php?page=donasiaja_dashboard&action=settings');?>" data-id="<?php echo $c_id; ?>">Follow-up WA</a>
                                            </div>

                                        </div>

                                        <?php } ?>

                                    </div>
                                    


                                </div>
                                
                                <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-document" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;"><?php echo $titlenya; ?></div></h4>
                            </div><!--end page-title-box-->
                        </div>

                        <?php if($role=='cs'){ ?>
                        <div class="col-sm-12">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: inherit;background-color: #0093E9;background-image: linear-gradient(45deg, #0093E9 0%, #80D0C7 100%);-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body">
                                    <div class="icon-contain">
                                        <div class="row">

                                            <div class="col-10 align-self-center">
                                                <h5 class="" style="color:#fff !important;text-shadow: 1px 1px 5px #00000054;">Data Analytics - <?php echo $fullname; ?></h5>
                                                <p class="text-muted mb-0" style="color:#fff !important;"><?php echo get_langArray('dash_cs_desc1');?> <?php echo $titlenya; ?></p>
                                                <br>
                                            </div><!--end col-->
                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    
                                                </div>
                                            </div>


                                            <div id="box_stat_cs" class="card-body bg-light-alt chart-report-card">
                                                <div class="row d-flex justify-content-between">
                                                    <div class="col-lg-3">
                                                        <div class="media">
                                                                                                                         
                                                            <div class="media-body align-self-center text-truncate">
                                                                <h4 class="mt-0 mb-0 font-weight-semibold text-dark font-24"><?php echo $show_currency2; ?><span id="totalDonasiCS">...</span> 
                                                                    
                                                                </h4> 
                                                                <p class="text-dark font-weight-semibold mb-0 font-14" style="padding-top: 10px;font-weight: normal;color: #848ba6 !important;"><?php echo get_langArray('dash_cs_desc2');?></p>
                                                            </div><!--end media-body-->
                                                        </div><!--end media-->
                                                    </div><!--end col-->
                                                    <div class="col-lg-3">
                                                        <div class="media">
                                                                                              
                                                            <div class="media-body align-self-center text-truncate">
                                                                <h4 class="mt-0 mb-0 font-weight-semibold text-dark font-24"><span id="jumlahDonasiCS">...</span></h4> 
                                                                <p class="text-dark font-weight-semibold mb-0 font-14" style="padding-top: 10px;font-weight: normal;color: #848ba6 !important;"><?php echo get_langArray('dash_cs_desc3');?></p>
                                                            </div><!--end media-body-->
                                                        </div><!--end media-->
                                                    </div><!--end col-->
                                                    <div class="col-lg-3">
                                                        <div class="media">
                                                                                              
                                                            <div class="media-body align-self-center text-truncate">
                                                                <h4 class="mt-0 mb-0 font-weight-semibold text-dark font-24"><span id="jumlahDonasiTerkumpulCS">...</span></h4> 
                                                                <p class="text-dark font-weight-semibold mb-0 font-14" style="padding-top: 10px;font-weight: normal;color: #848ba6 !important;"><?php echo get_langArray('dash_cs_desc4');?></p>
                                                            </div><!--end media-body-->
                                                        </div><!--end media-->
                                                    </div><!--end col-->
                                                    <div class="col-lg-3">
                                                        <div class="media">
                                                                                              
                                                            <div class="media-body align-self-center text-truncate">
                                                                <h4 class="mt-0 mb-0 font-weight-semibold text-dark font-24"><span id="konversiCS">...</span></h4> 
                                                                <p class="text-dark font-weight-semibold mb-0 font-14" style="padding-top: 10px;font-weight: normal;color: #848ba6 !important;"><?php echo get_langArray('dash_cs_desc5');?></p>
                                                            </div><!--end media-body-->
                                                        </div><!--end media-->
                                                    </div><!--end col-->
                                                </div><!--end row-->
                                            </div>


                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <?php } else { ?>
                        <div class="col-lg-4 col-total-donasi">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #f20988;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body">
                                    <div class="icon-contain">
                                        <div class="row">
                                            <div class="col-10 align-self-center">
                                                <h5 class=""><?php echo get_langArray('dash_card_title1');?></h5>
                                                <h2 class="my-2"><?php echo $show_currency2; ?><span id="totalDonasi">...</span></h3>
                                                <p class="text-muted mb-0"><?php echo get_langArray('dash_card_desc1');?></p>
                                            </div><!--end col-->
                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-heart bg-soft-pink"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <div class="col-lg-4 col-jumlah-donasi">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #7680ff;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body">
                                    <div class="icon-contain">
                                        <div class="row">
                                            <div class="col-10 align-self-center">
                                                <h5 class=""><?php echo get_langArray('dash_card_title2');?></h5>
                                                <h2 class="my-2"><span id="jumlahDonasi">...</span></h3>
                                                <p class="text-muted mb-0"><span id="jumlahDonasiTerkumpul">...</span></p>
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
                        <div class="col-lg-4 col-konversi-donasi">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="border-bottom: 4px solid #0dcfd9;-webkit-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);-moz-box-shadow: 0 6px 12px rgba(164, 192, 217, 0.3);">
                                <div class="card-body">
                                    <div class="icon-contain">
                                        <div class="row">
                                            <div class="col-10 align-self-center">
                                                <h5 class=""><?php echo get_langArray('dash_card_title3');?></h5>
                                                <h2 class="my-2"><span id="konversi">...</span></h3>
                                                <p class="text-muted mb-0"><?php echo get_langArray('dash_card_desc4');?></p>
                                            </div><!--end col-->
                                            <div class="col-2 align-self-center">
                                                <div class="">
                                                    <div class="icon-info mb-3">
                                                        <i class="dripicons-graph-pie bg-soft-success"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>  <!--end row-->                                                      
                                    </div><!--end icon-contain-->
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->  
                        <?php } ?>

                    </div><!--end row-->
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <h3 class="header-title mt-0"><?php echo get_langArray('dash_table_title'); ?></h3>
                                    <!-- <i class="mdi mdi-table-edit float-right mt-0 mb-3 edit_table" title="Edit kolom table"></i> -->
                                    <!-- <br> -->
                                    <br>
                                    <div class="table-responsive dash-social">
                                        <?php
                                            if($btn_followup=='5'){
                                                $width = 'width:200px;';
                                            }elseif($btn_followup=='4'){
                                                $width = 'width:165px;';
                                            }else{
                                                $width = 'width:120px;';
                                            }

                                        ?>
                                        <table id="datatables" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                    <th>No</th>
                                                    <th></th>
                                                    <th><?php echo get_langArray('dash_table_col1'); ?></th>
                                                    <?php if($role=='donatur'){ ?>
                                                        <?php if($wa_column_setting=='1'){ ?>
                                                        <th>Whatsapp</th>
                                                        <?php } ?>
                                                    <?php }else{ ?>
                                                    <th>Whatsapp</th>
                                                    <?php } ?>
                                                    <th style="width: 120px;"><?php echo get_langArray('dash_table_col2'); ?></th>
                                                    <th>Program</th>
                                                    <?php if($role!='donatur'){ ?>                                                 
                                                    <th>CS</th>
                                                    <?php } ?>                              
                                                    <th>Payment</th> 
                                                    <?php if($role!='donatur'){ ?>
                                                    <th style="<?php echo $width; ?>">Followup</th>
                                                    <?php } ?>                                 
                                                    <th>Date</th>
                                                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                                                    <th style="text-align: center;">Action</th>
                                                    <?php  } ?> 
                                                </tr>
                                            </thead>

                                        </table>                    
                                    </div>                                         
                                </div><!--end card-body--> 
                            </div><!--end card--> 
                        </div> <!--end col-->                               
                    </div><!--end row--> 

                </div><!-- container -->

            </div>
            <!-- end page content -->
        </div>
        <!-- end page-wrapper -->

        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <style>
            .daterangepicker {position: absolute;color: inherit;background-color: #fff;border-radius: 4px;border: 1px solid #ddd;width: 278px;max-width: none;padding: 0;margin-top: 7px;top: 100px;left: 20px;z-index: 3001;display: none;font-family: arial;font-size: 15px;line-height: 1em;}.daterangepicker:before, .daterangepicker:after {position: absolute;display: inline-block;border-bottom-color: rgba(0, 0, 0, 0.2);content: '';}.daterangepicker:before {top: -7px;border-right: 7px solid transparent;border-left: 7px solid transparent;border-bottom: 7px solid #ccc;}.daterangepicker:after {top: -6px;border-right: 6px solid transparent;border-bottom: 6px solid #fff;border-left: 6px solid transparent;}.daterangepicker.opensleft:before {right: 9px;}.daterangepicker.opensleft:after {right: 10px;}.daterangepicker.openscenter:before {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.openscenter:after {left: 0;right: 0;width: 0;margin-left: auto;margin-right: auto;}.daterangepicker.opensright:before {left: 9px;}.daterangepicker.opensright:after {left: 10px;}.daterangepicker.drop-up {margin-top: -7px;}.daterangepicker.drop-up:before {top: initial;bottom: -7px;border-bottom: initial;border-top: 7px solid #ccc;}.daterangepicker.drop-up:after {top: initial;bottom: -6px;border-bottom: initial;border-top: 6px solid #fff;}.daterangepicker.single .daterangepicker .ranges, .daterangepicker.single .drp-calendar {float: none;}.daterangepicker.single .drp-selected {display: none;}.daterangepicker.show-calendar .drp-calendar {display: block;}.daterangepicker.show-calendar .drp-buttons {display: block;}.daterangepicker.auto-apply .drp-buttons {display: none;}.daterangepicker .drp-calendar {display: none;max-width: 270px;}.daterangepicker .drp-calendar.left {padding: 8px 0 8px 8px;}.daterangepicker .drp-calendar.right {padding: 8px;}.daterangepicker .drp-calendar.single .calendar-table {border: none;}.daterangepicker .calendar-table .next span, .daterangepicker .calendar-table .prev span {color: #fff;border: solid black;border-width: 0 2px 2px 0;border-radius: 0;display: inline-block;padding: 3px;}.daterangepicker .calendar-table .next span {transform: rotate(-45deg);-webkit-transform: rotate(-45deg);}.daterangepicker .calendar-table .prev span {transform: rotate(135deg);-webkit-transform: rotate(135deg);}.daterangepicker .calendar-table th, .daterangepicker .calendar-table td {white-space: nowrap;text-align: center;vertical-align: middle;min-width: 32px;width: 32px;height: 24px;line-height: 24px;font-size: 12px;border-radius: 4px;border: 1px solid transparent;white-space: nowrap;cursor: pointer;}.daterangepicker .calendar-table {border: 1px solid #fff;border-radius: 4px;background-color: #fff;}.daterangepicker .calendar-table table {width: 100%;margin: 0;border-spacing: 0;border-collapse: collapse;}.daterangepicker td.available:hover, .daterangepicker th.available:hover {background-color: #eee;border-color: transparent;color: inherit;}.daterangepicker td.week, .daterangepicker th.week {font-size: 80%;color: #ccc;}.daterangepicker td.off, .daterangepicker td.off.in-range, .daterangepicker td.off.start-date, .daterangepicker td.off.end-date {background-color: #fff;border-color: transparent;color: #999;}.daterangepicker td.in-range {background-color: #ebf4f8;border-color: transparent;color: #000;border-radius: 0;}.daterangepicker td.start-date {border-radius: 4px 0 0 4px;}.daterangepicker td.end-date {border-radius: 0 4px 4px 0;}.daterangepicker td.start-date.end-date {border-radius: 4px;}.daterangepicker td.active, .daterangepicker td.active:hover {background-color: #357ebd;border-color: transparent;color: #fff;}.daterangepicker th.month {width: auto;}.daterangepicker td.disabled, .daterangepicker option.disabled {color: #999;cursor: not-allowed;text-decoration: line-through;}.daterangepicker select.monthselect, .daterangepicker select.yearselect {font-size: 12px;padding: 1px;height: auto;margin: 0;cursor: default;}.daterangepicker select.monthselect {margin-right: 2%;width: 56%;}.daterangepicker select.yearselect {width: 40%;}.daterangepicker select.hourselect, .daterangepicker select.minuteselect, .daterangepicker select.secondselect, .daterangepicker select.ampmselect {width: 50px;margin: 0 auto;background: #eee;border: 1px solid #eee;padding: 2px;outline: 0;font-size: 12px;}.daterangepicker .calendar-time {text-align: center;margin: 4px auto 0 auto;line-height: 30px;position: relative;}.daterangepicker .calendar-time select.disabled {color: #ccc;cursor: not-allowed;}.daterangepicker .drp-buttons {clear: both;text-align: right;padding: 8px;border-top: 1px solid #ddd;display: none;line-height: 12px;vertical-align: middle;}.daterangepicker .drp-selected {display: inline-block;font-size: 12px;padding-right: 8px;}.daterangepicker .drp-buttons .btn {margin-left: 8px;font-size: 12px;font-weight: bold;padding: 4px 8px;}.daterangepicker.show-ranges.single.rtl .drp-calendar.left {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.single.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker.show-ranges.rtl .drp-calendar.right {border-right: 1px solid #ddd;}.daterangepicker.show-ranges.ltr .drp-calendar.left {border-left: 1px solid #ddd;}.daterangepicker .ranges {float: none;text-align: left;margin: 0;}.daterangepicker.show-calendar .ranges {margin-top: 8px;}.daterangepicker .ranges ul {list-style: none;margin: 0 auto;padding: 0;width: 100%;}.daterangepicker .ranges li {font-size: 12px;padding: 8px 12px;cursor: pointer;}.daterangepicker .ranges li:hover {background-color: #eee;}.daterangepicker .ranges li.active {background-color: #08c;color: #fff;}@media (min-width: 564px) {.daterangepicker {width: auto;}.daterangepicker .ranges ul {width: 140px;}.daterangepicker.single .ranges ul {width: 100%;}.daterangepicker.single .drp-calendar.left {clear: none;}.daterangepicker.single .ranges, .daterangepicker.single .drp-calendar {float: left;}.daterangepicker {direction: ltr;text-align: left;}.daterangepicker .drp-calendar.left {clear: left;margin-right: 0;}.daterangepicker .drp-calendar.left .calendar-table {border-right: none;border-top-right-radius: 0;border-bottom-right-radius: 0;}.daterangepicker .drp-calendar.right {margin-left: 0;}.daterangepicker .drp-calendar.right .calendar-table {border-left: none;border-top-left-radius: 0;border-bottom-left-radius: 0;}.daterangepicker .drp-calendar.left .calendar-table {padding-right: 8px;}.daterangepicker .ranges, .daterangepicker .drp-calendar {float: left;}}@media (min-width: 730px) {.daterangepicker .ranges {width: auto;}.daterangepicker .ranges {float: left;}.daterangepicker.rtl .ranges {float: right;}.daterangepicker .drp-calendar.left {clear: none !important;}}

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px !important;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:87%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
            input.input_daterangepicker:focus {
                outline:none !important;
            }
            .data_csnya .select2-container--default .select2-selection--single {
                height: 45px !important;
                padding-top: 8px;
            }
            .data_csnya .select2-container--default .select2-selection--single .select2-selection__arrow {
                margin-top: 8px;
            }

            .select2-results__option{padding-left:10px;padding-right:10px;font-size: 13px;}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}

            #box_user_select .select2-container--default .select2-selection--single { 
                height: 40px !important;
                padding-top: 5px;
            }
            #box_user_select .select2-container--default .select2-selection--single .select2-selection__arrow { 
                margin-top: 5px;
            }
            div:where(.swal2-container).swal2-center > .swal2-popup {
              padding-bottom: 40px !important;
            }
            .swal2-actions {
                margin-top: 30px;
            }

            #datatables_info {
                position: absolute;
            }
            @media only screen and (max-width:480px) {
                #datatables_info {
                    display: none;
                }
                input.input_daterangepicker {
                left: 0 !important;
                margin-top: 145px !important;
                margin-left: 10px !important;
                }
            }

        </style>

        <!-- Required datatable js -->

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- Buttons examples -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.buttons.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/buttons.bootstrap4.min.js"></script>
        
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>
        

        <!-- App js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/app.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/moment.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/daterangepicker.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate-4.1.1.min.css" rel="stylesheet" type="text/css">


        <script>



        jQuery(document).ready(function($){

            $(document).on("click", "#by_affiliate_user", function (e) {

                e.preventDefault(); // Mencegah aksi default

                var row_id = $(this).attr("data-rowid");
                var campaign_id = $(this).attr("data-campaignid");

                Swal.fire({

                    title: '<strong id="popup_title">Affiliate User (Fundraiser)</strong>',
                      icon: false,
                      html:
                        '<div><br><div class="spinner-border text-primary" role="status"></div></div>',
                      showCloseButton: false,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                });

                var data = {
                    action: "djafunction_get_data_users",
                    datanya: [campaign_id]
                };

                // Panggil AJAX
                jQuery.post(ajaxurl, data, function (response) {

                    Swal.fire({
                        title: "Affiliate User (Fundraiser)",
                        html: "<div style='font-size: 15px;margin-top: 10px;font-weight: bold;color: #6877a4;'>Silahkan pilih data User</div><br><div id='box_user_select'>" + response + "</div>",
                        icon: false,
                        showCancelButton: true,
                        confirmButtonText: "Filter",
                        cancelButtonText: "Cancel",
                        reverseButtons: true,
                        didOpen: (modal) => {
                            console.log("Swal dibuka. Mencoba inisialisasi Select2...");
                            
                            setTimeout(() => {
                                let selectElement = $('#box_user_select select');

                                if (selectElement.length > 0) {
                                    selectElement.select2({
                                        dropdownParent: $(modal) // Penting: agar dropdown tidak terpotong
                                    });
                                    console.log("Select2 berhasil diinisialisasi!");
                                } else {
                                    console.error("Elemen Select2 tidak ditemukan!");
                                }
                            }, 100);
                        }
                    }).then(function (result) {

                        // var name_user    = $('.select2.usernya_select').find("option:selected").val();
                        // var current_url = "<?php echo esc_url( home_url( '/' ) ); ?>";
                        var current_url = new URL(window.location.href);
                        var id_user  = $('.select2.usernya_select').find("option:selected").attr("data-userid");

                        if (result.value) {

                            console.log(current_url);

                            // Set atau ganti nilai aff_user_id
                            current_url.searchParams.set('affuid', id_user);

                            // Redirect ke URL baru
                            window.location.href = current_url.toString();

                            // var new_url = current_url + '&aff_user_id=' + encodeURIComponent(id_user);

                            // window.location.href = new_url;
                            
                            // var data_nya = [
                            //     campaign_id,
                            //     id_user,
                            //     name_user
                            // ];

                            // var data = {
                            //     "action": "djafunction_update_campaigner",
                            //     "datanya": data_nya
                            // };

                            // console.log(data_nya);
                            
                            // // return false;

                            // jQuery.post(ajaxurl, data, function(response) {
                            //     if(response=='success'){
                            //         $('#campaign_'+row_id+' .campaigner').text(name_user);
                            //         swal.fire(
                            //           'Success!',
                            //           'Your data has been updated.',
                            //           'success'
                            //         );
                            //     }else{
                            //         swal.fire(
                            //           'Error!',
                            //           'Your data not updated.',
                            //           'error'
                            //         );
                            //     }
                            // });
                        }


                    });
                }).fail(function () {
                    // Jika AJAX gagal
                    Swal.fire("Error!", "Gagal mengambil data.", "error");
                });
            });

            $(document).on("click",".btn-ip-blocked",function(){
                
                var ip = $(this).attr('data-ip');
                var id = $(this).attr('data-id');

                var data_nya = [
                    ip,
                    id
                ];

                var data = {
                    "action": "djafunction_blocked_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='exist'){
                        var message = "IP ini sudah diblokir sebelumnya.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else if(response=='whitelist'){
                        var message = "IP sudah masuk di whitelist, tidak bisa diblokir.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_csip').html(response);
                        var message = "IP berhasil diblokir.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });


            $(document).on("click",".btn-ip-open",function(){
                
                var ip = $(this).attr('data-ip');

                var data_nya = [
                    ip
                ];

                var data = {
                    "action": "djafunction_open_ip",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='not exist'){
                        var message = "IP tidak ditemukan.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_csip').html(response);
                        var message = "IP berhasil dibuka kembali blokirnya.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });

            $(document).on("click",".btn-whatsapp-blocked",function(){
                
                var whatsapp = $(this).attr('data-whatsapp');
                var id = $(this).attr('data-id');

                var data_nya = [
                    whatsapp,
                    id
                ];

                var data = {
                    "action": "djafunction_blocked_whatsapp",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='exist'){
                        var message = "Nomor WhatsApp ini sudah diblokir sebelumnya.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else if(response=='whitelist'){
                        var message = "Whatsapp sudah masuk whitelist, tidak bisa diblokir.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_wa').html(response);
                        var message = "Whatsapp berhasil diblokir.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });
            


            $(document).on("click",".btn-whatsapp-open",function(){
                
                var whatsapp = $(this).attr('data-whatsapp');

                var data_nya = [
                    whatsapp
                ];

                var data = {
                    "action": "djafunction_open_whatsapp",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='not exist'){
                        var message = "No Whatsapp tidak ditemukan.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{
                        $('#d_wa').html(response);
                        var message = "No Whatsapp berhasil dibuka kembali blokirnya.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
                
            });


            $('input[name="dates"]').daterangepicker({
                "alwaysShowCalendars": true,
            });

            datalink = '';
            $(".daterange").click(function() {
                datalink = $(this).data('link');
                $('input[name="dates"]').focus();
            });

            $('input[name="dates"]').on('apply.daterangepicker', function(ev, picker) {
              var startDate = picker.startDate;
              var endDate = picker.endDate;
              var redirectWindow = window.open(datalink+"&range="+startDate.format('YYYY-MM-DD')+"_"+endDate.format('YYYY-MM-DD'), "_self");
                redirectWindow.location;
            });

            $(document).on("change","select[name=datatables_length]",function(){
                var length = $(this).val();
            });

            $('#datatables').DataTable( {
                "processing": true,
                "serverSide": true,
                "dom": "lifrtp",
                "ajax": {
                    "url": ajaxurl,
                    "type": "POST",
                    "dataSrc": "data",
                    "data": {
                        action: 'dja_get_data_donasi',
                        c_id: '<?php echo $c_id; ?>',
                        aff_user_id: '<?php echo $aff_user_id; ?>',
                        date_filter: '<?php echo $c_date; ?>',
                        date_range: '<?php echo $c_range; ?>',
                    }
                },
                "columns": [
                    { "data": "no" },
                    { "data": "picture" },
                    { "data": "name" },
                    <?php if($role=='donatur'){ ?>
                        <?php if($wa_column_setting=='1'){ ?>
                    { "data": "whatsapp" },
                        <?php } ?>
                    <?php }else{ ?>
                    { "data": "whatsapp" },
                    <?php } ?>
                    { "data": "total_donate" },
                    { "data": "program" },
                    <?php if($role!='donatur'){ ?>
                    { "data": "cs" },
                    <?php } ?>
                    { "data": "payment_status" },
                    <?php if($role!='donatur'){ ?>
                    { "data": "followup" },
                    <?php } ?>
                    { "data": "date" },
                    <?php  if($role=='donatur' || $role=='cs'){}else{ ?>
                    { "data": "action" }
                    <?php } ?>
                ],
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
                var totalDonasi = json.totalDonasi;
                var totalDonasiCS = json.totalDonasiCS;
                var jumlahDonasi = json.jumlahDonasi;
                var jumlahDonasiCS = json.jumlahDonasiCS;
                var jumlahDonasiTerkumpul = json.jumlahDonasiTerkumpul;
                var jumlahDonasiTerkumpulCS = json.jumlahDonasiTerkumpulCS;
                var konversi = json.konversi;
                var konversiCS = json.konversiCS;

                $('#totalDonasi').html(totalDonasi);
                $('#totalDonasiCS').html(totalDonasiCS);
                $('#jumlahDonasi').html(jumlahDonasi);
                $('#jumlahDonasiCS').html(jumlahDonasiCS);
                $('#jumlahDonasiTerkumpul').html(jumlahDonasiTerkumpul);
                $('#jumlahDonasiTerkumpulCS').html(jumlahDonasiTerkumpulCS);
                $('#konversi').html(konversi);
                $('#konversiCS').html(konversiCS);
            });


            $('.select2').select2();

            $(document.body).on("change",".campaign_select",function(){
                var c_id = (this.value);
                if(c_id=='show_all'){
                    var url = "<?php echo admin_url('admin.php?page=donasiaja_dashboard');?>";
                }else{
                    var url = "<?php echo admin_url('admin.php?page=donasiaja_dashboard&id=');?>"+c_id;
                }
                window.open(url,"_self","","")

            });

            $('.download_donasi').on('click', function(e){
                var status = $(this).data('status');
                var id_campaign = $(this).data('id');
                var date_filter = $(this).data('date');
                var date_range = $(this).data('range');
                if(date_filter==''){date_filter='all';}
                var redirectWindow = window.open("<?php echo admin_url('admin-post.php?action=download_data_donasi'); ?>&c_id="+id_campaign+"&c_date="+date_filter+"&c_range="+date_range+"&status="+status, "_self");
                redirectWindow.location;

            });

            $('#by_date_button').on('click', function(e){
                if($('#by_date_list').hasClass("show_list")){
                    $('#by_date_list').css({"display":"none"}).removeClass('show_list');
                }else{
                    $('#by_date_list').css({"display":"inline"}).addClass('show_list');
                }
            });

            $('#by_download_button').on('click', function(e){
                if($('#by_download_list').hasClass("show_list")){
                    $('#by_download_list').css({"display":"none"}).removeClass('show_list');
                }else{
                    $('#by_download_list').css({"display":"inline"}).addClass('show_list');
                }
            });

            $('#by_setting_button').on('click', function(e){
                if($('#by_setting_list').hasClass("show_list")){
                    $('#by_setting_list').css({"display":"none"}).removeClass('show_list');
                }else{
                    $('#by_setting_list').css({"display":"inline"}).addClass('show_list');
                }
            });

            $( "#by_date_list" ).mouseleave(function() {
                $('#by_date_list').css({"display":"none"}).removeClass('show_list');
            }).mouseenter(function() {
                $('#by_date_list').css({"display":"inline"}).addClass('show_list');
            });

            $( "#by_download_list" ).mouseleave(function() {
                $('#by_download_list').css({"display":"none"}).removeClass('show_list');
            }).mouseenter(function() {
                $('#by_download_list').css({"display":"inline"}).addClass('show_list');
            });

            $( "#by_setting_list" ).mouseleave(function() {
                $('#by_setting_list').css({"display":"none"}).removeClass('show_list');
            }).mouseenter(function() {
                $('#by_setting_list').css({"display":"inline"}).addClass('show_list');
            });


            $(document).on('click', '#upload_donasi', function(e){
                var title_campaign = $(this).data('ctitle');
                Swal.fire({
                      title: '<strong>Upload Data Donasi</strong>',
                      icon: false,
                      html:
                        '<div id="data_box"><form id="form_upload_donasi" class="form_upload" style="padding-bottom:0;"><div class="row"><div class="col-md-12"> <div role="alert" class="alert alert-info border-0 upload_donasi_success" style="font-size: 13px; margin-top: -20px; margin-bottom: 30px; display: none;">Upload data success.</div> <div role="alert" class="alert alert-danger border-0 upload_donasi_failed" style="font-size: 13px;margin-top: -20px;margin-bottom: 30px;display:none;">Upload data failed.</div><div class="form-group"><h4 class="mt-0 header-title">Campaign</h4><h5 class="text-muted mb-3">'+title_campaign+'</h5></div></div><div class="col-md-4"></div></div><div class="row"><div class="col-md-12"><h4 class="mt-0 header-title">File Upload</h4><p class="text-muted mb-3">Pilih file data donasi anda.</p><div class="custom-file"><input id="file_data_donasi" type="file" name="file" accept=".xlsx, .xls" class="custom-file-input"><input id="cid" type="text" name="cid" value="<?php echo $c_id; ?>" style="display:none;"><label class="custom-file-label" for="inputGroupFile04" style="text-align: left;" id="file_data_donasi_label">Choose file</label></div></div></div><div class="row"><div class="col-sm-12 text-center" style="padding-top: 30px;"><button type="submit" class="btn btn-primary px-4" id="upload_donasi_now">Upload Now<div class="spinner-border spinner-border-sm text-white upload_donasi_now_loading" style="margin-left: 3px; display: none;"></div></button></div></div><br><br><p class="text-muted mb-3"><span style="color:red;">*</span> <a href="<?php echo admin_url('admin-post.php?action=download_template_excel') ?>" targe="_blank"><i class="mdi mdi-file-table-outline" style="margin-right:3px;"></i>Download Template Table</a></p></form></div>',
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

            $(document).on('change', '#file_data_donasi', function(e){
                var filename = $(this).val().split('\\').pop();
                $('#file_data_donasi_label').text(filename);
            });


            $(document).on('submit', 'form#form_upload_donasi', function(e){
                e.preventDefault();
                $('.upload_donasi_now_loading').show();

                var formData = new FormData(this);

                jQuery.ajax({
                    type: 'POST',
                    url: '<?php echo admin_url('admin-post.php?action=upload_donasi') ?>',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response){

                        console.log(response);
                        
                        if(response!='failed'){
                            $('.upload_donasi_success').html(response).slideDown();

                            setTimeout(function() {
                                $('.upload_donasi_success').slideUp('fast');
                            }, 6500);

                        }else{
                            $('.upload_donasi_failed').slideDown();
                            setTimeout(function() {
                                $('.upload_donasi_failed').slideUp('fast');
                            }, 6500);
                        }

                        $('.upload_donasi_now_loading').hide();

                    }
                });

            });

            $(document).on('keyup', '#inp5', function(e){
                if(event.which >= 37 && event.which <= 40) return;
                $(this).val(function(index, value) {
                    return nilai = value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                });
            });

            $(document).on('keypress', '.wa_donatur', function(e){
                if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                    //display error message
                    $("#errmsg2").html("Numbers Only").show().fadeOut(3000);
                    return false;
                }
            });

            $(document).on('click', '.edit_detail', function(e){
                var id_donasi = $(this).attr('data-id');
                $('#table_donasi').hide();
                $('.swal2-actions').hide();
                $('.edit_detail').hide();
                $('#edit_data_donasi').slideDown();

            });

            $(document).on('click', '.back_me', function(e){
                $('#table_donasi').show();
                $('.swal2-actions').show();
                $('.edit_detail').show();
                $('#edit_data_donasi').hide();
            });

            $(document).on('click', '.icon_pencil', function(e){

                $(this).removeClass('opt_active').addClass('opt_hide');
                $('.icon_user').addClass('opt_active').removeClass('opt_hide');
                $('.data_usernya .select2').hide();
                $('.usernya_select').removeClass('opt_active').addClass('opt_hide');
                $('.usernya_input').addClass('opt_active').removeClass('opt_hide');

                $('.wa_donatur, .email_donatur').prop( 'disabled', false );

                var nama_user = $('.select2.usernya_select').find("option:selected").attr("data-name");
                if(nama_user==''){
                    nama_user = $('#inp1').val();
                }
                $('.usernya_input').val(nama_user);
            });

            $(document).on('click', '.icon_user', function(e){
                $(this).removeClass('opt_active').addClass('opt_hide');
                $('.icon_pencil').addClass('opt_active').removeClass('opt_hide');
                $('.data_usernya .select2').show();
                $('.usernya_select').addClass('opt_active').removeClass('opt_hide');
                $('.usernya_input').removeClass('opt_active').addClass('opt_hide');

                $('.wa_donatur, .email_donatur').prop( 'disabled', true );
            });

            $(document).on('change', '.set_anonim_status', function(e){
                
                if(this.checked) {
                    console.log(1);
                    $('#anonim_status span').text('Ya');
                    $('#anonim_status .set_anonim').addClass('anonim_yes').removeClass('anonim_no');
                }else{
                    console.log(0);
                    $('#anonim_status span').text('Tidak');
                    $('#anonim_status .set_anonim').addClass('anonim_no').removeClass('anonim_yes');
                }

            });

            $(document).on('click', '.update_donasi', function(e){
                
                $('.update_donasi_loading').show();

                var id_donasi = $('#inp0').val();
                var userid = '0';
                var name = $('#inp1').val();
                var wa = $('#inp2').val();
                var email = $('#inp3').val();
                var comment = $('#inp4').val();
                var nominal = $('#inp6').val();
                var anonim = $("input#customSwitchAnonim:checked").val();
                var user_randid = $('#inp7').val();
                var user_sapaan = $('#inp8').find("option:selected").val();
                
                nominal_number = dotToNumber(nominal);

                if ($("#edit_data_donasi .data_usernya .select2").hasClass("opt_active")) {
                    var name    = $('.select2.usernya_select').find("option:selected").val();
                    var userid  = $('.select2.usernya_select').find("option:selected").attr("data-userid");
                }

                var name_cs    = $('.select2.csnya_select').find("option:selected").val();
                var userid_cs  = $('.select2.csnya_select').find("option:selected").attr("data-userid");

                if(userid_cs==undefined){
                    userid_cs = null;
                }
                if(name_cs==''){
                    name_cs = '-';
                }

                var data_nya = [
                    id_donasi,
                    userid,
                    name,
                    wa,
                    email,
                    comment,
                    nominal_number,
                    anonim,
                    user_randid,
                    userid_cs,
                    user_sapaan
                ];

                var data = {
                    "action": "djafunction_update_donasi",
                    "datanya": data_nya
                };
                jQuery.post(ajaxurl, data, function(response) {

                    $('.update_donasi_loading').hide();

                    $('#d_name').text(name);
                    $('#d_csname').text(name_cs);
                    $('#d_whatsapp').text(wa);
                    $('#d_email').text(email);
                    $('#d_comment').text(comment);
                    $('#d_nominal').text('<?php echo $show_currency; ?>'+nominal);

                    
                    $('#whatsapp_'+id_donasi).text(wa);
                    $('#nominal_'+id_donasi).text('<?php echo $show_currency; ?>'+nominal);
                    $('#cs_'+id_donasi).text(name_cs);

                    if(userid!='0'){
                        $('#name_'+id_donasi).html('<a href="<?php echo get_site_url();?>/profile/'+user_randid+'" target="_blank">'+name+'</a>');
                    }else{
                        $('#name_'+id_donasi).html('<a href="javascript:;" target="_self">'+name+'</a>');
                    }

                    if ($("#edit_data_donasi .select2").hasClass("opt_active")) {
                        if(pp!=''){
                            var pp = $('.select2.usernya_select').find("option:selected").attr("data-pp");
                            $('#pp_'+id_donasi).attr('src',pp);
                            $('#link_pp_'+id_donasi).attr("href", "<?php echo get_site_url();?>/profile/"+user_randid);
                        }else{
                            var pp = '<?php echo plugin_dir_url( __FILE__ ) . "../assets/images/pp.jpg"; ?>';
                            $('#pp_'+id_donasi).attr('src',pp);
                            $('#link_pp_'+id_donasi).attr("href", "javascript:;").attr("target", "_self");
                        }
                    }else{
                        var pp = '<?php echo plugin_dir_url( __FILE__ ) . "../assets/images/pp.jpg"; ?>';
                        $('#pp_'+id_donasi).attr('src',pp);
                        $('#link_pp_'+id_donasi).attr("href", "javascript:;").attr("target", "_self");
                    }

                    if(response=='success'){
                        $('.update_donasi_success').slideDown();

                        setTimeout(function() {
                            $('.update_donasi_success').slideUp('fast');
                        }, 4500);

                    }else{
                        $('.update_donasi_failed').slideDown();
                        setTimeout(function() {
                            $('.update_donasi_failed').slideUp('fast');
                        }, 4500);
                    }

                });

            });

            function dotToNumber(nStr){
                var a = nStr.split('.').join("");
                return parseInt(a);
            }

            function numberWithDot(x) {
                <?php if($currency=='MYR'){ ?>
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                <?php }else{ ?>
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                <?php } ?>
            }

            $(document).on('change', '.set_payment_status', function(e){
                var donasi_id = $(this).data('id');
                var invoice_id = $(this).data('invoiceid');
                var followup_status = <?php echo $text_received_status; ?>;

                if(this.checked) {
                    $('#payment_'+donasi_id+' span').text('Success');
                    $('#payment_'+donasi_id+'').addClass('received').removeClass('waiting');
                    var value_button = 1;
                }else{
                    $('#payment_'+donasi_id+' span').text('Waiting');
                    $('#payment_'+donasi_id+'').removeClass('received').addClass('waiting');
                    var value_button = 0;
                }

                var data_nya = [
                    donasi_id,
                    value_button
                ];
                var data = {
                    "action": "djafunction_set_payment",
                    "datanya": data_nya
                };
                jQuery.post(ajaxurl, data, function(response) {

                    var response_text = response.split("_");
                    response_info = response_text[0];
                    response_followup = response_text[1];

                    if(response_info=='success'){
                        if(value_button=='0'){
                            additional_text = 'ke status waiting payment';
                        }else{
                            additional_text = 'ke status received';
                        }
                        var message = "<b>"+invoice_id+"</b><br>Status payment berhasil diupdate "+additional_text+"!";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 4000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                        if(followup_status=='1' && value_button=='1'){
                            // redirect WA
                            var redirectWindow = window.open(response_followup, "_blank");
                            redirectWindow.location;
                        }
                    }else if(response_info=='wanotif'){
                        var message = "<b>"+invoice_id+"</b><br>Status payment berhasil diupdate dan pesan sudah dikirimkan melalui wanotif!";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 4000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else if(response_info=='wanotiffalse'){
                        var message = "<b>"+invoice_id+"</b><br>Status payment berhasil diupdate namun pesan gagal dikirimkan melalui wanotif! Cek kembali no whatsapp donatur, tidak boleh kosong.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 4000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }else{

                        
                    }
                });

            });


            // Initialize the plugin
            $(document).on('click', '.detail_donasi', function(e){

                if($(this).hasClass("img_confirmation")){
                    return false;
                }
                
                Swal.fire({
                      title: '<strong id="popup_title">Data Detail</strong>',
                      icon: false,
                      html:
                        '<div id="data_box"><div class="spinner-border text-primary" role="status"></div></div>',
                      showCloseButton: true,
                      showClass: {
                        popup: 'animate__animated animate__zoomIn animate__faster'
                      },
                      hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                      }
                    })

                var donasi_id = $(this).data('id');
                var data_nya = [
                    donasi_id
                ];

                var data = {
                    "action": "djafunction_get_donasi",
                    "datanya": data_nya
                };
                
                jQuery.post(ajaxurl, data, function(response) {
                    $('#data_box').html(response);
                    // $('.select2').show();
                });
            });

            // Initialize the plugin
            $(document).on('click', '.detail_donasi', function(e){

                if($(this).hasClass("img_confirmation")){
                    Swal.fire({
                          title: '<strong id="popup_title">Data Konfirmasi</strong>',
                          icon: false,
                          html:
                            '<div id="data_box"><div class="spinner-border text-primary" role="status"></div></div>',
                          showCloseButton: true,
                          showClass: {
                            popup: 'animate__animated animate__zoomIn animate__faster'
                          },
                          hideClass: {
                            popup: 'animate__animated animate__fadeOutUp animate__faster'
                          }
                        })

                    var donasi_id = $(this).data('id');
                    var data_nya = [
                        donasi_id
                    ];

                    var data = {
                        "action": "djafunction_get_donasi_confirmation",
                        "datanya": data_nya
                    };
                    
                    jQuery.post(ajaxurl, data, function(response) {
                        $('#data_box').html(response);
                        $('.select2').show();
                    });
                }
            });

            // Initialize the plugin
            $(document).on('click', '.del_conf', function(e){
                var donasi_id = $(this).attr('data-id');
                var img_url = $(this).attr('data-img');
                var inv_id = $(this).attr('data-inv');

                swal.fire({
                  title: 'Anda ingin menghapus konfirmasi ini?',
                  text: "Data tidak bisa dikembalikan jika sudah dihapus!",
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, Hapus sekarang!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    
                    var data_nya = [
                        donasi_id,
                        img_url,
                        inv_id
                    ];

                    var data = {
                        "action": "djafunction_del_confirmation",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            $('#donasi_'+donasi_id+' .img_confirmation').slideUp();

                            swal.fire(
                              'Delete success!',
                              'Data konfirmasi berhasil dihapus.',
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
            

        });



        $(document).on("click", ".del_donasi", function(e) {
            
            var donasi_id = $(this).attr('data-id');

            $('#donasi_'+donasi_id).css({"background":"linear-gradient(90deg, rgb(255, 238, 242) 0%, rgb(250, 250, 250) 100%)"});

            swal.fire({
              title: 'Anda ingin menghapus donasi ini?',
              text: "Data akan dimasukkan ke dalam Trash!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Lanjutkan!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    donasi_id
                ];

                var data = {
                    "action": "djafunction_del_donasi",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        $('#donasi_'+donasi_id).slideUp();
                        var message = "Successfully deleted.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Deleted Failed!";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    
                });
              }else{
                $('tbody tr').css({"background":"#ffffff"});
              }
            })

        });

        $(function() {
            $('tbody tr').hover(function() { 
                $(this).find('.box-button').removeClass("button-hide"); 
            }, function() { 
                $(this).find('.box-button').addClass("button-hide");
            });
        });

        $(document).on("click", ".img_confirmation", function(e) {
            $(this).addClass('status_check');
        });


        $(document).on("click", ".btn-followup", function(e) {

            var donasi_id = $(this).data('id');
            var followup_number = $(this).data('followup');

            $('.followup'+followup_number).find(".spinner-border").remove();
            $(this).find("span").before('<div class="spinner-border spinner-border-sm" role="status"></div>');
            $(this).find("i").hide();
            $(this).addClass('sent');

            var data_nya = [
                donasi_id,
                followup_number
            ];

            var data = {
                "action": "djafunction_send_wa",
                "datanya": data_nya
            };
            
            jQuery.post(ajaxurl, data, function(response) {
                
                if(response.length<=7){
                    if(response=='success'){
                        // alert('success');

                        var message = "Followup "+followup_number+" - Message was sent to whatsapp.";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);

                    }else{
                        var message = "Send message failed.";
                        var status = "danger";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 3000;     /* 5000 here means the alert message disappears after 5 seconds. */
                        createAlert(message, status, timeout);
                    }
                    $('.followup'+followup_number).find("i").show();
                    $('.followup'+followup_number).find(".spinner-border").remove();
                }else{
                    // redirect WA
                    var redirectWindow = window.open(response, "_blank");
                    redirectWindow.location;
                }
                

            });

        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>


    <?php } // end of opt data-order ?> 

    <?php
}