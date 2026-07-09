'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { VolunteerTeam } from '@/lib/types';
import { Users, Plus, UserPlus, LogOut as LeaveIcon } from 'lucide-react';

export default function VolunteerTeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<VolunteerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', specialization: 'general' });

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teams', newTeam);
      setShowCreate(false);
      setNewTeam({ name: '', specialization: 'general' });
      fetchTeams();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const joinTeam = async (id: string) => {
    try {
      await api.post(`/teams/${id}/join`);
      fetchTeams();
    } catch (error) {
      console.error('Failed to join team:', error);
    }
  };

  const leaveTeam = async (id: string) => {
    try {
      await api.post(`/teams/${id}/leave`);
      fetchTeams();
    } catch (error) {
      console.error('Failed to leave team:', error);
    }
  };

  const isMember = (team: VolunteerTeam) =>
    team.memberIds.some(m => typeof m === 'object' ? (m as any)._id === user?.id || (m as any).id === user?.id : m === user?.id);

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-label">Collaboration</p>
          <h1 className="text-heading-xl mt-1">Volunteer Teams</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus size={16} /> Create Team
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createTeam} className="card p-4 mb-4 animate-slide-up">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-label block mb-1">Team Name</label>
              <input
                value={newTeam.name}
                onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                className="input-field"
                placeholder="e.g., Alpha Rescue"
                required
              />
            </div>
            <div>
              <label className="text-label block mb-1">Specialization</label>
              <select
                value={newTeam.specialization}
                onChange={e => setNewTeam({...newTeam, specialization: e.target.value})}
                className="select-field"
              >
                <option value="general">General</option>
                <option value="medical">Medical</option>
                <option value="search & rescue">Search & Rescue</option>
                <option value="logistics">Logistics</option>
                <option value="transport">Transport</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </div>
        </form>
      )}

      {/* Team list */}
      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No teams yet — be the first to create one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {teams.map((team) => {
            const memberOfTeam = isMember(team);
            return (
              <div key={team._id} className={`card p-4 ${memberOfTeam ? 'border-accent/50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{team.name}</h3>
                    <p className="text-xs text-text-muted capitalize">{team.specialization}</p>
                  </div>
                  {memberOfTeam ? (
                    <button
                      onClick={() => leaveTeam(team._id)}
                      className="px-2 py-1 rounded text-xs bg-incident-critical/15 text-incident-critical hover:bg-incident-critical/25"
                    >
                      <LeaveIcon size={12} className="inline mr-1" />Leave
                    </button>
                  ) : (
                    <button
                      onClick={() => joinTeam(team._id)}
                      className="px-2 py-1 rounded text-xs bg-status-active/15 text-status-active hover:bg-status-active/25"
                    >
                      <UserPlus size={12} className="inline mr-1" />Join
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {(team.memberIds as any[]).slice(0, 5).map((m: any, i: number) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-text-secondary border-2 border-surface-secondary"
                      title={m.name || 'Member'}
                    >
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  ))}
                  {team.memberIds.length > 5 && (
                    <span className="text-xs text-text-muted">+{team.memberIds.length - 5} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
