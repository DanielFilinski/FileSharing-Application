/**
 * Project Status Summary Widget
 * Displays project completion status with breakdown by document statuses
 * Requirements: PROGECT.md section 4.1.1
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Subtitle2,
  Badge,
  ProgressBar,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  Clock24Regular,
  DocumentSignature24Regular,
  DocumentCheckmark24Regular,
} from '@fluentui/react-icons';
import { dashboardService, DashboardStats } from '@/shared/api';

const useStyles = makeStyles({
  card: {
    width: '100%',
    height: 'fit-content',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statIcon: {
    color: tokens.colorBrandForeground1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '40px',
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  progressSection: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: '24px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  errorContainer: {
    padding: '20px',
    textAlign: 'center',
    color: tokens.colorPaletteRedForeground1,
  },
});

interface StatCardProps {
  icon: React.ReactElement;
  value: number;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
  const styles = useStyles();
  
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon} style={{ color }}>
          {icon}
        </div>
        <Text className={styles.statLabel}>{label}</Text>
      </div>
      <Text className={styles.statValue}>{value}</Text>
    </div>
  );
};

export const ProjectStatusWidget: React.FC = () => {
  const styles = useStyles();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading project status..." />
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={styles.card}>
        <div className={styles.errorContainer}>
          <Text weight="semibold">Failed to load project status</Text>
          <Text>{error}</Text>
        </div>
      </Card>
    );
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return tokens.colorPaletteGreenForeground1;
    if (percentage >= 50) return tokens.colorPaletteBlueForeground1;
    if (percentage >= 30) return tokens.colorPaletteYellowForeground1;
    return tokens.colorPaletteRedForeground1;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <div className={styles.header}>
            <Title3>Project Status Summary</Title3>
            <Subtitle2>Overall document processing progress</Subtitle2>
          </div>
        }
        action={
          <Badge appearance="filled" color="brand">
            {stats.totalDocuments} Total Documents
          </Badge>
        }
      />

      <CardPreview>
        <div style={{ padding: '16px' }}>
          {/* Statistics Grid */}
          <div className={styles.statsGrid}>
            <StatCard
              icon={<Clock24Regular />}
              value={stats.pendingValidation}
              label="Pending Validation"
              color={tokens.colorPaletteYellowForeground1}
            />
            
            <StatCard
              icon={<DocumentSignature24Regular />}
              value={stats.pendingSigning}
              label="Pending Signing"
              color={tokens.colorPaletteOrangeForeground1}
            />
            
            <StatCard
              icon={<DocumentCheckmark24Regular />}
              value={stats.pendingApproval}
              label="Pending Approval"
              color={tokens.colorPaletteBlueForeground1}
            />
            
            <StatCard
              icon={<CheckmarkCircle24Regular />}
              value={stats.totalDocuments - stats.pendingValidation - stats.pendingSigning - stats.pendingApproval}
              label="Completed"
              color={tokens.colorPaletteGreenForeground1}
            />
          </div>

          {/* Progress Section */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <Text weight="semibold" size={400}>Overall Completion</Text>
              <Text className={styles.percentageText}>
                {stats.completionPercentage}%
              </Text>
            </div>
            
            <ProgressBar
              value={stats.completionPercentage / 100}
              color={getProgressColor(stats.completionPercentage)}
              thickness="large"
            />
            
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              {stats.completionPercentage >= 80
                ? '🎉 Great progress! Most documents are processed.'
                : stats.completionPercentage >= 50
                ? '📈 Making good progress on document processing.'
                : '⚠️ Many documents require attention.'}
            </Text>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};

export default ProjectStatusWidget;

