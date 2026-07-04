// Route table. Admin routes are top-level (not /admin/*) — word-slugs don't collide
// with the public paths. Public URLs (/c/:slug, /donations/:invoiceNumber) are
// preserved exactly; they're shared links in the wild.
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { RequireAuth, RequireRole, AccessDenied } from '@/layouts/guards';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Root element: AuthProvider lives INSIDE the router (it calls useNavigate), wrapping
// every route via this layout route.
function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

import LandingPage from '@/pages/public/LandingPage';
import CampaignDetailPage from '@/pages/public/CampaignDetailPage';
import DonationInvoicePage from '@/pages/public/DonationInvoicePage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

import DashboardPage from '@/pages/admin/DashboardPage';
import CampaignsPage from '@/pages/admin/CampaignsPage';
import CampaignEarningsPage from '@/pages/admin/CampaignEarningsPage';
import CampaignEditorPage from '@/pages/admin/CampaignEditorPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import AdvertiserPage from '@/pages/admin/AdvertiserPage';
import DataStudioPage from '@/pages/admin/DataStudioPage';
import CsInboxPage from '@/pages/admin/CsInboxPage';
import FundraiserPage from '@/pages/admin/FundraiserPage';
import MembersPage from '@/pages/admin/MembersPage';
import WithdrawalsPage from '@/pages/admin/WithdrawalsPage';
import GatewaysPage from '@/pages/admin/GatewaysPage';
import ProfilePage from '@/pages/admin/ProfilePage';
import SettingsPage from '@/pages/admin/SettingsPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import TrashPage from '@/pages/admin/TrashPage';

// Analytics splits by role: Advertiser sees a different page (was app.jsx:778).
function AnalyticsRoute() {
  const { role } = useAuth();
  return role === 'Advertiser' ? <AdvertiserPage /> : <AnalyticsPage />;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <div className="text-5xl font-extrabold text-brand-600">404</div>
        <div className="mt-2 text-mute">Halaman tidak ditemukan.</div>
        <a href="/" className="mt-5 inline-block px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm">Ke beranda</a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/c/:slug', element: <CampaignDetailPage /> },
          { path: '/donations/:invoiceNumber', element: <DonationInvoicePage /> },
        ],
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/campaigns', element: <CampaignsPage /> },
              { path: '/earnings', element: <CampaignEarningsPage /> },
              { path: '/campaigns/new', element: <RequireRole roles={['Admin', 'CS', 'Advertiser']}><CampaignEditorPage /></RequireRole> },
              { path: '/campaigns/:id/edit', element: <RequireRole roles={['Admin', 'CS', 'Advertiser']}><CampaignEditorPage /></RequireRole> },
              { path: '/analytics', element: <RequireRole roles={['Admin', 'Advertiser']}><AnalyticsRoute /></RequireRole> },
              { path: '/data-studio', element: <RequireRole roles={['Admin', 'Advertiser']}><DataStudioPage /></RequireRole> },
              { path: '/inbox', element: <RequireRole roles={['Admin', 'CS']}><CsInboxPage /></RequireRole> },
              { path: '/fundraiser', element: <RequireRole roles={['Admin', 'CS']}><FundraiserPage /></RequireRole> },
              { path: '/members', element: <RequireRole roles={['Admin']}><MembersPage /></RequireRole> },
              { path: '/withdrawals', element: <RequireRole roles={['Admin']}><WithdrawalsPage /></RequireRole> },
              { path: '/gateways', element: <RequireRole roles={['Admin']}><GatewaysPage /></RequireRole> },
              { path: '/notifications', element: <NotificationsPage /> },
              { path: '/trash', element: <RequireRole roles={['Admin']}><TrashPage /></RequireRole> },
              { path: '/profile', element: <ProfilePage /> },
              { path: '/settings', element: <RequireRole roles={['Admin']}><SettingsPage /></RequireRole> },
            ],
          },
        ],
      },
      { path: '/denied', element: <AccessDenied /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
