<?php

	
	require 'plugins/phpspreadsheet/autoload.php';
	use PhpOffice\PhpSpreadsheet\Helper\Sample;
	use PhpOffice\PhpSpreadsheet\IOFactory;
	use PhpOffice\PhpSpreadsheet\Spreadsheet;

	global $wpdb;
    $table_name = $wpdb->prefix . "dja_donate";
    $table_name2 = $wpdb->prefix . "dja_campaign";
    $table_name3 = $wpdb->prefix . "dja_aff_submit";
    $table_name4 = $wpdb->prefix . "dja_aff_code";
   	$campaign_id = $c_id;

   	set_time_donasiaja();
   	
   	$date_now = 'Data Download: '.date("j F Y, H:i");
   	if($date_filter==''){$date_filter='All';}
   	if($date_filter=='daterange'){$date_filter='Date range '.$date_range_first.' s.d '.$date_range_last;}

  	if($campaign_id=='all'){
  		if($date_filter!=''){
  			$file_title = 'All Donation / '.$date_now.' / Filter: '.$date_filter.' - '.$status;
	  		$query_donation = $wpdb->get_results("SELECT a.*, b.title, c.nominal_commission,  c.affcode_id, d.user_id as fundraiser_id FROM $table_name a
			LEFT JOIN $table_name2 b ON b.campaign_id = a.campaign_id 
			LEFT JOIN $table_name3 c ON c.donate_id = a.id 
			LEFT JOIN $table_name4 d ON d.id = c.affcode_id
			where a.campaign_id!='' $filter_status $filternya ORDER BY a.id DESC ");
  		}else{
	  		$file_title = 'All Donation / '.$date_now.' / Filter: '.$date_filter.' - '.$status;
	  		$query_donation = $wpdb->get_results("SELECT a.*, b.title, c.nominal_commission,  c.affcode_id, d.user_id as fundraiser_id FROM $table_name a
			LEFT JOIN $table_name2 b ON b.campaign_id = a.campaign_id 
			LEFT JOIN $table_name3 c ON c.donate_id = a.id 
			LEFT JOIN $table_name4 d ON d.id = c.affcode_id
			where $filter_status ORDER BY a.id DESC ");
  		}
  	}else{
  		$query_donation = $wpdb->get_results("SELECT a.*, b.title, c.nominal_commission, d.user_id as fundraiser_id FROM $table_name a
		LEFT JOIN $table_name2 b ON b.campaign_id = a.campaign_id 
		LEFT JOIN $table_name3 c ON c.donate_id = a.id
		LEFT JOIN $table_name4 d ON d.aff_code = c.affcode_id 
		where a.campaign_id='$campaign_id' $filter_status $filternya ORDER BY a.id DESC ");
		if($query_donation!=null){ 
			// jika ada data
			$file_title = $query_donation[0]->title.' / '.$date_now.' - Filter: '.$date_filter.' - '.$status;
		}else{
			$file_title = $campaign_id.' / '.$date_now.' / Filter: '.$date_filter.' - '.$status;
		}
  	}


  	if($campaign_id=='all'){

  		if($date_filter!=''){

  			$nominal_donasi_terkumpul = 0;
  			$nominal_donasi_belum_terkumpul = 0;
			$jumlah_donasi_terkumpul = 0;
			$jumlah_donasi_belum_terkumpul = 0;
			$jumlah_donasi_semua = 0;
  			foreach ($query_donation as $value) {

  				if($value->status=='1'){

  					$nominal_donasi_terkumpul = $nominal_donasi_terkumpul + $value->nominal;
  					$jumlah_donasi_terkumpul++;
  				}

  				if($value->status=='0'){

  					$nominal_donasi_belum_terkumpul = $nominal_donasi_belum_terkumpul + $value->nominal;
  					$jumlah_donasi_belum_terkumpul++;
  				}

  				$jumlah_donasi_semua++;
  			}

  			if($jumlah_donasi_semua>=1){
		        $konversi = $jumlah_donasi_terkumpul/$jumlah_donasi_semua;
		    }else{
		        $konversi = 0;
		    }

		}else{
			$total_donasi = $wpdb->get_results("SELECT SUM(nominal) as total, COUNT(id) as jumlah FROM $table_name where status='1' ")[0];
		    $nominal_donasi_terkumpul = $total_donasi->total;
		    $jumlah_donasi_terkumpul = $total_donasi->jumlah;

			$total_donasi2 = $wpdb->get_results("SELECT SUM(nominal) as total, COUNT(id) as jumlah FROM $table_name where status='0' ")[0];
		    $nominal_donasi_belum_terkumpul = $total_donasi2->total;
		    $jumlah_donasi_belum_terkumpul = $total_donasi2->jumlah;

		    $total_donasi_semua = $wpdb->get_results("SELECT COUNT(id) as jumlah FROM $table_name ")[0];
		    $jumlah_donasi_semua = $total_donasi_semua->jumlah;

		    if($jumlah_donasi_semua>=1){
		        $konversi = $jumlah_donasi_terkumpul/$jumlah_donasi_semua;
		    }else{
		        $konversi = 0;
		    }
		}

	}else{

		$total_donasi = $wpdb->get_results("SELECT SUM(a.nominal) as total, COUNT(a.id) as jumlah FROM $table_name a
	    LEFT JOIN $table_name2 c on a.campaign_id = c.campaign_id 
	    WHERE c.campaign_id = '$campaign_id' and a.status='1' $filter_status $filternya ")[0];
	    $nominal_donasi_terkumpul = $total_donasi->total;
	    $jumlah_donasi_terkumpul = $total_donasi->jumlah;

		$total_donasi2 = $wpdb->get_results("SELECT SUM(a.nominal) as total, COUNT(a.id) as jumlah FROM $table_name a
	    LEFT JOIN $table_name2 c on a.campaign_id = c.campaign_id 
	    WHERE c.campaign_id = '$campaign_id' and a.status='0' $filter_status $filternya ")[0];
	    $nominal_donasi_belum_terkumpul = $total_donasi2->total;
	    $jumlah_donasi_belum_terkumpul = $total_donasi2->jumlah;

	    $total_donasi_semua = $wpdb->get_results("SELECT COUNT(a.id) as jumlah FROM $table_name a 
	    LEFT JOIN $table_name2 c on a.campaign_id = c.campaign_id 
	    WHERE c.campaign_id = '$campaign_id' $filter_status $filternya ")[0];

	    $jumlah_donasi_semua = $total_donasi_semua->jumlah;

	    if($jumlah_donasi_semua>=1){
	        $konversi = $jumlah_donasi_terkumpul/$jumlah_donasi_semua;
	    }else{
	        $konversi = 0;
	    }
	}

    $konversi = $konversi*100;
    $konversi = number_format($konversi,1,",",".").' %';
	
	// print_r(json_encode($total_donasi));
	// exit();

	$helper = new Sample();
	if ($helper->isCli()) {
	    $helper->log('This example should only be run from a Web Browser' . PHP_EOL);

	    return;
	}
	// Create new Spreadsheet object
	$spreadsheet = new Spreadsheet();

	// Set document properties
	$spreadsheet->getProperties()->setCreator('DonasiAja')
	    ->setLastModifiedBy('DonasiAja')
	    ->setTitle('Office 2007 XLSX Test Document')
	    ->setSubject('Office 2007 XLSX Test Document')
	    ->setDescription('Test document for Office 2007 XLSX, generated using PHP classes.')
	    ->setKeywords('office 2007 openxml php')
	    ->setCategory('Test result file');

	// Add some data
	$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A1', 'Campaign : '.$file_title);

	$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A3', $langArray['dash_table_col2'].' Terkumpul : '.$show_currency.number_format_currency($nominal_donasi_terkumpul) .' dari '.number_format($jumlah_donasi_terkumpul,0,",",".").' '.$langArray['dash_card_desc2']);
	$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A4', 'Belum Terkumpul : '.$show_currency.number_format_currency($nominal_donasi_belum_terkumpul).' dari '.number_format($jumlah_donasi_belum_terkumpul,0,",",".").' '.$langArray['dash_card_desc2']);
	$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A5', $langArray['dash_card_title3'].' : '.$konversi);
	$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A6', 'Jumlah '.$langArray['dash_table_col2'].' Keseluruhan : '.number_format_currency($jumlah_donasi_semua).' '.$langArray['dash_card_desc2']);
	

	$start_cell = 8;
    $spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A'.$start_cell, 'No')
	    ->setCellValue('B'.$start_cell, 'Invoice ID')
	    ->setCellValue('C'.$start_cell, $langArray['dash_table_col1']) // Donatur
	    ->setCellValue('D'.$start_cell, 'Anonim') // Kolom baru setelah Donatur
	    ->setCellValue('E'.$start_cell, 'Sapaan')
	    ->setCellValue('F'.$start_cell, 'Nominal') // NumberFormat
	    ->setCellValue('G'.$start_cell, 'Kode Unik')
	    ->setCellValue('H'.$start_cell, 'Total') // NumberFormat
	    ->setCellValue('I'.$start_cell, 'Whatsapp')
	    ->setCellValue('J'.$start_cell, 'Email')
	    ->setCellValue('K'.$start_cell, 'Comment')
	    ->setCellValue('L'.$start_cell, 'Program')
	    ->setCellValue('M'.$start_cell, 'Payment Method')
	    ->setCellValue('N'.$start_cell, 'Payment Number')
	    ->setCellValue('O'.$start_cell, 'Payment Account')
	    ->setCellValue('P'.$start_cell, 'Payment Status')
	    ->setCellValue('Q'.$start_cell, 'Fundraiser Commission') // NumberFormat
	    ->setCellValue('R'.$start_cell, 'Fundraiser Name')
	    ->setCellValue('S'.$start_cell, 'CS')
	    ->setCellValue('T'.$start_cell, 'Date')
	    ->setCellValue('U'.$start_cell, 'Data Qurban')
	    ->setCellValue('V'.$start_cell, 'Data Package-2')
	    ->setCellValue('W'.$start_cell, 'Data Zakat Fitrah')
	    ->setCellValue('X'.$start_cell, 'Additional Data')
	    ->setCellValue('Y'.$start_cell, 'UTM Source')
	    ->setCellValue('Z'.$start_cell, 'UTM Medium')
	    ->setCellValue('AA'.$start_cell, 'UTM Content')
	    ->setCellValue('AB'.$start_cell, 'UTM Campaign')
	    ->setCellValue('AC'.$start_cell, 'UTM Term')
	    ->setCellValue('AD'.$start_cell, 'UTM ID');



	$no = 1;
	$i = 9;
	foreach ($query_donation as $value) {
		
		$datenya = new DateTime($value->created_at, new DateTimeZone('Asia/jakarta') );
        $date_donasi = $datenya->format('M').' '.$datenya->format('d').', '.$datenya->format('Y').' - '.$datenya->format('H').':'.$datenya->format('i');

        if($value->status=='1'){
        	$payment_status = 'Success';

        	$spreadsheet
			    ->getActiveSheet()
			    ->getStyle('A'.$i.':V'.$i)
			    ->getFill()
			    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
			    ->getStartColor()
			    ->setARGB('90EE90');

        }else{
        	$payment_status = 'Waiting';
        }

        if($value->nominal_commission==''){
        	$nominal_commission = '';
        }else{
        	$nominal_commission = $value->nominal_commission;
        }

    	if($value->fundraiser_id!=''){
        	$user_info = get_userdata($value->fundraiser_id);
        	$fundraiser_name = $user_info->first_name.' '.$user_info->last_name;
        }else{
        	$fundraiser_name = '';
        }

        if($value->main_donate==''){
        	$nominal_utama = $value->nominal-$value->unique_number;
        	if($nominal_utama<=0){
        		$nominal_utama = 0;
        	}
        }else{
        	$nominal_utama = $value->main_donate;
        }

        $cs_name = '';
	    if($value->cs_id>=1){
	    	$user_info_cs = get_userdata($value->cs_id);
		    if($user_info_cs!=null){
		    	if($user_info_cs->last_name==''){
			    	$cs_name = $user_info_cs->first_name;
			    }else{
			    	$cs_name = $user_info_cs->first_name.' '.$user_info_cs->last_name;
			    }
		    }
	    }
       
       	$name 	 = str_replace('\\', '', $value->name  ?? '');
       	$clean_name = preg_replace('/[^\x20-\x7E\xA0-\xFF]/', '', $name);
		$clean_name = htmlspecialchars($clean_name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

		$sapaan 	 = str_replace('\\', '', $value->sapaan  ?? '');

       	$comment = str_replace('\\', '', $value->comment ?? '');
       	$clean_comment = preg_replace('/[^\x20-\x7E\xA0-\xFF]/', '', $comment);
		$clean_comment = htmlspecialchars($clean_comment, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

       	$program = str_replace("&#39;", "'", $value->title ?? '');

       	if($value->anonim==1){
       		$anonim = 'Yes';
       	}else{
       		$anonim = '';
       	}

		$spreadsheet->setActiveSheetIndex(0)
	    ->setCellValue('A'.$i, $no)
	    ->setCellValue('B'.$i, $value->invoice_id)
	    ->setCellValue('C'.$i, $clean_name)        // Donatur
	    ->setCellValue('D'.$i, $anonim)            // Kolom baru "Anonim"
	    ->setCellValue('E'.$i, $sapaan)            // Sapaan
	    ->setCellValue('F'.$i, $nominal_utama)     // NumberFormat
	    ->setCellValue('G'.$i, $value->unique_number)
	    ->setCellValue('H'.$i, $value->nominal)    // NumberFormat
	    ->setCellValue('I'.$i, $value->whatsapp)
	    ->setCellValue('J'.$i, $value->email)
	    ->setCellValue('K'.$i, $clean_comment)
	    ->setCellValue('L'.$i, $program)
	    ->setCellValue('M'.$i, $value->payment_method)
	    ->setCellValue('N'.$i, $value->payment_number)
	    ->setCellValue('O'.$i, $value->payment_account)
	    ->setCellValue('P'.$i, $payment_status)
	    ->setCellValue('Q'.$i, $nominal_commission)
	    ->setCellValue('R'.$i, $fundraiser_name)
	    ->setCellValue('S'.$i, $cs_name)
	    ->setCellValue('T'.$i, $date_donasi)
	    ->setCellValue('U'.$i, $value->info_qurban)
	    ->setCellValue('V'.$i, $value->info_package2)
	    ->setCellValue('W'.$i, $value->info_zfitrah)
	    ->setCellValue('X'.$i, $value->info_donate)
	    ->setCellValue('Y'.$i, $value->utm_source)
	    ->setCellValue('Z'.$i, $value->utm_medium)
	    ->setCellValue('AA'.$i, $value->utm_content)
	    ->setCellValue('AB'.$i, $value->utm_campaign)
	    ->setCellValue('AC'.$i, $value->utm_term)
	    ->setCellValue('AD'.$i, $value->utm_id);


		if($currency=='MYR'){

			$spreadsheet->getActiveSheet()
		    ->getStyle('D'.$i)
		    ->getNumberFormat()
		    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER);

			$spreadsheet->getActiveSheet()
			    ->getStyle('F'.$i)
			    ->getNumberFormat()
			    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER);

			$spreadsheet->getActiveSheet()
			    ->getStyle('O'.$i)
			    ->getNumberFormat()
			    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER);

		}else{
			$spreadsheet->getActiveSheet()
		    ->getStyle('D'.$i)
		    ->getNumberFormat()
		    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_CURRENCY_IDR);

			$spreadsheet->getActiveSheet()
			    ->getStyle('F'.$i)
			    ->getNumberFormat()
			    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_CURRENCY_IDR);

			$spreadsheet->getActiveSheet()
			    ->getStyle('O'.$i)
			    ->getNumberFormat()
			    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_CURRENCY_IDR);
		}


		$spreadsheet->getActiveSheet()
		    ->getStyle('G'.$i)
		    ->getNumberFormat()
		    ->setFormatCode(PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER);
		

		$i++;
		$no++;
	}
	

	$powered_row = count($query_donation)+9+2;
	$spreadsheet->setActiveSheetIndex(0)->setCellValue('A'.$powered_row, 'This Data Download Powered By DonasiAja');

	// Rename worksheet
	$spreadsheet->getActiveSheet()->setTitle('Donasi');
	
	// Set Bold and Merge
	$spreadsheet->getActiveSheet()->mergeCells("A1:V1")->getStyle("A1:V1")->getFont()->setBold(true);
	$spreadsheet->getActiveSheet()->mergeCells("A2:V2");
	$spreadsheet->getActiveSheet()->mergeCells("A3:V3")->getStyle("A3:V3")->getFont()->setBold(true);
	$spreadsheet->getActiveSheet()->mergeCells("A4:V4")->getStyle("A4:V4")->getFont()->setBold(true);
	$spreadsheet->getActiveSheet()->mergeCells("A5:V5")->getStyle("A5:V5")->getFont()->setBold(true);
	$spreadsheet->getActiveSheet()->mergeCells("A6:V6")->getStyle("A6:V6")->getFont()->setBold(true);
	$spreadsheet->getActiveSheet()->mergeCells("A7:V7");
	$spreadsheet->getActiveSheet()->mergeCells("A".$powered_row.":V".$powered_row)->getStyle("A".$powered_row.":V".$powered_row)->getFont()->setBold(true);

	// set Bold on sub title colomn
	$spreadsheet->getActiveSheet()->getStyle("A8:AD8")
			    ->getFill()
			    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
			    ->getStartColor()
			    ->setARGB('EAF0F7');

	$spreadsheet->getActiveSheet()->getStyle("A8:AD8")->getFont()->setBold(true);

	// Set active sheet index to the first sheet, so Excel opens this as the first sheet
	$spreadsheet->setActiveSheetIndex(0);

	ob_clean();

	// Redirect output to a client’s web browser (Xlsx)
	header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	header('Content-Disposition: attachment;filename="'.$file_title.'.xlsx"');
	header('Cache-Control: max-age=0');
	// If you're serving to IE 9, then the following may be needed
	header('Cache-Control: max-age=1');

	// If you're serving to IE over SSL, then the following may be needed
	header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past
	header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); // always modified
	header('Cache-Control: cache, must-revalidate'); // HTTP/1.1
	header('Pragma: public'); // HTTP/1.0

	$writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
	$writer->save('php://output');
	exit;

