import React from 'react';
import { makeStyles, tokens, Breadcrumb, BreadcrumbItem, Text } from '@fluentui/react-components';
import { ChevronRightRegular } from '@fluentui/react-icons';

const BREADCRUMB_ITEMS = [
  { key: 'home', text: 'Home' },
  { key: 'documents', text: 'Documents' },
  { key: 'current', text: 'My Files' }
];

export const Breadcrumbs: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.breadcrumbContainer}>
      <Breadcrumb>
        {BREADCRUMB_ITEMS.map((item, index) => (
          <React.Fragment key={item.key}>
            <BreadcrumbItem>
              <Text size={300}>{item.text}</Text>
            </BreadcrumbItem>
            {index < BREADCRUMB_ITEMS.length - 1 && (
              <ChevronRightRegular fontSize={16} />
            )}
          </React.Fragment>
        ))}
      </Breadcrumb>
    </div>
  );
}; 


const useStyles = makeStyles({
  breadcrumbContainer: {
    padding: '4px 24px',
    position: 'static',
    // zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 768px)': {
      padding: '4px 16px'
    }
  }
});