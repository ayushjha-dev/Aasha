'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User } from '@/lib/types';
import { Users, Search } from 'lucide-react';

export default function AdminVolunteersPage() {
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await api.get('/volunteers');
        setVolunteers(res.data.volunteers || []);
      } catch (error) {
        console.error('Failed to fetch volunteers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="mb-6">
        <p className="text-label">Team Management</p>
        <h1 className="text-heading-xl mt-1">Volunteer Directory</h1>
      </div>

      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : volunteers.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No volunteers registered yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {volunteers.map((v: any) => (
            <div key={v._id} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-semibold text-text-primary">
                  {v.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{v.name}</h3>
                  <p className="text-xs text-text-muted">{v.email}</p>
                </div>
              </div>
              {v.phone && (
                <p className="text-xs text-text-secondary mb-1">📞 {v.phone}</p>
              )}
              {v.skills && v.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-status-active/15 text-status-active capitalize">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
