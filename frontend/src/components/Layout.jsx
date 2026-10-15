import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, company, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/overtime', label: 'Overtime', icon: Clock },
    ...(user?.role === 'company_admin' || user?.role === 'hr' || user?.role === 'manager'
      ? [{ to: '/users', label: 'Users', icon: Users }]
      : []),
    ...(user?.role === 'company_admin'
      ? [{ to: '/billing', label: 'Billing', icon: CreditCard }]
      : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-900 text-white transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-brand-800">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            Overtime<span className="text-brand-400">SA</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-brand-800">
          <div className="text-xs text-brand-300 mb-2 truncate">{company?.name}</div>
          <div className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs text-brand-400 capitalize">{user?.role?.replace('_', ' ')}</div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm text-brand-200 hover:text-white"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <span className="font-bold text-brand-800">OvertimeSA</span>
        <div className="w-6" />
      </div>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
