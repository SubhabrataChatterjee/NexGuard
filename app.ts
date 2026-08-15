import express from 'express';
import { UserModel } from './src/server/models/User';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from './src/server/email';
import { db } from './src/server/db';
import {
  authMiddleware,
  generateToken,
  roleGuard,
  AuthenticatedRequest,
} from './src/server/auth';
import { askSafetyAssistant } from './src/server/gemini';
import { isValidEmail, sanitizeEmail } from './src/utils/validation';

import {
  User,
  UserSettings,
  TrustedContact,
  Journey,
  LocationPoint,
  SafetyCheck,
  SosEvent,
  AuditLog,
} from './src/types';

export const app = express();

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// REQUEST URL NORMALIZER
// -------------------------------------------------------------

app.use((req, _res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }

  if (
    !req.url.startsWith('/api') &&
    (
      req.url.startsWith('/auth') ||
      req.url.startsWith('/user-settings') ||
      req.url.startsWith('/trusted-contacts') ||
      req.url.startsWith('/journeys') ||
      req.url.startsWith('/sos') ||
      req.url.startsWith('/emergency-resources') ||
      req.url.startsWith('/notifications') ||
      req.url.startsWith('/assistant') ||
      req.url.startsWith('/admin')
    )
  ) {
    req.url =
      '/api' +
      (req.url.startsWith('/') ? '' : '/') +
      req.url;
  }

  next();
});

const router = express.Router();

// -------------------------------------------------------------
// PENDING REGISTRATION STORAGE
// -------------------------------------------------------------
//
// IMPORTANT:
// These are NOT real UserModel accounts.
// A real account is created ONLY after email verification.
//
// This is intentionally in-memory for now.
// If the server restarts while someone is waiting for verification,
// the pending registration is lost and they will need to register again.
// -------------------------------------------------------------

interface PendingRegistration {
  email: string;
  passwordHash: string;
  full_name: string;
  phone?: string;
  verificationCode: string;
  verificationExpiresAt: Date;
  createdAt: string;
  updatedAt: string;
}

const pendingRegistrations = new Map<
  string,
  PendingRegistration
>();

// -------------------------------------------------------------
// HELPER: AUDIT LOG
// -------------------------------------------------------------

const logAudit = (
  actorId: string,
  actorName: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: any = {}
) => {
  try {
    const log: AuditLog = {
      id: db.generateId('al'),
      actor_user_id: actorId || 'system',
      actor_name: actorName || 'System',
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    if (db.audit_logs) {
      db.audit_logs.unshift(log);
      db.save();
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

// -------------------------------------------------------------
// AUTH API
// -------------------------------------------------------------

// =============================================================
// REGISTER
// =============================================================
//
// NEW USER FLOW:
//
// Register
//   ↓
// Store pending registration ONLY
//   ↓
// Send verification email
//   ↓
// NO UserModel created
//   ↓
// NO JWT created
//   ↓
// Frontend goes to verification page
//
// =============================================================

router.post('/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
    } = req.body || {};

    if (!email || !password || !full_name) {
      return res.status(400).json({
        error:
          'Email, password, and full name are required',
      });
    }

    const cleanEmail = sanitizeEmail(String(email));

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        error:
          'Invalid email address format. Please enter a valid email address (e.g. name@domain.com).',
      });
    }

    // ---------------------------------------------------------
    // CHECK REAL ACCOUNT
    // ---------------------------------------------------------

    const existingUser = await UserModel.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          'An account with this email address already exists. Please sign in instead.',
      });
    }

    // ---------------------------------------------------------
    // GENERATE VERIFICATION CODE
    // ---------------------------------------------------------

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const verificationExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    const passwordHash = await bcrypt.hash(
      String(password),
      10
    );

    const now = new Date().toISOString();

    // ---------------------------------------------------------
    // STORE PENDING REGISTRATION
    // ---------------------------------------------------------

    pendingRegistrations.set(cleanEmail, {
      email: cleanEmail,
      passwordHash,
      full_name: String(full_name).trim(),
      phone: phone
        ? String(phone).trim()
        : undefined,
      verificationCode,
      verificationExpiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // ---------------------------------------------------------
    // SEND VERIFICATION EMAIL
    // ---------------------------------------------------------

    try {
      await sendVerificationEmail(
        cleanEmail,
        verificationCode
      );
    } catch (emailError) {
      // If email sending fails, don't leave a pending registration.
      pendingRegistrations.delete(cleanEmail);

      throw emailError;
    }

    console.log(
      `📧 Registration verification email sent to ${cleanEmail}`
    );

    // ---------------------------------------------------------
    // IMPORTANT:
    //
    // NO UserModel.create()
    // NO JWT
    // NO authenticated user
    // ---------------------------------------------------------

    return res.status(201).json({
      requires_verification: true,
      email: cleanEmail,
      message:
        'Verification code sent to your email address.',
    });

  } catch (err: any) {
    console.error(
      'Registration error:',
      err
    );

    return res.status(500).json({
      error:
        err?.message ||
        'Failed to start registration',
    });
  }
});

// =============================================================
// LOGIN
// =============================================================
//
// EXISTING USER FLOW:
//
// Email + Password
//       ↓
// Find real UserModel
//       ↓
// Check password
//       ↓
// Check ACTIVE
//       ↓
// Generate JWT
//       ↓
// Login immediately
//
// NO EMAIL VERIFICATION DURING LOGIN.
// =============================================================

router.post('/auth/login', async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error:
          'Email address and password are required',
      });
    }

    const cleanEmail = sanitizeEmail(
      String(email)
    );

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        error:
          'Invalid email ID format. Please enter a valid email address.',
      });
    }

    // ---------------------------------------------------------
    // FIND EXISTING ACCOUNT
    // ---------------------------------------------------------

    const mongoUser = await UserModel.findOne({
      email: cleanEmail,
    });

    if (!mongoUser) {
      return res.status(401).json({
        error:
          'Login failed: No registered account found with this email ID. Please check your email or create an account.',
      });
    }

    // ---------------------------------------------------------
    // PASSWORD
    // ---------------------------------------------------------

    const isMatch = await bcrypt.compare(
      String(password),
      mongoUser.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        error:
          'Invalid email ID or password. Please check your credentials.',
      });
    }

    // ---------------------------------------------------------
    // ACCOUNT STATUS
    // ---------------------------------------------------------

    if (mongoUser.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Account is suspended',
      });
    }

    // ---------------------------------------------------------
    // IMPORTANT:
    //
    // DO NOT CHECK email_verified HERE.
    //
    // Existing users can login with email + password.
    // ---------------------------------------------------------

    const user: User = {
      id: mongoUser.id,
      email: mongoUser.email,
      full_name: mongoUser.full_name,
      phone: mongoUser.phone,
      avatar_url: mongoUser.avatar_url,
      role: mongoUser.role,
      status: mongoUser.status,
      email_verified: mongoUser.email_verified,
      timezone: mongoUser.timezone,
      created_at: mongoUser.created_at,
      updated_at: mongoUser.updated_at,
    };

    // ---------------------------------------------------------
    // SETTINGS
    // ---------------------------------------------------------

    let settings = (
      db.user_settings || []
    ).find(
      (s) =>
        s &&
        s.user_id === user.id
    );

    if (!settings) {
      const now =
        new Date().toISOString();

      settings = {
        id: db.generateId('s'),
        user_id: user.id,
        location_sharing_enabled: true,
        route_monitoring_enabled: true,
        arrival_check_enabled: true,
        default_grace_period_minutes: 10,
        notification_enabled: true,
        created_at: now,
        updated_at: now,
      };

      db.user_settings.push(settings);
      db.save();
    }

    // ---------------------------------------------------------
    // AUDIT
    // ---------------------------------------------------------

    logAudit(
      user.id,
      user.full_name,
      'USER_LOGIN',
      'USER',
      user.id
    );

    // ---------------------------------------------------------
    // GENERATE TOKEN
    // ---------------------------------------------------------

    const token =
      generateToken(user);

    console.log(
      `✅ MongoDB login successful: ${cleanEmail}`
    );

    return res.json({
      token,
      user,
      settings,
    });

  } catch (err: any) {
    console.error(
      'Login error:',
      err
    );

    return res.status(500).json({
      error:
        err?.message ||
        'Failed to authenticate',
    });
  }
});

// =============================================================
// VERIFY EMAIL
// =============================================================
//
// NEW USER FLOW:
//
// Verification code
//       ↓
// Find pending registration
//       ↓
// Validate code
//       ↓
// Validate expiry
//       ↓
// CREATE REAL USER
//       ↓
// Delete pending registration
//       ↓
// Generate JWT
//       ↓
// Frontend → NexGuard homepage
//
// =============================================================

router.post(
  '/auth/verify-email',
  async (req, res) => {
    try {
      const {
        email,
        code,
      } = req.body || {};

      if (!email || !code) {
        return res.status(400).json({
          error:
            'Email address and verification code are required',
        });
      }

      const cleanEmail =
        sanitizeEmail(String(email));

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          error:
            'Invalid email address format',
        });
      }

      // -------------------------------------------------------
      // FIND PENDING REGISTRATION
      // -------------------------------------------------------

      const pending =
        pendingRegistrations.get(
          cleanEmail
        );

      // -------------------------------------------------------
      // IMPORTANT:
      //
      // If there is no pending registration, check if the
      // account already exists.
      // -------------------------------------------------------

      if (!pending) {
        const existingUser =
          await UserModel.findOne({
            email: cleanEmail,
          });

        if (existingUser) {
          if (
            existingUser.email_verified
          ) {
            return res.status(400).json({
              error:
                'This email address is already verified. Please sign in instead.',
            });
          }

          return res.status(400).json({
            error:
              'No active registration verification was found. Please register again.',
          });
        }

        return res.status(404).json({
          error:
            'No pending registration found for this email address. Please register again.',
        });
      }

      // -------------------------------------------------------
      // CHECK CODE
      // -------------------------------------------------------

      if (
        String(code).trim() !==
        String(
          pending.verificationCode
        ).trim()
      ) {
        return res.status(400).json({
          error:
            'Invalid verification code. Please check your email and try again.',
        });
      }

      // -------------------------------------------------------
      // CHECK EXPIRY
      // -------------------------------------------------------

      if (
        new Date(
          pending.verificationExpiresAt
        ) < new Date()
      ) {
        pendingRegistrations.delete(
          cleanEmail
        );

        return res.status(400).json({
          error:
            'Verification code has expired. Please register again to receive a new code.',
        });
      }

      // -------------------------------------------------------
      // FINAL CHECK:
      //
      // Make sure someone didn't create the account between
      // registration and verification.
      // -------------------------------------------------------

      const existingUser =
        await UserModel.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        pendingRegistrations.delete(
          cleanEmail
        );

        return res.status(400).json({
          error:
            'An account with this email address already exists. Please sign in instead.',
        });
      }

      // -------------------------------------------------------
      // VERIFICATION SUCCESSFUL
      // -------------------------------------------------------

      const now =
        new Date().toISOString();

      const userId =
        db.generateId('u');

      // -------------------------------------------------------
      // CREATE REAL ACCOUNT NOW
      // -------------------------------------------------------

      const newMongoUser =
        await UserModel.create({
          id: userId,
          email: pending.email,
          passwordHash:
            pending.passwordHash,
          full_name:
            pending.full_name,
          phone:
            pending.phone,
          role: 'USER',
          status: 'ACTIVE',
          email_verified: true,
          timezone:
            'America/New_York',

          created_at: pending.createdAt,
          updated_at: now,
        });

      // -------------------------------------------------------
      // DELETE PENDING REGISTRATION
      // -------------------------------------------------------

      pendingRegistrations.delete(
        cleanEmail
      );

      // -------------------------------------------------------
      // CREATE DEFAULT SETTINGS
      // -------------------------------------------------------

      const settings: UserSettings = {
        id: db.generateId('s'),
        user_id: userId,
        location_sharing_enabled: true,
        route_monitoring_enabled: true,
        arrival_check_enabled: true,
        default_grace_period_minutes: 10,
        notification_enabled: true,
        created_at: now,
        updated_at: now,
      };

      db.user_settings.push(
        settings
      );

      // -------------------------------------------------------
      // INTERNAL NOTIFICATION
      // -------------------------------------------------------

      db.notifications.unshift({
        id: db.generateId('n'),
        user_id: userId,
        type: 'SYSTEM',
        title: 'Welcome to NexGuard',
        message:
          'Your email has been successfully verified and your NexGuard account is now active.',
        read_at: null,
        created_at: now,
      });

      db.save();

      // -------------------------------------------------------
      // USER OBJECT
      // -------------------------------------------------------

      const verifiedUser: User = {
        id: newMongoUser.id,
        email: newMongoUser.email,
        full_name:
          newMongoUser.full_name,
        phone:
          newMongoUser.phone,
        avatar_url:
          newMongoUser.avatar_url,
        role:
          newMongoUser.role,
        status:
          newMongoUser.status,
        email_verified: true,
        timezone:
          newMongoUser.timezone,
        created_at:
          newMongoUser.created_at,
        updated_at:
          newMongoUser.updated_at,
      };

      // -------------------------------------------------------
      // AUDIT
      // -------------------------------------------------------

      logAudit(
        verifiedUser.id,
        verifiedUser.full_name,
        'USER_REGISTERED_AND_EMAIL_VERIFIED',
        'USER',
        verifiedUser.id
      );

      // -------------------------------------------------------
      // CREATE TOKEN ONLY NOW
      // -------------------------------------------------------

      const token =
        generateToken(
          verifiedUser
        );

      console.log(
        `✅ New NexGuard account created after email verification: ${cleanEmail}`
      );

      // -------------------------------------------------------
      // FINAL RESPONSE
      // -------------------------------------------------------

      return res.status(201).json({
        token,
        user: verifiedUser,
        settings,
        message:
          'Email address successfully verified and account created!',
      });

    } catch (err: any) {
      console.error(
        'Email verification error:',
        err
      );

      return res.status(500).json({
        error:
          err?.message ||
          'Failed to verify email address',
      });
    }
  }
);

// =============================================================
// RESEND CODE
// =============================================================
//
// Resend works ONLY for a pending new registration.
//
// =============================================================

router.post(
  '/auth/resend-code',
  async (req, res) => {
    try {
      const {
        email,
      } = req.body || {};

      if (!email) {
        return res.status(400).json({
          error:
            'Email address is required',
        });
      }

      const cleanEmail =
        sanitizeEmail(String(email));

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          error:
            'Invalid email ID format',
        });
      }

      // -------------------------------------------------------
      // CHECK REAL ACCOUNT
      // -------------------------------------------------------

      const existingUser =
        await UserModel.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          error:
            'An account with this email already exists. Please sign in.',
        });
      }

      // -------------------------------------------------------
      // FIND PENDING REGISTRATION
      // -------------------------------------------------------

      const pending =
        pendingRegistrations.get(
          cleanEmail
        );

      if (!pending) {
        return res.status(404).json({
          error:
            'No pending registration found. Please register again.',
        });
      }

      // -------------------------------------------------------
      // GENERATE NEW CODE
      // -------------------------------------------------------

      const verificationCode =
        Math.floor(
          100000 +
            Math.random() * 900000
        ).toString();

      const verificationExpiresAt =
        new Date(
          Date.now() +
            15 * 60 * 1000
        );

      // -------------------------------------------------------
      // UPDATE PENDING REGISTRATION
      // -------------------------------------------------------

      pending.verificationCode =
        verificationCode;

      pending.verificationExpiresAt =
        verificationExpiresAt;

      pending.updatedAt =
        new Date().toISOString();

      pendingRegistrations.set(
        cleanEmail,
        pending
      );

      // -------------------------------------------------------
      // SEND NEW CODE
      // -------------------------------------------------------

      await sendVerificationEmail(
        cleanEmail,
        verificationCode
      );

      console.log(
        `📧 Resent registration verification email to ${cleanEmail}`
      );

      return res.json({
        success: true,
        email: cleanEmail,
        message:
          'A new verification code has been sent to your email address.',
      });

    } catch (err: any) {
      console.error(
        'Resend code error:',
        err
      );

      return res.status(500).json({
        error:
          err?.message ||
          'Failed to resend verification code',
      });
    }
  }
);

// =============================================================
// AUTH ME
// =============================================================

router.get(
  '/auth/me',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user =
        req.user!;

      const userSettingsList =
        db.user_settings || [];

      let settings =
        userSettingsList.find(
          (s) =>
            s &&
            s.user_id ===
              user.id
        );

      if (!settings) {
        settings = {
          id: db.generateId('s'),
          user_id: user.id,
          location_sharing_enabled: true,
          route_monitoring_enabled: true,
          arrival_check_enabled: true,
          default_grace_period_minutes: 10,
          notification_enabled: true,
          created_at:
            new Date().toISOString(),
          updated_at:
            new Date().toISOString(),
        };

        db.user_settings.push(
          settings
        );

        db.save();
      }

      return res.json({
        user,
        settings,
      });

    } catch (err: any) {
      console.error(
        'Auth me error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to fetch user session',
      });
    }
  }
);

// =============================================================
// LOGOUT
// =============================================================

router.post(
  '/auth/logout',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (req.user) {
        logAudit(
          req.user.id,
          req.user.full_name,
          'USER_LOGOUT',
          'USER',
          req.user.id
        );
      }

      return res.json({
        success: true,
      });

    } catch (err: any) {
      console.error(
        'Logout error:',
        err
      );

      return res.json({
        success: true,
      });
    }
  }
);

// -------------------------------------------------------------
// USER SETTINGS API
// -------------------------------------------------------------

router.get(
  '/user-settings',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const settingsList =
        db.user_settings || [];

      const settings =
        settingsList.find(
          (s) =>
            s &&
            s.user_id ===
              req.user!.id
        );

      return res.json(
        settings || {}
      );

    } catch (err: any) {
      console.error(
        'Get user settings error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to fetch settings',
      });
    }
  }
);

router.patch(
  '/user-settings',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const settingsList =
        db.user_settings || [];

      let settings =
        settingsList.find(
          (s) =>
            s &&
            s.user_id ===
              req.user!.id
        );

      const now =
        new Date().toISOString();

      if (!settings) {
        settings = {
          id: db.generateId('s'),
          user_id: req.user!.id,
          location_sharing_enabled: true,
          route_monitoring_enabled: true,
          arrival_check_enabled: true,
          default_grace_period_minutes: 10,
          notification_enabled: true,
          created_at: now,
          updated_at: now,
        };

        db.user_settings.push(
          settings
        );
      }

      Object.assign(
        settings,
        req.body,
        {
          updated_at: now,
        }
      );

      db.save();

      return res.json(
        settings
      );

    } catch (err: any) {
      console.error(
        'Update settings error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to update settings',
      });
    }
  }
);

// -------------------------------------------------------------
// TRUSTED CONTACTS API
// -------------------------------------------------------------

router.get(
  '/trusted-contacts',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const contactsList =
        db.trusted_contacts || [];

      const contacts =
        contactsList.filter(
          (c) =>
            c &&
            c.owner_user_id ===
              req.user!.id
        );

      return res.json(
        contacts
      );

    } catch (err: any) {
      console.error(
        'Get contacts error:',
        err
      );

      return res.json([]);
    }
  }
);

router.post(
  '/trusted-contacts',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        name,
        relationship,
        phone,
        email,
        permissions,
      } = req.body || {};

      if (
        !name ||
        !relationship ||
        (!phone && !email)
      ) {
        return res.status(400).json({
          error:
            'Name, relationship, and contact number or email are required',
        });
      }

      const now =
        new Date().toISOString();

      const contact:
        TrustedContact = {
        id: db.generateId('tc'),
        owner_user_id:
          req.user!.id,
        name: String(
          name
        ).trim(),
        relationship:
          String(
            relationship
          ).trim(),
        phone: phone
          ? String(phone).trim()
          : '',
        email: email
          ? String(email).trim()
          : '',
        status: 'ACTIVE',
        permissions:
          permissions || {
            sos_alerts: true,
            late_arrival_alerts: true,
            location_sharing: true,
          },
        created_at: now,
        updated_at: now,
      };

      db.trusted_contacts.push(
        contact
      );

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'ADDED_TRUSTED_CONTACT',
        'TRUSTED_CONTACT',
        contact.id,
        {
          name: contact.name,
        }
      );

      return res.status(201).json(
        contact
      );

    } catch (err: any) {
      console.error(
        'Add contact error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to add contact',
      });
    }
  }
);

router.patch(
  '/trusted-contacts/:id',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const contactsList =
        db.trusted_contacts || [];

      const contact =
        contactsList.find(
          (c) =>
            c &&
            c.id ===
              req.params.id &&
            c.owner_user_id ===
              req.user!.id
        );

      if (!contact) {
        return res.status(404).json({
          error:
            'Contact not found',
        });
      }

      const now =
        new Date().toISOString();

      if (
        req.body?.name
      ) {
        contact.name =
          String(
            req.body.name
          ).trim();
      }

      if (
        req.body?.relationship
      ) {
        contact.relationship =
          String(
            req.body.relationship
          ).trim();
      }

      if (
        req.body?.phone !==
        undefined
      ) {
        contact.phone =
          String(
            req.body.phone
          ).trim();
      }

      if (
        req.body?.email !==
        undefined
      ) {
        contact.email =
          String(
            req.body.email
          ).trim();
      }

      if (
        req.body?.permissions
      ) {
        contact.permissions =
          {
            ...contact.permissions,
            ...req.body.permissions,
          };
      }

      if (
        req.body?.status
      ) {
        contact.status =
          req.body.status;
      }

      contact.updated_at =
        now;

      db.save();

      return res.json(
        contact
      );

    } catch (err: any) {
      console.error(
        'Update contact error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to update contact',
      });
    }
  }
);

router.delete(
  '/trusted-contacts/:id',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const contactsList =
        db.trusted_contacts || [];

      const index =
        contactsList.findIndex(
          (c) =>
            c &&
            c.id ===
              req.params.id &&
            c.owner_user_id ===
              req.user!.id
        );

      if (index === -1) {
        return res.status(404).json({
          error:
            'Contact not found',
        });
      }

      const removed =
        db.trusted_contacts.splice(
          index,
          1
        )[0];

      db.save();

      if (removed) {
        logAudit(
          req.user!.id,
          req.user!.full_name,
          'DELETED_TRUSTED_CONTACT',
          'TRUSTED_CONTACT',
          req.params.id,
          {
            name:
              removed.name,
          }
        );
      }

      return res.json({
        success: true,
      });

    } catch (err: any) {
      console.error(
        'Delete contact error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to delete contact',
      });
    }
  }
);

// -------------------------------------------------------------
// JOURNEYS API
// -------------------------------------------------------------

router.get(
  '/journeys',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const userJourneys =
        journeysList
          .filter(
            (j) =>
              j &&
              j.user_id ===
                req.user!.id
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at || 0
              ).getTime() -
              new Date(
                a.created_at || 0
              ).getTime()
          );

      return res.json(
        userJourneys
      );

    } catch (err: any) {
      console.error(
        'Get journeys error:',
        err
      );

      return res.json([]);
    }
  }
);

router.get(
  '/journeys/active',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const active =
        journeysList.find(
          (j) =>
            j &&
            j.user_id ===
              req.user!.id &&
            [
              'ACTIVE',
              'CHECKING_IN',
              'SOS_ACTIVE',
            ].includes(
              j.status
            )
        );

      return res.json(
        active || null
      );

    } catch (err: any) {
      console.error(
        'Get active journey error:',
        err
      );

      return res.json(null);
    }
  }
);

router.get(
  '/journeys/:id',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      return res.json(
        journey
      );

    } catch (err: any) {
      console.error(
        'Get journey error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to fetch journey',
      });
    }
  }
);

router.post(
  '/journeys',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        destination_name,
        destination_latitude,
        destination_longitude,
        start_location_name,
        start_latitude,
        start_longitude,
        expected_arrival_minutes,
        grace_period_minutes,
        trusted_contact_ids,
        monitoring_enabled,
        route_monitoring_enabled,
        arrival_check_enabled,
      } = req.body || {};

      if (!destination_name) {
        return res.status(400).json({
          error:
            'Destination name is required',
        });
      }

      const journeysList =
        db.journeys || [];

      const existingActive =
        journeysList.find(
          (j) =>
            j &&
            j.user_id ===
              req.user!.id &&
            [
              'ACTIVE',
              'CHECKING_IN',
              'SOS_ACTIVE',
            ].includes(
              j.status
            )
        );

      if (existingActive) {
        return res.status(400).json({
          error:
            'You already have an active journey running. Complete or cancel it first.',
          journey:
            existingActive,
        });
      }

      const now =
        new Date();

      const durationMins =
        expected_arrival_minutes
          ? parseInt(
              expected_arrival_minutes,
              10
            )
          : 20;

      const arrivalTime =
        new Date(
          now.getTime() +
            durationMins *
              60 *
              1000
        ).toISOString();

      const journey:
        Journey = {
        id: db.generateId('j'),
        user_id:
          req.user!.id,
        destination_name:
          String(
            destination_name
          ).trim(),
        destination_latitude:
          destination_latitude ||
          22.5726,
        destination_longitude:
          destination_longitude ||
          88.3639,
        start_location_name:
          start_location_name ||
          'Current Location',
        start_latitude:
          start_latitude ||
          22.5726,
        start_longitude:
          start_longitude ||
          88.3639,
        started_at:
          now.toISOString(),
        expected_arrival_at:
          arrivalTime,
        grace_period_minutes:
          grace_period_minutes ||
          10,
        actual_arrival_at:
          null,
        status:
          'ACTIVE',
        trusted_contact_ids:
          trusted_contact_ids ||
          [],
        monitoring_enabled:
          monitoring_enabled ??
          true,
        route_monitoring_enabled:
          route_monitoring_enabled ??
          true,
        arrival_check_enabled:
          arrival_check_enabled ??
          true,
        safety_score:
          9.2,
        created_at:
          now.toISOString(),
        updated_at:
          now.toISOString(),
      };

      db.journeys.unshift(
        journey
      );

      db.location_points.push({
        id: db.generateId('lp'),
        journey_id:
          journey.id,
        user_id:
          req.user!.id,
        latitude:
          journey.start_latitude,
        longitude:
          journey.start_longitude,
        accuracy_meters: 5,
        speed_mps: 1.2,
        heading_degrees: 45,
        battery_percent: 88,
        recorded_at:
          now.toISOString(),
      });

      db.notifications.unshift({
        id: db.generateId('n'),
        user_id:
          req.user!.id,
        type:
          'JOURNEY_STARTED',
        title:
          'Safe Journey Started',
        message:
          `Journey to "${journey.destination_name}" is active. Your trusted contacts have been informed.`,
        read_at: null,
        created_at:
          now.toISOString(),
      });

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'JOURNEY_STARTED',
        'JOURNEY',
        journey.id,
        {
          destination:
            journey.destination_name,
        }
      );

      return res.status(201).json(
        journey
      );

    } catch (err: any) {
      console.error(
        'Create journey error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to start journey',
      });
    }
  }
);

router.post(
  '/journeys/:id/complete',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      const now =
        new Date().toISOString();

      journey.status =
        'COMPLETED';

      journey.actual_arrival_at =
        now;

      journey.updated_at =
        now;

      (
        db.safety_checks ||
        []
      ).forEach((sc) => {
        if (
          sc &&
          sc.journey_id ===
            journey.id &&
          sc.status ===
            'PENDING'
        ) {
          sc.status =
            'RESPONDED_SAFE';

          sc.responded_at =
            now;
        }
      });

      db.notifications.unshift({
        id: db.generateId('n'),
        user_id:
          req.user!.id,
        type:
          'JOURNEY_COMPLETED',
        title:
          'Safe Arrival Confirmed',
        message:
          `You arrived safely at ${journey.destination_name}. Location sharing has automatically ended.`,
        read_at: null,
        created_at: now,
      });

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'JOURNEY_COMPLETED',
        'JOURNEY',
        journey.id
      );

      return res.json(
        journey
      );

    } catch (err: any) {
      console.error(
        'Complete journey error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to complete journey',
      });
    }
  }
);

router.post(
  '/journeys/:id/cancel',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      const now =
        new Date().toISOString();

      journey.status =
        'CANCELLED';

      journey.updated_at =
        now;

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'JOURNEY_CANCELLED',
        'JOURNEY',
        journey.id
      );

      return res.json(
        journey
      );

    } catch (err: any) {
      console.error(
        'Cancel journey error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to cancel journey',
      });
    }
  }
);

// -------------------------------------------------------------
// LOCATION INGESTION
// -------------------------------------------------------------

router.post(
  '/journeys/:id/location',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      const {
        latitude,
        longitude,
        accuracy_meters,
        speed_mps,
        heading_degrees,
        battery_percent,
      } = req.body || {};

      if (
        latitude ===
          undefined ||
        longitude ===
          undefined
      ) {
        return res.status(400).json({
          error:
            'Latitude and longitude are required',
        });
      }

      const now =
        new Date().toISOString();

      const point:
        LocationPoint = {
        id: db.generateId('lp'),
        journey_id:
          journey.id,
        user_id:
          req.user!.id,
        latitude:
          Number(latitude),
        longitude:
          Number(longitude),
        accuracy_meters:
          accuracy_meters || 5,
        speed_mps:
          speed_mps || 0,
        heading_degrees:
          heading_degrees || 0,
        battery_percent:
          battery_percent || 85,
        recorded_at:
          now,
      };

      db.location_points.push(
        point
      );

      journey.updated_at =
        now;

      db.save();

      return res.status(201).json(
        point
      );

    } catch (err: any) {
      console.error(
        'Location ingest error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to record location point',
      });
    }
  }
);

router.get(
  '/journeys/:id/location/latest',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const pointsList =
        db.location_points || [];

      const points =
        pointsList.filter(
          (lp) =>
            lp &&
            lp.journey_id ===
              req.params.id
        );

      if (
        points.length === 0
      ) {
        return res.json(null);
      }

      const latest =
        points[
          points.length - 1
        ];

      return res.json(
        latest
      );

    } catch (err: any) {
      console.error(
        'Get latest location error:',
        err
      );

      return res.json(null);
    }
  }
);

// -------------------------------------------------------------
// SAFETY CHECK
// -------------------------------------------------------------

router.get(
  '/journeys/:id/safety-check',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const checksList =
        db.safety_checks || [];

      const activeCheck =
        checksList.find(
          (sc) =>
            sc &&
            sc.journey_id ===
              req.params.id &&
            sc.status ===
              'PENDING'
        );

      return res.json(
        activeCheck || null
      );

    } catch (err: any) {
      console.error(
        'Get safety check error:',
        err
      );

      return res.json(null);
    }
  }
);

router.post(
  '/journeys/:id/safety-check/trigger',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      const now =
        new Date();

      const check:
        SafetyCheck = {
        id: db.generateId('sc'),
        journey_id:
          journey.id,
        user_id:
          req.user!.id,
        trigger_type:
          req.body?.trigger_type ||
          'MANUAL',
        status:
          'PENDING',
        requested_at:
          now.toISOString(),
        responded_at:
          null,
        expires_at:
          new Date(
            now.getTime() +
              (journey.grace_period_minutes ||
                5) *
                60 *
                1000
          ).toISOString(),
      };

      journey.status =
        'CHECKING_IN';

      db.safety_checks.push(
        check
      );

      db.notifications.unshift({
        id: db.generateId('n'),
        user_id:
          req.user!.id,
        type:
          'SAFETY_CHECK',
        title:
          'Safety Check-In Required',
        message:
          'Your estimated arrival window has passed. Are you safe?',
        read_at: null,
        created_at:
          now.toISOString(),
      });

      db.save();

      return res.status(201).json(
        check
      );

    } catch (err: any) {
      console.error(
        'Trigger safety check error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to trigger safety check',
      });
    }
  }
);

router.post(
  '/journeys/:id/safety-check/respond',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        response_type,
      } = req.body || {};

      const journeysList =
        db.journeys || [];

      const journey =
        journeysList.find(
          (j) =>
            j &&
            j.id ===
              req.params.id &&
            j.user_id ===
              req.user!.id
        );

      if (!journey) {
        return res.status(404).json({
          error:
            'Journey not found',
        });
      }

      const now =
        new Date().toISOString();

      const checksList =
        db.safety_checks || [];

      const pendingCheck =
        checksList.find(
          (sc) =>
            sc &&
            sc.journey_id ===
              journey.id &&
            sc.status ===
              'PENDING'
        );

      if (pendingCheck) {
        pendingCheck.responded_at =
          now;

        pendingCheck.status =
          response_type ===
          'SAFE'
            ? 'RESPONDED_SAFE'
            : 'NEED_HELP';
      }

      if (
        response_type ===
        'SAFE'
      ) {
        journey.status =
          'ACTIVE';

        journey.updated_at =
          now;

        db.save();

        return res.json({
          status: 'SAFE',
          journey,
        });
      }

      journey.status =
        'SOS_ACTIVE';

      journey.updated_at =
        now;

      const contactsList =
        db.trusted_contacts || [];

      const contacts =
        contactsList.filter(
          (tc) =>
            tc &&
            tc.owner_user_id ===
              req.user!.id &&
            tc.status ===
              'ACTIVE'
        );

      const pointsList =
        db.location_points || [];

      const latestPoint =
        pointsList
          .filter(
            (lp) =>
              lp &&
              lp.journey_id ===
                journey.id
          )
          .pop();

      const sosEvent:
        SosEvent = {
        id: db.generateId('sos'),
        user_id:
          req.user!.id,
        journey_id:
          journey.id,
        trigger_type:
          'SAFETY_CHECK_HELP',
        status:
          'ACTIVE',
        activated_at:
          now,
        resolved_at:
          null,
        latitude:
          latestPoint?.latitude ||
          journey.start_latitude,
        longitude:
          latestPoint?.longitude ||
          journey.start_longitude,
        location_name:
          journey.destination_name,
        battery_percent:
          latestPoint?.battery_percent ||
          80,
        notified_contacts:
          contacts.map(
            (c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              status:
                'DELIVERED',
            })
          ),
        created_at:
          now,
        updated_at:
          now,
      };

      db.sos_events.unshift(
        sosEvent
      );

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'SAFETY_CHECK_HELP_ESCALATED',
        'SOS_EVENT',
        sosEvent.id
      );

      return res.json({
        status:
          'NEED_HELP',
        sosEvent,
        journey,
      });

    } catch (err: any) {
      console.error(
        'Respond safety check error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to respond to safety check',
      });
    }
  }
);

// -------------------------------------------------------------
// SOS
// -------------------------------------------------------------

router.get(
  '/sos/active',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const sosList =
        db.sos_events || [];

      const activeSos =
        sosList.find(
          (s) =>
            s &&
            s.user_id ===
              req.user!.id &&
            s.status ===
              'ACTIVE'
        );

      return res.json(
        activeSos || null
      );

    } catch (err: any) {
      console.error(
        'Get active SOS error:',
        err
      );

      return res.json(null);
    }
  }
);

router.post(
  '/sos',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        latitude,
        longitude,
        location_name,
        battery_percent,
      } = req.body || {};

      const userId =
        req.user!.id;

      const sosList =
        db.sos_events || [];

      const existingActive =
        sosList.find(
          (s) =>
            s &&
            s.user_id ===
              userId &&
            s.status ===
              'ACTIVE'
        );

      if (existingActive) {
        return res.json(
          existingActive
        );
      }

      const now =
        new Date().toISOString();

      const journeysList =
        db.journeys || [];

      const activeJourney =
        journeysList.find(
          (j) =>
            j &&
            j.user_id ===
              userId &&
            [
              'ACTIVE',
              'CHECKING_IN',
            ].includes(
              j.status
            )
        );

      if (activeJourney) {
        activeJourney.status =
          'SOS_ACTIVE';

        activeJourney.updated_at =
          now;
      }

      const contactsList =
        db.trusted_contacts || [];

      const contacts =
        contactsList.filter(
          (c) =>
            c &&
            c.owner_user_id ===
              userId &&
            c.status ===
              'ACTIVE'
        );

      const sosEvent:
        SosEvent = {
        id: db.generateId('sos'),
        user_id:
          userId,
        journey_id:
          activeJourney
            ? activeJourney.id
            : null,
        trigger_type:
          'MANUAL_SOS',
        status:
          'ACTIVE',
        activated_at:
          now,
        resolved_at:
          null,
        latitude:
          latitude
            ? Number(latitude)
            : activeJourney
              ?.start_latitude ||
              22.5726,
        longitude:
          longitude
            ? Number(longitude)
            : activeJourney
              ?.start_longitude ||
              88.3639,
        location_name:
          location_name ||
          activeJourney
            ?.destination_name ||
          'Kolkata, West Bengal, India',
        battery_percent:
          battery_percent ||
          78,
        notified_contacts:
          contacts.map(
            (c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              status:
                'DELIVERED',
            })
          ),
        created_at:
          now,
        updated_at:
          now,
      };

      db.sos_events.unshift(
        sosEvent
      );

      db.notifications.unshift({
        id: db.generateId('n'),
        user_id:
          userId,
        type: 'SOS',
        title:
          'SOS ALERT ACTIVATED',
        message:
          'Emergency notification broadcasted to your trusted contacts and local resources.',
        read_at: null,
        created_at:
          now,
      });

      db.save();

      logAudit(
        userId,
        req.user!.full_name,
        'SOS_ACTIVATED',
        'SOS_EVENT',
        sosEvent.id,
        {
          latitude:
            sosEvent.latitude,
          longitude:
            sosEvent.longitude,
        }
      );

      return res.status(201).json(
        sosEvent
      );

    } catch (err: any) {
      console.error(
        'Trigger SOS error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to trigger SOS alert',
      });
    }
  }
);

router.post(
  '/sos/:id/cancel',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const sosList =
        db.sos_events || [];

      const sosEvent =
        sosList.find(
          (s) =>
            s &&
            s.id ===
              req.params.id &&
            s.user_id ===
              req.user!.id
        );

      if (!sosEvent) {
        return res.status(404).json({
          error:
            'SOS Event not found',
        });
      }

      const {
        resolution_reason,
      } = req.body || {};

      const now =
        new Date().toISOString();

      sosEvent.status =
        'CANCELLED';

      sosEvent.resolved_at =
        now;

      sosEvent.resolution_reason =
        resolution_reason ||
        'User cancelled SOS';

      sosEvent.updated_at =
        now;

      if (
        sosEvent.journey_id
      ) {
        const journeysList =
          db.journeys || [];

        const journey =
          journeysList.find(
            (j) =>
              j &&
              j.id ===
                sosEvent.journey_id
          );

        if (
          journey &&
          journey.status ===
            'SOS_ACTIVE'
        ) {
          journey.status =
            'ACTIVE';

          journey.updated_at =
            now;
        }
      }

      db.save();

      logAudit(
        req.user!.id,
        req.user!.full_name,
        'SOS_CANCELLED',
        'SOS_EVENT',
        sosEvent.id
      );

      return res.json(
        sosEvent
      );

    } catch (err: any) {
      console.error(
        'Cancel SOS error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to cancel SOS',
      });
    }
  }
);

// -------------------------------------------------------------
// EMERGENCY RESOURCES
// -------------------------------------------------------------

router.get(
  '/emergency-resources',
  (
    req,
    res
  ) => {
    try {
      const {
        type,
        lat,
        lng,
      } = req.query;

      const resourcesList =
        db.emergency_resources || [];

      let resources =
        resourcesList.filter(
          (r) =>
            r &&
            r.status ===
              'ACTIVE'
        );

      if (
        type &&
        typeof type ===
          'string' &&
        type !== 'ALL'
      ) {
        resources =
          resources.filter(
            (r) =>
              r &&
              r.type ===
                type
          );
      }

      const userLat =
        lat
          ? parseFloat(
              lat as string
            )
          : null;

      const userLng =
        lng
          ? parseFloat(
              lng as string
            )
          : null;

      function calculateDistanceKm(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number {
        const R = 6371;

        const dLat =
          (lat2 - lat1) *
          (Math.PI / 180);

        const dLon =
          (lon2 - lon1) *
          (Math.PI / 180);

        const a =
          Math.sin(
            dLat / 2
          ) *
            Math.sin(
              dLat / 2
            ) +
          Math.cos(
            lat1 *
              (Math.PI / 180)
          ) *
            Math.cos(
              lat2 *
                (Math.PI / 180)
            ) *
            Math.sin(
              dLon / 2
            ) *
            Math.sin(
              dLon / 2
            );

        const c =
          2 *
          Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
          );

        return Math.round(
          R * c * 10
        ) / 10;
      }

      const result =
        resources.map(
          (r) => {
            if (
              userLat !==
                null &&
              !isNaN(userLat) &&
              userLng !==
                null &&
              !isNaN(userLng) &&
              r.latitude &&
              r.longitude
            ) {
              const distKm =
                calculateDistanceKm(
                  userLat,
                  userLng,
                  r.latitude,
                  r.longitude
                );

              return {
                ...r,
                distance_km:
                  distKm,
                distance_miles:
                  Math.round(
                    distKm *
                      0.621371 *
                      10
                  ) / 10,
              };
            }

            return r;
          }
        );

      if (
        userLat !==
          null &&
        !isNaN(userLat) &&
        userLng !==
          null &&
        !isNaN(userLng)
      ) {
        result.sort(
          (a: any, b: any) =>
            (a.distance_km ??
              999) -
            (b.distance_km ??
              999)
        );
      }

      return res.json(
        result
      );

    } catch (err: any) {
      console.error(
        'Emergency resources error:',
        err
      );

      return res.json(
        db.emergency_resources ||
          []
      );
    }
  }
);

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

router.get(
  '/notifications',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const notifsList =
        db.notifications || [];

      const userNotifications =
        notifsList
          .filter(
            (n) =>
              n &&
              n.user_id ===
                req.user!.id
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at ||
                  0
              ).getTime() -
              new Date(
                a.created_at ||
                  0
              ).getTime()
          );

      return res.json(
        userNotifications
      );

    } catch (err: any) {
      console.error(
        'Get notifications error:',
        err
      );

      return res.json([]);
    }
  }
);

router.post(
  '/notifications/:id/read',
  authMiddleware,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const notifsList =
        db.notifications || [];

      const notif =
        notifsList.find(
          (n) =>
            n &&
            n.id ===
              req.params.id &&
            n.user_id ===
              req.user!.id
        );

      if (notif) {
        notif.read_at =
          new Date().toISOString();

        db.save();
      }

      return res.json({
        success: true,
      });

    } catch (err: any) {
      console.error(
        'Mark notification read error:',
        err
      );

      return res.json({
        success: true,
      });
    }
  }
);

// -------------------------------------------------------------
// AI ASSISTANT
// -------------------------------------------------------------

router.post(
  '/assistant/chat',
  authMiddleware,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        message,
        context,
      } = req.body || {};

      if (!message) {
        return res.status(400).json({
          error:
            'Message is required',
        });
      }

      const responseText =
        await askSafetyAssistant(
          message,
          context
        );

      return res.json({
        response:
          responseText,
      });

    } catch (err: any) {
      console.error(
        'Assistant API error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to process assistant request',
      });
    }
  }
);

// -------------------------------------------------------------
// ADMIN
// -------------------------------------------------------------

router.get(
  '/admin/stats',
  authMiddleware,
  roleGuard([
    'ADMIN',
    'SAFETY_OPERATOR',
  ]),
  (
    _req,
    res
  ) => {
    try {
      return res.json({
        total_users:
          (
            db.users || []
          ).length,

        active_journeys:
          (
            db.journeys || []
          ).filter(
            (j) =>
              j &&
              [
                'ACTIVE',
                'CHECKING_IN',
                'SOS_ACTIVE',
              ].includes(
                j.status
              )
          ).length,

        active_sos_alerts:
          (
            db.sos_events || []
          ).filter(
            (s) =>
              s &&
              s.status ===
                'ACTIVE'
          ).length,

        verified_resources:
          (
            db.emergency_resources ||
            []
          ).filter(
            (r) =>
              r &&
              r.is_verified
          ).length,

        total_contacts:
          (
            db.trusted_contacts ||
            []
          ).length,
      });

    } catch (err: any) {
      console.error(
        'Admin stats error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to load admin stats',
      });
    }
  }
);

router.get(
  '/admin/audit-logs',
  authMiddleware,
  roleGuard([
    'ADMIN',
  ]),
  (
    _req,
    res
  ) => {
    try {
      return res.json(
        (
          db.audit_logs ||
          []
        ).slice(0, 50)
      );

    } catch (err: any) {
      console.error(
        'Audit logs error:',
        err
      );

      return res.json([]);
    }
  }
);

router.get(
  '/admin/all-journeys',
  authMiddleware,
  roleGuard([
    'ADMIN',
    'SAFETY_OPERATOR',
  ]),
  (
    _req,
    res
  ) => {
    try {
      return res.json(
        db.journeys || []
      );

    } catch (err: any) {
      console.error(
        'All journeys error:',
        err
      );

      return res.json([]);
    }
  }
);

router.get(
  '/admin/all-sos',
  authMiddleware,
  roleGuard([
    'ADMIN',
    'SAFETY_OPERATOR',
  ]),
  (
    _req,
    res
  ) => {
    try {
      return res.json(
        db.sos_events || []
      );

    } catch (err: any) {
      console.error(
        'All SOS error:',
        err
      );

      return res.json([]);
    }
  }
);

// -------------------------------------------------------------
// MOUNT API
// -------------------------------------------------------------

app.use(
  '/api',
  router
);

// -------------------------------------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------------------------------------

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (
      res.headersSent
    ) {
      return next(err);
    }

    console.error(
      'Server unhandled error:',
      err
    );

    res.status(
      err?.status || 500
    ).json({
      error:
        err?.message ||
        'An internal server error occurred.',
    });
  }
);