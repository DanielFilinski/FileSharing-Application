/**
 * AuditEventDetails - детальная информация о событии аудита
 */

import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Badge,
  Divider,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview
} from '@fluentui/react-components';
import {
  DismissRegular,
  PersonRegular,
  CalendarRegular,
  GlobeRegular,
  DevicesRegular,
  InfoRegular,
  DocumentRegular,
  WarningRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular
} from '@fluentui/react-icons';

import { AuditEvent } from '../../shared/types/audit';
import { auditApi } from '../../shared/api/auditApi';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM
  },

  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },

  headerBadges: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: '20px'
  },

  infoLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    minWidth: '120px',
    flexShrink: 0
  },

  infoValue: {
    fontSize: tokens.fontSizeBase200,
    textAlign: 'right',
    wordBreak: 'break-word'
  },

  metadataContainer: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM
  },

  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200
  },

  metadataKey: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold
  },

  metadataValue: {
    wordBreak: 'break-word'
  },

  changesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },

  changeItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },

  changeField: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold
  },

  changeValues: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalS
  },

  oldValue: {
    padding: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorPaletteRedBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200
  },

  newValue: {
    padding: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorPaletteGreenBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200
  }
});

export interface AuditEventDetailsProps {
  event: AuditEvent;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditEventDetails: React.FC<AuditEventDetailsProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const styles = useStyles();

  const renderMetadata = () => {
    if (!event.metadata || Object.keys(event.metadata).length === 0) {
      return null;
    }

    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <InfoRegular fontSize={16} />
          <Text size={300} weight="semibold">Дополнительная информация</Text>
        </div>
        <div className={styles.metadataContainer}>
          <div className={styles.metadataGrid}>
            {Object.entries(event.metadata).map(([key, value]) => (
              <React.Fragment key={key}>
                <div className={styles.metadataKey}>{key}:</div>
                <div className={styles.metadataValue}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChanges = () => {
    if (!event.changes || event.changes.length === 0) {
      return null;
    }

    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <DocumentRegular fontSize={16} />
          <Text size={300} weight="semibold">Изменения</Text>
        </div>
        <div className={styles.changesContainer}>
          {event.changes.map((change, index) => (
            <div key={index} className={styles.changeItem}>
              <Text className={styles.changeField}>
                {change.fieldDisplayName || change.field}
              </Text>
              <div className={styles.changeValues}>
                <div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: tokens.spacingVerticalXXS }}>
                    Было:
                  </Text>
                  <div className={styles.oldValue}>
                    {typeof change.oldValue === 'object' 
                      ? JSON.stringify(change.oldValue, null, 2)
                      : String(change.oldValue || 'Не задано')
                    }
                  </div>
                </div>
                <div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: tokens.spacingVerticalXXS }}>
                    Стало:
                  </Text>
                  <div className={styles.newValue}>
                    {typeof change.newValue === 'object' 
                      ? JSON.stringify(change.newValue, null, 2)
                      : String(change.newValue || 'Не задано')
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle>Детали события аудита</DialogTitle>
        <DialogBody>
          <div className={styles.container}>
            {/* Header with main info */}
            <div className={styles.header}>
              <div className={styles.headerInfo}>
                <Text size={400} weight="semibold">{event.action}</Text>
                <Text size={300}>{event.description}</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  {auditApi.formatTimestamp(event.timestamp)}
                </Text>
              </div>
              <div className={styles.headerBadges}>
                <Badge color={auditApi.getSuccessColor(event.success)}>
                  {event.success ? 'Успешно' : 'Ошибка'}
                </Badge>
                <Badge color={auditApi.getSeverityColor(event.severity)}>
                  {auditApi.formatSeverity(event.severity)}
                </Badge>
                <Badge color="informative">
                  {auditApi.formatCategory(event.category)}
                </Badge>
              </div>
            </div>

            <Divider />

            {/* User Information */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <PersonRegular fontSize={16} />
                <Text size={300} weight="semibold">Пользователь</Text>
              </div>
              <div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Имя:</Text>
                  <Text className={styles.infoValue} weight="semibold">{event.userName}</Text>
                </div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Email:</Text>
                  <Text className={styles.infoValue}>{event.userEmail}</Text>
                </div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Роль:</Text>
                  <Text className={styles.infoValue}>{event.userRole}</Text>
                </div>
                {event.sessionId && (
                  <div className={styles.infoRow}>
                    <Text className={styles.infoLabel}>Сессия:</Text>
                    <Text className={styles.infoValue} style={{ fontFamily: 'monospace' }}>
                      {event.sessionId.substring(0, 16)}...
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Resource Information */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <DocumentRegular fontSize={16} />
                <Text size={300} weight="semibold">Ресурс</Text>
              </div>
              <div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Тип:</Text>
                  <Text className={styles.infoValue}>{event.resourceType}</Text>
                </div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>ID:</Text>
                  <Text className={styles.infoValue} style={{ fontFamily: 'monospace' }}>
                    {event.resourceId}
                  </Text>
                </div>
                {event.resourceName && (
                  <div className={styles.infoRow}>
                    <Text className={styles.infoLabel}>Название:</Text>
                    <Text className={styles.infoValue}>{event.resourceName}</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Information */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <DevicesRegular fontSize={16} />
                <Text size={300} weight="semibold">Техническая информация</Text>
              </div>
              <div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>ID события:</Text>
                  <Text className={styles.infoValue} style={{ fontFamily: 'monospace' }}>
                    {event.eventId}
                  </Text>
                </div>
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Время сервера:</Text>
                  <Text className={styles.infoValue}>
                    {auditApi.formatTimestamp(event.serverTimestamp)}
                  </Text>
                </div>
                {event.ipAddress && (
                  <div className={styles.infoRow}>
                    <Text className={styles.infoLabel}>IP адрес:</Text>
                    <Text className={styles.infoValue} style={{ fontFamily: 'monospace' }}>
                      {event.ipAddress}
                    </Text>
                  </div>
                )}
                {event.userAgent && (
                  <div className={styles.infoRow}>
                    <Text className={styles.infoLabel}>User Agent:</Text>
                    <Text className={styles.infoValue} style={{ fontSize: tokens.fontSizeBase100 }}>
                      {event.userAgent}
                    </Text>
                  </div>
                )}
                {event.correlationId && (
                  <div className={styles.infoRow}>
                    <Text className={styles.infoLabel}>Correlation ID:</Text>
                    <Text className={styles.infoValue} style={{ fontFamily: 'monospace' }}>
                      {event.correlationId}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Error Information */}
            {!event.success && (event.errorCode || event.errorMessage) && (
              <>
                <Divider />
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <WarningRegular fontSize={16} color={tokens.colorPaletteRedForeground1} />
                    <Text size={300} weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
                      Информация об ошибке
                    </Text>
                  </div>
                  <div>
                    {event.errorCode && (
                      <div className={styles.infoRow}>
                        <Text className={styles.infoLabel}>Код ошибки:</Text>
                        <Text className={styles.infoValue} weight="semibold" style={{ fontFamily: 'monospace' }}>
                          {event.errorCode}
                        </Text>
                      </div>
                    )}
                    {event.errorMessage && (
                      <div className={styles.infoRow}>
                        <Text className={styles.infoLabel}>Сообщение:</Text>
                        <Text className={styles.infoValue}>{event.errorMessage}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Changes */}
            {renderChanges()}

            {/* Metadata */}
            {renderMetadata()}
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={onClose}>
            Закрыть
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default AuditEventDetails;
