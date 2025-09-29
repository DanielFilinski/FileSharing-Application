/**
 * SignatureWidget - main component for initiating document signing
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Spinner,
  Text,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import {
  SignatureRegular,
  PersonAddRegular,
  SendRegular,
  DismissRegular,
  InfoRegular,
  CalendarRegular,
  SettingsRegular
} from '@fluentui/react-icons';

import { signatureApi, CreateSignatureRequestData } from '../../shared/api/signatureApi';
import { 
  SignatureRequest, 
  SignatureMethod, 
  Signer, 
  OrganizationSignatureSettings 
} from '../../shared/types/signature';
import { notificationService } from '../../shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minHeight: '500px',
    width: '600px'
  },

  signersSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },

  signerCard: {
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  signerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },

  signerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS
  },

  addSignerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },

  addSignerRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'end'
  },

  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },

  previewCard: {
    padding: tokens.spacingHorizontalM
  },

  loadingOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalL
  }
});

export interface SignatureWidgetProps {
  documentId: string;
  documentName: string;
  onSignatureRequestCreated?: (signatureRequest: SignatureRequest) => void;
  onClose?: () => void;
  trigger?: React.ReactElement;
}

interface SignerFormData {
  email: string;
  name: string;
  role: Signer['role'];
  order: number;
}

export const SignatureWidget: React.FC<SignatureWidgetProps> = ({
  documentId,
  documentName,
  onSignatureRequestCreated,
  onClose,
  trigger
}) => {
  const styles = useStyles();

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<OrganizationSignatureSettings | null>(null);
  const [signers, setSigners] = useState<SignerFormData[]>([]);
  
  // Form state
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<Signer['role']>('signer');
  
  // Signature settings
  const [selectedMethod, setSelectedMethod] = useState<SignatureMethod>('docusign');
  const [subject, setSubject] = useState(`Please sign: ${documentName}`);
  const [message, setMessage] = useState('Please review and sign this document.');
  const [expirationDays, setExpirationDays] = useState(30);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load organization settings when component mounts
  useEffect(() => {
    if (isOpen) {
      loadOrganizationSettings();
    }
  }, [isOpen]);

  const loadOrganizationSettings = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const orgSettings = await signatureApi.getSignatureSettings();
      setSettings(orgSettings);
      setSelectedMethod(orgSettings.defaultMethod);
      setExpirationDays(orgSettings.workflowSettings.defaultExpirationDays);
      setReminderDays(orgSettings.workflowSettings.defaultReminderDays);
      setEmailNotifications(orgSettings.workflowSettings.autoSendReminders);
    } catch (err: any) {
      console.error('Failed to load organization settings:', err);
      setError('Failed to load organization settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSigner = (): void => {
    if (!newSignerEmail || !newSignerName) {
      setError('Email and signer name are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSignerEmail)) {
      setError('Enter a valid email address');
      return;
    }

    // Check for duplicate emails
    if (signers.some(s => s.email.toLowerCase() === newSignerEmail.toLowerCase())) {
      setError('Signer with this email is already added');
      return;
    }

    const newSigner: SignerFormData = {
      email: newSignerEmail.trim(),
      name: newSignerName.trim(),
      role: newSignerRole,
      order: signers.length + 1
    };

    setSigners([...signers, newSigner]);
    
    // Reset form
    setNewSignerEmail('');
    setNewSignerName('');
    setNewSignerRole('signer');
    setError(null);
  };

  const handleRemoveSigner = (email: string): void => {
    setSigners(signers.filter(s => s.email !== email));
  };

  const handleCreateSignatureRequest = async (): Promise<void> => {
    if (signers.length === 0) {
      setError('Add at least one signer');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signatureRequestData: CreateSignatureRequestData = {
        signers: signers.map(signer => ({
          email: signer.email,
          name: signer.name,
          role: signer.role,
          order: signer.order,
          authenticationMethods: ['email'],
          emailNotifications: emailNotifications,
          reminderEnabled: emailNotifications
        })),
        settings: {
          signingOrder: 'sequential',
          emailNotifications,
          reminderSettings: {
            enabled: emailNotifications,
            intervalDays: reminderDays,
            maxReminders: 3
          },
          expirationDays,
          requireAllSignersToSign: true,
          allowDecline: true,
          allowComments: true,
          downloadable: true,
          printable: true
        },
        subject,
        message
      };

      const signatureRequest = await signatureApi.createSignatureRequest(documentId, signatureRequestData);
      
      notificationService.success(
        'Signature request created',
        `Document sent for signature to ${signers.length} recipients`
      );

      if (onSignatureRequestCreated) {
        onSignatureRequestCreated(signatureRequest);
      }

      // Reset and close
      handleClose();

    } catch (err: any) {
      console.error('Failed to create signature request:', err);
      setError(err.message || 'Failed to create signature request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setSigners([]);
    setError(null);
    setSubject(`Please sign: ${documentName}`);
    setMessage('Please review and sign this document.');
    
    if (onClose) {
      onClose();
    }
  };

  const renderSignersList = () => {
    if (signers.length === 0) {
      return (
        <Text size={300} style={{ fontStyle: 'italic', color: tokens.colorNeutralForeground3 }}>
          Подписанты не добавлены
        </Text>
      );
    }

    return (
      <div className={styles.signersSection}>
        {signers.map((signer, index) => (
          <div key={signer.email} className={styles.signerCard}>
            <div className={styles.signerInfo}>
              <Text weight="semibold">{signer.name}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                {signer.email}
              </Text>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, alignItems: 'center' }}>
                <Badge size="small" color="informative">
                  {signatureApi.formatSignerRole(signer.role)}
                </Badge>
                <Badge size="small" color="neutral">
                  Порядок: {signer.order}
                </Badge>
              </div>
            </div>
            <div className={styles.signerActions}>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => handleRemoveSigner(signer.email)}
                size="small"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAddSignerForm = () => (
    <div className={styles.addSignerForm}>
      <Text weight="semibold">Добавить подписанта</Text>
      <div className={styles.addSignerRow}>
        <Field label="Email" style={{ flex: 1 }}>
          <Input
            value={newSignerEmail}
            onChange={(_, data) => setNewSignerEmail(data.value)}
            placeholder="email@company.com"
          />
        </Field>
        <Field label="Имя" style={{ flex: 1 }}>
          <Input
            value={newSignerName}
            onChange={(_, data) => setNewSignerName(data.value)}
            placeholder="Иван Иванов"
          />
        </Field>
        <Field label="Роль" style={{ width: '150px' }}>
          <Dropdown
            value={signatureApi.formatSignerRole(newSignerRole)}
            onOptionSelect={(_, data) => setNewSignerRole(data.optionValue as Signer['role'])}
          >
            <Option value="signer">Подписант</Option>
            <Option value="approver">Утверждающий</Option>
            <Option value="reviewer">Рецензент</Option>
            <Option value="cc">Копия</Option>
          </Dropdown>
        </Field>
        <Button
          appearance="primary"
          icon={<PersonAddRegular />}
          onClick={handleAddSigner}
        >
          Добавить
        </Button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className={styles.settingsSection}>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <SettingsRegular />
        <Text weight="semibold">Настройки подписания</Text>
      </div>
      
      <Field label="Тема письма">
        <Input
          value={subject}
          onChange={(_, data) => setSubject(data.value)}
        />
      </Field>
      
      <Field label="Сообщение">
        <Textarea
          value={message}
          onChange={(_, data) => setMessage(data.value)}
          rows={3}
        />
      </Field>

      <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
        <Field label="Метод подписи" style={{ flex: 1 }}>
          <Dropdown
            value={signatureApi.formatSignatureMethod(selectedMethod)}
            onOptionSelect={(_, data) => setSelectedMethod(data.optionValue as SignatureMethod)}
          >
            {settings?.enabledMethods.map(method => (
              <Option key={method} value={method}>
                {signatureApi.formatSignatureMethod(method)}
              </Option>
            ))}
          </Dropdown>
        </Field>

        <Field label="Срок подписания (дни)" style={{ width: '120px' }}>
          <Input
            type="number"
            value={expirationDays.toString()}
            onChange={(_, data) => setExpirationDays(parseInt(data.value) || 30)}
            min={1}
            max={365}
          />
        </Field>

        <Field label="Напоминания (дни)" style={{ width: '120px' }}>
          <Input
            type="number"
            value={reminderDays.toString()}
            onChange={(_, data) => setReminderDays(parseInt(data.value) || 3)}
            min={1}
            max={30}
          />
        </Field>
      </div>
    </div>
  );

  const renderPreview = () => (
    <Card className={styles.previewCard}>
      <CardHeader
        header={<Text weight="semibold">Предварительный просмотр</Text>}
        description={<Text size={200}>Проверьте детали перед отправкой</Text>}
      />
      <CardPreview>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
          <div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              Документ:
            </Text>
            <Text weight="semibold">{documentName}</Text>
          </div>
          <div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              Подписантов:
            </Text>
            <Text weight="semibold">{signers.length}</Text>
          </div>
          <div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              Метод подписи:
            </Text>
            <Text weight="semibold">{signatureApi.formatSignatureMethod(selectedMethod)}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
            <CalendarRegular fontSize={16} />
            <Text size={200}>
              Истекает через {expirationDays} дней
            </Text>
          </div>
        </div>
      </CardPreview>
    </Card>
  );

  const defaultTrigger = (
    <Button
      appearance="primary"
      icon={<SignatureRegular />}
    >
      Отправить на подпись
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogSurface>
        <DialogTitle>Отправить документ на подпись</DialogTitle>
        <DialogBody>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <Spinner size="medium" />
              <Text>Загрузка настроек...</Text>
            </div>
          )}

          {!isLoading && (
            <div className={styles.dialogContent}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>
                    <MessageBarTitle>Ошибка</MessageBarTitle>
                    {error}
                  </MessageBarBody>
                </MessageBar>
              )}

              <MessageBar intent="info" icon={<InfoRegular />}>
                <MessageBarBody>
                  <MessageBarTitle>Документ</MessageBarTitle>
                  {documentName}
                </MessageBarBody>
              </MessageBar>

              {renderAddSignerForm()}
              {renderSignersList()}
              {renderSettings()}
              {renderPreview()}
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="secondary" onClick={handleClose}>
              Отмена
            </Button>
          </DialogTrigger>
          <Button
            appearance="primary"
            icon={<SendRegular />}
            onClick={handleCreateSignatureRequest}
            disabled={isLoading || signers.length === 0}
          >
            {isLoading ? 'Отправка...' : 'Отправить на подпись'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default SignatureWidget;
