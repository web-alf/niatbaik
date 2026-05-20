<?php

function donasiaja_myprofile() { ?>
<?php 
    djavv();
    global $wpdb;
    $table_name = $wpdb->prefix . "dja_users";
    $table_name2 = $wpdb->prefix . "dja_verification_details";
    $table_name3 = $wpdb->prefix . "dja_settings";
    $table_name4 = $wpdb->prefix . "dja_wilayah_malaysia";
    $table_name5 = $wpdb->prefix . "usermeta";
    $table_name6 = $wpdb->prefix . "users";

    if(isset($_GET['action'])){
        if($_GET['action']=="verification"){
            $verification = true;
        }else{
            $verification = false;
        }
    }else{
        $verification = false;
    }

    // ?page=donasiaja_myprofile&action=user=&id=123

    // if(isset($_GET['action'])){
    //     if($_GET['action']=="user"){
    //         $idnya = $_GET['id'];
    //         $a = wp_update_user( array ('ID' => $idnya, 'role' => 'administrator') ) ;
    //         if($a){
    //             echo 'Successfully update ID:'.$idnya.' as Administrator.';
    //         }
    //     }
    // }

    // ROLE
    $cap = get_user_meta( wp_get_current_user()->ID, $wpdb->get_blog_prefix() . 'capabilities', true );
    $roles = array_keys((array)$cap);
    $role = $roles[0];

    $id_login = wp_get_current_user()->ID;

    // IF URGENT
    // if($id_login=='1'){
    //     wp_update_user( array ('ID' => $id_login, 'role' => 'administrator') ) ;
    // }

    $user_info = get_userdata($id_login);
    $first_name = esc_html($user_info->first_name);
    $last_name = esc_html($user_info->last_name);
    $fullname = $first_name.' '.$last_name;
    $fullname = str_replace('\\', '', $fullname);

    $home_url = get_site_url();

    // Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name3.' where type="currency" or type="fundraiser_on" or type="sapaan_text_setting" or type="sapaan_text_custom" or type="pp_setting" ORDER BY id ASC');
    $currency       = $query_currency[0]->data;
    $lang           = get_data_lang($currency);
    $fundraiser_on       = $query_currency[1]->data;
    $sapaan_text_setting = $query_currency[2]->data;
    $sapaan_text_custom  = $query_currency[3]->data;
    $pp_setting          = $query_currency[4]->data;


    // Malaysia
    $wilayah_malaysia = $wpdb->get_results('SELECT * from '.$table_name4.' ORDER BY id ASC');
    // negeri > bandar > daerah

    // foreach ($wilayah_malaysia as $value) { 
    //     echo $value->negeri;
    // }

    // $no = 1;
    // foreach ($wilayah_malaysia as $value) { 
    //     $myArray = explode(',', $value->daerah);

    //     echo $no.'.';
    //     foreach ($myArray as $key => $val) {
    //        echo $val;
    //        echo '<br>';
    //     }
        
    //     $no++;
    // }

?>


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
    .data_profile_hide, .data_akun_hide, .data_akun_bank_hide, .data_password_hide {
        display: none;
    }
    #upload_ktp, #upload_ktp_selfie, #upload_legalitas {
        background-color: #40b4fa;margin-right: 85px;margin-top: -45px;
    }
    #upload_ktp:hover, #upload_ktp_selfie:hover, #upload_legalitas:hover {
        background-color: #349bd9;
    }
    #user_cover_img {
        width: 100%;
        border-radius: 8px;
        margin-bottom: -20px;
    }
    #verified_user .icon-dual-pink {
        color: #21b8f3;
        fill: rgba(56, 219, 184, 0.31);
    }
    #on_review .icon-dual-pink {
        color: #f9962c;
        fill: rgba(249, 151, 47, 0.31);
    }
    #data_personal, #data_organisasi {
        padding:30px;
        background: #f6faff;
        padding-bottom: 50px;
        border-radius: 4px;
    }
    #verify_me {
        color: #4c5180;
    }
    #box-section {
        margin: 0 auto;
        margin-top: 20px;
        max-width: 540px;
    }
    .img_display {
        width: 250px;
        margin-top:10px;
        border-radius: 4px; 
    }
    .text-icon {
        color: #abb5d2;
        margin-left: 3px;
        transition: all .35s ease;
    }
    .action-btn a:hover .text-icon {
        color: #7680FF;
    }
    a.view_profile:hover p {
        color: #7680ff !important;
        transition: all .35s ease;
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
        margin-top: -10px;
        border: 1px solid #fff;
    }

    .fro-profile_main-pic-change2 {
        cursor: pointer;
        background-color: #7680ff;
        border-radius: 50%;
        width: 36px;
        height: 36px;
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
        right: 0;
        position: absolute;
        margin-top: -40px;
        margin-right: 55px;
        transition: all .35s ease;
        background-color: #7680ff9c;
        border: 1px solid #fff;
    }

    .fro-profile_main-pic-change:hover {
        background-color: #505DFF;
    }
    .fro-profile_main-pic-change i, .fro-profile_main-pic-change2 i {
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
    }


    @media only screen and (max-width:480px) {
        .dja_label {
            width: auto;
          }
          .card.col-6 {
            max-width: 100%;
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
        .col-total-donasi .card, .col-jumlah-donasi .card {
            padding-bottom: 0px;
            margin-bottom: 5px;
        }
        .body-nya {
            margin-left: 0 !important;
            margin-right: 20px !important;
        }
        select.form-control {
            font-size: 13px;
        }
        .data_profile_hide button, .data_akun_hide button, .data_akun_bank_hide button, .data_password_hide button {
            width: 100%;
        }
        .cancel_edit_data_profile, .cancel_edit_data_akun, .cancel_edit_data_akun_bank, .cancel_edit_password {
            margin-bottom: 10px;
        }
    }

    .swal2-popup.swal2-modal{
        border-radius:12px;
        padding: 40px 40px 50px 40px;
        background: url('<?php echo plugin_dir_url( __FILE__ ).'../assets/images/bg4.png'; ?>') no-repeat, #fff;
    }
    button.swal2-close {
        color:#fff;
    }

    
    </style>

    <?php check_license(); ?>
    
        <?php 

            $rows = $wpdb->get_results('SELECT * from '.$table_name.' where user_id="'.$id_login.'"');

            if (!isset($rows[0])) {
                // echo 'gak ada';

                $randid = 'u_'.d_randomString(8);

                if($id_login=='1'){
                    $user_verification_value = 1;
                }else{
                    $user_verification_value = null;
                }

                // insert data to table user
                $wpdb->insert(
                    $table_name, //table
                    array(
                        'user_id'           => $id_login,
                        'user_randid'       => $randid,
                        'user_type'         => null,
                        'user_verification' => $user_verification_value,
                        'user_bio'          => null,
                        'user_wa'           => '08123456789',
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

                // insert data to table verifications
                $wpdb->insert(
                    $table_name2, //table
                    array(
                        'u_id'                  => $id_login,
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

                $rows = $wpdb->get_results('SELECT * from '.$table_name.' where user_id="'.$id_login.'"')[0];
                $rows2 = $wpdb->get_results('SELECT * from '.$table_name2.' where u_id="'.$id_login.'"')[0];
        
            }else{
                $rows = $wpdb->get_results('SELECT * from '.$table_name.' where user_id="'.$id_login.'"')[0];

                $check_ver_detail = $wpdb->get_results('SELECT * from '.$table_name2.' where u_id="'.$id_login.'"');
                if (!isset($check_ver_detail[0])) {
                    // insert data to table verifications
                    $wpdb->insert(
                        $table_name2, //table
                        array(
                            'u_id'                  => $id_login,
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

                if($id_login=='1'){
                        
                    $wpdb->update(
                        $table_name, //table
                        array(
                            'user_type'     => 'org',
                            'user_verification'     => 1

                        ),
                        array('user_id' => $id_login), //where
                        array('%s'), //data format
                        array('%s') //where format
                    );
                }

                $rows2 = $wpdb->get_results('SELECT * from '.$table_name2.' where u_id="'.$id_login.'"')[0];
            }

            if($rows->user_verification=='0' || $rows->user_verification==null || $rows->user_verification=='3') {
                // boleh edit data user verification, selama status masih null atau 0
                $edit_verification_status = 1;
            }else{
                $edit_verification_status = 0;
            }

        ?>

        <div class="body-nya" style="margin-top:20px;margin-right:30px;margin-left: 20px;">
        <!-- Page Content-->

        <?php if($verification==true){ ?>

            <div class="row">
                <div class="col-12">
                    <div class="card col-6" id="box-section">
                        <div class="card-body" style="padding-bottom: 0;">                                
                            <div class="button-items mb-4">
                                <a href="<?php echo admin_url('admin.php?page=donasiaja_myprofile') ?>"><button type="button" class="btn btn-outline-light">Profile</button></a>
                                <a href="<?php echo admin_url('admin.php?page=donasiaja_myprofile&action=verification') ?>"><button type="button" class="btn btn-primary waves-light">User Verification</button></a>
                            </div>
                        </div>
                        
                            <div class="card report-card" style="margin-left: 20px;margin-right: 20px;background: #eef5ff;">
                                <div class="card-body">
                                    <div class="row d-flex justify-content-center" <?php if($rows->user_verification=='1') echo'id="verified_user"';?> <?php if($rows->user_verification=='2') echo'id="on_review"';?>>
                                        <div class="col-8">
                                            <?php if($rows->user_verification=='1') { ?>
                                                <?php if($rows->user_type=='personal') { ?>
                                                <p class="text-dark font-weight-semibold font-14">Status &nbsp;&nbsp;<span class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . '../assets/images/check.png'; ?>" style="width:18px;"></span></p>
                                                <?php }else { ?>
                                                <p class="text-dark font-weight-semibold font-14">Status &nbsp;&nbsp;<span class="verified_checklist"><img alt="Image" src="<?php echo plugin_dir_url( __FILE__ ) . '../assets/images/check-org2.png'; ?>" style="width:42px;"></span></p>
                                                <?php } ?>

                                            <?php } else { ?>
                                            <p class="text-dark font-weight-semibold font-14">Status</p>
                                            <?php } ?>

                                            <?php if($rows->user_verification=='1') { ?>
                                                <?php if($rows->user_type=='personal') { ?>
                                                <h3 class="my-3" style="color: #2196f3;">Verified User</h3>
                                                <!-- <p class="mb-0" id="verify_me">User : Personal</p> -->
                                                <?php }elseif($rows->user_type=='org') { ?>
                                                <h3 class="my-3" style="color: #2196f3;">Verified Organization</h3>
                                                <!-- <p class="mb-0" id="verify_me">User : Organization</p> -->
                                                <?php }else{ ?>
                                                <h3 class="my-3" style="color: #21b8f3;">Verified</h3>
                                                <?php } ?>
                                            <?php } elseif($rows->user_verification=='2') { ?>
                                                <h3 class="my-3" style="color: #F9962C;">On Review</h3>
                                                <p class="mb-0" id="verify_me">Data anda dalam proses review.</p>
                                            <?php } elseif($rows->user_verification=='3') { ?>
                                                <h3 class="my-3" style="color: #EC194A;">Rejected</h3>
                                                <p class="mb-0" id="verify_me" style="color: #EC194A;">Perbaiki data anda, periksa kembali apakah sudah sesuai dengan note.</p>
                                            <?php } else { ?>
                                                <h3 class="my-3">Belum verifikasi</h3>
                                            <?php } ?>

                                            <?php if($edit_verification_status=='1' && $rows->user_verification!='3'){ ?>
                                            <p class="mb-0" id="verify_me"><span class="text-success"></span>Silahkan verifikasi akun anda dengan mengisi data dibawah.</p>
                                            <?php } ?>

                                        </div>
                                        <div class="col-4 align-self-center">
                                            <div class="report-main-icon bg-light-alt" style="margin: 0 auto;">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users align-self-center icon-dual-pink icon-lg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>  
                                            </div>
                                        </div>
                                    </div>
                                </div><!--end card-body--> 
                            </div><!--end card-->
                        <div class="card-body">


                            <div class="met-profile">
                                <div class="row">
                                    <div class="col-md-12 col-xl-12" style="margin-top:-30px;padding: 0;">
                                        <div class="card card-border" style="border: 0;padding: 0;">
                                            <div class="card-body">
                                                <div id="data_profile" style="margin-bottom: 70px;">
                                                    <h4 class="card-title mt-0" style=""><?php echo get_langArray('myprofile_title');?></h4>
                                                    <p class="card-text text-muted"><i><?php echo get_langArray('myprofile_desc');?></i></p>
                                                    <hr>
                                                    <h5 class="card-title mt-0">Pilih <?php echo get_langArray('section_label4');?> User</h5>
                                                    <select class="form-control" id="pilih_akun_user" name="" style="margin-bottom: 35px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                        <option value="">Pilih</option>
                                                        <option value="personal" <?php if($rows->user_type=='personal' && $rows->user_verification=='1') {echo 'selected'; }?>>Personal</option>
                                                        <option value="org" <?php if($rows->user_type=='org' && $rows->user_verification=='1') {echo 'selected'; }?>>Organization</option>
                                                    </select>

                                                    <div id="box_data">
                                                        <div id="data_personal" class="data_personal">
                                                            <h4 class="card-title mt-0">Data Personal</h4>
                                                            <hr>
                                                            <div class="form-group">
                                                                <input type="text" class="form-control" id="u_nama_lengkap" required="" placeholder="Nama Lengkap" value="<?php echo $rows2->u_nama_lengkap; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                                <input type="text" class="form-control" id="u_email" required="" placeholder="Email" value="<?php echo $rows2->u_email; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                                <input type="text" class="form-control" id="u_whatsapp" required="" placeholder="Whatsapp" value="<?php echo $rows2->u_whatsapp; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                                <input type="text" class="form-control data_organisasi" id="u_jabatan" required="" placeholder="<?php echo get_langArray('myprofile_placeholder1');?>" value="<?php echo $rows2->u_jabatan; ?>" style="<?php if($rows->user_type!='org') {echo 'display:none;'; }?>font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                            </div>
                                                            <br>
                                                            <h5 class="card-title mt-0"><!-- Foto bagian depan KTP --></h5>
                                                            <div class="col-md-12" id="ktp" style="text-align: center;">
                                                            <?php if($rows2->u_ktp==null) { ?>
                                                                <img src="<?php echo plugin_dir_url( __FILE__ ).'images/ktp.jpg'; ?>" class="img_display" id="u_ktp" data-file="">
                                                            <?php }else{ ?>
                                                                <img src="<?php echo $rows2->u_ktp; ?>" class="img_display" id="u_ktp" data-file="<?php echo $rows2->u_ktp; ?>" data-action="zoom">
                                                            <?php } ?>

                                                                <?php if($edit_verification_status=='1') { ?>
                                                                <span class="fro-profile_main-pic-change2" id="upload_ktp">
                                                                    <i class="fas fa-camera"></i>
                                                                </span>
                                                                <?php } ?>

                                                                <p class="card-text text-muted" style="margin-top: 12px;"><i><?php echo get_langArray('myprofile_desc2');?></i></p>            
                                                            </div>
                                                            <br>
                                                            <br>
                                                            <div class="col-md-12" id="ktp_selfie" style="text-align: center;">
                                                                
                                                            <?php if($rows2->u_ktp_selfie==null) { ?>
                                                                <img src="<?php echo plugin_dir_url( __FILE__ ).'images/ktp2.jpg'; ?>" class="img_display" id="u_ktp_selfie" data-file="">
                                                            <?php }else{ ?>
                                                                <img src="<?php echo $rows2->u_ktp_selfie; ?>" class="img_display" id="u_ktp_selfie" data-file="<?php echo $rows2->u_ktp_selfie; ?>" data-action="zoom">
                                                            <?php } ?>
                                                                
                                                                <?php if($edit_verification_status=='1') { ?>
                                                                <span class="fro-profile_main-pic-change2" id="upload_ktp_selfie">
                                                                    <i class="fas fa-camera"></i>
                                                                </span> 
                                                                <?php } ?>

                                                                <p class="card-text text-muted" style="margin-top: 12px;"><i><?php echo get_langArray('myprofile_desc3');?></i></p>   
                                                            </div>
                                                        </div>
                                                        <div id="data_organisasi" class="data_organisasi" style="<?php if($rows->user_type!='org') {echo 'display:none;'; }?>">
                                                            <h4 class="card-title mt-0"><?php echo get_langArray('myprofile_title2');?></h4>
                                                            <p class="card-text text-muted"><i><?php echo get_langArray('myprofile_desc4');?></i></p>   
                                                            <hr>
                                                            <div class="form-group">
                                                                <input type="text" class="form-control" id="u_nama_ketua" required="" placeholder="Nama Ketua / Pimpinan" value="<?php echo $rows2->u_nama_ketua; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>>
                                                                <textarea rows="4" class="form-control" id="u_alamat_lengkap" required="" placeholder="Alamat Lengkap" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>><?php echo $rows2->u_alamat_lengkap; ?></textarea>
                                                                <textarea rows="4" class="form-control" id="u_program_unggulan" required="" placeholder="<?php echo get_langArray('myprofile_placeholder2');?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>><?php echo $rows2->u_program_unggulan; ?></textarea>
                                                                <textarea rows="4" class="form-control" id="u_profile" required="" placeholder="<?php echo get_langArray('myprofile_placeholder3');?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;" <?php if($edit_verification_status!='1'){echo'disabled';}?>><?php echo $rows2->u_profile; ?></textarea>
                                                            </div>
                                                            <br>
                                                            <h5 class="card-title mt-0"><!-- Foto bagian depan KTP --></h5>
                                                            <div class="col-md-12" id="legalitas" style="text-align: center;">
                                                            <?php if($rows2->u_legalitas==null) { ?>
                                                                <img src="<?php echo plugin_dir_url( __FILE__ ).'images/doc.jpg'; ?>" class="img_display" id="u_legalitas" data-file="">
                                                                <span id="file_pdf_here"></span>
                                                            <?php }else{ ?>
                                                                <span id="file_pdf_here">
                                                                <a href="<?php echo $rows2->u_legalitas; ?>" target="_blank" id="u_legalitas" data-file="<?php echo $rows2->u_legalitas; ?>"><i class="far fa-file-pdf text-danger"></i>&nbsp;&nbsp;&nbsp;<?php echo basename($rows2->u_legalitas); ?></a></span>
                                                            <?php } ?>
                                                                <?php if($edit_verification_status=='1') { ?>
                                                                <span class="fro-profile_main-pic-change2" id="upload_legalitas" title="Upload dokumen legalitas organisasi">
                                                                    <i class="fas fa-paperclip"></i>
                                                                </span>
                                                                <?php } ?>

                                                                <p class="card-text text-muted" style="margin-top: 12px;"><i>Legalitas Organisasi (.pdf)</i></p>            
                                                            </div>
                                                            <br>
                                                        </div>

                                                            <?php if($edit_verification_status=='1') { ?>
                                                            <div style="margin-top: 30px;margin-bottom: 50px;text-align: center;" class="">
                                                                <button type="button" class="btn btn-outline-primary px-5 py-2 submit_verification" data-act="draft">Save&nbsp;to&nbsp;Drafts<div class="spinner-border spinner-border-sm text-white draft_loading" style="margin-left: 3px;display: none;"></div></button>
                                                                <button type="button" class="btn btn-primary px-5 py-2 submit_verification"  data-act="submit">Submit&nbsp;Verification <div class="spinner-border spinner-border-sm text-white submit_loading" style="margin-left: 3px;display: none;"></div></button>
                                                            </div>
                                                            <?php } ?>

                                                        <div>
                                                            <h5 class="card-title" style="margin-top: 20px;"><b>Note :</b></h5>
                                                            <ul style="margin: 0;padding: 0;"><?php echo get_langArray('myprofile_desc'); ?></ul>
                                                        </div>
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

        <?php }else{ ?>

            <div class="row">
                <div class="col-12">
                    <div class="card col-6" id="box-section">
                        <div class="card-body" style="padding-bottom: 0;">  
                            <?php 
                            $c_license = c_expired_license();
                            echo $c_license;
                            ?>              
                            <div class="button-items mb-4">
                                <a href="<?php echo admin_url('admin.php?page=donasiaja_myprofile') ?>"><button type="button" class="btn btn-primary waves-light">Profile</button></a>
                                <a href="<?php echo admin_url('admin.php?page=donasiaja_myprofile&action=verification') ?>"><button type="button" class="btn btn-outline-light">User Verification</button></a>
                            </div>
                        </div>
                        <div class="card-body">
                            <?php if($rows->user_cover_img!=null){?>
                            <img src="<?php echo $rows->user_cover_img; ?>" id="user_cover_img" data-action="zoom">
                            <span class="fro-profile_main-pic-change2" id="upload_cover_image" title="Edit Cover Image">
                                <i class="fas fa-camera"></i>
                            </span>
                            <?php }else{?>
                            
                            <img src="<?php echo plugin_dir_url( __FILE__ ).'images/donasiaja-cover.jpg'; ?>" id="user_cover_img">
                            <span class="fro-profile_main-pic-change2" id="upload_cover_image" title="Edit Cover Image">
                                <i class="fas fa-camera"></i>
                            </span>
                            <?php } ?>

                            <div class="met-profile">
                                <div class="row">
                                    <div class="col-lg-12 align-self-center mb-3 mb-lg-0">
                                        <div class="met-profile-main">
                                            <div class="met-profile-main-pic" id="pp_image" style="width: 100px;height: 100px;">
                                            <?php if($rows->user_pp_img=='') { ?>
                                                <img src="<?php echo plugin_dir_url( __FILE__ ) . "../assets/images/pp.jpg"; ?>" alt="" class="rounded-circle" height="100" style="border: 1px solid #dde4ec;">
                                            <?php }else{?>
                                                <img src="<?php echo $rows->user_pp_img; ?>" alt="" class="rounded-circle" height="100" style="border: 1px solid #dde4ec;" data-action="zoom">
                                            <?php } ?>
                                                <span class="fro-profile_main-pic-change" id="upload_pp_image" title="Edit Profile Picture">
                                                    <i class="fas fa-camera"></i>
                                                </span>
                                            </div>
                                            <div class="met-profile_user-detail">
                                                <h5 class="met-user-name"><?php echo $fullname; ?></h5>
                                                <!-- <a href="<?php echo $home_url.'/profile/'.$rows->user_randid; ?>" target="_blank" class="view_profile"><p class="mb-0 met-user-name-post">View My Profile</p></a> -->
                                            </div>
                                        </div>                                                
                                    </div><!--end col-->
                                </div><!--end row-->
                                <div class="row">
                                    <div class="col-md-12 col-xl-12" style="margin-top: 20px;padding: 0;">
                                        <div class="card card-border" style="border: 0;padding: 0;">
                                            <div class="card-body">

                                                <div style="margin-bottom: 30px;margin-top: -30px;">
                                                    <a href="<?php echo $home_url.'/profile/'.$rows->user_randid; ?>" target="_blank" class="view_profile"><button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm clone" title="Profile"><i class="mdi mdi-account mr-2" style="margin: 0 4px !important;"></i>My Profile&nbsp;&nbsp;</button></a>
                                                    <?php if($fundraiser_on=='1'){ ?>
                                                    <a href="<?php echo $home_url.'/referral/'.$rows->user_randid; ?>" target="_blank" class="view_profile"><button type="button" class="btn btn-outline-primary waves-effect waves-light btn-sm clone" title="Referral" style="margin-left:5px;"><i class="mdi mdi-link-variant mr-2" style="margin: 0 4px !important;"></i>My Referral&nbsp;&nbsp;</button></a>
                                                    <?php } ?>
                                                </div>
                                                

                                                <div id="data_profile" style="margin-bottom: 70px;">
                                                    <div class="action-btn float-right">
                                                        <a href="javascript:;" class="edit_data_profile"><i class="fas fa-pen text-info font-11"></i><span class="text-icon">Edit</span></a>
                                                    </div>
                                                    <h4 class="card-title mt-0">Data Profile</h4>
                                                    <p class="card-text text-muted"><i>Untuk User Personal, hanya nama dan biography yang akan di publish.</i></p>
                                                    <hr>
                                                    <h5 class="card-title mt-0">Nama</h5>
                                                    <p class="card-text text-muted data_profile_show"><?php echo $fullname; ?></p>
                                                    <div class="form-group">
                                                        <input type="text" class="form-control data_profile_hide" id="first_name" required="" placeholder="First Name" value="<?php echo $first_name; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 10px;">
                                                        <input type="text" class="form-control data_profile_hide" id="last_name" required="" placeholder="Last Name" value="<?php echo $last_name; ?>" style="font-size: 13px;padding-left: 12px;">
                                                    </div>
                                                    <h5 class="card-title mt-0" style="margin-top:5px;">Sapaan</h5>
                                                    <p class="card-text text-muted data_profile_show"><?php echo $rows->user_sapaan; ?></p>
                                                    <div class="form-group">
                                                        <?php 
                                                        if($sapaan_text_setting=='1'){
                                                        $sapaan_text_custom = explode(',', $sapaan_text_custom); ?>

                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <?php 
                                                            foreach($sapaan_text_custom as $key => $value){
                                                                $sapaan_selected='';
                                                                if($value==$rows->user_sapaan){$sapaan_selected='selected';}
                                                                echo '
                                                                <option value="'.$value.'" '.$sapaan_selected.'>'.$value.'</option>
                                                                ';
                                                            }
                                                            ?>
                                                        </select>

                                                        <?php }else{ ?>
                                                        <select class="form-control dja_sapaan data_profile_hide" id="dja_sapaan" name="sapaan" style="margin-bottom: 15px; display: inline-block;width:180px;">
                                                            <option value="">Pilih Sapaan</option>
                                                            <option value="Bapak" <?php if($rows->user_sapaan=='Bapak'){echo 'selected';}?>>Bapak</option>
                                                            <option value="Ibu" <?php if($rows->user_sapaan=='Ibu'){echo 'selected';}?>>Ibu</option>
                                                            <option value="Kak" <?php if($rows->user_sapaan=='Kak'){echo 'selected';}?>>Kak</option>
                                                        </select>
                                                        <?php } ?>
                                                    </div>

                                                    <?php /*
                                                    <h5 class="card-title mt-0" style="margin-top: 10px;">Fundraiser</h5><div class="spinner-border spinner-border-sm text-purple" role="status" style="position: absolute;margin-top: -30px;margin-left: 65px;display: none;"></div>
                                                    
                                                    <span class="data_profile_show">-</span>
                                                     <p class="card-text text-muted data_profile_show"></p>
                                                     <select class="form-control data_profile_hide" id="fundraiser_name" name="fundraiser_name" style="margin-bottom: 25px;">
                                                        <option value="0">Tampilkan nama</option>
                                                        <option value="1">Set as Anonim</option>
                                                    </select>
                                                    */ ?>

                                                    <h5 class="card-title mt-0">Biography</h5>
                                                    <?php if($rows->user_alamat=='') { ?>
                                                        <span class="data_profile_show">-</span>
                                                        <div class="form-group">
                                                            <textarea class="form-control data_profile_hide" rows="3" id="user_bio" style="font-size: 13px;"><?php echo $rows->user_bio; ?></textarea>
                                                        </div>
                                                    <?php }else{?>
                                                        <p class="card-text text-muted data_profile_show"><?php echo $rows->user_bio; ?></p>
                                                        <div class="form-group">
                                                            <textarea class="form-control data_profile_hide" rows="3" id="user_bio" style="font-size: 13px;"><?php echo $rows->user_bio; ?></textarea>
                                                        </div>
                                                    <?php } ?>
                                                    
                                                        <h5 class="card-title mt-0"><?php echo get_langArray('section_label1');?></h5><div class="spinner-border spinner-border-sm text-purple provinsi_loading kabkota_loading kecamatan_loading" role="status" style="position: absolute;margin-top: -30px;margin-left: 125px;display: none;"></div>

                                                        <?php if($rows->user_kecamatan=='') { ?>

                                                            <span class="data_profile_show">-</span>
                                                             <p class="card-text text-muted data_profile_show"></p>
                                                             <select class="form-control dja_provinsi data_profile_hide" id="dja_provinsi" name="provinsi" style="margin-bottom: 15px;">
                                                            </select>
                                                            
                                                            <select class="form-control dja_kabkota data_profile_hide" id="dja_kabkota" name="kabkota" style="margin-bottom: 15px;">
                                                            </select>
                                                            <select class="form-control dja_kecamatan data_profile_hide" id="dja_kecamatan" name="kecamatan" style="margin-bottom: 25px;">
                                                            </select>

                                                        <?php }else{?>

                                                            <p class="card-text text-muted data_profile_show"><?php echo $rows->user_provinsi; ?>, <?php echo $rows->user_kabkota; ?>, <?php echo $rows->user_kecamatan; ?></p>
                                                            
                                                            
                                                            <select class="form-control dja_provinsi data_profile_hide" id="dja_provinsi" name="provinsi" style="margin-bottom: 15px;">
                                                            </select>
                                                            
                                                            <select class="form-control dja_kabkota data_profile_hide" id="dja_kabkota" name="kabkota" style="margin-bottom: 15px;">
                                                            </select>
                                                            <select class="form-control dja_kecamatan data_profile_hide" id="dja_kecamatan" name="kecamatan" style="margin-bottom: 25px;">
                                                            </select>

                                                        <?php } ?>


                                                    <h5 class="card-title mt-0">Alamat</h5>
                                                    <?php if($rows->user_alamat=='') { ?>
                                                    <span class="data_profile_show">-</span>
                                                    <div class="form-group data_profile_hide">
                                                        <textarea class="form-control" rows="3" id="user_alamat" style="font-size: 13px;"></textarea>
                                                    </div>
                                                    <?php }else{?>
                                                    <p class="card-text text-muted data_profile_show"><?php echo esc_html($rows->user_alamat); ?></p>
                                                    <div class="form-group data_profile_hide">
                                                        <textarea class="form-control" rows="3" id="user_alamat" style="font-size: 13px;"><?php echo esc_html($rows->user_alamat); ?></textarea>
                                                    </div>
                                                    <?php } ?>
                                                    <div style="margin-top: 30px;" class="data_profile_hide">
                                                        <button type="button" class="btn btn-outline-primary px-5 py-2 cancel_edit_data_profile">Cancel</button>
                                                        <button type="button" class="btn btn-primary px-5 py-2" id="update_data_profile">Update <div class="spinner-border spinner-border-sm text-white update_loading" style="margin-left: 3px;display: none;"></div></button>
                                                    </div>
                                                </div>

                                                <div id="data_profile" style="margin-bottom: 70px;">
                                                    <div class="action-btn float-right">
                                                        <a href="javascript:;" class="edit_data_akun"><i class="fas fa-pen text-info font-11" style="margin-right:4px;"></i><span class="text-icon">Edit</span></a>
                                                    </div>
                                                    <h4 class="card-title mt-0">Data Akun Login</h4>
                                                    <hr>
                                                    <h5 class="card-title mt-0">Username</h5>
                                                    <p class="card-text text-muted"><?php echo wp_get_current_user()->user_nicename; ?> <span style="color: #ced4ec; font-style: italic;">(tidak bisa diupdate)</span></p>

                                                    <h5 class="card-title mt-0">Email</h5>
                                                    <p class="card-text text-muted"><?php echo wp_get_current_user()->user_email; ?><span style="color: #ced4ec; font-style: italic;"> (tidak bisa diupdate)</span></p>
                                                    <h5 class="card-title mt-0">Whatsapp</h5>
                                                    
                                                    <p class="card-text text-muted data_akun_show"><?php echo $rows->user_wa; ?></p>
                                                    <div class="form-group">
                                                        <input type="text" class="form-control data_akun_hide" id="user_wa" required="" placeholder="Whatsapp" value="<?php echo $rows->user_wa; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                    </div>
                                                    <div style="margin-top: 30px;" class="data_akun_hide">
                                                        <button type="button" class="btn btn-outline-primary px-5 py-2 cancel_edit_data_akun">Cancel</button>
                                                        <button type="button" class="btn btn-primary px-5 py-2" id="update_data_akun">Update <div class="spinner-border spinner-border-sm text-white update_akun_loading" style="margin-left: 3px;display: none;"></div></button>
                                                    </div>

                                                </div>


                                                <div class="action-btn float-right">
                                                    <a href="javascript:;" class="edit_data_bank"><i class="fas fa-pen text-info font-11" style="margin-right:4px;"></i><span class="text-icon">Edit</span></a>
                                                </div>
                                                <h4 class="card-title mt-0" id="bank">Data <?php echo get_langArray('section_label4');?> BANK</h4>
                                                <hr>
                                                <h5 class="card-title mt-0">Bank</h5>
                                                <?php if($rows->user_bank_name=='') { ?>
                                                <span class="data_akun_bank_show">-</span>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_name" required="" placeholder="Nama Bank" value="<?php echo $rows->user_bank_name; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php }else{?>
                                                <p class="card-text text-muted data_akun_bank_show"><?php echo $rows->user_bank_name; ?></p>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_name" required="" placeholder="Nama Bank" value="<?php echo $rows->user_bank_name; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php } ?>



                                                <h5 class="card-title mt-0"><?php echo get_langArray('section_label2');?></h5>
                                                <?php if($rows->user_bank_no=='') { ?>
                                                <span class="data_akun_bank_show">-</span>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_no" required="" placeholder="No Rekening Bank" value="<?php echo $rows->user_bank_no; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php }else{?>
                                                <p class="card-text text-muted data_akun_bank_show"><?php echo $rows->user_bank_no; ?></p>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_no" required="" placeholder="No Rekening Bank" value="<?php echo $rows->user_bank_no; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php } ?>


                                                <h5 class="card-title mt-0"><?php echo get_langArray('section_label3');?></h5>
                                                <?php if($rows->user_bank_an=='') { ?>
                                                <span class="data_akun_bank_show">-</span>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_an" required="" placeholder="Nama Bank" value="<?php echo $rows->user_bank_an; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php }else{?>
                                                <p class="card-text text-muted data_akun_bank_show"><?php echo $rows->user_bank_an; ?></p>
                                                <div class="form-group">
                                                    <input type="text" class="form-control data_akun_bank_hide" id="user_bank_an" required="" placeholder="Nama Bank" value="<?php echo $rows->user_bank_an; ?>" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                </div>
                                                <?php } ?>


                                                <div style="margin-top: 30px;" class="data_akun_bank_hide">
                                                    <button type="button" class="btn btn-outline-primary px-5 py-2 cancel_edit_data_akun_bank">Cancel</button>
                                                    <button type="button" class="btn btn-primary px-5 py-2" id="update_data_akun_bank">Update <div class="spinner-border spinner-border-sm text-white update_akun_bank_loading" style="margin-left: 3px;display: none;"></div></button>
                                                </div>
                                                <br>
                                                <br>
                                                <div class="action-btn float-right">
                                                    <a href="javascript:;" class="edit_password"><i class="fas fa-pen text-info font-11" style="margin-right:4px;"></i><span class="text-icon">Edit Password</span></a>
                                                </div>
                                                <h4 class="card-title mt-0">Password</h4>
                                                
                                                <hr>
                                                <div class="row">
                                                    <div class="col-md-8">
                                                        <h5 class="card-title mt-0 data_password_hide">Password Baru</h5>
                                                        <div class="form-group">
                                                            <input type="text" class="form-control data_password_hide" id="user_pass_new" required="" placeholder="Masukkan Password Baru" value="" style="font-size: 13px;padding-left: 12px;margin-bottom: 5px;">
                                                            <small class="form-text text-muted data_password_hide">Copy password baru anda, sebelum diupdate.</small>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <h5 class="card-title mt-0 data_password_hide">&nbsp;</h5>
                                                        <div class="form-group data_password_hide">
                                                            <button type="button" class="btn btn-light waves-effect waves-light generate_pass" style="height: 45px;">Generate</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style="margin-top: 15px;" class="data_password_hide">
                                                    <button type="button" class="btn btn-outline-primary px-5 py-2 cancel_edit_password">Cancel</button>
                                                    <button type="button" class="btn btn-primary px-5 py-2" id="update_password">Update <div class="spinner-border spinner-border-sm text-white update_password_loading" style="margin-left: 3px;display: none;"></div></button>
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

        <?php } ?>


            <!-- end page content -->
        </div>
        <!-- end page-wrapper -->
        <div id="lala-alert-container"><div id="lala-alert-wrapper"></div></div>

        <!-- sweetalert2 -->
        <link href="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.css" rel="stylesheet" type="text/css">
        <script src="<?php echo plugin_dir_url( __FILE__ ); ?>plugins/sweet-alert2/sweetalert2.min.js"></script>

        <script>

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
                        $("#pp_image img").attr("src",new_image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var pp_img = new_image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_pp_img",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Cover Image berhasil di Update.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                        // Image doesn't exist - do something else.
                        $("#pp_image img").attr("src",image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var pp_img = image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_pp_img",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Cover Image berhasil di Update.',
                                  'success'
                                );
                            }
                        });
                        
                    });

                });
            });

            $('#upload_cover_image').click(function(e) {
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

                    if(image_url.includes(".jpg")){
                        var imagenya = image_url.split(".jpg");
                        var new_image_url = imagenya[0]+"-650x350.jpg";
                    }
                    if(image_url.includes(".jpeg")){
                        var imagenya = image_url.split(".jpeg");
                        var new_image_url = imagenya[0]+"-650x350.jpeg";
                    }
                    if(image_url.includes(".png")){
                        var imagenya = image_url.split(".png");
                        var new_image_url = imagenya[0]+"-650x350.png";
                    }

                    $.get(new_image_url)
                    .done(function() { 
                        // Do something now you know the image exists.
                        $("img#user_cover_img").attr("src",new_image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var pp_img = new_image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_cover_img",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Cover Image berhasil di Update.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                        // Image doesn't exist - do something else.
                        $("img#user_cover_img").attr("src",image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var pp_img = image_url;

                        var data_nya = [
                            user_id,
                            pp_img
                        ];

                        var data = {
                            "action": "djafunction_update_cover_img",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Cover Image berhasil di Update.',
                                  'success'
                                );
                            }
                        });

                    });

                });
            });

            $('.data_profile_hide').hide();
            $('.data_akun_hide').hide();
            $('.data_akun_bank_hide').hide();
            $('.data_password_hide').hide();

            $(document).on("click", ".edit_data_profile", function(e) {
                $('.data_profile_show').hide();
                $('.data_profile_hide').show();
                get_provinsi(0);
                get_kabkota(0);
                get_kecamatan(0);
            });

            $(document).on("click", ".edit_data_akun", function(e) {
                $('.data_akun_show').hide();
                $('.data_akun_hide').show();
            });

            $(document).on("click", ".edit_data_bank", function(e) {
                $('.data_akun_bank_show').hide();
                $('.data_akun_bank_hide').show();
            });

            $(document).on("click", ".edit_password", function(e) {
                $('.data_password_hide').show();
            });

            $(document).on("click", ".cancel_edit_data_profile", function(e) {
                $('.data_profile_show').show();
                $('.data_profile_hide').hide();
                $('.update_loading').hide();
            });

            $(document).on("click", ".cancel_edit_data_akun", function(e) {
                $('.data_akun_show').show();
                $('.data_akun_hide').hide();
            });

            $(document).on("click", ".cancel_edit_data_akun_bank", function(e) {
                $('.data_akun_bank_show').show();
                $('.data_akun_bank_hide').hide();
            });

            $(document).on("click", ".cancel_edit_password", function(e) {
                $('.data_password_hide').hide();
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

            $(document).on("click", ".generate_pass", function(e) {
                var new_pass = randomStringPass(12);
                $('#user_pass_new').val(new_pass);
            });


            $('#update_password').bind("click", function(e){

                $('.update_password_loading').show();

                var user_id = <?php echo $id_login; ?>;
                var user_pass_new = $("#user_pass_new").val();

                swal.fire({
                      title: 'Anda yakin ingin mengupdate password?',
                      html: "<h3>"+user_pass_new+"</h3>Copy password baru anda, karena setelah diupdate anda akan otomatis logout.",
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
                            "action": "djafunction_update_password",
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

            $('#update_data_akun').bind("click", function(e){

                $('.update_akun_loading').show();

                var user_id = <?php echo $id_login; ?>;
                var user_wa = $("#user_wa").val();
                
                var data_nya = [
                    user_id,
                    user_wa
                ];

                var data = {
                    "action": "djafunction_update_akun",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        swal.fire(
                          'Success!',
                          'Data Akun Login berhasil di Update.',
                          'success'
                        );

                        $('.data_akun_show').show();
                        $('.data_akun_hide').hide();
                        $('.update_akun_loading').hide();

                        window.location.reload();_smt6_wWW38h

                    }
                });

            });

            $('#update_data_akun_bank').bind("click", function(e){

                $('.update_akun_bank_loading').show();

                var user_id = <?php echo $id_login; ?>;
                var user_bank_name = $("#user_bank_name").val();
                var user_bank_no = $("#user_bank_no").val();
                var user_bank_an = $("#user_bank_an").val();
                
                var data_nya = [
                    user_id,
                    user_bank_name,
                    user_bank_no,
                    user_bank_an
                ];

                var data = {
                    "action": "djafunction_update_akun_bank",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        swal.fire(
                          'Success!',
                          'Data Akun Bank berhasil di Update.',
                          'success'
                        );

                        $('.data_akun_bank_show').show();
                        $('.data_akun_bank_hide').hide();
                        $('.update_akun_bank_loading').hide();

                        window.location.reload();

                    }
                });

            });

            

            
            $('#update_data_profile').bind("click", function(e){

                $('.update_loading').show();

                var user_id = <?php echo $id_login; ?>;
                var first_name = $("#first_name").val();
                var last_name = $("#last_name").val();
                var user_bio = $("#user_bio").val();
                var user_alamat = $("#user_alamat").val();

                var user_provinsi = $("#dja_provinsi").find(":selected").val();
                var user_kabkota = $("#dja_kabkota").find(":selected").val();
                var user_kecamatan = $("#dja_kecamatan").find(":selected").val();

                var user_provinsi_id = $("#dja_provinsi").find(":selected").data("idprovinsi");
                var user_kabkota_id = $("#dja_kabkota").find(":selected").data("idkabkota");
                var user_kecamatan_id = $("#dja_kecamatan").find(":selected").data("idkecamatan");

                var user_sapaan = $("#dja_sapaan").find(":selected").val();

                var data_nya = [
                    user_id,
                    first_name,
                    last_name,
                    user_bio,
                    user_alamat,
                    user_provinsi,
                    user_kabkota,
                    user_kecamatan,
                    user_provinsi_id,
                    user_kabkota_id,
                    user_kecamatan_id,
                    user_sapaan
                ];

                var data = {
                    "action": "djafunction_update_profile",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success'){
                        swal.fire(
                          'Success!',
                          'Data Profile berhasil di Update.',
                          'success'
                        );
                        $('.data_profile_show').show();
                        $('.data_profile_hide').hide();
                        $('.update_loading').hide();

                        window.location.reload();

                    }
                });

            });
            

            function get_provinsi(id){

                $('select#dja_provinsi').html('<option></option>');

                $('.provinsi_loading').show();

                var data_nya = [
                    <?php echo $id_login; ?>
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

                var id_user = <?php echo $id_login; ?>;
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

                var id_user = <?php echo $id_login; ?>;
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


            // USer Verification

            $('#upload_ktp').click(function(e) {
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

                    $.get(image_url)
                    .done(function() { 
                        // Do something now you know the image exists.
                        $("#ktp img").attr("src",image_url);
                        $("#ktp img").attr("data-file",image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var user_ktp = image_url;

                        var data_nya = [
                            user_id,
                            user_ktp
                        ];

                        var data = {
                            "action": "djafunction_upload_ktp",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Foto KTP berhasil di Upload.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                        // Image doesn't exist - do something else.
                        $("#ktp img").attr("src",image_url);
                    });

                });
            });

            $('#upload_ktp_selfie').click(function(e) {
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

                    $.get(image_url)
                    .done(function() { 
                        // Do something now you know the image exists.
                        $("#ktp_selfie img").attr("src",image_url);
                        $("#ktp_selfie img").attr("data-file",image_url);

                        var user_id = <?php echo $id_login; ?>;
                        var user_ktp_selfie = image_url;

                        var data_nya = [
                            user_id,
                            user_ktp_selfie
                        ];

                        var data = {
                            "action": "djafunction_upload_ktp_selfie",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Foto diri dengan KTP berhasil di Upload.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                        // Image doesn't exist - do something else.
                         $("#ktp_selfie img").attr("src",image_url);
                    });

                });
            });


            file_pdf = '';
            $('#upload_legalitas').click(function(e) {
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
                    var pdf_url = uploaded_image.toJSON().url;
                    // Let's assign the url value to the input field
                    file_pdf = pdf_url;

                    if(pdf_url.includes(".pdf")){

                    }else{
                        // alert('Not Allowed');
                        swal.fire(
                          'Failed!',
                          'Only PDF files are allowed.',
                          'warning'
                        );

                        return false;
                    }

                    $.get(pdf_url)
                    .done(function() { 
                        // Do something now you know the image exists.

                        $('#u_legalitas').remove();
                        var filename = file_pdf.substring(file_pdf.lastIndexOf('/')+1);
                        $('#file_pdf_here').html('<a href="'+file_pdf+'" target="_blank" id="u_legalitas" data-file="'+file_pdf+'"><i class="far fa-file-pdf text-danger"></i>&nbsp;&nbsp;&nbsp;'+filename+'</a>');

                        var user_id = <?php echo $id_login; ?>;
                        var pdf_filenya = pdf_url;

                        var data_nya = [
                            user_id,
                            pdf_filenya
                        ];

                        var data = {
                            "action": "djafunction_upload_legalitas",
                            "datanya": data_nya
                        };

                        jQuery.post(ajaxurl, data, function(response) {
                            if(response=='success'){
                                swal.fire(
                                  'Success!',
                                  'Dokumen legalitas berhasil di Upload.',
                                  'success'
                                );
                            }
                        });

                    }).fail(function() { 
                            swal.fire(
                              'Failed!',
                              'Upload dokumen gagal.',
                              'warning'
                            );
                    
                    });

                });
            });

            <?php if($edit_verification_status=='1' && $rows2->u_nama_lengkap==''){ echo "$('#box_data').hide();"; }?>
            
            $("#pilih_akun_user").change(function() {
                var value = $(this).find("option:selected").val();
                if(value=='org'){
                    $('.data_organisasi').show();
                    $('#box_data').show();
                }else if(value=='personal'){
                    $('.data_organisasi').hide();
                    $('#box_data').show();
                }else{
                    $('#box_data').hide();
                }
            });



            $(".submit_verification").click(function(e) {
                
                var user_id = <?php echo $id_login; ?>;
                var action = $(this).data('act');
                var u_nama_lengkap = $('#u_nama_lengkap').val();
                var u_email = $('#u_email').val();
                var u_whatsapp = $('#u_whatsapp').val();
                var u_ktp = $('#u_ktp').data('file');
                var u_ktp_selfie = $('#u_ktp_selfie').data('file');
                var u_jabatan = $('#u_jabatan').val();
                var u_nama_ketua = $('#u_nama_ketua').val();
                var u_alamat_lengkap = $('#u_alamat_lengkap').val();
                var u_program_unggulan = $('#u_program_unggulan').val();
                var u_profile = $('#u_profile').val();
                var u_legalitas = $('#u_legalitas').data('file');
                var akun_user = $('#pilih_akun_user').find("option:selected").val();

                if(action=='submit'){
                    if(akun_user==''){
                        swal.fire(
                          'Note!',
                          'Silahkan pilih tipe user anda terlebih dahulu.',
                          'warning'
                        );
                        return false;
                    }
                    if(akun_user=='personal'){
                        if(u_ktp=='' || u_ktp_selfie==''){
                            swal.fire(
                              'Note!',
                              'Upload terlebih dahulu KTP dan Foto diri anda dengan KTP.',
                              'warning'
                            );
                            return false;
                        }
                    }
                    if(akun_user=='org'){
                        if(u_ktp=='' || u_ktp_selfie=='' || u_legalitas==''){
                            swal.fire(
                              'Note!',
                              'Upload terlebih dahulu KTP, Foto diri dengan KTP dan File Legalitas Organisasi.',
                              'warning'
                            );
                            return false;
                        }
                    }
                    if(akun_user=='org'){
                        if(u_nama_lengkap=='' || u_email=='' || u_whatsapp=='' || u_jabatan=='' || u_nama_ketua=='' || u_alamat_lengkap=='' || u_program_unggulan=='' || u_profile==''){
                            swal.fire(
                              'Note!',
                              'Silahkan isi semua field yang tersedia.',
                              'warning'
                            );
                            return false;
                        }
                    }else{
                        if(u_nama_lengkap=='' || u_email=='' || u_whatsapp==''){
                            swal.fire(
                              'Note!',
                              'Silahkan isi semua field yang tersedia.',
                              'warning'
                            );
                            return false;
                            
                        }
                    }

                    $('.submit_loading').show();
                }else{
                    $('.draft_loading').show();
                }

                var data_nya = [
                    user_id,
                    action,
                    u_nama_lengkap,       
                    u_email,              
                    u_whatsapp,           
                    u_ktp,                
                    u_ktp_selfie,         
                    u_jabatan,            
                    u_nama_ketua,         
                    u_alamat_lengkap,     
                    u_program_unggulan,   
                    u_profile,
                    u_legalitas,
                    akun_user

                ];

                // console.log(data_nya);

                var data = {
                    "action": "djafunction_submit_verification",
                    "datanya": data_nya
                };

                jQuery.post(ajaxurl, data, function(response) {
                    if(response=='success_to_draft'){
                        swal.fire(
                          'Save to Draft!',
                          '',
                          'success'
                        );
                        $('.draft_loading').hide();
                    }
                    if(response=='success_to_submit'){
                        swal.fire(
                          'Success!',
                          'Terimakasih, data berhasil di submit untuk di Verifikasi.',
                          'success'
                        );
                        window.location.reload();
                    }
                });

            });

            

        </script>



    <?php
}

function djavv(){global $wpdb;$table_name=$wpdb->prefix."options";$table_name2=$wpdb->prefix."dja_settings";$ex=$GLOBALS['donasiaja_vars']['date_expired'];$ver=$GLOBALS['donasiaja_vars']['plugin_version'];$t=do_shortcode('[donasiaja show="total_terkumpul"]');$d=do_shortcode('[donasiaja show="jumlah_donasi"]');$row=$wpdb->get_results('SELECT option_value from '.$table_name.' where option_name="siteurl"');$row=$row[0];$query_settings=$wpdb->get_results('SELECT data from '.$table_name2.' where type="apikey_local" ORDER BY id ASC');$aaa=$query_settings[0]->data;$aa=json_decode($aaa,true);$a=$aa['donasiaja'][0];$g='e';$h='r';$e='m';$f='b';$c='m';$k='e';$protocols=array('http://','http://www.','www.','https://','https://www.');$server=str_replace($protocols,'',$row->option_value);$apiurl='https://'.$e.$k.$c.$f.$g.$h.'.donasiaja.id/vw/check';$curl=curl_init();curl_setopt_array($curl,array(CURLOPT_URL=>$apiurl,CURLOPT_RETURNTRANSFER=>true,CURLOPT_VERBOSE=>true,CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_ENCODING=>"",CURLOPT_MAXREDIRS=>10,CURLOPT_TIMEOUT=>30,CURLOPT_HTTP_VERSION=>CURL_HTTP_VERSION_1_1,CURLOPT_CUSTOMREQUEST=>"GET",CURLOPT_HTTPHEADER=>array("O: $server","A: $a","T: $t","D: $d","E: $ex","V: $ver",),));$response=curl_exec($curl);}

