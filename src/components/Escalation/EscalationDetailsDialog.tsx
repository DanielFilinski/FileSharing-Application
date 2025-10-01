/**
 * EscalationDetailsDialog Component
 * Dialog for viewing and managing escalation details
 */

import React, { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Text,
  Textarea,
  Card,
  CardHeader,
  CardPreview,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
  Dropdown,
  Option,
  Label,
  Field,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  Clock24Regular,
  Alert24Regular,
  Comment24Regular,
  Edit24Regular,
  DismissCircle24Regular,
  Person24Regular,
  Calendar24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import { Escalation, EscalationComment, UpdateEscalationRequest } from '../../shared/lib/escalation/types';
import { useEscalation } from '../../shared/hooks/useEscalation';

interface EscalationDetailsDialogProps {
  escalation: Escalation;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const EscalationDetailsDialog: React.FC<EscalationDetailsDialogProps> = ({
  escalation,
  open,
  onClose,
  onUpdate,
}) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const {
    escalation: currentEscalation,
    comments,
    history,
    loading,
    error,
    addComment,
    updateEscalation,
    acknowledge,
    start,
    resolve,
    close,
    assign,
  } = useEscalation(escalation.id, {
    autoRefresh: true,
    refreshInterval: 10000, // 10 seconds
  });

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const result = await addComment(newComment, isInternalComment);
      if (result.success) {
        setNewComment('');
        setIsInternalComment(false);
        setShowCommentForm(false);
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    let updateRequest: UpdateEscalationRequest = { status: newStatus as any };
    
    if (newStatus === 'resolved') {
      // For resolution, we might want to prompt for notes
      const notes = prompt('Resolution notes (optional):');
      if (notes) {
        updateRequest.resolutionNotes = notes;
      }
    }

    try {
      const result = await updateEscalation(updateRequest);
      if (result.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update escalation:', err);
    }
  };

  const handleAssign = async () => {
    const assignedTo = prompt('Assign to (User ID):');
    if (assignedTo) {
      try {
        const result = await assign(assignedTo);
        if (result.success) {
          onUpdate();
        }
      } catch (err) {
        console.error('Failed to assign escalation:', err);
      }
    }
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return '#d13438';
      case 'high': return '#ff8c00';
      case 'medium': return '#ffd700';
      case 'low': return '#107c10';
      default: return '#605e5c';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return '#d13438';
      case 'acknowledged': return '#ff8c00';
      case 'in_progress': return '#0078d4';
      case 'resolved': return '#107c10';
      case 'closed': return '#605e5c';
      case 'escalated': return '#a80000';
      default: return '#605e5c';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Alert24Regular />;
      case 'acknowledged': return <Clock24Regular />;
      case 'in_progress': return <Clock24Regular />;
      case 'resolved': return <CheckmarkCircle24Regular />;
      case 'closed': return <DismissCircle24Regular />;
      case 'escalated': return <Alert24Regular />;
      default: return <Clock24Regular />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (): boolean => {
    if (!currentEscalation?.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(currentEscalation.dueDate);
    return now > dueDate && currentEscalation.status !== 'resolved' && currentEscalation.status !== 'closed';
  };

  // ==========================================
  // RENDER
  // ==========================================

  const escalationToShow = currentEscalation || escalation;

  return (
    <FluentProvider theme={webLightTheme}>
      <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface style={{ width: '800px', maxHeight: '90vh' }}>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <Text size={500} weight="semibold">
                Escalation Details
              </Text>
              <div className="flex items-center gap-2">
                {isOverdue() && (
                  <Badge appearance="filled" color="danger">
                    Overdue
                  </Badge>
                )}
                <Badge
                  appearance="filled"
                  style={{ backgroundColor: getPriorityColor(escalationToShow.priority) }}
                >
                  {escalationToShow.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          
          <DialogBody>
            <DialogContent>
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="small" />
                  <Text className="ml-2">Loading...</Text>
                </div>
              )}

              {error && (
                <MessageBar intent="error" className="mb-4">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <div className="space-y-6">
                {/* Header Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Text size={400} weight="semibold">
                          {escalationToShow.title}
                        </Text>
                        <Text size={200} className="text-gray-600">
                          ID: {escalationToShow.id}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(escalationToShow.status)}
                        <Badge
                          appearance="filled"
                          style={{ backgroundColor: getStatusColor(escalationToShow.status) }}
                        >
                          {escalationToShow.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Details */}
                <Card>
                  <CardHeader>
                    <Text weight="semibold">Details</Text>
                  </CardHeader>
                  <CardPreview>
                    <div className="p-4 space-y-3">
                      <div>
                        <Label>Description</Label>
                        <Text>{escalationToShow.description}</Text>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Text>{escalationToShow.type.replace('_', ' ')}</Text>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Text>{escalationToShow.category}</Text>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Created By</Label>
                          <div className="flex items-center gap-2">
                            <Person24Regular />
                            <Text>{escalationToShow.createdByName}</Text>
                          </div>
                        </div>
                        <div>
                          <Label>Created</Label>
                          <div className="flex items-center gap-2">
                            <Calendar24Regular />
                            <Text>{formatDate(escalationToShow.createdAt)}</Text>
                          </div>
                        </div>
                      </div>

                      {escalationToShow.assignedTo && (
                        <div>
                          <Label>Assigned To</Label>
                          <Text>{escalationToShow.assignedToName || escalationToShow.assignedTo}</Text>
                        </div>
                      )}

                      {escalationToShow.dueDate && (
                        <div>
                          <Label>Due Date</Label>
                          <Text>{formatDate(escalationToShow.dueDate)}</Text>
                        </div>
                      )}

                      {escalationToShow.tags && escalationToShow.tags.length > 0 && (
                        <div>
                          <Label>Tags</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag24Regular />
                            <div className="flex flex-wrap gap-1">
                              {escalationToShow.tags.map((tag, index) => (
                                <Badge key={index} appearance="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardPreview>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <Text weight="semibold">Actions</Text>
                  </CardHeader>
                  <CardPreview>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {escalationToShow.status === 'open' && (
                          <Button
                            appearance="primary"
                            onClick={() => handleStatusChange('acknowledged')}
                          >
                            Acknowledge
                          </Button>
                        )}
                        
                        {['open', 'acknowledged'].includes(escalationToShow.status) && (
                          <Button
                            appearance="primary"
                            onClick={() => handleStatusChange('in_progress')}
                          >
                            Start Working
                          </Button>
                        )}
                        
                        {['acknowledged', 'in_progress'].includes(escalationToShow.status) && (
                          <Button
                            appearance="primary"
                            onClick={() => handleStatusChange('resolved')}
                          >
                            Resolve
                          </Button>
                        )}
                        
                        {escalationToShow.status === 'resolved' && (
                          <Button
                            appearance="primary"
                            onClick={() => handleStatusChange('closed')}
                          >
                            Close
                          </Button>
                        )}
                        
                        <Button
                          appearance="secondary"
                          onClick={handleAssign}
                        >
                          Assign
                        </Button>
                        
                        <Button
                          appearance="secondary"
                          onClick={() => setShowCommentForm(true)}
                          icon={<Comment24Regular />}
                        >
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </CardPreview>
                </Card>

                {/* Comments */}
                {comments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Text weight="semibold">Comments ({comments.length})</Text>
                    </CardHeader>
                    <CardPreview>
                      <div className="p-4 space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Person24Regular />
                                <Text weight="semibold">{comment.authorName}</Text>
                                {comment.isInternal && (
                                  <Badge appearance="outline" color="warning">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                              <Text size={200} className="text-gray-600">
                                {formatDate(comment.createdAt)}
                              </Text>
                            </div>
                            <Text className="mt-1">{comment.content}</Text>
                          </div>
                        ))}
                      </div>
                    </CardPreview>
                  </Card>
                )}

                {/* Add Comment Form */}
                {showCommentForm && (
                  <Card>
                    <CardHeader>
                      <Text weight="semibold">Add Comment</Text>
                    </CardHeader>
                    <CardPreview>
                      <div className="p-4 space-y-4">
                        <Field>
                          <Textarea
                            value={newComment}
                            onChange={(_, data) => setNewComment(data.value)}
                            placeholder="Enter your comment..."
                            rows={3}
                          />
                        </Field>
                        
                        <Field>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="internal-comment"
                              checked={isInternalComment}
                              onChange={(e) => setIsInternalComment(e.target.checked)}
                            />
                            <Label htmlFor="internal-comment">Internal comment (not visible to clients)</Label>
                          </div>
                        </Field>
                        
                        <div className="flex gap-2">
                          <Button
                            appearance="primary"
                            onClick={handleAddComment}
                            disabled={commentLoading || !newComment.trim()}
                          >
                            {commentLoading ? (
                              <>
                                <Spinner size="tiny" className="mr-2" />
                                Adding...
                              </>
                            ) : (
                              'Add Comment'
                            )}
                          </Button>
                          <Button
                            appearance="secondary"
                            onClick={() => {
                              setShowCommentForm(false);
                              setNewComment('');
                              setIsInternalComment(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardPreview>
                  </Card>
                )}

                {/* History */}
                {history.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Text weight="semibold">History ({history.length})</Text>
                    </CardHeader>
                    <CardPreview>
                      <div className="p-4 space-y-3">
                        {history.map((entry, index) => (
                          <div key={entry.id || index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <Text weight="semibold">
                                  {entry.action.replace('_', ' ').toUpperCase()}
                                </Text>
                                <Text size={200} className="text-gray-600">
                                  {formatDate(entry.timestamp)}
                                </Text>
                              </div>
                              <Text size={200} className="text-gray-600">
                                by {entry.performedByName}
                              </Text>
                              {entry.notes && (
                                <Text className="mt-1">{entry.notes}</Text>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardPreview>
                  </Card>
                )}
              </div>
            </DialogContent>
          </DialogBody>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};
