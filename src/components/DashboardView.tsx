import React, { useState, useEffect } from 'react';
import { Play, Shield, ShieldAlert, Users, Ambulance, History, CheckCircle2, ArrowRight, Bot, MapPin, RefreshCw, PhoneCall, Compass } from 'lucide-react';
import { User, Journey } from '../types';
import { getCurrentGPSPosition, LocationData } from '../utils/location';

interface DashboardViewProps {
  user: User | null;
  activeJourney: Journey | null;
  recentJourneys: Journey[];
  onStartJourneyClick: () => void;
  onOpenSos: () => void;
  onSelectTab: (tab: string) => void;
  onOpenAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeJourney,
  recentJourneys,
  onStartJourneyClick,
  onOpenSos,
  onSelectTab,
  onOpenAssistant,
}) => {
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  const handleFetchLocation = async () => {
    setLocating(true);
    try {
      const loc = await getCurrentGPSPosition();
      setUserLocation(loc);
    } catch (err) {
      console.warn('GPS detection failed:', err);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    handleFetchLocation();
  }, []);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
      {/* Greeting Header & Live Emergency Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="text-[#51505f] text-base mt-1">Your safety and live protection network active.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="tel:112"
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="w-4 h-4 fill-current" />
            <span>Emergency 112</span>
          </a>
          <a
            href="tel:1091"
            className="bg-[#532dcf] hover:bg-[#481cc4] text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="w-4 h-4 fill-current" />
            <span>Women Helpline 1091</span>
          </a>
        </div>
      </div>

      {/* Live Location & GPS Status Banner */}
      <div className="bg-white rounded-3xl p-5 border border-[#e1e2e5] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#f0ecff] text-[#532dcf] flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#532dcf] uppercase tracking-wider">YOUR DETECTED CURRENT LOCATION</span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live GPS
              </span>
            </div>
            <p className="text-sm font-extrabold text-[#191c1e] mt-0.5">
              {userLocation ? userLocation.address : 'Detecting your exact GPS location...'}
            </p>
            {userLocation && (
              <p className="text-[11px] text-[#797586] mt-0.5">
                Lat: {userLocation.latitude.toFixed(4)}, Lng: {userLocation.longitude.toFixed(4)}
                {userLocation.accuracyMeters ? ` • Accuracy: ±${userLocation.accuracyMeters}m` : ''}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleFetchLocation}
          disabled={locating}
          className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 self-end md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin text-[#532dcf]' : ''}`} />
          <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Hero Card (8 cols on desktop) */}
        <div className="col-span-1 md:col-span-8 bg-[#532dcf] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[280px]">
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white mb-2">
              <Shield className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">Ready to head out?</h2>
            <p className="text-sm md:text-base text-[#eee7ff] opacity-90 leading-relaxed">
              Start a session to share your real-time location with trusted contacts and enable smart check-in alerts.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <button
              onClick={onStartJourneyClick}
              className="bg-white text-[#532dcf] font-bold px-8 py-4 rounded-xl shadow-md hover:shadow-xl transition-all flex items-center gap-3 text-sm tracking-wide active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START SAFE JOURNEY</span>
            </button>
          </div>
        </div>

        {/* Status Card (4 cols on desktop) */}
        <div className="col-span-1 md:col-span-4 bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#f2f3f6] rounded-xl text-[#51505f]">
              <Shield className="w-6 h-6" />
            </div>
            <span className="bg-[#f2f3f6] text-[#484555] font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
              STATUS
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#191c1e] mb-1">
              {activeJourney ? 'Journey Active' : 'All Systems Normal'}
            </h3>
            <p className="text-xs text-[#51505f]">
              {activeJourney ? `Monitoring path to ${activeJourney.destination_name}` : 'Location Sharing Off'}
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-[#f2f3f6] flex justify-between items-center text-xs text-[#797586]">
            <span>Last check: Just now</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      {/* NexGuard Assistant Banner */}
      <div className="bg-[#f0ecff] border border-[#c9c4d7]/60 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#532dcf] text-white flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#191c1e]">NexGuard AI Safety Assistant</h4>
            <p className="text-xs text-[#484555]">Need immediate advice, safety guidelines, or nearby resource information?</p>
          </div>
        </div>
        <button
          onClick={onOpenAssistant}
          className="bg-[#532dcf] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#481cc4] transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <span>Ask Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#191c1e]">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Action 1: SOS */}
          <button
            onClick={onOpenSos}
            className="bg-[#ffdad6] text-[#93000a] border border-[#ffdad6] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="bg-[#ba1a1a] text-white p-3.5 rounded-full group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="font-bold text-base">SOS</span>
          </button>

          {/* Action 2: Trusted Contacts */}
          <button
            onClick={() => onSelectTab('contacts')}
            className="bg-white text-[#191c1e] border border-[#e1e2e5] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="bg-[#6c4ce8]/15 text-[#532dcf] p-3.5 rounded-full group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <span className="font-semibold text-sm">Trusted Contacts</span>
          </button>

          {/* Action 3: Nearby Help */}
          <button
            onClick={() => onSelectTab('resources')}
            className="bg-white text-[#191c1e] border border-[#e1e2e5] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="bg-[#785fe1]/15 text-[#532dcf] p-3.5 rounded-full group-hover:scale-110 transition-transform">
              <Ambulance className="w-7 h-7" />
            </div>
            <span className="font-semibold text-sm">Nearby Help</span>
          </button>

          {/* Action 4: History */}
          <button
            onClick={() => onSelectTab('history')}
            className="bg-white text-[#191c1e] border border-[#e1e2e5] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="bg-[#f2f3f6] text-[#484555] p-3.5 rounded-full group-hover:scale-110 transition-transform">
              <History className="w-7 h-7" />
            </div>
            <span className="font-semibold text-sm">History</span>
          </button>
        </div>
      </div>

      {/* Recent Journeys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#191c1e]">Recent Journey</h3>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs font-semibold text-[#532dcf] hover:underline"
          >
            View All
          </button>
        </div>

        {recentJourneys.length > 0 ? (
          <div className="space-y-3">
            {recentJourneys.slice(0, 2).map((j) => (
              <div
                key={j.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#e1e2e5] flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-14 h-14 rounded-full bg-[#eee7ff] text-[#532dcf] flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-base text-[#191c1e]">{j.destination_name}</h4>
                  <p className="text-xs text-[#51505f] mt-1">
                    Started {new Date(j.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Status:{' '}
                    <span className="font-semibold uppercase">{j.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#f2f3f6] px-4 py-2 rounded-xl shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#008a00]" />
                  <span className="text-xs font-semibold text-[#191c1e]">
                    {j.status === 'COMPLETED' ? 'Safe Arrival' : j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e1e2e5] text-center space-y-2">
            <p className="text-sm font-semibold text-[#191c1e]">No recent journeys</p>
            <p className="text-xs text-[#797586]">Start your first Safe Journey whenever you're traveling or commuting.</p>
          </div>
        )}
      </div>
    </div>
  );
};
