// Route table. Admin routes are top-level (not /admin/*) — word-slugs don't collide
// with the public paths. Public URLs (/c/:slug, /donations/:invoiceNumber) are
// preserved exactly; they're shared links in the wild.
import { lazy, Suspense } from 'react';
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
import ArticleListPage from '@/pages/public/ArticleListPage';
import ArticleDetailPage from '@/pages/public/ArticleDetailPage';
import CampaignDetailPage from '@/pages/public/CampaignDetailPage';
import DonationInvoicePage from '@/pages/public/DonationInvoicePage';
import LegalPage from '@/pages/public/LegalPage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import RegisterFundraiserPage from '@/pages/auth/RegisterFundraiserPage';
import VerifyFundraiserEmailPage from '@/pages/auth/VerifyFundraiserEmailPage';

// Admin/fundraiser pages are code-split: public visitors (the Lighthouse path) never
// download editors, charts, or tables. One <Suspense> around AdminLayout covers all.
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const CampaignsPage = lazy(() => import('@/pages/admin/CampaignsPage'));
const CampaignEarningsPage = lazy(() => import('@/pages/admin/CampaignEarningsPage'));
const CampaignEditorPage = lazy(() => import('@/pages/admin/CampaignEditorPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const AdvertiserPage = lazy(() => import('@/pages/admin/AdvertiserPage'));
const DataStudioPage = lazy(() => import('@/pages/admin/DataStudioPage'));
const CsInboxPage = lazy(() => import('@/pages/admin/CsInboxPage'));
const ArticlesPage = lazy(() => import('@/pages/admin/ArticlesPage'));
const ArticleEditorPage = lazy(() => import('@/pages/admin/ArticleEditorPage'));
const FundraiserPage = lazy(() => import('@/pages/admin/FundraiserPage'));
const FundraiserPortalPage = lazy(() => import('@/pages/fundraiser/FundraiserPortalPage'));
const MembersPage = lazy(() => import('@/pages/admin/MembersPage'));
const WithdrawalsPage = lazy(() => import('@/pages/admin/WithdrawalsPage'));
const GatewaysPage = lazy(() => import('@/pages/admin/GatewaysPage'));
const ProfilePage = lazy(() => import('@/pages/admin/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const TrashPage = lazy(() => import('@/pages/admin/TrashPage'));

// Analytics splits by role: Advertiser sees a different page (was app.jsx:778).
function AnalyticsRoute() {
  const { role } = useAuth();
  return role === 'Advertiser' || role === 'Fundraiser' ? <AdvertiserPage /> : <AnalyticsPage />;
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
          { path: '/berita', element: <ArticleListPage /> },
          { path: '/berita/:slug', element: <ArticleDetailPage /> },
          { path: '/c/:slug', element: <CampaignDetailPage /> },
          { path: '/donations/:invoiceNumber', element: <DonationInvoicePage /> },
          { path: '/syarat-ketentuan', element: <LegalPage kind="terms" /> },
          { path: '/kebijakan-privasi', element: <LegalPage kind="privacy" /> },
          { path: '/disklaimer', element: <LegalPage kind="disclaimer" /> },
        ],
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/register-fundraiser', element: <RegisterFundraiserPage /> },
      { path: '/verify-fundraiser-email', element: <VerifyFundraiserEmailPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <Suspense fallback={null}><AdminLayout /></Suspense>,
            children: [
              { path: '/dashboard', element: <RequireRole roles={['Admin', 'CS', 'Advertiser', 'Fundraiser']} allowFundraiser><DashboardPage /></RequireRole> },
              { path: '/campaigns', element: <RequireRole roles={['Admin', 'CS', 'Advertiser', 'Fundraiser']} allowFundraiser><CampaignsPage /></RequireRole> },
              { path: '/earnings', element: <RequireRole roles={['Admin', 'CS', 'Advertiser', 'Fundraiser']} allowFundraiser><CampaignEarningsPage /></RequireRole> },
              { path: '/campaigns/new', element: <RequireRole roles={['Admin', 'CS', 'Advertiser']}><CampaignEditorPage /></RequireRole> },
              { path: '/campaigns/:id/edit', element: <RequireRole roles={['Admin', 'CS', 'Advertiser']}><CampaignEditorPage /></RequireRole> },
              { path: '/analytics', element: <RequireRole roles={['Admin', 'Advertiser', 'Fundraiser']} allowFundraiser><AnalyticsRoute /></RequireRole> },
              { path: '/data-studio', element: <RequireRole roles={['Admin', 'Advertiser', 'Fundraiser']} allowFundraiser><DataStudioPage /></RequireRole> },
              { path: '/inbox', element: <RequireRole roles={['Admin', 'CS']}><CsInboxPage /></RequireRole> },
              { path: '/articles', element: <RequireRole roles={['Admin', 'CS', 'Writer']}><ArticlesPage /></RequireRole> },
              { path: '/articles/new', element: <RequireRole roles={['Admin', 'CS', 'Writer']}><ArticleEditorPage /></RequireRole> },
              { path: '/articles/:id/edit', element: <RequireRole roles={['Admin', 'CS', 'Writer']}><ArticleEditorPage /></RequireRole> },
              { path: '/fundraiser', element: <RequireRole roles={['Admin', 'CS']}><FundraiserPage /></RequireRole> },
              { path: '/fundraiser-portal', element: <RequireRole roles={['Fundraiser', 'Admin']} allowFundraiser><FundraiserPortalPage /></RequireRole> },
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
