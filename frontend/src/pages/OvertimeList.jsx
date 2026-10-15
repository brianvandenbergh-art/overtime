import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function OvertimeList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    api.get('/overtime', { params })
      .then((res) => setEntries(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const canApprove = ['manager', 'company_admin', 'hr'].includes(user?.role);

  const handleApprove = async (id, status) => {
    const comment = status === 'rejected' ? prompt('Reason for rejection (optional):') : '';
    try {
      await api.patch(`/overtime/${id}/approve`, { status, comment });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleExport = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/overtime/export/csv?from=${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)}`, '_blank');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Overtime entries</h1>
        <div className="flex gap-2">
          {canApprove && (
            <button onClick={handleExport} className="btn-secondary text-sm">
              <Download size={16} className="mr-1" /> Export CSV
            </button>
          )}
          <Link to="/overtime/new" className="btn-primary text-sm">
            <Plus size={16} className="mr-1" /> Log overtime
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === s ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : entries.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">No entries found</div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium">
                  {e.user.firstName} {e.user.lastName}
                  <span className="ml-2 text-sm text-gray-500">
                    {format(new Date(e.date), 'dd MMM yyyy')} · {e.startTime}–{e.endTime}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-0.5">{e.task}</div>
                <div className="text-sm mt-1">
                  <span className="font-medium">{e.hours}h</span> × {e.multiplier} =
                  <span className="text-brand-700 font-semibold ml-1">R{(e.amount || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  e.status === 'approved' ? 'bg-green-100 text-green-800' :
                  e.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {e.status}
                </span>
                {canApprove && e.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(e.id, 'approved')} className="btn-primary text-xs py-1 px-3">
                      Approve
                    </button>
                    <button onClick={() => handleApprove(e.id, 'rejected')} className="btn-danger text-xs py-1 px-3">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
