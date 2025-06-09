import React from 'react';
import { Title3, Body1 } from '@fluentui/react-components';
import { useStyles } from '../styles';

interface CardHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  title,
  description,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.iconTextContainer}>
      <div className={styles.iconContainer}>
        {icon}
      </div>
      <div className={styles.textContainer}>
        <Title3>{title}</Title3>
        <Body1>{description}</Body1>
      </div>
    </div>
  );
}; 