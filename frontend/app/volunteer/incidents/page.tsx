'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Incident } from '@/lib/types';
import { AlertTriangle, MapPin, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';

const IncidentMap = dynamic(() => import('@/components/map/incident-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[50vh] bg-surface-primary rounded flex items-center justify-center border border-surface-border">
      <p className="text-text-muted text-sm">Loading map...</p>
    </div>
  ),
});

const severityColors: Record<number, string> = {
  1: 'badge-low', 2: 'badge-low', 3: 'badge-medium', 4: 'badge-high', 5: 'badge-critical',
};

export default function VolunteerIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (categoryFilter) params.set('category', categoryFilter);
        const res = await api.get(`/incidents?${params.toString()}`);
        setIncidents(res.data.incidents || []);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [categoryFilter]);

  const unresolvedIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-label">Incident Overview</p>
          <h1 className="text-heading-xl mt-1">Active Incidents</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface-secondary rounded border border-surface-border">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === 'list' ? 'bg-accent text-surface-primary' : 'text-text-secondary'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              view === 'map' ? 'bg-accent text-surface-primary' : 'text-text-secondary'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-text-secondary" />
        {['', 'medical', 'fire', 'flood', 'trapped', 'other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
              categoryFilter === cat
                ? 'bg-accent text-surface-primary'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-surface-border'
            }`}
          >
            {cat || 'All'}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <div className="rounded overflow-hidden border border-surface-border" style={{ height: '60vh' }}>
          <IncidentMap incidents={unresolvedIncidents} />
        </div>
      ) : loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : unresolvedIncidents.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No active incidents</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unresolvedIncidents.map((inc) => (
            <div key={inc._id} className="card p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle size={16} className={
                  inc.severity >= 4 ? 'text-incident-critical' :
                  inc.severity >= 3 ? 'text-incident-medium' : 'text-incident-low'
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-primary capitalize">{inc.category}</h3>
                  <span className={`badge ${severityColors[inc.severity] || 'badge-info'}`}>
                    Sev {inc.severity}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{inc.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {inc.location.lat.toFixed(3)}, {inc.location.lng.toFixed(3)}
                  </span>
                  <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
