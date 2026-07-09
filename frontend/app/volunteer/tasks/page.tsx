'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Incident } from '@/lib/types';
import { ClipboardList, CheckCircle, Truck, MapPinned, Clock } from 'lucide-react';

const taskStatusFlow = ['acknowledged', 'assigned', 'resolved'];
const taskStatusLabels: Record<string, string> = {
  reported: 'Pending',
  acknowledged: 'Accepted',
  assigned: 'En Route / On Site',
  resolved: 'Completed',
};
const taskStatusIcons: Record<string, React.ReactNode> = {
  reported: <Clock size={14} />,
  acknowledged: <ClipboardList size={14} />,
  assigned: <Truck size={14} />,
  resolved: <CheckCircle size={14} />,
};

export default function VolunteerTasksPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents?limit=100');
      // Show only incidents that are not just "reported" — these are actionable
      setIncidents(res.data.incidents?.filter((i: Incident) => i.status !== 'reported') || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/incidents/${id}`, { status });
      fetchIncidents();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="mb-6">
        <p className="text-label">Task Management</p>
        <h1 className="text-heading-xl mt-1">My Tasks</h1>
      </div>

      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : incidents.length === 0 ? (
        <div className="card p-8 text-center">
          <ClipboardList size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No assigned tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc._id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {taskStatusIcons[inc.status]}
                  <h3 className="text-sm font-semibold text-text-primary capitalize">{inc.category}</h3>
                </div>
                <span className="text-xs text-text-muted">
                  {taskStatusLabels[inc.status] || inc.status}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">{inc.description}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                <MapPinned size={12} />
                <span>{inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)}</span>
              </div>

              {/* Status update buttons */}
              <div className="flex gap-2">
                {inc.status === 'acknowledged' && (
                  <button
                    onClick={() => updateStatus(inc._id, 'assigned')}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-status-active/15 text-status-active hover:bg-status-active/25 transition-colors"
                  >
                    <Truck size={12} className="inline mr-1" /> Mark En Route
                  </button>
                )}
                {inc.status === 'assigned' && (
                  <button
                    onClick={() => updateStatus(inc._id, 'resolved')}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-status-resolved/15 text-status-resolved hover:bg-status-resolved/25 transition-colors"
                  >
                    <CheckCircle size={12} className="inline mr-1" /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
