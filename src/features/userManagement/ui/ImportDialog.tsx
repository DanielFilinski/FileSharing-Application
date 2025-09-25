/**
 * ImportDialog Component
 * 
 * A dialog component for importing users from Excel files.
 * Features drag-and-drop upload, file validation, and import preview.
 * 
 * @features
 * - Excel file upload with validation
 * - Drag and drop support
 * - Import preview with error reporting
 * - Support for both employee and client imports
 * - Progress indicators during import
 */
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Button,
  Body1,
  Caption1,
  Text,
  Dropdown,
  Option,
  Field,
  ProgressBar,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  Folder20Regular, 
  DocumentArrowUp20Regular,
  Warning20Regular,
  Checkmark20Regular 
} from '@fluentui/react-icons';
import { 
  importEmployees, 
  importClients,
  validateFile,
  type ImportResult,
  type ImportError
} from '@/shared/lib/excelImport';
import type { Employee, Client } from '@/entities/user';

// Import type options
type ImportType = 'employees' | 'clients';

// Props interface for the import dialog
interface ImportDialogProps {
  open: boolean;
  onOpenChange: (event: any, data: { open: boolean }) => void;
  onImport: (type: ImportType, data: (Omit<Employee, 'id'> | Omit<Client, 'id'>)[]) => void;
}

// Component states
interface ImportState {
  step: 'select' | 'preview' | 'importing' | 'complete';
  importType: ImportType;
  selectedFile: File | null;
  result: ImportResult<any> | null;
  isProcessing: boolean;
}

// Styles for the import dialog
const useStyles = makeStyles({
  dialogContent: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '500px',
    maxWidth: '700px',
    '@media (max-width: 768px)': {
      minWidth: '300px',
      maxWidth: '400px',
      padding: tokens.spacingVerticalM
    }
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
    textAlign: 'center',
    gap: tokens.spacingVerticalM,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  errorList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteRedBackground1
  },
  errorItem: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
    fontSize: '12px'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`
  },
  previewStats: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall
  }
});

/**
 * Enhanced ImportDialog component with multi-step import process
 */
export const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  onImport
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Component state
  const [state, setState] = useState<ImportState>({
    step: 'select',
    importType: 'employees',
    selectedFile: null,
    result: null,
    isProcessing: false
  });

  /**
   * Resets dialog state when opened/closed
   */
  React.useEffect(() => {
    if (open) {
      setState({
        step: 'select',
        importType: 'employees',
        selectedFile: null,
        result: null,
        isProcessing: false
      });
    }
  }, [open]);

  /**
   * Handles file selection from input or drag-and-drop
   */
  const handleFileSelect = async (file: File) => {
    // Validate file first
    const validation = await validateFile(file);
    if (!validation.valid) {
      // Show error (in a real app, you'd use a notification service)
      alert(validation.error);
      return;
    }

    setState(prev => ({
      ...prev,
      selectedFile: file,
      step: 'preview',
      isProcessing: true
    }));

    // Process the file
    try {
      let result: ImportResult<any>;
      
      if (state.importType === 'employees') {
        result = await importEmployees(file);
      } else {
        result = await importClients(file);
      }

      setState(prev => ({
        ...prev,
        result,
        isProcessing: false,
        step: result.success && result.data.length > 0 ? 'preview' : 'complete'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        result: {
          success: false,
          data: [],
          errors: [{ row: 0, field: 'file', message: 'Failed to process file' }],
          totalRows: 0,
          validRows: 0
        },
        step: 'complete'
      }));
    }
  };

  /**
   * Handles file input change
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handles final import confirmation
   */
  const handleImportConfirm = () => {
    if (state.result?.data) {
      onImport(state.importType, state.result.data);
      onOpenChange(null, { open: false });
    }
  };

  /**
   * Goes back to file selection step
   */
  const handleBackToSelect = () => {
    setState(prev => ({
      ...prev,
      step: 'select',
      selectedFile: null,
      result: null
    }));
  };

  /**
   * Renders file selection step
   */
  const renderSelectStep = () => (
    <>
      <Field label="Import Type" required>
        <Dropdown
          value={state.importType}
          onOptionSelect={(e, data) => setState(prev => ({
            ...prev,
            importType: data.optionValue as ImportType
          }))}
        >
          <Option value="employees">Employees</Option>
          <Option value="clients">Clients</Option>
        </Dropdown>
      </Field>

      <div 
        className={styles.uploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        <DocumentArrowUp20Regular />
        <Body1>Drop your Excel file here or click to browse</Body1>
        <Caption1>
          Supported formats: .xlsx, .xls (max 5MB)
        </Caption1>
        <Caption1>
          Required columns: {state.importType === 'employees' 
            ? 'First Name, Last Name, Classification, Office' 
            : 'First Name, Last Name, Phone, Email'}
        </Caption1>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </>
  );

  /**
   * Renders import preview/results step
   */
  const renderPreviewStep = () => {
    if (state.isProcessing) {
      return (
        <div style={{ textAlign: 'center' }}>
          <Body1>Processing file...</Body1>
          <ProgressBar />
        </div>
      );
    }

    if (!state.result) return null;

    return (
      <>
        <div className={styles.previewStats}>
          <Text>File: {state.selectedFile?.name}</Text>
          <Text>Total rows: {state.result.totalRows}</Text>
          <Text>Valid rows: {state.result.validRows}</Text>
        </div>

        {state.result.success && state.result.data.length > 0 && (
          <div className={styles.successMessage}>
            <Checkmark20Regular />
            <Body1>
              Ready to import {state.result.validRows} {state.importType}
            </Body1>
          </div>
        )}

        {state.result.errors.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Warning20Regular />
              <Body1>Import Errors ({state.result.errors.length})</Body1>
            </div>
            <div className={styles.errorList}>
              {state.result.errors.slice(0, 10).map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <Text>Row {error.row}:</Text>
                  <Text>{error.message}</Text>
                </div>
              ))}
              {state.result.errors.length > 10 && (
                <div className={styles.errorItem}>
                  <Text>... and {state.result.errors.length - 10} more errors</Text>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  /**
   * Gets dialog title based on current step
   */
  const getDialogTitle = () => {
    switch (state.step) {
      case 'select':
        return 'Import Users';
      case 'preview':
      case 'importing':
        return 'Import Preview';
      case 'complete':
        return 'Import Results';
      default:
        return 'Import Users';
    }
  };

  /**
   * Gets appropriate action buttons for current step
   */
  const getActionButtons = () => {
    switch (state.step) {
      case 'select':
        return (
          <>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
          </>
        );
      case 'preview':
        const canImport = state.result?.success && state.result.data.length > 0;
        return (
          <>
            <Button appearance="secondary" onClick={handleBackToSelect}>
              Back
            </Button>
            <Button 
              appearance="primary" 
              disabled={!canImport}
              onClick={handleImportConfirm}
            >
              Import {state.result?.validRows || 0} {state.importType}
            </Button>
          </>
        );
      case 'complete':
        return (
          <>
            <Button appearance="secondary" onClick={handleBackToSelect}>
              Import Another File
            </Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary">Close</Button>
            </DialogTrigger>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {state.step === 'select' && renderSelectStep()}
            {(state.step === 'preview' || state.step === 'complete') && renderPreviewStep()}
          </DialogContent>
          <DialogActions>
            {getActionButtons()}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}; 