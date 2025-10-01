/**
 * MFA API
 * Azure Functions for Multi-Factor Authentication
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../shared/db/cosmos';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const SetupTOTPRequestSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
});

const VerifyTOTPSetupSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
});

const SetupSMSRequestSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
});

const SetupEmailRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});

const VerifyMFARequestSchema = z.object({
  userId: z.string(),
  method: z.enum(['totp', 'sms', 'email', 'backup_code']),
  code: z.string(),
  sessionId: z.string().optional(),
});

const GenerateBackupCodesSchema = z.object({
  userId: z.string(),
});

// ==========================================
// TYPES
// ==========================================

interface MFASettingsDocument {
  id: string; // userId
  userId: string;
  status: 'disabled' | 'pending_setup' | 'active' | 'locked';
  enabledMethods: string[];
  primaryMethod?: string;
  
  totpEnabled: boolean;
  totpSecret?: string;
  totpVerified: boolean;
  totpBackupCodes?: string[];
  
  smsEnabled: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  
  emailEnabled: boolean;
  email?: string;
  emailVerified: boolean;
  
  authenticatorEnabled: boolean;
  
  failedAttempts: number;
  lockedUntil?: string;
  lastVerified?: string;
  
  createdAt: string;
  updatedAt: string;
  partitionKey: string; // tenantId
}

// ==========================================
// SETUP TOTP
// ==========================================

app.http('setupTOTP', {
  methods: ['POST'],
  authLevel: 'anonymous', // TODO: Change to function/admin in production
  route: 'mfa/totp/setup',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      ctx.log('Setting up TOTP...');

      const body = await req.json();
      const validationResult = SetupTOTPRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { userId, userEmail } = validationResult.data;

      // Generate TOTP secret
      const secret = generateTOTPSecret();
      const otpauthUrl = generateOTPAuthUrl(userId, userEmail, secret);
      const qrCodeUrl = await generateQRCodePlaceholder(otpauthUrl);
      const manualEntryKey = formatSecretForManual(secret);
      const backupCodes = generateBackupCodes();

      // Store in database
      const container = getContainer('mfa-settings');
      const tenantId = req.query.get('tenantId') || 'default';
      const now = new Date().toISOString();

      const mfaSettings: MFASettingsDocument = {
        id: userId,
        userId,
        status: 'pending_setup',
        enabledMethods: [],
        totpEnabled: false,
        totpSecret: secret, // TODO: Encrypt in production
        totpVerified: false,
        totpBackupCodes: backupCodes.map(hashCode),
        smsEnabled: false,
        phoneVerified: false,
        emailEnabled: false,
        emailVerified: false,
        authenticatorEnabled: false,
        failedAttempts: 0,
        createdAt: now,
        updatedAt: now,
        partitionKey: tenantId,
      };

      await container.items.upsert(mfaSettings);

      ctx.log(`TOTP setup initiated for user ${userId}`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          qrCodeUrl,
          manualEntryKey,
          backupCodes, // Show only once
        }),
      };
    } catch (error: any) {
      ctx.error('Error setting up TOTP:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to setup TOTP',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// VERIFY TOTP SETUP
// ==========================================

app.http('verifyTOTPSetup', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mfa/totp/verify-setup',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();
      const validationResult = VerifyTOTPSetupSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { userId, code } = validationResult.data;

      // Get MFA settings
      const container = getContainer('mfa-settings');
      const tenantId = req.query.get('tenantId') || 'default';

      const { resource: settings } = await container.item(userId, tenantId).read<MFASettingsDocument>();

      if (!settings || !settings.totpSecret) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'TOTP not set up' }),
        };
      }

      // Verify TOTP code
      const isValid = await verifyTOTPCode(settings.totpSecret, code);

      if (isValid) {
        // Update settings
        settings.totpEnabled = true;
        settings.totpVerified = true;
        settings.status = 'active';
        settings.enabledMethods = [...settings.enabledMethods, 'totp'];
        settings.primaryMethod = 'totp';
        settings.updatedAt = new Date().toISOString();

        await container.items.upsert(settings);

        ctx.log(`TOTP verified for user ${userId}`);

        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            verified: true,
          }),
        };
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          verified: false,
          error: 'Invalid code',
        }),
      };
    } catch (error: any) {
      ctx.error('Error verifying TOTP setup:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to verify TOTP setup',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// VERIFY MFA
// ==========================================

app.http('verifyMFA', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mfa/verify',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();
      const validationResult = VerifyMFARequestSchema.safeParse(body);

      if (!validationResult.success) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
          }),
        };
      }

      const { userId, method, code } = validationResult.data;

      // Get MFA settings
      const container = getContainer('mfa-settings');
      const tenantId = req.query.get('tenantId') || 'default';

      const { resource: settings } = await container.item(userId, tenantId).read<MFASettingsDocument>();

      if (!settings) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'MFA not configured' }),
        };
      }

      // Check if locked
      if (settings.lockedUntil && new Date() < new Date(settings.lockedUntil)) {
        return {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            verified: false,
            error: 'Account locked',
            lockedUntil: settings.lockedUntil,
          }),
        };
      }

      let verified = false;

      // Verify based on method
      switch (method) {
        case 'totp':
          if (!settings.totpEnabled || !settings.totpSecret) {
            return {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'TOTP not enabled' }),
            };
          }
          verified = await verifyTOTPCode(settings.totpSecret, code);
          break;

        // TODO: Implement SMS and Email verification
        case 'sms':
        case 'email':
          return {
            status: 501,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not implemented' }),
          };

        default:
          return {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid method' }),
          };
      }

      if (verified) {
        // Reset failed attempts
        settings.failedAttempts = 0;
        settings.lastVerified = new Date().toISOString();
        settings.updatedAt = new Date().toISOString();

        await container.items.upsert(settings);

        // Generate session token
        const sessionToken = generateSessionToken(userId);

        ctx.log(`MFA verified for user ${userId}`);

        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            verified: true,
            sessionToken,
          }),
        };
      }

      // Increment failed attempts
      settings.failedAttempts++;
      const attemptsRemaining = 3 - settings.failedAttempts;

      // Lock if too many attempts
      if (settings.failedAttempts >= 3) {
        settings.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        settings.status = 'locked';
      }

      settings.updatedAt = new Date().toISOString();
      await container.items.upsert(settings);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          verified: false,
          error: 'Invalid code',
          attemptsRemaining,
          lockedUntil: settings.lockedUntil,
        }),
      };
    } catch (error: any) {
      ctx.error('Error verifying MFA:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to verify MFA',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// GET MFA SETTINGS
// ==========================================

app.http('getMFASettings', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mfa/settings/{userId}',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User ID is required' }),
        };
      }

      const container = getContainer('mfa-settings');
      const tenantId = req.query.get('tenantId') || 'default';

      const { resource: settings } = await container.item(userId, tenantId).read<MFASettingsDocument>();

      if (!settings) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'MFA settings not found' }),
        };
      }

      // Remove sensitive data
      const { totpSecret, totpBackupCodes, ...safeSettings } = settings;

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeSettings),
      };
    } catch (error: any) {
      ctx.error('Error fetching MFA settings:', error);

      if (error.code === 404) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'MFA settings not found' }),
        };
      }

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch MFA settings',
          details: error.message,
        }),
      };
    }
  },
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateTOTPSecret(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < length; i++) {
    secret += charset[randomBytes[i] % charset.length];
  }

  return secret;
}

function generateOTPAuthUrl(userId: string, userEmail: string, secret: string): string {
  const issuer = 'FileSharing';
  const label = encodeURIComponent(`${issuer}:${userEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

async function generateQRCodePlaceholder(url: string): Promise<string> {
  // Placeholder - in production use QR code library
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><text x="10" y="128" font-family="monospace" font-size="10">${url.substring(0, 50)}...</text></svg>`
  ).toString('base64')}`;
}

function formatSecretForManual(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < count; i++) {
    let code = '';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);

    for (let j = 0; j < 8; j++) {
      code += charset[randomBytes[j] % charset.length];
    }

    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }

  return codes;
}

function hashCode(code: string): string {
  // Simple hash - in production use proper crypto
  const buffer = Buffer.from(code);
  return buffer.toString('base64');
}

async function verifyTOTPCode(secret: string, code: string): Promise<boolean> {
  // Simplified TOTP verification
  // In production, use proper TOTP library
  return code.length === 6 && /^\d{6}$/.test(code);
}

function generateSessionToken(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Buffer.from(random).toString('hex');
  
  return `mfa_${userId}_${timestamp}_${randomHex}`;
}

