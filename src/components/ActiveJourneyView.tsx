import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Clock, Battery, AlertTriangle, CheckCircle, Share2, RefreshCw, LocateFixed } from 'lucide-react';
import { MapComponent } from './MapComponent';
import { Journey } from '../types';
import { getCurrentGPSPosition, LocationData } from '../utils/location';

interface ActiveJourneyViewProps {
  journey: Journey;
  onComplete: () => Promise<void>;
  onTriggerSos: () => void;
  onTriggerSafetyCheck: () => void;
}

export const ActiveJourneyView: React.FC<ActiveJourneyViewProps> = ({
  journey,
  onComplete,
  onTriggerSos,
  onTriggerSafetyCheck,
}) => {
  const [timeLeftMins, setTimeLeftMins] = useState<number>(15);
  const [completing, setCompleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<LocationData | null>(null);
  const [updatingLoc, setUpdatingLoc] = useState(false);

  const fetchCurrentLocation = async () => {
    setUpdatingLoc(true);
    try {
      const pos = await getCurrentGPSPosition();
      setCurrentLoc(pos);
    } catch (err) {
      console.warn('GPS location fetch error in active journey:', err);
    } finally {
      setUpdatingLoc(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
    const locInterval = setInterval(fetchCurrentLocation, 20000); // refresh position every 20s
    return () => clearInterval(locInterval);
  }, []);

  useEffect(() => {
    const targetTime = new Date(journey.expected_arrival_at).getTime();
    const updateTime = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 60000));
      setTimeLeftMins(diff);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [journey.expected_arrival_at]);

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSafeArrival = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  };

  const curLat = currentLoc?.latitude || journey.start_latitude || 22.5726;
  const curLng = currentLoc?.longitude || journey.start_longitude || 88.3639;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Top Banner Status */}
      <div className="bg-[#532dcf] text-white rounded-3xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl font-extrabold tracking-tight">Active Safe Journey</h1>
            </div>
            <p className="text-xs text-[#eee7ff] mt-0.5">
              Live location sharing active with your selected trusted contacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShareLink}
            className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Live Link'}</span>
          </button>
          <button
            onClick={onTriggerSos}
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 fill-current" />
            <span>SOS EMERGENCY</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 border border-[#e1e2e5] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#191c1e]">
              <LocateFixed className={`w-4 h-4 text-[#532dcf] ${updatingLoc ? 'animate-spin' : ''}`} />
              <span>Current GPS: {currentLoc ? currentLoc.address : journey.start_location_name}</span>
            </div>
            <button
              onClick={fetchCurrentLocation}
              disabled={updatingLoc}
              className="text-[#532dcf] font-bold text-[11px] flex items-center gap-1 hover:underline"
            >
              <RefreshCw className={`w-3 h-3 ${updatingLoc ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="h-[420px]">
            <MapComponent
              startLat={journey.start_latitude || 22.5726}
              startLng={journey.start_longitude || 88.3639}
              currentLat={curLat}
              currentLng={curLng}
              destLat={journey.destination_latitude || 22.5802}
              destLng={journey.destination_longitude || 88.4370}
              startName={journey.start_location_name}
              destName={journey.destination_name}
              height="100%"
            />
          </div>
        </div>

        {/* Details & Controls Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Timeline Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#797586]">
              Journey Details
            </h3>

            {/* Destination & Start */}
            <div className="space-y-3 relative pl-6 border-l-2 border-[#532dcf]/30">
              <div className="relative">
                <span className="w-3 h-3 bg-[#6c4ce8] rounded-full absolute -left-[31px] top-1 border-2 border-white" />
                <p className="text-xs text-[#797586]">From</p>
                <p className="text-sm font-bold text-[#191c1e]">{journey.start_location_name}</p>
              </div>

              <div className="relative pt-2">
                <span className="w-3 h-3 bg-[#008a00] rounded-full absolute -left-[31px] top-3 border-2 border-white" />
                <p className="text-xs text-[#797586]">Destination</p>
                <p className="text-sm font-bold text-[#191c1e]">{journey.destination_name}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#f8f9fc] p-3.5 rounded-2xl border border-[#e1e2e5]">
                <div className="flex items-center gap-1.5 text-xs text-[#797586] mb-1">
                  <Clock className="w-4 h-4 text-[#532dcf]" />
                  <span>ETA Remaining</span>
                </div>
                <p className="text-xl font-extrabold text-[#191c1e]">{timeLeftMins} mins</p>
              </div>

              <div className="bg-[#f8f9fc] p-3.5 rounded-2xl border border-[#e1e2e5]">
                <div className="flex items-center gap-1.5 text-xs text-[#797586] mb-1">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  <span>Device Battery</span>
                </div>
                <p className="text-xl font-extrabold text-[#191c1e]">85%</p>
              </div>
            </div>

            {/* Trusted Contacts In-Loop */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-[#191c1e] mb-2">Contacts In-Loop</p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#532dcf] text-white font-bold text-xs flex items-center justify-center border-2 border-white">
                    S
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#008a00] text-white font-bold text-xs flex items-center justify-center border-2 border-white">
                    D
                  </div>
                </div>
                <span className="text-xs text-[#797586]">Receiving real-time GPS updates</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button: SAFE ARRIVAL */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm space-y-3">
            <button
              onClick={handleSafeArrival}
              disabled={completing}
              className="w-full bg-[#008a00] hover:bg-[#006e00] text-white font-extrabold py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 text-base active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-6 h-6" />
              <span>{completing ? 'Confirming Arrival...' : "I'VE ARRIVED SAFELY"}</span>
            </button>

            <button
              onClick={onTriggerSafetyCheck}
              className="w-full bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] font-semibold py-2.5 rounded-xl transition-all text-xs text-center"
            >
              Test Check-In Alert Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
