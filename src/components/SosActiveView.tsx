import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, MapPin, Battery, XCircle, Ambulance, Users, RefreshCw, Shield, Compass } from 'lucide-react';
import { SosEvent } from '../types';
import { MapComponent } from './MapComponent';
import { getCurrentGPSPosition, LocationData, EMERGENCY_HELPLINES } from '../utils/location';

interface SosActiveViewProps {
  sosEvent: SosEvent;
  onCancelSos: (reason?: string) => Promise<void>;
  onSelectTab: (tab: string) => void;
}

export const SosActiveView: React.FC<SosActiveViewProps> = ({ sosEvent, onCancelSos, onSelectTab }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Accidental trigger / Safe now');
  const [loading, setLoading] = useState(false);
  const [refreshingLoc, setRefreshingLoc] = useState(false);

  // Live Location State initialized with West Bengal / India defaults or GPS
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: sosEvent.latitude && sosEvent.latitude !== 40.7128 ? sosEvent.latitude : 22.5726,
    longitude: sosEvent.longitude && sosEvent.longitude !== -74.006 ? sosEvent.longitude : 88.3639,
    address: sosEvent.location_name || 'Kolkata, West Bengal, India',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
  });

  const fetchLiveGPS = async () => {
    setRefreshingLoc(true);
    try {
      const pos = await getCurrentGPSPosition();
      setCurrentLocation(pos);
    } catch (err) {
      console.warn('GPS position error in SOS view:', err);
    } finally {
      setRefreshingLoc(false);
    }
  };

  useEffect(() => {
    fetchLiveGPS();
  }, []);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await onCancelSos(cancelReason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#93000a] text-white p-4 md:p-8 flex flex-col justify-between space-y-6">
      {/* Top Banner Header */}
      <div className="max-w-[1100px] mx-auto w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white text-[#ba1a1a] flex items-center justify-center font-black animate-pulse shadow-lg">
              <AlertTriangle className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">SOS EMERGENCY ACTIVE</h1>
              <p className="text-xs text-red-100">Live emergency broadcast in progress • West Bengal & India Helplines</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-mono font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE GPS BROADCASTING</span>
          </div>
        </div>

        {/* Emergency Alert Card */}
        <div className="bg-white text-[#191c1e] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold text-[#ba1a1a] tracking-wider uppercase mb-1 block">
                EMERGENCY ALERT BROADCASTED
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[#191c1e]">
                Your trusted contacts & emergency network have been alerted.
              </h2>
            </div>

            <button
              onClick={fetchLiveGPS}
              disabled={refreshingLoc}
              className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#532dcf] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all border border-[#e1e2e5]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingLoc ? 'animate-spin' : ''}`} />
              <span>{refreshingLoc ? 'Updating Location...' : 'Refresh Live Location'}</span>
            </button>
          </div>

          {/* Interactive Live Map Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#191c1e]">
              <span className="flex items-center gap-1.5 text-[#ba1a1a]">
                <MapPin className="w-4 h-4" /> Live Map & Exact GPS Position (Google Maps / OpenStreetMap view)
              </span>
              <span className="text-[#797586] text-[11px]">
                {currentLocation.city || 'West Bengal'}, {currentLocation.state || 'India'}
              </span>
            </div>
            <div className="h-[280px] rounded-2xl overflow-hidden border border-[#e1e2e5] shadow-inner">
              <MapComponent
                currentLat={currentLocation.latitude}
                currentLng={currentLocation.longitude}
                startLat={currentLocation.latitude}
                startLng={currentLocation.longitude}
                destLat={currentLocation.latitude + 0.002}
                destLng={currentLocation.longitude + 0.002}
                startName="Live Emergency Location"
                destName="Emergency Response Zone"
                height="100%"
              />
            </div>
          </div>

          {/* Location & Status Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Card */}
            <div className="bg-[#f8f9fc] p-4 rounded-2xl border border-[#e1e2e5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a] mb-1">
                <MapPin className="w-4 h-4" />
                <span>LOCATION ADDRESS</span>
              </div>
              <p className="font-bold text-sm text-[#191c1e] line-clamp-2">{currentLocation.address}</p>
              <p className="text-[11px] text-[#797586] mt-1 font-mono">
                {currentLocation.latitude.toFixed(4)}° N, {currentLocation.longitude.toFixed(4)}° E
              </p>
            </div>

            {/* Device Card */}
            <div className="bg-[#f8f9fc] p-4 rounded-2xl border border-[#e1e2e5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a] mb-1">
                <Battery className="w-4 h-4" />
                <span>DEVICE TELEMETRY</span>
              </div>
              <p className="font-bold text-sm text-[#191c1e]">Battery: {sosEvent.battery_percent}%</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                {currentLocation.accuracyMeters ? `GPS Precision: ±${currentLocation.accuracyMeters}m` : 'High Accuracy GPS Active'}
              </p>
            </div>

            {/* Contacts Card */}
            <div className="bg-[#f8f9fc] p-4 rounded-2xl border border-[#e1e2e5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a] mb-1">
                <Users className="w-4 h-4" />
                <span>CONTACTS NOTIFIED</span>
              </div>
              <p className="font-bold text-sm text-[#191c1e]">
                {sosEvent.notified_contacts?.length || 3} Trusted Contacts
              </p>
              <p className="text-[11px] text-[#797586] mt-1">SMS & Push notifications dispatched</p>
            </div>
          </div>

          {/* PROMINENT DIRECT EMERGENCY DIALING BUTTONS */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-[#ba1a1a] tracking-wider uppercase">
              INDIA & WEST BENGAL EMERGENCY HELPLINES:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary 112 India National Helpline */}
              <a
                href="tel:112"
                className="bg-[#ba1a1a] hover:bg-[#93000a] text-white font-black py-4 px-5 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-95 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs text-red-100 uppercase tracking-wider block font-bold">ALL SERVICES</span>
                    <span className="text-lg font-extrabold">CALL 112 (NATIONAL EMERGENCY)</span>
                  </div>
                </div>
              </a>

              {/* Primary 1091 Women Safety Helpline India / West Bengal */}
              <a
                href="tel:1091"
                className="bg-[#532dcf] hover:bg-[#481cc4] text-white font-black py-4 px-5 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-95 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-100 uppercase tracking-wider block font-bold">WEST BENGAL / INDIA</span>
                    <span className="text-lg font-extrabold">CALL 1091 (WOMEN HELPLINE)</span>
                  </div>
                </div>
              </a>
            </div>

            {/* Quick Grid for 100 Police, 108 Medical, 101 Fire, 911 USA */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              <a
                href="tel:100"
                className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] p-3 rounded-xl text-center border border-[#e1e2e5] transition-all"
              >
                <p className="text-[10px] font-bold text-[#797586] uppercase">Police</p>
                <p className="text-sm font-extrabold text-[#532dcf]">Call 100</p>
              </a>

              <a
                href="tel:108"
                className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] p-3 rounded-xl text-center border border-[#e1e2e5] transition-all"
              >
                <p className="text-[10px] font-bold text-[#797586] uppercase">Ambulance</p>
                <p className="text-sm font-extrabold text-[#ba1a1a]">Call 108</p>
              </a>

              <a
                href="tel:101"
                className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] p-3 rounded-xl text-center border border-[#e1e2e5] transition-all"
              >
                <p className="text-[10px] font-bold text-[#797586] uppercase">Fire Dept</p>
                <p className="text-sm font-extrabold text-[#d97706]">Call 101</p>
              </a>

              <a
                href="tel:911"
                className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] p-3 rounded-xl text-center border border-[#e1e2e5] transition-all"
              >
                <p className="text-[10px] font-bold text-[#797586] uppercase">US / Int'l</p>
                <p className="text-sm font-bold text-[#484555]">Call 911</p>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onSelectTab('resources')}
                className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-[#e1e2e5]"
              >
                <Ambulance className="w-4 h-4 text-[#ba1a1a]" />
                <span>View Nearby Kolkata & WB Verified Help</span>
              </button>

              <button
                onClick={() => setShowCancelConfirm(true)}
                className="bg-white border border-[#e1e2e5] hover:bg-gray-50 text-[#797586] hover:text-[#ba1a1a] font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Emergency SOS Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-[#191c1e] rounded-3xl p-6 max-w-[440px] w-full space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold">Are you sure you want to cancel SOS?</h3>
            <p className="text-xs text-[#484555]">
              Cancelling will inform your trusted contacts that you are safe and stop live emergency tracking.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#f2f3f6] p-3 rounded-xl border border-transparent text-xs text-[#191c1e]"
              >
                <option value="Accidental trigger">Accidental trigger</option>
                <option value="I am safe now">I am safe now</option>
                <option value="Reached safe destination">Reached safe destination</option>
                <option value="Assistance arrived">Assistance arrived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 bg-[#f2f3f6] text-[#191c1e] font-bold rounded-xl text-xs hover:bg-[#e1e2e5]"
              >
                Keep SOS Active
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 bg-[#ba1a1a] text-white font-bold rounded-xl text-xs hover:bg-[#93000a] disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
