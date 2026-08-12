import React, { useState } from 'react';
import { Shield, MapPin, Bell, Users, ArrowRight } from 'lucide-react';

interface OnboardingPermissionsProps {
  onComplete: () => void;
}

export const OnboardingPermissions: React.FC<OnboardingPermissionsProps> = ({ onComplete }) => {
  const [locationAccess, setLocationAccess] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Progress Bar */}
        <div className="h-1 bg-[#e1e2e5] w-full">
          <div className="h-full bg-[#532dcf] w-2/3 transition-all duration-500" />
        </div>

        {/* Header */}
        <div className="pt-8 px-8 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#e6deff] rounded-2xl flex items-center justify-center mb-4 text-[#532dcf]">
            <Shield className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-[#191c1e]">Welcome to NexGuard</h2>
          <p className="text-sm text-[#484555] max-w-md mt-2">
            To keep you safe, we need a few essential permissions. We prioritize your privacy and only use location data during active safety events.
          </p>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
          {/* Location */}
          <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] flex items-start gap-4">
            <div className="p-3 bg-[#e6deff] rounded-xl text-[#532dcf] shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm text-[#191c1e]">Location Access</h3>
                <button
                  type="button"
                  onClick={() => setLocationAccess(!locationAccess)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    locationAccess ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      locationAccess ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#484555]">
                Shared <strong>only</strong> during active journeys or emergency SOS. Essential for sending help to your exact spot.
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] flex items-start gap-4">
            <div className="p-3 bg-[#e6deff] rounded-xl text-[#532dcf] shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm text-[#191c1e]">Notifications</h3>
                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    notifications ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      notifications ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#484555]">
                Used for crucial safety check-ins, late-arrival prompts, and alerts from your trusted contacts.
              </p>
            </div>
          </div>

          {/* Contacts */}
          <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] flex items-start gap-4">
            <div className="p-3 bg-[#e6deff] rounded-xl text-[#532dcf] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm text-[#191c1e]">Trusted Contacts</h3>
                <button
                  type="button"
                  onClick={() => setTrustedContacts(!trustedContacts)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    trustedContacts ? 'bg-[#532dcf]' : 'bg-[#c9c4d7]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      trustedContacts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#484555]">
                Allows us to instantly notify your selected network if an emergency or unconfirmed arrival occurs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-[#e1e2e5] flex flex-col gap-3">
          <button
            onClick={onComplete}
            className="w-full bg-[#532dcf] hover:bg-[#481cc4] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onComplete}
            className="text-xs text-[#797586] hover:text-[#191c1e] text-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
