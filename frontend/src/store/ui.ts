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

type ToastTone = 'ok' | 'bad' | 'ink';

interface UiState {
  dark: boolean;
  toast: string;
  toastTone: ToastTone;
  invoiceTxn: Invoice | null;
  setDark: (v: boolean) => void;
  showToast: (msg: string | { title?: string }, tone?: ToastTone) => void;
  openInvoice: (tx: Invoice) => void;
  closeInvoice: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

// A toast used to ALWAYS render green with a checkmark, so error/warning messages
// ("Gagal…", "File harus berupa gambar") looked like success. When a tone isn't given
// explicitly, infer 'bad' from failure keywords so existing error toasts turn red without
// touching every call site.
const ERROR_RE = /gagal|salah|tidak valid|tidak dapat|harus|wajib|maks|maksimal|minimal|periksa|error|invalid|failed/i;
const inferTone = (text: string): ToastTone => (ERROR_RE.test(text) ? 'bad' : 'ok');

export const useUiStore = create<UiState>((set) => ({
  dark: readDark(),
  toast: '',
  toastTone: 'ok',
  invoiceTxn: null,

  setDark(v) { applyDark(v); set({ dark: v }); },

  showToast(msg, tone) {
    const text = typeof msg === 'string' ? msg : (msg?.title || '');
    set({ toast: text, toastTone: tone || inferTone(text) });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: '' }), 2600);
  },

  openInvoice(tx) { set({ invoiceTxn: tx }); },
  closeInvoice() { set({ invoiceTxn: null }); },
}));
