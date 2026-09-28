// Public "Berita" listing, backed by GET /api/articles (Published rows only).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, SearchInput, Select } from '@/components';
import { api, mediaUrl } from '@/lib/api';
import { Navbar, Footer, SocialPopup } from './_components';

type Article = {
  id: string; slug: string; title: string; excerpt?: string; image?: string;
  published_at?: string | null; created_at?: string; featured?: boolean;
  category?: { id: string; name: string } | null;
};

const ALL_CATEGORIES = 'Semua Kategori';

export function fmtArticleDate(a: Pick<Article, 'published_at' | 'created_at'>): string {
  const raw = a.published_at || a.created_at;
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Peek carousel of the latest articles — same infinite-loop pattern as the landing
// page's HeroCampaignSlider: the slide list is tripled ([A,B,C,A,B,C,A,B,C]) so the
// visitor can swipe/scroll sideways forever; drifting into the first/last copy
// silently snaps back to the middle copy (same content, no visible seam).
const ARTICLE_LOOPS = 3;
function ArticleHeroSlider({ articles, onOpen }: { articles: Article[]; onOpen: (slug: string) => void }) {
  const n = articles.length;
  const loopSlides = useMemo(() => (
    n ? Array.from({ length: n * ARTICLE_LOOPS }, (_, i) => articles[i % n]) : []
  ), [articles, n]);

  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [physIdx, setPhysIdx] = useState(n); // start on the middle copy
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdx = n ? (((physIdx % n) + n) % n) : 0;

  const scrollToPhys = (i: number, smooth = true) => {
    const track = trackRef.current, el = slideRefs.current[i];
    if (!track || !el) return;
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };
  const goTo = (targetActiveIdx: number) => {
    const target = (physIdx - activeIdx) + targetActiveIdx;
    setPhysIdx(target);
    scrollToPhys(target);
  };

  useEffect(() => { if (n) scrollToPhys(n, false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [n]);
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => { const next = physIdx + 1; setPhysIdx(next); scrollToPhys(next); }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physIdx, n]);

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || !n) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = physIdx, bestDist = Infinity;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs((el.offsetLeft + el.offsetWidth / 2) - mid);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    if (best !== physIdx) setPhysIdx(best);

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (best < n || best >= n * (ARTICLE_LOOPS - 1)) {
        const target = n + (((best % n) + n) % n);
        const from = slideRefs.current[best], to = slideRefs.current[target];
        if (from && to) track.scrollLeft += (to.offsetLeft - from.offsetLeft);
        setPhysIdx(target);
      }
    }, 150);
  };
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);

  if (!n) return null;
  const active = articles[activeIdx];
  return (
    <div className="w-full">
      <div ref={trackRef} onScroll={onTrackScroll} className="flex gap-0 sm:gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar px-[6%] sm:px-[8%]">
        {loopSlides.map((a, i) => (
          <button key={a.slug + '-' + i} ref={(el) => { slideRefs.current[i] = el; }} onClick={() => onOpen(a.slug)}
            className="relative shrink-0 w-[88%] sm:w-[84%] aspect-[4/3] sm:aspect-[16/7] rounded-2xl overflow-hidden bg-brand-100 snap-center shadow-card transition-transform duration-300 flex items-center justify-center text-brand-600/70 bg-contain bg-no-repeat bg-center"
            style={{ transform: i === physIdx ? 'scale(1)' : 'scale(0.92)', opacity: i === physIdx ? 1 : 0.6, backgroundImage: a.image ? `url(${mediaUrl(a.image)})` : undefined }}>
            {!a.image && <Icon name="book" size={56} strokeWidth={1.2} />}
          </button>
        ))}
      </div>
      <button onClick={() => onOpen(active.slug)} className="mt-6 block w-full max-w-2xl mx-auto px-6 text-center group">
        <div className="text-xs font-bold uppercase tracking-widest text-brand-600">{fmtArticleDate(active)}</div>
        <div className="mt-1.5 text-xl lg:text-2xl font-extrabold text-ink line-clamp-2 group-hover:text-brand-600 transition-colors">{active.title}</div>
      </button>
      {n > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {articles.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-brand-600' : 'w-1.5 bg-line'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArticleListPage() {
  const navigate = useNavigate();
  const openArticle = (slug: string) => navigate('/berita/' + slug);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // ponytail: fetch once and filter client-side — a newsroom list is small. Switch to
  // server-side ?search=&category=&page= (the endpoint already supports it) past ~500 rows.
  useEffect(() => {
    api.articles('limit=500')
      .then((res: any) => setArticles(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(articles.map((a) => a.category?.name).filter(Boolean) as string[]))],
    [articles]
  );
  // Slider = admin-starred articles; falls back to the 3 newest when none are starred.
  const heroArticles = useMemo(() => {
    const starred = articles.filter((a) => a.featured);
    return starred.length ? starred : articles.slice(0, 3);
  }, [articles]);
  const filtered = articles.filter((a) =>
    (category === ALL_CATEGORIES || a.category?.name === category) &&
    a.title.toLowerCase().includes(q.trim().toLowerCase())
  );
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNav={(name: any) => { if (name === 'home') navigate('/'); }} onHome={() => navigate('/')} />
      <main className="flex-1">
        {articles.length > 0 && (
          <section className="relative overflow-hidden bg-bg2 border-b border-line pt-3 pb-10 lg:pt-5 lg:pb-20">
            <ArticleHeroSlider articles={heroArticles} onOpen={openArticle} />
          </section>
        )}
        <section className="py-14 lg:py-20 bg-bg2">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Kabar Terbaru</div>
                <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">Berita &amp; Kegiatan</h1>
                <p className="mt-2 text-mute">Kabar terbaru seputar program dan penyaluran donasi NIATBAIK.ORG.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
                <SearchInput className="sm:w-64" placeholder="Cari berita…" value={q} onChange={setQ} />
                <Select className="sm:w-52" icon="filter" value={category} onChange={setCategory} options={categories} />
              </div>
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-mute">{loading ? 'Memuat…' : 'Belum ada berita.'}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((a) => (
                <button key={a.slug} onClick={() => navigate('/berita/' + a.slug)} className="group text-left rounded-2xl bg-white border border-line shadow-card hover:shadow-pop transition-all hover:-translate-y-1 overflow-hidden">
                  <div className="relative aspect-[16/10] bg-contain bg-no-repeat bg-center bg-brand-100 flex items-center justify-center text-brand-600/70"
                    style={{ backgroundImage: a.image ? `url(${mediaUrl(a.image)})` : undefined }}>
                    {!a.image && <Icon name="book" size={48} strokeWidth={1.2} />}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-mute">{fmtArticleDate(a)}</div>
                    <div className="mt-1 font-bold text-ink line-clamp-2 min-h-[2.8rem] leading-snug group-hover:text-brand-600 transition-colors">{a.title}</div>
                    <p className="mt-2 text-sm text-mute line-clamp-2">{a.excerpt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SocialPopup />
      <Footer />
    </div>
  );
}
