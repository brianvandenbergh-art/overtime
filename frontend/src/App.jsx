import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Join from './pages/Join';
import Dashboard from './pages/Dashboard';
import OvertimeList from './pages/OvertimeList';
import LogOvertime from './pages/LogOvertime';
import Users from './pages/Users';
import Billing from './pages/Billing';
import PaymentResult from './pages/PaymentResult';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<Join />} />
      <Route path="/payment/success" element={<PaymentResult status="success" />} />
      <Route path="/payment/failed" element={<PaymentResult status="failed" />} />
      <Route path="/payment/cancel" element={<PaymentResult status="cancel" />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/overtime"
        element={
          <PrivateRoute>
            <Layout><OvertimeList /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/overtime/new"
        element={
          <PrivateRoute>
            <Layout><LogOvertime /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute roles={['company_admin', 'hr', 'manager']}>
            <Layout><Users /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute roles={['company_admin']}>
            <Layout><Billing /></Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
