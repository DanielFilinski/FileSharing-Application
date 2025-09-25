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
  Dropdown,
  Option,
  makeStyles,
  tokens,
  Checkbox,
  Avatar,
  Tag
} from '@fluentui/react-components';
import { ShareAndroid20Regular, PersonRegular, DeleteRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialog: {
    minWidth: '500px',
    maxWidth: '600px'
  },
  section: {
    marginBottom: '16px'
  },
  userInput: {
    width: '100%',
    marginTop: '8px'
  },
  userList: {
    marginTop: '12px'
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    marginBottom: '4px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  permissionDropdown: {
    minWidth: '120px'
  },
  linkSection: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: '12px'
  },
  linkInput: {
    width: '100%',
    marginTop: '8px'
  },
  copyButton: {
    marginTop: '8px'
  }
});

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (users: string[], permissions: Record<string, string>, linkSettings: { enabled: boolean; permission: string }) => void;
  documentNames?: string[];
  isBulk?: boolean;
}

interface SharedUser {
  email: string;
  permission: 'view' | 'edit' | 'full';
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  onShare,
  documentNames = [],
  isBulk = false
}) => {
  const styles = useStyles();
  const [emailInput, setEmailInput] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkPermission, setLinkPermission] = useState<'view' | 'edit'>('view');
  const [shareLink, setShareLink] = useState('');

  const handleAddUser = () => {
    const email = emailInput.trim();
    if (email && !sharedUsers.find(u => u.email === email)) {
      setSharedUsers(prev => [...prev, { email, permission: 'view' }]);
      setEmailInput('');
    }
  };

  const handleRemoveUser = (email: string) => {
    setSharedUsers(prev => prev.filter(u => u.email !== email));
  };

  const handlePermissionChange = (email: string, permission: 'view' | 'edit' | 'full') => {
    setSharedUsers(prev => 
      prev.map(u => u.email === email ? { ...u, permission } : u)
    );
  };

  const handleGenerateLink = () => {
    // Generate a mock sharing link
    const linkId = Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/shared/${linkId}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    // Could show a toast notification here
  };

  const handleShare = () => {
    const userEmails = sharedUsers.map(u => u.email);
    const permissions = sharedUsers.reduce((acc, user) => {
      acc[user.email] = user.permission;
      return acc;
    }, {} as Record<string, string>);

    onShare(userEmails, permissions, {
      enabled: linkEnabled,
      permission: linkPermission
    });
    
    // Reset form
    setSharedUsers([]);
    setEmailInput('');
    setLinkEnabled(false);
    setShareLink('');
    onClose();
  };

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'view': return 'Can view';
      case 'edit': return 'Can edit';
      case 'full': return 'Full access';
      default: return 'Can view';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <ShareAndroid20Regular style={{ marginRight: '8px' }} />
            {isBulk ? `Share ${documentNames.length} documents` : 'Share Document'}
          </DialogTitle>
          <DialogContent>
            {documentNames.length > 0 && (
              <div className={styles.section}>
                <Text weight="semibold">Documents to share:</Text>
                <div style={{ marginTop: '8px' }}>
                  {documentNames.slice(0, 3).map((name, index) => (
                    <Tag key={index} size="small" style={{ marginRight: '4px', marginBottom: '4px' }}>
                      {name}
                    </Tag>
                  ))}
                  {documentNames.length > 3 && (
                    <Text size={200}>... and {documentNames.length - 3} more</Text>
                  )}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <Text weight="semibold">Add people:</Text>
              <Input
                className={styles.userInput}
                placeholder="Enter email address"
                value={emailInput}
                onChange={(_, data) => setEmailInput(data.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                contentAfter={
                  <Button 
                    appearance="transparent" 
                    onClick={handleAddUser}
                    disabled={!emailInput.trim()}
                  >
                    Add
                  </Button>
                }
              />
            </div>

            {sharedUsers.length > 0 && (
              <div className={styles.section}>
                <Text weight="semibold">People with access:</Text>
                <div className={styles.userList}>
                  {sharedUsers.map(user => (
                    <div key={user.email} className={styles.userItem}>
                      <div className={styles.userInfo}>
                        <Avatar 
                          name={user.email} 
                          size={32}
                          icon={<PersonRegular />}
                        />
                        <Text>{user.email}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Dropdown
                          value={getPermissionText(user.permission)}
                          onOptionSelect={(_, data) => 
                            handlePermissionChange(user.email, data.optionValue as 'view' | 'edit' | 'full')
                          }
                        >
                          <Option value="view">Can view</Option>
                          <Option value="edit">Can edit</Option>
                          <Option value="full">Full access</Option>
                        </Dropdown>
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          onClick={() => handleRemoveUser(user.email)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <Checkbox
                label="Anyone with the link can view"
                checked={linkEnabled}
                onChange={(_, data) => setLinkEnabled(!!data.checked)}
              />
              
              {linkEnabled && (
                <div className={styles.linkSection}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Text>Link permission:</Text>
                    <Dropdown
                      value={getPermissionText(linkPermission)}
                      onOptionSelect={(_, data) => setLinkPermission(data.optionValue as 'view' | 'edit')}
                    >
                      <Option value="view">Can view</Option>
                      <Option value="edit">Can edit</Option>
                    </Dropdown>
                  </div>
                  
                  {shareLink ? (
                    <div>
                      <Input
                        className={styles.linkInput}
                        value={shareLink}
                        readOnly
                      />
                      <Button
                        appearance="secondary"
                        className={styles.copyButton}
                        onClick={handleCopyLink}
                      >
                        Copy Link
                      </Button>
                    </div>
                  ) : (
                    <Button
                      appearance="secondary"
                      onClick={handleGenerateLink}
                    >
                      Generate Link
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleShare}
              disabled={sharedUsers.length === 0 && !linkEnabled}
            >
              Share
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
