import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    registrationNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCompany(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="card w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-800">
            Register your company
          </h1>
          <p className="text-gray-600 mt-1">You become the Company Admin</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company Name *</label>
              <input name="companyName" className="input" value={form.companyName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Company Email</label>
              <input name="companyEmail" type="email" className="input" value={form.companyEmail} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Registration No.</label>
              <input name="registrationNumber" className="input" value={form.registrationNumber} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Your First Name *</label>
              <input name="firstName" className="input" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Your Last Name *</label>
              <input name="lastName" className="input" value={form.lastName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Your Email *</label>
              <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input name="password" type="password" className="input" value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Phone</label>
              <input name="phone" className="input" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create company & start free trial'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
