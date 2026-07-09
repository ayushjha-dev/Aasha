'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Incident, VolunteerTeam } from '@/lib/types';
import Link from 'next/link';
import {
  AlertTriangle, Users, ClipboardList, Activity,
  ArrowRight
} from 'lucide-react';

const severityLabels = ['', 'Low', 'Low', 'Medium', 'High', 'Critical'];
const severityColors = ['', 'text-incident-low', 'text-incident-low', 'text-incident-medium', 'text-incident-high', 'text-incident-critical'];

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<VolunteerTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, teamRes] = await Promise.all([
          api.get('/incidents?status=reported&limit=10'),
          api.get('/teams'),
        ]);
        setIncidents(incRes.data.incidents || []);
        setTeams(teamRes.data.teams || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      </div>
    );
  }

  const myTeams = teams.filter(t =>
    t.memberIds.some(m => typeof m === 'object' ? m.id === user?.id : m === user?.id)
  );

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label">Volunteer Portal</p>
          <h1 className="text-heading-xl mt-1">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-status-active animate-pulse-subtle" />
          <span className="text-xs text-text-secondary">On Duty</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-text-primary font-display">
            {incidents.length}
          </p>
          <p className="text-label mt-1">Open Incidents</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-text-primary font-display">
            {myTeams.length}
          </p>
          <p className="text-label mt-1">My Teams</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-text-primary font-display">
            {user?.skills?.length || 0}
          </p>
          <p className="text-label mt-1">Skills</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Open incidents needing response */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-md">Needs Response</h2>
            <Link href="/volunteer/incidents" className="text-accent text-xs flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {incidents.length === 0 ? (
            <p className="text-text-muted text-sm py-4">No open incidents</p>
          ) : (
            <div className="space-y-2">
              {incidents.slice(0, 5).map((inc) => (
                <div key={inc._id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <AlertTriangle size={14} className={severityColors[inc.severity] || 'text-text-secondary'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate capitalize">
                      {inc.category}
                    </p>
                    <p className="text-xs text-text-muted truncate">{inc.description.slice(0, 60)}</p>
                  </div>
                  <span className="text-xs font-medium text-text-secondary">
                    Sev {inc.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My teams */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-md">My Teams</h2>
            <Link href="/volunteer/teams" className="text-accent text-xs flex items-center gap-1 hover:underline">
              All teams <ArrowRight size={12} />
            </Link>
          </div>
          {myTeams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-text-muted text-sm mb-2">Not on any team yet</p>
              <Link href="/volunteer/teams" className="btn-secondary text-xs">
                Browse Teams
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myTeams.map((team) => (
                <div key={team._id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <Users size={14} className="text-status-active" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium">{team.name}</p>
                    <p className="text-xs text-text-muted capitalize">{team.specialization}</p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {team.memberIds.length} members
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
