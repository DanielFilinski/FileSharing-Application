import React from 'react';
import { SettingsMain } from './SettingsMain';
import { TestRBACDemo } from './TestRBACDemo';
import {
  makeStyles,
  tokens,
  Tab,
  TabList,
  SelectTabEvent,
  SelectTabData,
  shorthands
} from '@fluentui/react-components';
import { ScreenContainer } from '@/app/styles/layouts';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },

  tabs: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding('0', '24px'),
  },

  content: {
    flex: 1,
    overflow: 'auto',
  },
});

export const SettingsMainWithDebug: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = React.useState<string>('settings');

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  return (
    <ScreenContainer>
      <div className={styles.container}>
        <div className={styles.tabs}>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={handleTabSelect}
          >
            <Tab value="settings">Settings</Tab>
            <Tab value="debug">RBAC Debug</Tab>
          </TabList>
        </div>

        <div className={styles.content}>
          {selectedTab === 'settings' && <SettingsMain />}
          {selectedTab === 'debug' && <TestRBACDemo />}
        </div>
      </div>
    </ScreenContainer>
  );
};
