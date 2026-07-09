'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Shelter } from '@/lib/types';
import { MapPin, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function AdminSheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', lat: '', lng: '', totalCapacity: '', currentOccupancy: '0',
    status: 'operational', contactInfo: '', resourcesAvailable: '',
  });

  const fetchShelters = async () => {
    try {
      const res = await api.get('/shelters');
      setShelters(res.data.shelters || []);
    } catch (error) {
      console.error('Failed to fetch shelters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShelters(); }, []);

  const resetForm = () => {
    setForm({ name: '', lat: '', lng: '', totalCapacity: '', currentOccupancy: '0', status: 'operational', contactInfo: '', resourcesAvailable: '' });
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = (s: Shelter) => {
    setForm({
      name: s.name,
      lat: s.location.lat.toString(),
      lng: s.location.lng.toString(),
      totalCapacity: s.totalCapacity.toString(),
      currentOccupancy: s.currentOccupancy.toString(),
      status: s.status,
      contactInfo: s.contactInfo,
      resourcesAvailable: s.resourcesAvailable.join(', '),
    });
    setEditId(s._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      totalCapacity: Number(form.totalCapacity),
      currentOccupancy: Number(form.currentOccupancy),
      status: form.status,
      contactInfo: form.contactInfo,
      resourcesAvailable: form.resourcesAvailable.split(',').map(r => r.trim()).filter(Boolean),
    };

    try {
      if (editId) {
        await api.put(`/shelters/${editId}`, payload);
      } else {
        await api.post('/shelters', payload);
      }
      resetForm();
      fetchShelters();
    } catch (error) {
      console.error('Failed to save shelter:', error);
    }
  };

  const deleteShelter = async (id: string) => {
    if (!confirm('Delete this shelter?')) return;
    try {
      await api.delete(`/shelters/${id}`);
      fetchShelters();
    } catch (error) {
      console.error('Failed to delete shelter:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-label">Shelter Management</p>
          <h1 className="text-heading-xl mt-1">Shelters Registry</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> Add Shelter
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading-md">{editId ? 'Edit Shelter' : 'New Shelter'}</h3>
            <button onClick={resetForm} className="text-text-secondary hover:text-text-primary">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-label block mb-1">Latitude</label>
                <input type="number" step="any" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="text-label block mb-1">Longitude</label>
                <input type="number" step="any" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} className="input-field" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-label block mb-1">Total Capacity</label>
                <input type="number" value={form.totalCapacity} onChange={e => setForm({...form, totalCapacity: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="text-label block mb-1">Current Occupancy</label>
                <input type="number" value={form.currentOccupancy} onChange={e => setForm({...form, currentOccupancy: e.target.value})} className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-label block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="select-field">
                <option value="operational">Operational</option>
                <option value="full">Full</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-label block mb-1">Contact Info</label>
              <input value={form.contactInfo} onChange={e => setForm({...form, contactInfo: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-label block mb-1">Resources (comma-separated)</label>
              <input value={form.resourcesAvailable} onChange={e => setForm({...form, resourcesAvailable: e.target.value})} className="input-field" placeholder="water, blankets, first aid" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">
                <Save size={16} /> {editId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shelter list */}
      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : shelters.length === 0 ? (
        <div className="card p-8 text-center">
          <MapPin size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No shelters yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shelters.map((s) => {
            const pct = s.totalCapacity > 0 ? Math.round((s.currentOccupancy / s.totalCapacity) * 100) : 0;
            const barColor = pct >= 85 ? 'bg-shelter-full' : pct >= 60 ? 'bg-shelter-filling' : 'bg-shelter-available';
            return (
              <div key={s._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
                    <p className="text-xs text-text-muted capitalize mt-0.5">{s.status} · {s.contactInfo || 'No contact info'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded hover:bg-surface-elevated transition-colors text-text-secondary">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteShelter(s._id)} className="p-1.5 rounded hover:bg-incident-critical/15 transition-colors text-text-secondary hover:text-incident-critical">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary font-medium">{s.currentOccupancy}/{s.totalCapacity}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
