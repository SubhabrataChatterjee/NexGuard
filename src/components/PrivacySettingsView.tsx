import React, { useState } from 'react';
import { Lock, Shield, MapPin, Bell, User as UserIcon, CheckCircle2, Save } from 'lucide-react';
import { api } from '../lib/api';
import { User, UserSettings } from '../types';

interface PrivacySettingsViewProps {
  user: User | null;
  settings: UserSettings | null;
  onRefresh: () => Promise<void>;
}

export const PrivacySettingsView: React.FC<PrivacySettingsViewProps> = ({
  user,
  settings,
  onRefresh,
}) => {
  const [locationSharing, setLocationSharing] = useState(settings?.location_sharing_enabled ?? true);
  const [routeMonitoring, setRouteMonitoring] = useState(settings?.route_monitoring_enabled ?? true);
  const [arrivalCheck, setArrivalCheck] = useState(settings?.arrival_check_enabled ?? true);
  const [defaultGrace, setDefaultGrace] = useState(settings?.default_grace_period_minutes ?? 10);
  const [notifications, setNotifications] = useState(settings?.notification_enabled ?? true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings({
        location_sharing_enabled: locationSharing,
        route_monitoring_enabled: routeMonitoring,
        arrival_check_enabled: arrivalCheck,
        default_grace_period_minutes: defaultGrace,
        notification_enabled: notifications,
      });
      await onRefresh();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Privacy Center & Settings</h1>
        <p className="text-sm text-[#51505f] mt-1">
          Manage your safety preferences, temporary location sharing parameters, and account profile.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span>Your privacy and safety settings have been updated.</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#532dcf] text-white font-bold text-xl flex items-center justify-center shrink-0">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#191c1e]">{user?.full_name || 'Alex Johnson'}</h2>
          <p className="text-xs text-[#797586]">{user?.email}</p>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-[#532dcf] bg-[#f0ecff] px-2.5 py-0.5 rounded-full">
            {user?.role} ACCOUNT VERIFIED
          </span>
        </div>
      </div>

      {/* Safety & Location Toggles */}
      <div className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-[#e1e2e5] pb-4">
          <Lock className="w-6 h-6 text-[#532dcf]" />
          <div>
            <h3 className="font-bold text-base text-[#191c1e]">Location & Monitoring Defaults</h3>
            <p className="text-xs text-[#797586]">You retain absolute authority over when location data is shared.</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5]">
            <div>
              <p className="font-semibold text-[#191c1e]">Enable Journey Location Sharing</p>
              <p className="text-xs text-[#797586]">Allows trusted contacts to view your progress only while trips are active.</p>
            </div>
            <button
              onClick={() => setLocationSharing(!locationSharing)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                locationSharing ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  locationSharing ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5]">
            <div>
              <p className="font-semibold text-[#191c1e]">Automated Route Monitoring</p>
              <p className="text-xs text-[#797586]">Flags unexpected stops or major route deviations during late night journeys.</p>
            </div>
            <button
              onClick={() => setRouteMonitoring(!routeMonitoring)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                routeMonitoring ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  routeMonitoring ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5]">
            <div>
              <p className="font-semibold text-[#191c1e]">Arrival Check-In Reminders</p>
              <p className="text-xs text-[#797586]">Triggers a grace period prompt if your estimated arrival time elapses.</p>
            </div>
            <button
              onClick={() => setArrivalCheck(!arrivalCheck)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                arrivalCheck ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  arrivalCheck ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Select Grace Period */}
          <div className="p-3 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#191c1e]">Default Check-In Grace Period</p>
              <p className="text-xs text-[#797586]">Time to respond before contacts are alerted.</p>
            </div>
            <select
              value={defaultGrace}
              onChange={(e) => setDefaultGrace(Number(e.target.value))}
              className="bg-white p-2 rounded-xl border border-[#e1e2e5] text-xs font-bold text-[#532dcf]"
            >
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#532dcf] hover:bg-[#481cc4] text-white font-bold py-3 px-6 rounded-xl shadow transition-all text-xs flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};
