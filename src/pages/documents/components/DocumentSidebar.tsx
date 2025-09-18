import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Avatar,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  PersonRegular,
  ShieldRegular,
} from '@fluentui/react-icons';
import { Document, TeamMember, WorkflowStep } from '../ui/FirmSide2Page';

const useStyles = makeStyles({
  rightSidebar: {
    width: '350px',
    background: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '24px',
    overflowY: 'auto',
  },
  sidebarSection: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: tokens.colorNeutralForeground1,
  },
  documentMeta: {
    background: tokens.colorNeutralBackground3,
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  metaItemLast: {
    marginBottom: 0,
  },
  metaLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
    fontWeight: '500',
  },
  teamMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  teamMemberLast: {
    borderBottom: 'none',
  },
  memberAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${tokens.colorPaletteGreenBackground3}, ${tokens.colorPaletteGreenBackground2})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: '600',
    fontSize: '14px',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '2px',
    color: tokens.colorNeutralForeground1,
  },
  memberRole: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  roleValidator: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  roleApprover: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  roleSignatory: {
    backgroundColor: tokens.colorPalettePurpleBackground2,
    color: tokens.colorPalettePurpleForeground2,
  },
  workflowChecklist: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  workflowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    position: 'relative',
  },
  stepIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: tokens.colorPaletteGreenForeground1,
  },
  stepActive: {
    backgroundColor: tokens.colorBrandForeground1,
    color: tokens.colorBrandBackground,
  },
  stepPending: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  stepContent: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  securityInfo: {
    background: tokens.colorPaletteBlueBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    padding: '16px',
  },
  securityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  securityItemLast: {
    marginBottom: 0,
  },
});

interface DocumentSidebarProps {
  document: Document;
  teamMembers: TeamMember[];
  workflowSteps: WorkflowStep[];
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  document,
  teamMembers,
  workflowSteps,
}) => {
  const styles = useStyles();

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Validator':
        return styles.roleValidator;
      case 'Approver':
        return styles.roleApprover;
      case 'Signatory':
        return styles.roleSignatory;
      default:
        return styles.roleValidator;
    }
  };

  return (
    <aside className={styles.rightSidebar}>
      {/* Document Information */}
      <div className={styles.sidebarSection}>
        <Text className={styles.sectionTitle}>Document Information</Text>
        <div className={styles.documentMeta}>
          <div className={styles.metaItem}>
            <Text className={styles.metaLabel}>Document Type:</Text>
            <Text className={styles.metaValue}>{document.type}</Text>
          </div>
          <div className={styles.metaItem}>
            <Text className={styles.metaLabel}>Category:</Text>
            <Text className={styles.metaValue}>{document.category}</Text>
          </div>
          <div className={styles.metaItem}>
            <Text className={styles.metaLabel}>Domain:</Text>
            <Text className={styles.metaValue}>{document.domain}</Text>
          </div>
          <div className={styles.metaItem}>
            <Text className={styles.metaLabel}>Created:</Text>
            <Text className={styles.metaValue}>{document.created}</Text>
          </div>
          <div className={`${styles.metaItem} ${styles.metaItemLast}`}>
            <Text className={styles.metaLabel}>Status:</Text>
            <Text className={styles.metaValue}>{document.status}</Text>
          </div>
        </div>
      </div>

      {/* Assigned Team */}
      <div className={styles.sidebarSection}>
        <Text className={styles.sectionTitle}>Assigned Team</Text>
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            className={`${styles.teamMember} ${
              index === teamMembers.length - 1 ? styles.teamMemberLast : ''
            }`}
          >
            <div className={styles.memberAvatar}>{member.avatar}</div>
            <div className={styles.memberInfo}>
              <Text className={styles.memberName}>{member.name}</Text>
              <Text className={styles.memberRole}>{member.role}</Text>
            </div>
            <div className={`${styles.roleBadge} ${getRoleBadgeClass(member.role)}`}>
              {member.role}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Checklist */}
      <div className={styles.sidebarSection}>
        <Text className={styles.sectionTitle}>Document Workflow</Text>
        <ul className={styles.workflowChecklist}>
          {workflowSteps.map((step) => (
            <li key={step.id} className={styles.workflowStep}>
              <div
                className={`${styles.stepIndicator} ${
                  step.status === 'completed' ? styles.stepCompleted :
                  step.status === 'active' ? styles.stepActive :
                  styles.stepPending
                }`}
              >
                {step.status === 'completed' ? '✓' : step.id}
              </div>
              <Text className={styles.stepContent}>{step.title}</Text>
            </li>
          ))}
        </ul>
      </div>

      {/* Security Information */}
      <div className={styles.sidebarSection}>
        <Text className={styles.sectionTitle}>Security Information</Text>
        <div className={styles.securityInfo}>
          <div className={styles.securityItem}>
            <Text className={styles.metaLabel}>Validation Status:</Text>
            <Text className={styles.metaValue}>✓ Verified</Text>
          </div>
          <div className={styles.securityItem}>
            <Text className={styles.metaLabel}>Retention Period:</Text>
            <Text className={styles.metaValue}>90 days</Text>
          </div>
          <div className={styles.securityItem}>
            <Text className={styles.metaLabel}>Access Level:</Text>
            <Text className={styles.metaValue}>Team & Client</Text>
          </div>
          <div className={`${styles.securityItem} ${styles.securityItemLast}`}>
            <Text className={styles.metaLabel}>Modifications:</Text>
            <Text className={styles.metaValue}>Restricted</Text>
          </div>
        </div>
      </div>
    </aside>
  );
}; 