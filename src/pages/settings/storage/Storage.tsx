import React from 'react';
import { Card, CardHeader, makeStyles, Title1 } from '@fluentui/react-components';
import { ScreenContainer, HeaderContainer, ContentContainer } from '@/app/styles/layouts';

const StorageSettings: React.FC = () => {
  const styles = useStyles();

  
  return (
    <ScreenContainer> 
     
     <HeaderContainer>
        <Title1>Storage Settings</Title1>     
     </HeaderContainer>
      
      
    </ScreenContainer>
  );
};



const useStyles = makeStyles({
  container: {
    padding: '24px',
  },
  
});

export default StorageSettings; 