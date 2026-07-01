// useAdminSync — keeps an admin page fresh across devices/sessions.
//
// The store bumps `adminRev` whenever refreshAdmin() finishes (RealtimeProvider calls
// it on a server revision change from any mutating request; we also re-run on window
// focus so a tab resumed on device B pulls changes device A just made). Pages that
// fetch their own admin list subscribe here and re-load when the rev advances.
import { useEffect, useRef } from 'react';
import { useDataStore } from '@/store/data';

export function useAdminSync(load: () => void | Promise<void>) {
  const rev = useDataStore((s) => s.adminRev);
  const loadRef = useRef(load);
  loadRef.current = load;

  // Re-run the page's load whenever the admin revision advances (cross-device sync).
  useEffect(() => { loadRef.current(); /* eslint-disable-next-line */ }, [rev]);

  // Also refresh when the tab regains focus (covers the case where the long-poll was
  // paused while hidden and the change happened on another device).
  useEffect(() => {
    const onFocus = () => { loadRef.current(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);
}
