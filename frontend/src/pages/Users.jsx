import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'employee', phone: '', monthlySalary: ''
  });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/users').then((res) => setUsers(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', {
        ...form,
        monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined
      });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'employee', phone: '', monthlySalary: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const canCreate = ['company_admin', 'hr'].includes(user?.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? 'Cancel' : 'Add user'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-3">
          {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="input" type="password" placeholder="Temp password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
            <input className="input" type="number" placeholder="Monthly salary (ZAR)" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Create user</button>
        </form>
      )}

      {loading ? <div>Loading…</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2">Hourly rate</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="py-3">{u.hourlyRate ? `R${u.hourlyRate.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
