<?php


require 'plugins/phpspreadsheet/autoload.php';
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;


    $allowedFileType = [
        'application/vnd.ms-excel',
        'text/xls',
        'text/xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($movefile['file']);
    $excelSheet = $spreadsheet->getActiveSheet();

    $spreadSheetAry = $excelSheet->toArray();
    $sheetCount = count($spreadSheetAry);

    $upload_no = 0;
    $error_info = '<br><br>Duplicate Invoice ID : <br>';
    $error = 0;
    for ($i = 1; $i < $sheetCount; $i ++) {

        $row = $wpdb->get_results('SELECT * from '.$table_name.' where invoice_id="'.$spreadSheetAry[$i][0].'" ');
        if($row==null && $spreadSheetAry[$i][2]!=null){

            $campaign_id    = $c_id;
            $invoice_id     = $spreadSheetAry[$i][0];
            $user_id        = $spreadSheetAry[$i][1];
            $name           = $spreadSheetAry[$i][2];
            $whatsapp       = $spreadSheetAry[$i][3];
            $email          = $spreadSheetAry[$i][4];
            $comment        = $spreadSheetAry[$i][5];
            $anonim         = $spreadSheetAry[$i][6];
            $nominal        = $spreadSheetAry[$i][7];
            $status         = $spreadSheetAry[$i][8];
            $payment_code   = $spreadSheetAry[$i][9];
            $payment_number = $spreadSheetAry[$i][10];
            $payment_account= $spreadSheetAry[$i][11];
            $date           = $spreadSheetAry[$i][12]; // date("Y-m-d H:i:s")

            // $date
            if($date!=''){
                $time = strtotime($date);
                $newDateString = date('Y-m-d H:i:s',$time);
            }else{
                $newDateString = date('Y-m-d H:i:s');
            }
            

            // $status
            if($status!='1'){
                $status = 0;
            }

            // $whatsapp
            if(substr($whatsapp, 0, 1)=='8'){
                $whatsapp = '0'.$whatsapp;
            }

            $wpdb->insert(
                $table_name, //table
                array(
                    'campaign_id'   => $campaign_id,
                    'invoice_id'    => $invoice_id,
                    'user_id'       => $user_id,
                    'name'          => $name,
                    'whatsapp'      => $whatsapp,
                    'email'         => $email,
                    'comment'       => $comment,
                    'anonim'        => $anonim,
                    'payment_method'=> 'transfer',
                    'payment_code'  => $payment_code,
                    'payment_number'=> $payment_number,
                    'payment_qrcode'=> null,
                    'payment_account'=> $payment_account,
                    'unique_number' => 0,
                    'nominal'       => $nominal,
                    'status'        => $status,
                    'cs_id'         => null,
                    'f0'            => null,
                    'f1'            => null,
                    'f2'            => null,
                    'f3'            => null,
                    'f4'            => null,
                    'f5'            => null,
                    'payment_trx_id'=> null,
                    'payment_at'    => null,
                    'created_at'    => $newDateString),
                array('%s', '%s') //data format         
            );

            $upload_no++;
        }else{
            $error_info .= $spreadSheetAry[$i][0].', ';
            $error++;
        }

        // echo $spreadSheetAry[$i][0].' - '.$spreadSheetAry[$i][1].' > ';

    }
    
    if($error>=1){
        echo 'Upload '.$upload_no.' data, dari '.($sheetCount-1).' data.<span style="color:#ff8f17;">'.$error_info.'</span>';
    }else{
        echo 'Upload '.$upload_no.' data, dari '.($sheetCount-1).' data.';
    }
    

?>