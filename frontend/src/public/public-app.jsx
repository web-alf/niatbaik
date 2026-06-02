// public-app.jsx (stub — replaced in Phase 5). Public landing + campaign detail.
const { useState: uS_pub } = React;

function LandingPage() {
  const { openCampaign, navigate } = useApp();
  const list = window.CAMPAIGNS || (window.NB && window.NB.campaignSeed) || [];
  return (
    <div className="min-h-screen bg-bg2">
      <header className="h-16 bg-white border-b border-line flex items-center px-4 lg:px-6">
        <Logo size={28}/>
        <div className="flex-1"/>
        <button onClick={() => navigate('dashboard')} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700">Masuk</button>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-ink">Salurkan niat baik Anda hari ini.</h1>
        <p className="mt-2 text-mute">Landing publik — segera hadir.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.slice(0, 6).map((c) => (
            <button key={c.id || c.slug} onClick={() => openCampaign(c.slug || c.id)}
              className="text-left bg-white rounded-2xl border border-line shadow-card p-4 hover:shadow-pop transition-shadow">
              <div className="font-bold text-ink line-clamp-2">{c.title}</div>
              <div className="mt-2 text-sm text-mute">{c.category}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function CampaignDetail({ id, onBack }) {
  const list = window.CAMPAIGNS || (window.NB && window.NB.campaignSeed) || [];
  const c = list.find(x => x.slug === id || x.id === id) || list[0] || {};
  return (
    <div className="min-h-screen bg-bg2">
      <header className="h-16 bg-white border-b border-line flex items-center px-4 lg:px-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Icon name="chevronL" size={16}/> Kembali</button>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-extrabold text-ink">{c.title || 'Campaign'}</h1>
        <p className="mt-2 text-mute">Detail campaign + form donasi — segera hadir.</p>
      </main>
    </div>
  );
}

function CampaignDetailModal({ campaign, onClose }) {
  if (!campaign) return null;
  return (
    <Modal open={true} onClose={onClose} title="Preview Campaign" size="lg">
      <div className="text-mute text-sm">Preview: {campaign.title || campaign}</div>
    </Modal>
  );
}

window.LandingPage = LandingPage;
window.CampaignDetail = CampaignDetail;
window.CampaignDetailModal = CampaignDetailModal;
