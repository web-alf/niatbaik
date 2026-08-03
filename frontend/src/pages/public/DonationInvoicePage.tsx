// Donation invoice page. Ported from _legacy_src/public/public-app.jsx (DonationInvoicePage).
// invoiceNumber comes from the URL (:invoiceNumber); onBack → navigate('/').
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { mapCampaign } from '@/lib/mappers';
import { NBTracking } from '@/lib/tracking';
import { useDataStore } from '@/store/data';
import { Icon, Logo } from '@/components';
import { InvoiceConfirmation, Footer, usePublicDark } from './_components';

export default function DonationInvoicePage() {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const onBack = () => navigate('/');

  const [dark, toggleDark] = usePublicDark();
  const [invoice, setInvoice] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ok' | 'notfound' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;
    if (!invoiceNumber) {
      setState('notfound');
      return;
    }

    (async () => {
      try {
        const res = await api.paymentStatus(invoiceNumber);
        if (!alive) return;
        if (!res || !res.data) {
          setState('notfound');
          return;
        }

        const invData = res.data;
        setInvoice(invData);

        // Fetch campaign details using the campaign ID or slug
        const campId = invData.campaign_id;
        if (campId) {
          try {
            const campRes = await api.campaign(campId);
            if (alive && campRes && campRes.data) {
              const mapped = mapCampaign(campRes.data);
              setCampaign(mapped);
              // Load the campaign's own pixels here too — a donor may land directly on the
              // invoice page (e.g. returning from a Flip redirect) without passing through
              // the campaign page where initCampaignPixels normally runs. Needed so the
              // success conversion (fired in InvoiceConfirmation) has the right pixels.
              try { NBTracking.initCampaignPixels(mapped, useDataStore.getState().publicSettings); } catch {}
            }
          } catch (e) {
            console.error('Failed to load campaign for invoice:', e);
          }
        }

        setState('ok');
      } catch (e: any) {
        if (alive) {
          if (e?.status === 404) {
            setState('notfound');
          } else {
            setState('error');
            setErrorMsg(e?.message || 'Gagal memuat detail invoice');
          }
        }
      }
    })();

    return () => { alive = false; };
  }, [invoiceNumber]);

  const Header = (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <Icon name="chevronL" size={16}/> Kembali ke beranda
        </button>
        <div className="flex-1"/>
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="h-9 w-9 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>
        <Logo size={28}/>
      </div>
    </header>
  );

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-bg2">
        {Header}
        <main className="flex-1 flex items-center justify-center text-mute text-sm">
          <span className="h-5 w-5 mr-3 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"/>
          Memuat invoice…
        </main>
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen flex flex-col bg-bg2">
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="h-16 w-16 rounded-2xl bg-white border border-line flex items-center justify-center text-mute mb-4"><Icon name="search" size={28}/></div>
          <div className="text-xl font-extrabold text-ink">Invoice tidak ditemukan</div>
          <div className="mt-1 text-sm text-mute max-w-sm">Kami tidak dapat menemukan link pembayaran ini. Mohon dicek kembali atau tanya pemilik link apakah link-nya sudah benar.</div>
          <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
            <Icon name="home" size={16}/> Kembali ke beranda
          </button>
        </main>
        <Footer/>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-bg2">
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="h-16 w-16 rounded-2xl bg-white border border-line flex items-center justify-center text-rose-500 mb-4"><Icon name="bolt" size={28}/></div>
          <div className="text-xl font-extrabold text-ink">Gagal memuat invoice</div>
          <div className="mt-1 text-sm text-mute max-w-sm">{errorMsg}</div>
          <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
            <Icon name="home" size={16}/> Kembali ke beranda
          </button>
        </main>
        <Footer/>
      </div>
    );
  }

  // Create a minimal campaign object if campaign failed to load
  const c = campaign || { title: invoice.campaign_title || 'Donasi', icon: 'heart', id: invoice.campaign_id };

  return (
    <div className="min-h-screen flex flex-col bg-bg2">
      {Header}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 lg:py-10">
        <InvoiceConfirmation
          c={c}
          invoice={invoice}
          amount={invoice.amount}
          paymentMethod={invoice.payment_method}
          onReset={onBack}
        />
      </main>
      <Footer/>
    </div>
  );
}
