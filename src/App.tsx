import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { FullPageSpinner } from './components/ui';

// PWA components (always loaded)
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { UpdateNotification } from './components/pwa/UpdateNotification';

// Auth pages (small, loaded eagerly for fast first paint)
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Lazy-loaded auth pages
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const TermsPage = lazy(() => import('./pages/auth/TermsPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));

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
const VoucherDetailPage = lazy(() => import('./pages/VoucherDetailPage'));
const CreateVoucherPage = lazy(() => import('./pages/CreateVoucherPage'));

// Lazy-loaded business pages
const EditBusinessProfilePage = lazy(() => import('./pages/EditBusinessProfilePage'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminEventsPage = lazy(() => import('./pages/admin/EventsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'));
const AnnouncementsPage = lazy(() => import('./pages/admin/AnnouncementsPage'));
const FeatureFlagsPage = lazy(() => import('./pages/admin/FeatureFlagsPage'));
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
        <OfflineBanner />
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
            <Route path="/voucher/:id" element={<ErrorBoundary><VoucherDetailPage /></ErrorBoundary>} />
            <Route path="/event/:id/manage" element={<ErrorBoundary><ManageParticipantsPage /></ErrorBoundary>} />
            <Route path="/people" element={<ErrorBoundary><SearchPeoplePage /></ErrorBoundary>} />
            <Route path="/businesses" element={<ErrorBoundary><BusinessDirectoryPage /></ErrorBoundary>} />
          </Route>

          {/* Full-screen protected routes (no bottom nav — own fixed UI) */}
          <Route
            path="/event/new"
            element={
              <ProtectedRoute>
                <ErrorBoundary><CreateEventPage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/voucher/new"
            element={
              <ProtectedRoute>
                <ErrorBoundary><CreateVoucherPage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/business/edit"
            element={
              <ProtectedRoute>
                <ErrorBoundary><EditBusinessProfilePage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/chat"
            element={
              <ProtectedRoute>
                <ChatRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dm/:id"
            element={
              <ProtectedRoute>
                <DMChatRoomPage />
              </ProtectedRoute>
            }
          />

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
            path="/admin/audit-log"
            element={
              <ProtectedRoute requireAdmin>
                <AuditLogPage />
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
        </Routes>
        </Suspense>
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
