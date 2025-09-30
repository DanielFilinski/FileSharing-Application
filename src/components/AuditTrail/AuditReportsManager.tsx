/**
 * AuditReportsManager - компонент для создания и управления отчетами аудита
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Dropdown,
  Option,
  DatePicker,
  Input,
  Textarea,
  Checkbox,
  ProgressBar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider
} from '@fluentui/react-components';
import {
  Add20Regular,
  Document20Regular,
  ArrowDownload20Regular,
  Delete20Regular,
  Eye20Regular,
  MoreHorizontal20Regular,
  Filter20Regular,
  Calendar20Regular,
  DocumentTable20Regular,
  DocumentPdf20Regular,
  DocumentArrowDown20Regular
} from '@fluentui/react-icons';

import { auditApi, CreateAuditReportRequest } from '../../shared/api/auditApi';
import {
  AuditEvent,
  AuditReportParameters,
  AuditReport,
  AuditCategory,
  AuditSeverity
} from '../../shared/types/audit';
import { notificationService } from '../../shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },

  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM
  },

  reportCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: tokens.shadow8
    }
  },

  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS
  },

  reportMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },

  reportActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  },

  createReportDialog: {
    minWidth: '500px'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },

  fullWidth: {
    gridColumn: '1 / -1'
  },

  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },

  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },

  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2
  }
});

export interface AuditReportsManagerProps {
  onReportSelect?: (report: AuditReport) => void;
}

export const AuditReportsManager: React.FC<AuditReportsManagerProps> = ({
  onReportSelect
}) => {
  const styles = useStyles();

  // State management
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create report dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new report
  const [formData, setFormData] = useState<CreateAuditReportRequest>({
    title: '',
    description: '',
    parameters: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      endDate: new Date().toISOString().split('T')[0], // today
      categories: [],
      severities: [],
      includeSuccessful: true,
      includeFailed: true,
      includeSensitive: false,
      groupBy: 'category',
      format: 'pdf'
    }
  });

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, return empty array since the backend endpoint might not be fully implemented
      // const reports = await auditApi.getReports();
      setReports([]);
      
    } catch (err: any) {
      console.error('Failed to load audit reports:', err);
      setError(err.message || 'Не удалось загрузить отчеты');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      setIsCreating(true);
      
      const report = await auditApi.createReport(formData);
      
      notificationService.success(
        'Отчет создан',
        `Отчет "${formData.title}" успешно создан и будет готов через несколько минут`
      );
      
      setReports(prev => [report, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      
    } catch (err: any) {
      console.error('Failed to create audit report:', err);
      notificationService.error(
        'Ошибка создания отчета',
        err.message || 'Не удалось создать отчет'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadReport = async (report: AuditReport) => {
    try {
      // TODO: Implement report download
      notificationService.info('Скачивание отчета', 'Функция скачивания будет реализована в следующей версии');
    } catch (err: any) {
      console.error('Failed to download report:', err);
      notificationService.error('Ошибка скачивания', err.message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отчет?')) {
      return;
    }

    try {
      // TODO: Implement report deletion API
      setReports(prev => prev.filter(r => r.id !== reportId));
      notificationService.success('Отчет удален', 'Отчет успешно удален');
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      notificationService.error('Ошибка удаления', err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      parameters: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        categories: [],
        severities: [],
        includeSuccessful: true,
        includeFailed: true,
        includeSensitive: false,
        groupBy: 'category',
        format: 'pdf'
      }
    });
  };

  const updateFormData = (updates: Partial<CreateAuditReportRequest>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      parameters: {
        ...prev.parameters,
        ...updates.parameters
      }
    }));
  };

  const handleCategoryChange = (category: AuditCategory, checked: boolean) => {
    const categories = checked 
      ? [...formData.parameters.categories, category]
      : formData.parameters.categories.filter(c => c !== category);
    
    updateFormData({ parameters: { categories } });
  };

  const handleSeverityChange = (severity: AuditSeverity, checked: boolean) => {
    const severities = checked 
      ? [...formData.parameters.severities, severity]
      : formData.parameters.severities.filter(s => s !== severity);
    
    updateFormData({ parameters: { severities } });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner label="Загрузка отчетов..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title3>Отчеты аудита</Title3>
          <Text>Создание и управление отчетами событий аудита</Text>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(_, data) => setIsCreateDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" icon={<Add20Regular />}>
              Создать отчет
            </Button>
          </DialogTrigger>
          
          <DialogSurface className={styles.createReportDialog}>
            <DialogTitle>Создание отчета аудита</DialogTitle>
            <DialogContent>
              <DialogBody>
                <div className={styles.formGrid}>
                  {/* Basic Info */}
                  <Field label="Название отчета" className={styles.fullWidth}>
                    <Input
                      value={formData.title}
                      onChange={(_, data) => updateFormData({ title: data.value })}
                      placeholder="Введите название отчета"
                    />
                  </Field>

                  <Field label="Описание" className={styles.fullWidth}>
                    <Textarea
                      value={formData.description}
                      onChange={(_, data) => updateFormData({ description: data.value })}
                      placeholder="Краткое описание отчета"
                      rows={3}
                    />
                  </Field>

                  {/* Date Range */}
                  <Field label="Дата начала">
                    <Input
                      type="date"
                      value={formData.parameters.startDate}
                      onChange={(_, data) => updateFormData({ 
                        parameters: { startDate: data.value } 
                      })}
                    />
                  </Field>

                  <Field label="Дата окончания">
                    <Input
                      type="date"
                      value={formData.parameters.endDate}
                      onChange={(_, data) => updateFormData({ 
                        parameters: { endDate: data.value } 
                      })}
                    />
                  </Field>

                  {/* Format and Grouping */}
                  <Field label="Формат отчета">
                    <Dropdown
                      value={formData.parameters.format === 'pdf' ? 'PDF' : formData.parameters.format === 'xlsx' ? 'Excel' : 'CSV'}
                      onOptionSelect={(_, data) => updateFormData({
                        parameters: { format: data.optionValue?.toLowerCase() as any }
                      })}
                    >
                      <Option value="pdf">PDF</Option>
                      <Option value="xlsx">Excel</Option>
                      <Option value="csv">CSV</Option>
                    </Dropdown>
                  </Field>

                  <Field label="Группировка">
                    <Dropdown
                      value={formData.parameters.groupBy}
                      onOptionSelect={(_, data) => updateFormData({
                        parameters: { groupBy: data.optionValue as any }
                      })}
                    >
                      <Option value="category">По категориям</Option>
                      <Option value="user">По пользователям</Option>
                      <Option value="resource">По ресурсам</Option>
                      <Option value="date">По датам</Option>
                    </Dropdown>
                  </Field>
                </div>

                {/* Advanced Filters */}
                <div className={styles.filterSection}>
                  <Text weight="semibold">Фильтры событий</Text>
                  
                  {/* Categories */}
                  <div>
                    <Text size={300} weight="medium">Категории:</Text>
                    <div className={styles.checkboxGroup}>
                      {(['authentication', 'document', 'signature', 'user_management', 'system'] as AuditCategory[]).map(category => (
                        <Checkbox
                          key={category}
                          label={auditApi.formatCategory(category)}
                          checked={formData.parameters.categories.includes(category)}
                          onChange={(_, data) => handleCategoryChange(category, data.checked === true)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Severities */}
                  <div>
                    <Text size={300} weight="medium">Уровни важности:</Text>
                    <div className={styles.checkboxGroup}>
                      {(['low', 'medium', 'high', 'critical'] as AuditSeverity[]).map(severity => (
                        <Checkbox
                          key={severity}
                          label={auditApi.formatSeverity(severity)}
                          checked={formData.parameters.severities.includes(severity)}
                          onChange={(_, data) => handleSeverityChange(severity, data.checked === true)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Success/Failure */}
                  <div className={styles.checkboxGroup}>
                    <Checkbox
                      label="Включить успешные события"
                      checked={formData.parameters.includeSuccessful}
                      onChange={(_, data) => updateFormData({
                        parameters: { includeSuccessful: data.checked === true }
                      })}
                    />
                    <Checkbox
                      label="Включить ошибки"
                      checked={formData.parameters.includeFailed}
                      onChange={(_, data) => updateFormData({
                        parameters: { includeFailed: data.checked === true }
                      })}
                    />
                    <Checkbox
                      label="Включить конфиденциальные события"
                      checked={formData.parameters.includeSensitive}
                      onChange={(_, data) => updateFormData({
                        parameters: { includeSensitive: data.checked === true }
                      })}
                    />
                  </div>
                </div>
              </DialogBody>
            </DialogContent>
            
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Отмена
              </Button>
              <Button 
                appearance="primary" 
                onClick={handleCreateReport}
                disabled={isCreating || !formData.title.trim()}
              >
                {isCreating ? 'Создание...' : 'Создать отчет'}
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <Card>
          <CardPreview>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: tokens.spacingVerticalXXL,
              color: tokens.colorNeutralForeground3
            }}>
              <DocumentTable20Regular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
              <Text size={500} weight="semibold">Нет созданных отчетов</Text>
              <Text size={300}>
                Создайте первый отчет аудита, чтобы проанализировать события безопасности
              </Text>
            </div>
          </CardPreview>
        </Card>
      ) : (
        <div className={styles.reportsGrid}>
          {reports.map((report) => (
            <Card 
              key={report.id} 
              className={styles.reportCard}
              onClick={() => onReportSelect?.(report)}
            >
              <CardHeader
                header={
                  <div className={styles.reportHeader}>
                    <div className={styles.reportMeta}>
                      <Text weight="semibold">{report.title}</Text>
                      <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                        {report.description}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                        Создан {new Date(report.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                    <div className={styles.reportActions}>
                      <Menu>
                        <MenuTrigger disableButtonEnhancement>
                          <Button 
                            appearance="subtle" 
                            icon={<MoreHorizontal20Regular />}
                            size="small"
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem 
                              icon={<Eye20Regular />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReportSelect?.(report);
                              }}
                            >
                              Просмотреть
                            </MenuItem>
                            <MenuItem 
                              icon={<ArrowDownload20Regular />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadReport(report);
                              }}
                            >
                              Скачать
                            </MenuItem>
                            <MenuItem 
                              icon={<Delete20Regular />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report.id);
                              }}
                            >
                              Удалить
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    </div>
                  </div>
                }
              />
              
              <CardPreview>
                <div style={{ padding: tokens.spacingVerticalS }}>
                  {report.status === 'completed' ? (
                    <Badge color="success">Готов</Badge>
                  ) : report.status === 'processing' ? (
                    <Badge color="warning">Обрабатывается</Badge>
                  ) : (
                    <Badge color="danger">Ошибка</Badge>
                  )}
                  
                  {report.status === 'processing' && report.progress && (
                    <div className={styles.progressSection}>
                      <Text size={300}>Прогресс создания отчета:</Text>
                      <ProgressBar value={report.progress / 100} />
                      <Text size={200}>{report.progress}% завершено</Text>
                    </div>
                  )}
                </div>
              </CardPreview>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditReportsManager;
