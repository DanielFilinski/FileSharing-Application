import React from 'react';
import { makeStyles, Breadcrumb, BreadcrumbItem } from '@fluentui/react-components';
import { ChevronRightRegular } from '@fluentui/react-icons';
import { BREADCRUMB_ITEMS } from '../../../../app/navigation/constants';

const useStyles = makeStyles({
  breadcrumb: {
    padding: '8px 24px 8px 24px'
  }
});

export const Breadcrumbs: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.breadcrumb}>
      <Breadcrumb>
        {BREADCRUMB_ITEMS.map((item, index) => (
          <React.Fragment key={item.key}>
            <BreadcrumbItem>{item.text}</BreadcrumbItem>
            {index < BREADCRUMB_ITEMS.length - 1 && <ChevronRightRegular />}
          </React.Fragment>
        ))}
      </Breadcrumb>
    </div>
  );
}; 