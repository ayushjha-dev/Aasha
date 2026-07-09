'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { DashboardStats, Incident, Shelter } from '@/lib/types';
import {
  AlertTriangle, MapPin, Users, Package,
  TrendingUp, Activity, ArrowUpRight, Search, FileText, CheckCircle2
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load the map component (Leaflet is heavy and client-side only)
const DashboardMap = dynamic(() => import('@/components/map/dashboard-map'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] bg-surface-primary rounded flex items-center justify-center border border-surface-border">
      <p className="text-text-muted text-sm">Loading Live Map...</p>
    </div>
  ),
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for donations ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, exportRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/export'),
      ]);
      setStats(statsRes.data);
      setIncidents(exportRes.data.data.incidents || []);
      setShelters(exportRes.data.data.shelters || []);
      setDonations(exportRes.data.data.donations || []);
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (donationId: string, newStatus: string) => {
    try {
      await api.put(`/donations/${donationId}`, { status: newStatus });
      // Refresh local states in background
      const [exportRes, statsRes] = await Promise.all([
        api.get('/admin/export'),
        api.get('/admin/stats')
      ]);
      setDonations(exportRes.data.data.donations || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to update donation status:', error);
    }
  };

  // Helper parsing functions to extract target allocation details
  const getAllocationInfo = (desc: string, type: 'goods' | 'funds') => {
    if (type === 'goods') return 'Emergency Supplies & Relief Goods';
    const match = desc.match(/^\[Allocation: (.*?)\]/);
    return match ? match[1] : 'General Crisis Relief Operations';
  };

  const getCleanDescription = (desc: string) => {
    return desc.replace(/^\[Allocation: (.*?)\]\s*/, '');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse-subtle text-text-secondary">Loading admin dashboard...</div>
      </div>
    );
  }

  // Filtered Donations
  const filteredDonations = donations.filter((don) => {
    const donorName = don.donorId?.name || '';
    const donorEmail = don.donorId?.email || '';
    const description = don.description || '';
    
    const matchesSearch = 
      donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || don.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || don.type === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label">Command Center</p>
          <h1 className="text-heading-xl mt-1">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-status-active animate-pulse-subtle" />
          <span className="text-xs text-text-secondary">Live System</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Active Incidents */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle size={16} className="text-incident-critical" />
            <ArrowUpRight size={14} className="text-text-muted" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-display">
            {stats?.incidents.active || 0}
          </p>
          <p className="text-label mt-1">Active Incidents</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-incident-medium">{stats?.incidents.reported || 0} new</span>
            <span className="text-text-muted">·</span>
            <span className="text-status-resolved">{stats?.incidents.resolved || 0} resolved</span>
          </div>
        </div>

        {/* Shelters */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <MapPin size={16} className="text-status-active" />
            <ArrowUpRight size={14} className="text-text-muted" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-display">
            {stats?.shelters.operational || 0}
          </p>
          <p className="text-label mt-1">Operational Shelters</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-shelter-filling">{stats?.shelters.nearCapacity || 0} near cap.</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">{stats?.shelters.full || 0} full</span>
          </div>
        </div>

        {/* Volunteers */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <Users size={16} className="text-status-resolved" />
            <TrendingUp size={14} className="text-text-muted" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-display">
            {stats?.users.volunteers || 0}
          </p>
          <p className="text-label mt-1">Active Volunteers</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-text-secondary">{stats?.users.citizens || 0} citizens</span>
          </div>
        </div>

        {/* Donations */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <Package size={16} className="text-accent" />
            <ArrowUpRight size={14} className="text-text-muted" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-display">
            {stats?.donations.total || 0}
          </p>
          <p className="text-label mt-1">Total Donations</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-incident-medium">{stats?.donations.pending || 0} pending</span>
          </div>
        </div>
      </div>

      {/* Two-column layout: Live Map + Status summary */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Map area */}
        <div className="lg:col-span-3 card p-4 flex flex-col h-[400px]">
          <h2 className="text-heading-md mb-3 flex items-center gap-1.5">
            <Activity size={15} className="text-status-active animate-pulse-subtle" />
            Incident & Shelter Live Map
          </h2>
          <div className="flex-1 rounded overflow-hidden border border-surface-border relative">
            <DashboardMap incidents={incidents} shelters={shelters} />
          </div>
        </div>

        {/* Status summary */}
        <div className="lg:col-span-2 card p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-heading-md mb-3">Status Overview</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-surface-border">
                <span className="text-sm text-text-secondary">Total Incidents</span>
                <span className="text-sm font-semibold text-text-primary">{stats?.incidents.total || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-incident-critical" />
                  <span className="text-sm text-text-secondary">Reported</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">{stats?.incidents.reported || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-active" />
                  <span className="text-sm text-text-secondary">Active</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">{stats?.incidents.active || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-resolved" />
                  <span className="text-sm text-text-secondary">Resolved</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">{stats?.incidents.resolved || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-shelter-filling" />
                  <span className="text-sm text-text-secondary">Shelters Near Capacity</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">{stats?.shelters.nearCapacity || 0}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-text-muted text-center border-t border-surface-border/50 pt-3 mt-4">
            System sync: Last checked just now
          </div>
        </div>
      </div>

      {/* Contributions & Donations Ledger (Donatory section) */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-surface-border pb-3">
          <div>
            <h2 className="text-heading-md flex items-center gap-2">
              <Package size={18} className="text-accent" />
              Contributions & Donations Ledger
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">Manage and track relief pledges made by platform citizens.</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search donor or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-1 text-xs"
            />
          </div>
        </div>

        {/* Filters and counts row */}
        <div className="flex flex-wrap justify-between items-center gap-3 text-xs bg-surface-elevated/20 p-2.5 rounded border border-surface-border/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[10px] uppercase font-bold">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field py-0.5 px-2 text-[11px] h-7 w-28 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="goods">Goods / Supplies</option>
                <option value="funds">Financial Funds</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[10px] uppercase font-bold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field py-0.5 px-2 text-[11px] h-7 w-28 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pledged">Pledged</option>
                <option value="collected">Collected</option>
                <option value="distributed">Distributed</option>
              </select>
            </div>
          </div>

          <span className="text-[10px] text-text-muted font-bold font-mono">
            Showing {filteredDonations.length} of {donations.length} entries
          </span>
        </div>

        {/* Ledger Entries */}
        {filteredDonations.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-surface-border rounded bg-surface-elevated/5">
            <FileText size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-secondary font-medium">No donation ledger entries match your filter criteria</p>
            <p className="text-[10px] text-text-muted mt-0.5">Try widening search criteria or reset filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-surface-border rounded">
            <table className="min-w-full divide-y divide-surface-border text-left">
              <thead className="bg-surface-secondary text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Donor / Email</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Relief Allocation & Details</th>
                  <th className="px-4 py-3">Pledge Date</th>
                  <th className="px-4 py-3">Status Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs text-text-secondary">
                {filteredDonations.map((don) => {
                  const allocation = getAllocationInfo(don.description, don.type);
                  const cleanDesc = getCleanDescription(don.description);
                  const statusColors: Record<string, string> = {
                    pledged: 'bg-status-active/10 text-status-active border-status-active/30',
                    collected: 'bg-accent/10 text-accent border-accent/30',
                    distributed: 'bg-status-resolved/10 text-status-resolved border-status-resolved/30',
                  };

                  return (
                    <tr key={don._id} className="hover:bg-surface-elevated/10 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-text-primary">{don.donorId?.name || 'Anonymous Donor'}</div>
                        <div className="text-[10px] text-text-muted">{don.donorId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          don.type === 'goods' ? 'bg-status-active/10 text-status-active' : 'bg-accent/10 text-accent'
                        }`}>
                          {don.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-bold text-text-primary truncate">{allocation}</div>
                        <div className="text-[10px] text-text-muted truncate max-w-xs">{cleanDesc}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-muted font-mono">
                        {new Date(don.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={don.status}
                          onChange={(e) => handleStatusChange(don._id, e.target.value)}
                          className={`text-[11px] font-bold border rounded px-2 py-1 bg-surface-primary cursor-pointer ${
                            statusColors[don.status] || ''
                          }`}
                        >
                          <option value="pledged">Pledged</option>
                          <option value="collected">Collected</option>
                          <option value="distributed">Distributed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
