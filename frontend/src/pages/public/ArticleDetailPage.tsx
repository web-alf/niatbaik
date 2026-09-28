// Public "Berita" detail, backed by GET /api/articles/:slug (Draft rows 404 here).
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { api, mediaUrl, sanitizeHTML, normalizeRichTextColors } from '@/lib/api';
import { Navbar, Footer, SocialPopup } from './_components';
import { fmtArticleDate } from './ArticleListPage';

type Article = {
  id: string; slug: string; title: string; excerpt?: string; content?: string; image?: string;
  published_at?: string | null; created_at?: string;
  user?: { name?: string } | null;
  category?: { id: string; name: string } | null;
};

export default function ArticleDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.article(slug)
      .then((res: any) => setArticle(res?.data ?? res ?? null))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    api.articles('limit=4')
      .then((res: any) => {
        const rows: Article[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setRelated(rows.filter((a) => a.slug !== slug).slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [slug]);

  // Content is rich HTML from the admin editor — sanitize before injecting (same
  // allow-list the campaign story uses), then normalize pasted inline colors.
  const body = article?.content ? normalizeRichTextColors(sanitizeHTML(article.content) as string) : '';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNav={(name: any) => { if (name === 'home') navigate('/'); }} onHome={() => navigate('/')} />
      <main className="flex-1">
        {loading ? (
          <div className="max-w-3xl mx-auto px-4 py-24 text-center text-mute">Memuat…</div>
        ) : !article ? (
          <div className="max-w-3xl mx-auto px-4 py-24 text-center">
            <div className="text-mute">Berita tidak ditemukan.</div>
            <button onClick={() => navigate('/berita')} className="mt-4 text-brand-600 font-bold hover:underline">Kembali ke Berita</button>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto px-4 lg:px-6 py-10 lg:py-16">
            <button onClick={() => navigate('/berita')} className="flex items-center gap-1.5 text-sm font-bold text-mute hover:text-brand-600 transition-colors">
              <Icon name="chevronL" size={16} /> Kembali ke Berita
            </button>

            <div className="mt-6 aspect-[16/8] rounded-none bg-brand-100 bg-contain bg-no-repeat bg-center flex items-center justify-center text-brand-600/70"
              style={{ backgroundImage: article.image ? `url(${mediaUrl(article.image)})` : undefined }}>
              {!article.image && <Icon name="book" size={64} strokeWidth={1.2} />}
            </div>

            {article.category?.name && (
              <div className="mt-7 text-xs font-bold uppercase tracking-widest text-brand-600">{article.category.name}</div>
            )}
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">{article.title}</h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-mute">
              <span>{article.user?.name || 'Tim NIATBAIK.ORG'}</span>
              <span>&middot;</span>
              <span>{fmtArticleDate(article)}</span>
            </div>

            {body ? (
              <div className="mt-8 prose prose-slate prose-sm sm:prose-base max-w-none text-ink/85"
                dangerouslySetInnerHTML={{ __html: body }} />
            ) : article.excerpt ? (
              <p className="mt-8 leading-relaxed text-ink/85">{article.excerpt}</p>
            ) : null}

            {related.length > 0 && (
              <div className="mt-14 pt-10 border-t border-line">
                <h2 className="text-lg font-extrabold text-ink tracking-tight">Berita Terkait</h2>
                <div className="mt-5 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
                  {related.map((a) => (
                    <button key={a.slug} onClick={() => navigate('/berita/' + a.slug)}
                      className="group shrink-0 w-[70%] sm:w-[45%] lg:w-[31%] snap-start text-left rounded-none bg-white border border-line shadow-card hover:shadow-pop transition-all hover:-translate-y-1 overflow-hidden">
                      <div className="relative aspect-[16/10] bg-brand-100 bg-contain bg-no-repeat bg-center flex items-center justify-center text-brand-600/70"
                        style={{ backgroundImage: a.image ? `url(${mediaUrl(a.image)})` : undefined }}>
                        {!a.image && <Icon name="book" size={40} strokeWidth={1.2} />}
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-mute">{fmtArticleDate(a)}</div>
                        <div className="mt-1 font-bold text-ink line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">{a.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>
      <SocialPopup />
      <Footer />
    </div>
  );
}
