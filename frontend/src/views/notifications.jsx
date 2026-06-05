function NotificationsView() {
  const { showToast, setView } = useApp();
  const [tab, setTab] = useStateA('all');
  const [items, setItems] = useStateA([]);
  const [loading, setLoading] = useStateA(true);

  const mapIcon = (type) => ({ donation: 'heart', cs: 'wa', system: 'shield', campaign: 'megaphone' }[type] || 'bell');
  const mapTone = (type) => ({ donation: 'ok', cs: 'sky', system: 'bad', campaign: 'brand' }[type] || 'brand');
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return mins + ' menit lalu';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' jam lalu';
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'kemarin' : days + ' hari lalu';
  };

  useEffectA(() => {
    (async () => {
      try {
        const res = await api.notifications();
        setItems((res?.data || []).map(n => ({
          id: n.id,
          icon: mapIcon(n.type),
          tone: mapTone(n.type),
          title: n.title,
          body: n.body || n.message,
          when: timeAgo(n.created_at),
          unread: !n.read_at,
          type: n.type || 'system',
        })));
      } catch {
        setItems(window.NOTIFICATIONS || []);
      }
      setLoading(false);
    })();
  }, []);

  const tones = {
    ok: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky2-50 text-sky2-500',
    bad: 'bg-rose-50 text-rose-600',
    warn: 'bg-amber-50 text-amber-600',
    brand: 'bg-brand-50 text-brand-600',
  };

  const counts = useMemoA(() => ({
    all: items.length,
    unread: items.filter(i => i.unread).length,
    donation: items.filter(i => i.type === 'donation').length,
    campaign: items.filter(i => i.type === 'campaign').length,
    cs: items.filter(i => i.type === 'cs').length,
    system: items.filter(i => i.type === 'system').length,
  }), [items]);

  const filtered = useMemoA(() => {
    if (tab === 'all') return items;
    if (tab === 'unread') return items.filter(i => i.unread);
    return items.filter(i => i.type === tab);
  }, [items, tab]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, unread: false })));
      showToast('Semua notifikasi ditandai dibaca');
    } catch {
      showToast('Gagal menandai notifikasi');
    }
  };

  const handleClick = async (n) => {
    if (n.unread) {
      try { await api.markNotificationRead(n.id); } catch {}
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x));
    }
    if (n.type === 'donation') setView('dashboard');
    else if (n.type === 'campaign') setView('campaigns');
    else if (n.type === 'cs') setView('inbox');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notification"
        subtitle="Aktivitas terbaru pada akun & platform Anda."
        actions={<>
          <Btn variant="outline" tone="ink" icon="check" onClick={handleMarkAllRead}>Tandai semua dibaca</Btn>
          <Btn variant="ghost" tone="ink" icon="cog" onClick={() => setView('settings')}>Pengaturan</Btn>
        </>}
      />

      <Card className="p-4">
        <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
          { value: 'all', label: 'Semua', count: counts.all },
          { value: 'unread', label: 'Belum dibaca', count: counts.unread },
          { value: 'donation', label: 'Donasi', count: counts.donation },
          { value: 'campaign', label: 'Campaign', count: counts.campaign },
          { value: 'cs', label: 'CS', count: counts.cs },
          { value: 'system', label: 'Sistem', count: counts.system },
        ]}/>
      </Card>

      <Card className="divide-y divide-line">
        {loading && <div className="p-8 text-center text-mute text-sm">Memuat notifikasi…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-mute text-sm">Tidak ada notifikasi.</div>
        )}
        {!loading && filtered.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-bg2/60 cursor-pointer ${n.unread ? 'bg-bg2/30' : ''}`} onClick={() => handleClick(n)}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tones[n.tone]}`}><Icon name={n.icon} size={18}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-ink">{n.title}</div>
                {n.unread && <span className="h-2 w-2 rounded-full bg-brand-600"/>}
              </div>
              <div className="text-sm text-ink/80 mt-0.5">{n.body}</div>
              <div className="text-xs text-mute mt-1">{n.when}</div>
            </div>
            <button className="text-mute hover:text-ink" onClick={e => e.stopPropagation()}><Icon name="more" size={16}/></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

window.NotificationsView = NotificationsView;
