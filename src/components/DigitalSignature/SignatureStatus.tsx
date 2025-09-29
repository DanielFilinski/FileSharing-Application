/**
 * SignatureStatus - компонент для отображения статуса подписи документа
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Button,
  Tooltip,
  ProgressBar,
  Spinner,
  makeStyles,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Avatar,
  MessageBar,
  MessageBarTitle,
  MessageBarBody
} from '@fluentui/react-components';
import {
  SignatureRegular,
  PersonRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  SendRegular,
  InfoRegular,
  WarningRegular,
  ChevronDownRegular
} from '@fluentui/react-icons';

import { signatureApi } from '../../shared/api/signatureApi';
import { SignatureRequest, Signer } from '../../shared/types/signature';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },

  statusCard: {
    padding: tokens.spacingHorizontalM
  },

  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS
  },

  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM
  },

  signersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },

  signerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },

  signerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },

  signerDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },

  signerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },

  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS
  },

  loadingOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalL,
    gap: tokens.spacingHorizontalS
  }
});

export interface SignatureStatusProps {
  documentId: string;
  signatureRequestId?: string;
  onRefresh?: () => void;
  compact?: boolean;
}

export const SignatureStatus: React.FC<SignatureStatusProps> = ({
  documentId,
  signatureRequestId,
  onRefresh,
  compact = false
}) => {
  const styles = useStyles();
  
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (signatureRequestId) {
      loadSignatureRequest();
    }
  }, [signatureRequestId]);

  const loadSignatureRequest = async () => {
    if (!signatureRequestId) return;

    try {
      setIsLoading(true);
      setError(null);
      const request = await signatureApi.getSignatureRequest(signatureRequestId);
      setSignatureRequest(request);
    } catch (err: any) {
      console.error('Failed to load signature request:', err);
      setError(err.message || 'Не удалось загрузить статус подписи');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSignatureRequest();
    setRefreshing(false);
    
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusIcon = (status: SignatureRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckmarkCircleRegular color={tokens.colorPaletteGreenForeground1} />;
      case 'pending':
      case 'in-progress':
        return <ClockRegular color={tokens.colorPaletteYellowForeground1} />;
      case 'failed':
      case 'cancelled':
        return <DismissCircleRegular color={tokens.colorPaletteRedForeground1} />;
      case 'expired':
        return <WarningRegular color={tokens.colorPaletteRedForeground1} />;
      default:
        return <InfoRegular />;
    }
  };

  const getSignerStatusIcon = (status: Signer['status']) => {
    switch (status) {
      case 'signed':
        return <CheckmarkCircleRegular color={tokens.colorPaletteGreenForeground1} />;
      case 'declined':
        return <DismissCircleRegular color={tokens.colorPaletteRedForeground1} />;
      case 'pending':
      case 'sent':
      case 'delivered':
        return <ClockRegular color={tokens.colorPaletteYellowForeground1} />;
      default:
        return <InfoRegular />;
    }
  };

  if (!signatureRequestId) {
    return (
      <MessageBar intent="info">
        <MessageBarBody>
          <MessageBarTitle>Подпись не требуется</MessageBarTitle>
          Этот документ не отправлен на подпись
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingOverlay}>
        <Spinner size="medium" />
        <Text>Загрузка статуса подписи...</Text>
      </div>
    );
  }

  if (error || !signatureRequest) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>Ошибка загрузки</MessageBarTitle>
          {error || 'Не удалось загрузить информацию о подписи'}
        </MessageBarBody>
      </MessageBar>
    );
  }

  const summary = signatureApi.generateSignatureRequestSummary(signatureRequest);
  const progress = signatureApi.calculateSigningProgress(signatureRequest);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        {getStatusIcon(signatureRequest.status)}
        <Text size={200}>{signatureApi.formatSignatureStatus(signatureRequest.status)}</Text>
        <Badge size="small" color={signatureApi.getStatusColor(signatureRequest.status)}>
          {summary.signedCount}/{summary.totalSigners}
        </Badge>
      </div>
    );
  }

  const renderSignerCard = (signer: Signer, index: number) => (
    <div key={signer.id} className={styles.signerCard}>
      <div className={styles.signerInfo}>
        <Avatar
          name={signer.name}
          size={32}
          badge={{
            status: signer.status === 'signed' ? 'available' : 
                   signer.status === 'declined' ? 'blocked' : 'away'
          }}
        />
        <div className={styles.signerDetails}>
          <Text weight="semibold">{signer.name}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {signer.email}
          </Text>
          <div className={styles.signerMeta}>
            <Badge size="small" color={signatureApi.getSignerStatusColor(signer.status)}>
              {signatureApi.formatSignerStatus(signer.status)}
            </Badge>
            <Badge size="small" color="neutral">
              {signatureApi.formatSignerRole(signer.role)}
            </Badge>
            {signatureRequest.settings.signingOrder === 'sequential' && (
              <Badge size="small" color="informative">
                Порядок: {signer.order}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        {getSignerStatusIcon(signer.status)}
        {signer.signedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
            <CalendarRegular fontSize={12} />
            <Text size={200}>
              {new Date(signer.signedAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <Card className={styles.statusCard}>
        <CardHeader
          header={
            <div className={styles.statusHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                {getStatusIcon(signatureRequest.status)}
                <Text size={500} weight="semibold">Статус подписи</Text>
              </div>
              <Button
                appearance="subtle"
                icon={<SendRegular />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Обновление...' : 'Обновить'}
              </Button>
            </div>
          }
          description={
            <Badge size="large" color={signatureApi.getStatusColor(signatureRequest.status)}>
              {signatureApi.formatSignatureStatus(signatureRequest.status)}
            </Badge>
          }
        />

        <CardPreview>
          <div className={styles.progressSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size={300} weight="semibold">
                Прогресс подписания: {summary.signedCount} из {summary.totalSigners}
              </Text>
              <Text size={200}>{progress}%</Text>
            </div>
            <ProgressBar value={progress / 100} />
            
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                <CheckmarkCircleRegular color={tokens.colorPaletteGreenForeground1} fontSize={16} />
                <Text size={200}>Подписано: {summary.signedCount}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                <ClockRegular color={tokens.colorPaletteYellowForeground1} fontSize={16} />
                <Text size={200}>Ожидает: {summary.pendingCount}</Text>
              </div>
              {summary.declinedCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <DismissCircleRegular color={tokens.colorPaletteRedForeground1} fontSize={16} />
                  <Text size={200}>Отклонено: {summary.declinedCount}</Text>
                </div>
              )}
            </div>

            {summary.estimatedCompletion && signatureRequest.status === 'in-progress' && (
              <MessageBar intent="info">
                <MessageBarBody>
                  <MessageBarTitle>Ожидаемое завершение</MessageBarTitle>
                  {summary.estimatedCompletion.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </MessageBarBody>
              </MessageBar>
            )}
          </div>
        </CardPreview>
      </Card>

      <Accordion collapsible>
        <AccordionItem value="signers">
          <AccordionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <PersonRegular />
              <Text weight="semibold">Подписанты ({signatureRequest.signers.length})</Text>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            <div className={styles.signersList}>
              {signatureRequest.signers
                .sort((a, b) => a.order - b.order)
                .map((signer, index) => renderSignerCard(signer, index))}
            </div>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="details">
          <AccordionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <InfoRegular />
              <Text weight="semibold">Детали запроса</Text>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
              <div>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Метод подписи:
                </Text>
                <Text>{signatureApi.formatSignatureMethod(signatureRequest.signatureMethod)}</Text>
              </div>
              <div>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Порядок подписания:
                </Text>
                <Text>
                  {signatureRequest.settings.signingOrder === 'sequential' ? 'Последовательный' : 'Параллельный'}
                </Text>
              </div>
              <div>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Создано:
                </Text>
                <Text>
                  {new Date(signatureRequest.createdAt).toLocaleString('ru-RU')}
                </Text>
              </div>
              {signatureRequest.expiresAt && (
                <div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    Истекает:
                  </Text>
                  <Text>
                    {new Date(signatureRequest.expiresAt).toLocaleString('ru-RU')}
                  </Text>
                </div>
              )}
              {signatureRequest.completedAt && (
                <div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    Завершено:
                  </Text>
                  <Text>
                    {new Date(signatureRequest.completedAt).toLocaleString('ru-RU')}
                  </Text>
                </div>
              )}
              {signatureRequest.providerUrl && (
                <div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    Ссылка на подписание:
                  </Text>
                  <Button
                    as="a"
                    href={signatureRequest.providerUrl}
                    target="_blank"
                    appearance="subtle"
                    size="small"
                  >
                    Открыть в {signatureApi.formatSignatureMethod(signatureRequest.signatureMethod)}
                  </Button>
                </div>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SignatureStatus;
