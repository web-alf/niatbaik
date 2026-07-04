
// Realtime auto-refresh via long-poll on /api/events. Ported from app.jsx.
// While enabled (logged in), holds a long-poll; when the server's data revision
// advances (any mutation), refetches admin data. The store update fans out to
// selectors automatically — no dataTick. Pauses while the tab is hidden; backs off
// on error; self-cancels on disable/unmount. <1s, Cloudflare-friendly (no WS).
import { useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useDataStore } from '@/store/data';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RealtimeProvider({ enabled, role, children }: { enabled: boolean; role?: string; children: ReactNode }) {
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let rev = 0;
    (async () => {
      // Seed the revision so the first poll only returns on a *new* change.
      try { const r0 = await api.events(0); rev = r0?.data?.revision ?? 0; } catch { /* ignore */ }
      while (!stopped) {
        if (document.hidden) { await sleep(2000); continue; }
        try {
          const res: any = await api.events(rev);
          if (stopped) break;
          const body = res?.data ?? res;
          if (body && body.changed) {
            rev = body.revision ?? rev;
            await useDataStore.getState().refreshAdmin(role);
          } else if (body && body.revision != null) {
            rev = body.revision; // timeout tick — just re-poll
          }
        } catch {
          if (!stopped) await sleep(5000); // network/auth blip — back off
        }
      }
    })();
    return () => { stopped = true; };
  }, [enabled, role]);

  return <>{children}</>;
}
