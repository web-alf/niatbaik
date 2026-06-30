// Public shell: just an Outlet + global toast + the data-ready gate. Ported from
// app.jsx public-route branch (isPublicRoute && !dataReady → null).
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toast, ErrorBoundary } from '@/components';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';

export function PublicLayout() {
  const ready = useDataStore((s) => s.ready);
  const toast = useUiStore((s) => s.toast);

  // Public pages need public data (campaigns, settings, payment methods) before they
  // render meaningfully. Kick a public refresh once on mount if it hasn't run.
  useEffect(() => {
    if (!ready) useDataStore.getState().refreshAll(false);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toast message={toast} />
    </>
  );
}
