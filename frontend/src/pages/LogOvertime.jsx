import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LogOvertime() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: '17:00',
    endTime: '19:00',
    hours: 2,
    multiplier: 1.5,
    task: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'hours' || name === 'multiplier' ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/overtime', form);
      navigate('/overtime');
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

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Date *</label>
          <input type="date" name="date" className="input" value={form.date} onChange={handleChange} required />
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Hours *</label>
            <input type="number" step="0.25" min="0.25" name="hours" className="input" value={form.hours} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Multiplier *</label>
            <select name="multiplier" className="input" value={form.multiplier} onChange={handleChange}>
              <option value={1.5}>1.5× (Weekday OT)</option>
              <option value={2}>2× (Sunday / Public Holiday)</option>
              <option value={1}>1× (Normal)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Task / Description *</label>
          <input name="task" className="input" value={form.task} onChange={handleChange} required placeholder="e.g. Stock take, client support" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" className="input" rows={3} value={form.notes} onChange={handleChange} />
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
