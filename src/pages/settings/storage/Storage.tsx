import React from 'react';
import { Card, CardHeader, makeStyles, Switch, Title1 } from '@fluentui/react-components';
import { ScreenContainer, HeaderContainer, ContentContainer } from '@/app/styles/layouts';
import { useTheme } from '@/app/theme/ThemeProvider';

const StorageSettings: React.FC = () => {
  const styles = useStyles();
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <ScreenContainer> 
     
     <HeaderContainer>
        <Title1>Storage Settings</Title1>     
     </HeaderContainer>
     
     <ContentContainer>
      {/* <Switch checked={isDark} onChange={toggleTheme} /> */}
     </ContentContainer>
      
    </ScreenContainer>
  );
};



const useStyles = makeStyles({
  container: {
    padding: '24px',
  },
  
});

export default StorageSettings; 