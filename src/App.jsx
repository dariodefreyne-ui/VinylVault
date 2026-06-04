import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { isActivated, isAdmin, isBeheerder } from './utils/roles.js';
import Layout from './components/layout/Layout.jsx';
import PincodeLock from './components/layout/PincodeLock.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Pending from './pages/Pending.jsx';
import Home from './pages/Home.jsx';
import AllRecords from './pages/AllRecords.jsx';
import RecordAdd from './pages/RecordAdd.jsx';
import RecordDetail from './pages/RecordDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Statistics from './pages/Statistics.jsx';
import Admin from './pages/Admin.jsx';

// --- Route guards ---

// AUTH_DISABLED: tijdelijk uitgeschakeld voor testing
const AUTH_DISABLED = true;

function ProtectedRoute({ children }) {
  if (AUTH_DISABLED) {
    return (
      <Layout>
        {children}
      </Layout>
    );
  }

  const { user, role, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isActivated(role)) {
    return <Navigate to="/pending" replace />;
  }

  return (
    <Layout>
      <PincodeLock />
      {children}
    </Layout>
  );
}

function PendingRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }} />;
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
