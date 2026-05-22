// CS Panel + Invoice Modal + Advertiser Panel

const { useState: uS_cs, useEffect: uE_cs } = React;

// ====================== Invoice Modal ======================
function InvoiceModal({ tx, onClose }){
  const [status, setStatus] = uS_cs(tx?.status || 'Pending');
  const [note, setNote] = uS_cs(tx?.note || '');
  const [copied, setCopied] = uS_cs(false);
  const [saving, setSaving] = uS_cs(false);
  if (!tx) return null;
  return (
    <Modal open={!!tx} onClose={onClose} maxW="max-w-3xl">
      <div className="p-6 border-b border-line">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="font-mono text-lg font-bold text-brand-700 dark:text-brand-300">{tx.id}</div>
          <StatusBadge status={status}/>
          <button onClick={()=>{navigator.clipboard?.writeText(tx.id); setCopied(true); setTimeout(()=>setCopied(false),1500);}} className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium dark:bg-slate-800 dark:hover:bg-slate-700">
            {copied?<><Icons.Check w={14} h={14}/>Tersalin</>:<><Icons.Copy w={14} h={14}/>Salin</>}
          </button>
          <div className="ml-auto text-xs text-muted">{new Date(tx.ts).toLocaleString('id-ID',{dateStyle:'full',timeStyle:'short'})}</div>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-6">
        {/* Left — info */}
        <div className="space-y-4">
          <div className="bg-bg2 dark:bg-slate-800/40 rounded-2xl p-4 border border-line">
            <div className="text-xs text-muted">Nominal donasi</div>
            <div className="text-3xl font-extrabold text-ink dark:text-slate-100 tnum mt-1">{fmtIDR(tx.amount)}</div>
            <div className="mt-2 text-xs text-muted">via {tx.method}</div>
          </div>

          <div className="space-y-3 text-sm">
            <Row k="Campaign" v={tx.campaign}/>
            <Row k="Donatur" v={
              <div className="flex items-center gap-2">
                <Avatar name={tx.donor} initials={tx.initials} anon={tx.anon} size={28}/>
                <span className="font-semibold">{tx.anon?'Hamba Allah':tx.donor}</span>
              </div>
            }/>
            <Row k={<><Icons.Whatsapp w={14} h={14} className="inline mr-1"/>WhatsApp</>} v={<a className="text-brand-700 hover:underline">{tx.phone}</a>}/>
            <Row k={<><Icons.Mail w={14} h={14} className="inline mr-1"/>Email</>} v={tx.email}/>
            <Row k="Payment Method" v={tx.method}/>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Tracking</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Tag k="utm_source" v={tx.utm_source}/>
              <Tag k="utm_medium" v={tx.utm_medium}/>
              <Tag k="utm_campaign" v={tx.utm_campaign}/>
              <Tag k="fbclid" v="ABC123…XYZ"/>
            </div>
          </div>

          {tx.prayer && (
            <div className="bg-cyan2-50 dark:bg-cyan2-900/30 border border-cyan2-100 dark:border-cyan2-900/40 rounded-2xl p-4">
              <div className="text-xs font-semibold text-cyan2-700 dark:text-cyan2-300">Doa / pesan donatur</div>
              <p className="mt-1 text-sm text-ink dark:text-slate-100 italic">"{tx.prayer}"</p>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Update status pembayaran</div>
            <div className="grid grid-cols-3 gap-2">
              {['Sukses','Pending','Gagal'].map(s=>(
                <button key={s} onClick={()=>setStatus(s)} className={`h-10 rounded-xl border-2 text-sm font-semibold transition ${status===s?(s==='Sukses'?'border-emerald-500 bg-emerald-50 text-emerald-700':s==='Pending'?'border-amber-500 bg-amber-50 text-amber-700':'border-rose-500 bg-rose-50 text-rose-700'):'border-line text-slate-600'}`}>{s}</button>
              ))}
            </div>
          </div>

          <Field label="Catatan CS">
            <textarea rows="5" value={note} onChange={e=>setNote(e.target.value)} placeholder="Tulis catatan tindak lanjut…" className="w-full px-3.5 py-3 rounded-xl bg-white border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 dark:bg-slate-900 dark:border-slate-700"/>
          </Field>

          <div>
            <div className="text-sm font-semibold mb-2">Tindak lanjut</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="success" size="sm" full icon={<Icons.Whatsapp w={14} h={14}/>}>Chat WA</Button>
              <Button variant="secondary" size="sm" full icon={<Icons.Mail w={14} h={14}/>}>Kirim Email</Button>
              <Button variant="secondary" size="sm" full icon={<Icons.Refresh w={14} h={14}/>}>Resend Invoice</Button>
              <Button variant="secondary" size="sm" full icon={<Icons.Download w={14} h={14}/>}>Download PDF</Button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-line">
            <div className="text-xs font-semibold mb-2">Riwayat</div>
            <div className="space-y-2 text-xs">
              {[
                ['Saat ini','Status diubah ke '+status,'Sari (CS)'],
                ['1 jam lalu','Email pengingat dikirim','Sistem'],
                ['3 jam lalu','Invoice dibuat','Donor'],
              ].map(([t,a,b],i)=>(
                <div key={i} className="flex gap-2"><span className="text-muted shrink-0 w-20">{t}</span><span className="flex-1 text-ink dark:text-slate-100">{a}</span><span className="text-muted">{b}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-line flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Tutup</Button>
        <Button variant="primary" icon={<Icons.Check w={16} h={16}/>} disabled={saving} onClick={async()=>{
          setSaving(true);
          try { await api.updateInvoiceStatus(tx.id, status); onClose(); } catch(e) { console.error('Save failed:', e); }
          setSaving(false);
        }}>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</Button>
      </div>
    </Modal>
  );
}
function Row({ k, v }){
  return <div className="flex justify-between items-center gap-3 py-2 border-b border-line last:border-0">
    <span className="text-muted text-xs">{k}</span>
    <span className="text-right text-sm text-ink dark:text-slate-100">{v}</span>
  </div>;
}
function Tag({ k, v }){
  return (
    <div className="surface-2 rounded-lg px-2.5 py-1.5 dark:bg-slate-800/60">
      <div className="font-mono text-[10px] text-muted">{k}</div>
      <div className="font-semibold text-ink dark:text-slate-100 truncate text-[12px]">{v}</div>
    </div>
  );
}

// ====================== CS Inbox ======================
function CsInbox(){
  const { openInvoice } = useApp();
  const [filter, setFilter] = uS_cs('all');
  const [invoices, setInvoices] = uS_cs(TRANSACTIONS);
  const [activeId, setActiveId] = uS_cs(TRANSACTIONS[0].id);

  uE_cs(()=>{
    api.invoices().then(r => {
      if(r?.data && r.data.length > 0) {
        const mapped = r.data.map(inv => ({
          id: inv.invoice_number || inv.id,
          donor: inv.donor_name || inv.donor || 'Hamba Allah',
          initials: (inv.donor_name || inv.donor || 'HA').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          anon: inv.is_anonymous || inv.anon || false,
          campaign: inv.campaign_title || inv.campaign || '',
          campaignId: inv.campaign_id || '',
          amount: inv.amount || 0,
          method: inv.payment_method || inv.method || '',
          status: inv.status || 'Pending',
          ts: inv.created_at || inv.ts || Date.now(),
          phone: inv.phone || inv.donor_phone || '',
          email: inv.email || inv.donor_email || '',
          prayer: inv.prayer || inv.message || '',
          note: inv.note || '',
          utm_source: inv.utm_source || '',
          utm_campaign: inv.utm_campaign || '',
          utm_medium: inv.utm_medium || '',
        }));
        setInvoices(mapped);
        setActiveId(mapped[0].id);
      }
    });
  },[]);

  const items = invoices.filter(t=>filter==='all'||t.status.toLowerCase()===filter);
  const active = items.find(t=>t.id===activeId) || items[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Inbox Donatur" subtitle="Follow up donatur & manajemen invoice"
        actions={<>
          <Button variant="secondary" icon={<Icons.Filter w={16} h={16}/>}>Filter Payment</Button>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Export CS</Button>
        </>}
      />

      <Card padded={false} className="overflow-hidden">
        <div className="grid md:grid-cols-[340px_1fr] min-h-[600px]">
          {/* List */}
          <div className="border-r border-line">
            <div className="p-3 border-b border-line">
              <Input icon={<Icons.Search w={16} h={16}/>} placeholder="Cari invoice, nama, no WA…"/>
              <div className="mt-2 flex gap-1 text-xs">
                {[['all','Semua'],['pending','Pending'],['sukses','Sukses'],['gagal','Gagal']].map(([k,l])=>(
                  <button key={k} onClick={()=>setFilter(k)} className={`px-2.5 h-7 rounded-lg font-semibold ${filter===k?'bg-brand-600 text-white':'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto nice-scroll max-h-[600px]">
              {items.slice(0,18).map(t=>(
                <button key={t.id} onClick={()=>setActiveId(t.id)} className={`w-full text-left px-4 py-3 border-b border-line transition ${active?.id===t.id?'bg-brand-50 dark:bg-brand-900/30':'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.donor} initials={t.initials} anon={t.anon} size={36}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm truncate text-ink dark:text-slate-100">{t.anon?'Hamba Allah':t.donor}</div>
                        <div className="text-[10px] text-muted shrink-0">{new Date(t.ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div className="text-xs text-muted truncate">{t.campaign}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-bold tnum text-brand-700">{fmtIDR(t.amount)}</span>
                        <StatusBadge status={t.status}/>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          {active && (
            <div className="p-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Avatar name={active.donor} initials={active.initials} anon={active.anon} size={56}/>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg text-ink dark:text-slate-100">{active.anon?'Hamba Allah':active.donor}</div>
                  <div className="text-sm text-muted flex items-center gap-2 flex-wrap">
                    <Icons.Whatsapp w={14} h={14}/> {active.phone}
                    <span>·</span>
                    <Icons.Mail w={14} h={14}/> {active.email}
                  </div>
                </div>
                <Button variant="success" size="sm" icon={<Icons.Whatsapp w={14} h={14}/>}>Chat WA</Button>
                <Button variant="primary" size="sm" onClick={()=>openInvoice(active)}>Buka Invoice</Button>
              </div>

              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <div className="surface-2 rounded-xl p-3">
                  <div className="text-xs text-muted">Invoice</div>
                  <button onClick={()=>openInvoice(active)} className="font-mono font-bold text-brand-700 text-sm hover:underline">{active.id}</button>
                </div>
                <div className="surface-2 rounded-xl p-3">
                  <div className="text-xs text-muted">Nominal</div>
                  <div className="font-bold text-ink dark:text-slate-100 tnum">{fmtIDR(active.amount)}</div>
                </div>
                <div className="surface-2 rounded-xl p-3">
                  <div className="text-xs text-muted">Status</div>
                  <div><StatusBadge status={active.status}/></div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold mb-2">Riwayat percakapan</div>
                <div className="space-y-3">
                  <ChatBubble side="them">Halo, donasi saya status pending sudah 2 jam. Mohon dicek ya.</ChatBubble>
                  <ChatBubble side="me">Selamat siang Bapak {active.donor.split(' ')[0]}. Mohon ditunggu beberapa menit, sedang kami cek dengan tim payment.</ChatBubble>
                  <ChatBubble side="them">Baik, terima kasih.</ChatBubble>
                  <ChatBubble side="me" status>Status diperbarui ke <b>{active.status}</b>. Donasi sudah masuk.</ChatBubble>
                </div>
              </div>

              <div className="mt-5">
                <div className="relative">
                  <textarea rows="2" placeholder="Tulis pesan follow up…" className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white border border-line resize-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 dark:bg-slate-900 dark:border-slate-700"/>
                  <button className="absolute right-2 bottom-2 h-9 w-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center"><Icons.Send w={16} h={16}/></button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {['Cek pembayaran','Resend invoice','Terima kasih','Sudah masuk'].map(t=>(
                    <button key={t} className="px-3 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium">{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ChatBubble({ side, children, status }){
  const me = side==='me';
  return (
    <div className={`flex ${me?'justify-end':'justify-start'}`}>
      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${status?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':me?'bg-brand-600 text-white':'bg-slate-100 dark:bg-slate-800 text-ink dark:text-slate-100'}`}>{children}</div>
    </div>
  );
}

// ====================== Transactions (CS) ======================
function TransactionsPage(){
  const [txList, setTxList] = uS_cs(TRANSACTIONS);
  const [txStats, setTxStats] = uS_cs(null);

  uE_cs(()=>{
    api.invoices().then(r => {
      if(r?.data && r.data.length > 0) {
        const mapped = r.data.map(inv => ({
          id: inv.invoice_number || inv.id,
          donor: inv.donor_name || inv.donor || 'Hamba Allah',
          initials: (inv.donor_name || inv.donor || 'HA').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          anon: inv.is_anonymous || inv.anon || false,
          campaign: inv.campaign_title || inv.campaign || '',
          amount: inv.amount || 0,
          method: inv.payment_method || inv.method || '',
          status: inv.status || 'Pending',
          ts: inv.created_at || inv.ts || Date.now(),
          phone: inv.phone || inv.donor_phone || '',
          email: inv.email || inv.donor_email || '',
        }));
        setTxList(mapped);
      }
    });
    api.dashboardStats().then(r => r?.data && setTxStats(r.data));
  },[]);

  const totalTx = txStats?.total_tx || TOTAL_TX;
  return (
    <div className="space-y-5">
      <PageHeader title="Transaksi" subtitle={`${fmtNum(totalTx)} transaksi total`}
        actions={<>
          <DateRangePicker/>
          <Button variant="secondary" icon={<Icons.Filter w={16} h={16}/>}>Filter</Button>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Export</Button>
        </>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sukses" value={fmtNum(txStats?.tx_success || Math.round(totalTx*0.82))} sub={txStats?.tx_success_pct || '82%'} tone="green" icon={<Icons.Check w={20} h={20}/>}/>
        <Stat label="Pending" value={fmtNum(txStats?.tx_pending || Math.round(totalTx*0.12))} sub="Butuh follow up" tone="amber" icon={<Icons.Refresh w={20} h={20}/>}/>
        <Stat label="Gagal" value={fmtNum(txStats?.tx_failed || Math.round(totalTx*0.06))} sub="Gagal bayar" tone="red" icon={<Icons.X w={20} h={20}/>}/>
        <Stat label="Donatur Unik" value={fmtNum(txStats?.unique_donors || Math.round(totalTx*0.61))} sub="Bulan ini" tone="brand" icon={<Icons.Users w={20} h={20}/>}/>
      </div>
      <Card padded={false}>
        <TxTable rows={txList}/>
        <div className="p-4 flex items-center justify-between text-sm text-muted border-t border-line">
          <span>Menampilkan 1–{txList.length} dari {fmtNum(totalTx)}</span>
          <div className="flex gap-1">
            <button className="h-8 w-8 rounded-lg border border-line"><Icons.ChevronLeft w={14} h={14} className="m-auto"/></button>
            <button className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-semibold">1</button>
            <button className="h-8 w-8 rounded-lg border border-line text-xs">2</button>
            <button className="h-8 w-8 rounded-lg border border-line text-xs">3</button>
            <button className="h-8 w-8 rounded-lg border border-line"><Icons.ChevronRight w={14} h={14} className="m-auto"/></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ====================== Advertiser Dashboard ======================
function AdvertiserDashboard(){
  const [advOverview, setAdvOverview] = uS_cs(null);
  const [advTraffic, setAdvTraffic] = uS_cs(TRAFFIC_SOURCES);
  const [advChart, setAdvChart] = uS_cs(DAILY);

  uE_cs(()=>{
    api.analyticsOverview().then(r => r?.data && setAdvOverview(r.data));
    api.analyticsTraffic().then(r => { if(r?.data && r.data.length > 0) setAdvTraffic(r.data); });
    api.dailyChart(30).then(r => { if(r?.data) setAdvChart(r.data.map(d=>({date:new Date(d.date),amount:d.amount,count:d.count}))); });
  },[]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Iklan"
        subtitle="Performa kampanye iklan & ROAS"
        actions={<><DateRangePicker/><Button variant="primary" icon={<Icons.Plus w={16} h={16}/>}>Input Spend</Button></>}
      />

      {/* Big KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Spend" value={fmtShort(advOverview?.total_spend || advTraffic.reduce((s,x)=>s+x.spend,0))} sub="30 hari" tone="amber" icon={<Icons.Wallet w={20} h={20}/>} trend={{up:true,value:advOverview?.spend_trend || '+12%'}}/>
        <Stat label="Total Revenue" value={fmtShort(advOverview?.total_revenue || TOTAL_RAISED)} sub="Dari iklan" tone="green" icon={<Icons.Heart w={20} h={20}/>} trend={{up:true,value:advOverview?.revenue_trend || '+24%'}}/>
        <Stat label="ROAS" value={advOverview?.roas || '4.8×'} sub="Rata-rata" tone="brand" icon={<Icons.Chart w={20} h={20}/>} trend={{up:true,value:advOverview?.roas_trend || '+0.3×'}}/>
        <Stat label="Conv. Rate" value={advOverview?.conv_rate || '4.7%'} sub="Visitor → Donatur" tone="cyan" icon={<Icons.Sparkles w={20} h={20}/>}/>
      </div>

      {/* Platform cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {advTraffic.map(s=>{
          const cpa = Math.round(s.spend / Math.max(1,s.donations));
          return (
            <Card key={s.src}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded" style={{background:s.color}}/>
                <div className="font-bold text-ink dark:text-slate-100">{s.src}</div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted text-xs">Visitor</div><div className="font-semibold tnum text-right">{fmtNum(s.visits)}</div>
                <div className="text-muted text-xs">Leads</div><div className="font-semibold tnum text-right">{fmtNum(s.leads)}</div>
                <div className="text-muted text-xs">Donations</div><div className="font-semibold tnum text-right">{fmtNum(s.donations)}</div>
                <div className="text-muted text-xs">Spend</div><div className="font-semibold tnum text-right">{fmtShort(s.spend)}</div>
                <div className="text-muted text-xs">CPA</div><div className="font-bold tnum text-right">{fmtShort(cpa)}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-sm">
                <span className="text-muted">Pixel</span>
                <StatusBadge status={s.src==='Organic'?'Not Connected':'Active'}/>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart + best campaigns */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Performa Iklan Harian</div>
          <div className="text-slate-700 dark:text-slate-300">
            <LineChart data={advChart} height={220}/>
          </div>
        </Card>
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Rekomendasi Campaign</div>
          <div className="text-xs text-muted mb-3">Conversion rate tertinggi · 7 hari</div>
          <div className="space-y-3">
            {CAMPAIGNS.slice(0,4).map((c,i)=>(
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-200 text-slate-700':'bg-slate-100 text-slate-600'}`}>#{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-ink dark:text-slate-100">{c.title}</div>
                  <div className="text-xs text-muted">CR {(6.5-i*0.4).toFixed(1)}% · CPA {fmtShort(15000+i*2000)}</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="soft" size="sm" full className="mt-4">Lihat semua →</Button>
        </Card>
      </div>

      {/* Conversion events */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink dark:text-slate-100">Conversion Events</div>
          <Badge tone="green" dot>5 of 6 aktif</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { e:'PageView', n:314_700, ok:true },
            { e:'ViewContent', n:201_400, ok:true },
            { e:'Lead', n:18_420, ok:true },
            { e:'InitiateCheckout', n:9_840, ok:true },
            { e:'AddPaymentInfo', n:7_240, ok:true },
            { e:'CompleteDonation', n:4_920, ok:false },
          ].map(ev=>(
            <div key={ev.e} className="surface-2 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ev.ok?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-600'}`}>
                {ev.ok?<Icons.Check w={18} h={18}/>:<Icons.X w={18} h={18}/>}
              </div>
              <div className="flex-1">
                <div className="font-mono text-xs text-muted">{ev.e}</div>
                <div className="font-bold text-ink dark:text-slate-100 tnum">{fmtNum(ev.n)}</div>
              </div>
              <Badge tone={ev.ok?'green':'red'} size="sm">{ev.ok?'OK':'Drop'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Landing preview */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Landing Page Preview</div>
            <div className="text-xs text-muted">Conversion 6.2% · Skor performa: 92/100</div>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-semibold">Desktop</button>
            <button className="h-9 px-3 rounded-lg bg-brand-600 text-white text-sm font-semibold">Mobile</button>
          </div>
        </div>
        <div className="rounded-2xl border border-line p-4 surface-2 flex justify-center">
          <div className="w-[260px] aspect-[9/19.5] bg-white rounded-[2rem] border-4 border-slate-800 overflow-hidden shadow-pop">
            <div className="h-6 bg-slate-800 flex justify-center"><div className="w-20 h-3 bg-slate-800 rounded-b-xl"></div></div>
            <div className="h-full overflow-hidden">
              <div className="aspect-[16/12] relative"><img src={CAMPAIGNS[0].img} className="w-full h-full object-cover" alt=""/></div>
              <div className="p-2.5">
                <div className="text-[10px] font-bold leading-tight text-ink line-clamp-2">{CAMPAIGNS[0].title}</div>
                <div className="mt-1 text-[9px] text-brand-700 font-bold">{fmtShort(CAMPAIGNS[0].raised)}</div>
                <div className="mt-1 h-1 bg-slate-100 rounded"><div className="h-full bg-brand-600 rounded" style={{width:'75%'}}/></div>
                <button className="mt-2 w-full h-7 bg-brand-600 text-white text-[10px] font-bold rounded-lg">Donasi Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { InvoiceModal, CsInbox, TransactionsPage, AdvertiserDashboard, ChatBubble });
