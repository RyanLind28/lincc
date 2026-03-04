import { Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

// Auth pages (placeholder)
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TermsPage from './pages/auth/TermsPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Main pages (placeholder)
import HomePage from './pages/HomePage';
import ChatsPage from './pages/ChatsPage';
import ChatRoomPage from './pages/ChatRoomPage';
import DMChatRoomPage from './pages/DMChatRoomPage';
import MyEventsPage from './pages/MyEventsPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

// Event pages (placeholder)
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import ManageParticipantsPage from './pages/ManageParticipantsPage';
import UserProfilePage from './pages/UserProfilePage';
import FollowListPage from './pages/FollowListPage';

// Search & Discovery pages
import SavedEventsPage from './pages/SavedEventsPage';
import ExplorePage from './pages/ExplorePage';

// Voucher pages
import VoucherDetailPage from './pages/VoucherDetailPage';
import CreateVoucherPage from './pages/CreateVoucherPage';

// Business pages
import EditBusinessProfilePage from './pages/EditBusinessProfilePage';

// Admin pages (placeholder)
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminEventsPage from './pages/admin/EventsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminCategoriesPage from './pages/admin/CategoriesPage';

// PWA components
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { UpdateNotification } from './components/pwa/UpdateNotification';

// Demo page (no auth required)
import DemoPage from './pages/DemoPage';
import LandingPage from './pages/LandingPage';

// Landing sub-pages (no auth required)
import LandingAboutPage from './pages/landing/AboutPage';
import LandingPrivacyPage from './pages/landing/PrivacyPage';
import LandingTermsPage from './pages/landing/TermsPage';
import LandingContactPage from './pages/landing/ContactPage';

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <AuthProvider>
      <ToastProvider>
        <ViewModeProvider>
        <OfflineBanner />
        <UpdateNotification />
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
        </Routes>
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
