import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, Hourglass, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user, company } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard…</div>;

  const cards = [
    { label: 'Pending', value: summary?.pending ?? 0, icon: Hourglass, color: 'text-amber-600 bg-amber-50' },
    { label: 'Approved', value: summary?.approved ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Rejected', value: summary?.rejected ?? 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Total Hours', value: (summary?.totalHours ?? 0).toFixed(1), icon: Clock, color: 'text-brand-700 bg-brand-50' }
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.firstName}
          </h1>
          <p className="text-gray-600">{company?.name} · {company?.plan} plan</p>
        </div>
        <Link to="/overtime/new" className="btn-primary">
          <Plus size={18} className="mr-1" /> Log overtime
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${c.color}`}>
              <c.icon size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm text-gray-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-2">This month’s approved overtime pay</h2>
        <p className="text-3xl font-bold text-brand-700">
          R{(summary?.totalAmount ?? 0).toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Based on approved entries only
        </p>
      </div>

      {company?.planStatus === 'trial' && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          You are on a free trial. <Link to="/billing" className="font-medium underline">Upgrade</Link> to keep full access after the trial ends.
        </div>
      )}
    </div>
  );
}
