import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Text,
  Card,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  Textarea,
  Field,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  useId
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Building24Regular,
  Location24Regular,
  Save24Regular,
  Add24Regular,
  Delete24Regular,
  People24Regular,
  Checkmark24Regular,
  Dismiss24Regular
} from '@fluentui/react-icons';
import { SettingsHeader } from '@/components/SettingsHeader';

// Custom theme with brand color



interface Office {
  name: string;
  address: string;
}

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

const OfficesTab: React.FC = () => {
  const styles = useStyles();
  const [offices, setOffices] = useState<Office[]>([]);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');
  const [showAddOffice, setShowAddOffice] = useState(false);
  
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const handleAddOffice = () => {
    if (newOfficeName.trim() && newOfficeAddress.trim()) {
      setOffices([...offices, { name: newOfficeName, address: newOfficeAddress }]);
      setNewOfficeName('');
      setNewOfficeAddress('');
      setShowAddOffice(false);
      
      dispatchToast(
        <Toast>
          <ToastTitle>Office Added</ToastTitle>
          <ToastBody>Office "{newOfficeName}" has been successfully added.</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    }
  };

  const handleRemoveOffice = (index: number) => {
    const officeName = offices[index].name;
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
    
    dispatchToast(
      <Toast>
        <ToastTitle>Office Removed</ToastTitle>
        <ToastBody>Office "{officeName}" has been removed.</ToastBody>
      </Toast>,
      { intent: "warning" }
    );
  };

  return (
    <div className={styles.content}>
      <Toaster toasterId={toasterId} />
      
      <div className={styles.section}>
        <Card className={styles.sectionCard}>
          <div className={styles.officesHeader}>
            <div className={styles.sectionHeader} style={{ marginBottom: 0 }}>
              <div className={styles.sectionIcon}>
                <Building24Regular />
              </div>
              <Text size={500} weight="semibold">Offices</Text>
            </div>

            <Button
              appearance="outline"
              icon={<Add24Regular />}
              onClick={() => setShowAddOffice(true)}
            >
              Add Office
            </Button>
          </div>

          <div className={styles.officesList}>
            {offices.length > 0 ? (
              offices.map((office, index) => (
                <div key={index} className={styles.officeItem}>
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    size="small"
                    className={styles.removeButton}
                    onClick={() => handleRemoveOffice(index)}
                  />
                  
                  <div className={styles.officeContent}>
                    <div className={styles.officeIcon}>
                      <Building24Regular />
                    </div>
                    
                    <div className={styles.officeDetails}>
                      <Text className={styles.officeName} weight="medium">
                        {office.name}
                      </Text>
                      <div className={styles.officeAddress}>
                        <Location24Regular fontSize="14" />
                        <Text size={200}>{office.address}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Building24Regular />
                </div>
                <Text size={400} weight="medium" style={{ marginBottom: '8px' }}>
                  No offices added yet
                </Text>
                <Text size={300}>
                  Click "Add Office" to add your first office location
                </Text>
              </div>
            )}
          </div>

          {showAddOffice && (
            <div className={styles.addOfficeForm}>
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>
                  <Add24Regular />
                  <Text weight="medium">Add New Office</Text>
                </div>
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  size="small"
                  onClick={() => setShowAddOffice(false)}
                />
              </div>
              
              <div className={styles.formGrid}>
                <Field label="Office Name" required>
                  <Input
                    value={newOfficeName}
                    onChange={(e) => setNewOfficeName(e.target.value)}
                    placeholder="Enter office name"
                  />
                </Field>
                
                <Field label="Office Address" required>
                  <Textarea
                    value={newOfficeAddress}
                    onChange={(e) => setNewOfficeAddress(e.target.value)}
                    placeholder="Enter office address"
                    rows={2}
                  />
                </Field>
                
                <div className={styles.formActions}>
                  <Button
                    appearance="subtle"
                    onClick={() => setShowAddOffice(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    appearance="primary"
                    icon={<Checkmark24Regular />}
                    onClick={handleAddOffice}
                    disabled={!newOfficeName.trim() || !newOfficeAddress.trim()}
                  >
                    Add Office
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const OrganizationSettings: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('general');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  const toasterId = useId("main-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  const handleSave = () => {
    dispatchToast(
      <Toast>
        <ToastTitle>Changes Saved</ToastTitle>
        <ToastBody>Your organization settings have been successfully saved.</ToastBody>
      </Toast>,
      { intent: "success" }
    );
  };


  return (    
      <div className={styles.container}>
        <Toaster toasterId={toasterId} />
        
        <div className={styles.main}>
          {/* <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Settings24Regular className={styles.headerIcon} />
              <Text size={600} weight="semibold">Organization Settings</Text>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
                            
              <Button
                appearance="primary"
                icon={<Save24Regular />}
                className={styles.saveButton}
                onClick={handleSave}
              >
                Save changes
              </Button>
            </div>
          </div> */}

          <SettingsHeader
            title="Organization Settings"
            icon={<Settings24Regular />}
            buttonText="Save changes"
            onButtonClick={handleSave}
          />

          <div className={styles.tabsContainer}>
            <TabList
              selectedValue={selectedTab}
              onTabSelect={handleTabSelect}
              className={styles.tabsList}
            >
              <Tab value="general">General</Tab>
              <Tab value="offices">Offices</Tab>
            </TabList>
          </div>

          {selectedTab === 'general' && <GeneralTab />}
          {selectedTab === 'offices' && <OfficesTab />}
        </div>
      </div>
   
  );
};

export default OrganizationSettings;


const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    padding: '0',
  },
  
  main: {
    marginLeft: 'auto',
    marginRight: 'auto',
    '@media (max-width: 768px)': {
      padding: tokens.spacingVerticalS,
    },
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,    
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalM,
      alignItems: 'flex-start',
    },
  },
  
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  
  headerIcon: {
    color: tokens.colorBrandForeground1,
  },
  
  saveButton: {
    gap: tokens.spacingHorizontalS,
  },
  
  tabsContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    marginBottom: tokens.spacingVerticalM,
  },
  
  tabsList: {
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
  
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
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalM,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
      gap: tokens.spacingVerticalS,
    },
  },
  
  fullWidth: {
    gridColumn: '1 / -1',
  },
  
  officesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: tokens.spacingVerticalM,
    },
  },
  
  officesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  
  officeItem: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'relative',
    transition: 'border-color 0.2s ease',
    
    '&:hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: `0 1px 3px ${tokens.colorBrandBackground}1A`,
    },
  },
  
  officeContent: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  
  officeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusSmall,
    flexShrink: 0,
  },
  
  officeDetails: {
    flex: 1,
  },
  
  officeName: {
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingVerticalXXS,
  },
  
  officeAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground2,
  },
  
  removeButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    width: '24px',
    height: '24px',
    minWidth: '24px',
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    textAlign: 'center',
    '@media (max-width: 640px)': {
      padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalM}`,
    },
  },
  
  emptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
  
  addOfficeForm: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    '@media (max-width: 640px)': {
      padding: tokens.spacingVerticalM,
    },
  },
  
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  
  formTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    '@media (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
});
