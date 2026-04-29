import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';

// Eager — landing page + auth flow are needed on first paint
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TrackingPublic from './pages/TrackingPublic';

// Lazy — every protected page becomes its own JS chunk
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const Customers         = lazy(() => import('./pages/Customers'));
const Transporters      = lazy(() => import('./pages/Transporters'));
const Vehicles          = lazy(() => import('./pages/Vehicles'));
const Drivers           = lazy(() => import('./pages/Drivers'));
const VHC               = lazy(() => import('./pages/VHC'));
const GCN               = lazy(() => import('./pages/GCN'));
const ViewGCN           = lazy(() => import('./pages/ViewGCN'));
const Billing           = lazy(() => import('./pages/Billing'));
const GalleryManagement = lazy(() => import('./pages/GalleryManagement'));
const UserManagement    = lazy(() => import('./pages/UserManagement'));
const ChangePassword    = lazy(() => import('./pages/ChangePassword'));
const Tracking          = lazy(() => import('./pages/Tracking'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

function ChunkLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}

function Gated({ children, module, action = 'view' }: { children: ReactNode; module: string; action?: string }) {
  return <PrivateRoute requiredPermission={{ module, action }}>{children}</PrivateRoute>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { fontSize: '14px', fontWeight: 500 },
              success: { iconTheme: { primary: '#ea580c', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
          <Suspense fallback={<ChunkLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/track" element={<TrackingPublic />} />
              <Route path="/track/:gcnNumber" element={<TrackingPublic />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />

              {/* Protected — every authenticated user can hit dashboard + change-password */}
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/admin/change-password" element={<Protected><ChangePassword /></Protected>} />

              {/* Permission-gated business modules */}
              <Route path="/admin/customers"    element={<Gated module="customers"><Customers /></Gated>} />
              <Route path="/admin/transporters" element={<Gated module="transporters"><Transporters /></Gated>} />
              <Route path="/admin/vehicles"     element={<Gated module="vehicles"><Vehicles /></Gated>} />
              <Route path="/admin/drivers"      element={<Gated module="drivers"><Drivers /></Gated>} />
              <Route path="/admin/vhc"          element={<Gated module="vhc"><VHC /></Gated>} />
              <Route path="/admin/gcn"          element={<Gated module="gcn"><GCN /></Gated>} />
              <Route path="/admin/view-gcn"     element={<Gated module="gcn"><ViewGCN /></Gated>} />
              <Route path="/admin/billing"      element={<Gated module="billing"><Billing /></Gated>} />
              <Route path="/admin/gallery"      element={<Gated module="gallery"><GalleryManagement /></Gated>} />
              <Route path="/admin/tracking"     element={<Gated module="tracking"><Tracking /></Gated>} />

              {/* Admin-only */}
              <Route path="/admin/users" element={<PrivateRoute requiredRole="ADMIN"><UserManagement /></PrivateRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
