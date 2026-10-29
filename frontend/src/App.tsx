import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { offlineDb } from './services/offlineDb';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

import Navbar from './components/common/Navbar';
import MobileBottomNav from './components/common/MobileBottomNav';
import ErrorBoundary from './components/common/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerReportWizard from './pages/FarmerReportWizard';
import CaseDetailsPage from './pages/CaseDetailsPage';
import VetDashboard from './pages/VetDashboard';
import VetCaseReview from './pages/VetCaseReview';
import GovernmentDashboard from './pages/GovernmentDashboard';
import ClustersPage from './pages/ClustersPage';
import AdminModelStatus from './pages/AdminModelStatus';
import FieldOfficerDashboard from './pages/FieldOfficerDashboard';

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    
    // Check direct role match, Admin wildcard, or Government wildcard
    const hasRole = 
      normalizedAllowed.includes(userRole) || 
      userRole === 'ADMIN' || 
      userRole === 'NATIONAL_ADMIN' ||
      (normalizedAllowed.includes('GOVERNMENT') && ['DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN', 'GOVERNMENT'].includes(userRole));

    if (!hasRole) {
      if (userRole === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
      if (userRole === 'FIELD_OFFICER') return <Navigate to="/field/dashboard" replace />;
      if (userRole === 'VETERINARIAN') return <Navigate to="/vet/dashboard" replace />;
      if (['DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN', 'GOVERNMENT'].includes(userRole)) return <Navigate to="/government/dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('Back online. Synchronizing local reports...');
      try {
        const syncedCount = await offlineDb.syncPendingReports();
        if (syncedCount > 0) {
          setSyncStatus(`Successfully synchronized ${syncedCount} offline report(s) with central server!`);
          setTimeout(() => setSyncStatus(null), 5000);
        } else {
          setSyncStatus(null);
        }
      } catch (err) {
        console.error('Sync failed:', err);
        setSyncStatus('Sync error. Will retry automatically.');
        setTimeout(() => setSyncStatus(null), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('Offline mode active. Reports will be stored locally on this device.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased pb-16 md:pb-0 selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Offline / Sync Notification Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>You are currently working offline. Field reports will be saved safely to local storage.</span>
        </div>
      )}

      {syncStatus && isOnline && (
        <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncStatus}</span>
        </div>
      )}

      <main className="flex-1">
        <ErrorBoundary fallbackTitle="View Error">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Farmer Routes */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/report"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerReportWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/cases/:caseId"
              element={
                <ProtectedRoute>
                  <CaseDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Veterinarian Routes */}
            <Route
              path="/vet/dashboard"
              element={
                <ProtectedRoute allowedRoles={['VETERINARIAN', 'ADMIN']}>
                  <VetDashboard />
                </ProtectedRoute>
              }
            />

            {/* Field Officer Routes */}
            <Route
              path="/field/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                  <FieldOfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vet/cases/:caseId"
              element={
                <ProtectedRoute allowedRoles={['VETERINARIAN', 'FIELD_OFFICER', 'ADMIN', 'GOVERNMENT', 'DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN']}>
                  <VetCaseReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vet/clusters"
              element={
                <ProtectedRoute allowedRoles={['VETERINARIAN', 'FIELD_OFFICER', 'GOVERNMENT', 'DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN', 'ADMIN']}>
                  <ClustersPage />
                </ProtectedRoute>
              }
            />

            {/* Government / Administrative Dashboards (District, State, National) */}
            <Route
              path="/government/dashboard"
              element={
                <ProtectedRoute allowedRoles={['GOVERNMENT', 'DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN', 'ADMIN']}>
                  <GovernmentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/government/clusters"
              element={
                <ProtectedRoute allowedRoles={['GOVERNMENT', 'DISTRICT_ADMIN', 'STATE_ADMIN', 'NATIONAL_ADMIN', 'ADMIN']}>
                  <ClustersPage />
                </ProtectedRoute>
              }
            />

            {/* Generic Case Detail Route */}
            <Route
              path="/cases/:caseId"
              element={
                <ProtectedRoute>
                  <CaseDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin, Model Telemetry & SIH Simulation Route */}
            <Route
              path="/admin/models"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'GOVERNMENT', 'VETERINARIAN']}>
                  <AdminModelStatus />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Mobile Navigation for logged-in users */}
      {user && <MobileBottomNav />}
    </div>
  );
}
