'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Download, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState('');

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    setExportResult('');
    try {
      const res = await api.get('/admin/export');
      const data = res.data;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aasha-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert to CSV — flatten incidents
        const incidents = data.data.incidents || [];
        if (incidents.length === 0) {
          setExportResult('No data to export');
          return;
        }
        const headers = ['id', 'category', 'description', 'severity', 'status', 'lat', 'lng', 'createdAt'];
        const rows = incidents.map((inc: any) =>
          [inc._id, inc.category, `"${inc.description.replace(/"/g, '""')}"`, inc.severity, inc.status, inc.location?.lat, inc.location?.lng, inc.createdAt].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aasha-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExportResult('Export downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl animate-slide-up">
      <div className="mb-6">
        <p className="text-label">Configuration</p>
        <h1 className="text-heading-xl mt-1">Settings</h1>
      </div>

      {/* Export section */}
      <div className="card p-4 mb-4">
        <h2 className="text-heading-md mb-3">Data Export</h2>
        <p className="text-sm text-text-secondary mb-4">
          Download current incident, shelter, donation, and volunteer data.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="btn-primary"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn-secondary"
          >
            <Download size={16} />
            Export CSV (Incidents)
          </button>
        </div>
        {exportResult && (
          <p className="text-xs text-status-resolved mt-2">{exportResult}</p>
        )}
      </div>

      {/* System info */}
      <div className="card p-4">
        <h2 className="text-heading-md mb-3">System Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-surface-border">
            <span className="text-text-secondary">Platform</span>
            <span className="text-text-primary">Aasha v1.0</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-border">
            <span className="text-text-secondary">Frontend</span>
            <span className="text-text-primary">Next.js + Tailwind</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-border">
            <span className="text-text-secondary">Backend</span>
            <span className="text-text-primary">Express + MongoDB</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">Maps</span>
            <span className="text-text-primary">Leaflet + OpenStreetMap</span>
          </div>
        </div>
      </div>
    </div>
  );
}
