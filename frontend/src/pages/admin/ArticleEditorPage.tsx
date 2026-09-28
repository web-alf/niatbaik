import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Btn, Icon } from '@/components';
import { api, mediaUrl } from '@/lib/api';
import { useUiStore } from '@/store/ui';
import { RichEditor } from './CampaignEditorPage';

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const isEdit = !!id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [status, setStatus] = useState('Draft');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Categories are shared with campaigns — reuse the existing endpoint rather than
  // maintaining a separate article-category list.
  useEffect(() => {
    api.categories().then((res) => setCategories((res?.data as any[]) || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.adminArticle(id).then((res) => {
      const a: any = res?.data;
      if (a) {
        setTitle(a.title || '');
        setCategoryId(a.category_id || '');
        setExcerpt(a.excerpt || '');
        setContent(a.content || '');
        setCover(a.image || '');
        setStatus(a.status || 'Draft');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const back = () => navigate('/articles');

  const handleCover = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type && !f.type.startsWith('image/')) { showToast('File harus berupa gambar'); e.target.value = ''; return; }
    if (f.size > 5 * 1024 * 1024) { showToast('Ukuran file melebihi 5MB'); e.target.value = ''; return; }
    setUploading(true);
    try {
      const res = await api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      if (url) setCover(url);
      else showToast(res?.message || 'Upload gagal');
    } catch (err: any) {
      showToast(err?.message || 'Upload gagal');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title.trim()) { showToast('Judul wajib diisi'); return; }
    if (!content.trim()) { showToast('Isi berita wajib diisi'); return; }
    setSaving(true);
    const payload = { title, excerpt, content, image: cover, status, category_id: categoryId };
    try {
      if (isEdit) await api.updateArticle(id!, payload);
      else await api.createArticle(payload);
      showToast(isEdit ? 'Berita berhasil diupdate' : 'Berita berhasil disimpan');
      back();
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan berita');
    }
    setSaving(false);
  };

  if (loading) return <div className="py-20 text-center text-mute">Memuat…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{isEdit ? 'Edit Berita' : 'Tulis Berita'}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <button onClick={back} className="text-mute hover:text-ink font-medium">Berita</button>
            <Icon name="chevronR" size={12} className="text-mute" />
            <span className="text-brand-600 font-semibold">{isEdit ? 'Edit' : 'Tulis Baru'}</span>
          </div>
        </div>
        <Btn variant="outline" tone="ink" icon="chevronL" onClick={back}>Kembali</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 lg:p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-ink">Judul <span className="text-rose-600">*</span></label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="field mt-1.5" placeholder="Cth: Yayasan Salurkan Bantuan untuk Korban Banjir" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">Ringkasan</label>
                  <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="field mt-1.5 resize-none" placeholder="Ringkasan singkat yang tampil di daftar berita" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Cover</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
                <div onClick={() => !uploading && fileRef.current?.click()}
                  className="mt-1.5 aspect-[16/10] rounded-xl bg-bg2 border-2 border-dashed border-line hover:border-brand-400 cursor-pointer flex items-center justify-center text-mute overflow-hidden relative">
                  {cover
                    ? <img src={mediaUrl(cover)} alt="Cover" className="absolute inset-0 h-full w-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                    : <div className="flex flex-col items-center"><Icon name="image" size={28} className="mb-2" /><span className="text-xs font-semibold">{uploading ? 'Mengupload…' : 'Klik untuk upload gambar'}</span></div>}
                </div>
                {cover && <button onClick={() => setCover('')} className="mt-1.5 text-xs font-semibold text-mute hover:text-red-600">Hapus cover</button>}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Isi Berita <span className="text-rose-600">*</span></label>
              <RichEditor value={content} onChange={setContent} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="font-bold text-ink">Publikasi</div>
            <div className="flex items-center gap-2">
              {['Draft', 'Published'].map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${status === s ? 'bg-brand-600 border-brand-600 text-white' : 'border-line text-mute hover:text-ink'}`}>
                  {s === 'Draft' ? 'Draft' : 'Published'}
                </button>
              ))}
            </div>
            <div className="pt-2 space-y-2">
              <Btn className="w-full" icon="check" disabled={saving} onClick={handleSave}>
                {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Berita'}
              </Btn>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="font-bold text-ink">Kategori</div>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Card>
        </div>
      </div>
    </div>
  );
}
