// Ambient globals: tracking pixels injected at runtime + the static-GTM dedupe flag
// set by index.html. These are real browser-runtime contracts, not code coupling.
export {};

declare global {
  interface Window {
    __NB_STATIC_GTM?: string;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
    ttq?: {
      load: (id: string, opts?: unknown) => void;
      page: () => void;
      track: (name: string, payload?: unknown, opts?: unknown) => void;
      [k: string]: unknown;
    };
  }
}
