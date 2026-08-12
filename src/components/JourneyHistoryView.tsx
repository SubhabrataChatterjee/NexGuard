import React, { useState } from 'react';
import { History, Shield, CheckCircle2, XCircle, AlertTriangle, Calendar, MapPin, Clock } from 'lucide-react';
import { Journey } from '../types';

interface JourneyHistoryViewProps {
  journeys: Journey[];
}

export const JourneyHistoryView: React.FC<JourneyHistoryViewProps> = ({ journeys }) => {
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const getStatusBadge = (status: Journey['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> SAFE ARRIVAL
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> CANCELLED
          </span>
        );
      case 'SOS_ACTIVE':
      case 'ESCALATED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> SOS TRIGGERED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#532dcf] bg-[#f0ecff] px-3 py-1 rounded-full">
            <Shield className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Journey History & Logs</h1>
        <p className="text-sm text-[#51505f] mt-1">
          Review past safe journey logs, arrival timestamps, and security events.
        </p>
      </div>

      {journeys.length > 0 ? (
        <div className="space-y-4">
          {journeys.map((j) => (
            <div
              key={j.id}
              onClick={() => setSelectedJourney(j)}
              className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f0ecff] text-[#532dcf] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191c1e]">{j.destination_name}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#797586] mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(j.started_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Started {new Date(j.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                {getStatusBadge(j.status)}
                <span className="text-xs font-bold text-[#532dcf] hover:underline">View Log →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] text-center space-y-2 max-w-md mx-auto">
          <History className="w-10 h-10 text-[#797586] mx-auto" />
          <p className="text-base font-bold text-[#191c1e]">No Journey History</p>
          <p className="text-xs text-[#797586]">Your completed journeys and safety logs will appear here.</p>
        </div>
      )}

      {/* Selected Journey Log Drawer/Modal */}
      {selectedJourney && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-[500px] w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#e1e2e5] pb-3">
              <h3 className="text-lg font-bold text-[#191c1e]">Journey Security Audit</h3>
              <button
                onClick={() => setSelectedJourney(null)}
                className="text-xs text-[#797586] hover:text-[#191c1e] font-bold"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#191c1e]">
              <div className="p-3 bg-[#f8f9fc] rounded-2xl space-y-1 border border-[#e1e2e5]">
                <p className="text-[#797586]">Destination</p>
                <p className="font-bold text-sm">{selectedJourney.destination_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5]">
                  <p className="text-[#797586]">Started At</p>
                  <p className="font-bold">{new Date(selectedJourney.started_at).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5]">
                  <p className="text-[#797586]">Arrival Status</p>
                  <p className="font-bold uppercase text-[#532dcf]">{selectedJourney.status}</p>
                </div>
              </div>

              <div className="p-3 bg-[#f0ecff] text-[#1c0062] rounded-2xl space-y-1">
                <p className="font-bold">Encryption & Privacy Verification</p>
                <p className="text-[11px]">
                  All temporary location telemetry for this journey has been safely archived in accordance with your privacy preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
