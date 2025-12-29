// src/modules/user/components/ProfileShareButton.tsx

import React from 'react';
import { ShareButton } from '@/shared/components';
import { buildProfileShareUrl } from '../utils/userUtils';
import type { UserResponse } from '../types/user.types';

interface ProfileShareButtonProps {
  user: UserResponse;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfileShareButton: React.FC<ProfileShareButtonProps> = ({
  user,
  size = 'md',
}) => {
  const shareUrl = buildProfileShareUrl(user.username);
  const shareTitle = `Check out ${user.username}'s profile!`;

  return (
    <ShareButton
      url={shareUrl}
      title={shareTitle}
      description={user.description || undefined}
      size={size}
      tooltipText="Share profile"
    />
  );
};

export default ProfileShareButton;