
// Complete ACS CRM Application with Full Routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Page imports
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseDetailPage } from '@/pages/CaseDetailPage';
import { PendingReviewPage } from '@/pages/PendingReviewPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { BillingPage } from '@/pages/BillingPage';
import { LocationsPage } from '@/pages/LocationsPage';
import { RealTimePage } from '@/pages/RealTimePage';
import { FormViewerPage } from '@/pages/FormViewerPage';
import { SecurityUXPage } from '@/pages/SecurityUXPage';
import { SettingsPage } from '@/pages/SettingsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="acs-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected routes with layout */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Cases routes */}
                  <Route
                    path="/cases"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <CasesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cases/:id"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <CaseDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cases/pending"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <PendingReviewPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Clients routes */}
                  <Route
                    path="/clients"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <ClientsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Reports routes */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <ReportsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin only routes */}
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN']}>
                        <Layout>
                          <UsersPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/locations"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN']}>
                        <Layout>
                          <LocationsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/security-ux"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN']}>
                        <Layout>
                          <SecurityUXPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Additional feature routes */}
                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <BillingPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/realtime"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <RealTimePage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forms"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
                        <Layout>
                          <FormViewerPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings route - available to all authenticated users */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Default routes */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </Router>
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
