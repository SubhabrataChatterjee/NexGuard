/**
 * Geolocation & Emergency Helpline Utilities for NexGuard
 * Supports HTML5 Geolocation, OpenStreetMap Nominatim Reverse Geocoding & India/WB Emergency Helplines
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  accuracyMeters?: number;
}

export interface EmergencyHelpline {
  code: string;
  label: string;
  category: 'ALL' | 'POLICE' | 'WOMEN' | 'MEDICAL' | 'FIRE';
  phone: string;
  description: string;
}

// India & West Bengal Emergency Helplines
export class EmergencyNumbers {
  static INDIA_NATIONAL_EMERGENCY = {
    code: '112',
    label: '112 - National Emergency Response (India)',
    category: 'ALL' as const,
    phone: '112',
    description: 'Single emergency helpline for Police, Medical & Fire services across India.',
  };

  static WOMEN_HELPLINE_INDIA = {
    code: '1091',
    label: '1091 - Women Helpline (India / West Bengal)',
    category: 'WOMEN' as const,
    phone: '1091',
    description: '24/7 Toll-Free Women Safety Helpline across West Bengal & India.',
  };

  static POLICE_CONTROL_ROOM = {
    code: '100',
    label: '100 - Police Control Room',
    category: 'POLICE' as const,
    phone: '100',
    description: 'Direct Police assistance control room.',
  };

  static AMBULANCE_MEDICAL = {
    code: '108',
    label: '108 / 102 - Emergency Medical Ambulance',
    category: 'MEDICAL' as const,
    phone: '108',
    description: '24/7 Emergency Ambulance service in West Bengal & India.',
  };

  static FIRE_AND_RESCUE = {
    code: '101',
    label: '101 - Fire & Rescue Services',
    category: 'FIRE' as const,
    phone: '101',
    description: 'West Bengal Fire & Emergency Services.',
  };

  static US_INTERNATIONAL = {
    code: '911',
    label: '911 - US / International Emergency',
    category: 'ALL' as const,
    phone: '911',
    description: 'Emergency helpline for USA / Canada.',
  };
}

export const EMERGENCY_HELPLINES: EmergencyHelpline[] = [
  EmergencyNumbers.INDIA_NATIONAL_EMERGENCY,
  EmergencyNumbers.WOMEN_HELPLINE_INDIA,
  EmergencyNumbers.POLICE_CONTROL_ROOM,
  EmergencyNumbers.AMBULANCE_MEDICAL,
  EmergencyNumbers.FIRE_AND_RESCUE,
];

// Kolkata, West Bengal fallback if browser GPS is unavailable or blocked
const DEFAULT_WB_LOCATION: LocationData = {
  latitude: 22.5726,
  longitude: 88.3639,
  address: 'Kolkata, West Bengal, India',
  city: 'Kolkata',
  state: 'West Bengal',
  country: 'India',
};

/**
 * Get current browser GPS location with high accuracy
 */
export async function getCurrentGPSPosition(): Promise<LocationData> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser. Using Kolkata, West Bengal default.');
      resolve(DEFAULT_WB_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        try {
          const addressData = await reverseGeocode(lat, lng);
          resolve({
            latitude: lat,
            longitude: lng,
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
            accuracyMeters: Math.round(accuracy),
          });
        } catch {
          resolve({
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            accuracyMeters: Math.round(accuracy),
          });
        }
      },
      (error) => {
        console.warn('Geolocation position error:', error.message);
        resolve(DEFAULT_WB_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Reverse Geocoding using OpenStreetMap Nominatim API
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; city?: string; state?: string; country?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'NexGuardSafetyApp/1.0',
        },
      }
    );

    if (!res.ok) throw new Error('Geocoding response error');
    const data = await res.json();

    const addr = data.address || {};
    const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
    const city = addr.city || addr.town || addr.village || addr.subdistrict || addr.county || '';
    const state = addr.state || '';
    const country = addr.country || '';
    const postcode = addr.postcode || '';

    const formattedParts = [road, city, state, postcode, country].filter(Boolean);
    const fullAddress = formattedParts.length > 0 ? formattedParts.join(', ') : data.display_name;

    return {
      address: fullAddress || 'Detected GPS Location',
      city,
      state,
      country,
    };
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return {
      address: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    };
  }
}

/**
 * Search locations using OpenStreetMap Nominatim
 */
export async function searchLocations(query: string): Promise<
  Array<{ name: string; lat: number; lng: number; fullAddress: string }>
> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'NexGuardSafetyApp/1.0',
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      fullAddress: item.display_name,
    }));
  } catch (err) {
    console.error('Search location error:', err);
    return [];
  }
}

/**
 * Calculate distance between two coordinates in kilometers or miles
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
