import React from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Input,
  Field,
  Select,
  Label,
  Button,
  Caption1,
  Body1,
  Textarea,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  ChevronDown24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { Template, PreviewStructure } from '@/entities/storage';

interface FolderStructureProps {
  firmType: string;
  selectedTemplate: string;
  customStructure: string;
  timeStructure: string;
  clientTypes: string[];
  newClientType: string;
  binderStructure: string;
  previewStructure: PreviewStructure | null;
  expandedSections: Record<string, boolean>;
  customTemplates: Template[];
  onFirmTypeChange: (type: string) => void;
  onSelectedTemplateChange: (template: string) => void;
  onCustomStructureChange: (structure: string) => void;
  onTimeStructureChange: (structure: string) => void;
  onClientTypesChange: (types: string[]) => void;
  onNewClientTypeChange: (type: string) => void;
  onBinderStructureChange: (structure: string) => void;
  onExpandedSectionsChange: (sections: Record<string, boolean>) => void;
  onAddClientType: () => void;
  onRemoveClientType: (index: number) => void;
  onLoadTemplate: (templateKey: string) => void;
  onSaveTemplate: () => void;
}

const useStyles = makeStyles({
  clientTypesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  clientTypeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  addClientType: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  previewCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
  },
  previewSection: {
    marginBottom: tokens.spacingVerticalM,
  },
  previewSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    cursor: 'pointer',
    padding: tokens.spacingVerticalXS,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderRadius: tokens.borderRadiusSmall,
    },
  },
  previewSectionContent: {
    marginLeft: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalS,
  },
  previewItem: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXS,
  },
  previewFolder: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  previewSubItem: {
    marginLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXS,
  },
});

export const FolderStructure: React.FC<FolderStructureProps> = ({
  firmType,
  selectedTemplate,
  customStructure,
  timeStructure,
  clientTypes,
  newClientType,
  binderStructure,
  previewStructure,
  expandedSections,
  customTemplates,
  onFirmTypeChange,
  onSelectedTemplateChange,
  onCustomStructureChange,
  onTimeStructureChange,
  onClientTypesChange,
  onNewClientTypeChange,
  onBinderStructureChange,
  onExpandedSectionsChange,
  onAddClientType,
  onRemoveClientType,
  onLoadTemplate,
  onSaveTemplate,
}) => {
  const styles = useStyles();

  const toggleSection = (section: string) => {
    onExpandedSectionsChange({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleTemplateChange = (template: string) => {
    onSelectedTemplateChange(template);
    if (template !== 'custom' && template !== '') {
      onLoadTemplate(template);
    }
  };

  const handleAddClientType = () => {
    if (newClientType.trim() && !clientTypes.includes(newClientType.trim())) {
      onClientTypesChange([...clientTypes, newClientType.trim()]);
      onNewClientTypeChange('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title3>Folder Structure</Title3>
          <Button
            appearance="subtle"
            icon={<Add24Regular />}
            onClick={onSaveTemplate}
          >
            Save Template
          </Button>
        </div>
      </CardHeader>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
        <Field label="Firm Type">
          <Select
            value={firmType}
            onChange={(e) => onFirmTypeChange(e.target.value)}
          >
            <option value="">Select type</option>
            <option value="accounting">Accounting</option>
            <option value="legal">Legal</option>
            <option value="consulting">Consulting</option>
            <option value="custom">Custom</option>
          </Select>
        </Field>

        {firmType && firmType !== 'custom' && (
          <Field label="Template">
            <Select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">Select template</option>
              <option value={firmType}>Default {firmType} template</option>
              {customTemplates.map((template, index) => (
                <option key={index} value={template.name}>{template.name}</option>
              ))}
              <option value="custom">Custom</option>
            </Select>
          </Field>
        )}

        <Field label="Period Structure">
          <Select
            value={timeStructure}
            onChange={(e) => onTimeStructureChange(e.target.value)}
          >
            <option value="tax-year">Tax Years</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
            <option value="custom-date">Custom Dates</option>
          </Select>
        </Field>

        <div>
          <Label>Client Types</Label>
          <div className={styles.clientTypesList}>
            {clientTypes.map((type, index) => (
              <div key={index} className={styles.clientTypeItem}>
                <Caption1>{type}</Caption1>
                <Button
                  appearance="subtle"
                  icon={<Delete24Regular />}
                  size="small"
                  onClick={() => onRemoveClientType(index)}
                />
              </div>
            ))}
            <div className={styles.addClientType}>
              <Input
                value={newClientType}
                onChange={(e) => onNewClientTypeChange(e.target.value)}
                placeholder="Add client type"
                onKeyPress={(e) => e.key === 'Enter' && handleAddClientType()}
                style={{ flex: 1 }}
              />
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={handleAddClientType}
                style={{ backgroundColor: tokens.colorBrandBackground }}
              />
            </div>
          </div>
        </div>

        {firmType && firmType !== 'custom' && (
          <Field label={firmType === 'legal' ? 'Document Organization' : 'Binder Structure'}>
            <Select
              value={binderStructure}
              onChange={(e) => onBinderStructureChange(e.target.value)}
            >
              {firmType === 'accounting' && (
                <>
                  <option value="numerical">Numerical (1000, 2000, 3000)</option>
                  <option value="custom">Custom</option>
                </>
              )}
              {firmType === 'legal' && (
                <>
                  <option value="alphabetical">Alphabetical (A, B, C)</option>
                  <option value="planning">Planning → Deliverables</option>
                  <option value="custom">Custom</option>
                </>
              )}
              {firmType === 'consulting' && (
                <>
                  <option value="phases">Project Phases</option>
                  <option value="custom">Custom</option>
                </>
              )}
            </Select>
          </Field>
        )}

        {previewStructure && (
          <div className={styles.previewCard}>
            <Body1 style={{ marginBottom: tokens.spacingVerticalM }}>
              Live Preview
            </Body1>
            <div>
              {Object.entries(previewStructure).map(([section, items]) => (
                <div key={section} className={styles.previewSection}>
                  <div
                    className={styles.previewSectionHeader}
                    onClick={() => toggleSection(section)}
                  >
                    {expandedSections[section] ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
                    <Caption1>{section}</Caption1>
                  </div>
                  {expandedSections[section] && (
                    <div className={styles.previewSectionContent}>
                      {Array.isArray(items) ? (
                        items.map((item, idx) => (
                          <div key={idx} className={styles.previewItem}>• {item}</div>
                        ))
                      ) : (
                        Object.entries(items as Record<string, string[]>).map(([folder, subItems]) => (
                          <div key={folder}>
                            <div className={styles.previewFolder}>📁 {folder}</div>
                            {subItems.map((subItem, idx) => (
                              <div key={idx} className={styles.previewSubItem}>• {subItem}</div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedTemplate === 'custom' || firmType === 'custom') && (
          <Field label="Custom Structure">
            <Textarea
              value={customStructure}
              onChange={(e) => onCustomStructureChange(e.target.value)}
              rows={6}
              placeholder="/Client Name&#10;  /Tax Year 2025&#10;    /1000 - Assets&#10;      /1000.01 - Cash&#10;    /2000 - Liabilities"
            />
          </Field>
        )}
      </div>
    </Card>
  );
}; 