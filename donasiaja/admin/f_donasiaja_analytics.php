<?php

function donasiaja_data_analytics() {
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


        if(isset($_GET['action'])){
            if($_GET['action']=="settings"){
                $settings = true;
            }else{
                $settings = false;
            }
        }else{
            $settings = false;
        }

        // category
        $row2 = $wpdb->get_results('SELECT * from '.$table_name2.' ');     

        // Settings
        $query_settings = $wpdb->get_results('SELECT data from '.$table_name5.' where type="form_setting" or type="btn_followup" or type="text_f1" or type="text_f2" or type="text_f3" or type="text_f4" or type="text_f5" or type="text_received" or type="text_received_status" or type="app_name" or type="wanotif_on_dashboard"  ORDER BY id ASC');
        $form_setting = $query_settings[0]->data;
        $btn_followup = $query_settings[1]->data;
        $text_f1 = $query_settings[2]->data;
        $text_f2 = $query_settings[3]->data;
        $text_f3 = $query_settings[4]->data;
        $text_f4 = $query_settings[5]->data;
        $text_f5 = $query_settings[6]->data;
        $text_received = $query_settings[7]->data;
        $text_received_status = $query_settings[8]->data;
        $app_name = $query_settings[9]->data;
        $wanotif_on_dashboard = $query_settings[10]->data;

        $user_info = get_userdata($id_login);
        $first_name = $user_info->first_name;
        $last_name = $user_info->last_name;
        $fullname = $first_name.' '.$last_name;
        
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
	/* .custom-switch .custom-control-label::before {
		border-radius: 1rem;
		height: 16px !important;
	} */
    .notice, #message, #dolly, #wpbody-content .promotion {
        display:none;
    }
    #by_date_list {
        min-width: 140px !important;
    }
    #by_date_list a {
        text-align: right;
    }
    #by_date_list {
        margin-left: -78px !important;
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
        max-width: 540px;
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
        margin-top: 10px;
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
            margin-top: 130px;
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

            <!-- Page Content-->
            <div class="page-content-tab">

                <div class="container-fluid">    

                    <?php 

                        $date_title = '';
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

                        if(isset($_GET['id'])){
                            $c_id = $_GET['id'];

                            $get_title = $wpdb->get_results("SELECT * from $table_name where campaign_id = '$c_id'");
                            if ($get_title==null) {
                               $titlenya = 'Show All'.$date_title;
                            }else{
                                $titlenya = $get_title[0]->title.$date_title;
                            }
                            
                        }else{
                            $c_id = 'all';
                            $titlenya = 'Show All'.$date_title;
                        }
                    
                    ?>


                    
                    <div class="row col-header-title"> 

                        <div class="col-sm-12" style="margin-bottom: 10px;">
                            <?php 
                            $c_license = c_expired_license();
                            echo $c_license;
                            ?>
                            <div class="page-title-box" style="padding-top: 10px;">

                                <div class="float-right" style="margin-left: 80px;">
                                    <input type="text" class="form-control input_daterangepicker" name="dates" style="width: 0;margin: 0;padding: 0;position:absolute;border: 0 !important;font-size: 0;min-height: 0 !important;">
                                    <select id="campaign_select" class="select2 form-control-primary mb-3 custom-select campaign_select" style="width: 240px;margin-bottom: 20px !important;">
                                        <option value="show_all">Show All</option>
                                        
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



                                        <div id="by_date_box" class="btn-group ml-1">
                                            <button id="by_date_button" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                <i class="fas fa-calendar-alt"></i><i class="mdi mdi-chevron-down ml-1"></i>
                                            </button>
                                            
                                            <div id="by_date_list" class="dropdown-menu" style="<?php if($role=='donatur' || $role=='cs'){echo 'margin-left:-108px;}';}?>">

                                                <?php 
                                                if(isset($_GET['id'])){
                                                    $idnya = $_GET['id'];
                                                }else{
                                                    $idnya = 'all';
                                                }

                                                $date_filter_title = isset($_GET['date']) ? $_GET['date'] : 'all';
                                                
                                                ?>

                                                <?php if(isset($_GET['id'])){ ?>
                                                    <a class="dropdown-item <?php if($date_filter_title=='today'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=today';?>">Today</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='yesterday'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=yesterday';?>">Yesterday</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='7lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=7lastdays';?>">7 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='30lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=30lastdays';?>">30 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thismonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=thismonth';?>">This Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastmonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=lastmonth';?>">Last Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thisyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=thisyear';?>">This Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=lastyear';?>">Last Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last2years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=last2years';?>">Last 2 Years</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last3years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=last3years';?>">Last 3 Years</a>
                                                    <a class="dropdown-item daterange <?php if($date_filter_title=='daterange'){echo'active';}?>" href="javascript:;" data-link="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').$idnya.'&date=daterange';?>">Date Range</a>
                                                    <a class="dropdown-item <?php if($date_filter_title==null || $date_filter_title=='all'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=').'&date=all';?>">All</a>
                                                <?php } else { ?>
                                                    <a class="dropdown-item <?php if($date_filter_title=='today'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=today';?>">Today</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='yesterday'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=yesterday';?>">Yesterday</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='7lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=7lastdays';?>">7 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='30lastdays'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=30lastdays';?>">30 Last days</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thismonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=thismonth';?>">This Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastmonth'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=lastmonth';?>">Last Month</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='thisyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=thisyear';?>">This Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='lastyear'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=lastyear';?>">Last Year</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last2years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=last2years';?>">Last 2 Years</a>
                                                    <a class="dropdown-item <?php if($date_filter_title=='last3years'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=last3years';?>">Last 3 Years</a>
                                                    <a class="dropdown-item daterange <?php if($date_filter_title=='daterange'){echo'active';}?>" href="javascript:;" data-link="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=daterange';?>">Date Range</a>
                                                    <a class="dropdown-item <?php if($date_filter_title==null || $date_filter_title=='all'){echo'active';}?>" href="<?php echo admin_url('admin.php?page=donasiaja_data_analytics').'&date=all';?>">All</a>
                                                <?php } ?>
                                            </div>
                                        </div>

                                    </div>
                                    


                                </div>
                                
                                <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-document" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;"><?php echo $titlenya; ?></div></h4>
                            </div><!--end page-title-box-->
                        </div>

                        

                    </div><!--end row-->

                    <!-- // disini -->
                    <div class="row">
                        <div class="col-lg-12">  

                            <div class="row">
                                <div class="col-lg-3">
                                    <div class="card" style="border-bottom: 4px #2ddab5 solid;">
                                        <div class="card-body">
                                            <h5 class="mt-0 mb-2 header-title" style="color:#2ddab5">Success</h5>
                                            <div class="media">
                                               <div class="media-body align-self-center text-truncate ml-3" style="text-align:left;margin-left:0 !important;">
                                                    <h2 id="jumlahSuccess" class="font-24 m-0 font-weight-semibold">
                                                        ...
                                                    </h2> 
                                                    <p class="text-muted mb-0 font-13" style="color:#303e67 !important;font-weight:bold;"><span id="totalSuccessNominal">...</span></p>
                                                </div><!--end media-body-->
                                            </div><!--end media-->
                                        </div><!--end card-body-->                                        
                                    </div><!--end card-->                                      
                                </div><!-- end col-->
                                <div class="col-lg-3">
                                    <div class="card" style="border-bottom: 4px #f20988 solid;">
                                        <div class="card-body">
                                            <h5 class="mt-0 mb-2 header-title" style="color:#f20988;">Waiting</h5>
                                            <div class="media">
                                                 <div class="media-body align-self-center text-truncate ml-3" style="text-align:left;margin-left:0 !important;">
                                                    <h2 id="jumlahWaiting" class="font-24 m-0 font-weight-semibold">
                                                        ...
                                                    </h2> 
                                                    <p class="text-muted mb-0 font-13" style="color:#303e67 !important;font-weight:bold;"><span id="totalWaitingNominal">...</span></p>
                                                </div><!--end media-body-->
                                            </div><!--end media-->
                                        </div><!--end card-body-->                                        
                                    </div><!--end card-->                                      
                                </div><!-- end col-->
                                <div class="col-lg-3">
                                    <div class="card" style="border-bottom: 4px #7680ff solid;">
                                        <div class="card-body">
                                            <h5 class="mt-0 mb-2 header-title text-primary" style="color:#303e67 !important;">Total</h5>
                                            <div class="media">
                                                <div class="media-body align-self-center text-truncate ml-3" style="text-align:left;margin-left:0 !important;">
                                                    <h2 class="font-24 m-0 font-weight-semibold">
                                                        <span id="total_donasinya">...</span>
                                                    </h2> 
                                                    <p class="text-muted mb-0 font-13" style="color:#303e67 !important;">All Data</p>
                                                </div><!--end media-body-->
                                            </div><!--end media-->
                                        </div><!--end card-body-->                                        
                                    </div><!--end card-->                                      
                                </div><!-- end col-->  
                                <div class="col-lg-3">
                                    <div class="card" style="border-bottom: 4px #7680ff solid;">
                                        <div class="card-body">
                                            <h5 class="mt-0 mb-2 header-title text-primary" style="color:#303e67 !important;">Closing Ratio</h5>
                                            <div class="media">
                                                <div class="media-body align-self-center text-truncate ml-3" style="text-align:left;margin-left:0 !important;">
                                                    <h2 class="font-24 m-0 font-weight-semibold">
                                                        <span id="closingRatio">...</span>
                                                    </h2> 
                                                    <p class="text-muted mb-0 font-13" style="color:#303e67 !important;">Success <span class="jumlahSuccess" style="font-weight:bold;"></span> from <span class="total_donasinya" style="font-weight:bold;"></span> data</p>
                                                </div><!--end media-body-->
                                            </div><!--end media-->
                                        </div><!--end card-body-->                                        
                                    </div><!--end card-->                                      
                                </div><!-- end col-->                                                       
                            </div><!--end row-->    


                        </div><!--end col-->
                    </div>


                    <div class="row">
                        <div class="col-lg-12">  
                            <div class="row">

                                <div class="col-lg-6">                            
                                    <div class="card" style="max-width: initial;min-height: 350px;">
                                        <div class="card-body">
                                            <h4 class="header-title mt-0">Devices</h4>
                                            <div class="row">
                                                <div class="col-6">

                                                <div class="happiness-score" style="display: inline;top: 32%;">
                                                <h2 class="mb-1">User</h2>
                                                    <p class="mb-0 text-uppercase">Devices</p>
                                                </div> 
                                                <div id="access_device" class="apex-charts my-3"></div>

                                                </div><!--end col-->
                                                <div class="col-6 align-self-center">
                                                    <div class="table-responsive">
                                                        <table class="table border-dashed mb-0">
                                                            <thead class="thead-light">
                                                            <tr>
                                                                <th class="border-bottom-0">Performance Type</th>
                                                                <th class="border-bottom-0 text-right">Score</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            <tr>
                                                                <th class="border-top-0 text-dark" scope="row" style="padding: 5px;"><i class="dripicons-device-mobile text-success font-24 mr-2 align-middle"></i>Mobile</th>
                                                                <td class="border-top-0 text-right"><span id="jumlah_mobile">...</span></td>
                                                            </tr>
                                                            <tr>
                                                                <th class="text-dark" scope="row" style="padding: 5px;"><i class="dripicons-device-desktop text-primary font-24 mr-2 align-middle"></i>Desktop</th>
                                                                <td class="text-right"><span id="jumlah_desktop">...</span></td>                                                 
                                                            </tr>
                                                            
                                                            </tbody>
                                                        </table><!--end /table-->
                                                    </div>
                                                </div><!--end col-->
                                            </div> <!--end row--> 
                                        </div><!--end card-body-->
                                    </div><!--end card-->                            
                                </div><!--end col-->

                                <div class="col-lg-6">                            
                                    <div class="card" style="max-width: initial;min-height: 350px;">
                                        <div class="card-body">
                                            <h4 class="header-title mt-0">UTM</h4>
                                            <div class="row">
                                                <div class="col-6">

                                                <div class="happiness-score" style="position: absolute;top: 75px;bottom: auto;">
                                                <h2 class="mb-1">UTM</h2>
                                                    <p class="mb-0 text-uppercase">Source</p>
                                                </div> 
                                                <div id="utm_data" class="apex-charts my-3"></div>

                                                </div><!--end col-->
                                                <div class="col-6 align-self-center">
                                                    <div class="table-responsive">
                                                        <table class="table border-dashed mb-0" id="table_utm">
                                                            <thead class="thead-light">
                                                            <tr>
                                                                <th class="border-bottom-0">Data</th>
                                                                <th class="border-bottom-0 text-right">Score</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            </tbody>
                                                        </table><!--end /table-->
                                                    </div>
                                                </div><!--end col-->
                                            </div> <!--end row--> 
                                        </div><!--end card-body-->
                                    </div><!--end card-->                            
                                </div><!--end col-->
                            
                            </div>
                        </div>
                    </div><!--end row-->
                    


                    <div class="row">
                        <div class="col-lg-12">  
                            
                            <div class="card" style="max-width:100%">

                                <div class="card-body">  
                                    <h4 class="header-title mt-0">Graphic - All Campaign</h4>
                                    
                                    <?php if($role=='administrator'){ ?> 
                                    <!-- <div class="float-right d-flex justify-content-between"> -->
                                    <div id="by_date_box2" class="btn-group ml-1" style="position: absolute;margin-top: -30px;right: 0;margin-right: 40px;">

                                            <button id="by_download_button" type="button" class="btn btn-sm btn-outline-primary waves-light waves-effect dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                <i class="dripicons-download"></i><i class="mdi mdi-chevron-down ml-1"></i> Download
                                            </button>
                                            <?php 
                                                if(isset($_GET['id'])){
                                                    $idnya = $_GET['id'];
                                                }else{
                                                    $idnya = 'all';
                                                }
                                            ?>
                                            <div id="by_download_list" class="dropdown-menu" style="display: none;">
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $idnya; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="waiting">Waiting</a>
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $idnya; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="success">Success</a>
                                                <a class="dropdown-item download_donasi" href="javascript:;" data-id="<?php echo $idnya; ?>" data-date="<?php echo $c_date; ?>" data-range="<?php echo $c_range; ?>" data-status="all">All</a>
                                            </div>

                                        </div>
                                    <!-- </div> -->
                                    <?php } ?>
                                    <div class="">
                                        <div id="Graphic_Status" class="apex-charts"></div>
                                    </div>  
                                </div><!--end card-body-->    

                            </div><!--end card-->    

                        </div><!--end col-->
                    </div>




                
                    <div class="row" style="display:none;">
                        <div class="col-12">
                            <div class="card  <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <h3 class="header-title mt-0">Data Donasi</h3>
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
                                                    <th>Donatur</th>
                                                    <th>Whatsapp</th>
                                                    <th style="width: 120px;">Donasi</th>
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

            #table_donasi{margin:0 auto;margin-top:10px;margin-bottom:20px}#table_donasi td{text-align:left;font-size:14px;padding:4px 7px}.inv{font-size:13px;background:#f1f5ff;padding:12px 10px;margin-top:-16px;margin-bottom:-16px}.title_donasi{font-size:18px;padding:0 30px}.swal2-popup{padding-bottom:40px!important;padding-top:30px!important;border-radius:12px;padding-left:0!important;padding-right:0!important}button.swal2-close{font-size:28px;margin-top:8px;margin-right:8px}.p_waiting{background:#e1345e}.box_table{padding:10px 20px}#table_donasi input[type=text]{display:none;width:60%}#edit_data_donasi{display:none}#edit_data_donasi .form-group{margin-bottom:5px}#errmsg,#errmsg2{display:none;position:absolute;right:0;margin-right:15px;margin-top:-40px;background:#ff4343;color:#fff;padding:3px 8px;border-radius:3px;font-size:9px}#edit_data_donasi input.form-control{padding-left:12px;padding-right:10px}#edit_data_donasi textarea.form-control{font-size:14px}.swal2-container.swal2-center.swal2-backdrop-show{z-index:99999}.select2-container--open{z-index:99999999999999!important}.show_campaign .select2-container--open{z-index:9999!important}.select2-container--default .select2-selection--single{background-color:#fff;height:32px;border:1px solid #c8d0e4;padding:0;font-size:13px;border-radius:4px;padding-left:4px}.select2-container--default .select2-selection--single .select2-selection__arrow{margin-right:5px}.select2-container--default .select2-selection--single .select2-selection__rendered{color:#7a839b}.data_usernya .select2-container{width:89%!important}.data_usernya .select2-container--default .select2-selection--single{height:45px!important;padding-top:8px;border-top-right-radius:0;border-bottom-right-radius:0}input#inp1{border-top-right-radius:0!important;border-bottom-right-radius:0!important}.data_usernya .select2-container--default .select2-selection--single .select2-selection__arrow{margin-top:8px}.select2-dropdown{border:1px solid #dcdee6}.select2-container--default .select2-selection--single .select2-selection__rendered{text-align:left}.select2-results__option{padding-left:10px;padding-right:10px}.select2-container--default .select2-search--dropdown .select2-search__field{padding-left:10px;padding-right:10px}.opt_hide{display:none}.select2.campaign_select .select2-container .select2-selection--single{border:1px solid #7887b5!important}.form_upload{padding:30px 60px 30px 60px}
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
            .col-header-title {
                margin-bottom: 90px !important;
            }
            .page-title-box .float-right.justify-content-between {
                left: auto;
                right: 0 !important;
                margin-top: 75px !important;
            }
            .select2.select2-container.select2-container--default {
                width: 82% !important;
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

        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/apexcharts/apexcharts.min.js"></script> 

        <script>

        jQuery(document).ready(function($){

            $( "#by_download_list" ).mouseleave(function() {
                $('#by_download_list').css({"display":"none"}).removeClass('show_list');
            }).mouseenter(function() {
                $('#by_download_list').css({"display":"inline"}).addClass('show_list');
            });
            $('#by_download_button').on('click', function(e){
                if($('#by_download_list').hasClass("show_list")){
                    $('#by_download_list').css({"display":"none"}).removeClass('show_list');
                }else{
                    $('#by_download_list').css({"display":"inline"}).addClass('show_list');
                }
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
                        action: 'dja_get_data_analytics',
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
                jumlah_desktop = parseInt(json.jumlahDesktop);
                jumlah_mobile = parseInt(json.jumlahMobile);

                
                data_graphic_title = json.dataGraphicTitle;
                data_graphic_success = json.dataGraphicSuccess;
                data_graphic_waiting = json.dataGraphicWaiting;

                $('.happiness-score').css({'display':'inline'});
                $('#jumlah_desktop').html(jumlah_desktop+'%');
                $('#jumlah_mobile').html(jumlah_mobile+'%');

                $('#totalDonasi').html(totalDonasi);
                $('#totalDonasiCS').html(totalDonasiCS);
                $('#jumlahDonasi').html(jumlahDonasi);
                $('#jumlahDonasiCS').html(jumlahDonasiCS);
                $('#jumlahDonasiTerkumpul').html(jumlahDonasiTerkumpul);
                $('#jumlahDonasiTerkumpulCS').html(jumlahDonasiTerkumpulCS);
                $('#konversi').html(konversi);
                $('#konversiCS').html(konversiCS);

                // tambahan
                $('#jumlahSuccess').html(json.jumlahSuccess);
                $('.jumlahSuccess').text(json.jumlahSuccess);
                $('#jumlahWaiting').html(json.jumlahWaiting);
                $('#totalSuccessNominal').html(json.totalSuccessNominal);
                $('#totalWaitingNominal').html(json.totalWaitingNominal);
                $('#closingRatio').html(json.konversi);

                $('#averageDonationAmount').html(json.averageDonationAmount);
                $('#averagePaymentDuration').html(json.averagePaymentDuration);

                $('#total_donasinya').html('<b>'+json.jumlahDonasi+'</b>');
                $('.total_donasinya').text(json.jumlahDonasi);

                // console.log(json.dataUtm.jumlah);
                // console.log(json.dataUtm.data);

                const utmData = json.dataUtm.data;

                // Loop through the array and display utm_source and total
                utmData.forEach(item => {
                    console.log(`UTM Source: ${item.utm_source}, Total: ${item.total}`);
                });

                const utmSources = json.dataUtm.data.map(item => item.utm_source);
                const utmTotal = json.dataUtm.data.map(item => item.total);

                const total = utmTotal.reduce((acc, val) => acc + Number(val), 0);

                // Hitung persentase dan bulatkan ke bilangan bulat
                // const percentages = utmTotal.map(val => Math.round((Number(val) / total) * 100));
                const percentages = utmTotal.map(val => Number((Number(val) / total * 100).toFixed(1)));


                console.log(utmTotal);

                console.log(percentages);

                const availableColors = [
                    "#A02C63",
                    "#E42B4C",
                    "#F2673B",
                    "#F8D95A",
                    "#009F99",
                    "#ECF0C9",
                    "#F6E27F",
                    "#F5A655",
                    "#F75C4C",
                    "#DFF2D6",
                    "#96D1B5",
                    "#4BA7B0",
                    "#536270",
                    "#504546",
                    "#F6455D",
                    "#F8A99D",
                    "#FFD5B5",
                    "#C5C2A6",
                    "#8CB5A2"
                ];

                // Fungsi untuk mengambil warna secara acak tanpa duplikasi
                const getRandomColors = (count) => {
                    let shuffled = [...availableColors].sort(() => 0.5 - Math.random()); // Acak urutan warna
                    return shuffled.slice(0, count); // Ambil sejumlah yang dibutuhkan
                };

                // Ambil warna random sesuai jumlah `utmSources`
                const colors = getRandomColors(utmSources.length);

                // console.log(colors);

                // Hitung total keseluruhan
                const totalScore = utmData.reduce((acc, item) => acc + Number(item.total), 0);

                // Looping data dan buat elemen <tr>
                utmData.forEach((item, index) => {
                    // const percentage = Math.round((Number(item.total) / totalScore) * 100); // Hitung persentase
                    const percentage = ((Number(item.total) / totalScore) * 100).toFixed(1); // Hitung persentase dengan 1 angka di belakang koma
    
                    const color = colors[index]; // Ambil warna berdasarkan indeks

                    const row = `
                        <tr>
                            <th class="border-top-0 text-dark" scope="row" style="padding: 0;border-top: 1px dashed #eaf0f7 !important;">
                                <i class="mdi mdi-brightness-1 font-24 mr-2 align-middle" style="color:${color};"></i>
                                <span style="color:#36374c;">${item.utm_source}</span>
                            </th>
                            <td class="border-top-0 text-right" style="border-top: 1px dashed #eaf0f7 !important;">${item.total} ( ${percentage}% )</td>
                        </tr>
                    `;

                    // Tambahkan baris ke dalam tabel menggunakan jQuery
                    $('#table_utm tbody').append(row);
                });


                //UTM - Source
                var options2 = {
                  chart: {
                      height: 200,
                      type: 'donut',
                      dropShadow: {
                        enabled: true,
                        top: 10,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        blur: 2,
                        color: '#45404a2e',
                        opacity: 0.15
                    },
                  }, 
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '85%'
                      }
                    }
                  },
                  dataLabels: {
                    enabled: false,
                  }, 
                  stroke: {
                    show: true,
                    width: 2,
                    colors: ['transparent']
                  },
                  series: percentages,
                  legend: {
                      show: false,
                      position: 'bottom',
                      horizontalAlign: 'center',
                      verticalAlign: 'middle',
                      floating: false,
                      fontSize: '14px',
                      offsetX: 0,
                      offsetY: -13
                  },
                  labels: utmSources,
                  colors: colors,
                 
                  responsive: [{
                      breakpoint: 600,
                      options: {
                        plotOptions: {
                            donut: {
                              customScale: 0.2
                            }
                          },        
                          chart: {
                              height: 240
                          },
                          legend: {
                              show: false
                          },
                      }
                  }],

                  tooltip: {
                    y: {
                        formatter: function (val) {
                            return   val + " %"
                        }
                    }
                  }
                  
                }


                var chart2 = new ApexCharts(
                  document.querySelector("#utm_data"),
                  options2
                );

                chart2.render();



                //Device-widget
                var options = {
                  chart: {
                      height: 200,
                      type: 'donut',
                      dropShadow: {
                        enabled: true,
                        top: 10,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        blur: 2,
                        color: '#45404a2e',
                        opacity: 0.15
                    },
                  }, 
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '85%'
                      }
                    }
                  },
                  dataLabels: {
                    enabled: false,
                  }, 
                  stroke: {
                    show: true,
                    width: 2,
                    colors: ['transparent']
                  },
                  series: [jumlah_mobile, jumlah_desktop],
                  legend: {
                      show: false,
                      position: 'bottom',
                      horizontalAlign: 'center',
                      verticalAlign: 'middle',
                      floating: false,
                      fontSize: '14px',
                      offsetX: 0,
                      offsetY: -13
                  },
                  labels: [ "Mobile", "Desktop"],
                  colors: ["#1ccab8", "#506ee4"],
                 
                  responsive: [{
                      breakpoint: 600,
                      options: {
                        plotOptions: {
                            donut: {
                              customScale: 0.2
                            }
                          },        
                          chart: {
                              height: 240
                          },
                          legend: {
                              show: false
                          },
                      }
                  }],

                  tooltip: {
                    y: {
                        formatter: function (val) {
                            return   val + " %"
                        }
                    }
                  }
                  
                }

                var chart = new ApexCharts(
                  document.querySelector("#access_device"),
                  options
                );

                chart.render();


                // graphic
                var options = {
                  chart: {
                    height: 350,
                    type: 'area',
                    dropShadow: {
                      enabled: true,
                      top: 12,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      blur: 2,
                      color: '#45404a2e',
                      opacity: 0.35
                    },
                    toolbar: {
                      show: false
                    },
                  },
                  colors: ['#1CCAB8', '#fd3c97'], // #EF4D56 // fd3c97
                  dataLabels: {
                      enabled: false
                  },
                  markers: {
                    discrete: [{
                    seriesIndex: 0,
                    dataPointIndex: 7,
                    fillColor: '#000',
                    strokeColor: '#000',
                    size: 5
                  }, {
                      seriesIndex: 2,
                      dataPointIndex: 11,
                      fillColor: '#000',
                      strokeColor: '#000',
                      size: 4
                    }]
                  },
                  
                  stroke: {
                      show: true,
                      curve: 'smooth',
                      width: 2,
                      lineCap: 'square'
                  },
                  series: [{
                      name: 'Success',
                      data: data_graphic_success
                  }, {
                      name: 'Waiting',
                      data: data_graphic_waiting
                  }],
                  labels: data_graphic_title,
                  
                  yaxis: {
                    labels: {      
                      offsetX: -12,
                      offsetY: 0,      
                    }
                  },
                  grid: {
                    borderColor: '#e0e6ed',
                    strokeDashArray: 5,
                    xaxis: {
                        lines: {
                            show: true
                        }
                    },   
                    yaxis: {
                        lines: {
                            show: false,
                        }
                    },
                  }, 
                  legend: {
                   show: false
                  },
                  tooltip: {
                    marker: {
                      show: true,
                    },
                    x: {
                      show: false,
                    }
                  },
                  fill: {
                      type:"gradient",
                      gradient: {
                          type: "vertical",
                          shadeIntensity: 1,
                          inverseColors: !1,
                          opacityFrom: .28,
                          opacityTo: .05,
                          stops: [45, 100]
                      }
                  },
                  responsive: [{
                    breakpoint: 575,    
                  }]
                };






                var chart = new ApexCharts(document.querySelector("#Graphic_Status"), options);
                chart.render();

            });

            $('.select2').select2();

            $(document.body).on("change",".campaign_select",function(){
                var c_id = (this.value);
                if(c_id=='show_all'){
                    var url = "<?php echo admin_url('admin.php?page=donasiaja_data_analytics');?>";
                }else{
                    var url = "<?php echo admin_url('admin.php?page=donasiaja_data_analytics&id=');?>"+c_id;
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
                    $('#by_date_list').css({"display":"inline","margin-left": "-109px"}).addClass('show_list');
                }
            });

            $( "#by_date_list" ).mouseleave(function() {
                $('#by_date_list').css({"display":"none"}).removeClass('show_list');
            }).mouseenter(function() {
                $('#by_date_list').css({"display":"inline"}).addClass('show_list');
            });


            function dotToNumber(nStr){
                var a = nStr.split('.').join("");
                return parseInt(a);
            }



        });






        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};


    </script>



    <?php
}