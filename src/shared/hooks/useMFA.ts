/**
 * useMFA Hook
 * React hook for managing Multi-Factor Authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { mfaService } from '../api/mfaService';
import {
  UserMFASettings,
  MFAMethod,
  TOTPSetupData,
  MFAVerificationResult,
  BackupCodesResult,
} from '../lib/mfa';

export interface UseMFAOptions {
  userId: string;
  autoLoad?: boolean;
}

export interface UseMFAResult {
  // State
  settings: Partial<UserMFASettings> | null;
  isLoading: boolean;
  error: string | null;
  
  // TOTP
  totpSetupData: TOTPSetupData | null;
  isSettingUpTOTP: boolean;
  
  // Verification
  isVerifying: boolean;
  verificationResult: MFAVerificationResult | null;
  
  // Backup Codes
  backupCodes: BackupCodesResult | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  setupTOTP: (userEmail: string) => Promise<TOTPSetupData>;
  verifyTOTPSetup: (code: string) => Promise<boolean>;
  verifyMFA: (method: MFAMethod, code: string) => Promise<MFAVerificationResult>;
  generateBackupCodes: () => Promise<BackupCodesResult>;
  disableMethod: (method: MFAMethod) => Promise<boolean>;
  setPrimaryMethod: (method: MFAMethod) => Promise<boolean>;
  
  // Utilities
  isMFAEnabled: boolean;
  hasMethod: (method: MFAMethod) => boolean;
  clearError: () => void;
}

/**
 * Hook for managing MFA
 */
export const useMFA = (options: UseMFAOptions): UseMFAResult => {
  const { userId, autoLoad = true } = options;

  // State
  const [settings, setSettings] = useState<Partial<UserMFASettings> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [totpSetupData, setTotpSetupData] = useState<TOTPSetupData | null>(null);
  const [isSettingUpTOTP, setIsSettingUpTOTP] = useState(false);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<MFAVerificationResult | null>(null);
  
  const [backupCodes, setBackupCodes] = useState<BackupCodesResult | null>(null);

  // ==========================================
  // LOAD SETTINGS
  // ==========================================

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mfaService.getMFASettings(userId);
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load MFA settings';
      setError(errorMessage);
      console.error('Error loading MFA settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadSettings();
    }
  }, [autoLoad, loadSettings]);

  // ==========================================
  // TOTP SETUP
  // ==========================================

  const setupTOTP = useCallback(async (userEmail: string): Promise<TOTPSetupData> => {
    try {
      setIsSettingUpTOTP(true);
      setError(null);

      const data = await mfaService.setupTOTP(userId, userEmail);
      setTotpSetupData(data);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup TOTP';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSettingUpTOTP(false);
    }
  }, [userId]);

  const verifyTOTPSetup = useCallback(async (code: string): Promise<boolean> => {
    try {
      setIsVerifying(true);
      setError(null);

      const verified = await mfaService.verifyTOTPSetup(userId, code);

      if (verified) {
        // Reload settings
        await loadSettings();
        setTotpSetupData(null);
      }

      return verified;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify TOTP';
      setError(errorMessage);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [userId, loadSettings]);

  // ==========================================
  // MFA VERIFICATION
  // ==========================================

  const verifyMFA = useCallback(
    async (method: MFAMethod, code: string): Promise<MFAVerificationResult> => {
      try {
        setIsVerifying(true);
        setError(null);

        const result = await mfaService.verifyMFA(userId, method, code);
        setVerificationResult(result);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify MFA';
        setError(errorMessage);

        const errorResult: MFAVerificationResult = {
          success: false,
          verified: false,
          error: errorMessage,
        };

        setVerificationResult(errorResult);
        return errorResult;
      } finally {
        setIsVerifying(false);
      }
    },
    [userId]
  );

  // ==========================================
  // BACKUP CODES
  // ==========================================

  const generateBackupCodes = useCallback(async (): Promise<BackupCodesResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const codes = await mfaService.generateBackupCodes(userId);
      setBackupCodes(codes);

      return codes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate backup codes';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ==========================================
  // METHOD MANAGEMENT
  // ==========================================

  const disableMethod = useCallback(
    async (method: MFAMethod): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await mfaService.disableMethod(userId, method);

        if (success) {
          await loadSettings();
        }

        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to disable method';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, loadSettings]
  );

  const setPrimaryMethod = useCallback(
    async (method: MFAMethod): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await mfaService.setPrimaryMethod(userId, method);

        if (success) {
          await loadSettings();
        }

        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set primary method';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, loadSettings]
  );

  // ==========================================
  // UTILITIES
  // ==========================================

  const isMFAEnabled = Boolean(settings?.enabledMethods && settings.enabledMethods.length > 0);

  const hasMethod = useCallback(
    (method: MFAMethod): boolean => {
      return settings?.enabledMethods?.includes(method) || false;
    },
    [settings]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    settings,
    isLoading,
    error,
    
    totpSetupData,
    isSettingUpTOTP,
    
    isVerifying,
    verificationResult,
    
    backupCodes,
    
    loadSettings,
    setupTOTP,
    verifyTOTPSetup,
    verifyMFA,
    generateBackupCodes,
    disableMethod,
    setPrimaryMethod,
    
    isMFAEnabled,
    hasMethod,
    clearError,
  };
};

