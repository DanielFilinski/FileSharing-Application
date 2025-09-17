import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Select,
  Input,
  Label,
  Textarea,
  Text,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  ArrowUploadRegular, 
  DocumentRegular, 
  DismissRegular 
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '400px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  fileUpload: {
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorBrandBackground2
    }
  },
  fileUploadActive: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2
  },
  selectedFiles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '6px',
    fontSize: '14px'
  },
  removeFile: {
    marginLeft: 'auto',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    ':hover': {
      color: tokens.colorPaletteRedForeground1
    }
  },
  periodInputs: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  periodInput: {
    flex: 1
  }
});

interface UploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], metadata: DocumentMetadata) => void;
}

export interface DocumentMetadata {
  documentType: string;
  documentSubtype: string;
  period: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

const DOCUMENT_TYPES = [
  { value: 'tax', label: 'Tax' },
  { value: 'audit', label: 'Audit' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financial' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' }
];

const DOCUMENT_SUBTYPES = {
  tax: [
    { value: 'income_tax', label: 'Income Tax' },
    { value: 'sales_tax', label: 'Sales Tax' },
    { value: 'property_tax', label: 'Property Tax' },
    { value: 'corporate_tax', label: 'Corporate Tax' },
    { value: 'payroll_tax', label: 'Payroll Tax' },
    { value: 'other_tax', label: 'Other Tax' }
  ],
  audit: [
    { value: 'financial_audit', label: 'Financial Audit' },
    { value: 'compliance_audit', label: 'Compliance Audit' },
    { value: 'operational_audit', label: 'Operational Audit' },
    { value: 'internal_audit', label: 'Internal Audit' },
    { value: 'other_audit', label: 'Other Audit' }
  ],
  consulting: [
    { value: 'business_consulting', label: 'Business Consulting' },
    { value: 'financial_consulting', label: 'Financial Consulting' },
    { value: 'strategy_consulting', label: 'Strategy Consulting' },
    { value: 'other_consulting', label: 'Other Consulting' }
  ],
  legal: [
    { value: 'contracts', label: 'Contracts' },
    { value: 'litigation', label: 'Litigation' },
    { value: 'regulatory', label: 'Regulatory' },
    { value: 'compliance_legal', label: 'Compliance' },
    { value: 'other_legal', label: 'Other Legal' }
  ],
  financial: [
    { value: 'financial_statements', label: 'Financial Statements' },
    { value: 'budgeting', label: 'Budgeting' },
    { value: 'forecasting', label: 'Forecasting' },
    { value: 'other_financial', label: 'Other Financial' }
  ],
  compliance: [
    { value: 'regulatory_compliance', label: 'Regulatory Compliance' },
    { value: 'industry_compliance', label: 'Industry Compliance' },
    { value: 'internal_compliance', label: 'Internal Compliance' },
    { value: 'other_compliance', label: 'Other Compliance' }
  ],
  other: [
    { value: 'general', label: 'General' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
  ]
};

const PERIOD_OPTIONS = [
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'specific_dates', label: 'Specific Dates' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One Time' }
];

export const UploadForm: React.FC<UploadFormProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const styles = useStyles();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: '',
    documentSubtype: '',
    period: '',
    description: ''
  });

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0 && metadata.documentType && metadata.documentSubtype && metadata.period) {
      onUpload(selectedFiles, metadata);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setMetadata({
      documentType: '',
      documentSubtype: '',
      period: '',
      description: ''
    });
    setIsDragOver(false);
    onClose();
  };

  const getSubtypeOptions = () => {
    return DOCUMENT_SUBTYPES[metadata.documentType as keyof typeof DOCUMENT_SUBTYPES] || [];
  };

  const isFormValid = selectedFiles.length > 0 && 
    metadata.documentType && 
    metadata.documentSubtype && 
    metadata.period &&
    (metadata.period !== 'specific_dates' || (metadata.startDate && metadata.endDate));

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={handleClose}
            />
          }>
            Upload Documents
          </DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {/* File Upload */}
              <div className={styles.fieldGroup}>
                <Label>Files</Label>
                <div
                  className={`${styles.fileUpload} ${isDragOver ? styles.fileUploadActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <ArrowUploadRegular style={{ fontSize: '32px', color: tokens.colorNeutralForeground3 }} />
                  <Text size={500} style={{ marginTop: '8px' }}>
                    Drop files here or click to browse
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Supports PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
                  </Text>
                </div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                
                {selectedFiles.length > 0 && (
                  <div className={styles.selectedFiles}>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <DocumentRegular />
                        <Text>{file.name}</Text>
                        <Badge appearance="filled" color="brand">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                        <span 
                          className={styles.removeFile}
                          onClick={() => removeFile(index)}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Type */}
              <div className={styles.fieldGroup}>
                <Label htmlFor="document-type">Document Type *</Label>
                <Select
                  id="document-type"
                  value={metadata.documentType}
                  onChange={(_, data) => setMetadata(prev => ({ 
                    ...prev, 
                    documentType: data.value,
                    documentSubtype: '' // Reset subtype when type changes
                  }))}
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Document Subtype */}
              <div className={styles.fieldGroup}>
                <Label htmlFor="document-subtype">Document Subtype *</Label>
                <Select
                  id="document-subtype"
                  value={metadata.documentSubtype}
                  onChange={(_, data) => setMetadata(prev => ({ 
                    ...prev, 
                    documentSubtype: data.value 
                  }))}
                  disabled={!metadata.documentType}
                >
                  <option value="">Select document subtype</option>
                  {getSubtypeOptions().map(subtype => (
                    <option key={subtype.value} value={subtype.value}>
                      {subtype.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Period */}
              <div className={styles.fieldGroup}>
                <Label htmlFor="period">Period *</Label>
                <Select
                  id="period"
                  value={metadata.period}
                  onChange={(_, data) => setMetadata(prev => ({ 
                    ...prev, 
                    period: data.value 
                  }))}
                >
                  <option value="">Select period</option>
                  {PERIOD_OPTIONS.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Specific Dates */}
              {metadata.period === 'specific_dates' && (
                <div className={styles.fieldGroup}>
                  <Label>Date Range *</Label>
                  <div className={styles.periodInputs}>
                    <div className={styles.periodInput}>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={metadata.startDate || ''}
                        onChange={(_, data) => setMetadata(prev => ({ 
                          ...prev, 
                          startDate: data.value 
                        }))}
                      />
                    </div>
                    <div className={styles.periodInput}>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={metadata.endDate || ''}
                        onChange={(_, data) => setMetadata(prev => ({ 
                          ...prev, 
                          endDate: data.value 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className={styles.fieldGroup}>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description of the documents..."
                  value={metadata.description || ''}
                  onChange={(_, data) => setMetadata(prev => ({ 
                    ...prev, 
                    description: data.value 
                  }))}
                  rows={3}
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length} files)`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 