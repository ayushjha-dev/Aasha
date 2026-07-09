'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AlertTriangle, MapPin, Camera, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'medical', label: 'Medical Emergency', color: 'text-incident-critical' },
  { value: 'fire', label: 'Fire', color: 'text-incident-high' },
  { value: 'flood', label: 'Flood', color: 'text-status-active' },
  { value: 'trapped', label: 'Person Trapped', color: 'text-incident-medium' },
  { value: 'other', label: 'Other', color: 'text-text-secondary' },
];

export default function ReportIncidentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    category: '',
    description: '',
    severity: 3,
    location: { lat: 0, lng: 0 },
    photoUrl: '',
  });
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }));
        setGpsStatus('success');
      },
      () => {
        setGpsStatus('error');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.category) {
      setError('Please select a category');
      return;
    }
    if (!form.description.trim()) {
      setError('Please describe the incident');
      return;
    }
    if (form.location.lat === 0 && form.location.lng === 0) {
      setError('Please capture your location');
      return;
    }

    setLoading(true);
    try {
      await api.post('/incidents', form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-status-resolved/15 flex items-center justify-center mb-4">
          <Send size={28} className="text-status-resolved" />
        </div>
        <h2 className="text-heading-lg text-center mb-2">Report Submitted</h2>
        <p className="text-text-secondary text-sm text-center mb-6 max-w-xs">
          Your incident has been reported. Responders have been notified and you can track the status from your dashboard.
        </p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/citizen')} className="btn-primary">
            Back to Dashboard
          </button>
          <button
            onClick={() => { setSubmitted(false); setForm({ category: '', description: '', severity: 3, location: { lat: 0, lng: 0 }, photoUrl: '' }); setGpsStatus('idle'); }}
            className="btn-secondary"
          >
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl animate-slide-up">
      <div className="mb-6">
        <p className="text-label">Report an Emergency</p>
        <h1 className="text-heading-xl mt-1">New Incident</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="badge-critical p-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-label block mb-2">What type of emergency?</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                className={`card p-3 text-left text-sm font-medium transition-colors ${
                  form.category === cat.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:border-surface-border'
                }`}
              >
                <AlertTriangle size={14} className={form.category === cat.value ? 'text-accent' : cat.color} />
                <span className="block mt-1">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="text-label block mb-1.5">
            Describe the situation
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="input-field min-h-[100px] resize-y"
            placeholder="What happened? How many people are affected? Any immediate dangers?"
            maxLength={2000}
            required
          />
          <p className="text-xs text-text-muted mt-1">{form.description.length}/2000</p>
        </div>

        {/* Severity */}
        <div>
          <label className="text-label block mb-2">
            Urgency Level: <span className="text-text-primary font-semibold">{form.severity}</span>/5
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.severity}
            onChange={(e) => setForm(prev => ({ ...prev, severity: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Low</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-label block mb-2">Your Location</label>
          <button
            type="button"
            onClick={getLocation}
            className={`btn-secondary w-full ${gpsStatus === 'success' ? 'border-status-resolved text-status-resolved' : ''}`}
          >
            <MapPin size={16} />
            {gpsStatus === 'idle' && 'Capture GPS Location'}
            {gpsStatus === 'loading' && 'Getting location...'}
            {gpsStatus === 'success' && `Location: ${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}`}
            {gpsStatus === 'error' && 'GPS failed — enter manually below'}
          </button>

          {/* Manual coordinates */}
          {(gpsStatus === 'error' || gpsStatus === 'idle') && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={form.location.lat || ''}
                onChange={(e) => setForm(prev => ({ ...prev, location: { ...prev.location, lat: Number(e.target.value) } }))}
                className="input-field text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={form.location.lng || ''}
                onChange={(e) => setForm(prev => ({ ...prev, location: { ...prev.location, lng: Number(e.target.value) } }))}
                className="input-field text-sm"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
