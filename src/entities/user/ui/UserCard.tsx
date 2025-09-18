import React from 'react';
import { Card, CardHeader, CardPreview, Text, Body1, Caption1 } from '@fluentui/react-components';
import { UserAvatar } from './UserAvatar';
import type { User } from '../model/types';

interface UserCardProps {
  user: User;
  subtitle?: string;
  description?: string;
  onClick?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  subtitle, 
  description, 
  onClick 
}) => {
  const fullName = `${user.firstName} ${user.lastName}`;
  
  return (
    <Card onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardHeader
        image={<UserAvatar user={user} size={40} />}
        header={<Body1>{fullName}</Body1>}
        description={subtitle && <Caption1>{subtitle}</Caption1>}
      />
      {description && (
        <CardPreview>
          <Text>{description}</Text>
        </CardPreview>
      )}
    </Card>
  );
}; 