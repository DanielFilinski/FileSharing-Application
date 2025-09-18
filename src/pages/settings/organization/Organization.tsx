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
import GeneralTab from './components/GeneralTab';
import OfficesTab from './components/OfficesTab';
import { ContentContainer, MarginTop, RowCardContainer, ScreenContainer } from '@/app/styles/layouts';

// Custom theme with brand color



interface Office {
  name: string;
  address: string;
}

const OrganizationSettings: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('general');
  
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
    <ScreenContainer>
      <Toaster toasterId={toasterId} />

          <div>
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
          </div>
       
          
          
        <ContentContainer>             
              {selectedTab === 'general' && <GeneralTab />}           
            
              {selectedTab === 'offices' && <OfficesTab />}             
        </ContentContainer>
        
    </ScreenContainer>
  );
};

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
  tabsContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  tabsList: {
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
});

export default OrganizationSettings;
