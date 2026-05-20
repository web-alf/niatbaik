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
    $error_info = '<br><br>Duplicate Whatsapp : <br>';
    $error = 0;
    for ($i = 1; $i < $sheetCount; $i ++) {

        $row = $wpdb->get_results('SELECT * from '.$table_name.' where whatsapp="'.$spreadSheetAry[$i][1].'" ');

        if($row==null && $spreadSheetAry[$i][1]!=null){

            $group_id    = $gid;
            $name        = $spreadSheetAry[$i][0];
            $whatsapp    = $spreadSheetAry[$i][1];
            $sapaan      = $spreadSheetAry[$i][2];
            $date        = date("Y-m-d H:i:s");

            // $date
            if($date!=''){
                $time = strtotime($date);
                $newDateString = date('Y-m-d H:i:s',$time);
            }else{
                $newDateString = date('Y-m-d H:i:s');
            }

            $nohp = str_replace(" ","",$whatsapp);
            $nohp = str_replace("(","",$nohp);
            $nohp = str_replace(")","",$nohp);
            $nohp = str_replace(".","",$nohp);
         
             // cek apakah no hp mengandung karakter + dan 0-9
            if(!preg_match('/[^+0-9]/',trim($nohp))){

                if(substr(trim($nohp), 0, 1)=='8'){
                    $nohp = '0'.$nohp;
                }

                // cek apakah no hp karakter 1-3 adalah +62
                if(substr(trim($nohp), 0, 3)=='+62'){
                    $hp = substr(trim($nohp), 1);
                }
                // cek apakah no hp karakter 1 adalah 0
                elseif(substr(trim($nohp), 0, 1)=='0'){
                    if($currency=='MYR'){
                        $hp = '60'.substr(trim($nohp), 1);
                    }else{
                        $hp = '62'.substr(trim($nohp), 1);
                    }
                }else{
                    $hp = $nohp;
                }
            }
            
            $whatsapp = $hp;

            $data_user = $wpdb->get_results("SELECT id from $table_name where whatsapp='$whatsapp' and group_id='$group_id' ");

            if($data_user==null){
                $a = $wpdb->insert(
                        $table_name, //table
                        array(
                            'group_id'      => $group_id,
                            'name'          => $name,
                            'whatsapp'      => $whatsapp,
                            'sapaan'        => $sapaan,
                            'created_at'    => $newDateString),
                        array('%s', '%s') //data format         
                    );

                $upload_no++;

            }else{

                $error_info .= $spreadSheetAry[$i][0].', ';
                $error++;
            }


        }else{
            $error_info .= $spreadSheetAry[$i][0].', ';
            $error++;
        }

        // echo $spreadSheetAry[$i][0].' - '.$spreadSheetAry[$i][1].' > ';

    }
    
    if($error>=1){
        echo 'Berhasil Upload '.$upload_no.' data, dari '.($sheetCount-1).' data.<span style="color:#ff8f17;">'.$error_info.'</span>';
    }else{
        echo 'Berhasil Upload '.$upload_no.' data, dari '.($sheetCount-1).' data.';
    }
    

?>