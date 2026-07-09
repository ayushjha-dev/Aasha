'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Incident, User } from '@/lib/types';
import { AlertTriangle, Search, Filter, UserPlus, Check } from 'lucide-react';

const statusColors: Record<string, string> = {
  reported: 'badge-critical',
  acknowledged: 'badge-medium',
  assigned: 'badge-info',
  resolved: 'badge-success',
};

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');
      const res = await api.get(`/incidents?${params.toString()}`);
      setIncidents(res.data.incidents || []);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/incidents/${id}`, { status });
      fetchIncidents();
      setSelectedIncident(null);
    } catch (error) {
      console.error('Failed to update incident:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-label">Incident Management</p>
          <h1 className="text-heading-xl mt-1">All Incidents</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-text-secondary" />
        {['', 'reported', 'acknowledged', 'assigned', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-accent text-surface-primary'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-surface-border'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : incidents.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No incidents found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left">
                <th className="text-label py-2 px-3 font-medium">Category</th>
                <th className="text-label py-2 px-3 font-medium">Description</th>
                <th className="text-label py-2 px-3 font-medium">Severity</th>
                <th className="text-label py-2 px-3 font-medium">Status</th>
                <th className="text-label py-2 px-3 font-medium">Reporter</th>
                <th className="text-label py-2 px-3 font-medium">Date</th>
                <th className="text-label py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => {
                const reporter = typeof inc.reporterId === 'object' ? inc.reporterId : null;
                return (
                  <tr key={inc._id} className="border-b border-surface-border/50 hover:bg-surface-secondary/50">
                    <td className="py-2.5 px-3 capitalize text-text-primary">{inc.category}</td>
                    <td className="py-2.5 px-3 text-text-secondary max-w-[200px] truncate">{inc.description}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-display font-bold text-base">{inc.severity}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`badge ${statusColors[inc.status]}`}>{inc.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">{reporter?.name || '—'}</td>
                    <td className="py-2.5 px-3 text-text-muted text-xs">
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1">
                        {inc.status === 'reported' && (
                          <button
                            onClick={() => updateStatus(inc._id, 'acknowledged')}
                            className="px-2 py-1 rounded text-xs bg-status-active/15 text-status-active hover:bg-status-active/25 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {inc.status === 'acknowledged' && (
                          <button
                            onClick={() => updateStatus(inc._id, 'assigned')}
                            className="px-2 py-1 rounded text-xs bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                          >
                            Assign
                          </button>
                        )}
                        {(inc.status === 'assigned' || inc.status === 'acknowledged') && (
                          <button
                            onClick={() => updateStatus(inc._id, 'resolved')}
                            className="px-2 py-1 rounded text-xs bg-status-resolved/15 text-status-resolved hover:bg-status-resolved/25 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
