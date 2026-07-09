// Route guards. RequireAuth gates the admin tree; RequireRole gates per-page.
// Ported from app.jsx auth gating + role guard.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isStaffRole } from '@/lib/nav';
import { Icon } from '@/components';
import type { Role } from '@/types/api';

function AppSkeleton() {
  return (
    <div className="min-h-screen flex bg-bg2">
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-line h-screen">
        <div className="h-16 px-5 flex items-center border-b border-line"><div className="h-7 w-28 bg-bg2 rounded-md shimmer" /></div>
        <div className="p-3 space-y-2 mt-2">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 bg-bg2 rounded-lg shimmer" />)}</div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-line flex items-center px-6 gap-3">
          <div className="h-10 w-64 bg-bg2 rounded-lg shimmer" /><div className="flex-1" /><div className="h-9 w-9 bg-bg2 rounded-lg shimmer" />
        </header>
        <div className="p-6 space-y-5">
          <div className="h-8 w-72 bg-bg2 rounded-lg shimmer" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-line shimmer" />)}</div>
          <div className="h-64 bg-white rounded-2xl border border-line shimmer" />
        </div>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { user, authLoading } = useAuth();
  const loc = useLocation();
  if (authLoading) return <AppSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  // Logged in but not staff (donor/fundraiser): the admin tree is not theirs. Bounce
  // to the public site rather than rendering the admin shell with a non-staff role.
  if (!isStaffRole(user)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RequireRole({ roles, allowFundraiser, children }: { roles: Role[]; allowFundraiser?: boolean; children: React.ReactNode }) {
  const { role, user } = useAuth();
  // allowFundraiser lets a user with the fundraiser capability (fundraiser_enabled) reach a
  // page even when their primary role isn't in `roles` (e.g. an advertiser opening the
  // fundraiser portal).
  if (roles.includes(role) || (allowFundraiser && !!(user as any)?.fundraiser_enabled)) return <>{children}</>;
  return <AccessDenied />;
}

export function AccessDenied() {
  const { role } = useAuth();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Icon name="shield" size={28} />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Akses ditolak</h2>
        <p className="mt-2 text-mute">Role <b className="text-ink">{role}</b> tidak memiliki akses ke halaman ini.</p>
        <a href="/dashboard" className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}
