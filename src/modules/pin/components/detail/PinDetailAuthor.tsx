// src/modules/pin/components/detail/PinDetailAuthor.tsx

import React from 'react';
import { Text } from 'gestalt';
import { UserCard, useUser } from '@/modules/user';

interface PinDetailAuthorProps {
  userId: string;
}

export const PinDetailAuthor: React.FC<PinDetailAuthorProps> = ({ userId }) => {
  const { user, isLoading, isError } = useUser(userId);

  if (isLoading) {
    return (
      <div className="pin-author pin-author--loading">
        <div className="pin-author__skeleton-avatar" />
        <div className="pin-author__skeleton-content">
          <div className="pin-author__skeleton-name" />
          <div className="pin-author__skeleton-followers" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  return (
    <div className="pin-author">
      <div className="pin-author__label">
        <Text size="100" color="subtle" weight="bold">
          Created by
        </Text>
      </div>
      <div className="pin-author__card">
        <UserCard user={user} showFollowButton variant="horizontal" />
      </div>
    </div>
  );
};

export default PinDetailAuthor;