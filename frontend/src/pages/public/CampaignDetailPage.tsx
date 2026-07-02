// Campaign detail page. Ported from _legacy_src/public/public-app.jsx (CampaignDetail).
// Slug comes from the URL (:slug); onBack → navigate('/').
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { mapCampaign } from '@/lib/mappers';
import { Icon } from '@/components';
import { useDataStore } from '@/store/data';
import { Navbar, Footer, SocialPopup, CampaignPage, getCampaigns } from './_components';

export default function CampaignDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const id: any = slug;
  const onBack = () => navigate('/');

  const list = useDataStore((s) => s.campaigns) || getCampaigns();
  // Resolve strictly by exact slug/id — NO fallback to another campaign (a wrong
  // slug like /c/anjay must not silently show a different program).
  const fromList = (id && list.find((x: any) => x.slug === id || x.id === id)) || null;

  // 'loading' until we know; then either the campaign object or null (not found).
  const [resolved, setResolved] = useState<any>(fromList);
  const [state, setState] = useState(fromList ? 'ok' : (id ? 'loading' : 'notfound'));

  useEffect(() => {
    let alive = true;
    if (fromList || !id) { return; }
    // Not in the in-memory list (e.g. a direct deep-link before the list loaded, or
    // a paused/non-listed campaign). Try fetching it by slug from the API.
    if (api && api.campaign) {
      api.campaign(id)
        .then((r: any) => {
          if (!alive) return;
          if (r && r.data) { setResolved(mapCampaign(r.data)); setState('ok'); }
          else setState('notfound');
        })
        .catch(() => { if (alive) setState('notfound'); });
    } else {
      setState('notfound');
    }
    return () => { alive = false; };
  }, [id]);

  // Same navbar as the landing page (consistent header across the public site). The logo /
  // 'home' action + section links return to the landing route via onBack; the Donasi button
  // routes through onNav('campaign') like everywhere else.
  // Desktop-only global header. On mobile the campaign page shows its own compact
  // sub-bar with a "Kembali ke beranda" back button, so the global Navbar is hidden to
  // give the campaign content the full small screen (per feedback).
  const Header = (
    <div className="hidden lg:block">
      <Navbar onNav={(name: any) => { if (name === 'home') onBack(); }} onHome={onBack}/>
    </div>
  );

  if (state === 'loading') {
    // Skeleton mirrors the real campaign-detail layout (cover + story on the left, the
    // donation card on the right) so the page doesn't visually jump when content lands.
    const Bar = ({ className = '' }: any) => <div className={`rounded bg-slate-200 animate-pulse ${className}`}/>;
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {Header}
        <section className="bg-bg2 border-b border-line">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
            <Bar className="h-5 w-36"/><Bar className="h-9 w-24 rounded-lg"/>
          </div>
        </section>
        <main className="flex-1 bg-bg2">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <Bar className="aspect-[16/9] w-full rounded-2xl"/>
              <div className="rounded-2xl bg-white border border-line p-5 lg:p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse"/>
                  <div className="flex-1 space-y-2"><Bar className="h-4 w-40"/><Bar className="h-3 w-24"/></div>
                </div>
                <Bar className="h-4 w-full"/><Bar className="h-4 w-11/12"/><Bar className="h-4 w-10/12"/>
                <Bar className="h-4 w-full"/><Bar className="h-4 w-9/12"/>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white border border-line p-5 lg:p-6 space-y-4 lg:sticky lg:top-20">
                <Bar className="h-7 w-2/3"/>
                <Bar className="h-2.5 w-full rounded-full"/>
                <div className="flex justify-between"><Bar className="h-4 w-24"/><Bar className="h-4 w-20"/></div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Bar className="h-11 rounded-lg"/><Bar className="h-11 rounded-lg"/><Bar className="h-11 rounded-lg"/>
                </div>
                <Bar className="h-12 w-full rounded-xl"/>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (state === 'notfound' || !resolved) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="h-16 w-16 rounded-2xl bg-bg2 flex items-center justify-center text-mute mb-4"><Icon name="search" size={28}/></div>
          <div className="text-xl font-extrabold text-ink">Campaign tidak ditemukan</div>
          <div className="mt-1 text-sm text-mute max-w-sm">Tautan mungkin salah atau campaign sudah tidak tersedia.</div>
          <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
            <Icon name="home" size={16}/> Kembali ke beranda
          </button>
        </main>
        <Footer/>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {Header}
      <main className="flex-1 pb-8 lg:pb-0">
        <CampaignPage c={resolved} onNav={(name: any) => { if (name === 'home') onBack(); }}/>
      </main>
      <SocialPopup/>
    </div>
  );
}
