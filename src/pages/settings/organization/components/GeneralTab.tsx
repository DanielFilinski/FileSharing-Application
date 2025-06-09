import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Input,
  Text,
  Card,
  Field,
} from '@fluentui/react-components';
import {
  Building24Regular,
  People24Regular,
} from '@fluentui/react-icons';

const GeneralTab: React.FC = () => {
  const styles = useStyles();
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  return (
    <div className={styles.content}>
      <div className={styles.section}>
        <Card className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Building24Regular />
            </div>
            <Text size={500} weight="semibold">Company Information</Text>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <Field label="Company Name" required>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </Field>
            </div>
            <div className={styles.fullWidth}>  
              <Field label="Company Contact" required>
                <Input
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="Enter company contact number"
                />
              </Field>
            </div>    
            <div className={styles.fullWidth}>
              <Field label="Company Email" required>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Enter company email"
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <People24Regular />
            </div>
            <Text size={500} weight="semibold">Owner Information</Text>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <Field label="Owner Full Name" required>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Enter owner's full name"
                />
              </Field>
            </div>
            <div className={styles.fullWidth}>  
              <Field label="Owner Contact" required>
                <Input
                  value={ownerContact}
                  onChange={(e) => setOwnerContact(e.target.value)}
                  placeholder="Enter owner's contact number"
                />
              </Field>
            </div>
            <div className={styles.fullWidth}>
              <Field label="Owner Email" required>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Enter owner's email"
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const useStyles = makeStyles({
  content: {
    maxWidth: '1000px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionCard: {
    padding: tokens.spacingVerticalL,
    '@media (max-width: 768px)': {
      padding: tokens.spacingVerticalM,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  sectionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    '@media (max-width: 640px)': {
      gap: tokens.spacingVerticalM,
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
});

export default GeneralTab; 