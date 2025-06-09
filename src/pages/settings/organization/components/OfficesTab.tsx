import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Card,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  useId
} from '@fluentui/react-components';
import {
  Building24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import OfficeItem from './OfficeItem';
import EmptyOfficesState from './EmptyOfficesState';
import AddOfficeForm from './AddOfficeForm';

interface Office {
  name: string;
  address: string;
}

const OfficesTab: React.FC = () => {
  const styles = useStyles();
  const [offices, setOffices] = useState<Office[]>([]);
  const [showAddOffice, setShowAddOffice] = useState(false);
  
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const handleAddOffice = (name: string, address: string) => {
    setOffices([...offices, { name, address }]);
    setShowAddOffice(false);
    
    dispatchToast(
      <Toast>
        <ToastTitle>Office Added</ToastTitle>
        <ToastBody>Office "{name}" has been successfully added.</ToastBody>
      </Toast>,
      { intent: "success" }
    );
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
                <OfficeItem
                  key={index}
                  name={office.name}
                  address={office.address}
                  onRemove={() => handleRemoveOffice(index)}
                />
              ))
            ) : (
              <EmptyOfficesState />
            )}
          </div>

          {showAddOffice && (
            <AddOfficeForm
              onAdd={handleAddOffice}
              onCancel={() => setShowAddOffice(false)}
            />
          )}
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
});

export default OfficesTab; 