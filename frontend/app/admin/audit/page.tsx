'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AuditLogEntry } from '@/lib/types';
import { FileText } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit');
        setLogs(res.data.logs || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-4 md:p-6 animate-slide-up">
      <div className="mb-6">
        <p className="text-label">System Activity</p>
        <h1 className="text-heading-xl mt-1">Audit Log</h1>
      </div>

      {loading ? (
        <div className="animate-pulse-subtle text-text-secondary">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No audit entries yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const actor = typeof log.actorId === 'object' ? log.actorId : null;
            return (
              <div key={log._id} className="flex items-start gap-3 py-2.5 px-3 border-b border-surface-border/50 hover:bg-surface-secondary/30">
                <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-text-secondary mt-0.5 flex-shrink-0">
                  {(actor as any)?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{(actor as any)?.name || 'Unknown'}</span>
                    {' '}
                    <span className="text-text-secondary">{log.action}</span>
                    {' '}
                    <span className="text-text-muted">{log.targetType}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-text-muted mt-0.5">{log.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-text-muted flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
