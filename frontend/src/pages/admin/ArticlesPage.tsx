import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Tabs, Btn, Icon, SearchInput, Select, StatusBadge } from '@/components';
import { api, mediaUrl } from '@/lib/api';
import { useUiStore } from '@/store/ui';

type Article = {
  id: string;
  title: string;
  status: string;
  slug: string;
  image?: string;
  published_at?: string | null;
  user?: { name?: string };
  category?: { id?: string; name?: string };
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ArticlesPage() {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const askConfirm = useUiStore((s) => s.askConfirm);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [view, setView] = useState('table');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // Fetch the full set once and filter client-side: the tabs/search need live counts
    // across all statuses, and a newsroom list is small enough not to need server paging.
    const res = await api.adminArticles('limit=500');
    setArticles((res?.data as Article[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (a: Article) => {
    if (!(await askConfirm({ title: 'Hapus berita', message: `Hapus berita "${a.title}"? Berita akan dipindah ke Trash.`, confirmLabel: 'Ya, hapus', tone: 'bad', icon: 'trash' }))) return;
    try {
      await api.deleteArticle(a.id);
      showToast('Berita dipindah ke trash');
      load();
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus berita');
    }
  };

  const counts = {
    all: articles.length,
    Published: articles.filter((a) => a.status === 'Published').length,
    Draft: articles.filter((a) => a.status === 'Draft').length,
  };

  // Categories are derived from the loaded articles — no separate fetch needed since
  // the admin list already preloads each article's category.
  const categories = Array.from(
    new Map(articles.filter((a) => a.category?.id).map((a) => [a.category!.id, a.category!.name])).entries()
  );

  const filtered = articles.filter((a) =>
    (tab === 'all' || a.status === tab) &&
    (catFilter === 'all' || a.category?.id === catFilter) &&
    (!q || a.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Berita"
        subtitle="Kelola artikel berita & kabar terbaru NIATBAIK.ORG."
        actions={<Btn icon="plus" onClick={() => navigate('/articles/new')}>Tulis Berita</Btn>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value: 'all', label: 'Semua', count: counts.all },
            { value: 'Published', label: 'Published', count: counts.Published },
            { value: 'Draft', label: 'Draft', count: counts.Draft },
          ]} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Cari judul berita…" value={q} onChange={setQ} className="flex-1 min-w-[220px] max-w-md" />
          <Select value={catFilter} onChange={setCatFilter} icon="filter" options={[
            { value: 'all', label: 'Semua kategori' },
            ...categories.map(([id, name]) => ({ value: id, label: name })),
          ]} />
          <div className="ml-auto inline-flex p-1 bg-bg2 rounded-lg border border-line">
            <button onClick={() => setView('table')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold ${view === 'table' ? 'bg-white shadow-sm text-ink' : 'text-mute'}`}>Table</button>
            <button onClick={() => setView('grid')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold ${view === 'grid' ? 'bg-white shadow-sm text-ink' : 'text-mute'}`}>Grid</button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="py-10 text-center text-mute">Memuat…</Card>
      ) : filtered.length === 0 ? (
        <Card className="py-10 text-center text-mute">Belum ada berita.</Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="aspect-[16/9] bg-bg2 flex items-center justify-center text-mute overflow-hidden">
                {a.image
                  ? <img src={mediaUrl(a.image)} alt="" className="h-full w-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                  : <Icon name="book" size={24} />}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={a.status} />
                  {a.category?.name && <span className="text-xs font-semibold text-brand-600 bg-brand-600/10 px-2 py-0.5 rounded-full">{a.category.name}</span>}
                </div>
                <div className="font-semibold text-ink leading-tight line-clamp-2">{a.title}</div>
                <div className="text-xs text-mute">{a.user?.name || '—'} · {fmtDate(a.published_at)}</div>
                <div className="flex items-center gap-1 pt-1">
                  <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink disabled:opacity-40" title="Lihat" disabled={a.status !== 'Published'}
                    onClick={() => window.open('/berita/' + a.slug, '_blank')}><Icon name="eye" size={16} /></button>
                  <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" title="Edit" onClick={() => navigate('/articles/' + a.id + '/edit')}><Icon name="edit" size={16} /></button>
                  <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-red-600" title="Hapus" onClick={() => handleDelete(a)}><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
                <th className="px-5 py-3 font-semibold">Judul</th>
                <th className="py-3 font-semibold">Kategori</th>
                <th className="py-3 font-semibold">Penulis</th>
                <th className="py-3 font-semibold">Tanggal Terbit</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-bg2/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden shrink-0 bg-bg2 flex items-center justify-center text-mute">
                        {a.image
                          ? <img src={mediaUrl(a.image)} alt="" className="h-full w-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                          : <Icon name="book" size={16} />}
                      </div>
                      <div className="font-semibold text-ink leading-tight">{a.title}</div>
                    </div>
                  </td>
                  <td className="py-3 text-mute">{a.category?.name || '—'}</td>
                  <td className="py-3 text-mute">{a.user?.name || '—'}</td>
                  <td className="py-3 text-mute">{fmtDate(a.published_at)}</td>
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="pr-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink disabled:opacity-40" title="Lihat" disabled={a.status !== 'Published'}
                        onClick={() => window.open('/berita/' + a.slug, '_blank')}><Icon name="eye" size={16} /></button>
                      <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" title="Edit" onClick={() => navigate('/articles/' + a.id + '/edit')}><Icon name="edit" size={16} /></button>
                      <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-red-600" title="Hapus" onClick={() => handleDelete(a)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
