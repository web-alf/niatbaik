// Types for the plain-JS attribution store (kept as .mjs so node:test can import it
// without a build step). See attribution-store.mjs for behaviour.
export const STORE_KEY: string;
export const ATTRIBUTION_TTL_MS: number;

interface StoreOpts {
  durable?: Storage | null;
  session?: Storage | null;
  now?: number;
}

export function readAttribution(opts?: StoreOpts): Record<string, string>;
export function writeAttribution(values: Record<string, string>, opts?: StoreOpts): void;
