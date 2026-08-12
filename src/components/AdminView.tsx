import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, MapPin, AlertTriangle, Activity, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<{
    total_users: number;
    active_journeys: number;
    active_sos_alerts: number;
    verified_resources: number;
    total_contacts: number;
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [statsData, logsData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminAuditLogs(),
        ]);
        setStats(statsData);
        setAuditLogs(logsData);
      } catch (err) {
        console.error('Admin API fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[#532dcf]" />
          <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Safety Operator Console</h1>
        </div>
        <p className="text-sm text-[#51505f] mt-1">
          Production monitoring dashboard, active crisis intervention status, and immutable audit trails.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[#797586]">Loading operational metrics...</div>
      ) : (
        <>
          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#e1e2e5] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#797586] mb-2">
                <Users className="w-4 h-4 text-[#532dcf]" />
                <span>TOTAL USERS</span>
              </div>
              <p className="text-3xl font-black text-[#191c1e]">{stats?.total_users || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e1e2e5] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#797586] mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>ACTIVE JOURNEYS</span>
              </div>
              <p className="text-3xl font-black text-green-600">{stats?.active_journeys || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e1e2e5] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a] mb-2">
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                <span>ACTIVE SOS ALERTS</span>
              </div>
              <p className="text-3xl font-black text-[#ba1a1a]">{stats?.active_sos_alerts || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#e1e2e5] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#797586] mb-2">
                <Activity className="w-4 h-4 text-[#532dcf]" />
                <span>VERIFIED RESOURCES</span>
              </div>
              <p className="text-3xl font-black text-[#191c1e]">{stats?.verified_resources || 0}</p>
            </div>
          </div>

          {/* Real-time Audit Logs */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e1e2e5] pb-3">
              <FileText className="w-5 h-5 text-[#532dcf]" />
              <h3 className="font-bold text-base text-[#191c1e]">Security & Incident Audit Log</h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#532dcf] uppercase">{log.action}</span>
                        <span className="text-[#797586]">• Actor: {log.actor_name || log.actor_user_id}</span>
                      </div>
                      <p className="text-[#51505f] mt-0.5">
                        Target: {log.entity_type} ({log.entity_id})
                      </p>
                    </div>

                    <span className="text-[11px] text-[#797586] font-mono shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#797586]">No audit logs recorded.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
