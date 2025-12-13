// src/modules/user/components/UserAvatar.tsx

import React from 'react';
import { Avatar, TapArea } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import { getUserInitials } from '../utils/userUtils';

interface UserAvatarProps {
  imageId?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fit';
  outline?: boolean;
  onClick?: () => void;
}

const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fit'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  fit: 'fit',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageId,
  name,
  size = 'md',
  outline = false,
  onClick,
}) => {
  const { data: imageData } = useImageUrl(imageId, {
    enabled: !!imageId,
  });

  const avatarName = getUserInitials(name);

  const avatarElement = (
    <Avatar
      name={avatarName}
      size={sizeMap[size]}
      src={imageData?.url}
      outline={outline}
    />
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding="circle">
        {avatarElement}
      </TapArea>
    );
  }

  return avatarElement;
};

export default UserAvatar;