import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Title2,
  Body1,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Settings24Regular,
} from '@fluentui/react-icons';
import { useStorageSettings } from '@/entities/storage/model/useStorageSettings';
import { useStorageValidation, useStepValidation } from '../hooks/useStorageValidation';
import {
  StorageTypeSelector,
  SharePointCredentials,
  DeviceSelector,
  NetworkDeviceSelector,
  StorageAllocation,
  DataRetention,
  FolderStructure,
  NavigationButtons,
  NotEnoughSpaceModal,
} from './';
import { notificationService } from '@/shared/lib/notifications';
import { apiClient } from '@/shared/api';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isRequired: boolean;
}

interface SetupWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
}

const useStyles = makeStyles({
  wizardContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
  },
  header: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalXL,
  },
  stepCard: {
    maxWidth: '800px',
    margin: '0 auto',
    minHeight: '600px',
  },
  stepHeader: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  stepContent: {
    padding: tokens.spacingVerticalXL,
  },
});

export const SetupWizard: React.FC<SetupWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const styles = useStyles();
  const storageSettings = useStorageSettings();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showNotEnoughSpace, setShowNotEnoughSpace] = useState(false);
  const [selectedNetworkDevice, setSelectedNetworkDevice] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const { isStepValid, getStepProgress } = useStepValidation();
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

  // Define setup steps
  const steps: SetupStep[] = [
    {
      id: 'storage-type',
      title: 'Choose Storage Type',
      description: 'Select whether you want to use cloud storage (SharePoint) or physical storage devices.',
      isRequired: true,
      component: (
        <StorageTypeSelector
          storageType={storageSettings.storageType}
          onStorageTypeChange={storageSettings.setStorageType}
        />
      ),
    },
    {
      id: 'credentials',
      title: 'Configure Access',
      description: storageSettings.storageType === 'cloud' 
        ? 'Enter your SharePoint credentials and verify the connection.'
        : 'Select the storage device you want to use.',
      isRequired: true,
      component: storageSettings.storageType === 'cloud' ? (
        <SharePointCredentials
          email={storageSettings.sharePointEmail}
          password={storageSettings.sharePointPassword}
          connectionStatus={storageSettings.connectionStatus}
          onEmailChange={storageSettings.setSharePointEmail}
          onPasswordChange={storageSettings.setSharePointPassword}
          onVerify={storageSettings.handleVerifyCredentials}
        />
      ) : storageSettings.deviceType === 'network' ? (
        <NetworkDeviceSelector
          selectedDeviceId={selectedNetworkDevice?.id}
          onDeviceSelect={setSelectedNetworkDevice}
          isVisible={true}
        />
      ) : (
        <DeviceSelector
          deviceType={storageSettings.deviceType}
          onDeviceTypeChange={storageSettings.setDeviceType}
        />
      ),
    },
    {
      id: 'allocation',
      title: 'Set Storage Limits',
      description: 'Define how much storage space to allocate per client.',
      isRequired: true,
      component: (
        <StorageAllocation
          storageAmount={storageSettings.storageAmount}
          storageUnit={storageSettings.storageUnit}
          onStorageAmountChange={storageSettings.setStorageAmount}
          onStorageUnitChange={storageSettings.setStorageUnit}
          onStorageAllocation={() => {
            const amount = parseInt(storageSettings.storageAmount);
            if (amount > 1000) {
              setShowNotEnoughSpace(true);
            }
          }}
        />
      ),
    },
    {
      id: 'retention',
      title: 'Data Retention Policy',
      description: 'Set how long documents should be kept before automatic deletion.',
      isRequired: true,
      component: (
        <DataRetention
          retentionPeriod={storageSettings.retentionPeriod}
          retentionUnit={storageSettings.retentionUnit}
          onRetentionPeriodChange={storageSettings.setRetentionPeriod}
          onRetentionUnitChange={storageSettings.setRetentionUnit}
        />
      ),
    },
    {
      id: 'folder-structure',
      title: 'Organize Documents',
      description: 'Configure folder structure and document organization templates (optional).',
      isRequired: false,
      component: (
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
          onSaveTemplate={() => {}}
        />
      ),
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const canGoNext = isStepValid(currentStep.id, {
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

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Save settings via API
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

      notificationService.success(
        'Setup Complete!', 
        'Storage settings have been configured successfully.'
      );
      onComplete();
    } catch (error: any) {
      console.error('Setup completion failed:', error);
      notificationService.error(
        'Setup Failed', 
        error.response?.data?.error || 'Failed to save storage settings. Please try again.'
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className={styles.wizardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Settings24Regular style={{ color: tokens.colorBrandForeground1 }} />
          <Title2>Storage Setup Wizard</Title2>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <Card className={styles.stepCard}>
          <CardHeader>
            <div className={styles.stepHeader}>
              <Title2>{currentStep.title}</Title2>
              <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
                {currentStep.description}
              </Body1>
            </div>
          </CardHeader>

          <div className={styles.stepContent}>
            {currentStep.component}
          </div>

          {/* Navigation */}
          <NavigationButtons
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            isSetupMode={true}
            canGoNext={canGoNext}
            canGoBack={currentStepIndex > 0}
            isValid={canGoNext}
            isLoading={isCompleting}
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        </Card>
      </div>

      {/* Modals */}
      <NotEnoughSpaceModal
        isOpen={showNotEnoughSpace}
        requestedAmount={parseInt(storageSettings.storageAmount)}
        requestedUnit={storageSettings.storageUnit}
        availableAmount={1000}
        storageType={storageSettings.storageType}
        onClose={() => setShowNotEnoughSpace(false)}
        onEscalate={() => {
          console.log('Case escalated from setup wizard');
          setShowNotEnoughSpace(false);
        }}
      />
    </div>
  );
};
