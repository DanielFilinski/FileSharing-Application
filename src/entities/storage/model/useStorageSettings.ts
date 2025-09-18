import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';
import { Template, PreviewStructure, StorageSettings, StorageSettingsActions } from './types';

const defaultTemplates: Record<string, Template> = {
  accounting: {
    name: "Accounting Firm Template",
    firmType: "accounting",
    timeStructure: "tax-year",
    clientTypes: ["Tax Client", "Audit Client", "Consulting"],
    binderStructure: "numerical"
  },
  legal: {
    name: "Legal Firm Template",
    firmType: "legal",
    timeStructure: "quarterly",
    clientTypes: ["Corporate", "Individual", "Litigation", "Real Estate"],
    binderStructure: "alphabetical"
  },
  consulting: {
    name: "Consulting Firm Template",
    firmType: "consulting",
    timeStructure: "monthly",
    clientTypes: ["Strategy", "Operations", "Technology", "HR"],
    binderStructure: "custom"
  }
};

const generatePeriodStructure = (type: string): string[] => {
  switch(type) {
    case 'tax-year':
      return ['Tax Year 2025', 'Tax Year 2024', 'Tax Year 2023'];
    case 'quarterly':
      return ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
    case 'monthly':
      return ['January 2025', 'February 2025', 'March 2025', 'April 2025'];
    case 'custom-date':
      return ['Custom Period 1', 'Custom Period 2'];
    default:
      return [];
  }
};

const generateBinderStructure = (type: string, firmType: string): Record<string, string[]> => {
  if (firmType === 'accounting') {
    if (type === 'numerical') {
      return {
        "1000 - General/Assets": ["1000.01 - Cash", "1000.02 - Accounts Receivable", "1000.03 - Inventory"],
        "2000 - Liabilities": ["2000.01 - Accounts Payable", "2000.02 - Accrued Expenses"],
        "3000 - Equity": ["3000.01 - Owner's Equity", "3000.02 - Retained Earnings"]
      };
    }
  } else if (firmType === 'legal') {
    if (type === 'alphabetical') {
      return {
        "A - Planning Documents": ["A.1 - Initial Consultation", "A.2 - Case Strategy"],
        "B - Deliverables": ["B.1 - Contracts", "B.2 - Court Filings"],
        "C - Research": ["C.1 - Legal Research", "C.2 - Case Law"]
      };
    }
  } else if (firmType === 'consulting') {
    return {
      "01 - Discovery": ["Requirements", "Stakeholder Analysis"],
      "02 - Analysis": ["Current State", "Gap Analysis"],
      "03 - Recommendations": ["Proposals", "Implementation Plan"]
    };
  }
  return {};
};

export const useStorageSettings = (): StorageSettings & StorageSettingsActions => {
  const [storageType, setStorageType] = useState<'cloud' | 'physical'>('cloud');
  const [sharePointEmail, setSharePointEmail] = useState('');
  const [sharePointPassword, setSharePointPassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<StorageSettings['connectionStatus']>('');
  const [deviceType, setDeviceType] = useState('');
  const [storageAmount, setStorageAmount] = useState('');
  const [storageUnit, setStorageUnit] = useState<'MB' | 'GB'>('GB');
  const [retentionPeriod, setRetentionPeriod] = useState('');
  const [retentionUnit, setRetentionUnit] = useState<'days' | 'months' | 'years'>('months');
  const [firmType, setFirmType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customStructure, setCustomStructure] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [timeStructure, setTimeStructure] = useState('tax-year');
  const [clientTypes, setClientTypes] = useState(['Tax Client', 'Audit Client']);
  const [newClientType, setNewClientType] = useState('');
  const [binderStructure, setBinderStructure] = useState('numerical');
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [previewStructure, setPreviewStructure] = useState<PreviewStructure | null>(null);

  useEffect(() => {
    if (firmType && timeStructure && clientTypes.length > 0) {
      const structure: PreviewStructure = {
        "Period Structure": generatePeriodStructure(timeStructure),
        "Client Types": clientTypes,
        "Document Organization": generateBinderStructure(binderStructure, firmType)
      };
      setPreviewStructure(structure);
    }
  }, [firmType, timeStructure, clientTypes, binderStructure]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addClientType = () => {
    if (newClientType.trim() && !clientTypes.includes(newClientType.trim())) {
      setClientTypes([...clientTypes, newClientType.trim()]);
      setNewClientType('');
    }
  };

  const removeClientType = (index: number) => {
    setClientTypes(clientTypes.filter((_, i) => i !== index));
  };

  const saveCurrentAsTemplate = (templateName: string) => {
    if (templateName.trim()) {
      const newTemplate: Template = {
        name: templateName,
        firmType,
        timeStructure,
        clientTypes: [...clientTypes],
        binderStructure
      };
      setCustomTemplates([...customTemplates, newTemplate]);
    }
  };

  const loadTemplate = (templateKey: string) => {
    const template = defaultTemplates[templateKey] || customTemplates.find(t => t.name === templateKey);
    if (template) {
      setFirmType(template.firmType);
      setTimeStructure(template.timeStructure);
      setClientTypes(template.clientTypes);
      setBinderStructure(template.binderStructure);
    }
  };

  const handleVerifyCredentials = async () => {
    if (!sharePointEmail || !sharePointPassword) {
      setConnectionStatus('invalid');
      return;
    }

    setConnectionStatus('verifying');
    try {
      const res = await apiClient.post<{ status: 'ok' | 'fail' }>(
        '/storage/verify-credentials',
        { email: sharePointEmail, password: sharePointPassword }
      );
      if (res.data.status === 'ok') {
        setConnectionStatus('established');
        notificationService.success('Подключено', 'Доступ к SharePoint проверен');
      } else {
        setConnectionStatus('invalid');
        notificationService.error('Ошибка доступа', 'Неверные учетные данные');
      }
    } catch (error) {
      setConnectionStatus('invalid');
      notificationService.showApiError(error, 'Ошибка проверки доступа');
    }
  };

  const handleStorageAllocation = async () => {
    const amount = parseInt(storageAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      notificationService.warning('Некорректный объем', 'Укажите положительное число');
      return;
    }

    try {
      await apiClient.post('/storage/allocate', {
        amount,
        unit: storageUnit,
      });
      notificationService.success('Распределено', `Выделено ${amount} ${storageUnit}`);
    } catch (error) {
      notificationService.showApiError(error, 'Не удалось распределить хранилище');
    }
  };

  return {
    // State
    storageType,
    sharePointEmail,
    sharePointPassword,
    connectionStatus,
    deviceType,
    storageAmount,
    storageUnit,
    retentionPeriod,
    retentionUnit,
    firmType,
    selectedTemplate,
    customStructure,
    expandedSections,
    timeStructure,
    clientTypes,
    newClientType,
    binderStructure,
    customTemplates,
    previewStructure,
    
    // Actions
    setStorageType,
    setSharePointEmail,
    setSharePointPassword,
    setConnectionStatus,
    setDeviceType,
    setStorageAmount,
    setStorageUnit,
    setRetentionPeriod,
    setRetentionUnit,
    setFirmType,
    setSelectedTemplate,
    setCustomStructure,
    setExpandedSections,
    setTimeStructure,
    setClientTypes,
    setNewClientType,
    setBinderStructure,
    setCustomTemplates,
    setPreviewStructure,
    toggleSection,
    addClientType,
    removeClientType,
    saveCurrentAsTemplate,
    loadTemplate,
    handleVerifyCredentials,
    handleStorageAllocation,
  };
};

export { defaultTemplates }; 