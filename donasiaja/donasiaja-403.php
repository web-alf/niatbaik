<?php 

  global $wpdb;
  global $wp;
  $table_name = $wpdb->prefix . "dja_settings";

  // Currency
  $query_currency = $wpdb->get_results('SELECT data from '.$table_name.' where type="currency"  ORDER BY id ASC');
  $currency = $query_currency[0]->data;
  $lang = get_data_lang($currency);
  $langArray = require_once(ROOTDIR_DNA . 'library/locale/'.$lang.'.php');

  $show_currency = donasiaja_currency($currency);

  // Settings
  $query_settings = $wpdb->get_results('SELECT data from '.$table_name.' where type="whatsapp_admin" ORDER BY id ASC');
  $whatsapp_admin      = $query_settings[0]->data;

  if($whatsapp_admin==''){
      $whatsapp_admin = '';
  }else{
      $whatsapp_admin = wa_variants_08_628_2($whatsapp_admin);
  }
  

?>

<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>403 Forbidden</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    :root{
      --bg: #0b0c10;
      --card: #111218;
      --text: #e8eaf0;
      --muted: #b9bfd1;
      --accent: #6ea8fe;
      --accent-2: #9d7dff;
      --shadow: 0 8px 30px rgba(0,0,0,.35);
    }
    @media (prefers-color-scheme: light){
      :root{
        --bg: #f6f7fb;
        --card: #ffffff;
        --text: #0e1325;
        --muted: #52607a;
        --accent: #3b82f6;
        --accent-2: #7c3aed;
        --shadow: 0 10px 30px rgba(17, 24, 39, .08);
      }
    }

    * { box-sizing: border-box }
    html, body { height: 100% }
    body{
      margin: 0;
      font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
      background: radial-gradient(1200px 800px at 20% -10%, rgba(109,40,217,.18), transparent 40%),
                  radial-gradient(900px 700px at 110% 10%, rgba(59,130,246,.18), transparent 40%),
                  var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .card{
      width: 100%;
      max-width: 720px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0)) , var(--card);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 24px;
      box-shadow: var(--shadow);
      padding: 32px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .floating{
      position: absolute; inset: -40px;
      background:
        radial-gradient(400px 200px at 80% 0%, rgba(110,168,254,.25), transparent 40%),
        radial-gradient(300px 200px at 0% 100%, rgba(157,125,255,.25), transparent 40%);
      filter: blur(20px);
      opacity: .6;
      pointer-events: none;
    }

    header{
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: start;
      gap: 16px;
    }

    .code{
      font-weight: 800;
      letter-spacing: 2px;
      display: inline-grid;
      place-items: center;
      width: 92px; height: 92px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: white;
      box-shadow: 0 12px 30px rgba(59,130,246,.35);
      font-size: 28px;
    }

    h1{
      margin: 0;
      font-size: clamp(28px, 4vw, 36px);
      line-height: 1.2;
      letter-spacing: .2px;
    }

    p.lead{
      margin: 10px 0 0 0;
      color: var(--muted);
      font-size: 15px;
    }

    .hint{
      margin: 16px 0 0 0;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(255,255,255,.04);
      border: 1px dashed rgba(255,255,255,.12);
      color: var(--muted);
      font-size: 14px;
    }

    .actions{
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .btn{
      appearance: none;
      border: 0;
      padding: 12px 16px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: transform .06s ease, box-shadow .2s ease, background .2s ease;
      box-shadow: 0 6px 16px rgba(0,0,0,.12);
    }
    .btn:active{ transform: translateY(1px) }

    .btn-primary{
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: #fff;
    }
    .btn-ghost{
      background: transparent;
      border: 1px solid rgba(255,255,255,.14);
      color: var(--text);
    }

    .meta{
      margin-top: 26px;
      display: grid;
      gap: 8px;
      font-size: 13px;
      color: var(--muted);
    }
    .meta code{
      background: rgba(0,0,0,.18);
      padding: 2px 6px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: .95em;
    }

    footer{
      margin-top: 26px;
      font-size: 12px;
      color: var(--muted);
      opacity: .9;
    }

    /* Small motion preference */
    @media (prefers-reduced-motion: no-preference){
      .code{ animation: float 6s ease-in-out infinite }
      @keyframes float{
        0%,100%{ transform: translateY(0) }
        50%{ transform: translateY(-5px) }
      }
    }
  </style>
</head>
<body>
  <main class="card" role="main" aria-labelledby="title">
    <div class="floating" aria-hidden="true"></div>

    <header>
      <div>
        <h1 id="title">Akses Ditolak</h1>
        <p class="lead">Permintaan Anda telah ditolak oleh server.</p>
      </div>
      <div class="code" aria-label="Kode status">403</div>
    </header>

    <div class="hint" role="note">
      Jika Anda merasa ini kesalahan, hubungi admin dan sertakan <strong>Request ID</strong> &amp; <strong>IP</strong> Anda di bawah.
    </div>

    <div class="actions" role="group" aria-label="Tindakan">
      <a class="btn btn-primary" href="<?php echo get_site_url(); ?>" id="homeBtn">Ke Beranda</a>
      <button class="btn btn-ghost" id="retryBtn" type="button">Coba Lagi</button>
      <?php if($whatsapp_admin!=''){ ?>
      <a class="btn btn-ghost" href="https://api.whatsapp.com/send?phone=<?php echo $whatsapp_admin; ?>&text=Halo Admin, tolong dibantu IP saya <?php echo donasiaja_getIP(); ?> tidak bisa akses page.">WA Admin</a>
      <?php } ?>
    </div>
    
    <div class="meta" aria-live="polite">
      <div>Request ID: <code id="reqId">—</code></div>
      <div>Alamat IP Anda: <code><?php echo donasiaja_getIP(); ?></code></div>
      <div>Waktu: <code id="ts">—</code></div>
      <div>URL: <code id="url">—</code></div>
    </div>

    <footer>
      
    </footer>
  </main>

  <script>
    // Utility kecil agar halaman lebih informatif bagi pengguna/admin.
    (function(){
      const pad = n => String(n).padStart(2,'0');
      const d = new Date();
      const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      document.getElementById('ts').textContent = ts;
      document.getElementById('url').textContent = location.href;

      // Buat pseudo Request ID lokal (untuk real, isi dari server/WAF)
      const rid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2,10);
      document.getElementById('reqId').textContent = rid;

      // Tampilkan IP via header/server jika tersedia; fallback disembunyikan (privasi)
      // Secara default, klien tak bisa tahu IP publik tanpa layanan eksternal.
      // Biarkan "—" kecuali Anda mengisi dari server (templating) saat render.
      // document.getElementById('ipAddr').textContent = "<server-filled-ip>";

      document.getElementById('retryBtn').addEventListener('click', () => location.reload());
      document.getElementById('homeBtn').addEventListener('click', (e) => {
        // ubah bila root Anda berbeda
      });
      document.getElementById('contactBtn').addEventListener('click', (e) => {
        // opsional: tambahkan query string detail error di body email
      });
    })();
  </script>
</body>
</html>
