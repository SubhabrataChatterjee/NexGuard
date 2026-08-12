import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
} from '../types';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexguard_db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'nexguard_db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  verification_codes: Record<string, { code: string; expiresAt: string }>; // email -> { code, expiresAt }
  user_settings: UserSettings[];
  trusted_contacts: TrustedContact[];
  journeys: Journey[];
  location_points: LocationPoint[];
  safety_checks: SafetyCheck[];
  sos_events: SosEvent[];
  emergency_resources: EmergencyResource[];
  notifications: NotificationItem[];
  audit_logs: AuditLog[];
}

function initialSeed(): DatabaseSchema {
  const defaultUserId = 'u-alex-demo-001';
  const defaultAdminId = 'u-admin-demo-001';
  const salt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('Password123!', salt);

  const now = new Date().toISOString();

  const alexUser: User = {
    id: defaultUserId,
    email: 'alex@nexguard.app',
    full_name: 'Alex Johnson',
    phone: '+1 (555) 234-5678',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    role: 'USER',
    status: 'ACTIVE',
    email_verified: true,
    timezone: 'America/New_York',
    created_at: now,
    updated_at: now,
  };

  const adminUser: User = {
    id: defaultAdminId,
    email: 'admin@nexguard.app',
    full_name: 'NexGuard Admin',
    phone: '+1 (555) 999-0000',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    role: 'ADMIN',
    status: 'ACTIVE',
    email_verified: true,
    timezone: 'America/New_York',
    created_at: now,
    updated_at: now,
  };

  const alexSettings: UserSettings = {
    id: 's-alex-001',
    user_id: defaultUserId,
    location_sharing_enabled: true,
    route_monitoring_enabled: true,
    arrival_check_enabled: true,
    default_grace_period_minutes: 10,
    notification_enabled: true,
    created_at: now,
    updated_at: now,
  };

  const contacts: TrustedContact[] = [
    {
      id: 'tc-001',
      owner_user_id: defaultUserId,
      name: 'Sarah Johnson',
      relationship: 'Sister',
      phone: '+1 (555) 123-4567',
      email: 'sarah.j@example.com',
      status: 'ACTIVE',
      permissions: { sos_alerts: true, late_arrival_alerts: true, location_sharing: true },
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tc-002',
      owner_user_id: defaultUserId,
      name: 'David Miller',
      relationship: 'Partner',
      phone: '+1 (555) 987-6543',
      email: 'david.m@example.com',
      status: 'ACTIVE',
      permissions: { sos_alerts: true, late_arrival_alerts: true, location_sharing: true },
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tc-003',
      owner_user_id: defaultUserId,
      name: 'Campus Security Office',
      relationship: 'University Emergency',
      phone: '+1 (555) 333-4444',
      email: 'security@university.edu',
      status: 'ACTIVE',
      permissions: { sos_alerts: true, late_arrival_alerts: false, location_sharing: true },
      created_at: now,
      updated_at: now,
    },
  ];

  const emergencyResources: EmergencyResource[] = [
    {
      id: 'er-001',
      name: 'Lalbazar Police Headquarters & Central Control Room',
      type: 'POLICE',
      address: '18 Lalbazar Street, Bowbazar, Kolkata, West Bengal 700001, India',
      latitude: 22.5714,
      longitude: 88.3582,
      phone: '112 / 100 / 033-22145000',
      is_verified: true,
      distance_km: 0.8,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-002',
      name: 'SSKM Hospital & IPGMER Emergency Trauma Center',
      type: 'HOSPITAL',
      address: '244 AJC Bose Road, Bhowanipore, Kolkata, West Bengal 700020, India',
      latitude: 22.5392,
      longitude: 88.3432,
      phone: '108 / 102 / 033-22231589',
      is_verified: true,
      distance_km: 1.9,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-003',
      name: 'West Bengal Women Safety Control Room & Helpline',
      type: 'SAFE_PUBLIC_LOCATION',
      address: '1091 Women Safety HQ, Salt Lake Sector V, Kolkata, West Bengal 700091',
      latitude: 22.5802,
      longitude: 88.4370,
      phone: '1091 / 181 / 112',
      is_verified: true,
      distance_km: 1.2,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-004',
      name: 'Bidhannagar Police Commissionerate & Salt Lake Sector V PS',
      type: 'POLICE',
      address: 'Sector V, Salt Lake City, Kolkata, West Bengal 700091, India',
      latitude: 22.5790,
      longitude: 88.4340,
      phone: '112 / 100 / 033-23671092',
      is_verified: true,
      distance_km: 1.5,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-005',
      name: 'Park Street Police Station & Women Assistance Cell',
      type: 'POLICE',
      address: '3 Park Street, Kolkata, West Bengal 700016, India',
      latitude: 22.5532,
      longitude: 88.3524,
      phone: '112 / 100 / 033-22268300',
      is_verified: true,
      distance_km: 2.1,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-006',
      name: 'Medical College Hospital Kolkata (MCH ER)',
      type: 'HOSPITAL',
      address: '88 College Street, Bowbazar, Kolkata, West Bengal 700073, India',
      latitude: 22.5746,
      longitude: 88.3629,
      phone: '108 / 033-22414901',
      is_verified: true,
      distance_km: 0.9,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-007',
      name: 'R. G. Kar Medical College & Hospital Emergency',
      type: 'HOSPITAL',
      address: '1 Kshudiram Bose Sarani, Belgachia, Kolkata, West Bengal 700004, India',
      latitude: 22.6041,
      longitude: 88.3788,
      phone: '108 / 033-25557676',
      is_verified: true,
      distance_km: 4.2,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-008',
      name: 'NRS Medical College & Hospital Emergency',
      type: 'HOSPITAL',
      address: '138 AJC Bose Road, Sealdah, Kolkata, West Bengal 700014, India',
      latitude: 22.5638,
      longitude: 88.3695,
      phone: '108 / 033-22860033',
      is_verified: true,
      distance_km: 1.8,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-009',
      name: 'Apollo Multispecialty Hospital 24x7 Emergency',
      type: 'HOSPITAL',
      address: '58 Canal Circular Road, Kadapara, Phoolbagan, Kolkata, West Bengal 700054',
      latitude: 22.5783,
      longitude: 88.3978,
      phone: '108 / 033-23203040',
      is_verified: true,
      distance_km: 3.5,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-010',
      name: 'West Bengal Fire & Emergency Services HQ',
      type: 'FIRE_STATION',
      address: '13D Mirza Ghalib Street, Park Street, Kolkata, West Bengal 700016, India',
      latitude: 22.5539,
      longitude: 88.3551,
      phone: '101 / 112 / 033-22521165',
      is_verified: true,
      distance_km: 2.2,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-011',
      name: 'Howrah Police Station & Railway Emergency Desk',
      type: 'POLICE',
      address: 'MG Road, Howrah Railway Station Area, Howrah, West Bengal 711101, India',
      latitude: 22.5851,
      longitude: 88.3412,
      phone: '112 / 100 / 033-26382020',
      is_verified: true,
      distance_km: 3.1,
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'er-012',
      name: 'Siliguri Police Station & North Bengal Emergency Desk',
      type: 'POLICE',
      address: 'Hill Cart Road, Siliguri, West Bengal 734001, India',
      latitude: 26.7271,
      longitude: 88.4312,
      phone: '112 / 100 / 0353-2432100',
      is_verified: true,
      distance_km: 550,
      status: 'ACTIVE',
      created_at: now,
    },
  ];

  return {
    users: [alexUser, adminUser],
    passwords: {
      [defaultUserId]: userPasswordHash,
      [defaultAdminId]: userPasswordHash,
    },
    verification_codes: {},
    user_settings: [alexSettings],
    trusted_contacts: contacts,
    journeys: [],
    location_points: [],
    safety_checks: [],
    sos_events: [],
    emergency_resources: emergencyResources,
    notifications: [
      {
        id: 'n-001',
        user_id: defaultUserId,
        type: 'SYSTEM',
        title: 'Welcome to NexGuard',
        message: 'Your safety is in your control. Set up your trusted contacts and explore Safe Journeys.',
        read_at: null,
        created_at: now,
      },
    ],
    audit_logs: [
      {
        id: 'al-001',
        actor_user_id: defaultUserId,
        actor_name: 'Alex Johnson',
        action: 'SYSTEM_INITIALIZED',
        entity_type: 'SYSTEM',
        entity_id: 'sys',
        created_at: now,
      },
    ],
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create data directory, fallback to memory:', e);
    }

    let loadedData: DatabaseSchema | null = null;

    // 1. Try reading existing file in DATA_DIR (/tmp or ./data)
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        loadedData = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db file:', err);
      }
    }

    // 2. Fallback to repository SEED_FILE if available
    if (!loadedData && fs.existsSync(SEED_FILE)) {
      try {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8');
        loadedData = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading seed file:', err);
      }
    }

    // 3. Fallback to initial seed if empty or invalid
    if (!loadedData || !Array.isArray(loadedData.users) || loadedData.users.length === 0) {
      loadedData = initialSeed();
    }

    if (!loadedData.users) loadedData.users = [];
    if (!loadedData.passwords) loadedData.passwords = {};
    const defaultUserId = 'u-alex-demo-001';
    const defaultAdminId = 'u-admin-demo-001';
    if (!loadedData.passwords[defaultUserId] || !loadedData.passwords[defaultAdminId]) {
      try {
        const salt = bcrypt.genSaltSync(10);
        const demoHash = bcrypt.hashSync('Password123!', salt);
        if (!loadedData.passwords[defaultUserId]) loadedData.passwords[defaultUserId] = demoHash;
        if (!loadedData.passwords[defaultAdminId]) loadedData.passwords[defaultAdminId] = demoHash;
      } catch (e) {
        console.error('Error generating demo password hashes:', e);
      }
    }
    if (!loadedData.verification_codes) loadedData.verification_codes = {};
    if (!loadedData.user_settings) loadedData.user_settings = [];
    if (!loadedData.trusted_contacts) loadedData.trusted_contacts = [];
    if (!loadedData.journeys) loadedData.journeys = [];
    if (!loadedData.location_points) loadedData.location_points = [];
    if (!loadedData.safety_checks) loadedData.safety_checks = [];
    if (!loadedData.sos_events) loadedData.sos_events = [];
    if (!loadedData.emergency_resources) loadedData.emergency_resources = [];
    if (!loadedData.notifications) loadedData.notifications = [];
    if (!loadedData.audit_logs) loadedData.audit_logs = [];

    this.data = loadedData;
    this.persist();
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Collections ---
  public get users() { 
    if (!this.data.users) this.data.users = [];
    return this.data.users; 
  }
  public get passwords() { 
    if (!this.data.passwords) this.data.passwords = {};
    return this.data.passwords; 
  }
  public get verification_codes() { 
    if (!this.data.verification_codes) this.data.verification_codes = {};
    return this.data.verification_codes; 
  }
  public get user_settings() { 
    if (!this.data.user_settings) this.data.user_settings = [];
    return this.data.user_settings; 
  }
  public get trusted_contacts() { 
    if (!this.data.trusted_contacts) this.data.trusted_contacts = [];
    return this.data.trusted_contacts; 
  }
  public get journeys() { 
    if (!this.data.journeys) this.data.journeys = [];
    return this.data.journeys; 
  }
  public get location_points() { 
    if (!this.data.location_points) this.data.location_points = [];
    return this.data.location_points; 
  }
  public get safety_checks() { 
    if (!this.data.safety_checks) this.data.safety_checks = [];
    return this.data.safety_checks; 
  }
  public get sos_events() { 
    if (!this.data.sos_events) this.data.sos_events = [];
    return this.data.sos_events; 
  }
  public get emergency_resources() { 
    if (!this.data.emergency_resources) this.data.emergency_resources = [];
    return this.data.emergency_resources; 
  }
  public get notifications() { 
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications; 
  }
  public get audit_logs() { 
    if (!this.data.audit_logs) this.data.audit_logs = [];
    return this.data.audit_logs; 
  }

  // --- CRUD Helper operations ---
  public save() {
    this.persist();
  }

  public generateId(prefix: string = 'id'): string {
    const uuid = typeof crypto?.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    return `${prefix}-${uuid}`;
  }
}

export const db = new DatabaseStore();
