function TrashView() {
  const { showToast } = useApp();
  const [items, setItems] = useStateA([]);
  const [loading, setLoading] = useStateA(true);
  const [q, setQ] = useStateA('');
  const [sort, setSort] = useStateA('recent');
  const [tab, setTab] = useStateA('all');
  const [confirmEmpty, setConfirmEmpty] = useStateA(false);
  const [confirmDel, setConfirmDel] = useStateA(null);

  const daysUntilExpiry = (deletedAt) => {
    const days = 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    if (days <= 0) return 'sudah lewat masa retensi · permanen besok';
    return days + ' hari lagi dihapus permanen';
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.trash();
      setItems((res?.data || []).map(i => ({
        id: i.id,
        type: i.type,
        name: i.name || i.title || i.invoice_number || 'Unknown',
        meta: i.deleted_at ? daysUntilExpiry(i.deleted_at) : '',
        icon: i.type === 'campaign' ? 'megaphone' : i.type === 'user' ? 'user' : 'creditcard',
        tone: i.type === 'campaign' ? 'brand' : i.type === 'user' ? 'sky' : 'ok',
        size: i.detail || '',
        deletedAt: i.deleted_at,
      })));
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffectA(() => { load(); }, []);

  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    sky: 'bg-sky2-50 text-sky2-500',
    ok: 'bg-emerald-50 text-emerald-600',
  };

  const typeCounts = useMemoA(() => ({
    all: items.length,
    campaign: items.filter(i => i.type === 'campaign').length,
    user: items.filter(i => i.type === 'user').length,
    transaction: items.filter(i => i.type === 'transaction').length,
  }), [items]);

  const filtered = useMemoA(() => {
    let list = items.filter(i => {
      if (tab !== 'all' && i.type !== tab) return false;
      if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === 'expire') {
      list = [...list].sort((a, b) => new Date(a.deletedAt) - new Date(b.deletedAt));
    }
    return list;
  }, [items, tab, q, sort]);

  const handleRestore = async (i) => {
    try {
      await api.restoreTrash(i.type, i.id);
      setItems(prev => prev.filter(x => !(x.id === i.id && x.type === i.type)));
      showToast(i.name + ' berhasil di-restore');
    } catch {
      showToast('Gagal merestore');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDel) return;
    try {
      await api.permanentDelete(confirmDel.type, confirmDel.id);
      setItems(prev => prev.filter(x => !(x.id === confirmDel.id && x.type === confirmDel.type)));
      showToast(confirmDel.name + ' dihapus permanen');
    } catch {
      showToast('Gagal menghapus');
    }
    setConfirmDel(null);
  };

  const handleEmptyTrash = async () => {
    for (const i of items) {
      try { await api.permanentDelete(i.type, i.id); } catch {}
    }
    setItems([]);
    setConfirmEmpty(false);
    showToast('Trash dikosongkan');
  };

  const typeLabel = (type) => ({ campaign: 'Campaign', user: 'User', transaction: 'Transaksi' }[type] || type);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trash"
        subtitle="Data yang dihapus akan disimpan selama 30 hari sebelum dihapus permanen."
        actions={<Btn variant="ghost" tone="bad" icon="trash" onClick={() => setConfirmEmpty(true)}>Kosongkan trash</Btn>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value: 'all', label: 'Semua', count: typeCounts.all },
            { value: 'campaign', label: 'Campaigns', count: typeCounts.campaign },
            { value: 'user', label: 'Users', count: typeCounts.user },
            { value: 'transaction', label: 'Transaksi', count: typeCounts.transaction },
          ]}/>
          <div className="ml-auto w-full sm:w-auto flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Cari di trash…" value={q} onChange={setQ} className="w-full sm:w-64"/>
            <Select value={sort} onChange={setSort} options={[{ value: 'recent', label: 'Terbaru' }, { value: 'expire', label: 'Mendekati expired' }]}/>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-line">
        {loading && <div className="p-8 text-center text-mute text-sm">Memuat data trash…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-mute text-sm">Trash kosong.</div>
        )}
        {!loading && filtered.map((i) => (
          <div key={i.type + '-' + i.id} className="flex items-center gap-3 p-4 hover:bg-bg2/60">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tones[i.tone]}`}><Icon name={i.icon} size={18}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="slate" size="sm">{typeLabel(i.type)}</Badge>
                <span className="font-bold text-ink">{i.name}</span>
              </div>
              <div className="text-xs text-mute mt-0.5">{i.size}{i.size && ' · '}<span className="text-amber-600 font-semibold">{i.meta}</span></div>
            </div>
            <Btn size="sm" variant="outline" tone="ink" icon="refresh" onClick={() => handleRestore(i)}>Restore</Btn>
            <Btn size="sm" variant="ghost" tone="bad" icon="trash" onClick={() => setConfirmDel(i)}>Hapus permanen</Btn>
          </div>
        ))}
      </Card>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Hapus Permanen" size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirmDel(null)}>Batal</Btn>
          <Btn tone="bad" icon="trash" onClick={handlePermanentDelete}>Hapus permanen</Btn>
        </>}>
        <div className="text-sm text-ink/85">
          Data <b>{confirmDel?.name}</b> akan dihapus secara permanen dan <b>tidak bisa dikembalikan</b>.
        </div>
      </Modal>

      <Modal open={confirmEmpty} onClose={() => setConfirmEmpty(false)} title="Kosongkan Trash" size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirmEmpty(false)}>Batal</Btn>
          <Btn tone="bad" icon="trash" onClick={handleEmptyTrash}>Ya, kosongkan semua</Btn>
        </>}>
        <div className="text-sm text-ink/85">
          <b>Yakin ingin mengosongkan trash?</b> Semua <b>{items.length}</b> item akan dihapus permanen dan tidak bisa dikembalikan.
        </div>
      </Modal>
    </div>
  );
}

window.TrashView = TrashView;
