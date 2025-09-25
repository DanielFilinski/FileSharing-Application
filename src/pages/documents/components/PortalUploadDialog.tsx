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
  Label,
  Textarea,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { DismissRegular, AppsRegular } from '@fluentui/react-icons';
import { DocumentMetadata } from './UploadForm';

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
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    marginBottom: '16px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  }
});

interface PortalUploadDialogProps {
  onClose: () => void;
  onUpload: (metadata: DocumentMetadata) => void;
  selectedFiles?: Array<{
    id: string;
    name: string;
    url?: string;
    size?: number;
    driveId?: string;
  }>;
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

export const PortalUploadDialog: React.FC<PortalUploadDialogProps> = ({
  onClose,
  onUpload,
  selectedFiles = []
}) => {
  const styles = useStyles();
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: '',
    documentSubtype: '',
    period: '',
    description: ''
  });

  // selectedFiles теперь передается как prop

  const handleSubmit = () => {
    if (metadata.documentType && metadata.documentSubtype && metadata.period) {
      onUpload(metadata);
      onClose();
    }
  };

  const getSubtypeOptions = () => {
    return DOCUMENT_SUBTYPES[metadata.documentType as keyof typeof DOCUMENT_SUBTYPES] || [];
  };

  const isFormValid = metadata.documentType && 
    metadata.documentSubtype && 
    metadata.period;

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }>
            Upload from Teams Portal
          </DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {/* Selected Files */}
              <div className={styles.fieldGroup}>
                <Label>Selected Files from Teams Portal</Label>
                <div className={styles.filesList}>
                  {selectedFiles.map((file: any, index: number) => (
                    <div key={index} className={styles.fileItem}>
                      <AppsRegular />
                      <Text>{file.name}</Text>
                    </div>
                  ))}
                </div>
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
                    documentSubtype: ''
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
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Upload from Portal ({selectedFiles.length} files)
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
