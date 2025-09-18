import React from 'react';
import { Avatar } from '@fluentui/react-components';
import type { User } from '../model/types';

interface UserAvatarProps {
  user: User;
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 32 }) => {
  const fullName = `${user.firstName} ${user.lastName}`;
  
  return (
    <Avatar 
      name={fullName}
      color="brand"
      size={size}
    />
  );
}; 