/**
 * Key Rotation Service
 * Manages automatic rotation of encryption keys for security
 */

import { e2eeManager } from './e2eeManager';
import { keyManagementService } from './keyManagementService';
import { e2eeCryptoService } from './e2eeCryptoService';
import { KeyRotationResult, E2EEConfig, DEFAULT_E2EE_CONFIG } from './types';

export interface KeyRotationSchedule {
  chatId: string;
  lastRotation: Date;
  nextRotation: Date;
  rotationIntervalDays: number;
  autoRotate: boolean;
}

export interface KeyRotationStatus {
  isRotating: boolean;
  currentRotations: Map<string, Date>;
  scheduledRotations: KeyRotationSchedule[];
  lastError?: string;
}

export class KeyRotationService {
  private config: E2EEConfig;
  private schedules: Map<string, KeyRotationSchedule> = new Map();
  private rotationInProgress: Set<string> = new Set();
  private rotationTimer: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 1000 * 60 * 60; // Check every hour

  constructor(config?: Partial<E2EEConfig>) {
    this.config = { ...DEFAULT_E2EE_CONFIG, ...config };
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Start automatic key rotation service
   */
  start(): void {
    if (this.rotationTimer) {
      console.warn('Key rotation service already running');
      return;
    }

    console.log('Starting key rotation service...');
    
    // Initial check
    this.checkScheduledRotations();

    // Schedule periodic checks
    this.rotationTimer = setInterval(() => {
      this.checkScheduledRotations();
    }, this.checkIntervalMs);
  }

  /**
   * Stop automatic key rotation service
   */
  stop(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('Key rotation service stopped');
    }
  }

  // ==========================================
  // SCHEDULE MANAGEMENT
  // ==========================================

  /**
   * Schedule key rotation for a chat
   */
  scheduleRotation(
    chatId: string,
    intervalDays?: number,
    autoRotate: boolean = true
  ): KeyRotationSchedule {
    const rotationIntervalDays = intervalDays || this.config.sessionKeyRotationDays;
    const now = new Date();
    const nextRotation = new Date(now.getTime() + rotationIntervalDays * 24 * 60 * 60 * 1000);

    const schedule: KeyRotationSchedule = {
      chatId,
      lastRotation: now,
      nextRotation,
      rotationIntervalDays,
      autoRotate,
    };

    this.schedules.set(chatId, schedule);
    console.log(`Scheduled key rotation for chat ${chatId}:`, schedule);

    return schedule;
  }

  /**
   * Cancel scheduled rotation for a chat
   */
  cancelRotation(chatId: string): boolean {
    const deleted = this.schedules.delete(chatId);
    if (deleted) {
      console.log(`Cancelled key rotation for chat ${chatId}`);
    }
    return deleted;
  }

  /**
   * Get rotation schedule for a chat
   */
  getSchedule(chatId: string): KeyRotationSchedule | null {
    return this.schedules.get(chatId) || null;
  }

  /**
   * Get all scheduled rotations
   */
  getAllSchedules(): KeyRotationSchedule[] {
    return Array.from(this.schedules.values());
  }

  // ==========================================
  // KEY ROTATION
  // ==========================================

  /**
   * Check and execute scheduled rotations
   */
  private async checkScheduledRotations(): Promise<void> {
    const now = new Date();

    for (const [chatId, schedule] of this.schedules.entries()) {
      // Skip if rotation is already in progress
      if (this.rotationInProgress.has(chatId)) {
        continue;
      }

      // Check if rotation is due
      if (schedule.autoRotate && schedule.nextRotation <= now) {
        console.log(`Auto-rotating key for chat ${chatId}`);
        await this.rotateSessionKey(chatId);
      }
    }
  }

  /**
   * Rotate session key for a chat
   */
  async rotateSessionKey(chatId: string): Promise<KeyRotationResult> {
    // Check if rotation already in progress
    if (this.rotationInProgress.has(chatId)) {
      return {
        success: false,
        oldKeyId: 'unknown',
        newKeyId: 'unknown',
        rotatedAt: new Date(),
        error: 'Rotation already in progress',
      };
    }

    this.rotationInProgress.add(chatId);

    try {
      console.log(`Starting key rotation for chat ${chatId}...`);

      // Get current session key
      const oldKey = await keyManagementService.getSessionKey(chatId);
      const oldKeyId = e2eeManager.getChatStatus(chatId)?.sessionKeyId || 'unknown';

      // Generate new session key
      const newSessionKey = await e2eeCryptoService.generateSessionKey();

      // Store new session key
      await keyManagementService.storeSessionKey(chatId, newSessionKey);

      // Update E2EE status
      const status = e2eeManager.getChatStatus(chatId);
      if (status) {
        status.sessionKeyId = newSessionKey.keyId;
        status.lastKeyRotation = new Date();
        status.nextKeyRotation = newSessionKey.expiresAt;
      }

      // Update schedule
      const schedule = this.schedules.get(chatId);
      if (schedule) {
        schedule.lastRotation = new Date();
        schedule.nextRotation = new Date(
          Date.now() + schedule.rotationIntervalDays * 24 * 60 * 60 * 1000
        );
      }

      console.log(`Key rotation completed for chat ${chatId}`);

      return {
        success: true,
        oldKeyId,
        newKeyId: newSessionKey.keyId,
        rotatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Key rotation failed for chat ${chatId}:`, error);

      return {
        success: false,
        oldKeyId: 'unknown',
        newKeyId: 'unknown',
        rotatedAt: new Date(),
        error: error instanceof Error ? error.message : 'Key rotation failed',
      };
    } finally {
      this.rotationInProgress.delete(chatId);
    }
  }

  /**
   * Force immediate key rotation for a chat
   */
  async forceRotation(chatId: string): Promise<KeyRotationResult> {
    console.log(`Force rotating key for chat ${chatId}`);
    return await this.rotateSessionKey(chatId);
  }

  // ==========================================
  // STATUS & UTILITIES
  // ==========================================

  /**
   * Get rotation status for all chats
   */
  getStatus(): KeyRotationStatus {
    const currentRotations = new Map<string, Date>();
    
    for (const chatId of this.rotationInProgress) {
      currentRotations.set(chatId, new Date());
    }

    return {
      isRotating: this.rotationInProgress.size > 0,
      currentRotations,
      scheduledRotations: this.getAllSchedules(),
    };
  }

  /**
   * Check if key rotation is due for a chat
   */
  isRotationDue(chatId: string): boolean {
    const schedule = this.schedules.get(chatId);
    if (!schedule) {
      return false;
    }

    return schedule.nextRotation <= new Date();
  }

  /**
   * Get time until next rotation
   */
  getTimeUntilNextRotation(chatId: string): number | null {
    const schedule = this.schedules.get(chatId);
    if (!schedule) {
      return null;
    }

    const now = new Date();
    const timeUntil = schedule.nextRotation.getTime() - now.getTime();
    return Math.max(0, timeUntil);
  }

  /**
   * Update rotation interval for a chat
   */
  updateRotationInterval(chatId: string, intervalDays: number): boolean {
    const schedule = this.schedules.get(chatId);
    if (!schedule) {
      return false;
    }

    schedule.rotationIntervalDays = intervalDays;
    schedule.nextRotation = new Date(
      schedule.lastRotation.getTime() + intervalDays * 24 * 60 * 60 * 1000
    );

    console.log(`Updated rotation interval for chat ${chatId} to ${intervalDays} days`);
    return true;
  }

  /**
   * Enable/disable auto-rotation for a chat
   */
  setAutoRotation(chatId: string, autoRotate: boolean): boolean {
    const schedule = this.schedules.get(chatId);
    if (!schedule) {
      return false;
    }

    schedule.autoRotate = autoRotate;
    console.log(`${autoRotate ? 'Enabled' : 'Disabled'} auto-rotation for chat ${chatId}`);
    return true;
  }

  /**
   * Cleanup - remove all schedules and stop service
   */
  cleanup(): void {
    this.stop();
    this.schedules.clear();
    this.rotationInProgress.clear();
    console.log('Key rotation service cleaned up');
  }
}

// Export singleton instance
export const keyRotationService = new KeyRotationService();

