// Native browser notifications for the admin/staff panel. When the realtime poll
// lands new unread notification rows in the data store, fire a desktop
// Notification so staff see donations/CS events even when the tab is in the
// background. No-ops when the API is unavailable (http, old browser) or denied.
import { useEffect, useRef } from 'react';
import { useDataStore } from '@/store/data';
import { mediaUrl } from '@/lib/api';

// Ask for permission on the FIRST user gesture instead of on page load —
// Chrome demotes load-time prompts to its "quieter UI" which most users never see.
function ensurePermissionOnGesture() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  const ask = () => { Notification.requestPermission().catch(() => {}); };
  window.addEventListener('pointerdown', ask, { once: true });
}

function show(n: any) {
  try {
    const title = n.title || 'Notifikasi baru';
    const body = n.message || n.subtitle || '';
    const notif = new Notification(title, {
      body,
      // tag dedupes: same row re-observed (another tab, re-poll) replaces, not stacks.
      tag: `nb-notif-${n.id}`,
      // Admin-uploaded logo (no favicon.ico in this app); undefined = browser default.
      icon: (() => { const l = useDataStore.getState().publicSettings?.logo; return l ? mediaUrl(l) : undefined; })(),
    });
    notif.onclick = () => {
      try { window.focus(); } catch {}
      // Route the click to the notifications page without a full reload.
      try { window.dispatchEvent(new CustomEvent('nb-open-notifications')); } catch {}
      notif.close();
    };
  } catch { /* constructor can throw on some mobile browsers — ignore */ }
}

export function useBrowserNotifications() {
  const notifications = useDataStore((s) => s.notifications);
  const seen = useRef<Set<string>>(new Set());
  const booted = useRef(false);

  useEffect(() => { ensurePermissionOnGesture(); }, []);

  useEffect(() => {
    const list = Array.isArray(notifications) ? notifications : [];
    if (!booted.current) {
      // First load = history, not news. Seed and stay quiet.
      for (const n of list) seen.current.add(String(n.id));
      if (list.length || useDataStore.getState().ready) booted.current = true;
      return;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    for (const n of list) {
      const id = String(n.id);
      if (seen.current.has(id)) continue;
      seen.current.add(id);
      const unread = !((n as any).is_read ?? (n as any).read_at ?? (n as any).read);
      if (unread) show(n);
    }
  }, [notifications]);
}
