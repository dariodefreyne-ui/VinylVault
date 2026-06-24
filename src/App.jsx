import React, { Suspense, lazy, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ThemeProvider, useTheme } from './hooks/useTheme.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { isActivated, isAdmin, isBeheerder } from './utils/roles.js';
import Layout from './components/layout/Layout.jsx';
import PincodeLock from './components/layout/PincodeLock.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Pending from './pages/Pending.jsx';
import { colors } from './styles/tokens.js';
import { useSwUpdate } from './hooks/useSwUpdate.js';
import UpdateBanner from './components/ui/UpdateBanner.jsx';

// Zware pagina's lazy laden zodat ze niet in de initiële bundle zitten
// (o.a. recharts in Statistics en xlsx in de import/export-flow).
const Home = lazy(() => import('./pages/Home.jsx'));
const AllRecords = lazy(() => import('./pages/AllRecords.jsx'));
const RecordAdd = lazy(() => import('./pages/RecordAdd.jsx'));
const RecordDetail = lazy(() => import('./pages/RecordDetail.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Statistics = lazy(() => import('./pages/Statistics.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Kiosk = lazy(() => import('./pages/Kiosk.jsx'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            backgroundColor: colors.bgPrimary,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Er ging iets mis</div>
          <div style={{ fontSize: '14px', color: colors.textSecondary, maxWidth: '400px' }}>
            Er trad een onverwachte fout op. Herlaad de pagina om opnieuw te proberen.
          </div>
          <button
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              backgroundColor: colors.brand,
              color: colors.brandText,
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Pagina herladen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="status"
      aria-label="Pagina laden…"
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: `3px solid ${colors.borderColor}`,
          borderTopColor: colors.brand,
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- Route guards ---

function ProtectedRoute({ children, requireBeheerder, requireAdmin, bare }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#141110' }} />;
  if (!user) return <Navigate to='/login' replace />;
  if (!isActivated(role)) return <Navigate to='/pending' replace />;
  if (requireAdmin && !isAdmin(role)) return <Navigate to='/' replace />;
  if (requireBeheerder && !isBeheerder(role)) return <Navigate to='/' replace />;

  // Schermvullende modus (bv. kiosk): geen zijbalk of pincode-overlay.
  if (bare) {
    return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
  }

  return (
    <Layout>
      <PincodeLock />
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </Layout>
  );
}

function PendingRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#141110' }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isActivated(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// --- Router ---

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/pending',
    element: (
      <PendingRoute>
        <Pending />
      </PendingRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen',
    element: (
      <ProtectedRoute>
        <AllRecords />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen/nieuw',
    element: (
      <ProtectedRoute requireBeheerder>
        <RecordAdd />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen/:id',
    element: (
      <ProtectedRoute>
        <RecordDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/wishlist',
    element: (
      <ProtectedRoute>
        <Wishlist />
      </ProtectedRoute>
    ),
  },
  {
    path: '/statistieken',
    element: (
      <ProtectedRoute>
        <Statistics />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profiel',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/kiosk',
    element: (
      <ProtectedRoute bare>
        <Kiosk />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <Admin />
      </ProtectedRoute>
    ),
  },
]);

// --- App root ---

function AppShell() {
  const { hasUpdate, applyUpdate } = useSwUpdate();
  const [dismissed, setDismissed] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <RouterProvider key={theme} router={router} />
      {hasUpdate && !dismissed && (
        <UpdateBanner
          onUpdate={applyUpdate}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
