import { useMemo } from 'react';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface StorageSettingsData {
  storageType: 'cloud' | 'physical';
  sharePointEmail: string;
  sharePointPassword: string;
  connectionStatus: '' | 'verifying' | 'established' | 'invalid';
  deviceType: string;
  selectedDeviceId?: string;
  storageAmount: string;
  storageUnit: 'MB' | 'GB';
  retentionPeriod: string;
  retentionUnit: 'days' | 'months' | 'years';
  firmType: string;
  timeStructure: string;
  clientTypes: string[];
  binderStructure: string;
}

/**
 * Custom hook for validating storage settings
 * Provides comprehensive validation logic for all storage configuration steps
 */
export const useStorageValidation = (settings: StorageSettingsData) => {
  const validationResults = useMemo(() => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate storage type selection
    if (!settings.storageType) {
      errors.push({
        field: 'storageType',
        message: 'Please select a storage type (Cloud or Physical)',
        severity: 'error'
      });
    }

    // Validate cloud storage settings
    if (settings.storageType === 'cloud') {
      // Email validation
      if (!settings.sharePointEmail) {
        errors.push({
          field: 'sharePointEmail',
          message: 'SharePoint email is required for cloud storage',
          severity: 'error'
        });
      } else if (!isValidEmail(settings.sharePointEmail)) {
        errors.push({
          field: 'sharePointEmail',
          message: 'Please enter a valid email address',
          severity: 'error'
        });
      }

      // Password validation
      if (!settings.sharePointPassword) {
        errors.push({
          field: 'sharePointPassword',
          message: 'SharePoint password is required',
          severity: 'error'
        });
      } else if (settings.sharePointPassword.length < 8) {
        warnings.push({
          field: 'sharePointPassword',
          message: 'Password should be at least 8 characters long',
          severity: 'warning'
        });
      }

      // Connection verification
      if (settings.connectionStatus === 'invalid') {
        errors.push({
          field: 'connection',
          message: 'SharePoint connection failed. Please verify your credentials',
          severity: 'error'
        });
      } else if (settings.connectionStatus === '' || settings.connectionStatus === 'verifying') {
        warnings.push({
          field: 'connection',
          message: 'Please verify your SharePoint connection before proceeding',
          severity: 'warning'
        });
      }
    }

    // Validate physical storage settings
    if (settings.storageType === 'physical') {
      if (!settings.deviceType) {
        errors.push({
          field: 'deviceType',
          message: 'Please select a device type for physical storage',
          severity: 'error'
        });
      }

      // Network device selection validation
      if (settings.deviceType === 'network' && !settings.selectedDeviceId) {
        errors.push({
          field: 'selectedDeviceId',
          message: 'Please select a network device for storage',
          severity: 'error'
        });
      }
    }

    // Validate storage allocation
    const storageAmount = parseInt(settings.storageAmount);
    if (!settings.storageAmount) {
      errors.push({
        field: 'storageAmount',
        message: 'Storage amount is required',
        severity: 'error'
      });
    } else if (isNaN(storageAmount) || storageAmount <= 0) {
      errors.push({
        field: 'storageAmount',
        message: 'Storage amount must be a positive number',
        severity: 'error'
      });
    } else {
      // Check storage amount limits
      const maxAllowedGB = 1000;
      const amountInGB = settings.storageUnit === 'MB' ? storageAmount / 1024 : storageAmount;
      
      if (amountInGB > maxAllowedGB) {
        errors.push({
          field: 'storageAmount',
          message: `Storage amount cannot exceed ${maxAllowedGB}GB`,
          severity: 'error'
        });
      } else if (amountInGB < 1) {
        warnings.push({
          field: 'storageAmount',
          message: 'Storage amount is very small. Consider increasing allocation',
          severity: 'warning'
        });
      }
    }

    // Validate storage unit
    if (!settings.storageUnit || !['MB', 'GB'].includes(settings.storageUnit)) {
      errors.push({
        field: 'storageUnit',
        message: 'Please select a valid storage unit (MB or GB)',
        severity: 'error'
      });
    }

    // Validate data retention settings
    if (!settings.retentionPeriod) {
      errors.push({
        field: 'retentionPeriod',
        message: 'Data retention period is required',
        severity: 'error'
      });
    } else if (settings.retentionPeriod === 'custom') {
      // Custom retention period validation would go here
      // This would require additional fields for custom period input
    }

    if (!settings.retentionUnit || !['days', 'months', 'years'].includes(settings.retentionUnit)) {
      errors.push({
        field: 'retentionUnit',
        message: 'Please select a valid retention unit',
        severity: 'error'
      });
    }

    // Validate folder structure settings
    if (!settings.firmType) {
      warnings.push({
        field: 'firmType',
        message: 'Consider selecting a firm type for better folder organization',
        severity: 'warning'
      });
    }

    if (settings.clientTypes.length === 0) {
      warnings.push({
        field: 'clientTypes',
        message: 'Adding client types will help organize documents better',
        severity: 'warning'
      });
    }

    // Check for potential configuration conflicts
    if (settings.storageType === 'cloud' && settings.connectionStatus === 'established') {
      // Additional cloud-specific validations
      if (settings.sharePointEmail && !settings.sharePointEmail.includes('@')) {
        errors.push({
          field: 'sharePointEmail',
          message: 'Invalid email format',
          severity: 'error'
        });
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      allIssues: [...errors, ...warnings]
    };
  }, [settings]);

  return validationResults;
};

/**
 * Validates individual field values
 */
export const useFieldValidation = () => {
  const validateField = (fieldName: string, value: any, settings?: StorageSettingsData) => {
    const errors: ValidationError[] = [];

    switch (fieldName) {
      case 'sharePointEmail':
        if (!value) {
          errors.push({
            field: fieldName,
            message: 'Email is required',
            severity: 'error'
          });
        } else if (!isValidEmail(value)) {
          errors.push({
            field: fieldName,
            message: 'Invalid email format',
            severity: 'error'
          });
        }
        break;

      case 'sharePointPassword':
        if (!value) {
          errors.push({
            field: fieldName,
            message: 'Password is required',
            severity: 'error'
          });
        } else if (value.length < 8) {
          errors.push({
            field: fieldName,
            message: 'Password should be at least 8 characters',
            severity: 'warning'
          });
        }
        break;

      case 'storageAmount':
        const amount = parseInt(value);
        if (!value) {
          errors.push({
            field: fieldName,
            message: 'Amount is required',
            severity: 'error'
          });
        } else if (isNaN(amount) || amount <= 0) {
          errors.push({
            field: fieldName,
            message: 'Must be a positive number',
            severity: 'error'
          });
        }
        break;

      default:
        break;
    }

    return {
      errors,
      isValid: errors.length === 0,
      hasWarnings: errors.some(e => e.severity === 'warning')
    };
  };

  return { validateField };
};

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to check if settings are complete for a specific step
 */
export const useStepValidation = () => {
  const isStepValid = (stepName: string, settings: StorageSettingsData): boolean => {
    switch (stepName) {
      case 'storage-type':
        return !!settings.storageType;
        
      case 'credentials':
        if (settings.storageType === 'cloud') {
          return !!(settings.sharePointEmail && 
                   settings.sharePointPassword && 
                   settings.connectionStatus === 'established');
        } else if (settings.storageType === 'physical') {
          return !!settings.deviceType && 
                 (settings.deviceType === 'current' || !!settings.selectedDeviceId);
        }
        return false;
        
      case 'allocation':
        return !!(settings.storageAmount && 
                 settings.storageUnit && 
                 parseInt(settings.storageAmount) > 0);
        
      case 'retention':
        return !!(settings.retentionPeriod && settings.retentionUnit);
        
      case 'folder-structure':
        return true; // Optional step
        
      default:
        return false;
    }
  };

  const getStepProgress = (settings: StorageSettingsData) => {
    const steps = ['storage-type', 'credentials', 'allocation', 'retention', 'folder-structure'];
    const completedSteps = steps.filter(step => isStepValid(step, settings));
    
    return {
      completed: completedSteps.length,
      total: steps.length,
      percentage: Math.round((completedSteps.length / steps.length) * 100)
    };
  };

  return { isStepValid, getStepProgress };
};
