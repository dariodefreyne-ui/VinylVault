import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { isActivated, isAdmin, isBeheerder } from './utils/roles.js';
import Layout from './components/layout/Layout.jsx';
import PincodeLock from './components/layout/PincodeLock.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Pending from './pages/Pending.jsx';

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

function RouteFallback() {
  return <div style={{ minHeight: '60vh' }} aria-busy='true' />;
}

// --- Route guards ---

function ProtectedRoute({ children, requireBeheerder, requireAdmin }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#141110' }} />;
  if (!user) return <Navigate to='/login' replace />;
  if (!isActivated(role)) return <Navigate to='/pending' replace />;
  if (requireAdmin && !isAdmin(role)) return <Navigate to='/' replace />;
  if (requireBeheerder && !isBeheerder(role)) return <Navigate to='/' replace />;

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
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <Admin />
      </ProtectedRoute>
    ),
  },
]);

// --- App root ---

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
