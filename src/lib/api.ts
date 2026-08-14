import {
  User,
  UserSettings,
  TrustedContact,
  Journey,
  LocationPoint,
  SafetyCheck,
  SosEvent,
  EmergencyResource,
  NotificationItem,
  AuditLog,
  AuthResponse,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('nexguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string; phone?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async login(data: { email: string; password: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async verifyEmail(data: {
  email: string;
  code: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(res);
},

  async resendVerificationCode(
  email: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse<{ message: string }>(res);
},

  async getMe(): Promise<{ user: User; settings: UserSettings }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    localStorage.removeItem('nexguard_token');
  },

  // User Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/user-settings`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/user-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Trusted Contacts
  async getTrustedContacts(): Promise<TrustedContact[]> {
    const res = await fetch(`${API_BASE}/trusted-contacts`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async addTrustedContact(data: {
    name: string;
    relationship: string;
    phone?: string;
    email?: string;
    permissions?: TrustedContact['permissions'];
  }): Promise<TrustedContact> {
    const res = await fetch(`${API_BASE}/trusted-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateTrustedContact(id: string, data: Partial<TrustedContact>): Promise<TrustedContact> {
    const res = await fetch(`${API_BASE}/trusted-contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteTrustedContact(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/trusted-contacts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    await handleResponse(res);
  },

  // Journeys
  async getJourneys(): Promise<Journey[]> {
    const res = await fetch(`${API_BASE}/journeys`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getActiveJourney(): Promise<Journey | null> {
    const res = await fetch(`${API_BASE}/journeys/active`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createJourney(data: {
    destination_name: string;
    destination_latitude?: number;
    destination_longitude?: number;
    start_location_name?: string;
    expected_arrival_minutes?: number;
    grace_period_minutes?: number;
    trusted_contact_ids?: string[];
    monitoring_enabled?: boolean;
    route_monitoring_enabled?: boolean;
    arrival_check_enabled?: boolean;
  }): Promise<Journey> {
    const res = await fetch(`${API_BASE}/journeys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async completeJourney(id: string): Promise<Journey> {
    const res = await fetch(`${API_BASE}/journeys/${id}/complete`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async cancelJourney(id: string): Promise<Journey> {
    const res = await fetch(`${API_BASE}/journeys/${id}/cancel`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Location
  async updateLocation(journeyId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
    speed_mps?: number;
    heading_degrees?: number;
    battery_percent?: number;
  }): Promise<LocationPoint> {
    const res = await fetch(`${API_BASE}/journeys/${journeyId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(locationData),
    });
    return handleResponse(res);
  },

  // Safety Check
  async triggerSafetyCheck(journeyId: string, trigger_type = 'MANUAL'): Promise<SafetyCheck> {
    const res = await fetch(`${API_BASE}/journeys/${journeyId}/safety-check/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ trigger_type }),
    });
    return handleResponse(res);
  },

  async respondSafetyCheck(journeyId: string, response_type: 'SAFE' | 'NEED_HELP'): Promise<{ status: string; sosEvent?: SosEvent; journey?: Journey }> {
    const res = await fetch(`${API_BASE}/journeys/${journeyId}/safety-check/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ response_type }),
    });
    return handleResponse(res);
  },

  // SOS
  async getActiveSos(): Promise<SosEvent | null> {
    const res = await fetch(`${API_BASE}/sos/active`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async triggerSos(data: {
    latitude?: number;
    longitude?: number;
    location_name?: string;
    battery_percent?: number;
  }): Promise<SosEvent> {
    const res = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async cancelSos(id: string, resolution_reason?: string): Promise<SosEvent> {
    const res = await fetch(`${API_BASE}/sos/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ resolution_reason }),
    });
    return handleResponse(res);
  },

  // Emergency Resources
  async getEmergencyResources(type?: string, lat?: number, lng?: number): Promise<EmergencyResource[]> {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (lat !== undefined && lat !== null) params.append('lat', String(lat));
    if (lng !== undefined && lng !== null) params.append('lng', String(lng));
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/emergency-resources?${queryString}` : `${API_BASE}/emergency-resources`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
  },

  // Assistant
  async askAssistant(message: string, context?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ message, context }),
    });
    const data = await handleResponse<{ response: string }>(res);
    return data.response;
  },

  // Admin
  async getAdminStats(): Promise<{
    total_users: number;
    active_journeys: number;
    active_sos_alerts: number;
    verified_resources: number;
    total_contacts: number;
  }> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};
