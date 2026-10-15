import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Join() {
  const [form, setForm] = useState({
    inviteCode: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    monthlySalary: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // we will set token manually

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/join', {
        ...form,
        monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined
      });
      localStorage.setItem('token', res.data.token);
      // Force reload of auth context by navigating
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-800">Join your company</h1>
          <p className="text-gray-600 mt-1">Enter the invite code your manager gave you</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Invite Code *</label>
            <input
              name="inviteCode"
              className="input uppercase tracking-widest text-center text-lg font-mono"
              value={form.inviteCode}
              onChange={handleChange}
              placeholder="e.g. ABC12XYZ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name *</label>
              <input name="firstName" className="input" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input name="lastName" className="input" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input name="password" type="password" className="input" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div>
            <label className="label">Your basic monthly salary (ZAR)</label>
            <input
              name="monthlySalary"
              type="number"
              className="input"
              value={form.monthlySalary}
              onChange={handleChange}
              placeholder="Optional – encrypted, only you can change it"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encrypted immediately. Used only to calculate your overtime. No one else (not even the admin) can see the number.
            </p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Joining…' : 'Join company'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Manager? <Link to="/register" className="text-brand-700 font-medium hover:underline">Register a new company</Link>
          {' · '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
