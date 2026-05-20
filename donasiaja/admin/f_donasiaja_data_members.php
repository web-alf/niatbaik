<?php

function donasiaja_data_members() {
    ?>
    <?php 
        global $wpdb;
        $table_name = $wpdb->prefix . "dja_users";
        $table_name2 = $wpdb->prefix . "users";
        $table_name3 = $wpdb->prefix . "usermeta";
        $table_name4 = $wpdb->prefix . "dja_user_type";
        $table_name5 = $wpdb->prefix . "dja_verification_status";
        $table_name6 = $wpdb->prefix . "dja_verification_details";
        $table_name7 = $wpdb->prefix . "dja_settings";
        $table_name8 = $wpdb->prefix . "dja_wilayah_malaysia";
        
        donasiaja_global_vars();
        $plugin_license = strtoupper($GLOBALS['donasiaja_vars']['plugin_license']);

        // ROLE
        $cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
        $roles = array_keys((array)$cap);
        $role = $roles[0];

        $id_login = wp_get_current_user()->ID;

        if(isset($_GET['action'])){
            if($_GET['action']=="create"){
                // $info_update = false;
                $edit = false;
                $create = true;
            }elseif($_GET['action']=="edit"){
                // check the campaign is exist
                $check = $wpdb->get_results('SELECT * from '.$table_name2.' where ID="'.$_GET['id'].'"');
                if($check==null){
                    // $info_update = false;
                    $edit = false;
                    $create = false;
                }else{

                    // admin bisa liat semua campaign dan update
                    // $info_update = false;
                    $edit = true;
                    $create = false;
                    
                }
                
            }else{
                // $info_update = false;
                $edit = false;
                $create = false;
            }
        }else{
            // $info_update = false;
            $edit = false;
            $create = false;
        }

        // Currency
        $query_currency = $wpdb->get_results('SELECT data from '.$table_name7.' where type="currency" or type="sapaan_text_setting" or type="sapaan_text_custom" or type="pp_setting" ORDER BY id ASC');
        $currency = $query_currency[0]->data;
        $lang = get_data_lang($currency);
        $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');
        $sapaan_text_setting    = $query_currency[1]->data;
        $sapaan_text_custom     = $query_currency[2]->data;
        $pp_setting     = $query_currency[3]->data;

        // Malaysia
        $wilayah_malaysia = $wpdb->get_results('SELECT * from '.$table_name8.' ORDER BY id ASC');      
        
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
    .notice, #message, #dolly, #wpbody-content .promotion {
        display:none;
    }
    body {
        background: #f6faff;
    }
    img[data-action="zoom"] {
      cursor: pointer;
      cursor: -webkit-zoom-in;
      cursor: -moz-zoom-in;
    }
    .zoom-img,
    .zoom-img-wrap {
      position: relative;
      z-index: 666;
      -webkit-transition: all 300ms;
           -o-transition: all 300ms;
              transition: all 300ms;
    }
    img.zoom-img {
      cursor: pointer;
      cursor: -webkit-zoom-out;
      cursor: -moz-zoom-out;
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
    #datatable_filter input:focus {
        outline: none !important;
        outline-style: none;
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
        background-color: #7680ffb3;
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
        transition: all .35s ease;
        margin-top: -25px;
        margin-left: 50px;
    }

    .fro-profile_main-pic-change:hover {
        background-color: #7680ff;
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

    @media only screen and (max-width:767px) {
        .page-title-box .breadcrumb {
            display: inline-flex !important;
            width: 100% !important;
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
        select.form-control {
            font-size: 13px;
        }
    }


    @media only screen and (max-width:480px) {
      .dja_label {
        width: auto;
      }
      #update_password, #update_user, .col_update_user, #add_user, .col_add_user {
        width: 100%;
      }
    }

    .swal2-popup.swal2-modal{
        border-radius:12px;
        padding: 40px 40px 50px 40px;
        background: url('<?php echo plugin_dir_url( __FILE__ ).'../assets/images/bg4.png'; ?>') no-repeat, #fff;
    }

    
    </style>

    <?php check_license(); ?>

    <?php if($plugin_license!='ULTIMATE') { ?>
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
    
    <?php if($edit==true){ ?>


        <?php 

        $user_id = $_GET['id'];

        if($user_id==1) {
            if($user_id!=$id_login){
                wp_redirect( admin_url('admin.php?page=donasiaja_data_members') );
                exit;
            }
        }

        $row = $wpdb->get_results("SELECT * from $table_name2 wp_u LEFT JOIN $table_name dja_u on wp_u.ID = dja_u.user_id where wp_u.ID='$user_id' ORDER BY dja_u.id ASC")[0];

        // GET NAME
        $user_info = get_userdata($user_id);
        $first_name = $user_info->first_name;
        $last_name = $user_info->last_name;
        $fullname = $first_name.' '.$last_name;

        // GET ROLES
        global $wp_roles;
        $wp_roles = new WP_Roles();
        $wp_rolesnya = $wp_roles->get_names();

        // USER ROLE
        $cap2 = get_user_meta( $user_id, $wpdb->get_blog_prefix() . 'capabilities', true );
        $roles2 = array_keys((array)$cap2);
        $role_usernya = $roles2[0];

        if($user_id==1){
            $option_role = '<option value="administrator" selected>Administrator</option>';
        }else{
            $option_role = '<option value="">Pilih Role</option>';
            foreach ($wp_rolesnya as $key => $value) {
                $selected = '';
                if($role_usernya==$key){
                    $selected = 'selected';
                }
                $option_role .= '<option value="'.$key.'" '.$selected.'>'.$value.'</option>';
            }
        }
        

        // TYPE USER
        $array_user_type = $wpdb->get_results("SELECT * from $table_name4 order by id ASC");
        $option_user_type = '<option value="">Pilih Type</option>';
        foreach ($array_user_type as $key => $value) {
            $selected = '';
            if($row->user_type==$value->type){
                $selected = 'selected';
            }
            $option_user_type .= '<option value="'.$value->type.'" '.$selected.'>'.$value->name.'</option>';
        }

        // VERIFICATION
        $array_user_verification = $wpdb->get_results("SELECT * from $table_name5 order by id ASC");
        $option_user_verification = '<option value="">Pilih Verification</option>';
        foreach ($array_user_verification as $key => $value) {
            $selected = '';
            if($row->user_verification==$value->status){
                $selected = 'selected';
            }
            $option_user_verification .= '<option value="'.$value->status.'" '.$selected.'>'.$value->name.'</option>';
        }

        // CHECK DATA VERIFICATION
        $check_ver_detail = $wpdb->get_results('SELECT * from '.$table_name6.' where u_id="'.$user_id.'"');
        if ($check_ver_detail==null) {
            // insert data to table verifications
            $wpdb->insert(
                $table_name6, //table
                array(
                    'u_id'                  => $user_id,
                    'u_nama_lengkap'        => null,
                    'u_email'               => null,
                    'u_whatsapp'            => null,
                    'u_ktp'                 => null,
                    'u_ktp_selfie'          => null,
                    'u_jabatan'             => null,
                    'u_nama_ketua'          => null,
                    'u_alamat_lengkap'      => null,
                    'u_program_unggulan'    => null,
                    'u_profile'             => null,
                    'u_legalitas'           => null,
                    'created_at'            => date("Y-m-d H:i:s")),
                array('%s', '%s') //data format         
            );
        }

        $row2 = $wpdb->get_results('SELECT * from '.$table_name6.' where u_id="'.$user_id.'"')[0];

        ?>
        
        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script type="text/javascript">

        jQuery(document).ready(function($){

            get_provinsi(<?php echo $user_id; ?>);
            get_kabkota(<?php echo $row->user_provinsi_id; ?>);
            get_kecamatan(<?php echo $row->user_kabkota_id; ?>);

            function get_provinsi(id){

                $('select#dja_provinsi').html('<option></option>');

                $('.provinsi_loading').show();

                var data_nya = [
                    <?php echo $user_id; ?>
                ];
                var data = {
                    "action": "dja_get_provinsi",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_provinsi').html(response);
                     $('.provinsi_loading').hide();
                });
            }

            function get_kabkota(id){

                $('select#dja_kabkota').html('<option></option>');
                $('.kabkota_loading').show();

                var id_user = <?php echo $user_id; ?>;
                var id_prov = id;

                var data_nya = [
                    id_user,
                    id_prov
                ];
                var data = {
                    "action": "dja_get_kabkota",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_kabkota').html(response);
                     $('.kabkota_loading').hide();
                });
            }

            function get_kecamatan(id){

                $('select#dja_kecamatan').html('<option></option>');
                $('.kecamatan_loading').show();

                var id_user = <?php echo $user_id; ?>;
                var id_kabkota = id;

                var data_nya = [
                    id_user,
                    id_kabkota
                ];
                var data = {
                    "action": "dja_get_kecamatan",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_kecamatan').html(response);
                     $('.kecamatan_loading').hide();
                });
            }

            $('#dja_provinsi').bind("change", function(e){
                    var id_prov = $(this).find(":selected").data("idprovinsi");
                    get_kabkota(id_prov);
                    console.log("id prov:"+id_prov);
                    $('#dja_kecamatan').prop("disabled", "disabled");
                    $('select#dja_kecamatan').html('<option></option>');
            });

            $('#dja_kabkota').bind("change", function(e){
                    var id_kabkota = $(this).find(":selected").data("idkabkota");
                    get_kecamatan(id_kabkota);
                    console.log("id kabkota:"+id_kabkota);
                    $('#dja_kecamatan').prop("disabled", false);
            });


            $('#update_user').bind("click", function(e){

                $('.update_loading').show();
                
                var user_id = $("#user_id").val();
                var user_firstname = $("#user_firstname").val();
                var user_lastname = $("#user_lastname").val();
                var user_wa = $("#user_wa").val();
                var user_email = $("#user_email").val();

                var user_bio = $("#user_bio").val();

                var user_provinsi = $("#dja_provinsi").find(":selected").val();
                var user_kabkota = $("#dja_kabkota").find(":selected").val();
                var user_kecamatan = $("#dja_kecamatan").find(":selected").val();
                var user_provinsi_id = $("#dja_provinsi").find(":selected").data("idprovinsi");
                var user_kabkota_id = $("#dja_kabkota").find(":selected").data("idkabkota");
                var user_kecamatan_id = $("#dja_kecamatan").find(":selected").data("idkecamatan");

                var user_alamat = $("#user_alamat").val();

                var user_bank_name = $("#user_bank_name").val();
                var user_bank_no = $("#user_bank_no").val();
                var user_bank_an = $("#user_bank_an").val();

                var user_role = $("#user_role").find(":selected").val();
                var user_type = $("#user_type").find(":selected").val();
                var user_verification = $("#user_verification").find(":selected").val();

                var user_sapaan = $("#dja_sapaan").find(":selected").val();

                var data_nya = [
                    user_id,
                    user_firstname,
                    user_lastname,
                    user_wa,
                    user_email,
                    user_bio,
                    user_provinsi,
                    user_kabkota,
                    user_kecamatan,
                    user_provinsi_id,
                    user_kabkota_id,
                    user_kecamatan_id,
                    user_alamat,
                    user_bank_name,
                    user_bank_no,
                    user_bank_an,
                    user_role,
                    user_type,
                    user_verification,
                    user_sapaan
                ];

                var data = {
                    "action": "djafunction_update_user",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        // alert('Success');
                        swal.fire(
                          'Success!',
                          'Data User berhasil di Update.',
                          'success'
                        );

                        $('.data_profile_show').show();
                        $('.data_profile_hide').hide();
                        $('.update_loading').hide();

                        setTimeout(function() {
                            window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_members&action=edit&id=') ?>"+user_id+"");
                        }, 1000);                        

                    }
                });
                

            });

            $('#upload_pp_image').click(function(e) {
                e.preventDefault();
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

                    <?php if($pp_setting=='1') { ?>
                        var new_image_url = image_url;
                    <?php }else{ ?>
                        if(image_url.includes(".jpg")){
                            var imagenya = image_url.split(".jpg");
                            var new_image_url = imagenya[0]+"-150x150.jpg";
                        }
                        if(image_url.includes(".jpeg")){
                            var imagenya = image_url.split(".jpeg");
                            var new_image_url = imagenya[0]+"-150x150.jpeg";
                        }
                        if(image_url.includes(".png")){
                            var imagenya = image_url.split(".png");
                            var new_image_url = imagenya[0]+"-150x150.png";
                        }
                    <?php } ?>

                    $.get(new_image_url)
                    .done(function() { 
                        // Do something now you know the image exists.
                        $("img#pp_image").attr("src",new_image_url);

                        var user_id = <?php echo $user_id; ?>;
                        var pp_img = new_image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_pp_img_user",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Profile picture berhasil di Update.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                        // Image doesn't exist - do something else.
                        $("img#pp_image").attr("src",image_url);

                        var user_id = <?php echo $user_id; ?>;
                        var pp_img = image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_pp_img_user",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Profile picture berhasil di Update.',
                                  'success'
                                );
                            }
                        });
                    });

                });
            });


            function randomStringPass(len, charSet) {
                charSet = charSet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()_';
                var randomStringPass = '';
                for (var i = 0; i < len; i++) {
                    var randomPoz = Math.floor(Math.random() * charSet.length);
                    randomStringPass += charSet.substring(randomPoz,randomPoz+1);
                }
                return randomStringPass;
            }

            $('.generate_pass').bind("click", function(e){
                var new_pass = randomStringPass(12);
                $('#user_pass_new').val(new_pass);
            });

            $('#update_password').bind("click", function(e){

                $('.update_password_loading').show();

                var user_id = <?php echo $user_id; ?>;
                var user_pass_new = $("#user_pass_new").val();

                swal.fire({
                      title: 'Anda yakin ingin mengupdate password?',
                      html: "Pastikan sudah di copy ya password barunya.",
                      type: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Ya, Update sekarang!',
                      cancelButtonText: 'Cancel',
                      reverseButtons: true
                    }).then(function(result) {
                      if (result.value) {
                        
                        var data_nya = [
                            user_id,
                            user_pass_new
                        ];

                        var data = {
                            "action": "djafunction_update_password_user",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {

                            if(response=='success'){
                                $('.data_password_hide').hide();
                                $('.update_password_loading').hide();

                                swal.fire(
                                  'Updated success!',
                                  'Your password has been updated.',
                                  'success'
                                );

                                window.location.reload();

                            }else{
                                swal.fire(
                                  'Update Password Failed!',
                                  '',
                                  'warning'
                                );

                            }

                        });

                       
                      }else{
                        $('.update_password_loading').hide();
                      }
                    })
                
                

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

                    <?php 

                    $rows_check = $wpdb->get_results('SELECT * from '.$table_name.' where user_id="'.$user_id.'"');
                    $rows_check2 = $wpdb->get_results('SELECT * from '.$table_name6.' where u_id="'.$user_id.'"');

                    if (!isset($rows_check[0])) {
                        // echo 'gak ada';

                        $randid = 'u_'.d_randomString(8);

                        // insert data to table user
                        $wpdb->insert(
                            $table_name, //table
                            array(
                                'user_id'           => $user_id,
                                'user_randid'       => $randid,
                                'user_type'         => null,
                                'user_verification' => null,
                                'user_bio'          => null,
                                'user_wa'           => null,
                                'user_provinsi'     => null,
                                'user_kabkota'      => null,
                                'user_kecamatan'    => null,
                                'user_provinsi_id'  => null,
                                'user_kabkota_id'   => null,
                                'user_kecamatan_id' => null,
                                'user_alamat'       => null,
                                'user_bank_name'    => null,
                                'user_bank_no'      => null,
                                'user_bank_an'      => null,
                                'user_pp_img'       => null,
                                'user_cover_img'    => null,
                                'created_at'    => date("Y-m-d H:i:s")),
                            array('%s', '%s') //data format         
                        );
                
                    }
                    if (!isset($rows_check2[0])) {
                        // echo 'gak ada';
                        // insert data to table verifications
                        $wpdb->insert(
                            $table_name6, //table
                            array(
                                'u_id'                  => $user_id,
                                'u_nama_lengkap'        => null,
                                'u_email'               => null,
                                'u_whatsapp'            => null,
                                'u_ktp'                 => null,
                                'u_ktp_selfie'          => null,
                                'u_jabatan'             => null,
                                'u_nama_ketua'          => null,
                                'u_alamat_lengkap'      => null,
                                'u_program_unggulan'    => null,
                                'u_profile'             => null,
                                'u_legalitas'           => null,
                                'created_at'            => date("Y-m-d H:i:s")),
                            array('%s', '%s') //data format         
                        );
                
                    }

                ?>



                    <div class="row">

                        

                        <div class="col-sm-12">
                            <div class="page-title-box">
                                <div class="float-right">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_members') ?>">Data Members</a></li>
                                        <li class="breadcrumb-item active">Edit</li>
                                    </ol>
                                </div>
                                <h4 class="page-title">Edit User</h4>
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row"> 
                        <div class="col-lg-7">
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">Data User</h4><br>
                                    <?php 
                                    if(isset($_GET['info'])){
                                        if($_GET['info']=="success"){
                                            echo '
                                            <div id="donasiaja-alert" class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                    <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                </button>
                                                Add New User Success.
                                            </div>
                                            ';
                                        }else{
                                            echo '
                                            <div id="donasiaja-alert" class="alert alert-danger alert-dismissible fade show" role="alert" style="margin-bottom: 25px;">
                                                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                                    <span aria-hidden="true"><i class="mdi mdi-close"></i></span>
                                                </button>
                                                Something wrong.
                                            </div>
                                            ';
                                        }
                                    }
                                    ?>
                                    <form class="">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <input type="text" class="form-control" id="user_id" value="<?php echo $user_id; ?>" style="display: none;">
                                                <div class="form-group">
                                                    <label for="username">Firstname</label>
                                                    <input type="text" class="form-control" id="user_firstname" required="" value="<?php echo $first_name; ?>">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Lastname</label>
                                                    <input type="text" class="form-control" id="user_lastname" required="" value="<?php echo $last_name; ?>">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Whatsapp</label>
                                                    <input type="text" class="form-control" id="user_wa" required="" value="<?php echo $row->user_wa; ?>">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Email</label>
                                                    <input type="text" class="form-control" id="user_email" required="" value="<?php echo $row->user_email; ?>">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Sapaan</label>

                                                    <div class="form-group">
                                                        <?php 
                                                        if($sapaan_text_setting=='1'){
                                                        $sapaan_text_custom = explode(',', $sapaan_text_custom); ?>

                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <?php 
                                                            foreach($sapaan_text_custom as $key => $value){
                                                                $sapaan_selected='';
                                                                if($value==$row->user_sapaan){$sapaan_selected='selected';}
                                                                echo '
                                                                <option value="'.$value.'" '.$sapaan_selected.'>'.$value.'</option>
                                                                ';
                                                            }
                                                            ?>
                                                        </select>

                                                        <?php }else{ ?>
                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <option value="Bapak" <?php if($row->user_sapaan=='Bapak'){echo 'selected';}?>>Bapak</option>
                                                            <option value="Ibu" <?php if($row->user_sapaan=='Ibu'){echo 'selected';}?>>Ibu</option>
                                                            <option value="Kak" <?php if($row->user_sapaan=='Kak'){echo 'selected';}?>>Kak</option>
                                                        </select>
                                                        <?php } ?>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username">Biography</label>
                                                    <div class="form-group">
                                                        <textarea class="form-control data_profile_hide" rows="3" id="user_bio" style="font-size: 13px;"><?php echo $row->user_bio; ?></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username"><?php echo get_langArray('section_label1');?><div class="spinner-border spinner-border-sm text-purple provinsi_loading kabkota_loading kecamatan_loading" role="status" style="position: absolute;margin-left: 15px;display: none;"></div></label>

                                                    <select class="form-control dja_provinsi data_profile_hide" id="dja_provinsi" name="provinsi" style="margin-bottom: 15px;">
                                                    </select>
                                                                
                                                    <select class="form-control dja_kabkota data_profile_hide" id="dja_kabkota" name="kabkota" style="margin-bottom: 15px;">
                                                    </select>
                                                    
                                                    <select class="form-control dja_kecamatan data_profile_hide" id="dja_kecamatan" name="kecamatan" style="margin-bottom: 25px;">
                                                    </select>

                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username">Alamat</label>
                                                    <div class="form-group">
                                                        <textarea class="form-control data_profile_hide" rows="3" id="user_alamat" style="font-size: 13px;"><?php echo $row->user_alamat; ?></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">Nama Bank</label>
                                                    <input type="text" class="form-control" id="user_bank_name" required="" value="<?php echo $row->user_bank_name; ?>">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username"><?php echo get_langArray('section_label2');?></label>
                                                    <input type="text" class="form-control" id="user_bank_no" required="" value="<?php echo $row->user_bank_no; ?>">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username"><?php echo get_langArray('section_label3');?></label>
                                                    <input type="text" class="form-control" id="user_bank_an" required="" value="<?php echo $row->user_bank_an; ?>">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <hr>
                                            </div>
                                        </div>
                                        <div class="row" style="margin-top: 15px;">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_role">Role</label>
                                                    <select id="user_role" class="form-control form-control-lg">
                                                            <?php echo $option_role; ?>
                                                        </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_type">User Type</label>
                                                    <select id="user_type" class="form-control form-control-lg">
                                                            <?php echo $option_user_type; ?>
                                                        </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_verification">Verification</label>
                                                    <select id="user_verification" class="form-control form-control-lg">
                                                            <?php echo $option_user_verification; ?>
                                                        </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-sm-6 text-left dja_label col_update_user" style="margin-top: 40px;margin-bottom: 20px;">
                                                    <button type="button" class="btn btn-primary px-5 py-2 update_shortcode" data-act="update" id="update_user">Update User <div class="spinner-border spinner-border-sm text-white update_loading" style="margin-left: 3px;display: none;"></div></button>
                                                    <br>
                                                    <br>
                                            </div>
                                        </div>
                                    </form>
                                </div><!--end card-body-->
                            </div><!--end card-->
                        </div><!--end col-->
                        <div class="col-lg-5">
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">Profile Picture User</h4><br>
                                    <form class="">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="media-left">
                                                    <?php if($row->user_pp_img=='') { ?>
                                                        <img src="<?php echo plugin_dir_url( __FILE__ ) . "../assets/images/pp.jpg"; ?>" alt="" class="rounded-circle thumb-xl" style="border: 1px solid #dde4ec;" id="pp_image">
                                                    <?php }else{?>
                                                        <img src="<?php echo $row->user_pp_img; ?>" alt="" class="rounded-circle thumb-xl" style="border: 1px solid #dde4ec;" data-action="zoom" id="pp_image">
                                                    <?php } ?>
                                                        <span class="fro-profile_main-pic-change" id="upload_pp_image" title="Edit Profile Picture">
                                                            <i class="fas fa-camera"></i>
                                                        </span>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">New Password</h4><br>
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="form-group">
                                                <input type="text" class="form-control data_password_hide" id="user_pass_new" required="" placeholder="Masukkan Password Baru" value="" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-group data_password_hide">
                                                <button type="button" class="btn btn-light waves-effect waves-light generate_pass" style="height: 45px;">Generate</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 15px;" class="data_password_hide">
                                        <button type="button" class="btn btn-primary px-5 py-2" id="update_password">Update <div class="spinner-border spinner-border-sm text-white update_password_loading" style="margin-left: 3px;display: none;"></div></button>
                                    </div>
                                </div>
                            </div>
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">Data User Verification</h4><br>
                                    <form class="">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <label style="cursor: default;">Mendaftar sebagai : <b><?php if($row->user_type=='personal') {echo 'Personal';} if($row->user_type=='org') {echo 'Organization';} ?></b></label>
                                                <hr>
                                            </div>
                                            <div class="col-md-6">
                                                <label style="cursor: default;">Nama Lengkap</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_nama_lengkap!=''){echo $row2->u_nama_lengkap;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-6">
                                                <label style="cursor: default;">Email</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_email!=''){echo $row2->u_email;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-6">
                                                <label style="cursor: default;">Whatsapp</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_whatsapp!=''){echo $row2->u_whatsapp;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-6">
                                                <label style="cursor: default;">Jabatan di Organisasi</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_jabatan!=''){echo $row2->u_jabatan;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-12">
                                                <label style="cursor: default;">Nama Ketua / Pimpinan</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_nama_ketua!=''){echo $row2->u_nama_ketua;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-12">
                                                <label style="cursor: default;">Alamat Lengkap</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_alamat_lengkap!=''){echo $row2->u_alamat_lengkap;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-12">
                                                <label style="cursor: default;">Program Unggulan</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_program_unggulan!=''){echo $row2->u_program_unggulan;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-12">
                                                <label style="cursor: default;">Profile</label>
                                                <p class="card-text text-muted" style="margin-bottom: 15px;"><?php if($row2->u_profile!=''){echo $row2->u_profile;}else{echo'-';} ?></p>
                                            </div>
                                            <div class="col-md-12">
                                                <hr>
                                            </div>
                                            <div class="col-md-6" style="margin-top: 10px;margin-bottom: 10px;">
                                                <label style="cursor: default;">Foto KTP</label>
                                                <?php if($row2->u_ktp!=''){ ?>
                                                <div class="media-left">
                                                    <img src="<?php echo $row2->u_ktp; ?>" data-action="zoom" alt="user" class="" style="border-radius: 2px !important; height: 60px;">
                                                    <span class="round-10 bg-success"></span>
                                                </div>
                                                <?php }else{ ?>
                                                    <p>-</p>
                                                <?php } ?>
                                            </div>
                                            <div class="col-md-6" style="margin-top: 10px;">
                                                <label style="cursor: default;">Foto diri dengan KTP</label>
                                                <?php if($row2->u_ktp_selfie!=''){ ?>
                                                <div class="media-left">
                                                    <img src="<?php echo $row2->u_ktp_selfie; ?>" data-action="zoom" alt="user" class="" style="border-radius: 2px !important;height: 60px;">
                                                    <span class="round-10 bg-success"></span>
                                                </div>
                                                <?php }else{ ?>
                                                    <p>-</p>
                                                <?php } ?>
                                                
                                            </div>
                                            <div class="col-md-12" style="margin-top: 20px;">
                                                <label style="cursor: default;">Legalitas Organisasi</label>
                                                <?php if($row2->u_legalitas==null) { ?>
                                                   <p class="card-text text-muted" style="margin-bottom: 15px;">-</p>
                                                <?php }else{ ?>
                                                    <p class="card-text text-muted" style="margin-bottom: 15px;">
                                                    <a href="<?php echo $row2->u_legalitas; ?>" target="_blank" id="u_legalitas" data-file="<?php echo $row2->u_legalitas; ?>"><i class="far fa-file-pdf text-danger"></i>&nbsp;&nbsp;&nbsp;<?php echo basename($row2->u_legalitas); ?></a></p>
                                                <?php } ?>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </div>



    <?php }elseif($create==true){ ?>


        <?php 

        global $wp_roles;
        $wp_roles = new WP_Roles();
        $wp_rolesnya = $wp_roles->get_names();

        $option_role = '<option value="">Pilih Role</option>';
        foreach ($wp_rolesnya as $key => $value) {
            $option_role .= '<option value="'.$key.'">'.$value.'</option>';
        }

        // TYPE USER
        $array_user_type = $wpdb->get_results("SELECT * from $table_name4 order by id ASC");
        $option_user_type = '<option value="">Pilih Type</option>';
        foreach ($array_user_type as $key => $value) {
            $option_user_type .= '<option value="'.$value->type.'">'.$value->name.'</option>';
        }

        // VERIFICATION
        $array_user_verification = $wpdb->get_results("SELECT * from $table_name5 order by id ASC");
        $option_user_verification = '<option value="">Pilih Verification</option>';
        foreach ($array_user_verification as $key => $value) {
            $option_user_verification .= '<option value="'.$value->status.'">'.$value->name.'</option>';
        }


        ?>

        <!-- css -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/animate/animate.css" rel="stylesheet" type="text/css">

        <!--Wysiwig js-->
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>js/donasiaja-admin.js"></script>
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>
        <script type="text/javascript">

        jQuery(document).ready(function($){

            get_provinsi(0);

            function get_provinsi(id){

                $('select#dja_provinsi').html('<option></option>');

                $('.provinsi_loading').show();

                var data_nya = [
                    0
                ];
                var data = {
                    "action": "dja_get_provinsi",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_provinsi').html(response);
                     $('.provinsi_loading').hide();
                });
            }

            function get_kabkota(id){

                $('select#dja_kabkota').html('<option></option>');
                $('.kabkota_loading').show();

                var id_user = 0;
                var id_prov = id;

                var data_nya = [
                    id_user,
                    id_prov
                ];
                var data = {
                    "action": "dja_get_kabkota",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_kabkota').html(response);
                     $('.kabkota_loading').hide();
                });
            }

            function get_kecamatan(id){

                $('select#dja_kecamatan').html('<option></option>');
                $('.kecamatan_loading').show();

                var id_user = 0;
                var id_kabkota = id;

                var data_nya = [
                    id_user,
                    id_kabkota
                ];
                var data = {
                    "action": "dja_get_kecamatan",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                     $('select#dja_kecamatan').html(response);
                     $('.kecamatan_loading').hide();
                });
            }

            $('#dja_provinsi').bind("change", function(e){
                    var id_prov = $(this).find(":selected").data("idprovinsi");
                    get_kabkota(id_prov);
                    console.log("id prov:"+id_prov);
                    $('#dja_kecamatan').prop("disabled", "disabled");
                    $('select#dja_kecamatan').html('<option></option>');
            });

            $('#dja_kabkota').bind("change", function(e){
                    var id_kabkota = $(this).find(":selected").data("idkabkota");
                    get_kecamatan(id_kabkota);
                    console.log("id kabkota:"+id_kabkota);
                    $('#dja_kecamatan').prop("disabled", false);
            });


            $('#add_user').bind("click", function(e){

                $('.add_loading').show();
                
                var user_firstname = $("#user_firstname").val();
                var user_lastname = $("#user_lastname").val();
                var user_wa = $("#user_wa").val();
                var user_email = $("#user_email").val();

                var user_bio = $("#user_bio").val();

                var user_provinsi = $("#dja_provinsi").find(":selected").val();
                var user_kabkota = $("#dja_kabkota").find(":selected").val();
                var user_kecamatan = $("#dja_kecamatan").find(":selected").val();
                var user_provinsi_id = $("#dja_provinsi").find(":selected").data("idprovinsi");
                var user_kabkota_id = $("#dja_kabkota").find(":selected").data("idkabkota");
                var user_kecamatan_id = $("#dja_kecamatan").find(":selected").data("idkecamatan");

                var user_alamat = $("#user_alamat").val();

                var user_bank_name = $("#user_bank_name").val();
                var user_bank_no = $("#user_bank_no").val();
                var user_bank_an = $("#user_bank_an").val();

                var user_role = $("#user_role").find(":selected").val();
                var user_type = $("#user_type").find(":selected").val();
                var user_verification = $("#user_verification").find(":selected").val();

                var user_pass_new = $("#user_pass_new").val();
                var user_sapaan = $("#dja_sapaan").find(":selected").val();

                var data_nya = [
                    user_firstname,
                    user_lastname,
                    user_wa,
                    user_email,
                    user_bio,
                    user_provinsi,
                    user_kabkota,
                    user_kecamatan,
                    user_provinsi_id,
                    user_kabkota_id,
                    user_kecamatan_id,
                    user_alamat,
                    user_bank_name,
                    user_bank_no,
                    user_bank_an,
                    user_role,
                    user_type,
                    user_verification,
                    user_pass_new,
                    user_sapaan
                ];

                // console.log(data_nya);
                // return false;

                var data = {
                    "action": "djafunction_add_user",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='email_terdaftar'){

                    }else if(response=='failed'){

                    }else{
                        // alert('Success');
                        swal.fire(
                          'Success!',
                          'Data User berhasil ditambahkan.',
                          'success'
                        );

                        $('.data_profile_show').show();
                        $('.data_profile_hide').hide();
                        $('.add_loading').hide();

                        window.location.replace("<?php echo admin_url('admin.php?page=donasiaja_data_members&action=edit&id=') ?>"+response+"&info=success");

                    }
                });
                

            });

            function randomStringPass(len, charSet) {
                charSet = charSet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()_';
                var randomStringPass = '';
                for (var i = 0; i < len; i++) {
                    var randomPoz = Math.floor(Math.random() * charSet.length);
                    randomStringPass += charSet.substring(randomPoz,randomPoz+1);
                }
                return randomStringPass;
            }

            $('.generate_pass').bind("click", function(e){
                var new_pass = randomStringPass(12);
                $('#user_pass_new').val(new_pass);
            });




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
                                        <li class="breadcrumb-item"><a href="<?php echo admin_url('admin.php?page=donasiaja_data_members') ?>">Data Members</a></li>
                                        <li class="breadcrumb-item active">Add</li>
                                    </ol>
                                </div>
                                <h4 class="page-title">Add New User</h4>
                            </div><!--end page-title-box-->
                        </div><!--end col-->
                    </div>

                    <!-- end page title end breadcrumb -->
                    <div class="row"> 
                        <div class="col-lg-7">
                            <div class="card" style="max-width: 100% !important;">
                                <div class="card-body">
                                    <h4 class="mt-0 header-title">Data User</h4><br>
                                    <form class="">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Firstname</label>
                                                    <input type="text" class="form-control" id="user_firstname" required="" value="">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Lastname</label>
                                                    <input type="text" class="form-control" id="user_lastname" required="" value="">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Whatsapp</label>
                                                    <input type="text" class="form-control" id="user_wa" required="" value="">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Email</label>
                                                    <input type="text" class="form-control" id="user_email" required="" value="">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <label for="username">Sapaan</label>

                                                    <div class="form-group">
                                                        <?php 
                                                        if($sapaan_text_setting=='1'){
                                                        $sapaan_text_custom = explode(',', $sapaan_text_custom); ?>

                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <?php 
                                                            foreach($sapaan_text_custom as $key => $value){
                                                                echo '
                                                                <option value="'.$value.'">'.$value.'</option>
                                                                ';
                                                            }
                                                            ?>
                                                        </select>

                                                        <?php }else{ ?>
                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <option value="Bapak">Bapak</option>
                                                            <option value="Ibu">Ibu</option>
                                                            <option value="Kak">Kak</option>
                                                        </select>
                                                        <?php } ?>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username">Biography</label>
                                                    <div class="form-group">
                                                        <textarea class="form-control data_profile_hide" rows="3" id="user_bio" style="font-size: 13px;"></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username">Domisili <div class="spinner-border spinner-border-sm text-purple provinsi_loading kabkota_loading kecamatan_loading" role="status" style="position: absolute;margin-left: 15px;display: none;"></div></label>
                                                    <select class="form-control dja_provinsi data_profile_hide" id="dja_provinsi" name="provinsi" style="margin-bottom: 15px;">
                                                    </select>
                                                    <select class="form-control dja_kabkota data_profile_hide" id="dja_kabkota" name="kabkota" style="margin-bottom: 15px;">
                                                    </select>
                                                    <select class="form-control dja_kecamatan data_profile_hide" id="dja_kecamatan" name="kecamatan" style="margin-bottom: 25px;">
                                                    </select>

                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group">
                                                    <label for="username">Alamat</label>
                                                    <div class="form-group">
                                                        <textarea class="form-control data_profile_hide" rows="3" id="user_alamat" style="font-size: 13px;"></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">Nama Bank</label>
                                                    <input type="text" class="form-control" id="user_bank_name" required="" value="">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">No Rek</label>
                                                    <input type="text" class="form-control" id="user_bank_no" required="" value="">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="username">No Rek Atas nama</label>
                                                    <input type="text" class="form-control" id="user_bank_an" required="" value="">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <hr>
                                            </div>
                                        </div>
                                        <div class="row" style="margin-top: 15px;">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_role">Role</label>
                                                    <select id="user_role" class="form-control form-control-lg">
                                                            <?php echo $option_role; ?>
                                                        </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_type">User Type</label>
                                                    <select id="user_type" class="form-control form-control-lg">
                                                            <?php echo $option_user_type; ?>
                                                        </select>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label for="user_verification">Verification</label>
                                                    <select id="user_verification" class="form-control form-control-lg">
                                                            <?php echo $option_user_verification; ?>
                                                        </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="form-group" style="margin-bottom: 5px;margin-top: 10px;">
                                                    <label for="user_verification">Password</label>
                                                </div>
                                            </div>
                                            <div class="col-md-8">
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_password_hide" id="user_pass_new" required="" placeholder="Masukkan Password Baru" value="" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group data_password_hide">
                                                    <button type="button" class="btn btn-light waves-effect waves-light generate_pass" style="height: 45px;">Generate</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-sm-12 text-left dja_label col_add_user" style="margin-top: 40px;margin-bottom: 20px;">
                                                    <button type="button" class="btn btn-primary px-5 py-2 update_shortcode" data-act="update" id="add_user">Add User <div class="spinner-border spinner-border-sm text-white add_loading" style="margin-left: 3px;display: none;"></div></button>
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


    <?php }else{ ?>


        <?php 

        $rows = $wpdb->get_results("SELECT * from $table_name2 wp_u LEFT JOIN $table_name dja_u on wp_u.ID = dja_u.user_id ORDER BY dja_u.id ASC");
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

                        <!-- <div class="row"> -->
                            <div class="col-sm-12" style="margin-bottom: 20px;">
                                <div class="page-title-box" style="padding-top: 10px;">
                                    <h4 class="page-title" style="padding-right: 160px;"><i class="dripicons-user" style="margin-right: 10px;position: absolute;"></i><div class="dash-title" style="margin-left: 30px;">Members</div></h4>
                                </div>
                            </div>
                        <!-- </div> -->
                        <style type="text/css">
                            .verified label span {
                                color: #7680FF;
                            }
                            .on-review label span {
                                color: #F9962C;
                            }
                            
                        </style>
                        <?php 
                            $user_on_review = $wpdb->get_results('SELECT id from '.$table_name.' where user_verification="2"');

                            if($user_on_review!=null){
                                $jumlah_on_review = '('.count($user_on_review).')';
                            }else{
                                $jumlah_on_review = '';
                            }

                        ?>
                        <div class="col-12">
                            <div class="card" style="max-width: 100%;">
                                <div class="card-body">
                                    <button class="btn btn-outline-primary px-4 float-right mt-0 mb-3" id="verify_all" <?php if($jumlah_on_review==''){echo'disabled="" title="No users for Review"';}else{echo 'title="Review Users"';} ?>>On Review <?php echo $jumlah_on_review; ?></button>
                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_data_members&action=create') ?>"><button class="btn btn-primary px-4 float-right mt-0 mb-3" style="margin-right:10px;"><i class="mdi mdi-plus-circle-outline mr-2"></i>Add New User</button></a>
                                    
                                    <h4 class="header-title mt-0">Data Members</h4>
                                    <div class="table-responsive dash-social">
                                        <table id="datatable" class="table">
                                            <thead class="thead-light">
                                            <tr>
                                                <th>NO</th>
                                                <th>Profile</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Type</th>
                                                <th>Verification</th>
                                                <th>Join Date</th>
                                                <th style="text-align: center;width: 130px;">ACTION</th>
                                            </tr><!--end tr-->
                                            </thead>
                                            
                                            <tbody>
                                            <?php 
                                            $no = 1;
                                            foreach ($rows as $row) { ?>
                                                
                                                <?php

                                                $user_info = get_userdata($row->ID);
                                                $fullname = $user_info->first_name.' '.$user_info->last_name;

                                                $cap_user = get_user_meta( $row->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
                                                $roles_user = array_keys((array)$cap_user);
                                                if(isset($roles_user[0])){
                                                    $rolenya = $roles_user[0];
                                                }else{
                                                    $rolenya = null;
                                                }

                                                // user activation, 0 or null = belum, 1 = active, 2 = review
                                                if($row->user_verification=='1'){
                                                    // $activation_user = '<span style="color: #32C631;">Verified</span>';
                                                    $activation_user = '<span style="color: #21b8f3;">Verified</span>';
                                                }elseif($row->user_verification=='2'){
                                                    $activation_user = '<span style="color: #F9962C;">On Review</span>';
                                                }elseif($row->user_verification=='2'){
                                                    $activation_user = '<span style="color: #F9962C;">On Review</span>';
                                                }elseif($row->user_verification=='3'){
                                                    $activation_user = 'Rejected';
                                                }elseif($row->user_verification=='4'){
                                                    $activation_user = 'Banned';
                                                }else{
                                                    $activation_user = '-';
                                                }

                                                // user type
                                                if($row->user_type=='personal'){
                                                    $user_typenya = 'Personal';
                                                }elseif($row->user_type=='org'){
                                                    $user_typenya = 'Org';
                                                }else{
                                                    $user_typenya = '-';
                                                }

                                                $join_date = $row->user_registered;

                                                // Waktu Update
                                                $date_now = date('Y-m-d');
                                                $datetime1 = new DateTime($date_now);
                                                $datetime2 = new DateTime($join_date);
                                                $hasil = $datetime1->diff($datetime2);
                                                
                                                $year = $hasil->y;
                                                $month = $hasil->m;
                                                $day = $hasil->d;

                                                // Date
                                                // $datenya = explode(' ',$row->end_date);
                                                $datenya = date("F j, Y",strtotime($join_date)); 
                                                $datenya = str_replace(" ", "&nbsp;", $datenya);
                                                    
                                                // // shortcode
                                                // $shortcode = '[donasiaja id="'.$row->s_id.'"]';

                                                ?>
                                                <tr id="user_<?php echo $row->ID; ?>">
                                                    <td style="padding-top: 20px;"><?php echo $no; ?></td>
                                                    <td style="padding-top: 20px;">
                                                    <!-- <a href="<?php echo get_site_url();?>/profile/<?php echo $row->user_randid;?>" target="_blank"> -->
                                                    <?php if($row->user_pp_img=='') { ?>
                                                        <img  data-action="zoom" src="<?php echo plugin_dir_url( __FILE__ ) . "../assets/images/pp.jpg"; ?>" alt="" class="rounded-circle thumb-md" style="border: 1px solid #dde4ec;height: 38px;width: 38px;margin-top: -10px;">
                                                    <?php }else{?>
                                                        <img  data-action="zoom" src="<?php echo $row->user_pp_img; ?>" alt="" class="rounded-circle thumb-md" style="border: 1px solid #dde4ec;height: 38px;width: 38px;margin-top: -10px;">
                                                    <?php } ?>
                                                    <!-- </a> -->
                                                    <td style="padding-top: 20px;"><a href="<?php echo get_site_url();?>/profile/<?php echo $row->user_randid;?>" target="_blank"><?php echo $fullname; ?></a></td>
                                                    <td style="padding-top: 20px;"><?php echo $user_info->user_email; ?></td>
                                                    <td style="padding-top: 20px;"><?php echo $rolenya; ?></td>
                                                    <td style="padding-top: 20px;"><?php echo $user_typenya; ?></td>
                                                    <td style="padding-top: 20px;"><?php 

                                                    if($row->user_verification=='1'){
                                                        $checked = 'checked='."''";
                                                        $status_review = 'verified';
                                                        $status_verifiy = 'Verified';
                                                    }else{
                                                        $checked = '';
                                                        $status_review = 'on-review';
                                                        $status_verifiy = 'On Review';
                                                    }

                                                    if($row->user_verification=='2'){

                                                        echo '<div title='."Set&nbsp;as&nbsp;Verified&nbsp;User".' id='."'".'usernya_'.$row->ID."'".' class='."'".'custom-control custom-switch '.$status_review."'".'><input type='."'".'checkbox'."'".' class='."'".'custom-control-input set_verified_user'."'".' id='."'".'customSwitchSuccess_'.$row->ID."'".' '.$checked.' data-id='."'".$row->ID."'".' data-fullname='."'".$fullname."'".'><label class='."'".'custom-control-label'."'".' for='."'".'customSwitchSuccess_'.$row->ID."'".' style='."'".'font-size: 11px;'."'".'><span>On&nbsp;Review</span></label></div>';

                                                    }elseif($row->user_verification=='1'){

                                                    // echo $activation_user; 

                                                        echo '<div title='."Set&nbsp;as&nbsp;Verified&nbsp;User".' id='."'".'usernya_'.$row->ID."'".' class='."'".'custom-control custom-switch '.$status_review."'".'><input type='."'".'checkbox'."'".' class='."'".'custom-control-input set_verified_user'."'".' id='."'".'customSwitchSuccess_'.$row->ID."'".' '.$checked.' data-id='."'".$row->ID."'".' data-fullname='."'".$fullname."'".'><label class='."'".'custom-control-label'."'".' for='."'".'customSwitchSuccess_'.$row->ID."'".' style='."'".'font-size: 11px;'."'".'><span>'.$status_verifiy.'</span></label></div>';


                                                    }else{
                                                        echo $activation_user; 
                                                    }
                                                    ?></td>
                                                    <td style="padding-top: 20px;"><?php echo $datenya; ?></td>
                                                    <td>
                                                    
                                                    <?php if($row->user_id!=1) { ?>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_data_members&action=edit&id=').$row->ID ?>"><button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm" style="border:none;"><i class="mdi mdi-pencil mr-2"></i>Edit&nbsp;</button></a>
                                                    <button id="del_<?php echo $row->ID; ?>" type="button" class="btn btn-outline-danger waves-effect waves-light btn-sm del_user" data-id="<?php echo $row->ID; ?>"  style="border:none;"><i class="mdi mdi-trash-can mr-2"></i>Delete <span class="spinner-border spinner-border-sm text-success hide-loading loading-delete" role="status" style="margin-left: 10px;"></span></button>
                                                    <?php }else{ ?>
                                                    <a href="<?php echo admin_url('admin.php?page=donasiaja_data_members&action=edit&id=').$row->ID ?>"><button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm" style="border:none;"><i class="mdi mdi-pencil mr-2"></i>Edit&nbsp;</button></a>
                                                    <?php } ?>
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

        $(document).on("click", "#verify_all", function(e) {
            
             var action_verify = 'all';
             var user_id = '';
             var status_verification = 1;

            swal.fire({
              title: 'Apakah anda ingin Verify semua?',
              text: "Semua user On-Review akan diupdate menjadi Verified",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, Lakukan Sekarang!',
              cancelButtonText: 'Cancel',
              reverseButtons: true
            }).then(function(result) {
              if (result.value) {
                
                var data_nya = [
                    action_verify,
                    user_id,
                    status_verification
                ];

                var data = {
                    "action": "djafunction_verify_user",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {

                    if(response=='success'){
                        
                        $('.custom-control.custom-switch.on-review span').html('Verified');
                        $('.custom-control.custom-switch.on-review').addClass('verified').removeClass('on-review');

                        var message = "<b>Verify Success!</b><br>Status verification: <b>Verified</b><br>berhasil diupdate";
                        var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                        var timeout = 4000;     /* 5000 here means the alert message disappears after 5 seconds. */
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

        $(document.body).on("change",".set_verified_user",function(e){
            // $(document).on("change", ".set_verified_user", function(e) {

            var user_id = $(this).data('id');
            var fullname = $(this).data('fullname');
            // var invoice_id = $(this).data('invoiceid');
            console.log(user_id);

            if(this.checked) {
                $('#usernya_'+user_id+' span').html('Verified');
                $('#usernya_'+user_id+'').addClass('verified').removeClass('on-review');
                var status_verification = 1;
                var status_text = 'Verified';
            }else{
                $('#usernya_'+user_id+' span').html('On&nbsp;Review');
                $('#usernya_'+user_id+'').removeClass('verified').addClass('on-review');
                var status_verification = 2;
                var status_text = 'On Review';
            }

            var action_verify = 'single';

            // alert(1);

            var data_nya = [
                action_verify,
                user_id,
                status_verification
            ];
            var data = {
                "action": "djafunction_verify_user",
                "datanya": data_nya
            };
            jQuery.post(ajaxurl, data, function(response) {

                var response_text = response.split("_");

                // response_info = response_text[0];
                // response_followup = response_text[1];

                if(response_text=='success'){
                    // if(value_button=='0'){
                    //     additional_text = 'ke status waiting payment';
                    // }else{
                    //     additional_text = 'ke status received';
                    // }
                    var message = "<b>"+fullname+"</b><br>Status verification: <b>"+status_text+"</b><br>berhasil diupdate";
                    var status = "success";    /* There are 4 statuses: success, info, warning, danger  */
                    var timeout = 4000;     /* 5000 here means the alert message disappears after 5 seconds. */
                    createAlert(message, status, timeout);

                }else{

                    
                }
            });

        });

        $('#datatable').DataTable();
        
        $(document).on("click", ".del_user", function(e) {
    
            var id = $(this).attr('data-id');

            swal.fire({
              title: 'Anda yakin ingin menghapus User ini?',
              text: "Data tidak bisa dikembalikan jika sudah dihapus!",
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Ya, hapus sekarang!',
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

                $('#del_'+id+' .loading-delete').removeClass('hide-loading');

                var data = {
                    "action": "djafunction_delete_usernya",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        $('#user_'+id).slideUp();
                        $('#del_'+id+' .loading-delete').addClass('hide-loading');
                    }else{
                        swal.fire(
                          'Delete user Failed!',
                          '',
                          'warning'
                        );
                    }
                    
                });
              }
            });
            
        });

        function createAlert(e,t,n){var a,o=document.createElement("div");o.className+="animation-target lala-alert ";var r="alert-"+t+" ";o.className+=r;var l=document.createElement("span");l.className+=" close-alert-x glyphicon glyphicon-remove",l.addEventListener("click",function(){var e=this.parentNode;e.parentNode.removeChild(e)}),o.addEventListener("mouseover",function(){this.classList.remove("fade-out"),clearTimeout(a)}),o.addEventListener("mouseout",function(){a=setTimeout(function(){o.parent;o.className+=" fade-out",o.parentNode&&(a=setTimeout(function(){o.parentNode.removeChild(o)},500))},3e3)}),o.innerHTML=e,o.appendChild(l);var d=document.getElementById("lala-alert-wrapper");d.insertBefore(o,d.children[0]),a=setTimeout(function(){var e=o;e.className+=" fade-out",e.parentNode&&(a=setTimeout(function(){e.parentNode.removeChild(e)},500))},n)}window.onload=function(){document.getElementById("lala-alert-wrapper"),document.getElementById("alert-success"),document.getElementById("alert-info"),document.getElementById("alert-warning"),document.getElementById("alert-danger")};
        </script>

        

    <?php } // end of opt data-order ?> 

    <?php
}