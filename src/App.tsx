import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { ReportProblemProvider } from './contexts/ReportProblemContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { UpdateNotification } from './components/pwa/UpdateNotification';
import { PrivateBrowsingBanner } from './components/pwa/PrivateBrowsingBanner';
import { FullPageSpinner } from './components/ui';

// Auth pages (small, loaded eagerly for fast first paint)
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Lazy-loaded auth pages
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const TermsPage = lazy(() => import('./pages/auth/TermsPage'));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));
const BusinessOnboardingPage = lazy(() => import('./pages/onboarding/BusinessOnboardingPage'));

// Lazy-loaded main pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage'));
const DMChatRoomPage = lazy(() => import('./pages/DMChatRoomPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Lazy-loaded event pages
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const ManageParticipantsPage = lazy(() => import('./pages/ManageParticipantsPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const FollowListPage = lazy(() => import('./pages/FollowListPage'));

// Lazy-loaded search & discovery
const SavedEventsPage = lazy(() => import('./pages/SavedEventsPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));

// Lazy-loaded voucher pages
const VouchersPage = lazy(() => import('./pages/VouchersPage'));
const VoucherDetailPage = lazy(() => import('./pages/VoucherDetailPage'));
const CreateVoucherPage = lazy(() => import('./pages/CreateVoucherPage'));

// Lazy-loaded business pages
const EditBusinessProfilePage = lazy(() => import('./pages/EditBusinessProfilePage'));
const BusinessPage = lazy(() => import('./pages/BusinessPage'));
const BusinessDashboardPage = lazy(() => import('./pages/BusinessDashboardPage'));
const BusinessVerifyPage = lazy(() => import('./pages/BusinessVerifyPage'));
const BecomeBusinessPage = lazy(() => import('./pages/BecomeBusinessPage'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/UserDetailPage'));
const AdminEventsPage = lazy(() => import('./pages/admin/EventsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const AdminImagesPage = lazy(() => import('./pages/admin/ImagesPage'));
const AdminBusinessesPage = lazy(() => import('./pages/admin/BusinessesPage'));
const AdminBusinessApplicationsPage = lazy(() => import('./pages/admin/BusinessApplicationsPage'));
const AdminBusinessDetailPage = lazy(() => import('./pages/admin/BusinessDetailPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage'));
const FeatureFlagsPage = lazy(() => import('./pages/admin/FeatureFlagsPage'));
const AdminWaitlistPage = lazy(() => import('./pages/admin/WaitlistPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/FeedbackPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const SearchPeoplePage = lazy(() => import('./pages/SearchPeoplePage'));
const BusinessDirectoryPage = lazy(() => import('./pages/BusinessDirectoryPage'));

// Lazy-loaded landing/demo
const DemoPage = lazy(() => import('./pages/DemoPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LandingAboutPage = lazy(() => import('./pages/landing/AboutPage'));
const LandingPrivacyPage = lazy(() => import('./pages/landing/PrivacyPage'));
const LandingTermsPage = lazy(() => import('./pages/landing/TermsPage'));
const LandingContactPage = lazy(() => import('./pages/landing/ContactPage'));

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <AuthProvider>
      <ToastProvider>
        <ViewModeProvider>
        <ReportProblemProvider>
        <ScrollToTop />
        <AnalyticsTracker />
        <CookieConsentBanner />
        <PrivateBrowsingBanner />
        <UpdateNotification />
        <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Demo route (no auth required) */}
          <Route path="/demo" element={<DemoPage />} />

          {/* Landing pages (no auth required) */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/landing/about" element={<LandingAboutPage />} />
          <Route path="/landing/privacy" element={<LandingPrivacyPage />} />
          <Route path="/landing/terms" element={<LandingTermsPage />} />
          <Route path="/landing/contact" element={<LandingContactPage />} />

          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* Auth but no profile required */}
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute requireProfile={false} requireTerms={false}>
                <ResetPasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/terms"
            element={
              <ProtectedRoute requireProfile={false} requireTerms={false}>
                <TermsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireProfile={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/business"
            element={
              <ProtectedRoute requireProfile={false}>
                <BusinessOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-approval"
            element={
              <ProtectedRoute requireProfile={false} requireTerms={false}>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes with main layout (bottom nav + app shell) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="/chats" element={<ErrorBoundary><ChatsPage /></ErrorBoundary>} />
            <Route path="/my-events" element={<ErrorBoundary><MyEventsPage /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/event/:id" element={<ErrorBoundary><EventDetailPage /></ErrorBoundary>} />
            <Route path="/user/:id" element={<ErrorBoundary><UserProfilePage /></ErrorBoundary>} />
            <Route path="/user/:id/follows" element={<ErrorBoundary><FollowListPage /></ErrorBoundary>} />
            <Route path="/profile/edit" element={<ErrorBoundary><EditProfilePage /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
            <Route path="/saved" element={<ErrorBoundary><SavedEventsPage /></ErrorBoundary>} />
            <Route path="/explore" element={<ErrorBoundary><ExplorePage /></ErrorBoundary>} />
            <Route path="/vouchers" element={<ErrorBoundary><VouchersPage /></ErrorBoundary>} />
            <Route path="/voucher/:id" element={<ErrorBoundary><VoucherDetailPage /></ErrorBoundary>} />
            <Route path="/event/:id/manage" element={<ErrorBoundary><ManageParticipantsPage /></ErrorBoundary>} />
            <Route path="/people" element={<ErrorBoundary><SearchPeoplePage /></ErrorBoundary>} />
            <Route path="/businesses" element={<ErrorBoundary><BusinessDirectoryPage /></ErrorBoundary>} />
            <Route path="/business/:id" element={<ErrorBoundary><BusinessPage /></ErrorBoundary>} />
          </Route>

          {/* Full-screen routes — keep the desktop sidebar but drop the mobile bottom nav */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout showBottomNav={false} />
              </ProtectedRoute>
            }
          >
            <Route path="/event/new" element={<ErrorBoundary><CreateEventPage /></ErrorBoundary>} />
            <Route path="/voucher/new" element={<ErrorBoundary><CreateVoucherPage /></ErrorBoundary>} />
            <Route path="/business/dashboard" element={<ErrorBoundary><BusinessDashboardPage /></ErrorBoundary>} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/event/:id/chat" element={<ChatRoomPage />} />
            <Route path="/dm/:id" element={<DMChatRoomPage />} />
          </Route>

          {/* Business edit page — keeps bottom nav like other in-app routes */}
          <Route
            element={
              <ProtectedRoute requireProfile={false}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/business/edit" element={<ErrorBoundary><EditBusinessProfilePage /></ErrorBoundary>} />
          </Route>

          {/* Full-screen routes that don't require profile completion (business onboarding) */}
          <Route
            element={
              <ProtectedRoute requireProfile={false}>
                <MainLayout showBottomNav={false} />
              </ProtectedRoute>
            }
          >
            <Route path="/business/verify" element={<ErrorBoundary><BusinessVerifyPage /></ErrorBoundary>} />
            <Route path="/become-a-business" element={<ErrorBoundary><BecomeBusinessPage /></ErrorBoundary>} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requireAdmin>
                <AdminEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/businesses"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBusinessesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/business-applications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBusinessApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/businesses/:id"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBusinessDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute requireAdmin>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waitlist"
            element={
              <ProtectedRoute requireAdmin>
                <AdminWaitlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requireAdmin>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feature-flags"
            element={
              <ProtectedRoute requireAdmin>
                <FeatureFlagsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/images"
            element={
              <ProtectedRoute requireAdmin>
                <AdminImagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute requireAdmin>
                <AdminFeedbackPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
        </ReportProblemProvider>
        </ViewModeProvider>
      </ToastProvider>
    </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
        <p className="text-text-muted mb-4">We've been notified and are working on it.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export default App;
