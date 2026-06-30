// UI store — the non-data, non-auth slices that used to live on AppCtx:
// dark mode, transient toast, and the cross-page invoice drawer.
import { create } from 'zustand';
import type { Invoice } from '@/types/api';

function readDark(): boolean {
  try { return localStorage.getItem('niatbaik_dark') === '1'; } catch { return false; }
}

function applyDark(v: boolean) {
  try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch { /* ignore */ }
  document.documentElement.classList.toggle('dark', v);
  document.body.classList.toggle('dark', v);
}

interface UiState {
  dark: boolean;
  toast: string;
  invoiceTxn: Invoice | null;
  setDark: (v: boolean) => void;
  showToast: (msg: string | { title?: string }) => void;
  openInvoice: (tx: Invoice) => void;
  closeInvoice: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set) => ({
  dark: readDark(),
  toast: '',
  invoiceTxn: null,

  setDark(v) { applyDark(v); set({ dark: v }); },

  showToast(msg) {
    const text = typeof msg === 'string' ? msg : (msg?.title || '');
    set({ toast: text });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: '' }), 2600);
  },

  openInvoice(tx) { set({ invoiceTxn: tx }); },
  closeInvoice() { set({ invoiceTxn: null }); },
}));
