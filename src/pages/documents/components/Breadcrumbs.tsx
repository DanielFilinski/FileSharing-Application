import React from 'react';
import { makeStyles, tokens, Breadcrumb, BreadcrumbItem, Text } from '@fluentui/react-components';
import { ChevronRightRegular } from '@fluentui/react-icons';
import { useLocation, useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  breadcrumbContainer: {
    padding: '12px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 768px)': {
      padding: '8px 16px'
    }
  },
  breadcrumbItem: {
    cursor: 'pointer',
    ':hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline'
    }
  },
  currentItem: {
    cursor: 'default',
    color: tokens.colorNeutralForeground1,
    fontWeight: '600'
  }
});

export const Breadcrumbs: React.FC = () => {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [{ key: 'home', text: 'Home', path: '/' }];

    if (pathSegments.length === 0) {
      return items;
    }

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let text = segment;
      if (segment === 'favorites') {
        text = 'Favorites';
      } else if (segment === 'documents') {
        text = 'Documents';
      } else if (segment === 'my-files') {
        text = 'My Files';
      } else {
        // Капитализируем первую букву для остальных сегментов
        text = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      items.push({
        key: segment,
        text,
        path: currentPath
      });
    });

    return items;
  };

  const handleBreadcrumbClick = (path: string, isLast: boolean) => {
    if (!isLast) {
      navigate(path);
    }
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className={styles.breadcrumbContainer}>
      <Breadcrumb>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.key}>
              <BreadcrumbItem>
                <Text 
                  size={300}
                  className={isLast ? styles.currentItem : styles.breadcrumbItem}
                  onClick={() => handleBreadcrumbClick(item.path, isLast)}
                >
                  {item.text}
                </Text>
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <ChevronRightRegular fontSize={16} />
              )}
            </React.Fragment>
          );
        })}
      </Breadcrumb>
    </div>
  );
};