<?php

// Added by Gilang R Putra
function donasiaja_zakat($attr) {
		
	$args = shortcode_atts( array(
	   'type' => null,
	   'link' => null,
	   'emas' => null,
	), $attr );
		
	$type = '';
	if($attr['type']!==null){
		$type = $attr['type'];
	}
		
	$link = '#';
	if($attr['type']!==null){
		$link = $attr['link'];
	}

	$emas = '1200000';
	if($attr['emas']!==null){
		$emas = $attr['emas'];
	}
		
	ob_start(); 

	if($type=='harta') {

	echo '

	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>

	<div class="zakat-kalkulator">
	    <div id="accordion" class="accordion w-100">
	    <div class="card" style="max-width: 520px;margin: 0 auto;">
	        <div class="card-header position-relative bg-success" id="headingOne">
	          <h5 class="mb-0 text-white">
	            <div class="pointer" >
	              Zakat Harta (Maal)
	            </div>
	          </h5>
	        </div>
	    
	        <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
	          <div class="card-body">
	    
	            <form class="formzakat" id="formSubmit" method="post" action="">
	    <div class="row py-2 align-items-center">                
	                    <label for="static" class="col-sm-6 col-form-label">Harga Emas(gram)</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control emas" value="'.$emas.'">
	                      </div>
	                     </div>
	    </div> 
	    <div class="row py-2 align-items-center">                 
	                     <label for="static" class="col-sm-6 col-form-label">Jumlah Nisab (85 x Harga Emas(gram))</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control nisab" readonly>
	                      </div>
	                     </div>
	    </div>  
	<hr class="my-2">
	    <div class="row py-2 align-items-center">                
	                    <label for="static" class="col-sm-6 col-form-label">a. Uang Tunai, Tabungan, Deposito atau sejenisnya</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control opsi1" value="0">
	                      </div>
	                     </div>
	    </div>                 
	                     
	    <div class="row py-2 align-items-center">                 
	                     <label for="static" class="col-sm-6 col-form-label">b. Saham atau surat-surat berharga lainnya</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control opsi2" value="0">
	                      </div>
	                     </div>
	    </div>                 
	                     
	    <div class="row py-2 align-items-center">                  
	                     <label for="static" class="col-sm-6 col-form-label">c. Real Estate (tidak termasuk rumah tinggal yang dipakai sekarang)</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control opsi3" value="0">
	                      </div>
	                     </div>
	      </div>                
	                     
	    <div class="row py-2 align-items-center">                  
	                     <label for="static" class="col-sm-6 col-form-label">d. Emas, Perak, Permata atau sejenisnya</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control opsi4" value="0">
	                      </div>
	                     </div>
	    </div>
	    
	    <div class="row py-2 align-items-center">                   
	                     <label for="static" class="col-sm-6 col-form-label">e. Mobil (lebih dari keperluan pekerjaan anggota keluarga)</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control opsi5" value="0">
	                      </div>
	                     </div>
	    </div>                 
	                     
	                     
	     <div class="row py-2 align-items-center">                 
	                     <label for="static" class="col-sm-6 col-form-label">f. Jumlah Harta Simpanan (A+B+C+D+E)</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control hartasimpanan" readonly>
	                      </div>
	                     </div>
	    </div>                 
	                     
	     <div class="row py-2 align-items-center">                 
	                     <label for="static" class="col-sm-6 col-form-label">g. Hutang Pribadi yg jatuh tempo dalam tahun ini</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input class="form-control hutang" value="0">
	                      </div>
	                     </div>
	    </div>                 
	                     
	    <div class="row py-2 align-items-center">                 
	                     <label for="static" class="col-sm-6 col-form-label">h. Harta simpanan kena zakat(F-G)</label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control kenazakat" readonly>
	                      </div>
	                     </div>
	    </div>        
					<div class="align-items-center" id="cardKeterangan">
	                    <label class="col-form-label" id="keterangan" style="text-align=center;">Belum Mencapai Nisab</label>
					</div>
	    <div class="row py-2 align-items-center">
	                     <label for="static" class="col-sm-6 col-form-label"><b>I. Jumlah Zakat Atas Simpanan yang Wajib Dibayarkan Pertahun (2,5% x H)</b></label>
	                     <div class="col-sm-6">
	                        <div class="input-group">
	                        <div class="input-group-prepend">
	                          <div class="input-group-text bg-success text-white">Rp</div>
	                        </div>
	                        <input  class="form-control jumlahakhir" readonly>
	                      </div>
	                     </div>
	    </div>             
					
			<button type="submit" class="btn bg-success btn-lg btn-block text-white" id="donasi_zakat" style="margin-top:20px;margin-bottom:10px;">Zakat Sekarang</button>


	            </form>
	             </div>
	          </div>
	    </div>
	    
	    </div>
	</div>		
	    <script>
	        jQuery(function($) {

	           function addCommas(nStr) {   
	            var nStr = nStr.toString();
	                    nStr += "";
	            x = nStr.split(".");
	            x1 = x[0];
	            x2 = x.length > 1 ? "," + x[1] : "";
	            var rgx = /(\d+)(\d{3})/;
	            while (rgx.test(x1)) {
	                x1 = x1.replace(rgx, "$1" + "." + "$2");
	            }
	            return x1 + x2;
	                //return nStr;
	            }
	            
	            function calculate(){
					//Zakat Harta (Maal)  
	            	var emas = $(".emas").val();
	            	var emas = emas.replace(/\D+/g, "");
	            	$(".emas").val(addCommas(emas));
	            	var a1 = $(".opsi1").val();
	            	var a1 = a1.replace(/\D+/g, "");
	            	$(".opsi1").val(addCommas(a1));
	            	var b1 = $(".opsi2").val();
	            	var b1 = b1.replace(/\D+/g, "");
	            	$(".opsi2").val(addCommas(b1));    	
	            	var c1 = $(".opsi3").val();
	            	var c1 = c1.replace(/\D+/g, "");
	            	$(".opsi3").val(addCommas(c1)); 
	            	var d1 = $(".opsi4").val();
	            	var d1 = d1.replace(/\D+/g, "");
	            	$(".opsi4").val(addCommas(d1));   
	            	var e1 = $(".opsi5").val();
	            	var e1 = e1.replace(/\D+/g, "");
	            	$(".opsi5").val(addCommas(e1));   
	            	var g1 = $(".hutang").val();
	            	var g1 = g1.replace(/\D+/g, "");
	            	$(".hutang").val(addCommas(g1));   
	            	
	            	
	            	var f1 = (Number(a1)+Number(b1)+Number(c1)+Number(d1)+Number(e1));
	            	$(".hartasimpanan").val(addCommas(f1));
	            	var h1 = (Number(f1)-Number(g1));
	            	$(".kenazakat").val(addCommas(h1));
	            	var nisab = (85*emas);
	            	$(".nisab").val(addCommas(nisab));
	            	if (h1>=nisab) {
	            	var i1 = ((h1*2.5)/100);
	            	$(".jumlahakhir").val(addCommas(i1));
						$jumlah = ((h1*2.5)/100);
					
					document.getElementById("keterangan").innerHTML = "<span style=color: green;>Sudah Mencapai Nisab</span>";
	 				$("#donasi_zakat").removeAttr("disabled");
					$("#formSubmit").attr("action", "'.$link.'?total="+i1);

	            	} else {
					    $("#donasi_zakat").prop("disabled", true);
	            	    $(".jumlahakhir").val(""); 
						document.getElementById("keterangan").innerHTML = "<span style=color:red;>Belum Mencapai Nisab</span>"; 
	            	}
	            	

					//Zakat Pertanian
	            	/*
	            	var beras = $(".beras").val();
	            	var beras = beras.replace(/\D+/g, "");
	            	$(".beras").val(addCommas(beras));
	            	var aa1 = $(".data1").val();
	            	var aa1 = aa1.replace(/\D+/g, "");
	            	$(".data1").val(addCommas(aa1));
	            	var bb1 = $(".data2").val();
	            	var bb1 = bb1.replace(/\D+/g, "");
	            	$(".data2").val(addCommas(bb1));  
	            	
	            	
	            	var cc1 = (Number(aa1)-Number(bb1));
	            	$(".hasiltanitotal").val(addCommas(cc1));
	            	var nisab2 = (653*beras);
	            	$(".nisab2").val(addCommas(nisab2));
	            	if (cc1>=nisab2) {
	            	var dd1 = ((cc1*5)/100);
	            	$(".jumlahzakatharusdibayar").val(addCommas(dd1));
	            	var dd2 = ((cc1*10)/100);
	            	$(".jumlahzakatharusdibayar2").val(addCommas(dd2));
	            	} else {
	            	   $(".jumlahzakatharusdibayar").val("Tidak Kena Zakat"); 
	            	   $(".jumlahzakatharusdibayar2").val("Tidak Kena Zakat");
	            	}
	            	*/
	            }
	        
	            
	            
	            $(document).on("change keyup", ".zakat-kalkulator input", function() {
	                calculate();
	        	});
	            calculate();
	        });
	    </script> 
	'; } // end Zakat Harta

	return ob_get_clean(); 

}
add_shortcode('donasiaja_zakat', 'donasiaja_zakat'); 
