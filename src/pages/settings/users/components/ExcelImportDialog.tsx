/**
 * ExcelImportDialog - Component for importing users from Excel files
 * Implements the Excel import functionality for employees and clients
 */

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Dropdown,
  Option,
  Checkbox,
  Textarea,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  Divider,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  ProgressBar,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  DocumentArrowUp24Regular,
  Save24Regular,
  Cancel24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Document24Regular
} from '@fluentui/react-icons';

import { 
  userManagementService, 
  type ExcelImportRequest,
  type BulkOperationResult 
} from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';

const useStyles = makeStyles({
  dialog: {
    minWidth: '800px',
    maxWidth: '1200px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start'
  },
  field: {
    flex: 1
  },
  section: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalS
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  fileUpload: {
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:hover': {
      borderColor: tokens.colorBrandBackground,
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  fileInput: {
    display: 'none'
  },
  preview: {
    maxHeight: '400px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  resultCard: {
    marginBottom: tokens.spacingVerticalS
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL
  },
  error: {
    marginBottom: tokens.spacingVerticalM
  },
  templateInfo: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  }
});

export interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: BulkOperationResult) => void;
  userType: 'employees' | 'clients';
}

interface ExcelRow {
  [key: string]: string;
  _rowIndex: number;
  _status?: 'valid' | 'invalid' | 'duplicate';
  _errors?: string[];
}

export const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  userType
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExcelRow[]>([]);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateEmails: true
  });
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BulkOperationResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Template information
  const employeeTemplate = [
    'First Name', 'Last Name', 'Email', 'Classification', 'Office', 'Role', 'Department', 'Phone'
  ];
  
  const clientTemplate = [
    'First Name', 'Last Name', 'Email', 'Phone', 'Firm Name', 'Firm Address', 'Business Type'
  ];
  
  const currentTemplate = userType === 'employees' ? employeeTemplate : clientTemplate;
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      processExcelFile(file);
    }
  };
  
  // Process Excel file
  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate Excel file processing
      // In a real implementation, you would use a library like xlsx
      const mockData: ExcelRow[] = [
        {
          _rowIndex: 1,
          'First Name': 'John',
          'Last Name': 'Doe',
          'Email': 'john.doe@example.com',
          'Classification': 'Manager',
          'Office': 'New York',
          'Role': 'Engineering Manager',
          'Department': 'Engineering',
          'Phone': '+1-555-0123'
        },
        {
          _rowIndex: 2,
          'First Name': 'Jane',
          'Last Name': 'Smith',
          'Email': 'jane.smith@example.com',
          'Classification': 'Senior',
          'Office': 'Chicago',
          'Role': 'Senior Developer',
          'Department': 'Engineering',
          'Phone': '+1-555-0124'
        }
      ];
      
      // Validate data
      const validatedData = validateExcelData(mockData);
      setImportData(validatedData);
      setCurrentStep('preview');
      
    } catch (error: any) {
      console.error('Error processing Excel file:', error);
      setError(error.message || 'Failed to process Excel file');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Validate Excel data
  const validateExcelData = (data: ExcelRow[]): ExcelRow[] => {
    return data.map(row => {
      const errors: string[] = [];
      let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
      
      // Check required fields
      if (!row['First Name']?.trim()) errors.push('First Name is required');
      if (!row['Last Name']?.trim()) errors.push('Last Name is required');
      if (!row['Email']?.trim()) errors.push('Email is required');
      if (userType === 'employees' && !row['Classification']?.trim()) errors.push('Classification is required');
      if (userType === 'employees' && !row['Office']?.trim()) errors.push('Office is required');
      if (userType === 'clients' && !row['Phone']?.trim()) errors.push('Phone is required');
      
      // Validate email format
      if (row['Email']?.trim() && importOptions.validateEmails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row['Email'])) {
          errors.push('Invalid email format');
        }
      }
      
      if (errors.length > 0) {
        status = 'invalid';
      }
      
      return {
        ...row,
        _status: status,
        _errors: errors
      };
    });
  };
  
  // Handle import options change
  const handleOptionChange = (option: keyof typeof importOptions, checked: boolean) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };
  
  // Start import process
  const handleImport = async () => {
    if (importData.length === 0) return;
    
    setCurrentStep('importing');
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Prepare import data
      const importRequest: ExcelImportRequest = {
        userType,
        data: importData.map(row => {
          const { _rowIndex, _status, _errors, ...data } = row;
          return data;
        }),
        options: importOptions
      };
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Perform import
      const result = await userManagementService.importUsersFromExcel(importRequest);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success && result.data) {
        setImportResult(result.data);
        setCurrentStep('results');
        notificationService.success(
          'Import Completed',
          `Successfully imported ${result.data.success} users`
        );
        onImportComplete(result.data);
      } else {
        throw new Error(result.error || 'Import failed');
      }
      
    } catch (error: any) {
      console.error('Error importing users:', error);
      setError(error.message || 'Failed to import users');
      setCurrentStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (!isProcessing) {
      setCurrentStep('upload');
      setSelectedFile(null);
      setImportData([]);
      setImportResult(null);
      setError(null);
      setProgress(0);
      onClose();
    }
  };
  
  // Reset to upload step
  const handleReset = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setImportData([]);
    setImportResult(null);
    setError(null);
    setProgress(0);
  };
  
  const validRows = importData.filter(row => row._status === 'valid').length;
  const invalidRows = importData.filter(row => row._status === 'invalid').length;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <DocumentArrowUp24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
            Import {userType === 'employees' ? 'Employees' : 'Clients'} from Excel
          </DialogTitle>
          
          <DialogContent>
            {error && (
              <MessageBar intent="error" className={styles.error}>
                <MessageBarBody>
                  <Warning24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}
            
            {currentStep === 'upload' && (
              <div className={styles.form}>
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Step 1: Upload Excel File</Text>
                  
                  <div 
                    className={styles.fileUpload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Document24Regular size={48} style={{ marginBottom: tokens.spacingVerticalM }} />
                    <Text size={400} weight="semibold">
                      Click to upload Excel file
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: tokens.spacingVerticalS }}>
                      Supported formats: .xlsx, .xls
                    </Text>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                  />
                  
                  {selectedFile && (
                    <Card className={styles.resultCard}>
                      <CardHeader
                        image={<Document24Regular />}
                        header={<Text weight="semibold">{selectedFile.name}</Text>}
                      />
                      <CardPreview>
                        <Text size={200}>
                          Size: {(selectedFile.size / 1024).toFixed(1)} KB
                        </Text>
                      </CardPreview>
                    </Card>
                  )}
                </div>
                
                <Divider />
                
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Excel Template</Text>
                  <div className={styles.templateInfo}>
                    <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
                      Required columns for {userType}:
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingVerticalXS }}>
                      {currentTemplate.map(column => (
                        <Badge key={column} size="small" color="brand">
                          {column}
                        </Badge>
                      ))}
                    </div>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: tokens.spacingVerticalS }}>
                      Download the template file to ensure proper formatting.
                    </Text>
                  </div>
                </div>
                
                <Divider />
                
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Import Options</Text>
                  <div className={styles.checkboxGroup}>
                    <Checkbox
                      label="Skip Duplicates"
                      description="Skip rows with duplicate email addresses"
                      checked={importOptions.skipDuplicates}
                      onChange={(_, data) => handleOptionChange('skipDuplicates', data.checked || false)}
                    />
                    <Checkbox
                      label="Update Existing"
                      description="Update existing users instead of skipping"
                      checked={importOptions.updateExisting}
                      onChange={(_, data) => handleOptionChange('updateExisting', data.checked || false)}
                    />
                    <Checkbox
                      label="Validate Emails"
                      description="Validate email address format"
                      checked={importOptions.validateEmails}
                      onChange={(_, data) => handleOptionChange('validateEmails', data.checked || false)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'preview' && (
              <div className={styles.form}>
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>
                    Step 2: Preview Data
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginLeft: tokens.spacingHorizontalS }}>
                      ({validRows} valid, {invalidRows} invalid rows)
                    </Text>
                  </Text>
                  
                  <div className={styles.preview}>
                    <DataGrid items={importData} focusMode="composite">
                      <DataGridHeader>
                        <DataGridRow>
                          <DataGridHeaderCell>Status</DataGridHeaderCell>
                          <DataGridHeaderCell>First Name</DataGridHeaderCell>
                          <DataGridHeaderCell>Last Name</DataGridHeaderCell>
                          <DataGridHeaderCell>Email</DataGridHeaderCell>
                          {userType === 'employees' && <DataGridHeaderCell>Classification</DataGridHeaderCell>}
                          {userType === 'employees' && <DataGridHeaderCell>Office</DataGridHeaderCell>}
                          {userType === 'clients' && <DataGridHeaderCell>Phone</DataGridHeaderCell>}
                          <DataGridHeaderCell>Errors</DataGridHeaderCell>
                        </DataGridRow>
                      </DataGridHeader>
                      <DataGridBody<ExcelRow>>
                        {(item) => (
                          <DataGridRow key={item._rowIndex}>
                            <DataGridCell>
                              <TableCellLayout>
                                {item._status === 'valid' && <CheckmarkCircle24Regular color="green" />}
                                {item._status === 'invalid' && <ErrorCircle24Regular color="red" />}
                                {item._status === 'duplicate' && <Warning24Regular color="orange" />}
                              </TableCellLayout>
                            </DataGridCell>
                            <DataGridCell>{item['First Name']}</DataGridCell>
                            <DataGridCell>{item['Last Name']}</DataGridCell>
                            <DataGridCell>{item['Email']}</DataGridCell>
                            {userType === 'employees' && <DataGridCell>{item['Classification']}</DataGridCell>}
                            {userType === 'employees' && <DataGridCell>{item['Office']}</DataGridCell>}
                            {userType === 'clients' && <DataGridCell>{item['Phone']}</DataGridCell>}
                            <DataGridCell>
                              {item._errors && item._errors.length > 0 && (
                                <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                                  {item._errors.join(', ')}
                                </Text>
                              )}
                            </DataGridCell>
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    </DataGrid>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'importing' && (
              <div className={styles.loading}>
                <div style={{ textAlign: 'center' }}>
                  <Spinner size="large" />
                  <Text size={400} weight="semibold" style={{ marginTop: tokens.spacingVerticalM }}>
                    Importing Users...
                  </Text>
                  <ProgressBar 
                    value={progress} 
                    max={100}
                    style={{ marginTop: tokens.spacingVerticalM, width: '300px' }}
                  />
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: tokens.spacingVerticalS }}>
                    {progress}% complete
                  </Text>
                </div>
              </div>
            )}
            
            {currentStep === 'results' && importResult && (
              <div className={styles.results}>
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Import Results</Text>
                  
                  <Card>
                    <CardHeader
                      image={<CheckmarkCircle24Regular color="green" />}
                      header={<Text weight="semibold">Import Summary</Text>}
                    />
                    <CardPreview>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                        <Text size={200}>
                          <strong>Total Processed:</strong> {importResult.total} rows
                        </Text>
                        <Text size={200} style={{ color: tokens.colorPaletteGreenForeground1 }}>
                          <strong>Successfully Imported:</strong> {importResult.success} users
                        </Text>
                        <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                          <strong>Failed:</strong> {importResult.failed} users
                        </Text>
                        {importResult.skipped && (
                          <Text size={200} style={{ color: tokens.colorPaletteOrangeForeground1 }}>
                            <strong>Skipped:</strong> {importResult.skipped} users
                          </Text>
                        )}
                      </div>
                    </CardPreview>
                  </Card>
                  
                  {importResult.errors.length > 0 && (
                    <Card>
                      <CardHeader
                        image={<ErrorCircle24Regular color="red" />}
                        header={<Text weight="semibold">Errors</Text>}
                      />
                      <CardPreview>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {importResult.errors.map((error, index) => (
                            <Text key={index} size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                              • {error}
                            </Text>
                          ))}
                        </div>
                      </CardPreview>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
          
          <DialogActions>
            {currentStep === 'upload' && (
              <>
                <Button appearance="secondary" icon={<Cancel24Regular />} onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  appearance="primary" 
                  icon={<DocumentArrowUp24Regular />}
                  disabled={!selectedFile || isProcessing}
                  onClick={() => setCurrentStep('preview')}
                >
                  Continue
                </Button>
              </>
            )}
            
            {currentStep === 'preview' && (
              <>
                <Button appearance="secondary" icon={<Cancel24Regular />} onClick={handleReset}>
                  Back
                </Button>
                <Button 
                  appearance="primary" 
                  icon={<Save24Regular />}
                  disabled={validRows === 0 || isProcessing}
                  onClick={handleImport}
                >
                  Import {validRows} Users
                </Button>
              </>
            )}
            
            {currentStep === 'results' && (
              <Button appearance="primary" icon={<CheckmarkCircle24Regular />} onClick={handleClose}>
                Done
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
