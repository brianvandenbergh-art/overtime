import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';

const PLANS = [
  { id: 'basic', name: 'Basic', price: 99, features: ['Up to 20 users', 'OT logging & approvals', 'CSV export'] },
  { id: 'pro', name: 'Pro', price: 199, features: ['Up to 50 users', 'Everything in Basic', 'Travel & S&T', 'Expenses', 'Charts'] },
  { id: 'enterprise', name: 'Enterprise', price: 499, features: ['Unlimited users', 'Everything in Pro', 'Attendance', 'Priority support'] }
];

export default function Billing() {
  const { company, setCompany } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    api.get('/payments/status').then((res) => setStatus(res.data));
  }, []);

  const subscribe = async (plan) => {
    setLoading(plan);
    try {
      const res = await api.post('/payments/subscribe', { plan });
      // Redirect to iKhokha payment page
      window.location.href = res.data.paylinkUrl;
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create payment link. Check iKhokha credentials.');
      setLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Billing & Plans</h1>
      <p className="text-gray-600 mb-6">
        Current plan: <strong className="capitalize">{status?.plan || company?.plan}</strong>
        {' · '}
        Status: <strong className="capitalize">{status?.planStatus || company?.planStatus}</strong>
        {status?.planExpiresAt && (
          <> · Expires: {new Date(status.planExpiresAt).toLocaleDateString('en-ZA')}</>
        )}
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => (
          <div key={p.id} className={`card ${status?.plan === p.id ? 'ring-2 ring-brand-600' : ''}`}>
            <h3 className="text-xl font-bold">{p.name}</h3>
            <div className="mt-1">
              <span className="text-3xl font-bold">R{p.price}</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle size={16} className="text-brand-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(p.id)}
              disabled={loading === p.id || status?.plan === p.id}
              className="btn-primary w-full mt-6 disabled:opacity-50"
            >
              {status?.plan === p.id ? 'Current plan' : loading === p.id ? 'Redirecting…' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
        <strong>Payment method:</strong> Secure checkout powered by iKhokha (card & Instant EFT).
        After successful payment your plan is activated for 1 month. You will need to renew monthly
        (iKhokha currently does not support automatic recurring billing via the API).
      </div>
    </div>
  );
}
