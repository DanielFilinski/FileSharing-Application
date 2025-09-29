/**
 * FragmentList - компонент для отображения и управления фрагментами документа
 * Поддерживает создание, редактирование и разрешение фрагментов
 */

import React, { useState } from 'react';
import {
  Stack,
  Text,
  IconButton,
  DefaultButton,
  PrimaryButton,
  TextField,
  Dropdown,
  IDropdownOption,
  TagPicker,
  ITag,
  Panel,
  PanelType,
  MessageBar,
  MessageBarType,
  Separator,
  ChoiceGroup,
  IChoiceGroupOption,
  SpinButton,
  Slider
} from '@fluentui/react';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Checkmark24Regular,
  Highlight24Regular,
  Pin24Regular,
  More24Regular
} from '@fluentui/react-icons';
import { 
  DocumentFragment, 
  CreateFragmentRequest, 
  UpdateFragmentRequest,
  CHAT_CONSTANTS 
} from '../../shared/types/chat';
import { formatRelativeTime } from '../../shared/utils/dateUtils';

export interface FragmentListProps {
  fragments: DocumentFragment[];
  onCreateFragment: (fragment: Omit<DocumentFragment, 'id' | 'documentId' | 'createdAt' | 'createdBy' | 'createdByName' | 'isActive' | 'isResolved'>) => void;
  onUpdateFragment: (fragmentId: string, updates: UpdateFragmentRequest) => void;
  onFragmentClick: (fragment: DocumentFragment) => void;
  readonly?: boolean;
}

interface FragmentFormData {
  selectionType: 'text' | 'image' | 'section';
  selectedText: string;
  startPosition: number;
  endPosition: number;
  pageNumber?: number;
  sectionTitle?: string;
  highlightColor: string;
  referenceTitle: string;
  referenceDescription: string;
  tags: string[];
}

export const FragmentList: React.FC<FragmentListProps> = ({
  fragments,
  onCreateFragment,
  onUpdateFragment,
  onFragmentClick,
  readonly = false
}) => {
  // State
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingFragment, setEditingFragment] = useState<DocumentFragment | null>(null);
  const [fragmentForm, setFragmentForm] = useState<FragmentFormData>({
    selectionType: 'text',
    selectedText: '',
    startPosition: 0,
    endPosition: 0,
    pageNumber: 1,
    sectionTitle: '',
    highlightColor: CHAT_CONSTANTS.FRAGMENT_HIGHLIGHT_COLORS[0],
    referenceTitle: '',
    referenceDescription: '',
    tags: []
  });
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Form Handlers
  // ==========================================

  const resetForm = () => {
    setFragmentForm({
      selectionType: 'text',
      selectedText: '',
      startPosition: 0,
      endPosition: 0,
      pageNumber: 1,
      sectionTitle: '',
      highlightColor: CHAT_CONSTANTS.FRAGMENT_HIGHLIGHT_COLORS[0],
      referenceTitle: '',
      referenceDescription: '',
      tags: []
    });
    setError(null);
  };

  const handleCreateFragment = () => {
    if (!readonly) {
      resetForm();
      setEditingFragment(null);
      setShowCreatePanel(true);
    }
  };

  const handleEditFragment = (fragment: DocumentFragment) => {
    if (!readonly) {
      setFragmentForm({
        selectionType: fragment.selectionType,
        selectedText: fragment.selectedText,
        startPosition: fragment.startPosition,
        endPosition: fragment.endPosition,
        pageNumber: fragment.pageNumber,
        sectionTitle: fragment.sectionTitle || '',
        highlightColor: fragment.highlightColor,
        referenceTitle: fragment.referenceTitle || '',
        referenceDescription: fragment.referenceDescription || '',
        tags: fragment.tags || []
      });
      setEditingFragment(fragment);
      setShowCreatePanel(true);
    }
  };

  const handleSaveFragment = async () => {
    try {
      if (!fragmentForm.selectedText.trim()) {
        setError('Selected text is required');
        return;
      }

      if (fragmentForm.startPosition >= fragmentForm.endPosition) {
        setError('End position must be greater than start position');
        return;
      }

      if (editingFragment) {
        // Update existing fragment
        const updates: UpdateFragmentRequest = {
          highlightColor: fragmentForm.highlightColor,
          referenceTitle: fragmentForm.referenceTitle,
          referenceDescription: fragmentForm.referenceDescription,
          tags: fragmentForm.tags
        };

        onUpdateFragment(editingFragment.id, updates);
      } else {
        // Create new fragment
        onCreateFragment({
          selectionType: fragmentForm.selectionType,
          selectedText: fragmentForm.selectedText,
          startPosition: fragmentForm.startPosition,
          endPosition: fragmentForm.endPosition,
          pageNumber: fragmentForm.pageNumber,
          sectionTitle: fragmentForm.sectionTitle,
          highlightColor: fragmentForm.highlightColor,
          referenceTitle: fragmentForm.referenceTitle,
          referenceDescription: fragmentForm.referenceDescription,
          tags: fragmentForm.tags
        });
      }

      setShowCreatePanel(false);
      setEditingFragment(null);
      resetForm();
    } catch (error) {
      setError('Failed to save fragment. Please try again.');
    }
  };

  const handleResolveFragment = (fragment: DocumentFragment) => {
    if (!readonly) {
      onUpdateFragment(fragment.id, { isResolved: !fragment.isResolved });
    }
  };

  const handleDeactivateFragment = (fragment: DocumentFragment) => {
    if (!readonly && confirm('Are you sure you want to deactivate this fragment?')) {
      onUpdateFragment(fragment.id, { isActive: false });
    }
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const getSelectionTypeOptions = (): IChoiceGroupOption[] => [
    { key: 'text', text: 'Text Selection' },
    { key: 'image', text: 'Image/Figure' },
    { key: 'section', text: 'Document Section' }
  ];

  const getColorOptions = (): IDropdownOption[] => 
    CHAT_CONSTANTS.FRAGMENT_HIGHLIGHT_COLORS.map(color => ({
      key: color,
      text: color.replace('#', '').toUpperCase(),
      data: { color }
    }));

  const renderColorOption = (option?: IDropdownOption): JSX.Element | null => {
    if (!option) return null;
    
    return (
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: option.data.color,
            border: '1px solid #ccc',
            borderRadius: '2px'
          }}
        />
        <Text>{option.text}</Text>
      </Stack>
    );
  };

  const getTagSuggestions = (filterText: string): ITag[] => {
    const existingTags = fragments
      .flatMap(f => f.tags || [])
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .filter(tag => tag.toLowerCase().includes(filterText.toLowerCase()))
      .map(tag => ({ key: tag, name: tag }));

    return existingTags;
  };

  const renderFragmentItem = (fragment: DocumentFragment) => {
    const isResolved = fragment.isResolved;
    const isInactive = !fragment.isActive;

    return (
      <div
        key={fragment.id}
        style={{
          padding: '12px',
          margin: '8px 0',
          border: '1px solid #e1e1e1',
          borderRadius: '4px',
          backgroundColor: isInactive ? '#f8f8f8' : isResolved ? '#f0fff4' : '#ffffff',
          cursor: 'pointer',
          opacity: isInactive ? 0.6 : 1
        }}
        onClick={() => onFragmentClick(fragment)}
      >
        <Stack tokens={{ childrenGap: 8 }}>
          {/* Header */}
          <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: fragment.highlightColor,
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />
              <Text variant="medium" weight="semibold">
                {fragment.referenceTitle || `Fragment ${fragment.id.substring(0, 8)}`}
              </Text>
              {isResolved && <Checkmark24Regular style={{ color: '#107c10' }} />}
              {isInactive && <Text variant="xSmall">(Inactive)</Text>}
            </Stack>

            {!readonly && (
              <Stack horizontal tokens={{ childrenGap: 4 }}>
                <IconButton
                  iconProps={{ iconName: isResolved ? 'StatusCircleCheckmark' : 'StatusCircleOuter' }}
                  title={isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolveFragment(fragment);
                  }}
                />
                <IconButton
                  iconProps={{ iconName: 'Edit' }}
                  title="Edit fragment"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFragment(fragment);
                  }}
                />
                <IconButton
                  iconProps={{ iconName: 'Delete' }}
                  title="Deactivate fragment"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivateFragment(fragment);
                  }}
                />
              </Stack>
            )}
          </Stack>

          {/* Content Preview */}
          <Text variant="small">
            {fragment.selectedText.length > 150 
              ? fragment.selectedText.substring(0, 150) + '...'
              : fragment.selectedText}
          </Text>

          {/* Metadata */}
          <Stack horizontal tokens={{ childrenGap: 16 }}>
            {fragment.pageNumber && (
              <Text variant="xSmall" style={{ color: '#666' }}>
                Page {fragment.pageNumber}
              </Text>
            )}
            {fragment.sectionTitle && (
              <Text variant="xSmall" style={{ color: '#666' }}>
                {fragment.sectionTitle}
              </Text>
            )}
            <Text variant="xSmall" style={{ color: '#666' }}>
              {formatRelativeTime(fragment.createdAt)} by {fragment.createdByName}
            </Text>
          </Stack>

          {/* Description */}
          {fragment.referenceDescription && (
            <Text variant="small" style={{ color: '#666', fontStyle: 'italic' }}>
              {fragment.referenceDescription}
            </Text>
          )}

          {/* Tags */}
          {fragment.tags && fragment.tags.length > 0 && (
            <Stack horizontal wrap tokens={{ childrenGap: 4 }}>
              {fragment.tags.map(tag => (
                <div
                  key={tag}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: '#e1f5fe',
                    border: '1px solid #b3e5fc',
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}
                >
                  {tag}
                </div>
              ))}
            </Stack>
          )}
        </Stack>
      </div>
    );
  };

  const renderCreateEditPanel = () => (
    <Panel
      isOpen={showCreatePanel}
      onDismiss={() => setShowCreatePanel(false)}
      type={PanelType.medium}
      headerText={editingFragment ? 'Edit Fragment' : 'Create Fragment'}
      closeButtonAriaLabel="Close panel"
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
          >
            {error}
          </MessageBar>
        )}

        {/* Selection Type */}
        <ChoiceGroup
          label="Selection Type"
          selectedKey={fragmentForm.selectionType}
          options={getSelectionTypeOptions()}
          onChange={(_, option) => 
            setFragmentForm(prev => ({ ...prev, selectionType: option?.key as any }))
          }
          disabled={!!editingFragment} // Can't change type when editing
        />

        {/* Selected Text */}
        <TextField
          label="Selected Text"
          multiline
          rows={4}
          value={fragmentForm.selectedText}
          onChange={(_, value) => 
            setFragmentForm(prev => ({ ...prev, selectedText: value || '' }))
          }
          maxLength={CHAT_CONSTANTS.MAX_FRAGMENT_TEXT_LENGTH}
          disabled={!!editingFragment} // Can't change text when editing
          required
        />

        {/* Position */}
        {!editingFragment && (
          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <SpinButton
              label="Start Position"
              value={fragmentForm.startPosition.toString()}
              onValidate={(value) => {
                const num = parseInt(value) || 0;
                setFragmentForm(prev => ({ ...prev, startPosition: Math.max(0, num) }));
                return num.toString();
              }}
              onIncrement={(value) => {
                const num = parseInt(value) || 0;
                return (num + 1).toString();
              }}
              onDecrement={(value) => {
                const num = parseInt(value) || 0;
                return Math.max(0, num - 1).toString();
              }}
              styles={{ root: { flex: 1 } }}
            />
            <SpinButton
              label="End Position"
              value={fragmentForm.endPosition.toString()}
              onValidate={(value) => {
                const num = parseInt(value) || 0;
                setFragmentForm(prev => ({ ...prev, endPosition: Math.max(0, num) }));
                return num.toString();
              }}
              onIncrement={(value) => {
                const num = parseInt(value) || 0;
                return (num + 1).toString();
              }}
              onDecrement={(value) => {
                const num = parseInt(value) || 0;
                return Math.max(0, num - 1).toString();
              }}
              styles={{ root: { flex: 1 } }}
            />
          </Stack>
        )}

        {/* Page Number */}
        {fragmentForm.selectionType !== 'section' && (
          <SpinButton
            label="Page Number (Optional)"
            value={fragmentForm.pageNumber?.toString() || ''}
            onValidate={(value) => {
              const num = parseInt(value) || undefined;
              setFragmentForm(prev => ({ ...prev, pageNumber: num }));
              return value;
            }}
            onIncrement={(value) => {
              const num = parseInt(value) || 0;
              return (num + 1).toString();
            }}
            onDecrement={(value) => {
              const num = parseInt(value) || 0;
              return Math.max(1, num - 1).toString();
            }}
            min={1}
          />
        )}

        {/* Section Title */}
        <TextField
          label="Section Title (Optional)"
          value={fragmentForm.sectionTitle}
          onChange={(_, value) => 
            setFragmentForm(prev => ({ ...prev, sectionTitle: value || '' }))
          }
        />

        {/* Highlight Color */}
        <Dropdown
          label="Highlight Color"
          selectedKey={fragmentForm.highlightColor}
          options={getColorOptions()}
          onChange={(_, option) => 
            setFragmentForm(prev => ({ ...prev, highlightColor: option?.key as string }))
          }
          onRenderOption={renderColorOption}
        />

        {/* Reference Title */}
        <TextField
          label="Reference Title"
          value={fragmentForm.referenceTitle}
          onChange={(_, value) => 
            setFragmentForm(prev => ({ ...prev, referenceTitle: value || '' }))
          }
          placeholder="Short descriptive title for this fragment"
        />

        {/* Reference Description */}
        <TextField
          label="Description (Optional)"
          multiline
          rows={3}
          value={fragmentForm.referenceDescription}
          onChange={(_, value) => 
            setFragmentForm(prev => ({ ...prev, referenceDescription: value || '' }))
          }
          placeholder="Additional context or notes about this fragment"
        />

        {/* Tags */}
        <TagPicker
          inputProps={{
            placeholder: 'Add tags...'
          }}
          onResolveSuggestions={getTagSuggestions}
          selectedItems={fragmentForm.tags.map(tag => ({ key: tag, name: tag }))}
          onChange={(items) => 
            setFragmentForm(prev => ({ 
              ...prev, 
              tags: items?.map(item => item.name) || [] 
            }))
          }
        />

        {/* Action Buttons */}
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <DefaultButton
            text="Cancel"
            onClick={() => setShowCreatePanel(false)}
          />
          <PrimaryButton
            text={editingFragment ? 'Update Fragment' : 'Create Fragment'}
            onClick={handleSaveFragment}
            disabled={!fragmentForm.selectedText.trim()}
          />
        </Stack>
      </Stack>
    </Panel>
  );

  // ==========================================
  // Main Render
  // ==========================================

  const activeFragments = fragments.filter(f => f.isActive);
  const resolvedFragments = activeFragments.filter(f => f.isResolved);
  const unresolvedFragments = activeFragments.filter(f => !f.isResolved);

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      {/* Header */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack>
          <Text variant="mediumPlus" weight="semibold">
            Document Fragments ({activeFragments.length})
          </Text>
          <Text variant="small" style={{ color: '#666' }}>
            {unresolvedFragments.length} pending, {resolvedFragments.length} resolved
          </Text>
        </Stack>
        
        {!readonly && (
          <PrimaryButton
            iconProps={{ iconName: 'Add' }}
            text="Create Fragment"
            onClick={handleCreateFragment}
          />
        )}
      </Stack>

      {/* Fragment List */}
      {activeFragments.length === 0 ? (
        <Stack horizontalAlign="center" tokens={{ padding: 32 }}>
          <Text variant="medium" style={{ color: '#666' }}>
            No fragments yet. Create your first fragment to start referencing specific parts of the document.
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 8 }}>
          {/* Unresolved Fragments */}
          {unresolvedFragments.length > 0 && (
            <Stack tokens={{ childrenGap: 8 }}>
              <Text variant="medium" weight="semibold">
                Pending Fragments
              </Text>
              {unresolvedFragments.map(renderFragmentItem)}
            </Stack>
          )}

          {/* Separator */}
          {unresolvedFragments.length > 0 && resolvedFragments.length > 0 && (
            <Separator />
          )}

          {/* Resolved Fragments */}
          {resolvedFragments.length > 0 && (
            <Stack tokens={{ childrenGap: 8 }}>
              <Text variant="medium" weight="semibold">
                Resolved Fragments
              </Text>
              {resolvedFragments.map(renderFragmentItem)}
            </Stack>
          )}
        </Stack>
      )}

      {/* Create/Edit Panel */}
      {renderCreateEditPanel()}
    </Stack>
  );
};
