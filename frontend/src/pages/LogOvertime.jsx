import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LogOvertime() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: '17:00',
    endTime: '19:00',
    hours: 2,
    task: '',
    notes: ''
  });
  const [autoInfo, setAutoInfo] = useState({ multiplier: 1.5, reason: 'Weekday / Saturday overtime' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // When date changes, ask backend what the multiplier will be
  useEffect(() => {
    if (!form.date) return;
    api.get('/overtime/preview-multiplier', { params: { date: form.date } })
      .then((res) => setAutoInfo(res.data))
      .catch(() => {});
  }, [form.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'hours' ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      // Do NOT send multiplier – backend auto-detects it
      const res = await api.post('/overtime', form);
      setResult(res.data);
      setTimeout(() => navigate('/overtime'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Log overtime</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      {result && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          <strong>Saved!</strong> {result.hours}h × {result.multiplier}× = <strong>R{(result.amount || 0).toFixed(2)}</strong>
          <br />
          Reason: {result.autoReason}
          {result.estimatedTaxOnThisEntry != null && (
            <>
              <br />
              Est. tax on this entry (2026/27 rates): R{result.estimatedTaxOnThisEntry.toFixed(2)}
              <br />
              Est. net: R{result.netEstimate.toFixed(2)}
            </>
          )}
          <br /><span className="text-xs">Redirecting to list…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Date *</label>
          <input type="date" name="date" className="input" value={form.date} onChange={handleChange} required />
        </div>

        {/* Auto multiplier banner */}
        <div className={`p-3 rounded-lg text-sm font-medium ${
          autoInfo.multiplier === 2 ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
        }`}>
          System will use <strong>{autoInfo.multiplier}×</strong> — {autoInfo.reason}
          <div className="text-xs mt-1 opacity-80">Detected automatically from the date (BCEA rules). No need to choose.</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start time *</label>
            <input type="time" name="startTime" className="input" value={form.startTime} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">End time *</label>
            <input type="time" name="endTime" className="input" value={form.endTime} onChange={handleChange} required />
          </div>
        </div>
        <div>
          <label className="label">Hours *</label>
          <input type="number" step="0.25" min="0.25" name="hours" className="input" value={form.hours} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Task / Description *</label>
          <input name="task" className="input" value={form.task} onChange={handleChange} required placeholder="e.g. Stock take, client support" />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea name="notes" className="input" rows={2} value={form.notes} onChange={handleChange} />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Submit for approval'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/overtime')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
