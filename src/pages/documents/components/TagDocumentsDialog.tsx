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
  ProgressBar,
  MessageBar,
  Tag,
  Field,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  TagRegular,
  AddRegular,
  DismissRegular
} from '@fluentui/react-icons';
import { AdvancedDocumentApiClient } from '@/shared/api/advancedDocumentApi';

const useStyles = makeStyles({
  dialog: {
    minWidth: '450px',
    maxWidth: '600px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  tagInput: {
    width: '100%'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '40px'
  },
  documentsList: {
    maxHeight: '120px',
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  documentItem: {
    padding: '4px 0',
    fontSize: tokens.fontSizeBase200
  },
  progress: {
    marginTop: '12px'
  },
  suggestedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '8px'
  }
});

interface TagDocumentsDialogProps {
  isOpen: boolean;
  documents: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TagDocumentsDialog: React.FC<TagDocumentsDialogProps> = ({
  isOpen,
  documents,
  onClose,
  onSuccess
}) => {
  const styles = useStyles();
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Suggested tags based on common document types
  const suggestedTags = [
    'Important',
    'Review Required',
    'Client Document',
    'Tax Document',
    'Contract',
    'Report',
    'Template',
    'Draft',
    'Final',
    'Archive'
  ];

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
      setError(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      setError('Please add at least one tag');
      return;
    }

    if (documents.length === 0) {
      setError('No documents selected');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      const documentIds = documents.map(doc => doc.id);
      const result = await AdvancedDocumentApiClient.bulkOperation(
        documentIds,
        'tag',
        { tags: selectedTags }
      );

      setProgress(100);

      if (result.summary.successful > 0) {
        // Success - close dialog after showing results
        setTimeout(() => {
          clearInterval(progressInterval);
          onSuccess?.();
          handleClose();
        }, 1000);
      }

      if (result.summary.failed > 0) {
        setError(`${result.summary.failed} documents failed to be tagged`);
      }

    } catch (error: any) {
      console.error('Tag operation failed:', error);
      setError(`Tagging failed: ${error.message}`);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    
    setTagInput('');
    setSelectedTags([]);
    setProgress(0);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <TagRegular /> Tag Documents
          </DialogTitle>
          
          <DialogContent className={styles.content}>
            {/* Documents List */}
            <Field label={`Documents to tag (${documents.length})`}>
              <div className={styles.documentsList}>
                {documents.slice(0, 10).map((doc) => (
                  <div key={doc.id} className={styles.documentItem}>
                    • {doc.name}
                  </div>
                ))}
                {documents.length > 10 && (
                  <div className={styles.documentItem}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      ... and {documents.length - 10} more documents
                    </Text>
                  </div>
                )}
              </div>
            </Field>

            {/* Tag Input */}
            <Field 
              label="Add Tags"
              hint="Press Enter to add tag"
              validationMessage={error && error.includes('tag') ? error : undefined}
              validationState={error && error.includes('tag') ? 'error' : 'none'}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <Input
                  className={styles.tagInput}
                  placeholder="Enter tag name..."
                  value={tagInput}
                  onChange={(_, data) => {
                    setTagInput(data.value);
                    setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isProcessing}
                />
                <Button
                  icon={<AddRegular />}
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isProcessing}
                  size="small"
                >
                  Add
                </Button>
              </div>
            </Field>

            {/* Suggested Tags */}
            <Field label="Suggested Tags (click to add)">
              <div className={styles.suggestedTags}>
                {suggestedTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map((tag) => (
                    <Tag
                      key={tag}
                      size="small"
                      appearance="outline"
                      onClick={() => handleSuggestedTagClick(tag)}
                      style={{ cursor: 'pointer' }}
                      disabled={isProcessing}
                    >
                      {tag}
                    </Tag>
                  ))}
              </div>
            </Field>

            {/* Selected Tags */}
            <Field label={`Selected Tags (${selectedTags.length})`}>
              <div className={styles.tagsContainer}>
                {selectedTags.length === 0 ? (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No tags selected. Add tags using the input above.
                  </Text>
                ) : (
                  selectedTags.map((tag) => (
                    <Tag
                      key={tag}
                      size="medium"
                      appearance="filled"
                      dismissible
                      dismissIcon={{ onClick: () => handleRemoveTag(tag) }}
                      disabled={isProcessing}
                    >
                      {tag}
                    </Tag>
                  ))
                )}
              </div>
            </Field>

            {/* Progress */}
            {isProcessing && (
              <div className={styles.progress}>
                <Text>Applying tags to documents...</Text>
                <ProgressBar value={progress / 100} />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <MessageBar intent="error">
                {error}
              </MessageBar>
            )}
          </DialogContent>

          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              appearance="primary"
              onClick={handleConfirm}
              disabled={selectedTags.length === 0 || isProcessing || documents.length === 0}
              icon={isProcessing ? undefined : <TagRegular />}
            >
              {isProcessing 
                ? 'Applying Tags...' 
                : `Apply Tags to ${documents.length} Document(s)`
              }
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
