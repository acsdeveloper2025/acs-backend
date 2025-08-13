import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Import all page components
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseDetailPage } from '@/pages/CaseDetailPage';
import { PendingReviewPage } from '@/pages/PendingReviewPage';
import { CompletedCasesPage } from '@/pages/CompletedCasesPage';
import { NewCasePage } from '@/pages/NewCasePage';
import { ClientsPage } from '@/pages/ClientsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { BillingPage } from '@/pages/BillingPage';
import { LocationsPage } from '@/pages/LocationsPage';
import { RealTimePage } from '@/pages/RealTimePage';
import { FormViewerPage } from '@/pages/FormViewerPage';
import { SecurityUXPage } from '@/pages/SecurityUXPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { VerificationTypesPage } from '@/pages/VerificationTypesPage';

// Default route component that handles authentication-based redirects
const DefaultRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
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
      <Route
        path="/cases/completed"
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
            <Layout>
              <CompletedCasesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new"
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'BACKEND']}>
            <Layout>
              <NewCasePage />
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

      {/* Products routes */}
      <Route
        path="/products"
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Verification Types routes */}
      <Route
        path="/verification-types"
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Layout>
              <VerificationTypesPage />
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
      <Route path="/" element={<DefaultRoute />} />
      <Route path="*" element={<DefaultRoute />} />
    </Routes>
  );
};
