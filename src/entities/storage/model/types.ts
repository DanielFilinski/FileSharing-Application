export interface Template {
  name: string;
  firmType: string;
  timeStructure: string;
  clientTypes: string[];
  binderStructure: string;
}

export interface PreviewStructure {
  "Period Structure": string[];
  "Client Types": string[];
  "Document Organization": Record<string, string[]>;
}

export interface StorageSettings {
  storageType: 'cloud' | 'physical';
  sharePointEmail: string;
  sharePointPassword: string;
  connectionStatus: '' | 'verifying' | 'established' | 'invalid';
  deviceType: string;
  storageAmount: string;
  storageUnit: 'MB' | 'GB';
  retentionPeriod: string;
  retentionUnit: 'days' | 'months' | 'years';
  firmType: string;
  selectedTemplate: string;
  customStructure: string;
  timeStructure: string;
  clientTypes: string[];
  newClientType: string;
  binderStructure: string;
  customTemplates: Template[];
  previewStructure: PreviewStructure | null;
  expandedSections: Record<string, boolean>;
}

export interface StorageSettingsActions {
  setStorageType: (type: 'cloud' | 'physical') => void;
  setSharePointEmail: (email: string) => void;
  setSharePointPassword: (password: string) => void;
  setConnectionStatus: (status: StorageSettings['connectionStatus']) => void;
  setDeviceType: (type: string) => void;
  setStorageAmount: (amount: string) => void;
  setStorageUnit: (unit: 'MB' | 'GB') => void;
  setRetentionPeriod: (period: string) => void;
  setRetentionUnit: (unit: 'days' | 'months' | 'years') => void;
  setFirmType: (type: string) => void;
  setSelectedTemplate: (template: string) => void;
  setCustomStructure: (structure: string) => void;
  setTimeStructure: (structure: string) => void;
  setClientTypes: (types: string[]) => void;
  setNewClientType: (type: string) => void;
  setBinderStructure: (structure: string) => void;
  setCustomTemplates: (templates: Template[]) => void;
  setPreviewStructure: (structure: PreviewStructure | null) => void;
  setExpandedSections: (sections: Record<string, boolean>) => void;
  toggleSection: (section: string) => void;
  addClientType: () => void;
  removeClientType: (index: number) => void;
  saveCurrentAsTemplate: (templateName: string) => void;
  loadTemplate: (templateKey: string) => void;
  handleVerifyCredentials: () => void;
  handleStorageAllocation: () => void;
} 