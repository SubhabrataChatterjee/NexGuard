import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Shield, X, ArrowRight, AlertCircle, Search, LocateFixed } from 'lucide-react';
import { TrustedContact } from '../types';
import { searchLocations, getCurrentGPSPosition, LocationData } from '../utils/location';

interface StartJourneyModalProps {
  trustedContacts: TrustedContact[];
  onStart: (journeyData: {
    destination_name: string;
    expected_arrival_minutes: number;
    grace_period_minutes: number;
    trusted_contact_ids: string[];
    start_latitude?: number;
    start_longitude?: number;
    destination_latitude?: number;
    destination_longitude?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export const StartJourneyModal: React.FC<StartJourneyModalProps> = ({
  trustedContacts,
  onStart,
  onClose,
}) => {
  const [destinationName, setDestinationName] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; fullAddress: string }>>([]);
  const [selectedDestCoords, setSelectedDestCoords] = useState<{ lat?: number; lng?: number }>({});
  const [isSearching, setIsSearching] = useState(false);

  const [durationMins, setDurationMins] = useState(20);
  const [gracePeriodMins, setGracePeriodMins] = useState(10);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    trustedContacts.map((c) => c.id)
  );

  const [currentLoc, setCurrentLoc] = useState<LocationData | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current device GPS location on modal mount
  useEffect(() => {
    const fetchLoc = async () => {
      setLocating(true);
      try {
        const pos = await getCurrentGPSPosition();
        setCurrentLoc(pos);
      } catch (err) {
        console.warn('GPS error in StartJourneyModal:', err);
      } finally {
        setLocating(false);
      }
    };
    fetchLoc();
  }, []);

  // Handle live destination location search
  useEffect(() => {
    if (!destinationName || destinationName.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(destinationName);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [destinationName]);

  const handleToggleContact = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter((cId) => cId !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number; fullAddress: string }) => {
    setDestinationName(res.fullAddress || res.name);
    setSelectedDestCoords({ lat: res.lat, lng: res.lng });
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationName.trim()) {
      setError('Please enter a destination name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onStart({
        destination_name: destinationName,
        expected_arrival_minutes: durationMins,
        grace_period_minutes: gracePeriodMins,
        trusted_contact_ids: selectedContactIds,
        start_latitude: currentLoc?.latitude || 22.5726,
        start_longitude: currentLoc?.longitude || 88.3639,
        destination_latitude: selectedDestCoords.lat || 22.5802,
        destination_longitude: selectedDestCoords.lng || 88.4370,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start journey.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#532dcf] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <Shield className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Start Safe Journey</h2>
              <p className="text-xs text-[#eee7ff]">Live GPS Location Sharing & Check-In Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Location GPS Badge */}
          <div className="p-3 bg-[#f0ecff] border border-[#c9c4d7] rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#532dcf] font-bold">
              <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>Start Location: {currentLoc ? currentLoc.address : 'Kolkata, West Bengal, India'}</span>
            </div>
            <span className="text-[10px] text-[#532dcf] font-bold bg-white px-2 py-0.5 rounded-full border">
              GPS Verified
            </span>
          </div>

          {/* Destination Search */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1e] mb-1.5">
              Destination Name or Search Address
            </label>
            <div className="relative mb-2">
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#532dcf]" />
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="Search location in Kolkata, West Bengal or India..."
                required
                className="w-full bg-[#f2f3f6] pl-10 pr-10 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e] font-medium"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#532dcf]">
                  <Search className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Nominatim Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[72px] z-20 bg-white border border-[#e1e2e5] rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[#f2f3f6]">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-3 hover:bg-[#f0ecff] transition-colors flex items-start gap-2.5 text-xs text-[#191c1e]"
                  >
                    <MapPin className="w-4 h-4 text-[#532dcf] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{res.name}</p>
                      <p className="text-[11px] text-[#797586] line-clamp-1">{res.fullAddress}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Destination Chips for West Bengal */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-[#797586] self-center mr-1">Popular in West Bengal:</span>
              {[
                'Salt Lake Sector V, Kolkata',
                'Howrah Railway Station',
                'SSKM Hospital Kolkata',
                'Park Street Kolkata',
                'Kolkata Airport (CCU)',
                'Siliguri Town',
              ].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setDestinationName(loc);
                    setSearchResults([]);
                  }}
                  className="text-[11px] bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] font-semibold px-2.5 py-1 rounded-lg border border-[#e1e2e5] transition-colors"
                >
                  + {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Grace Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1e] mb-1.5">
                Expected Travel Time
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full bg-[#f2f3f6] pl-10 pr-3 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e] font-medium appearance-none"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191c1e] mb-1.5">
                Check-in Grace Period
              </label>
              <select
                value={gracePeriodMins}
                onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                className="w-full bg-[#f2f3f6] px-3 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e] font-medium"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>
          </div>

          {/* Trusted Contacts Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">
                Notify Trusted Contacts
              </label>
              <span className="text-xs text-[#797586]">{selectedContactIds.length} Selected</span>
            </div>

            {trustedContacts.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {trustedContacts.map((contact) => {
                  const isChecked = selectedContactIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleToggleContact(contact.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked ? 'bg-[#f0ecff] border-[#532dcf]' : 'bg-[#f8f9fc] border-[#e1e2e5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#532dcf]" />
                        <div>
                          <p className="text-xs font-bold text-[#191c1e]">{contact.name}</p>
                          <p className="text-[11px] text-[#797586]">{contact.relationship} • {contact.phone}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="rounded text-[#532dcf] focus:ring-[#532dcf]"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#797586] italic bg-[#f2f3f6] p-3 rounded-xl">
                No trusted contacts added yet. You can add them in the Contacts tab.
              </p>
            )}
          </div>

          <div className="bg-[#f0ecff] p-3.5 rounded-2xl text-xs text-[#1c0062] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#532dcf] shrink-0" />
            <span>
              Your real-time location will be shared <strong>only</strong> while this journey is active. Location sharing automatically terminates upon safe arrival.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#532dcf] hover:bg-[#481cc4] text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <span>{loading ? 'Starting Journey...' : 'CONFIRM & START SAFE JOURNEY'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
