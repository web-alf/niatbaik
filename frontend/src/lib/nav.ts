// Navigation model + role mapping. Ported from app.jsx top. Shared by AuthContext
// (role + first-allowed-route), AdminLayout (sidebar), and the router guards.
import type { Role, User } from '@/types/api';

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  roles: Role[];
  badge?: number;
  // Rendered grayed-out and non-navigating in the sidebar. Used to "park" a feature
  // (e.g. hosted Payment Gateways while the org runs manual-transfer only) without
  // deleting its route/page — flip back to enable.
  disabled?: boolean;
  disabledHint?: string;
}

// path is the React Router URL; key is the legacy setView() id (kept for matching).
export const NAV: NavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',        icon: 'home',       path: '/dashboard',     roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'campaigns',     label: 'Campaigns',        icon: 'megaphone',  path: '/campaigns',     roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'earnings',      label: 'Perolehan Campaign', icon: 'wallet',   path: '/earnings',      roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'analytics',     label: 'Analytics',        icon: 'chart',      path: '/analytics',     roles: ['Admin', 'Advertiser'] },
  { key: 'data-studio',   label: 'Data Studio',      icon: 'sparkle',    path: '/data-studio',   roles: ['Admin', 'Advertiser'] },
  { key: 'inbox',         label: 'CS Inbox',         icon: 'inbox',      path: '/inbox',         roles: ['Admin', 'CS'] },
  { key: 'fundraiser',    label: 'Fundraiser',       icon: 'handshake',  path: '/fundraiser',    roles: ['Admin', 'CS'] },
  // Fundraiser portal — the fundraiser's OWN view (referral links, stats, commission,
  // payout). Distinct from the admin '/fundraiser' management page above.
  { key: 'fundraiser-portal', label: 'Portal Saya',  icon: 'handshake',  path: '/fundraiser-portal', roles: ['Fundraiser'] },
  { key: 'withdrawals',   label: 'Penarikan Dana',   icon: 'wallet',     path: '/withdrawals',   roles: ['Admin'] },
  { key: 'members',       label: 'Members / User',   icon: 'users',      path: '/members',       roles: ['Admin'] },
  { key: 'gateways',      label: 'Payment Gateways', icon: 'creditcard', path: '/gateways',      roles: ['Admin'] },
  { key: 'notifications', label: 'Notification',     icon: 'bell',       path: '/notifications', roles: ['Admin', 'CS', 'Advertiser', 'Fundraiser'] },
  { key: 'trash',         label: 'Trash',            icon: 'trash',      path: '/trash',         roles: ['Admin'] },
];

export const SECONDARY_NAV: NavItem[] = [
  { key: 'profile',  label: 'Profile',  icon: 'user', path: '/profile',  roles: ['Admin', 'CS', 'Advertiser', 'Fundraiser'] },
  { key: 'settings', label: 'Settings', icon: 'cog',  path: '/settings', roles: ['Admin'] },
];

export const ROLE_META: Record<string, { color: string; ring: string; light: string; text: string; icon: string; tag: string }> = {
  Admin:      { color: 'bg-brand-600',  ring: 'ring-brand-600',  light: 'bg-brand-50',  text: 'text-brand-700',  icon: 'shield',    tag: 'Full Access' },
  CS:         { color: 'bg-sky2-500',   ring: 'ring-sky2-500',   light: 'bg-sky2-50',   text: 'text-sky2-600',   icon: 'inbox',     tag: 'Operasional' },
  Advertiser: { color: 'bg-violet-600', ring: 'ring-violet-600', light: 'bg-violet-50', text: 'text-violet-700', icon: 'chart',     tag: 'Marketing' },
  Fundraiser: { color: 'bg-emerald-600',ring: 'ring-emerald-600',light: 'bg-emerald-50',text: 'text-emerald-700',icon: 'handshake', tag: 'Mitra' },
};

// Backend role → design role. admin/cs/advertiser are staff; fundraiser is a partner role
// that gets its OWN limited shell (portal + payout + profile), NOT the admin nav. Only the
// donor 'user' role has no design role and is kept out of the shell entirely (RequireAuth).
const ROLE_MAP: Record<string, Role> = { admin: 'Admin', cs: 'CS', advertiser: 'Advertiser', fundraiser: 'Fundraiser' };
export const isStaffRole = (u: User | null | undefined): boolean =>
  !!u && (!!ROLE_META[u.role as string] || !!ROLE_MAP[(u.role as string)?.toLowerCase?.()]);
// Resolve a staff user to its design role. Non-staff fall back to 'Admin' only so the
// type stays satisfied; they are blocked from the admin tree before this matters.
export const toDesignRole = (u: User | null | undefined): Role =>
  (ROLE_META[u?.role as string] ? (u!.role as Role) : (ROLE_MAP[(u?.role as string)?.toLowerCase?.()] || 'Admin'));

// role → allowed nav keys (and the matching first path used as the post-login landing).
export const NAV_ROLE_KEYS: Record<Role, string[]> = { Admin: [], CS: [], Advertiser: [], Fundraiser: [] };
(['Admin', 'CS', 'Advertiser', 'Fundraiser'] as Role[]).forEach((r) => {
  NAV_ROLE_KEYS[r] = NAV.filter((n) => n.roles.includes(r)).map((n) => n.key);
});

// First route a role is allowed to see after login.
export function firstPathForRole(role: Role): string {
  const firstKey = NAV_ROLE_KEYS[role]?.[0] || 'dashboard';
  return NAV.find((n) => n.key === firstKey)?.path || '/dashboard';
}
