import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  PhoneCall,
  CheckCircle,
  Navigation,
  Search,
  Cross,
  Flame,
  HeartHandshake,
  LocateFixed,
  RefreshCw,
  Phone,
  Radio,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { EmergencyResource, ResourceType } from '../types';
import { getCurrentGPSPosition, LocationData } from '../utils/location';

export const EmergencyResourcesView: React.FC = () => {
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [currentLoc, setCurrentLoc] = useState<LocationData | null>(null);

  // Fetch user location and resources on load
  useEffect(() => {
    fetchLiveLocationAndResources();
  }, []);

  // Re-fetch resources when selected category changes
  useEffect(() => {
    fetchResources(currentLoc?.latitude, currentLoc?.longitude);
  }, [selectedType]);

  const fetchLiveLocationAndResources = async () => {
    setLocationLoading(true);
    try {
      const loc = await getCurrentGPSPosition();
      setCurrentLoc(loc);
      await fetchResources(loc.latitude, loc.longitude);
    } catch (err) {
      console.error('Error getting location:', err);
      await fetchResources();
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchResources = async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const data = await api.getEmergencyResources(selectedType, lat, lng);
      setResources(data);
    } catch (err) {
      console.error('Error loading emergency resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    await fetchLiveLocationAndResources();
  };

  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'ALL', label: 'All Stations', icon: Building2 },
    { id: 'POLICE', label: 'Police Stations', icon: Shield },
    { id: 'HOSPITAL', label: 'Hospitals & ER', icon: Cross },
    { id: 'FIRE_STATION', label: 'Fire & Rescue', icon: Flame },
    { id: 'SAFE_PUBLIC_LOCATION', label: 'Women & Safe Havens', icon: HeartHandshake },
  ];

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'POLICE':
        return <Shield className="w-6 h-6 text-indigo-600" />;
      case 'HOSPITAL':
      case 'EMERGENCY_DEPARTMENT':
        return <Cross className="w-6 h-6 text-red-600" />;
      case 'FIRE_STATION':
        return <Flame className="w-6 h-6 text-amber-600" />;
      case 'SAFE_PUBLIC_LOCATION':
        return <HeartHandshake className="w-6 h-6 text-purple-600" />;
      default:
        return <Building2 className="w-6 h-6 text-indigo-600" />;
    }
  };

  const quickHelplines = [
    { label: '112 National Emergency', phone: '112', color: 'bg-red-600 text-white hover:bg-red-700' },
    { label: '1091 Women Safety HQ', phone: '1091', color: 'bg-purple-600 text-white hover:bg-purple-700' },
    { label: '100 Police Control', phone: '100', color: 'bg-blue-600 text-white hover:bg-blue-700' },
    { label: '108 Medical Ambulance', phone: '108', color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
    { label: '101 Fire Department', phone: '101', color: 'bg-amber-600 text-white hover:bg-amber-700' },
    { label: '1098 Child Helpline', phone: '1098', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
  ];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <Radio className="w-4 h-4 animate-pulse" /> Live Regional Emergency Directory
        </div>
        <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mt-1">
          Emergency Stations & Resources
        </h1>
        <p className="text-sm text-[#51505f] mt-1">
          Verified 24/7 Police Stations, Trauma Centers, Fire Departments & Women Helplines localized to your exact GPS coordinates in India & West Bengal.
        </p>
      </div>

      {/* Live GPS Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-indigo-300">
            <LocateFixed className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wider flex items-center gap-2">
              <span>Your Live Device Location</span>
              {locationLoading && <span className="text-[10px] bg-indigo-500/40 px-2 py-0.5 rounded-full text-white">Updating GPS...</span>}
            </div>
            <p className="text-base font-bold text-white mt-0.5">
              {currentLoc?.address || 'Detecting your coordinates in West Bengal / India...'}
            </p>
            {currentLoc && (
              <p className="text-xs text-indigo-200 mt-0.5">
                GPS: {currentLoc.latitude.toFixed(4)}° N, {currentLoc.longitude.toFixed(4)}° E
                {currentLoc.accuracyMeters && ` (±${currentLoc.accuracyMeters}m accuracy)`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRefreshLocation}
          disabled={locationLoading}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shrink-0 border border-white/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
          <span>Update GPS & Distances</span>
        </button>
      </div>

      {/* Quick 24/7 Dial Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#e1e2e5] shadow-sm space-y-3">
        <div className="text-xs font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-red-600" />
          <span>Instant 24/7 Helpline Hotlines (Toll-Free Direct Dial)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickHelplines.map((hp) => (
            <a
              key={hp.phone}
              href={`tel:${hp.phone}`}
              className={`px-3 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all shadow-sm ${hp.color}`}
            >
              <span>{hp.label}</span>
              <PhoneCall className="w-3.5 h-3.5 shrink-0 ml-1" />
            </a>
          ))}
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#e1e2e5] shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#532dcf] text-white shadow-sm'
                    : 'bg-[#f2f3f6] text-[#484555] hover:bg-[#e1e2e5]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#797586]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by area, station name, or city..."
            className="w-full bg-[#f2f3f6] pl-9 pr-4 py-2.5 rounded-2xl text-xs text-[#191c1e] outline-none focus:bg-white focus:border-[#532dcf] border border-transparent transition-all"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#532dcf] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#191c1e]">Calculating nearest stations from your GPS coordinates...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((resource, index) => {
            const phoneNumbers = resource.phone.split('/').map((p) => p.trim());
            const isNearest = index === 0 && currentLoc && resource.distance_km !== undefined && resource.distance_km < 100;

            return (
              <div
                key={resource.id}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isNearest ? 'border-emerald-500 shadow-emerald-50/50 ring-1 ring-emerald-500/30' : 'border-[#e1e2e5] shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#f0ecff] flex items-center justify-center shrink-0">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-[#191c1e]">{resource.name}</h3>
                          {resource.is_verified && (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 text-green-700" /> VERIFIED
                            </span>
                          )}
                          {isNearest && (
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                              ⭐ NEAREST STATION
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#51505f] mt-1 leading-relaxed">{resource.address}</p>
                      </div>
                    </div>
                  </div>

                  {resource.distance_km !== undefined && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#532dcf] bg-[#f0ecff] px-3 py-1.5 rounded-xl w-fit">
                      <MapPin className="w-3.5 h-3.5 text-[#532dcf]" />
                      <span>{resource.distance_km} km away from your location</span>
                    </div>
                  )}
                </div>

                {/* Call buttons for each helpline number */}
                <div className="pt-4 border-t border-[#f2f3f6] space-y-2">
                  <div className="text-[11px] font-semibold text-[#797586] uppercase tracking-wider">
                    Emergency Direct Phone Numbers:
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {phoneNumbers.map((num, idx) => {
                      const cleanNum = num.replace(/[^0-9+]/g, '');
                      return (
                        <a
                          key={idx}
                          href={`tel:${cleanNum}`}
                          className="bg-[#532dcf] hover:bg-[#4321bd] text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call {num}</span>
                        </a>
                      );
                    })}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#f2f3f6] hover:bg-[#e1e2e5] text-[#191c1e] font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#532dcf]" />
                      <span>Map Directions</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] text-center space-y-2">
          <p className="text-base font-bold text-[#191c1e]">No matching emergency stations found</p>
          <p className="text-xs text-[#797586]">
            Try adjusting your search query or selecting "All Stations" category.
          </p>
        </div>
      )}
    </div>
  );
};
