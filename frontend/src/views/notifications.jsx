function NotificationsView() {
  const [tab, setTab] = useStateA('all');
  const items = [
    { id:1, icon:'heart',  tone:'ok',    title:'Donasi baru diterima', body:'Hamba Allah berdonasi Rp 1.000.000 untuk "Bantuan Aira"', when:'baru saja', unread:true,  type:'donation' },
    { id:2, icon:'wa',     tone:'sky',   title:'Donatur balas WhatsApp', body:'Rizky H. — "Sudah saya transfer kak, tolong dicek."', when:'5 menit lalu', unread:true, type:'cs' },
    { id:3, icon:'shield', tone:'bad',   title:'Pixel TikTok error', body:'Token TikTok Events API expired. Hubungkan ulang.', when:'12 menit lalu', unread:true, type:'system' },
    { id:4, icon:'flame',  tone:'warn',  title:'Campaign mendekati target', body:'"Bantuan Aira" tinggal 9% lagi mencapai Rp 180.000.000.', when:'1 jam lalu', unread:true, type:'campaign' },
    { id:5, icon:'creditcard', tone:'brand', title:'Payout fundraiser diproses', body:'Komisi Mei 2026 untuk Ust. Ahmad Fauzi sebesar Rp 8.432.000 telah dijadwalkan.', when:'2 jam lalu', unread:false, type:'system' },
    { id:6, icon:'bolt',   tone:'sky',   title:'Conversion rate naik', body:'CVR campaign "Sumur Bersih NTT" naik dari 3.4% → 4.8% (24 jam terakhir).', when:'3 jam lalu', unread:false, type:'campaign' },
    { id:7, icon:'megaphone', tone:'brand', title:'Campaign baru dipublish', body:'"Modal Usaha untuk Janda Kepala Keluarga" telah dipublish.', when:'kemarin', unread:false, type:'campaign' },
    { id:8, icon:'check',  tone:'ok',    title:'Donatur menyelesaikan pembayaran', body:'INV-20251123 — Rp 500.000 via QRIS.', when:'kemarin', unread:false, type:'donation' },
  ];

  const tones = {
    ok:'bg-emerald-50 text-emerald-600',
    sky:'bg-sky2-50 text-sky2-500',
    bad:'bg-rose-50 text-rose-600',
    warn:'bg-amber-50 text-amber-600',
    brand:'bg-brand-50 text-brand-600',
  };

  const filtered = tab === 'all' ? items : tab === 'unread' ? items.filter(i => i.unread) : items.filter(i => i.type === tab);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notification"
        subtitle="Aktivitas terbaru pada akun & platform Anda."
        actions={<><Btn variant="outline" tone="ink" icon="check">Tandai semua dibaca</Btn><Btn variant="ghost" tone="ink" icon="cog">Pengaturan</Btn></>}
      />

      <Card className="p-4">
        <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
          { value:'all', label:'Semua', count: items.length },
          { value:'unread', label:'Belum dibaca', count: items.filter(i=>i.unread).length },
          { value:'donation', label:'Donasi' },
          { value:'campaign', label:'Campaign' },
          { value:'cs',  label:'CS' },
          { value:'system', label:'Sistem' },
        ]}/>
      </Card>

      <Card className="divide-y divide-line">
        {filtered.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-bg2/60 cursor-pointer ${n.unread ? 'bg-bg2/30' : ''}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tones[n.tone]}`}><Icon name={n.icon} size={18}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-ink">{n.title}</div>
                {n.unread && <span className="h-2 w-2 rounded-full bg-brand-600"/>}
              </div>
              <div className="text-sm text-ink/80 mt-0.5">{n.body}</div>
              <div className="text-xs text-mute mt-1">{n.when}</div>
            </div>
            <button className="text-mute hover:text-ink"><Icon name="more" size={16}/></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

window.NotificationsView = NotificationsView;
