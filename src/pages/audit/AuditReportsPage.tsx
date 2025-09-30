/**
 * AuditReportsPage - страница для управления отчетами аудита
 */

import React, { useState } from 'react';
import {
  Title3,
  Text,
  Button,
  Tab,
  TabList,
  TabValue,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  Document20Regular,
  Eye20Regular,
  ArrowLeft20Regular
} from '@fluentui/react-icons';

import { AuditReportsManager, AuditEventsViewer } from '../../components/AuditTrail';
import { AuditReport } from '../../shared/types/audit';
import {
  PermissionGate,
  Permission
} from '../../shared/lib/rbac';
import {
  ScreenContainer,
  ContentContainer
} from '../../app/styles/layouts';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },

  backButton: {
    minWidth: 'auto'
  },

  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },

  tabsContainer: {
    marginBottom: tokens.spacingVerticalM
  },

  content: {
    flex: 1,
    overflow: 'hidden'
  },

  reportViewer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  reportHeader: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1
  },

  reportDetails: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflow: 'auto'
  }
});

export const AuditReportsPage: React.FC = () => {
  const styles = useStyles();
  
  const [activeTab, setActiveTab] = useState<TabValue>('reports');
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);

  const handleReportSelect = (report: AuditReport) => {
    setSelectedReport(report);
    setActiveTab('viewer');
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
    setActiveTab('reports');
  };

  return (
    <PermissionGate
      permissions={[Permission.AUDIT_READ]}
      fallback={
        <ScreenContainer>
          <MessageBar intent="error">
            <MessageBarBody>
              У вас нет прав для просмотра отчетов аудита
            </MessageBarBody>
          </MessageBar>
        </ScreenContainer>
      }
    >
      <ScreenContainer>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            {selectedReport && (
              <Button
                appearance="subtle"
                icon={<ArrowLeft20Regular />}
                onClick={handleBackToReports}
                className={styles.backButton}
              >
                Назад
              </Button>
            )}
            
            <div className={styles.headerContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Document20Regular className="text-2xl text-blue-600" />
                <Title3>
                  {selectedReport ? `Отчет: ${selectedReport.title}` : 'Отчеты аудита'}
                </Title3>
              </div>
              <Text size={400} style={{ color: tokens.colorNeutralForeground2 }}>
                {selectedReport 
                  ? selectedReport.description || 'Детальный отчет событий аудита'
                  : 'Создание и управление отчетами событий аудита системы'
                }
              </Text>
            </div>
          </div>

          {/* Tabs */}
          {!selectedReport && (
            <div className={styles.tabsContainer}>
              <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
                <Tab id="reports" value="reports">
                  Управление отчетами
                </Tab>
                <Tab id="events" value="events">
                  События аудита
                </Tab>
              </TabList>
            </div>
          )}

          {/* Content */}
          <div className={styles.content}>
            {selectedReport ? (
              // Report Viewer Mode
              <div className={styles.reportViewer}>
                <div className={styles.reportHeader}>
                  <Text size={300} weight="semibold">Просмотр отчета</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Период: {selectedReport.parameters.startDate} - {selectedReport.parameters.endDate}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Создан: {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                
                <div className={styles.reportDetails}>
                  {selectedReport.status === 'completed' ? (
                    <AuditEventsViewer 
                      defaultFilters={{
                        startDate: selectedReport.parameters.startDate,
                        endDate: selectedReport.parameters.endDate,
                        categories: selectedReport.parameters.categories,
                        severities: selectedReport.parameters.severities,
                        onlySuccessful: selectedReport.parameters.includeSuccessful ? undefined : false,
                        onlyFailed: selectedReport.parameters.includeFailed ? undefined : false,
                        includeSensitive: selectedReport.parameters.includeSensitive
                      }}
                      compact={false}
                    />
                  ) : selectedReport.status === 'processing' ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      gap: tokens.spacingVerticalM
                    }}>
                      <Text size={500}>Отчет обрабатывается...</Text>
                      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                        Пожалуйста, подождите. Генерация отчета может занять несколько минут.
                      </Text>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      gap: tokens.spacingVerticalM
                    }}>
                      <Text size={500} style={{ color: tokens.colorPaletteRedForeground1 }}>
                        Ошибка создания отчета
                      </Text>
                      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                        {selectedReport.error || 'Произошла ошибка при создании отчета'}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Main Content Based on Active Tab
              <ContentContainer>
                {activeTab === 'reports' && (
                  <AuditReportsManager onReportSelect={handleReportSelect} />
                )}
                
                {activeTab === 'events' && (
                  <AuditEventsViewer height="calc(100vh - 200px)" />
                )}
              </ContentContainer>
            )}
          </div>
        </div>
      </ScreenContainer>
    </PermissionGate>
  );
};

export default AuditReportsPage;
