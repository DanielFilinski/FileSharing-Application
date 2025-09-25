import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Text,
  Field,
  Select,
  Textarea,
  RadioGroup,
  Radio,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  DocumentRegular, 
  TableRegular, 
  SlideTextRegular, 
  ClipboardTaskRegular,
  AddRegular
} from '@fluentui/react-icons';
import { DocumentMetadata } from './UploadForm';

const useStyles = makeStyles({
  dialog: {
    minWidth: '500px',
    maxWidth: '600px'
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '12px'
  },
  templateCard: {
    padding: '16px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      borderColor: tokens.colorBrandBackground
    },
    '&.selected': {
      backgroundColor: tokens.colorBrandBackground2,
      borderColor: tokens.colorBrandBackground,
      color: tokens.colorBrandForeground1
    }
  },
  templateIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  formSection: {
    marginTop: '16px',
    marginBottom: '16px'
  },
  formField: {
    marginBottom: '12px'
  }
});

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (type: 'document' | 'spreadsheet' | 'presentation' | 'form', data: any) => void;
}

const documentTemplates = {
  document: [
    { id: 'blank-doc', name: 'Blank Document', description: 'Start with a blank document' },
    { id: 'letter', name: 'Business Letter', description: 'Professional letter template' },
    { id: 'report', name: 'Report', description: 'Business report template' },
    { id: 'memo', name: 'Memo', description: 'Internal memo template' }
  ],
  spreadsheet: [
    { id: 'blank-sheet', name: 'Blank Spreadsheet', description: 'Start with empty spreadsheet' },
    { id: 'budget', name: 'Budget Tracker', description: 'Track expenses and income' },
    { id: 'invoice', name: 'Invoice', description: 'Invoice template' },
    { id: 'timesheet', name: 'Timesheet', description: 'Time tracking template' }
  ],
  presentation: [
    { id: 'blank-pres', name: 'Blank Presentation', description: 'Start with empty presentation' },
    { id: 'business', name: 'Business Pitch', description: 'Business presentation template' },
    { id: 'quarterly', name: 'Quarterly Review', description: 'Quarterly report template' },
    { id: 'training', name: 'Training', description: 'Training presentation template' }
  ],
  form: [
    { id: 'blank-form', name: 'Blank Form', description: 'Start with empty form' },
    { id: 'survey', name: 'Survey', description: 'Customer survey template' },
    { id: 'application', name: 'Application', description: 'Application form template' },
    { id: 'feedback', name: 'Feedback', description: 'Feedback collection form' }
  ]
};

const documentTypeIcons = {
  document: <DocumentRegular className="templateIcon" />,
  spreadsheet: <TableRegular className="templateIcon" />,
  presentation: <SlideTextRegular className="templateIcon" />,
  form: <ClipboardTaskRegular className="templateIcon" />
};

const documentTypeNames = {
  document: 'Document',
  spreadsheet: 'Spreadsheet', 
  presentation: 'Presentation',
  form: 'Form'
};

export const NewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const styles = useStyles();
  const [step, setStep] = useState<'type' | 'template' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<'document' | 'spreadsheet' | 'presentation' | 'form'>('document');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [openMode, setOpenMode] = useState<'local' | 'online'>('online');

  // Document metadata fields
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: '',
    documentSubtype: '',
    period: '',
    description: ''
  });

  const handleTypeSelect = (type: 'document' | 'spreadsheet' | 'presentation' | 'form') => {
    setSelectedType(type);
    setSelectedTemplate('');
    setStep('template');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep('details');
    
    // Set default name based on template
    const template = documentTemplates[selectedType].find(t => t.id === templateId);
    if (template) {
      setDocumentName(template.name);
    }
  };

  const handleCreate = () => {
    const documentData = {
      name: documentName || `New ${documentTypeNames[selectedType]}`,
      description: documentDescription,
      template: selectedTemplate,
      openMode,
      metadata: {
        ...metadata,
        documentType: selectedType,
        documentSubtype: selectedTemplate
      }
    };
    
    onCreate(selectedType, documentData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setStep('type');
    setSelectedType('document');
    setSelectedTemplate('');
    setDocumentName('');
    setDocumentDescription('');
    setOpenMode('online');
    setMetadata({
      documentType: '',
      documentSubtype: '',
      period: '',
      description: ''
    });
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 'type': return selectedType !== '';
      case 'template': return selectedTemplate !== '';
      case 'details': return documentName.trim() !== '';
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <AddRegular style={{ marginRight: '8px' }} />
            Create New Document
          </DialogTitle>
          <DialogContent>
            {step === 'type' && (
              <div>
                <Text size={400} weight="semibold">Choose document type:</Text>
                <div className={styles.templateGrid}>
                  {(Object.keys(documentTemplates) as Array<keyof typeof documentTemplates>).map(type => (
                    <div
                      key={type}
                      className={`${styles.templateCard} ${selectedType === type ? 'selected' : ''}`}
                      onClick={() => handleTypeSelect(type)}
                    >
                      {documentTypeIcons[type]}
                      <br />
                      <Text weight="semibold">{documentTypeNames[type]}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'template' && (
              <div>
                <Text size={400} weight="semibold">
                  Choose {documentTypeNames[selectedType].toLowerCase()} template:
                </Text>
                <div className={styles.templateGrid}>
                  {documentTemplates[selectedType].map(template => (
                    <div
                      key={template.id}
                      className={`${styles.templateCard} ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      {documentTypeIcons[selectedType]}
                      <br />
                      <Text weight="semibold">{template.name}</Text>
                      <br />
                      <Text size={200}>{template.description}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'details' && (
              <div>
                <div className={styles.formSection}>
                  <Field label="Document Name" className={styles.formField}>
                    <Input
                      value={documentName}
                      onChange={(_, data) => setDocumentName(data.value)}
                      placeholder="Enter document name"
                    />
                  </Field>

                  <Field label="Description (Optional)" className={styles.formField}>
                    <Textarea
                      value={documentDescription}
                      onChange={(_, data) => setDocumentDescription(data.value)}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </Field>

                  <Field label="Document Type" className={styles.formField}>
                    <Select
                      value={metadata.documentType}
                      onChange={(_, data) => setMetadata(prev => ({ ...prev, documentType: data.value }))}
                    >
                      <option value="">Select type...</option>
                      <option value="tax">Tax Documents</option>
                      <option value="audit">Audit</option>
                      <option value="consulting">Consulting</option>
                      <option value="legal">Legal</option>
                      <option value="financial">Financial</option>
                    </Select>
                  </Field>

                  <Field label="Period" className={styles.formField}>
                    <Select
                      value={metadata.period}
                      onChange={(_, data) => setMetadata(prev => ({ ...prev, period: data.value }))}
                    >
                      <option value="">Select period...</option>
                      <option value="Q1 2024">Q1 2024</option>
                      <option value="Q2 2024">Q2 2024</option>
                      <option value="Q3 2024">Q3 2024</option>
                      <option value="Q4 2024">Q4 2024</option>
                      <option value="Annual 2024">Annual 2024</option>
                    </Select>
                  </Field>

                  <Field label="Open Mode" className={styles.formField}>
                    <RadioGroup
                      value={openMode}
                      onChange={(_, data) => setOpenMode(data.value as 'local' | 'online')}
                    >
                      <Radio value="online" label="Online Editor (Collaborative)" />
                      <Radio value="local" label="Local Editor (Desktop App)" />
                    </RadioGroup>
                  </Field>
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            {step !== 'type' && (
              <Button 
                appearance="secondary" 
                onClick={() => setStep(step === 'template' ? 'type' : 'template')}
              >
                Back
              </Button>
            )}
            {step !== 'details' ? (
              <Button 
                appearance="primary" 
                onClick={() => {
                  if (step === 'type') {
                    handleTypeSelect(selectedType);
                  } else if (step === 'template') {
                    handleTemplateSelect(selectedTemplate);
                  }
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button 
                appearance="primary" 
                onClick={handleCreate}
                disabled={!canProceed()}
              >
                Create & Open
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
