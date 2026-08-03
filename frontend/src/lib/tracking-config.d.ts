// Types for the plain-JS tracker parser (kept as .mjs so node:test can import it
// without a build step). See tracking-config.mjs for behaviour.
export interface TrackerGroups {
  gtm: string[];
  meta: string[];
  ga4: string[];
  googleAds: { id: string; label: string }[];
  tiktok: string[];
}

export function parseTrackers(
  raw: unknown,
  fallbackSettings: Record<string, unknown> | null | undefined,
  campaignSlug?: string,
): TrackerGroups;
