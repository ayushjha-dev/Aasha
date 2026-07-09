'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n-context';
import api from '@/lib/api';
import { Incident, Shelter } from '@/lib/types';
import Link from 'next/link';
import {
  AlertTriangle, MapPin, ClipboardList, Package,
  Plus, ArrowRight
} from 'lucide-react';

const statusColors: Record<string, string> = {
  reported: 'badge-critical',
  acknowledged: 'badge-medium',
  assigned: 'badge-info',
  resolved: 'badge-success',
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, shelterRes] = await Promise.all([
          api.get('/incidents?limit=5'),
          api.get('/shelters?status=operational'),
        ]);
        setIncidents(incRes.data.incidents || []);
        setShelters(shelterRes.data.shelters || []);
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
        <div className="animate-pulse-subtle text-text-secondary">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  const openShelters = shelters.filter(s => s.status === 'operational');

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <p className="text-label">{t('citizen.portal', 'Citizen Portal')}</p>
        <h1 className="text-heading-xl mt-1">
          {t('citizen.hello', 'Hello')}, {user?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/citizen/report"
          className="card p-4 flex flex-col items-center gap-2 hover:border-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-incident-critical/15 flex items-center justify-center">
            <Plus size={20} className="text-incident-critical" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-accent transition-colors">
            {t('citizen.reportIncident', 'Report Incident')}
          </span>
        </Link>

        <Link
          href="/citizen/shelters"
          className="card p-4 flex flex-col items-center gap-2 hover:border-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-status-active/15 flex items-center justify-center">
            <MapPin size={20} className="text-status-active" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-accent transition-colors">
            {t('citizen.findShelters', 'Find Shelters')}
          </span>
        </Link>

        <Link
          href="/citizen/incidents"
          className="card p-4 flex flex-col items-center gap-2 hover:border-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-incident-medium/15 flex items-center justify-center">
            <ClipboardList size={20} className="text-incident-medium" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-accent transition-colors">
            {t('citizen.myReports', 'My Reports')}
          </span>
        </Link>

        <Link
          href="/citizen/donations"
          className="card p-4 flex flex-col items-center gap-2 hover:border-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-status-resolved/15 flex items-center justify-center">
            <Package size={20} className="text-status-resolved" />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-accent transition-colors">
            {t('citizen.donate', 'Donate')}
          </span>
        </Link>
      </div>

      {/* Two-column: Recent incidents + Nearby shelters */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent incidents */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-md">{t('citizen.recentReports', 'My Recent Reports')}</h2>
            <Link href="/citizen/incidents" className="text-accent text-xs flex items-center gap-1 hover:underline">
              {t('common.viewAll', 'View all')} <ArrowRight size={12} />
            </Link>
          </div>
          {incidents.length === 0 ? (
            <p className="text-text-muted text-sm py-4">{t('incident.noReports', 'No incidents reported yet')}</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div key={inc._id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <AlertTriangle size={14} className="text-text-secondary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate capitalize">
                      {t(`incident.${inc.category}`, inc.category)}: {inc.description.slice(0, 50)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${statusColors[inc.status] || 'badge-info'}`}>
                    {t(`incident.${inc.status}`, inc.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby shelters */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading-md">{t('citizen.availableShelters', 'Available Shelters')}</h2>
            <Link href="/citizen/shelters" className="text-accent text-xs flex items-center gap-1 hover:underline">
              {t('citizen.mapView', 'Map view')} <ArrowRight size={12} />
            </Link>
          </div>
          {openShelters.length === 0 ? (
            <p className="text-text-muted text-sm py-4">{t('shelter.noShelters', 'No shelters available')}</p>
          ) : (
            <div className="space-y-2">
              {openShelters.slice(0, 5).map((shelter) => {
                const percent = shelter.totalCapacity > 0
                  ? Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100)
                  : 0;
                const barColor = percent >= 85 ? 'bg-shelter-full' : percent >= 60 ? 'bg-shelter-filling' : 'bg-shelter-available';

                return (
                  <div key={shelter._id} className="py-2 border-b border-surface-border last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-text-primary font-medium">{shelter.name}</p>
                      <span className="text-xs text-text-secondary">
                        {shelter.currentOccupancy}/{shelter.totalCapacity}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
