import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { useAdminSync } from '@/lib/useAdminSync';
import { Card, PageHeader, Tabs, Btn, Icon } from '@/components';

export default function NotificationsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapIcon = (type: string) => ({ donation: 'heart', cs: 'wa', system: 'shield', campaign: 'megaphone' } as Record<string, string>)[type] || 'bell';
  const mapTone = (type: string) => ({ donation: 'ok', cs: 'sky', system: 'bad', campaign: 'brand' } as Record<string, string>)[type] || 'brand';
  const timeAgo = (dateStr: string) => {
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

  // Normalize a backend Notification row to the shape this list renders.
  const mapNotif = (n: any) => ({
    id: n.id,
    icon: mapIcon(n.type),
    tone: mapTone(n.type),
    title: n.title || '',
    body: n.subtitle || n.body || n.message || '',
    when: timeAgo(n.created_at),
    unread: !(n.is_read ?? n.read_at),
    type: n.type || 'system',
  });

  const load = async () => {
    try {
      const res = await api.notifications();
      // Backend wraps the list: { notifications: [...], unread_count }. Tolerate a
      // bare array too. Fields are is_read (not read_at) and subtitle (not body).
      const data: any = res?.data;
      const arr = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
      setItems(arr.map(mapNotif));
    } catch {
      const fb = useDataStore.getState().notifications as any[];
      setItems(Array.isArray(fb) ? fb.map(mapNotif) : []);
    }
    setLoading(false);
  };
  useAdminSync(load);

  const tones: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky2-50 text-sky2-500',
    bad: 'bg-rose-50 text-rose-600',
    warn: 'bg-amber-50 text-amber-600',
    brand: 'bg-brand-50 text-brand-600',
  };

  const counts = useMemo(() => ({
    all: items.length,
    unread: items.filter((i) => i.unread).length,
    donation: items.filter((i) => i.type === 'donation').length,
    campaign: items.filter((i) => i.type === 'campaign').length,
    cs: items.filter((i) => i.type === 'cs').length,
    system: items.filter((i) => i.type === 'system').length,
  }), [items]);

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    if (tab === 'unread') return items.filter((i) => i.unread);
    return items.filter((i) => i.type === tab);
  }, [items, tab]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
      showToast('Semua notifikasi ditandai dibaca');
    } catch {
      showToast('Gagal menandai notifikasi');
    }
  };

  const handleClick = async (n: any) => {
    if (n.unread) {
      try { await api.markNotificationRead(n.id); } catch { /* ignore */ }
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
    }
    if (n.type === 'donation') navigate('/dashboard');
    else if (n.type === 'campaign') navigate('/campaigns');
    else if (n.type === 'cs') navigate('/inbox');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notification"
        subtitle="Aktivitas terbaru pada akun & platform Anda."
        actions={<>
          <Btn variant="outline" tone="ink" icon="check" onClick={handleMarkAllRead}>Tandai semua dibaca</Btn>
          <Btn variant="ghost" tone="ink" icon="cog" onClick={() => navigate('/settings')}>Pengaturan</Btn>
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
        ]} />
      </Card>

      <Card className="divide-y divide-line">
        {loading && <div className="p-8 text-center text-mute text-sm">Memuat notifikasi…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-mute text-sm">Tidak ada notifikasi.</div>
        )}
        {!loading && filtered.map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-ink/[0.03]" onClick={() => handleClick(n)}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tones[n.tone]}`}><Icon name={n.icon} size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-ink">{n.title}</div>
                {/* Minimalist unread label — plain colored text, no background, so it
                    reads the same in light and dark (the old bg-bg2/30 row tint fell
                    back to a light/white fill in dark mode). */}
                {n.unread && <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600 shrink-0">Baru</span>}
              </div>
              {n.body && <div className="text-sm text-ink/80 mt-0.5">{n.body}</div>}
              <div className="text-xs text-mute mt-1">{n.when}</div>
            </div>
            {n.unread && (
              <button title="Tandai dibaca" className="text-mute hover:text-emerald-600 shrink-0"
                onClick={(e) => { e.stopPropagation(); handleClick(n); }}><Icon name="check" size={16} /></button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
