/**
 * Manual Signature Upload Component
 * Drag-and-drop file upload for manually signed documents
 * ⚠️ Only shows for documents with "Awaiting Signing" status
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  ProgressBar,
  Card
} from '@fluentui/react-components';
import {
  DocumentArrowUpRegular,
  ArrowUploadRegular,
  DismissRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DocumentRegular,
  WarningRegular
} from '@fluentui/react-icons';

import { signatureApi } from '@/shared/api/signatureApi';
import { notificationService } from '@/shared/lib/notifications';
import { DocumentSignatureRecord, DocumentStatus } from '@/shared/types/signature';
import { DocumentStatusValidator } from '@/features/signatures/utils/documentStatusValidator';

interface ManualSignatureUploadProps {
  documentId: string;
  documentName: string;
  documentStatus: DocumentStatus;
  onSuccess?: (signature: DocumentSignatureRecord) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const ManualSignatureUpload: React.FC<ManualSignatureUploadProps> = ({
  documentId,
  documentName,
  documentStatus,
  onSuccess,
  onCancel,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⚠️ CRITICAL: Check if document can be signed
  const canSign = DocumentStatusValidator.canDocumentBeSigned(documentStatus);
  const statusInfo = DocumentStatusValidator.getStatusInfo(documentStatus);

  const handleFileSelect = useCallback((file: File) => {
    // Client-side validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.txt'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      setError('Invalid file type. Please select a valid document.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload with progress tracking
      const result = await signatureApi.uploadManualSignature(
        documentId,
        formData,
        (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      setUploadComplete(true);
      
      notificationService.success(
        'Manual signature uploaded',
        `Document "${documentName}" has been signed successfully`
      );

      // Delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.signatureRecord);
        }
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to upload manual signature:', err);
      setError(err.message || 'Failed to upload signed document');
      
      notificationService.error(
        'Upload failed',
        err.message || 'Please try again'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setUploadComplete(false);
    setIsDragOver(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  const renderStatusWarning = () => {
    if (canSign) return null;

    return (
      <MessageBar intent="warning" className="mb-4">
        <MessageBarBody>
          <MessageBarTitle>Cannot Sign Document</MessageBarTitle>
          <div className="mt-2">
            <Text size={300}>{statusInfo.description}</Text>
            <div className="mt-2">
              <Text size={200} weight="semibold">Next actions:</Text>
              <ul className="mt-1 ml-4">
                {statusInfo.nextActions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-600">• {action}</li>
                ))}
              </ul>
            </div>
          </div>
        </MessageBarBody>
      </MessageBar>
    );
  };

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <DocumentRegular className="text-2xl text-blue-600" />
          <div className="flex-1">
            <Text weight="semibold" className="block">
              {selectedFile.name}
            </Text>
            <Text size={200} className="text-gray-600">
              {formatFileSize(selectedFile.size)} • {selectedFile.type}
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
            size="small"
          />
        </div>
      </Card>
    );
  };

  const renderDropZone = () => {
    if (selectedFile) return null;

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <ArrowUploadRegular className="text-4xl text-gray-400 mx-auto mb-3" />
        <Text weight="semibold" className="block mb-2">
          Drop signed document here
        </Text>
        <Text size={300} className="text-gray-600 block mb-3">
          or click to browse
        </Text>
        <Text size={200} className="text-gray-500">
          Supported formats: PDF, DOCX, XLSX, TXT (Max 50MB)
        </Text>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  };

  const renderUploadProgress = () => {
    if (!isUploading && !uploadComplete) return null;

    return (
      <div className="space-y-3">
        {isUploading && (
          <>
            <ProgressBar value={uploadProgress / 100} />
            <div className="flex items-center justify-between">
              <Text size={300}>Uploading... {uploadProgress}%</Text>
              <Spinner size="tiny" />
            </div>
          </>
        )}
        
        {uploadComplete && (
          <MessageBar intent="success">
            <MessageBarBody>
              <div className="flex items-center gap-2">
                <CheckmarkCircleRegular />
                <Text weight="semibold">Document signed successfully!</Text>
              </div>
            </MessageBarBody>
          </MessageBar>
        )}
      </div>
    );
  };

  // Don't render button if document cannot be signed
  if (!canSign) {
    return (
      <div className="relative">
        <Button
          appearance="primary"
          icon={<DocumentArrowUpRegular />}
          disabled={true}
        >
          Manual Signature
        </Button>
        {/* Tooltip or popover could be added here to explain why it's disabled */}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<DocumentArrowUpRegular />}
          disabled={disabled}
        >
          Manual Signature
        </Button>
      </DialogTrigger>
      
      <DialogSurface style={{ maxWidth: '600px' }}>
        <DialogTitle>Upload Manually Signed Document</DialogTitle>
        
        <DialogBody>
          <DialogContent className="space-y-4">
            <MessageBar intent="info">
              <MessageBarBody>
                <MessageBarTitle>Document: {documentName}</MessageBarTitle>
                Upload the signed version of this document. The system will create a new version and mark it as signed.
              </MessageBarBody>
            </MessageBar>

            {renderStatusWarning()}

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <div className="flex items-center gap-2">
                    <ErrorCircleRegular />
                    {error}
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            {renderDropZone()}
            {renderFileInfo()}
            {renderUploadProgress()}

            <MessageBar intent="warning">
              <MessageBarBody>
                <div className="flex items-start gap-2">
                  <WarningRegular className="mt-0.5" />
                  <div>
                    <Text size={300} weight="semibold" className="block">
                      Important:
                    </Text>
                    <Text size={300}>
                      Make sure the document is properly signed before uploading. 
                      All pages should be included and signatures should be clearly visible.
                    </Text>
                  </div>
                </div>
              </MessageBarBody>
            </MessageBar>
          </DialogContent>
        </DialogBody>

        <DialogActions>
          <Button
            appearance="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowUploadRegular />}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadComplete || !canSign}
          >
            {isUploading ? 'Uploading...' : 'Upload & Sign'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default ManualSignatureUpload;

