// Homepage CMS editor (Settings → Homepage). One collapsible section per SiteContent key
// (navbar, hero, trust_strip, how_to, testimonials, faq, final_cta, footer). Each section
// edits a JSON blob and saves via api.updateSiteContent(key, data), then refreshes the
// public store so the change is live. Repeatable lists (links/steps/items/columns) get
// add/remove rows. Branding (logo/colors) stays in the existing Themes panel.
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { Card, Btn, Icon } from '@/components';

// DEFAULTS mirror the public sections' built-in fallbacks. site_content is not seeded in
// the DB, so on an empty table each admin form starts pre-filled with the copy the site
// currently shows — the admin edits from there, and only sections they save get persisted.
const DEFAULTS: Record<string, any> = {
  navbar: {
    links: [
      { label: 'Campaign', href: '#campaigns' },
      { label: 'Bagaimana?', href: '#how' },
      { label: 'Testimoni', href: '#testi' },
      { label: 'FAQ', href: '#faq' },
    ],
    ctaPrimary: 'Donasi Sekarang', loginLabel: 'Masuk',
  },
  hero: {
    badge: '{{donors}} donatur aktif', badgeSub: '· Update real-time',
    headline: 'Salurkan', headlineAccent: 'Niat Baik', headlineTail: 'Anda, wujudkan kebaikan nyata.',
    paragraph: 'Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf. Transparan, mudah, dan dipercaya oleh {{donors}}+ donatur di Indonesia.',
    ctaPrimary: 'Mulai Donasi', ctaSecondary: 'Lihat Campaign',
    trustLines: ['SSL Aman', 'Berizin Kemensos', 'Audit publik bulanan'],
  },
  trust_strip: {
    caption: 'Diliput & dipercaya oleh',
    items: [
      { name: 'Kementerian Sosial RI', src: '/trust/kemensos.svg' },
      { name: 'BAZNAS', src: '/trust/baznas.svg' },
      { name: 'PWNU', src: '/trust/nu.svg' },
      { name: 'Muhammadiyah', src: '/trust/muhammadiyah.svg' },
      { name: 'detikcom', src: '/trust/detik.png' },
      { name: 'CNN Indonesia', src: '/trust/cnn-indonesia.svg' },
      { name: 'Tempo', src: '/trust/tempo.svg' },
      { name: 'Liputan6', src: '/trust/liputan6.svg' },
      { name: 'Kompas', src: '/trust/kompas.svg' },
      { name: 'OJK', src: '/trust/ojk.png' },
    ],
  },
  how_to: {
    eyebrow: 'Cara berdonasi', heading: 'Mudah · Hanya 60 detik',
    sub: 'Donasi via NIATBAIK.ORG bisa dilakukan kapan saja, tanpa perlu daftar akun.',
    steps: [
      { icon: 'megaphone', title: 'Pilih campaign', desc: 'Pilih campaign sesuai niat baik Anda dari daftar terverifikasi.' },
      { icon: 'wallet', title: 'Tentukan nominal', desc: 'Isi nominal donasi. Mulai dari Rp 10.000.' },
      { icon: 'creditcard', title: 'Pilih pembayaran', desc: 'Bayar via QRIS, VA Bank, atau e-wallet favorit Anda.' },
      { icon: 'heart', title: 'Doakan & sebar', desc: 'Donasi tersalurkan. Ajak teman ikut dalam kebaikan.' },
    ],
  },
  testimonials: {
    eyebrow: 'Apa kata donatur',
    headingTpl: 'Bergabung bersama {{donors}}+ donatur Indonesia',
    headingFallback: 'Bergabung bersama para donatur Indonesia',
    sub: 'Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.',
    items: [
      { name: 'Ibu Sari, Bekasi', rating: '⭐⭐⭐⭐⭐', quote: 'Alhamdulillah, donasi saya untuk Aira dilaporkan transparan. Bahkan saya dikirim foto setelah operasinya. Sangat amanah.', color: '#2E4191' },
      { name: 'Pak Burhan, Bandung', rating: '⭐⭐⭐⭐⭐', quote: 'Sudah 3 tahun rutin sedekah lewat NIATBAIK. Donasi via QRIS, cepat dan langsung dapat kuitansi via WhatsApp.', color: '#38B6FF' },
      { name: 'Hamba Allah', rating: '⭐⭐⭐⭐⭐', quote: 'Donasi anonim juga dilayani. Yang penting niatnya baik, sampai ke yang membutuhkan. Terima kasih NIATBAIK.', color: '#16A34A' },
      { name: 'Andini, Surabaya', rating: '⭐⭐⭐⭐⭐', quote: 'Saya jadi fundraiser di NIATBAIK. Mudah dipakai, dan komisi bisa saya donasikan lagi. Berkah!', color: '#F59E0B' },
    ],
  },
  faq: {
    eyebrow: 'Pertanyaan umum', heading: 'Hal-hal yang sering ditanyakan',
    items: [
      { question: 'Apakah donasi saya terverifikasi dan aman?', answer: 'Setiap campaign di NIATBAIK.ORG melalui proses verifikasi tim kami: kunjungan lapangan, dokumen pengaju, hingga update rutin. Donatur juga menerima laporan transparan tiap minggu.' },
      { question: 'Bagaimana saya tahu donasi sudah diterima?', answer: 'Setelah pembayaran sukses, Anda akan menerima notifikasi & kuitansi otomatis via WhatsApp dan email. Riwayat donasi juga tampil di halaman campaign.' },
      { question: 'Apa metode pembayaran yang didukung?', answer: 'QRIS, Virtual Account BCA/Mandiri/BNI/BRI, GoPay, OVO, Dana, ShopeePay, hingga kartu kredit. Tinggal pilih yang paling nyaman.' },
      { question: 'Apakah saya bisa donasi sebagai Hamba Allah?', answer: 'Tentu. Centang "Donasi sebagai anonim" pada form, dan nama Anda akan tampil sebagai Hamba Allah di halaman publik.' },
      { question: 'Apakah donasi saya bisa dijadikan zakat?', answer: 'Ya. Campaign tertentu dapat menjadi penyaluran zakat. Anda akan mendapatkan bukti penyaluran zakat untuk pengurang pajak.' },
      { question: 'Apakah ada minimum donasi?', answer: 'Minimum donasi Rp 10.000. Tidak ada batas maksimum.' },
    ],
  },
  final_cta: {
    headline: 'Setiap niat baik, sekecil apapun, berdampak besar.',
    sub: 'Mulai donasi sekarang dan jadilah bagian dari kebaikan yang nyata.',
    buttonLabel: 'Donasi Sekarang',
  },
  footer: {
    blurb: 'Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.',
    waCtaLabel: 'Hubungi kami via WhatsApp',
    columns: [
      { title: 'Platform', links: [{ label: 'Donasi', href: '#campaigns' }, { label: 'Fundraiser', href: '#how' }, { label: 'Laporan transparansi', href: '#testi' }] },
      { title: 'Tentang', links: [{ label: 'Profil Yayasan' }, { label: 'Disklaimer', href: '/disklaimer' }] },
      { title: 'Bantuan', links: [{ label: 'FAQ', href: '#faq' }, { label: 'Kontak', href: 'wa' }, { label: 'Syarat & ketentuan', href: '/syarat-ketentuan' }, { label: 'Kebijakan privasi', href: '/kebijakan-privasi' }] },
    ],
    copyright: '© 2026 Yayasan NIATBAIK.', sslNote: 'Koneksi terenkripsi (SSL)',
  },
};

// ---- small field primitives (match the `.field` class used across admin forms) ----
function Text({ label, value, onChange, placeholder, area }: any) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-mute">{label}</span>
      {area
        ? <textarea className="field mt-1" rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}/>
        : <input className="field mt-1" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}/>}
    </label>
  );
}

// RowList renders an editable list of objects. `fields` describes each editable column.
function RowList({ label, rows, fields, onChange, blank }: any) {
  const list: any[] = Array.isArray(rows) ? rows : [];
  const set = (i: number, key: string, v: any) => onChange(list.map((r, idx) => idx === i ? { ...r, [key]: v } : r));
  const add = () => onChange([...list, { ...blank }]);
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-mute">{label}</span>
        <button onClick={add} className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"><Icon name="plus" size={13}/> Tambah</button>
      </div>
      <div className="space-y-2">
        {list.length === 0 && <div className="text-xs text-mute italic px-1">Belum ada item.</div>}
        {list.map((row, i) => (
          <div key={i} className="rounded-lg border border-line p-2.5 bg-bg2/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fields.map((f: any) => (
                <label key={f.key} className={f.full ? 'sm:col-span-2 block' : 'block'}>
                  <span className="text-[10px] uppercase tracking-wide text-mute">{f.label}</span>
                  {f.area
                    ? <textarea className="field mt-0.5 text-sm" rows={2} value={row[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => set(i, f.key, e.target.value)}/>
                    : <input className="field mt-0.5 text-sm" value={row[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => set(i, f.key, e.target.value)}/>}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} title="Naik" className="h-7 w-7 rounded hover:bg-bg2 text-mute disabled:opacity-30"><Icon name="chevronD" size={14} className="rotate-180"/></button>
              <button onClick={() => move(i, 1)} disabled={i === list.length - 1} title="Turun" className="h-7 w-7 rounded hover:bg-bg2 text-mute disabled:opacity-30"><Icon name="chevronD" size={14}/></button>
              <button onClick={() => remove(i)} title="Hapus" className="h-7 w-7 rounded hover:bg-bg2 text-mute hover:text-rose-600"><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SectionCard = one editable homepage section. `render` gets (draft, patch) where patch
// merges a partial into the draft. Save persists the whole draft under `sectionKey`.
function SectionCard({ title, sub, sectionKey, initial, render }: any) {
  const showToast = useUiStore((s) => s.showToast);
  // Prefer the saved blob; when a section has never been saved (empty table), start from the
  // built-in DEFAULTS so the form is pre-filled with the copy the site currently shows.
  const seed = (initial && Object.keys(initial).length) ? initial : (DEFAULTS[sectionKey] || {});
  const [draft, setDraft] = useState<any>(seed);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft((initial && Object.keys(initial).length) ? initial : (DEFAULTS[sectionKey] || {})); }, [initial, sectionKey]);
  const patch = (p: any) => setDraft((d: any) => ({ ...d, ...p }));
  const save = async () => {
    setSaving(true);
    try {
      await api.updateSiteContent(sectionKey, draft);
      await useDataStore.getState().refreshPublic();
      showToast(`Section "${title}" tersimpan`);
    } catch (e: any) { showToast('Gagal menyimpan: ' + (e?.message || '')); }
    setSaving(false);
  };
  return (
    <Card className="p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-bg2/40">
        <div>
          <div className="font-bold text-ink">{title}</div>
          {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
        </div>
        <Icon name="chevronD" size={18} className={`text-mute transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-line pt-4">
          {render(draft, patch)}
          <div className="flex justify-end pt-1">
            <Btn icon="check" onClick={save} loading={saving}>Simpan section</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SiteContentPanel() {
  const content = useDataStore((s) => s.siteContent) || {};
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-brand-50/50 border-brand-100">
        <div className="text-sm text-ink flex items-start gap-2">
          <Icon name="sparkle" size={16} className="text-brand-600 mt-0.5 shrink-0"/>
          <span>Kelola konten homepage — dari navbar sampai footer. Gunakan <code className="px-1 rounded bg-white border border-line text-[11px]">{'{{donors}}'}</code>, <code className="px-1 rounded bg-white border border-line text-[11px]">{'{{raised}}'}</code>, <code className="px-1 rounded bg-white border border-line text-[11px]">{'{{activeCampaigns}}'}</code> untuk angka real-time. Branding (logo &amp; warna) ada di tab <b>Branding</b>.</span>
        </div>
      </Card>

      <SectionCard title="Navbar" sub="Menu & tombol header" sectionKey="navbar" initial={content.navbar}
        render={(d: any, patch: any) => (<>
          <RowList label="Menu links" rows={d.links} onChange={(v: any) => patch({ links: v })}
            blank={{ label: '', href: '' }}
            fields={[{ key: 'label', label: 'Label' }, { key: 'href', label: 'Href (mis. #campaigns)' }]}/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Tombol utama" value={d.ctaPrimary} onChange={(v: any) => patch({ ctaPrimary: v })}/>
            <Text label="Label login" value={d.loginLabel} onChange={(v: any) => patch({ loginLabel: v })}/>
          </div>
        </>)}/>

      <SectionCard title="Hero" sub="Bagian utama paling atas" sectionKey="hero" initial={content.hero}
        render={(d: any, patch: any) => (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Badge" value={d.badge} onChange={(v: any) => patch({ badge: v })} placeholder="{{donors}} donatur aktif"/>
            <Text label="Badge sub" value={d.badgeSub} onChange={(v: any) => patch({ badgeSub: v })} placeholder="· Update real-time"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Text label="Judul (awal)" value={d.headline} onChange={(v: any) => patch({ headline: v })}/>
            <Text label="Judul (aksen warna)" value={d.headlineAccent} onChange={(v: any) => patch({ headlineAccent: v })}/>
            <Text label="Judul (akhir)" value={d.headlineTail} onChange={(v: any) => patch({ headlineTail: v })}/>
          </div>
          <Text label="Paragraf" area value={d.paragraph} onChange={(v: any) => patch({ paragraph: v })} placeholder="… dipercaya {{donors}}+ donatur …"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Tombol utama" value={d.ctaPrimary} onChange={(v: any) => patch({ ctaPrimary: v })}/>
            <Text label="Tombol kedua" value={d.ctaSecondary} onChange={(v: any) => patch({ ctaSecondary: v })}/>
          </div>
          <RowList label="Trust lines" rows={(d.trustLines || []).map((t: string) => ({ text: t }))}
            onChange={(v: any) => patch({ trustLines: v.map((r: any) => r.text) })}
            blank={{ text: '' }} fields={[{ key: 'text', label: 'Teks', full: true }]}/>
        </>)}/>

      <SectionCard title="Trust Strip" sub="Logo media/lembaga" sectionKey="trust_strip" initial={content.trust_strip}
        render={(d: any, patch: any) => (<>
          <Text label="Caption" value={d.caption} onChange={(v: any) => patch({ caption: v })}/>
          <RowList label="Logo" rows={d.items} onChange={(v: any) => patch({ items: v })}
            blank={{ name: '', src: '' }}
            fields={[{ key: 'name', label: 'Nama' }, { key: 'src', label: 'Path gambar (mis. /trust/x.svg)' }]}/>
        </>)}/>

      <SectionCard title="Cara Berdonasi" sub="Langkah-langkah" sectionKey="how_to" initial={content.how_to}
        render={(d: any, patch: any) => (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Eyebrow" value={d.eyebrow} onChange={(v: any) => patch({ eyebrow: v })}/>
            <Text label="Heading" value={d.heading} onChange={(v: any) => patch({ heading: v })}/>
          </div>
          <Text label="Sub" value={d.sub} onChange={(v: any) => patch({ sub: v })}/>
          <RowList label="Langkah" rows={d.steps} onChange={(v: any) => patch({ steps: v })}
            blank={{ icon: 'heart', title: '', desc: '' }}
            fields={[{ key: 'icon', label: 'Icon' }, { key: 'title', label: 'Judul' }, { key: 'desc', label: 'Deskripsi', full: true, area: true }]}/>
        </>)}/>

      <SectionCard title="Testimoni" sub="Kata donatur" sectionKey="testimonials" initial={content.testimonials}
        render={(d: any, patch: any) => (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Eyebrow" value={d.eyebrow} onChange={(v: any) => patch({ eyebrow: v })}/>
            <Text label="Heading (template)" value={d.headingTpl} onChange={(v: any) => patch({ headingTpl: v })} placeholder="Bergabung bersama {{donors}}+ …"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Heading fallback" value={d.headingFallback} onChange={(v: any) => patch({ headingFallback: v })}/>
            <Text label="Sub" value={d.sub} onChange={(v: any) => patch({ sub: v })}/>
          </div>
          <RowList label="Testimoni" rows={d.items} onChange={(v: any) => patch({ items: v })}
            blank={{ name: '', rating: '⭐⭐⭐⭐⭐', quote: '', color: '#2E4191' }}
            fields={[{ key: 'name', label: 'Nama' }, { key: 'rating', label: 'Rating (bintang)' }, { key: 'color', label: 'Warna avatar (hex)' }, { key: 'quote', label: 'Kutipan', full: true, area: true }]}/>
        </>)}/>

      <SectionCard title="FAQ" sub="Pertanyaan umum" sectionKey="faq" initial={content.faq}
        render={(d: any, patch: any) => (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Eyebrow" value={d.eyebrow} onChange={(v: any) => patch({ eyebrow: v })}/>
            <Text label="Heading" value={d.heading} onChange={(v: any) => patch({ heading: v })}/>
          </div>
          <RowList label="Item FAQ" rows={d.items} onChange={(v: any) => patch({ items: v })}
            blank={{ question: '', answer: '' }}
            fields={[{ key: 'question', label: 'Pertanyaan', full: true }, { key: 'answer', label: 'Jawaban', full: true, area: true }]}/>
        </>)}/>

      <SectionCard title="Final CTA" sub="Ajakan penutup" sectionKey="final_cta" initial={content.final_cta}
        render={(d: any, patch: any) => (<>
          <Text label="Judul" value={d.headline} onChange={(v: any) => patch({ headline: v })}/>
          <Text label="Sub" area value={d.sub} onChange={(v: any) => patch({ sub: v })}/>
          <Text label="Label tombol" value={d.buttonLabel} onChange={(v: any) => patch({ buttonLabel: v })}/>
        </>)}/>

      <SectionCard title="Footer" sub="Kolom & link bawah" sectionKey="footer" initial={content.footer}
        render={(d: any, patch: any) => (<>
          <Text label="Blurb" area value={d.blurb} onChange={(v: any) => patch({ blurb: v })}/>
          <Text label="Label CTA WhatsApp" value={d.waCtaLabel} onChange={(v: any) => patch({ waCtaLabel: v })}/>
          {(d.columns || []).map((col: any, ci: number) => (
            <div key={ci} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between mb-2">
                <input className="field text-sm font-bold max-w-[200px]" value={col.title ?? ''} placeholder="Judul kolom"
                  onChange={(e) => patch({ columns: d.columns.map((c: any, idx: number) => idx === ci ? { ...c, title: e.target.value } : c) })}/>
                <button onClick={() => patch({ columns: d.columns.filter((_: any, idx: number) => idx !== ci) })} className="h-7 w-7 rounded hover:bg-bg2 text-mute hover:text-rose-600"><Icon name="trash" size={14}/></button>
              </div>
              <RowList label="Link" rows={col.links}
                onChange={(v: any) => patch({ columns: d.columns.map((c: any, idx: number) => idx === ci ? { ...c, links: v } : c) })}
                blank={{ label: '', href: '' }}
                fields={[{ key: 'label', label: 'Label' }, { key: 'href', label: 'Href (kosong=nonaktif, "wa"=WhatsApp)' }]}/>
            </div>
          ))}
          <button onClick={() => patch({ columns: [...(d.columns || []), { title: 'Kolom Baru', links: [] }] })} className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1"><Icon name="plus" size={13}/> Tambah kolom</button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Text label="Copyright" value={d.copyright} onChange={(v: any) => patch({ copyright: v })}/>
            <Text label="Catatan SSL" value={d.sslNote} onChange={(v: any) => patch({ sslNote: v })}/>
          </div>
        </>)}/>
    </div>
  );
}
