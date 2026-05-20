<?php

function donasiaja_data_shortcodes() {
    ?>
    <?php 
        global $wpdb;
        $table_name = $wpdb->prefix . "dja_shortcode";
        $table_name2 = $wpdb->prefix . "dja_category";
        $table_name3 = $wpdb->prefix . "dja_campaign";
        $table_name4 = $wpdb->prefix . "dja_settings";

        donasiaja_global_vars();
        $plugin_license = strtoupper($GLOBALS['donasiaja_vars']['plugin_license']);

        // ROLE
        $cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
        $roles = array_keys((array)$cap);
        $role = $roles[0];

        $id_login = wp_get_current_user()->ID;

        if(isset($_GET['action'])){
            if($_GET['action']=="create"){
                $info_update = false;
                $edit = false;
                $create = true;
            }elseif($_GET['action']=="edit"){
                // check the campaign is exist
                $check = $wpdb->get_results('SELECT * from '.$table_name.' where s_id="'.$_GET['id'].'"');
                if($check==null){
                    $info_update = false;
                    $edit = false;
                    $create = false;
                }else{

                    // admin bisa liat semua campaign dan update
                    $info_update = false;
                    $edit = true;
                    $create = false;
                    
                }
                
            }else{
                $info_update = false;
                $edit = false;
                $create = false;
            }
        }else{
            $info_update = false;
            $edit = false;
            $create = false;
        }


        // category
        $row2 = $wpdb->get_results('SELECT * from '.$table_name2.' ');  

        // Settings
        $query_settings = $wpdb->get_results('SELECT data from '.$table_name4.' where type="app_name" ORDER BY id ASC');
        $app_name = $query_settings[0]->data;  

        // Currency
        $query_currency = $wpdb->get_results('SELECT data from '.$table_name4.' where type="currency"  ORDER BY id ASC');
        $currency = $query_currency[0]->data;
        $lang = get_data_lang($currency);
        $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
        
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

    <!-- jQuery  -->
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery.min.js"></script>
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>assets/js/jquery-ui.min.js"></script>
    <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/select2/select2.min.js"></script>


    <?php 

    // wp_enqueue_script('jquery');
    // This will enqueue the Media Uploader script
    wp_enqueue_media();
        
    ?>

    <style>
    .row [class^="col"] {
        margin:0;
    }
    .notice, #message, #dolly, #wpbody-content .promotion {
        display:none;
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

    body {
        background: #f6faff;
    }
    .radio label {
      padding-left: 4px;
    }
    .update-nag {
        display: none;
    }
    .hide-loading {
        display: none;
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
        font-size: 13px;
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
        background: #1CB65D;
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
        background: #7680FF;
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
    .custom-switch .custom-control-label::after {
        background-color: #d8204c;
    }

    .select2-container--default .select2-selection--multiple {
        border-color: #e5eaf0;
        min-height: 40px;
    }
    .select2-container--default .select2-search--inline .select2-search__field {
        padding-left: 5px;
        padding-top: 8px;
    }
    .wp-core-ui select {
        min-height: 48px;
    }
    .select2-container--default .select2-selection--multiple .select2-selection__choice {
        background-color: #7680ff;
        border: 1px solid #7680ff;
    }
    .select2-container--default .select2-selection--multiple .select2-selection__choice__remove {
        color: #ffbfab;
    }
    .select2-container--default .select2-selection--multiple .select2-selection__choice {
        margin-top: 10px;
        padding: 5px 10px;
    }
    .select2-container--default.select2-container--focus .select2-selection--multiple {
        border: solid #cfd9e6 1px;
    }
    .select2-container--open .select2-dropdown--below {
        border-color: #e5eaf0 !important;
    }
    .select2-container--default .select2-selection--multiple .select2-selection__rendered {
        padding-left: 10px;
    }
    .shortcode_on_table {
        float: left;border:1px solid #eaf0f9;padding: .375rem .75rem;font-size: .75rem;line-height: 1.8;border-radius: .25rem;font-weight: bold;background: #f6faff;color: #5d68ec;border: 1px solid #b1b7ff;cursor:pointer;
    }
    .shortcode_on_table:hover {
        background: #fff;
        cursor: pointer;
        -webkit-transition: all 200ms ease-in;
        -webkit-transform: scale(1.02);
        -ms-transition: all 200ms ease-in;
        -ms-transform: scale(1.02);   
        -moz-transition: all 200ms ease-in;
        -moz-transform: scale(1.02);
        transition: all 200ms ease-in;
        transform: scale(1.02);
      -webkit-box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        transition: border .2s linear, transform .2s linear, background-color .2s linear, box-shadow .2s linear, opacity .2s linear, -webkit-transform .2s linear, -webkit-box-shadow .2s linear;
    }
    .shortcode_on_edit {
        float: left;
        padding: 1rem 3rem;
        font-size: 1rem;
        line-height: 1.8;border-radius: .25rem;font-weight: bold;margin-bottom: 20px;background: #f6faff;color: #7680ff;border: 1px solid #bbc0ff;text-align: center;position: absolute;right: 0;margin-top: -60px;margin-right: 20px;
        -webkit-box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }
    .shortcode_on_edit:hover {
        background: #fff;
        cursor: pointer;
        -webkit-transition: all 200ms ease-in;
        -webkit-transform: scale(1.02);
        -ms-transition: all 200ms ease-in;
        -ms-transform: scale(1.02);   
        -moz-transition: all 200ms ease-in;
        -moz-transform: scale(1.02);
        transition: all 200ms ease-in;
        transform: scale(1.02);
        -webkit-box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        transition: border .2s linear, transform .2s linear, background-color .2s linear, box-shadow .2s linear, opacity .2s linear, -webkit-transform .2s linear, -webkit-box-shadow .2s linear;

    }
    .select2-container--default .select2-results__option[aria-selected="true"] {
        background-color: #cdd9e9;
    }
    #type_form input[type="radio"]:checked + label::before {
        color: #82878c;
        width: 100%;
        height: 148%;
        border-radius: 4px;
        background: #eff0ff;
    }
    #type_form .radio-primary input[type="radio"] + label::after {
        border: none;
        content: "";
    }
    #type_form .radio-primary input[type="radio"]:checked + label::after {
        width: 0;
    }
    .radio label::before {
        width: 100%;
        height: 148%;
        border-radius: 4px;
        border-color: #fff;
        background: transparent;
    }

    .radio-primary input[type="radio"]:checked + label::before {
        background: #7680ff26;
    }
    .radio input[type="radio"]:checked + label::after {
        -webkit-transform: scale(0, 0);
        transform: scale(0, 0);
    }
    .radio input[type="radio"] {
        display: none;
    }
    .radio label::before {
        margin-left: -8px;
        margin-top: -15px;
    }
    .type_form {
        margin-bottom: 30px;
    }
    .box_type_form {
        margin-top: 5px;
        margin-left: 0;
        margin-bottom: 30px;
    }
    .type_form_title_label {
        position: absolute;
        width: 85%;
        text-align: center;
        padding-top: 5px;
    }

    .select2-container--default .select2-selection--single {
        border-color: #e5eaf0;
        min-height: 48px;
        padding-top: 9px;
        padding-left: 5px;
        font-size: 13px;
        color: #656d9a;
    }
    .select2-container--default .select2-selection--single .select2-selection__arrow {
        margin-top: 8px;
        margin-right: 8px;
    }

    .card.profile-card:hover {
        cursor: grab !important;
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

    .thumb-campaign {
        display: inherit !important;
        height: 18px;
        width: 25px;
        margin-right: 10px !important;
        border-radius: 2px;
    }


    .box_type_form .form-check-inline.section-1 {
        margin-left: 8px;
    }
    .box_type_form label {
      margin-left: 10%;
    }

    .box_type_form .radio-primary input[type="radio"]:checked + label::before {
        padding-bottom: 70% !important;
    }

    @media only screen and (max-width:1120px) {
        .box_type_form .form-check-inline.section-3 {
            margin-left: 8px;
        }
        .box_type_form .form-check-inline {
            width: 45% !important;
            margin-bottom: 80px;
        }
    }

    @media only screen and (max-width:767px) {
        .page-title-box .breadcrumb {
            display: inline-flex !important;
            width: 100% !important;
        }
    }


    @media only screen and (max-width:480px) {
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

        .col-sm-12.text-left.dja_label, .col-sm-12.text-left.dja_label button{
            width: 100%;
        }
        .col-name {
            margin-top: 50px;
        }
        .shortcode_on_edit {
            padding: 1rem 1rem;
            margin-top: 0px;
        }
        .radio label::before {
          margin-left: 0px;
          margin-top: -6px;
        }
        .type_form_title_label {
            padding-top: 5px;
        }
        #s_button_text_box {
            margin-top: -30px;
        }
        .box_type_form label img {
            margin-left: 6%;
        }

    }

    
    </style>

    <?php check_license(); ?>

    <?php if($plugin_license=='PRO') {} elseif($plugin_license=='ULTIMATE') {}else{ ?>
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
    <?php wp_die(); } ?>
    
    <?php if($info_update==true){ ?>


        <?php 

        $campaign_id = $_GET['id'];
        $row = $wpdb->get_results('SELECT * from '.$table_name.' where campaign_id="'.$campaign_id.'"')[0];

        $info_updatenya = $wpdb->get_results('SELECT * from '.$table_name3.' where campaign_id="'.$campaign_id.'" ORDER BY id DESC');

        if(isset($_GET['infoid'])){
            $infoid = $_GET['infoid'];
            if($role=='donatur'){
                $detail_update = $wpdb->get_results('SELECT * from '.$table_name3.' where campaign_id="'.$campaign_id.'" and id="'.$infoid.'" user_id="'.$id_login.'" ');
            }else{
                $detail_update = $wpdb->get_results('SELECT * from '.$table_name3.' where campaign_id="'.$campaign_id.'" and id="'.$infoid.'"');
            }
            if($detail_update!=null){
                $title = $detail_update[0]->title;
                $campaignid = $detail_update[0]->campaign_id;
                $infoid = $detail_update[0]->id;
                $infonya = $detail_update[0]->information;
                $lanjut_update = true;
            }else{
                $lanjut_update = false;
            }
        }else{
            $title = '';
            $campaignid = '';
            $infoid = '';
            $infonya = '';
        }

        ?>
        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/tinymce/tinymce.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <script type="text/javascript">

        $(document).on("click", ".f_edit", function(e) {
            var link = $(this).attr('data-link');
            window.open(link,"_self");
        });

        $(document).on("click", "#view_info", function(e) {
            var link = $(this).attr('data-link');
            window.open(link,"_blank");
        });


        jQuery(document).ready(function($){

            if($("#information").length > 0){
              tinymce.init({
                  selector: "textarea#information",
                  theme: "modern",
                  height:300,
                  plugins: [
                      "advlist autolink link image lists charmap preview hr anchor pagebreak spellchecker",
                      "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
                      "save table contextmenu directionality template paste textcolor"
                  ],
                  toolbar: "oke | undo redo | styleselect | bold italic | alignleft aligncenter | bullist numlist | link image | print preview media fullpage | forecolor",
                  style_formats: [
                      {title: 'Header', block: 'h2', styles: {color: '#23374d'}},
                      {title: 'Bold text', inline: 'b', styles: {color: '#23374d'}},
                      {title: 'Paragraph', inline: 'p', styles: {color: '#23374d'}},
                      {title: 'Span', inline: 'span', styles: {color: '#23374d'}},
                  ],
                  init_instance_callback:function(editor){
                     editor.setContent('<?php echo trim(preg_replace('/\s+/', ' ', $infonya)); ?>');
                  },


              });
            }

            $('#dja_title').keyup(function() {
                var id = $(this).attr('data-id');
                var title = $(this).val();
                $('#'+id).text(title);
            });


            $(document).on("click", ".f_delete", function(e) {
                var id = $(this).attr('data-id');
                var campaign_id = $(this).attr('data-campaignid');

                swal.fire({
                  title: 'Anda yakin ingin menghapus info ini?',
                  text: "Data tidak bisa dikembalikan jika sudah dihapus!",
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, hapus saja!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    swal.fire(
                      'Deleted!',
                      'Your data has been deleted.',
                      'success'
                    );
                    
                    var data_nya = [
                        id,
                        campaign_id
                    ];

                    var data = {
                        "action": "djafunction_delete_campaign",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            $('#info-'+id).slideUp();
                        }
                    });
                  }
                })
            });

            $(document).on("click", "#mceu_10-button", function(e) {
                // alert(1);
                e.preventDefault();
                    var image = wp.media({ 
                        title: 'Upload Image',
                        multiple: false
                    }).open()
                    .on('select', function(e){
                        var uploaded_image = image.state().get('selection').first();
                        var image_url = uploaded_image.toJSON().url;

                        if(image_url.includes(".jpg")){
                            var imagenya = image_url.split(".jpg");
                            var new_image_url = imagenya[0]+"-520x280.jpg";
                        }
                        if(image_url.includes(".jpeg")){
                            var imagenya = image_url.split(".jpeg");
                            var new_image_url = imagenya[0]+"-520x280.jpeg";
                        }
                        if(image_url.includes(".png")){
                            var imagenya = image_url.split(".png");
                            var new_image_url = imagenya[0]+"-520x280.png";
                        }

                        $.get(new_image_url)
                        .done(function() { 
                            // Do something now you know the image exists.
                            tinyMCE.activeEditor.insertContent('<img src="'+new_image_url+'" />');

                        }).fail(function() { 
                            // Image doesn't exist - do something else.
                            tinyMCE.activeEditor.insertContent('<img src="'+image_url+'" />');
                        });
                        
                    });
                // return false;
            });



            $('#update_info').click(function(e) {
                
                var all_content = tinyMCE.get('information').getContent();

                var id = $('#dja_infoid').val();
                var campaign_id = $('#dja_campaignid').val();
                var title = $('#dja_title').val();
                var information = all_content;
                
                $(this).html('Update <span class="spinner-border text-light spinner-border-sm" role="status" style="position: absolute;margin-left: 5px;margin-top: 2px;"></span>');

                var data_nya = [
                    id,
                    campaign_id,
                    title,
                    information
                ];
                var data = {
                    "action": "djafunction_update_info",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='failed'){
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=') ?>"+campaign_id+"&infoid="+id+"&info=failed");
                    }else{
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=') ?>"+campaign_id+"&infoid="+response+"&info=success");
                    }
                    
                });
            });


            $('#add_new_info').click(function(e) {
                
               
                var user_id = $(this).attr("data-userid");
                var campaign_id = $(this).attr("data-campaignid");
                
                $(this).html('Add New Info <span class="spinner-border text-light spinner-border-sm" role="status" style="position: absolute;margin-left: 5px;margin-top: 2px;"></span>');

                var data_nya = [
                    user_id,
                    campaign_id
                ];
                var data = {
                    "action": "djafunction_add_update_info",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='failed'){
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=') ?>"+campaign_id);
                    }else{
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=') ?>"+campaign_id+"&infoid="+response);
                    }
                    
                });
            });

            setTimeout(function() {
                $('#donasiaja-alert').slideUp('fast');
            }, 4000);

        });
        </script>

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
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_campaign') ?>">Data Campaign</a></li>
                                        <li class="breadcrumb-item active">Info Update</li>
                                    </ol>
                                </div>
                                <h4 class="page-title">Info Update</h4>
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row">

                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-body" id="publish-section">
                                    <h4 class="mt-0 header-title">List Info Update</h4><br>
                                    <?php 
                                    if($row->publish_status=='1'){
                                        $campaign_url = get_site_url().'/campaign/';
                                    }else{
                                        $campaign_url = get_site_url().'/preview/';
                                    }
                                    ?>
                                    <?php
                                    foreach ($info_updatenya as $value) { 

                                    $readtime = new donasiaja_readtime();
                                    $time_update = $readtime->time_donation($value->created_at);

                                    ?>
                                        <div style="margin-bottom: 10px;" id="info-<?php echo $value->id; ?>">
                                            <div class="media" style="border: 1px solid #eaeaea;border-radius: 4px;padding: 10px 20px;padding-bottom: 15px;">
                                                <div class="media-body">
                                                    <div class="d-inline-block">
                                                        <h6 id="<?php echo $value->id; ?>" style="line-height: 1.5;"><?php echo $value->title; ?></h6>
                                                    </div>
                                                    <div>
                                                        <span><?php echo $time_update; ?></span>
                                                        <span class="f_delete" title="Delete Info" data-id="<?php echo $value->id; ?>" data-campaignid="<?php echo $campaign_id; ?>"><i class="fas fa-trash-alt text-danger"></i></span> 
                                                        <span class="f_edit" title="Edit Info" data-link="<?php echo admin_url('admin.php?page=donasiaja_data_campaign&action=info_update&id=').$campaign_id.'&infoid='.$value->id ?>"><i class="fas fa-pen text-info mr-2"></i></span>
                                                    </div>
                                                </div><!-- end media-body -->
                                            </div> <!--end media-->  
                                        </div>

                                    <?php }?>

                                    <div class="row" style="margin-top: 25px;margin-bottom: 20px;">
                                        
                                        <div class="col-sm-12 text-left">
                                            <button type="button" class="btn btn-outline-primary px-5 py-2 btn-block" data-link="<?php echo $campaign_url.$row->slug; ?>#info-update" id="view_info">View Info</button>
                                        </div>
                                        <div class="col-sm-12 text-left" style="margin-top: 10px;">
                                            <button type="button" class="btn btn-primary px-5 py-2 btn-block" id="add_new_info" data-userid="<?php echo $row->user_id; ?>" data-campaignid="<?php echo $campaign_id; ?>">Add New Info</button>
                                        </div>
                                    </div>

                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col--> 
                        
                        <div class="col-lg-8">
                            <div class="card" style="max-width: 100% !important;">
                                <?php if(isset($_GET['infoid']) and $lanjut_update==true){ ?>
                                    <div class="card-body">
                                        <h4 class="mt-0 header-title">Info</h4><br>
                                        <!-- <p class="text-muted mb-3">Custom stylr example.</p> -->
                                        <?php 
                                        if(isset($_GET['info'])){
                                            if($_GET['info']=="success"){
                                                echo '
                                                <div id="donasiaja-alert" class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                        <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                    </button>
                                                    Update info success.
                                                </div>
                                                ';
                                            }else{
                                                echo '
                                                <div id="donasiaja-alert" class="alert alert-danger alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                        <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                    </button>
                                                    Update info failed.
                                                </div>
                                                ';
                                            }
                                        }
                                        ?>
                                        <form class="">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <label for="username">Title / Judul</label>
                                                        <input type="text" class="form-control" id="dja_title" required="" value="<?php echo $title; ?>" data-id="<?php echo $infoid; ?>">
                                                        <input type="text" class="form-control" id="dja_infoid" value="<?php echo $infoid; ?>" style="display: none;">
                                                        <input type="text" class="form-control" id="dja_campaignid" value="<?php echo $campaignid; ?>" style="display: none;">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">

                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">                            
                                                    <div class="form-group">
                                                        <br>
                                                        <label for="message">Information / Keterangan</label>
                                                        <!-- <textarea class="form-control" rows="5" id="message"></textarea> -->
                                                        <textarea id="information" name="area"></textarea> 
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-md-12 text-left" style="margin-top: 30px;margin-bottom: 30px;">
                                                    
                                                    <button type="button" class="btn btn-primary" id="update_info" style="width: 240px;height: 45px;">Update</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div><!--end card-body-->

                                <?php }else{ ?>

                                    <p style="text-align: center;margin-top: 40px;"><img src="<?php echo plugin_dir_url( __FILE__ ) . '../assets/icons/loudspeaker.png'; ?>" style="width: 120px;"><br>
                                    </p>
                                    <p style="text-align: center;margin-bottom: 40px;">Donatur anda membutuhkan info terbaru dari penggalangan anda.<br>Silahkan update info terbaru.</p>

                                <?php } ?>
                                
                            </div><!--end card-->
                        </div><!--end col-->  

                        
                    </h2>
                </div>
            </div>
        </div>



    <?php }elseif($edit==true){ ?>


        <?php 

        $s_id = $_GET['id'];


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
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes') ?>">Data Shortcodes</a></li>
                                        <li class="breadcrumb-item active">Edit</li>
                                    </ol>
                                </div>
                                <h4 class="page-title">Edit Shortcode</h4>
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <?php 

                        $row = $wpdb->get_results('SELECT * from '.$table_name.' where s_id="'.$s_id.'"')[0];
                        $s_campaign = json_decode($row->s_campaign, true);

                        // Category
                        
                        $subarray = explode(',',$row->s_category);
                        $selected2 = '';
                        foreach($subarray as $value_idnya){
                            if($value_idnya=='0'){
                                $selected2 = 'selected=""';
                                break;
                            }
                        }


                        $option = '<option value="0" '.$selected2.'>All</option>';
                        foreach ($row2 as $key => $value) {

                            $selected = '';
                            foreach($subarray as $value_idnya){
                                if($value_idnya==$value->id){
                                    $selected = 'selected=""';
                                    break;
                                }
                            }
                            $option .= '<option value="'.$value->id.'" '.$selected.'>'.$value->category.'</option>';
                        }


                        $row_campaign = $wpdb->get_results("SELECT a.id, a.title, a.image_url, b.category from $table_name3 a 
                        left JOIN $table_name2 b ON b.id = a.category_id 
                        where publish_status='1' ");


                        $option_campaign = '';
                        foreach ($row_campaign as $value) {

                            $image_url = $value->image_url;
                            if($image_url==''){
                                $image_url = plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg';
                            }
                            $option_campaign .= '<option value="'.$value->id.'" data-id="'.$value->id.'" data-image="'.$image_url.'" data-category="'.$value->category.'">'.$value->title.'</option>';
                        }



                    ?>

                    <!-- end page title end breadcrumb -->
                    <div class="row"> 


                        <div class="col-lg-10">
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <!-- <h4 class="mt-0 header-title">Data Shortcode</h4><br> -->

                                    <?php 
                                        if(isset($_GET['info'])){
                                            if($_GET['info']=="add_success"){
                                                echo '
                                                <div id="donasiaja-alert" class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                        <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                    </button>
                                                    Add New Shortcode success.
                                                </div>
                                                ';
                                            }else if($_GET['info']=="success"){
                                                echo '
                                                <div id="donasiaja-alert" class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                        <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                    </button>
                                                    Update Shortcode success.
                                                </div>
                                                ';
                                            }else{
                                                echo '
                                                <div id="donasiaja-alert" class="alert alert-danger alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                        <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                    </button>
                                                    Update Shortcode failed.
                                                </div>
                                                ';
                                            }
                                        }
                                        ?>
                                    <!-- <p class="text-muted mb-3">Custom stylr example.</p> -->
                                    <form class="">
                                        <div class="row" style="margin-bottom: 20px;margin-top: 20px;">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <h5>Shortcode</h5><br>
                                                    <div title="Click to copy the shortcode" data-shortcode='[donasiaja id="<?php echo $_GET['id']; ?>"]' class="shortcode_on_edit copylink_shortcode">[donasiaja id="<?php echo $_GET['id'] ?>"]</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-8 col-name">
                                                <div class="form-group">
                                                    <label for="username">Name</label>
                                                    <input type="text" class="form-control" id="s_name" required="" value="<?php echo $row->s_name; ?>" style="padding-left: 10px;">
                                                    <input type="text" class="form-control" id="s_id" value="<?php echo $row->s_id; ?>" style="display: none;">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div id="type_form" class="col-md-12" style="margin-bottom: 35px;margin-top: 10px;">
                                                <label for="s_category" class="type_form">Type</label>
                                                <div class="form-group row box_type_form">
                                                    <div class="radio radio-primary form-check-inline section-1" style="width:23%;">
                                                        <input type="radio" id="inlineRadio1" value="list" name="s_style" <?php if($row->s_style=='list'){ echo 'checked=""'; }?>>
                                                        <label for="inlineRadio1"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-list2.jpg" style="position: inherit;width: 90%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">List</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-2" style="width:23%;">
                                                        <input type="radio" id="inlineRadio2" value="grid" name="s_style" <?php if($row->s_style=='grid'){ echo 'checked=""'; }?>>
                                                        <label for="inlineRadio2"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-grid2.jpg" style="position: inherit;width: 90%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Grid</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-3" style="width:23%;">
                                                        <input type="radio" id="inlineRadio3" value="slider" name="s_style" <?php if($row->s_style=='slider'){ echo 'checked=""'; }?>>
                                                        <label for="inlineRadio3"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-slider2.jpg" style="position: inherit;width: 90%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Slider</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-4" style="width:23%;">
                                                        <input type="radio" id="inlineRadio4" value="expandable" name="s_style" <?php if($row->s_style=='expandable'){ echo 'checked=""'; }?>>
                                                        <label for="inlineRadio4"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-expandable.jpg" style="position: inherit;width: 90%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Expandable</div></label>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="row">

                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <label class="mb-3">Data Load</label>

                                            <div style="padding-bottom: 5px;">
                                                <div class="form-check-inline my-1">
                                                    <div class="custom-control custom-radio">
                                                        <input type="radio" value="0" id="data_load1" name="data_load" class="custom-control-input" <?php if($row->s_data_load!='1'){echo'checked';}?>>
                                                        <label class="custom-control-label" for="data_load1">Automatic</label>
                                                    </div>
                                                </div>
                                                <div class="form-check-inline my-1">
                                                    <div class="custom-control custom-radio">
                                                        <input type="radio" value="1" id="data_load2" name="data_load" class="custom-control-input" <?php if($row->s_data_load=='1'){echo'checked';}?>>
                                                        <label class="custom-control-label" for="data_load2">Manual</label>
                                                    </div>
                                                </div>
                                            </div>

                                            </div> <!-- end col -->


                                        </div>

                                        <div class="row data_load_manual" <?php if($row->s_data_load=='1'){}else{echo'style="display:none;"';}?>>
                                            <div class="col-md-8">
                                                <label class="mb-3" style="margin-bottom: 0px !important;">Add Campaign</label>
                                            </div>
                                        </div>

                                        <div class="row data_load_manual" <?php if($row->s_data_load=='1'){}else{echo'style="display:none;"';}?>>
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                    <div id="box_add_campaign" class="row">
                                                        <?php 
                                                        if($s_campaign!=null){

                                                        foreach ($s_campaign['campaign'] as $value) {
                            
                                                            $idnya = $value;

                                                            $campaign_selected = $wpdb->get_results("SELECT a.id, a.title, a.image_url, b.category from $table_name3 a 
                                                            left JOIN $table_name2 b ON b.id = a.category_id 
                                                            where a.id='$idnya' ")[0];

                                                            $titlenya = $campaign_selected->title;

                                                            if(strlen($titlenya)>=45){
                                                                $titlenya = substr($titlenya, 0, 45).'...';
                                                            }

                                                            // echo $campaign_selected->title.'<br>';
                                                            // echo $campaign_selected->category.'<br>';

                                                            $rand = d_randomString(3);

                                                        ?>
                                                        <div class="col-lg-12" id="selected_campaign_<?php echo $idnya; ?>_<?php echo $rand; ?>">
                                                            <div class="card profile-card data_campaign" style="padding: 10px 15px;margin-bottom: 0;max-width: none;" data-id="<?php echo $idnya; ?>">
                                                                <div class="card-body p-0">
                                                                    <div class="media p-3  align-items-center" style="padding: 0 !important;">   
                                                                        <div class="rounded thumb-md" style="background-image: url('<?php echo $campaign_selected->image_url; ?>'); background-size: cover;width: 75px;">
                                                                        </div>                                        
                                                                        <div class="media-body ml-3 align-self-center">
                                                                            <h5 class="m-0 font-15 font-weight-semibold"><?php echo $titlenya; ?></h5>
                                                                            <p class="mb-0 text-muted"><?php echo $campaign_selected->category; ?></p>                                          
                                                                        </div>
                                                                        <div class="action-btn">
                                                                            <a href="javascript:;" class="grab-section"><i class="fas fa-arrows-alt mr-2 text-info font-18" title="Drag"></i></a>
                                                                            <a href="javascript:;" class=""><i class="mdi mdi-trash-can mr-2 text-danger font-18 del_s_campaign" title="Delete" data-id="<?php echo $idnya; ?>" data-rand="<?php echo $rand; ?>"></i></a> 
                                                                        </div>                                                                              
                                                                    </div>                                    
                                                                </div><!--end card-body-->                 
                                                            </div><!--end card--> 
                                                        </div><!--end col-->
                                                        <?php }  } ?>
                                                    </div>
                                            </div> <!-- end col -->
                                        </div>
                                        
                                        
                                        <div class="row data_load_manual" <?php if($row->s_data_load=='1'){}else{echo'style="display:none;"';}?>>
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <select id="s_campaign" class="mb-3 s_campaign" style="width: 100%" data-placeholder="Add Campaign">
                                                    <optgroup label="Pilih Campaign" data-image="">
                                                        <?php echo $option_campaign; ?>
                                                    </optgroup>
                                                </select> 
                                            </div> <!-- end col -->
                                        </div>
                                        

                                        <div class="row data_load_automatic" <?php if($row->s_data_load=='1'){echo'style="display:none;"';}?>>
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <label class="mb-3">Campaign Category</label>
                                                <select id="s_category" class="select2 mb-3 select2-multiple" style="width: 100%" multiple="multiple" data-placeholder="Choose">
                                                    <optgroup label="Pilih Category">
                                                        <?php echo $option; ?>
                                                    </optgroup>
                                                </select> 
                                            </div> <!-- end col -->

                                        </div>

                                        <div class="row data_load_automatic" <?php if($row->s_data_load=='1'){echo'style="display:none;"';}?>>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="first_load">First Load</label>
                                                    <select id="first_load" class="form-control form-control-lg">
                                                        <option value="1" <?php if($row->s_show=='1'){ echo 'selected'; }?>>1</option>
                                                        <option value="2" <?php if($row->s_show=='2'){ echo 'selected'; }?>>2</option>
                                                        <option value="3" <?php if($row->s_show=='3'){ echo 'selected'; }?>>3</option>
                                                        <option value="4" <?php if($row->s_show=='4'){ echo 'selected'; }?>>4</option>
                                                        <option value="5" <?php if($row->s_show=='5'){ echo 'selected'; }?>>5</option>
                                                        <option value="6" <?php if($row->s_show=='6'){ echo 'selected'; }?>>6</option>
                                                        <option value="7" <?php if($row->s_show=='7'){ echo 'selected'; }?>>7</option>
                                                        <option value="8" <?php if($row->s_show=='8'){ echo 'selected'; }?>>8</option>
                                                        <option value="9" <?php if($row->s_show=='9'){ echo 'selected'; }?>>9</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group next_loadmore">
                                                    <label for="next_loadmore">Next Loadmore</label>
                                                    <select id="next_loadmore" class="form-control form-control-lg" <?php if($row->s_style=='slider'){ echo 'disabled=""'; }?>>
                                                        <option value="0" <?php if($row->s_loadmore=='0'){ echo 'selected'; }?>>0</option>
                                                        <option value="1" <?php if($row->s_loadmore=='1'){ echo 'selected'; }?>>1</option>
                                                        <option value="2" <?php if($row->s_loadmore=='2'){ echo 'selected'; }?>>2</option>
                                                        <option value="3" <?php if($row->s_loadmore=='3'){ echo 'selected'; }?>>3</option>
                                                        <option value="4" <?php if($row->s_loadmore=='4'){ echo 'selected'; }?>>4</option>
                                                        <option value="5" <?php if($row->s_loadmore=='5'){ echo 'selected'; }?>>5</option>
                                                        <option value="6" <?php if($row->s_loadmore=='6'){ echo 'selected'; }?>>6</option>
                                                        <option value="7" <?php if($row->s_loadmore=='7'){ echo 'selected'; }?>>7</option>
                                                        <option value="8" <?php if($row->s_loadmore=='8'){ echo 'selected'; }?>>8</option>
                                                        <option value="9" <?php if($row->s_loadmore=='9'){ echo 'selected'; }?>>9</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                        </div>

                                        <div class="row" style="padding-top: 10px;">
                                            
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">Button on List Campaign</label>
                                                    <?php 
                                                    if($row->s_button_on=='1'){
                                                         $status_text = '<span>Show</span>';
                                                         $checked = 'checked=""';
                                                         $show_text_button = 'style="display:inline;"';
                                                     }else{
                                                         $status_text = '<span>Hide</span>';
                                                         $checked = '';
                                                         $show_text_button = 'style="display:none;"';
                                                    }

                                                    ?>

                                                    <div class="form-group">
                                                        <div class="custom-control custom-switch" id="checkbox_s_button_on">
                                                            <input type="checkbox" class="custom-control-input checkbox1" id="s_button_on" data-id="1" <?php echo $checked; ?> >
                                                            <label class="custom-control-label" for="s_button_on"><?php echo $status_text; ?></label>
                                                        </div>
                                                    </div>
                                                    <br>

                                                </div>
                                            </div>

                                            <div class="col-md-4">
                                                <div class="form-group" id="s_button_text_box" <?php echo $show_text_button; ?>>
                                                    <label for="username">Text Button</label>
                                                    <input type="text" class="form-control" id="s_button_text" required="" value="<?php echo $row->s_button_text; ?>" style="padding-left: 10px;" placeholder="Donasi Sekarang">
                                                </div>
                                            </div>
                                        </div>

                                        <?php 
                                        if($row->s_style=='grid'){
                                            $show_grid = '';
                                        }else{
                                            $show_grid = 'display:none;';
                                        }

                                        if($row->s_grid_on=='1'){
                                             $status_text2 = '<span>ON</span>';
                                             $checked2 = 'checked=""';
                                         }else{
                                             $status_text2 = '<span>OFF</span>';
                                             $checked2 = '';
                                        }

                                        if($row->s_grid_mobile==null || $row->s_grid_mobile=='1'){
                                            $checked_grid1 = 'checked=""';
                                            $checked_grid2 = '';
                                         }else{
                                            $checked_grid1 = '';
                                            $checked_grid2 = 'checked=""';
                                        }

                                        ?>

                                        <div class="row" style="padding-top: 10px;margin-top:-40px;<?php echo $show_grid; ?>" id="option_grid_on">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">Always GRID</label>
                                                    <div class="form-group">
                                                        <div class="custom-control custom-switch" id="checkbox_s_grid_on">
                                                            <input type="checkbox" class="custom-control-input checkbox1" id="s_grid_on" data-id="1" <?php echo $checked2; ?> >
                                                            <label class="custom-control-label" for="s_grid_on"><?php echo $status_text2; ?></label>
                                                        </div>
                                                    </div>
                                                    <br>

                                                </div>
                                            </div>
                                            <div id="s_grid_mobile" class="col-md-12" style="margin-bottom: 30px;margin-top:-30px;">
                                                <label class="mb-3">View on Mobile</label>
                                                <div style="padding-bottom: 5px;margin-top:-10px;">
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="1" id="grid_mobile1" name="s_grid_mobile" class="custom-control-input" <?php echo $checked_grid1; ?>>
                                                            <label class="custom-control-label" for="grid_mobile1">1 Grid</label>
                                                        </div>
                                                    </div>
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="2" id="grid_mobile2" name="s_grid_mobile" class="custom-control-input" <?php echo $checked_grid2; ?>>
                                                            <label class="custom-control-label" for="grid_mobile2">2 Grid</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> <!-- end col -->
                                        </div>

                                        <div class="row">
                                            <div class="col-md-12">
                                                <p class="mb-3">Note :<br>
                                                    <ul style="list-style: disc;margin-left: 10px;">
                                                        <?php echo get_langArray('shortcode_note1');?></li>
                                                    </ul>
                                                </p>
                                            </div> 
                                        </div>

                                        <div class="row">
                                            <div class="col-sm-12 text-left dja_label">
                                                <hr>
                                                <br>
                                                    <button type="button" class="btn btn-primary px-5 py-2 update_shortcode" data-act="update" id="update_shortcode">Update Shortcode</button>
                                                    <div id="loading-shortcode" class="spinner-border spinner-border-sm text-success hide-loading" role="status" style="margin-left: 10px;"></div>
                                                    <br>
                                                    <br>
                                                    <br>
                                            </div>
                                        </div>
                                    </form>
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->
                </div>
            </div>
        </div>


        <!-- css -->
            
        </style>
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <script type="text/javascript">


        jQuery(document).ready(function($){

            function formatState (state) {
              if (!state.id) {
                return state.text;
              }
              var imgUrl = $(state.element).data('image');
              var $state = $(
                '<span><img src="'+imgUrl+'" class="thumb-campaign">'+ state.text + '</span>'
              );
              return $state;
            };

            $("#s_campaign").select2({
              templateResult: formatState
            });

            $("#s_category").select2({
                width: '100%'
            });


            $('#s_button_on').change(function() {
                if(this.checked) {
                    $('#checkbox_s_button_on span').text('Show');
                    $('#s_button_text_box').show();
                }else{
                    $('#checkbox_s_button_on span').text('Hide');
                    $('#s_button_text_box').hide();
                }
            });


            $('#s_grid_on').change(function() {
                if(this.checked) {
                    $('#checkbox_s_grid_on span').text('ON');
                    $('#s_grid_mobile').slideDown();
                }else{
                    $('#checkbox_s_grid_on span').text('OFF');
                    $('#s_grid_mobile').slideUp();
                }
            });


            $('input[type=radio][name=s_style]').change(function() {
                var val = this.value;
                console.log(val);
                $('#campaign-style-image img').attr('src', "<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-"+val+".jpg");

                if(val=='slider' || val=='expandable'){
                    $('#next_loadmore').val('0').prop('disabled', 'disabled');
                }else{
                    $('#next_loadmore').removeAttr("disabled");
                }
                if(val=='grid'){
                    $('#option_grid_on').show();
                }else{
                    $('#option_grid_on').hide();
                }
            });


            $('input[type=radio][name=data_load]').change(function() {
                var val = this.value;
                
                if(val=='1'){
                    $('.data_load_automatic').hide();
                    $('.data_load_manual').show();
                }else{
                    $('.data_load_automatic').show();
                    $('.data_load_manual').hide();
                }
            });

            
            
            $('#s_campaign').on('select2:select', function (e) {
                var data = e.params.data;

                var title = data.text;
                var id = data.id;
                var category = e.params.data.element.attributes['data-category']['nodeValue'];
                var image = e.params.data.element.attributes['data-image']['nodeValue'];

                var rand = therand(3);

                if(title.length >= 45) title = title.substring(0,45)+'...';

                $('#box_add_campaign').append('<div class="col-lg-12" id="selected_campaign_'+id+'_'+rand+'"><div class="card profile-card data_campaign" style="padding: 10px 15px;margin-bottom: 0;max-width: none;" data-id="'+id+'"><div class="card-body p-0"><div class="media p-3  align-items-center" style="padding: 0 !important;"><div class="rounded thumb-md" style="background-image: url('+image+');background-size: cover;width: 75px;"></div><div class="media-body ml-3 align-self-center"><h5 class="m-0 font-15 font-weight-semibold">'+title+'</h5><p class="mb-0 text-muted">'+category+'</p><div class="action-btn"><a href="" class=""><i class="fas fa-arrows-alt mr-2 text-info font-18" title="Drag"></i><a href="" class=""><i class="mdi mdi-trash-can mr-2 text-danger font-18 del_s_campaign" title="Delete" data-id="'+id+'" data-rand="'+rand+'"></i></a></div></div></div></div></div>')
            });

            $( "#box_add_campaign" ).sortable();

            $('#s_category').on('select2:select', function (e) {
                var data = e.params.data;

                console.log(data.id);

                if(data.id==0){
                    $(this).val(data.id).trigger('change');
                }else{
                    var array = $(this).val();
                    console.log(array);

                    if (array.indexOf('0') === -1) {
                    }else {
                        // console.log(array);
                        array.splice(0, 1);
                        // console.log(array);
                        $(this).val(array).trigger('change');
                    }

                }

            });

            function therand(len, charSet) {
                charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
                var randomString = '';
                for (var i = 0; i < len; i++) {
                    var randomPoz = Math.floor(Math.random() * charSet.length);
                    randomString += charSet.substring(randomPoz,randomPoz+1);
                }
                return randomString;
            }

            $(document).on("click", ".del_s_campaign", function(e) {
                var idnya = $(this).attr('data-id');
                var rand = $(this).attr('data-rand');
                $('#selected_campaign_'+idnya+'_'+rand).slideUp();

                setTimeout(function() {
                    $('#selected_campaign_'+idnya+'_'+rand).remove();
                }, 1000)

                e.preventDefault();
            });


            $('.update_shortcode').click(function(e) {

                var s_id = $('#s_id').val();
                var s_name = $('#s_name').val();
                var s_style = $('input[name="s_style"]:checked').val();
                var s_category = $("#s_category").val();
                s_category = s_category.toString();
                var s_show = $('#first_load').find("option:selected").val();
                var s_loadmore = $('#next_loadmore').find("option:selected").val();
                var s_button_on = $('input#s_button_on:checked').val();
                var s_button_text = $('#s_button_text').val();
                var s_grid_on = $('input#s_grid_on:checked').val();
                var s_grid_mobile = $('input[name="s_grid_mobile"]:checked').val();

                var s_data_load = $('input[name="data_load"]:checked').val();
                var new_selected_campaign = [];
                $(".data_campaign").each(function(){
                        var c_id = $(this).attr('data-id');
                        new_selected_campaign.push('"'+c_id+'"');
                });
                var s_campaign = '{"campaign":['+new_selected_campaign+']}';

                $('#loading-shortcode').removeClass('hide-loading');

                var data_nya = [
                    s_id,
                    s_name,
                    s_category,
                    s_style,
                    s_show,
                    s_loadmore,
                    s_button_on,
                    s_button_text,
                    s_data_load,
                    s_campaign,
                    s_grid_on,
                    s_grid_mobile

                ];

                var data = {
                    "action": "djafunction_update_shortcode",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='failed'){
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes&action=edit&id=') ?>"+s_id+"&info=failed");
                    }else{
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes&action=edit&id=') ?>"+s_id+"&info=success");
                    }
                    $('#loading-shortcode').addClass('hide-loading');
                });


            });

            setTimeout(function() {
                $('#donasiaja-alert').slideUp('fast');
            }, 4000);

            $(document).on("click", ".copylink_shortcode", function(e) {
                var shortcode = $(this).data("shortcode");
                copyToClipboard(shortcode);
                var message = "Copy Shortcode berhasil!";
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


        });
        </script>



    <?php }elseif($create==true){ ?>

        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate.css" rel="stylesheet" type="text/css">

        

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
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes') ?>">Data Shortcodes</a></li>
                                        <li class="breadcrumb-item active">Add</li>
                                    </ol>
                                </div>
                                <h4 class="page-title">Add Shortcode</h4>
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <?php 

                        // Category
                        $option = '<option value="0">All</option>';
                        foreach ($row2 as $key => $value) {
                            $option .= '<option value="'.$value->id.'">'.$value->category.'</option>';
                        }


                        $row_campaign = $wpdb->get_results("SELECT a.id, a.title, a.image_url, b.category from $table_name3 a 
                        left JOIN $table_name2 b ON b.id = a.category_id 
                        where publish_status='1' ");


                        $option_campaign = '';
                        foreach ($row_campaign as $value) {

                            $image_url = $value->image_url;
                            if($image_url==''){
                                $image_url = plugin_dir_url( __FILE__ ).'admin/images/cover_donasiaja.jpg';
                            }
                            $option_campaign .= '<option value="'.$value->id.'" data-id="'.$value->id.'" data-image="'.$image_url.'" data-category="'.$value->category.'">'.$value->title.'</option>';
                        }


                    ?>

                    <!-- end page title end breadcrumb -->
                    <div class="row"> 
                        <div class="col-lg-10">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">Shortcode</h4><br>
                                    <form class="">
                                        <div class="row">
                                            <div class="col-md-8 col-name">
                                                <div class="form-group">
                                                    <label for="username">Name</label>
                                                    <input type="text" class="form-control" id="s_name" required="" value="" style="padding-left:10px;">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-md-12" style="margin-bottom: 30px;">
                                                <label for="s_category" class="type_form">Type</label>
                                                <div class="form-group row box_type_form box_type_form_add">
                                                    <div class="radio radio-primary form-check-inline section-1" style="width:23%;">
                                                        <input type="radio" id="inlineRadio1" value="list" name="s_style">
                                                        <label for="inlineRadio1"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-list2.jpg" style="position: inherit;width:86%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">List</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-2" style="width:23%;">
                                                        <input type="radio" id="inlineRadio2" value="grid" name="s_style">
                                                        <label for="inlineRadio2"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-grid2.jpg" style="position: inherit;width:86%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Grid</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-3" style="width:23%;">
                                                        <input type="radio" id="inlineRadio3" value="slider" name="s_style">
                                                        <label for="inlineRadio3"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-slider2.jpg" style="position: inherit;width:86%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Slider</div></label>
                                                    </div>
                                                    <div class="radio radio-primary form-check-inline section-4" style="width:23%;">
                                                        <input type="radio" id="inlineRadio4" value="expandable" name="s_style">
                                                        <label for="inlineRadio4"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-expandable.jpg" style="position: inherit;width:86%;border-radius: 4px;border: 1px solid #d4d6f0;"><div class="type_form_title_label">Expandable</div></label>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>


                                        <div class="row">
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <label class="mb-3">Data Load</label>

                                                <div style="padding-bottom: 5px;">
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="0" id="data_load1" name="data_load" class="custom-control-input" checked="">
                                                            <label class="custom-control-label" for="data_load1">Automatic</label>
                                                        </div>
                                                    </div>
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="1" id="data_load2" name="data_load" class="custom-control-input">
                                                            <label class="custom-control-label" for="data_load2">Manual</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> <!-- end col -->
                                        </div>

                                        <div class="row data_load_manual" style="display: none;">
                                            <div class="col-md-8">
                                                <label class="mb-3" style="margin-bottom: 0px !important;">Add Campaign</label>
                                            </div>
                                        </div>

                                        <div class="row data_load_manual" style="display: none;">
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                    <div id="box_add_campaign" class="row">
                                                                                                            
                                                    </div>
                                            </div> <!-- end col -->
                                        </div>
                                        
                                        <div class="row data_load_manual" style="display: none;">
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <select id="s_campaign" class="mb-3 s_campaign" style="width: 100%" data-placeholder="Add Campaign">
                                                    <optgroup label="Pilih Campaign">
                                                        <?php echo $option_campaign; ?>
                                                    </optgroup>
                                                </select> 
                                            </div> <!-- end col -->
                                        </div>
                                        
                                        <div class="row data_load_automatic">
                                            <div class="col-md-8" style="margin-bottom: 30px;">
                                                <label class="mb-3">Campaign Category</label>
                                                <select id="s_category" class="select2 mb-3 select2-multiple" style="width: 100%" multiple="multiple" data-placeholder="Choose">
                                                    <optgroup label="Pilih Category">
                                                        <?php echo $option; ?>
                                                    </optgroup>
                                                </select> 
                                            </div> <!-- end col -->
                                        </div>

                                        <div class="row data_load_automatic">

                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="first_load">First Load</label>
                                                    <select id="first_load" class="form-control form-control-lg">
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                        <option value="6">6</option>
                                                        <option value="7">7</option>
                                                        <option value="8">8</option>
                                                        <option value="9">9</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group next_loadmore">
                                                    <label for="next_loadmore">Next Loadmore</label>
                                                    <select id="next_loadmore" class="form-control form-control-lg">
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5">5</option>
                                                        <option value="6">6</option>
                                                        <option value="7">7</option>
                                                        <option value="8">8</option>
                                                        <option value="9">9</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                        </div>


                                        <div class="row" style="padding-top: 10px;">
                                            
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">Button on List Campaign</label>
                                                    <div class="form-group">
                                                        <div class="custom-control custom-switch" id="checkbox_s_button_on">
                                                            <input type="checkbox" class="custom-control-input checkbox1" id="s_button_on" data-id="1">
                                                            <label class="custom-control-label" for="s_button_on"><span>Hide</span></label>
                                                        </div>
                                                    </div>
                                                    <br>

                                                </div>
                                            </div>

                                            <div class="col-md-4">
                                                <div class="form-group" id="s_button_text_box" style="display: none;">
                                                    <label for="username">Text Button</label>
                                                    <input type="text" class="form-control" id="s_button_text" required="" style="padding-left: 10px;" placeholder="Donasi Sekarang">
                                                </div>
                                            </div>
                                            
                                        </div>

                                        <div class="row" style="padding-top: 10px;margin-top:-35px;display:none;" id="option_grid_on">
                                            <div class="col-md-12">
                                                <div class="form-group" style="margin-bottom:0;">
                                                    <label for="username">Always GRID</label>

                                                    <div class="form-group">
                                                        <div class="custom-control custom-switch" id="checkbox_s_grid_on">
                                                            <input type="checkbox" class="custom-control-input checkbox1" id="s_grid_on" data-id="1">
                                                            <label class="custom-control-label" for="s_grid_on"><span>OFF</span></label>
                                                        </div>
                                                    </div>
                                                    <br>

                                                </div>
                                            </div>
                                            <div id="s_grid_mobile" class="col-md-12" style="margin-bottom: 30px;margin-top:-10px;">
                                                <label class="mb-3">View on Mobile</label>
                                                <div style="padding-bottom: 5px;margin-top:-10px;">
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="1" id="grid_mobile1" name="s_grid_mobile" class="custom-control-input" checked="">
                                                            <label class="custom-control-label" for="grid_mobile1">1 Grid</label>
                                                        </div>
                                                    </div>
                                                    <div class="form-check-inline my-1">
                                                        <div class="custom-control custom-radio">
                                                            <input type="radio" value="2" id="grid_mobile2" name="s_grid_mobile" class="custom-control-input">
                                                            <label class="custom-control-label" for="grid_mobile2">2 Grid</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> <!-- end col -->
                                        </div>

                                        <div class="row">
                                            <div class="col-md-12">
                                                <p class="mb-3">Note :<br>
                                                    <ul style="list-style: disc;margin-left: 10px;">
                                                        <?php echo get_langArray('shortcode_note1');?></li>
                                                    </ul>
                                            </p>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-sm-12 text-left dja_label" style="margin-top:0px;">
                                                    <hr>
                                                    <br>
                                                    <button type="button" class="btn btn-primary px-5 py-2 add_shortcode" data-act="update" id="add_shortcode">Add Shortcode</button>
                                                    <div id="loading-shortcode" class="spinner-border spinner-border-sm text-success hide-loading" role="status" style="margin-left: 10px;"></div>
                                                    <div><p class="text-muted mb-3 info-success"></p></div>
                                                    <br>
                                                    <br>
                                            </div>
                                        </div>
                                    </form>
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->
                </div>
            </div>
        </div>

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <script type="text/javascript">

        jQuery(document).ready(function($){

            function formatState (state) {
              if (!state.id) {
                return state.text;
              }
              var imgUrl = $(state.element).data('image');
              var $state = $(
                '<span><img src="'+imgUrl+'" class="thumb-campaign">'+ state.text + '</span>'
              );
              return $state;
            };

            $("#s_campaign").select2({
              templateResult: formatState
            });

            $("#s_category").select2({
                width: '100%'
            });

            // $(".select2").select2({
            //     width: '100%'
            // });

            $('input[type=radio][name=data_load]').change(function() {
                var val = this.value;
                
                if(val=='1'){
                    $('.data_load_automatic').hide();
                    $('.data_load_manual').show();
                }else{
                    $('.data_load_automatic').show();
                    $('.data_load_manual').hide();
                }
            });

            
            
            $('#s_campaign').on('select2:select', function (e) {
                var data = e.params.data;

                var title = data.text;
                var id = data.id;
                var category = e.params.data.element.attributes['data-category']['nodeValue'];
                var image = e.params.data.element.attributes['data-image']['nodeValue'];

                if(title.length >= 45) title = title.substring(0,45)+'...';

                var rand = therand(3);

                $('#box_add_campaign').append('<div class="col-lg-12" id="selected_campaign_'+id+'_'+rand+'"><div class="card profile-card data_campaign" style="padding: 10px 15px;margin-bottom: 0;max-width: none;" data-id="'+id+'"><div class="card-body p-0"><div class="media p-3  align-items-center" style="padding: 0 !important;"><div class="rounded thumb-md" style="background-image: url('+image+');background-size: cover;width: 75px;"></div><div class="media-body ml-3 align-self-center"><h5 class="m-0 font-15 font-weight-semibold">'+title+'</h5><p class="mb-0 text-muted">'+category+'</p><div class="action-btn"><a href="" class=""><i class="fas fa-arrows-alt mr-2 text-info font-18" title="Drag"></i><a href="" class=""><i class="mdi mdi-trash-can mr-2 text-danger font-18 del_s_campaign" title="Delete" data-id="'+id+'" data-rand="'+rand+'"></i></a></div></div></div></div></div>')
            });

            $( "#box_add_campaign" ).sortable();

            $(document).on("click", ".del_s_campaign", function(e) {
                var idnya = $(this).attr('data-id');
                var rand = $(this).attr('data-rand');
                $('#selected_campaign_'+idnya+'_'+rand).slideUp();

                setTimeout(function() {
                    $('#selected_campaign_'+idnya+'_'+rand).remove();
                }, 1000)

                e.preventDefault();
            });

            function therand(len, charSet) {
                charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
                var randomString = '';
                for (var i = 0; i < len; i++) {
                    var randomPoz = Math.floor(Math.random() * charSet.length);
                    randomString += charSet.substring(randomPoz,randomPoz+1);
                }
                return randomString;
            }

            $('#s_category').on('select2:select', function (e) {
                var data = e.params.data;

                console.log(data.id);

                if(data.id==0){
                    $(this).val(data.id).trigger('change');
                }else{
                    var array = $(this).val();
                    console.log(array);

                    if (array.indexOf('0') === -1) {
                    }else {
                        // console.log(array);
                        array.splice(0, 1);
                        // console.log(array);
                        $(this).val(array).trigger('change');
                    }

                }

            });
            

            $('input[type=radio][name=s_style]').change(function() {
                var val = this.value;
                $('#campaign-style-image img').attr('src', "<?php echo plugin_dir_url( __FILE__ ); ?>/images/style-"+val+".jpg");

                if(val=='slider' || val=='expandable'){
                    $('#next_loadmore').val('0').prop('disabled', 'disabled');
                }else{
                    $('#next_loadmore').removeAttr("disabled");
                }
                if(val=='grid'){
                    $('#option_grid_on').show();
                }else{
                    $('#option_grid_on').hide();
                }
            });

            $('#s_button_on').change(function() {
                if(this.checked) {
                    $('#checkbox_s_button_on span').text('Show');
                    $('#s_button_text_box').show();
                }else{
                    $('#checkbox_s_button_on span').text('Hide');
                    $('#s_button_text_box').hide();
                }
            });

            $('#s_grid_on').change(function() {
                if(this.checked) {
                    $('#checkbox_s_grid_on span').text('ON');
                    $('#s_grid_mobile').slideDown();

                }else{
                    $('#checkbox_s_grid_on span').text('OFF');
                    $('#s_grid_mobile').slideUp();
                }
            });

            $('.add_shortcode').click(function(e) {

                var s_name = $('#s_name').val();
                var s_style = $('input[name="s_style"]:checked').val();
                var s_category = $("#s_category").val();
                s_category = s_category.toString();
                var s_show = $('#first_load').find("option:selected").val();
                var s_loadmore = $('#next_loadmore').find("option:selected").val();
                var s_button_on = $('input#s_button_on:checked').val();
                var s_button_text = $('#s_button_text').val();
                var s_grid_on = $('input#s_grid_on:checked').val();
                var s_grid_mobile = $('input[name="s_grid_mobile"]:checked').val();

                var s_data_load = $('input[name="data_load"]:checked').val();
                var new_selected_campaign = [];
                $(".data_campaign").each(function(){
                        var c_id = $(this).attr('data-id');
                        new_selected_campaign.push('"'+c_id+'"');
                });
                var s_campaign = '{"campaign":['+new_selected_campaign+']}';
                

                $('#loading-shortcode').removeClass('hide-loading');

                var data_nya = [
                    s_name,
                    s_category,
                    s_style,
                    s_show,
                    s_loadmore,
                    s_button_on,
                    s_button_text,
                    s_data_load,
                    s_campaign,
                    s_grid_on,
                    s_grid_mobile
                ];

                var data = {
                    "action": "djafunction_add_shortcode",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='failed'){
                        alert('failed');
                    }else{
                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes&action=edit&id=') ?>"+response+"&info=add_success");
                    }
                    $('#loading-shortcode').addClass('hide-loading');
                });


            });

            setTimeout(function() {
                $('#donasiaja-alert').slideUp('fast');
            }, 4000);


        });
        </script>


    <?php }else{ ?>


        <?php 

            $rows = $wpdb->get_results("SELECT * from $table_name ORDER BY id DESC");
            
        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:20px;">

            <!-- Page Content-->
            <div class="page-content-tab">

                <div class="container-fluid">
                    <?php 
                    $c_license = c_expired_license();
                    echo $c_license;
                    ?>
                    <div class="row">

                        <div class="col-sm-12" style="margin-bottom: 20px;">
                            <div class="page-title-box" style="padding-top: 10px;">
                                <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-user" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;">Shortcodes</div></h4>
                            </div>
                        </div>
                        
                        <div class="col-12">
                            <div class="card <?php if($app_name=='HAMBA ALLAH'){echo'detected';}?>" style="max-width: 100%;">
                                <div class="card-body">
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes&action=create') ?>"><button class="btn btn-primary px-4 float-right mt-0 mb-3"><i class="mdi mdi-plus-circle-outline mr-2"></i>Add New Shortcodes</button></a>
                                    <h4 class="header-title mt-0">Data Shortcodes <div id="loading-shortcode" class="spinner-border spinner-border-sm text-success hide-loading" role="status" style="margin-left: 10px;"></div></h4>
                                    <div class="table-responsive dash-social">
                                        <table id="datatable" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                <th>NO</th>
                                                <th>NAME</th>
                                                <th>SHORTCODE</th>
                                                <th>STYLE</th>
                                                <th>CATEGORY</th>
                                                <th>LAST UPDATE</th>
                                                <th style="text-align: center;width: 120px;">ACTION</th>
                                            </tr><!--end tr-->
                                            </thead>
                                            
                                            <tbody>
                                            <?php 
                                            $no = 1;
                                            foreach ($rows as $row) { ?>
                                                
                                                <?php 

                                                    // Waktu Update
                                                    $date_now = date('Y-m-d');
                                                    $datetime1 = new DateTime($date_now);
                                                    $datetime2 = new DateTime($row->updated_at);
                                                    $hasil = $datetime1->diff($datetime2);
                                                    
                                                    $year = $hasil->y;
                                                    $month = $hasil->m;
                                                    $day = $hasil->d;

                                                    // Date
                                                    // $datenya = explode(' ',$row->end_date);
                                                    $datenya = date("F j, Y - H:i",strtotime($row->updated_at)); 
                                                    $datenya = str_replace(" ", "&nbsp;", $datenya);
                                                        
                                                    // shortcode
                                                    $shortcode_view = '[donasiaja&nbsp;id="'.$row->s_id.'"]';
                                                    $shortcode = '[donasiaja id="'.$row->s_id.'"]';


                                                    // cek ada gak
                                                    $category = '';
                                                    if($row->s_category!=''){
                                                        
                                                        if( strpos($row->s_category, ',') !== false ) {
                                                            // ada koma, maka loop

                                                            $variable = $row->s_category;
                                                            $var=explode(',',$variable);
                                                            $count_categoty = count($var);
                                                            $no_category = 1;
                                                            foreach($var as $valuenya)
                                                            {
                                                                $i = 1;
                                                                foreach ($row2 as $key => $value) {
                                                                    if($valuenya=='0'){ 
                                                                        if($i==1){
                                                                            $category .= 'All'; 
                                                                        }
                                                                    }else{
                                                                        if($valuenya==$value->id){ 
                                                                            $category .= $value->category; 
                                                                        }
                                                                    }
                                                                    $i++;
                                                                }

                                                                if($no_category<$count_categoty){
                                                                    $category .= ', ';
                                                                }
                                                                $no_category++;
                                                            }

                                                        }else{
                                                            // gak ada koma, berarti single
                                                            $i = 1;
                                                            foreach ($row2 as $key => $value) {
                                                                if($row->s_category=='0'){ 
                                                                    if($i==1){
                                                                        $category .= 'All'; 
                                                                    }
                                                                }else{
                                                                    if($row->s_category==$value->id){ 
                                                                        $category .= $value->category; 
                                                                    }
                                                                }
                                                                $i++;
                                                            }
                                                        }
                                                    }else{
                                                        $category = '-';
                                                    }

                                                    if($row->s_data_load=='1'){
                                                        $category = '<span style="background: #848dee;color: #fff;padding: 4px 8px;font-size: 11px;border-radius: 4px;">Manual</span>';
                                                    }

                                                    // if (isset($row->s_campaign)) {
                                                    //    return $s_campaign=json_decode($row->s_campaign);
                                                    // }else{
                                                    //     return $s_campaign = [];
                                                    // }
                                                    

                                                    $s_campaign = is_string($row->s_campaign) ? json_decode($row->s_campaign, true) : null;


                                                    $s_campaign_data = '';
                                                    if($s_campaign!=null){
                                                        $count = count($s_campaign['campaign']);
                                                        $i = 1;
                                                        foreach ($s_campaign['campaign'] as $value) {
                                                            $idnya = $value;
                                                            
                                                            if($i==$count){
                                                                $s_campaign_data .= $idnya;
                                                            }else{
                                                                $s_campaign_data .= $idnya.',';
                                                            }

                                                            $i++;
                                                        }
                                                    }

                                                ?>
                                                <tr id="shortcode-<?php echo $row->id; ?>">
                                                    <td style="padding-top: 24px;"><?php echo $no; ?></td>
                                                    <td style="padding-top: 24px;"><?php if($row->s_name==''){echo'Untitled';}else{echo $row->s_name;} ?><div>&nbsp;</div></td>
                                                    <td>
                                                        <div title="Click to Copy" class="copylink_shortcode shortcode_on_table" data-shortcode='<?php echo $shortcode; ?>'><?php echo $shortcode_view; ?></div>

                                                        <!-- <button type="button" class="btn btn-outline-light btn-xs copylink_shortcode" style="border: none;margin-left: 10px;margin-top: 7px;" data-shortcode='<?php echo $shortcode; ?>'>Copy</button> -->
                                                    </td>
                                                    <td style="padding-top: 24px;"><?php echo strtoupper($row->s_style); ?></td>
                                                    <td style="padding-top: 24px;"><?php echo $category; ?></td>
                                                    <td style="padding-top: 24px;"><?php echo $datenya; ?><div>&nbsp;</div></td>
                                                    <td>

                                                    <button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm clone" data-name="<?php echo $row->s_name; ?>" data-category="<?php echo $row->s_category; ?>" data-style="<?php echo $row->s_style; ?>" data-show="<?php echo $row->s_show; ?>" data-loadmore="<?php echo $row->s_loadmore; ?>" data-buttonon="<?php echo $row->s_button_on; ?>" data-buttontext="<?php echo $row->s_button_text; ?>" data-dataload="<?php echo $row->s_data_load; ?>" data-campaign='<?php echo $s_campaign_data; ?>' title="Clone Shortcode"><i class="mdi mdi-content-copy mr-2" style="margin: 0 4px !important;"></i></button>

                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_data_shortcodes&action=edit&id=').$row->s_id ?>" title="Edit Shortcode"><button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm"><i class="mdi mdi-pencil mr-2" style="margin: 0 4px !important;"></i></button></a>
                                                    <button type="button" class="btn btn-outline-danger waves-effect waves-light btn-sm delete" data-id="<?php echo $row->id; ?>" title="Delete Shortcode"><i class="mdi mdi-trash-can mr-2" style="margin: 0 4px !important;"></i></button>
                                                    </td>
                                                </tr>
                                            <?php $no++; } ?>
                                            
                                                                                            
                                            </tbody>
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


        <!-- Required datatable js -->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/jquery.dataTables.min.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/datatables/dataTables.bootstrap4.min.js"></script>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script>
            $('#datatable').DataTable();
            $(document).on("click", ".delete", function(e) {

                var id = $(this).attr('data-id');

                swal.fire({
                  title: 'Anda yakin ingin menghapus Shortcode?',
                  text: "Data tidak bisa dikembalikan jika sudah dihapus!",
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ya, hapus saja!',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true
                }).then(function(result) {
                  if (result.value) {
                    swal.fire(
                      'Deleted!',
                      'Your data has been deleted.',
                      'success'
                    );
                    
                    var data_nya = [
                        id
                    ];

                    $('#loading-shortcode').removeClass('hide-loading');

                    var data = {
                        "action": "djafunction_delete_shortcode",
                        "datanya": data_nya
                    };

                    jQuery.post(ajaxurl, data, function(response) {
                        if(response=='success'){
                            $('#shortcode-'+id).slideUp();
                            $('#loading-shortcode').addClass('hide-loading');
                        }
                        
                    });
                  }
                });

                

                
            });

            $(document).on("click", ".clone", function(e) {
                var name        = $(this).data("name");
                var category    = $(this).data("category");
                var style       = $(this).data("style");
                var show        = $(this).data("show");
                var loadmore    = $(this).data("loadmore");
                var button_on    = $(this).data("buttonon");
                var button_text    = $(this).data("buttontext");

                var data_load    = $(this).data("dataload");
                var campaign    = $(this).data("campaign");

                var data_nya = [
                    name,
                    category,
                    style,
                    show,
                    loadmore,
                    button_on,
                    button_text,
                    data_load,
                    campaign
                ];

                $('#loading-shortcode').removeClass('hide-loading');

                var data = {
                    "action": "djafunction_clone_shortcode",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        $('#loading-shortcode').addClass('hide-loading');
                        window.location.reload();
                    }
                });
            });

            $(document).on("click", ".copylink_shortcode", function(e) {
                var link_donasi = $(this).data("shortcode");
                copyToClipboard(link_donasi);
                var message = "Copy Shortcode berhasil!";
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
        </script>


    <?php } // end of opt data-order ?> 

    <?php
}