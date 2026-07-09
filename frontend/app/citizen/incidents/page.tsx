'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Incident } from '@/lib/types';
import { AlertTriangle, Clock, CheckCircle, UserCheck } from 'lucide-react';

const statusColors: Record<string, string> = {
  reported: 'badge-critical',
  acknowledged: 'badge-medium',
  assigned: 'badge-info',
  resolved: 'badge-success',
};

const statusSteps = ['reported', 'acknowledged', 'assigned', 'resolved'];

export default function CitizenIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get('/incidents');
        setIncidents(res.data.incidents || []);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse-subtle text-text-secondary">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="mb-6">
        <p className="text-label">Incident Tracking</p>
        <h1 className="text-heading-xl mt-1">My Reports</h1>
      </div>

      {incidents.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No incidents reported yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const currentStep = statusSteps.indexOf(inc.status);
            return (
              <div key={inc._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary capitalize">
                      {inc.category} Incident
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(inc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge ${statusColors[inc.status]}`}>
                    {inc.status}
                  </span>
                </div>

                <p className="text-sm text-text-secondary mb-3">{inc.description}</p>

                {/* Progress pipeline */}
                <div className="flex items-center gap-1">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-full h-1 rounded-full ${
                        i <= currentStep ? 'bg-accent' : 'bg-surface-elevated'
                      }`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {statusSteps.map((step) => (
                    <span key={step} className="text-[9px] text-text-muted capitalize">{step}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
