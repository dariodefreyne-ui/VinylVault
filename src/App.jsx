import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { isActivated, isAdmin, isBeheerder } from './utils/roles.js';
import Layout from './components/layout/Layout.jsx';
import PincodeLock from './components/layout/PincodeLock.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Pending from './pages/Pending.jsx';

// --- Placeholder pages ---

function HomePlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Home</div>;
}

function AllRecordsPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Alle Platen</div>;
}

function NewRecordPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Nieuw Plaat</div>;
}

function RecordDetailPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Plaat Detail</div>;
}

function WishlistPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Wishlist</div>;
}

function StatisticsPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Statistieken</div>;
}

function AdminPlaceholder() {
  return <div style={{ padding: '32px', color: '#f0f0f0' }}>Admin</div>;
}

// --- Route guards ---

function ProtectedRoute({ children, requireBeheerder = false, requireAdmin = false }) {
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

  if (requireAdmin && !isAdmin(role)) {
    return <Navigate to="/" replace />;
  }

  if (requireBeheerder && !isBeheerder(role)) {
    return <Navigate to="/" replace />;
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
        <HomePlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen',
    element: (
      <ProtectedRoute>
        <AllRecordsPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen/nieuw',
    element: (
      <ProtectedRoute requireBeheerder>
        <NewRecordPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/platen/:id',
    element: (
      <ProtectedRoute>
        <RecordDetailPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/wishlist',
    element: (
      <ProtectedRoute>
        <WishlistPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/statistieken',
    element: (
      <ProtectedRoute>
        <StatisticsPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminPlaceholder />
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
