/**
 * ChatSettings - component for chat settings
 * Allows managing various chat and notification parameters
 */

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Toggle,
  Dropdown,
  IDropdownOption,
  Slider,
  SpinButton,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Separator,
  ChoiceGroup,
  IChoiceGroupOption,
  TextField,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { ChatThreadSettings } from '../../shared/types/chat';
import { chatApi } from '../../shared/api/chatApi';

export interface ChatSettingsProps {
  threadId: string;
  settings: ChatThreadSettings;
  onSettingsUpdate?: (settings: ChatThreadSettings) => void;
  readonly?: boolean;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  threadId,
  settings: initialSettings,
  onSettingsUpdate,
  readonly = false
}) => {
  // State
  const [settings, setSettings] = useState<ChatThreadSettings>(initialSettings);
  const [originalSettings, setOriginalSettings] = useState<ChatThreadSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    setSettings(initialSettings);
    setOriginalSettings(initialSettings);
    setHasUnsavedChanges(false);
  }, [initialSettings]);

  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

  // ==========================================
  // Event Handlers
  // ==========================================

  const updateSetting = <K extends keyof ChatThreadSettings>(
    key: K,
    value: ChatThreadSettings[K]
  ) => {
    if (!readonly) {
      setSettings(prev => ({ ...prev, [key]: value }));
      setError(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!hasUnsavedChanges || readonly) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedSettings = await chatApi.updateThreadSettings(threadId, settings);
      
      setOriginalSettings(updatedSettings.settings);
      setHasUnsavedChanges(false);
      setSuccessMessage('Settings saved successfully');
      
      onSettingsUpdate?.(updatedSettings.settings);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (!readonly) {
      setSettings(originalSettings);
      setError(null);
    }
  };

  // ==========================================
  // Dropdown Options
  // ==========================================

  const getThemeOptions = (): IDropdownOption[] => [
    { key: 'light', text: 'Light' },
    { key: 'dark', text: 'Dark' },
    { key: 'auto', text: 'Auto (System)' }
  ];

  const getTimestampFormatOptions = (): IChoiceGroupOption[] => [
    { key: '12h', text: '12-hour (2:30 PM)' },
    { key: '24h', text: '24-hour (14:30)' }
  ];

  const getDateFormatOptions = (): IChoiceGroupOption[] => [
    { key: 'relative', text: 'Relative (2 minutes ago)' },
    { key: 'absolute', text: 'Absolute (Dec 25, 2023)' }
  ];

  const getRetentionOptions = (): IDropdownOption[] => [
    { key: 30, text: '30 days' },
    { key: 90, text: '90 days' },
    { key: 180, text: '6 months' },
    { key: 365, text: '1 year' },
    { key: 730, text: '2 years' },
    { key: -1, text: 'Never' }
  ];

  // ==========================================
  // Render Sections
  // ==========================================

  const renderGeneralSettings = () => (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="medium" weight="semibold">
        General Settings
      </Text>

      <Toggle
        label="Allow Fragment Highlighting"
        checked={settings.allowFragmentHighlighting}
        onChange={(_, checked) => updateSetting('allowFragmentHighlighting', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Allow File Attachments"
        checked={settings.allowFileAttachments}
        onChange={(_, checked) => updateSetting('allowFileAttachments', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Allow Message Editing"
        checked={settings.allowMessageEditing}
        onChange={(_, checked) => updateSetting('allowMessageEditing', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Allow Message Deletion"
        checked={settings.allowMessageDeletion}
        onChange={(_, checked) => updateSetting('allowMessageDeletion', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Allow Reactions"
        checked={settings.allowReactions}
        onChange={(_, checked) => updateSetting('allowReactions', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Group Similar Messages"
        checked={settings.messageGrouping}
        onChange={(_, checked) => updateSetting('messageGrouping', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />
    </Stack>
  );

  const renderNotificationSettings = () => (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="medium" weight="semibold">
        Notifications
      </Text>

      <Toggle
        label="Enable Notifications"
        checked={settings.notificationsEnabled}
        onChange={(_, checked) => updateSetting('notificationsEnabled', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      {settings.notificationsEnabled && (
        <Stack tokens={{ childrenGap: 12 }}>
          <Toggle
            label="Notification Sound"
            checked={settings.notificationSound}
            onChange={(_, checked) => updateSetting('notificationSound', !!checked)}
            disabled={readonly}
            onText="Enabled"
            offText="Disabled"
          />

          <Toggle
            label="Desktop Notifications"
            checked={settings.desktopNotifications}
            onChange={(_, checked) => updateSetting('desktopNotifications', !!checked)}
            disabled={readonly}
            onText="Enabled"
            offText="Disabled"
          />

          <Toggle
            label="Email Notifications"
            checked={settings.emailNotifications}
            onChange={(_, checked) => updateSetting('emailNotifications', !!checked)}
            disabled={readonly}
            onText="Enabled"
            offText="Disabled"
          />
        </Stack>
      )}

      <Separator />

      <Text variant="small" weight="semibold">
        Workflow Notifications
      </Text>

      <Toggle
        label="Workflow Status Changes"
        checked={settings.workflowNotifications}
        onChange={(_, checked) => updateSetting('workflowNotifications', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Document Status Updates"
        checked={settings.documentStatusUpdates}
        onChange={(_, checked) => updateSetting('documentStatusUpdates', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Deadline Reminders"
        checked={settings.deadlineReminders}
        onChange={(_, checked) => updateSetting('deadlineReminders', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />
    </Stack>
  );

  const renderAppearanceSettings = () => (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="medium" weight="semibold">
        Appearance
      </Text>

      <Dropdown
        label="Theme"
        selectedKey={settings.theme}
        options={getThemeOptions()}
        onChange={(_, option) => updateSetting('theme', option?.key as any)}
        disabled={readonly}
      />

      <ChoiceGroup
        label="Timestamp Format"
        selectedKey={settings.timestampFormat}
        options={getTimestampFormatOptions()}
        onChange={(_, option) => updateSetting('timestampFormat', option?.key as any)}
        disabled={readonly}
      />

      <ChoiceGroup
        label="Date Format"
        selectedKey={settings.dateFormat}
        options={getDateFormatOptions()}
        onChange={(_, option) => updateSetting('dateFormat', option?.key as any)}
        disabled={readonly}
      />
    </Stack>
  );

  const renderDataRetentionSettings = () => (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="medium" weight="semibold">
        Data & Privacy
      </Text>

      <Toggle
        label="End-to-End Encryption"
        checked={settings.encryptionEnabled}
        onChange={(_, checked) => updateSetting('encryptionEnabled', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Toggle
        label="Compliance Mode"
        checked={settings.complianceMode}
        onChange={(_, checked) => updateSetting('complianceMode', !!checked)}
        disabled={readonly}
        onText="Enabled"
        offText="Disabled"
      />

      <Dropdown
        label="Message Retention"
        selectedKey={settings.retentionDays}
        options={getRetentionOptions()}
        onChange={(_, option) => updateSetting('retentionDays', option?.key as number)}
        disabled={readonly}
      />

      <Toggle
        label="Auto-Delete Old Messages"
        checked={settings.autoDeleteEnabled}
        onChange={(_, checked) => updateSetting('autoDeleteEnabled', !!checked)}
        disabled={readonly || settings.retentionDays === -1}
        onText="Enabled"
        offText="Disabled"
      />

      {settings.complianceMode && (
        <MessageBar messageBarType={MessageBarType.info}>
          Compliance mode enables additional security features and audit logging.
          Some features may be restricted when compliance mode is enabled.
        </MessageBar>
      )}
    </Stack>
  );

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      {/* Messages */}
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
        >
          {error}
        </MessageBar>
      )}

      {successMessage && (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={() => setSuccessMessage(null)}
        >
          {successMessage}
        </MessageBar>
      )}

      {/* Settings Sections */}
      {renderGeneralSettings()}
      <Separator />
      {renderNotificationSettings()}
      <Separator />
      {renderAppearanceSettings()}
      <Separator />
      {renderDataRetentionSettings()}

      {/* Action Buttons */}
      {!readonly && (
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <DefaultButton
            text="Reset"
            onClick={handleResetSettings}
            disabled={!hasUnsavedChanges || isLoading}
          />
          <PrimaryButton
            text={isLoading ? 'Saving...' : 'Save Settings'}
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges || isLoading}
          >
            {isLoading && <Spinner size={SpinnerSize.xSmall} styles={{ root: { marginLeft: '8px' } }} />}
          </PrimaryButton>
        </Stack>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && !readonly && (
        <MessageBar messageBarType={MessageBarType.warning}>
          You have unsaved changes. Make sure to save your settings before leaving this page.
        </MessageBar>
      )}
    </Stack>
  );
};
