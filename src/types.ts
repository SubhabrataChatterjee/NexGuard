/**
 * NexGuard Shared Type Definitions
 */

export type UserRole = 'USER' | 'SAFETY_OPERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  location_sharing_enabled: boolean;
  route_monitoring_enabled: boolean;
  arrival_check_enabled: boolean;
  default_grace_period_minutes: number;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustedContactPermissions {
  sos_alerts: boolean;
  late_arrival_alerts: boolean;
  location_sharing: boolean;
}

export interface TrustedContact {
  id: string;
  owner_user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  permissions: TrustedContactPermissions;
  created_at: string;
  updated_at: string;
}

export type JourneyStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'CHECKING_IN'
  | 'SAFE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ESCALATED'
  | 'SOS_ACTIVE';

export interface Journey {
  id: string;
  user_id: string;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
  start_location_name: string;
  start_latitude: number;
  start_longitude: number;
  started_at: string;
  expected_arrival_at: string;
  grace_period_minutes: number;
  actual_arrival_at: string | null;
  status: JourneyStatus;
  trusted_contact_ids: string[];
  monitoring_enabled: boolean;
  route_monitoring_enabled: boolean;
  arrival_check_enabled: boolean;
  safety_score?: number;
  created_at: string;
  updated_at: string;
}

export interface LocationPoint {
  id: string;
  journey_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  speed_mps?: number;
  heading_degrees?: number;
  battery_percent?: number;
  recorded_at: string;
}

export type SafetyCheckTrigger = 'ARRIVAL_TIME' | 'ROUTE_DEVIATION' | 'MANUAL' | 'SYSTEM';
export type SafetyCheckStatus = 'PENDING' | 'RESPONDED_SAFE' | 'NEED_HELP' | 'EXPIRED' | 'CANCELLED';

export interface SafetyCheck {
  id: string;
  journey_id: string;
  user_id: string;
  trigger_type: SafetyCheckTrigger;
  status: SafetyCheckStatus;
  requested_at: string;
  responded_at: string | null;
  expires_at: string;
}

export type SosTrigger = 'MANUAL_SOS' | 'SAFETY_CHECK_HELP' | 'AUTOMATED';
export type SosStatus = 'ACTIVE' | 'CANCELLED' | 'RESOLVED' | 'ESCALATED';

export interface SosEvent {
  id: string;
  user_id: string;
  journey_id: string | null;
  trigger_type: SosTrigger;
  status: SosStatus;
  activated_at: string;
  resolved_at: string | null;
  latitude: number;
  longitude: number;
  location_name?: string;
  battery_percent: number;
  resolution_reason?: string;
  notified_contacts: { id: string; name: string; phone: string; status: 'QUEUED' | 'SENT' | 'DELIVERED' }[];
  created_at: string;
  updated_at: string;
}

export type ResourceType = 'POLICE' | 'HOSPITAL' | 'EMERGENCY_DEPARTMENT' | 'FIRE_STATION' | 'SAFE_PUBLIC_LOCATION';

export interface EmergencyResource {
  id: string;
  name: string;
  type: ResourceType;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  is_verified: boolean;
  distance_miles?: number;
  distance_km?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'JOURNEY_STARTED' | 'JOURNEY_COMPLETED' | 'SAFETY_CHECK' | 'ROUTE_DEVIATION' | 'SOS' | 'SYSTEM';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  settings: UserSettings;
}
