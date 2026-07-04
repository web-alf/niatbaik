// Public shell: just an Outlet + global toast + the data-ready gate. Ported from
// app.jsx public-route branch (isPublicRoute && !dataReady → null).
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toast, ErrorBoundary } from '@/components';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { NBTracking } from '@/lib/tracking';

export function PublicLayout() {
  const ready = useDataStore((s) => s.ready);
  const toast = useUiStore((s) => s.toast);
  const toastTone = useUiStore((s) => s.toastTone);

  // Public pages need public data (campaigns, settings, payment methods) before they
  // render meaningfully. Kick a public refresh once on mount if it hasn't run. Also fire
  // the visit beacon once (records a real page view for the analytics traffic breakdown;
  // captureUTM already ran in refreshPublic, so getUTM has the source).
  useEffect(() => {
    if (!ready) useDataStore.getState().refreshAll(false);
    const slug = (typeof window !== 'undefined' && /^\/c\//.test(window.location.pathname))
      ? window.location.pathname.split('/c/')[1]?.split(/[/?#]/)[0] : '';
    NBTracking.trackVisit(slug);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toast message={toast} tone={toastTone} />
    </>
  );
}
