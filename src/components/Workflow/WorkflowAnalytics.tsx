/**
 * WorkflowAnalytics - компонент детальной аналитики workflow процессов
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Button,
  Badge,
  makeStyles,
  tokens,
  Tab,
  TabList,
  TabValue,
  Spinner,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridCell,
  DataGridBody,
  TableCellLayout,
  createTableColumn
} from '@fluentui/react-components';
import {
  ChartMultipleRegular,
  ClockRegular,
  PeopleRegular,
  DocumentRegular,
  DataTrending20Regular,
  CalendarRegular,
  FilterRegular,
  ArrowTrendingRegular
} from '@fluentui/react-icons';

import { WorkflowApiClient, WorkflowStatistics, WorkflowPerformanceMetrics } from '../../shared/api/workflowApi';
import { notificationService } from '../../shared/lib/notifications';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingVerticalM
  },

  metricCard: {
    padding: tokens.spacingVerticalM
  },

  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS
  },

  metricValue: {
    fontSize: '2rem',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1
  },

  metricLabel: {
    color: tokens.colorNeutralForeground2
  },

  metricTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS
  },

  trendUp: {
    color: tokens.colorPaletteGreenForeground1
  },

  trendDown: {
    color: tokens.colorPaletteRedForeground1
  },

  chartContainer: {
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },

  performanceTable: {
    maxHeight: '400px',
    overflow: 'auto'
  },

  statusBadge: {
    minWidth: '80px'
  },

  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL
  },

  tabContent: {
    marginTop: tokens.spacingVerticalM
  }
});

export interface WorkflowAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
}

export const WorkflowAnalytics: React.FC<WorkflowAnalyticsProps> = ({
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const styles = useStyles();
  
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Analytics data
  const [statistics, setStatistics] = useState<WorkflowStatistics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<WorkflowPerformanceMetrics[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load statistics and performance metrics
      const [statsResponse, metricsResponse] = await Promise.all([
        WorkflowApiClient.getWorkflowStatistics(timeRange),
        WorkflowApiClient.getPerformanceMetrics(timeRange)
      ]);

      setStatistics(statsResponse);
      setPerformanceMetrics(metricsResponse);

    } catch (err: any) {
      console.error('Failed to load workflow analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      notificationService.error('Error', 'Failed to load workflow analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | '1y') => {
    onTimeRangeChange?.(range);
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`${styles.metricTrend} ${isPositive ? styles.trendUp : styles.trendDown}`}>
        <ArrowTrendingRegular style={{ transform: isPositive ? 'none' : 'rotate(180deg)' }} />
        <Text size={200}>{Math.abs(change).toFixed(1)}%</Text>
      </div>
    );
  };

  // Define performance table columns
  const performanceColumns = [
    createTableColumn<WorkflowPerformanceMetrics>({
      columnId: 'workflowType',
      renderHeaderCell: () => 'Workflow Type',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.workflowType}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<WorkflowPerformanceMetrics>({
      columnId: 'totalCount',
      renderHeaderCell: () => 'Total Count',
      renderCell: (item) => (
        <TableCellLayout>
          {item.totalCount}
        </TableCellLayout>
      )
    }),
    createTableColumn<WorkflowPerformanceMetrics>({
      columnId: 'avgDuration',
      renderHeaderCell: () => 'Avg Duration',
      renderCell: (item) => (
        <TableCellLayout>
          {item.averageDurationHours}h
        </TableCellLayout>
      )
    }),
    createTableColumn<WorkflowPerformanceMetrics>({
      columnId: 'completionRate',
      renderHeaderCell: () => 'Completion Rate',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ProgressBar value={item.completionRate / 100} style={{ flex: 1 }} />
            <Text size={300}>{item.completionRate.toFixed(1)}%</Text>
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<WorkflowPerformanceMetrics>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge 
            color={item.completionRate > 90 ? 'success' : item.completionRate > 70 ? 'warning' : 'danger'}
            className={styles.statusBadge}
          >
            {item.completionRate > 90 ? 'Excellent' : item.completionRate > 70 ? 'Good' : 'Needs Attention'}
          </Badge>
        </TableCellLayout>
      )
    })
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading workflow analytics..." size="large" />
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
          <Title3>Workflow Analytics</Title3>
          <Text>Detailed analysis of workflow processes and performance</Text>
        </div>
        
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          {(['7d', '30d', '90d', '1y'] as const).map(range => (
            <Button
              key={range}
              appearance={timeRange === range ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleTimeRangeChange(range)}
            >
              {getTimeRangeLabel(range)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
        <Tab id="overview" value="overview">
          Overview
        </Tab>
        <Tab id="performance" value="performance">
          Performance
        </Tab>
        <Tab id="trends" value="trends">
          Trends
        </Tab>
        <Tab id="bottlenecks" value="bottlenecks">
          Bottlenecks
        </Tab>
      </TabList>

      <div className={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && statistics && (
          <>
            {/* Key Metrics Cards */}
            <div className={styles.metricsGrid}>
              <Card className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <DocumentRegular style={{ color: tokens.colorBrandForeground1 }} />
                  <Text weight="semibold">Total Workflows</Text>
                </div>
                <Text className={styles.metricValue}>{statistics.totalWorkflows}</Text>
                <Text className={styles.metricLabel}>Active processes</Text>
                {getTrendIndicator(statistics.totalWorkflows, statistics.previousPeriod?.totalWorkflows || 0)}
              </Card>

              <Card className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <ClockRegular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                  <Text weight="semibold">Avg Completion Time</Text>
                </div>
                <Text className={styles.metricValue}>{statistics.averageCompletionHours.toFixed(1)}h</Text>
                <Text className={styles.metricLabel}>Per workflow</Text>
                {getTrendIndicator(statistics.averageCompletionHours, statistics.previousPeriod?.averageCompletionHours || 0)}
              </Card>

              <Card className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <DataTrending20Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                  <Text weight="semibold">Success Rate</Text>
                </div>
                <Text className={styles.metricValue}>{statistics.successRate.toFixed(1)}%</Text>
                <Text className={styles.metricLabel}>Completed successfully</Text>
                {getTrendIndicator(statistics.successRate, statistics.previousPeriod?.successRate || 0)}
              </Card>

              <Card className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <PeopleRegular style={{ color: tokens.colorPalettePurpleForeground1 }} />
                  <Text weight="semibold">Active Users</Text>
                </div>
                <Text className={styles.metricValue}>{statistics.activeUsers}</Text>
                <Text className={styles.metricLabel}>Contributing to workflows</Text>
                {getTrendIndicator(statistics.activeUsers, statistics.previousPeriod?.activeUsers || 0)}
              </Card>
            </div>

            {/* Status Distribution */}
            <Card style={{ marginTop: tokens.spacingVerticalL }}>
              <CardHeader header={<Text weight="semibold">Workflow Status Distribution</Text>} />
              <CardPreview>
                <div style={{ padding: tokens.spacingVerticalM }}>
                  {Object.entries(statistics.statusDistribution).map(([status, count]) => (
                    <div key={status} style={{ marginBottom: tokens.spacingVerticalS }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{status}</Text>
                        <Text>{count} ({((count / statistics.totalWorkflows) * 100).toFixed(1)}%)</Text>
                      </div>
                      <ProgressBar value={count / statistics.totalWorkflows} />
                    </div>
                  ))}
                </div>
              </CardPreview>
            </Card>
          </>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalM }}>
              Performance Metrics by Workflow Type
            </Text>
            
            {performanceMetrics.length > 0 ? (
              <Card>
                <div className={styles.performanceTable}>
                  <DataGrid
                    items={performanceMetrics}
                    columns={performanceColumns}
                    sortable
                    getRowId={(item) => item.workflowType}
                  >
                    <DataGridHeader>
                      <DataGridRow>
                        {({ renderHeaderCell }) => (
                          <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                        )}
                      </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<WorkflowPerformanceMetrics>>
                      {({ item, rowId }) => (
                        <DataGridRow<WorkflowPerformanceMetrics> key={rowId}>
                          {({ renderCell }) => (
                            <DataGridCell>{renderCell(item)}</DataGridCell>
                          )}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  </DataGrid>
                </div>
              </Card>
            ) : (
              <Card>
                <CardPreview>
                  <div style={{ 
                    padding: tokens.spacingVerticalXXL,
                    textAlign: 'center',
                    color: tokens.colorNeutralForeground3
                  }}>
                    <ChartMultipleRegular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
                    <Text>No performance data available for the selected time range</Text>
                  </div>
                </CardPreview>
              </Card>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className={styles.chartContainer}>
            <div style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <DataTrending20Regular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
              <Text>Trend charts will be implemented in the next iteration</Text>
              <Text size={300} style={{ display: 'block', marginTop: tokens.spacingVerticalS }}>
                This will include workflow creation trends, completion rates over time, and performance metrics
              </Text>
            </div>
          </div>
        )}

        {/* Bottlenecks Tab */}
        {activeTab === 'bottlenecks' && (
          <div className={styles.chartContainer}>
            <div style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <FilterRegular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
              <Text>Bottleneck analysis will be implemented in the next iteration</Text>
              <Text size={300} style={{ display: 'block', marginTop: tokens.spacingVerticalS }}>
                This will identify workflow steps that cause delays and performance issues
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowAnalytics;
