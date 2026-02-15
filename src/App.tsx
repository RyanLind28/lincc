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
import TermsPage from './pages/auth/TermsPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Main pages (placeholder)
import HomePage from './pages/HomePage';
import ChatsPage from './pages/ChatsPage';
import ChatRoomPage from './pages/ChatRoomPage';
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

// Search & Discovery pages
import SavedEventsPage from './pages/SavedEventsPage';
import ExplorePage from './pages/ExplorePage';

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

          {/* Auth but no profile required */}
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

          {/* Protected routes with main layout */}
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
          </Route>

          {/* Protected routes without bottom nav */}
          <Route
            path="/event/new"
            element={
              <ProtectedRoute>
                <ErrorBoundary><CreateEventPage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id"
            element={
              <ProtectedRoute>
                <ErrorBoundary><EventDetailPage /></ErrorBoundary>
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
            path="/event/:id/manage"
            element={
              <ProtectedRoute>
                <ManageParticipantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:id"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <ExplorePage />
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
