/**
 * Document Details Panel (Right Sidebar)
 * Displays comprehensive document information with team, workflow, and security details
 * Requirements: PROGECT.md section 4.1.1 - Document Details Panel
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Subtitle2,
  Avatar,
  Badge,
  Divider,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  CalendarLtrRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  LockClosedRegular,
  PersonRegular,
  BuildingRegular,
  TagRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  panel: {
    width: '100%',
    maxWidth: '400px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    marginTop: '2px',
  },
  infoContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  infoValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  teamMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  teamMemberInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  teamMemberName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  teamMemberRole: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  workflowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
  },
  workflowStepIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workflowStepContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  workflowStepTitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  workflowStepCompleted: {
    textDecoration: 'line-through',
    color: tokens.colorNeutralForeground3,
  },
  securityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
  },
});

export interface DocumentDetails {
  id: string;
  name: string;
  affiliation: 'law' | 'tax' | 'government' | 'others';
  category: string;
  createdDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  team: TeamMember[];
  workflow: WorkflowStep[];
  security: SecurityInfo;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  role: 'validator' | 'approver' | 'signatory' | 'viewer';
  avatarUrl?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
  optional?: boolean;
}

export interface SecurityInfo {
  validationStatus: 'validated' | 'pending' | 'failed';
  retentionPeriod: number; // in days
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  modificationAllowed: boolean;
}

interface DocumentDetailsPanelProps {
  document: DocumentDetails | null;
}

const getAffiliationBadge = (affiliation: DocumentDetails['affiliation']) => {
  const configs = {
    law: { text: 'Legal', color: 'brand' as const },
    tax: { text: 'Tax', color: 'warning' as const },
    government: { text: 'Government', color: 'important' as const },
    others: { text: 'Other', color: 'subtle' as const },
  };
  
  return configs[affiliation] || configs.others;
};

const getStatusBadge = (status: DocumentDetails['status']) => {
  const configs = {
    draft: { text: 'Draft', color: 'subtle' as const },
    pending: { text: 'Pending', color: 'warning' as const },
    approved: { text: 'Approved', color: 'success' as const },
    rejected: { text: 'Rejected', color: 'danger' as const },
  };
  
  return configs[status] || configs.draft;
};

const getRoleBadgeColor = (role: TeamMember['role']) => {
  const colors = {
    validator: 'informative' as const,
    approver: 'success' as const,
    signatory: 'important' as const,
    viewer: 'subtle' as const,
  };
  
  return colors[role] || 'subtle';
};

const getWorkflowStepIcon = (status: WorkflowStep['status']) => {
  if (status === 'completed') {
    return {
      icon: <CheckmarkCircleRegular fontSize={16} />,
      bg: tokens.colorPaletteGreenBackground2,
      color: tokens.colorPaletteGreenForeground2,
    };
  }
  
  if (status === 'active') {
    return {
      icon: <ClockRegular fontSize={16} />,
      bg: tokens.colorPaletteBlueBorder2,
      color: tokens.colorPaletteBlueForeground2,
    };
  }
  
  return {
    icon: <ClockRegular fontSize={16} />,
    bg: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  };
};

export const DocumentDetailsPanel: React.FC<DocumentDetailsPanelProps> = ({ document }) => {
  const styles = useStyles();

  if (!document) {
    return (
      <div className={styles.panel}>
        <Card className={styles.card}>
          <CardPreview>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                Select a document to view details
              </Text>
            </div>
          </CardPreview>
        </Card>
      </div>
    );
  }

  const affiliationBadge = getAffiliationBadge(document.affiliation);
  const statusBadge = getStatusBadge(document.status);

  return (
    <div className={styles.panel}>
      {/* Document Information */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div>
              <Title3>{document.name}</Title3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Badge appearance="filled" color={affiliationBadge.color}>
                  {affiliationBadge.text}
                </Badge>
                <Badge appearance="tint" color={statusBadge.color}>
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
          }
        />

        <CardPreview>
          <div style={{ padding: '16px' }} className={styles.section}>
            <div className={styles.infoRow}>
              <DocumentRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Category</Text>
                <Text className={styles.infoValue}>{document.category}</Text>
              </div>
            </div>

            <div className={styles.infoRow}>
              <CalendarLtrRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Created Date</Text>
                <Text className={styles.infoValue}>
                  {new Date(document.createdDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </div>
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* Assigned Team */}
      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Assigned Team</Subtitle2>}
          description={`${document.team.length} member${document.team.length !== 1 ? 's' : ''}`}
        />

        <CardPreview>
          <div style={{ padding: '16px' }} className={styles.section}>
            {document.team.map((member) => (
              <div key={member.id} className={styles.teamMember}>
                <Avatar
                  name={member.name}
                  image={member.avatarUrl ? { src: member.avatarUrl } : undefined}
                  size={40}
                />
                
                <div className={styles.teamMemberInfo}>
                  <Text className={styles.teamMemberName}>{member.name}</Text>
                  <Text className={styles.teamMemberRole}>{member.position}</Text>
                </div>
                
                <Badge appearance="tint" color={getRoleBadgeColor(member.role)} size="small">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardPreview>
      </Card>

      {/* Workflow Checklist */}
      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Document Workflow</Subtitle2>}
          description="Processing steps"
        />

        <CardPreview>
          <div style={{ padding: '16px' }} className={styles.section}>
            {document.workflow.map((step, index) => {
              const iconConfig = getWorkflowStepIcon(step.status);
              
              return (
                <React.Fragment key={step.id}>
                  <div className={styles.workflowStep}>
                    <div
                      className={styles.workflowStepIcon}
                      style={{
                        backgroundColor: iconConfig.bg,
                        color: iconConfig.color,
                      }}
                    >
                      {iconConfig.icon}
                    </div>
                    
                    <div className={styles.workflowStepContent}>
                      <Text
                        className={`${styles.workflowStepTitle} ${
                          step.status === 'completed' ? styles.workflowStepCompleted : ''
                        }`}
                      >
                        {step.title}
                        {step.optional && (
                          <Text
                            size={200}
                            style={{
                              color: tokens.colorNeutralForeground3,
                              marginLeft: '6px',
                            }}
                          >
                            (Optional)
                          </Text>
                        )}
                      </Text>
                    </div>
                    
                    {step.status === 'completed' && (
                      <CheckmarkCircleRegular
                        fontSize={20}
                        style={{ color: tokens.colorPaletteGreenForeground2 }}
                      />
                    )}
                  </div>
                  
                  {index < document.workflow.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </div>
        </CardPreview>
      </Card>

      {/* Security Information */}
      <Card className={styles.card}>
        <CardHeader header={<Subtitle2>Security & Compliance</Subtitle2>} />

        <CardPreview>
          <div style={{ padding: '16px' }} className={styles.section}>
            <div className={styles.infoRow}>
              <CheckmarkCircleRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Validation Status</Text>
                <Badge
                  appearance="filled"
                  color={
                    document.security.validationStatus === 'validated'
                      ? 'success'
                      : document.security.validationStatus === 'failed'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {document.security.validationStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className={styles.infoRow}>
              <ClockRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Retention Period</Text>
                <Text className={styles.infoValue}>
                  {document.security.retentionPeriod} days
                </Text>
              </div>
            </div>

            <div className={styles.infoRow}>
              <LockClosedRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Access Level</Text>
                <Text className={styles.infoValue}>
                  {document.security.accessLevel.charAt(0).toUpperCase() +
                    document.security.accessLevel.slice(1)}
                </Text>
              </div>
            </div>

            <div className={styles.infoRow}>
              <TagRegular className={styles.infoIcon} fontSize={20} />
              <div className={styles.infoContent}>
                <Text className={styles.infoLabel}>Modifications</Text>
                <Text className={styles.infoValue}>
                  {document.security.modificationAllowed ? 'Allowed' : 'Restricted'}
                </Text>
              </div>
            </div>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default DocumentDetailsPanel;

