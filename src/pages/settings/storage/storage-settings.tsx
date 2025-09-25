import React, { useState } from 'react';
import {
  Button,
  Title2,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Save24Regular,
} from '@fluentui/react-icons';
import { useStorageSettings } from '@/entities/storage/model/useStorageSettings';
import { useStorageValidation } from './hooks/useStorageValidation';
import { apiClient } from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';
import {
  StorageTypeSelector,
  SharePointCredentials,
  DeviceSelector,
  NetworkDeviceSelector,
  StorageAllocation,
  DataRetention,
  FolderStructure,
  TemplateManagerModal,
  NotEnoughSpaceModal,
  NavigationButtons,
} from './components';

export const StorageSettings = () => {
  const styles = useStyles();
  
  // Используем хук из entity
  const storageSettings = useStorageSettings();
  
  // Локальные состояния для модальных окон
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showNotEnoughSpace, setShowNotEnoughSpace] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedNetworkDevice, setSelectedNetworkDevice] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Validation
  const validation = useStorageValidation({
    storageType: storageSettings.storageType,
    sharePointEmail: storageSettings.sharePointEmail,
    sharePointPassword: storageSettings.sharePointPassword,
    connectionStatus: storageSettings.connectionStatus,
    deviceType: storageSettings.deviceType,
    selectedDeviceId: selectedNetworkDevice?.id,
    storageAmount: storageSettings.storageAmount,
    storageUnit: storageSettings.storageUnit,
    retentionPeriod: storageSettings.retentionPeriod,
    retentionUnit: storageSettings.retentionUnit,
    firmType: storageSettings.firmType,
    timeStructure: storageSettings.timeStructure,
    clientTypes: storageSettings.clientTypes,
    binderStructure: storageSettings.binderStructure,
  });

  // Обработчики для модальных окон
  const handleSaveTemplate = () => {
    if (newTemplateName.trim()) {
      storageSettings.saveCurrentAsTemplate(newTemplateName);
      setNewTemplateName('');
      setShowTemplateManager(false);
    }
  };

  const handleStorageAllocation = async () => {
    const amount = parseInt(storageSettings.storageAmount);
    try {
      // Try to allocate storage via API to check if there's enough space
      const response = await apiClient.post('/allocateStorage', {
        amount,
        unit: storageSettings.storageUnit,
        storageType: storageSettings.storageType,
      });

      if (!response.data.success && response.data.error === 'insufficient_space') {
        setShowNotEnoughSpace(true);
      }
    } catch (error: any) {
      if (error.response?.data?.error === 'insufficient_space') {
        setShowNotEnoughSpace(true);
      } else {
        console.error('Storage allocation check failed:', error);
      }
    }
  };

  // Save all storage settings
  const handleSaveSettings = async () => {
    if (!validation.isValid) {
      notificationService.warning(
        'Validation Failed',
        'Please fix all validation errors before saving.'
      );
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/saveStorageSettings', {
        storageType: storageSettings.storageType,
        sharePointEmail: storageSettings.sharePointEmail,
        connectionStatus: storageSettings.connectionStatus,
        deviceType: storageSettings.deviceType,
        selectedDeviceId: selectedNetworkDevice?.id,
        selectedDeviceName: selectedNetworkDevice?.name,
        storageAmount: storageSettings.storageAmount,
        storageUnit: storageSettings.storageUnit,
        retentionPeriod: storageSettings.retentionPeriod,
        retentionUnit: storageSettings.retentionUnit,
        firmType: storageSettings.firmType,
        selectedTemplate: storageSettings.selectedTemplate,
        timeStructure: storageSettings.timeStructure,
        clientTypes: storageSettings.clientTypes,
        binderStructure: storageSettings.binderStructure,
        customStructure: storageSettings.customStructure,
      });

      notificationService.success('Settings Saved', 'Storage settings have been saved successfully.');
    } catch (error: any) {
      console.error('Save failed:', error);
      notificationService.error(
        'Save Failed', 
        error.response?.data?.error || 'Failed to save storage settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Settings24Regular className={styles.brandIcon} />
          <Title2>Storage Settings</Title2>
        </div>
        <Button 
          appearance="primary" 
          icon={<Save24Regular />}
          onClick={handleSaveSettings}
          disabled={!validation.isValid || isSaving}
          style={{ backgroundColor: tokens.colorBrandBackground }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
            <div className={styles.leftColumn}>
              <StorageTypeSelector
                storageType={storageSettings.storageType}
                onStorageTypeChange={storageSettings.setStorageType}
              />

              {storageSettings.storageType === 'cloud' && (
                <SharePointCredentials
                  email={storageSettings.sharePointEmail}
                  password={storageSettings.sharePointPassword}
                  connectionStatus={storageSettings.connectionStatus}
                  onEmailChange={storageSettings.setSharePointEmail}
                  onPasswordChange={storageSettings.setSharePointPassword}
                  onVerify={storageSettings.handleVerifyCredentials}
                />
              )}

              {storageSettings.storageType === 'physical' && (
                <>
                  <DeviceSelector
                    deviceType={storageSettings.deviceType}
                    onDeviceTypeChange={storageSettings.setDeviceType}
                  />
                  
                  {storageSettings.deviceType === 'network' && (
                    <NetworkDeviceSelector
                      selectedDeviceId={selectedNetworkDevice?.id}
                      onDeviceSelect={setSelectedNetworkDevice}
                      isVisible={true}
                    />
                  )}
                </>
              )}

              {storageSettings.storageType && (
                <StorageAllocation
                  storageAmount={storageSettings.storageAmount}
                  storageUnit={storageSettings.storageUnit}
                  onStorageAmountChange={storageSettings.setStorageAmount}
                  onStorageUnitChange={storageSettings.setStorageUnit}
                  onStorageAllocation={handleStorageAllocation}
                />
              )}

              {storageSettings.storageType && (
                <DataRetention
                  retentionPeriod={storageSettings.retentionPeriod}
                  retentionUnit={storageSettings.retentionUnit}
                  onRetentionPeriodChange={storageSettings.setRetentionPeriod}
                  onRetentionUnitChange={storageSettings.setRetentionUnit}
                />
              )}

              <div className={styles.leftColumn}>
                {storageSettings.storageType && (
                  <FolderStructure
                    firmType={storageSettings.firmType}
                    selectedTemplate={storageSettings.selectedTemplate}
                    customStructure={storageSettings.customStructure}
                    timeStructure={storageSettings.timeStructure}
                    clientTypes={storageSettings.clientTypes}
                    newClientType={storageSettings.newClientType}
                    binderStructure={storageSettings.binderStructure}
                    previewStructure={storageSettings.previewStructure}
                    expandedSections={storageSettings.expandedSections}
                    customTemplates={storageSettings.customTemplates}
                    onFirmTypeChange={storageSettings.setFirmType}
                    onSelectedTemplateChange={storageSettings.setSelectedTemplate}
                    onCustomStructureChange={storageSettings.setCustomStructure}
                    onTimeStructureChange={storageSettings.setTimeStructure}
                    onClientTypesChange={storageSettings.setClientTypes}
                    onNewClientTypeChange={storageSettings.setNewClientType}
                    onBinderStructureChange={storageSettings.setBinderStructure}
                    onExpandedSectionsChange={storageSettings.setExpandedSections}
                    onAddClientType={storageSettings.addClientType}
                    onRemoveClientType={storageSettings.removeClientType}
                    onLoadTemplate={storageSettings.loadTemplate}
                    onSaveTemplate={() => setShowTemplateManager(true)}
                  />
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Modals */}
      <TemplateManagerModal
        isOpen={showTemplateManager}
        newTemplateName={newTemplateName}
        firmType={storageSettings.firmType}
        timeStructure={storageSettings.timeStructure}
        clientTypes={storageSettings.clientTypes}
        binderStructure={storageSettings.binderStructure}
        onNewTemplateNameChange={setNewTemplateName}
        onSaveTemplate={handleSaveTemplate}
        onClose={() => setShowTemplateManager(false)}
      />

      <NotEnoughSpaceModal
        isOpen={showNotEnoughSpace}
        requestedAmount={parseInt(storageSettings.storageAmount)}
        requestedUnit={storageSettings.storageUnit}
        availableAmount={1000}
        storageType={storageSettings.storageType}
        onClose={() => setShowNotEnoughSpace(false)}
        onEscalate={() => {
          console.log('Case escalated...');
          setShowNotEnoughSpace(false);
        }}
      />
    </div>
  );
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
  },
  header: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: tokens.shadow2,
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  brandIcon: {
    color: tokens.colorBrandForeground1,
  },
  mainContent: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalXL,
    '@media (max-width: 768px)': {
      padding: tokens.spacingHorizontalM,
    },
  },
  contentContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: tokens.spacingHorizontalXL,
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
      gap: tokens.spacingHorizontalL,
    },
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
});