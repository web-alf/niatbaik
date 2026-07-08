// Single source of truth for transaction export columns, shared across every role's
// export button (admin dashboard, CS dashboard, CS inbox) so they all produce the SAME
// full column set — no stripped/"limited" variant. Anonymous donors are shown as
// "Hamba Allah" per the donor-privacy policy; the row is otherwise the full record the
// staff member already sees on screen.
import type { Invoice } from '@/types/api';

export const TXN_EXPORT_COLUMNS = [
  'invoice', 'tanggal', 'donatur', 'campaign', 'nominal', 'metode', 'status',
  'fundraiser', 'whatsapp', 'email', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'utm_term', 'utm_id', 'pesan', 'note',
] as const;

// txnExportRows maps loaded transactions into the full export shape. `t` is a mapInvoice
// result (see lib/mappers.ts) — utm is always an object there, so no guard is needed.
export function txnExportRows(txns: Invoice[] | any[]): Record<string, unknown>[] {
  return (txns || []).map((t: any) => ({
    invoice: t.id,
    tanggal: t.date,
    donatur: t.anon ? 'Hamba Allah' : t.donor,
    campaign: t.campaign,
    nominal: t.amount,
    metode: t.method,
    status: t.status,
    fundraiser: t.referrer || '',
    whatsapp: t.whatsapp,
    email: t.email,
    utm_source: t.utm?.source || '',
    utm_medium: t.utm?.medium || '',
    utm_campaign: t.utm?.campaign || '',
    utm_content: t.utm?.content || '',
    utm_term: t.utm?.term || '',
    utm_id: t.utm?.id || '',
    pesan: t.message || '',
    note: t.note || '',
  }));
}
