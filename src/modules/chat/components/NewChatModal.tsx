// src/modules/chat/components/NewChatModal.tsx

import React, { useState, useMemo } from 'react';
import { Box, Flex, Text, SearchField, Spinner, TapArea } from 'gestalt';
import { BaseModal, EmptyState } from '@/shared/components';
import { UserAvatar, useFollowing } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { useGetOrCreateChat } from '../hooks/useChat';
import type { UserResponse } from '@/modules/user';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = useAuth();

  const { following, isLoading } = useFollowing(userId);
  const { getOrCreateChat, isLoading: isCreating } = useGetOrCreateChat();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return following;
    
    const query = searchQuery.toLowerCase();
    return following.filter((user) =>
      user.username?.toLowerCase().includes(query)
    );
  }, [following, searchQuery]);

  const handleSelectUser = async (recipientId: string) => {
    try {
      const chat = await getOrCreateChat(recipientId);
      onChatCreated(chat.id);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const renderUserList = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" padding={4}>
          <Spinner accessibilityLabel="Loading" show />
        </Box>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <EmptyState
          title="No users found"
          description="Follow some users to start chatting"
          icon="person"
        />
      );
    }

    return (
      <Flex direction="column" gap={1}>
        {filteredUsers.map((user: UserResponse) => (
          <UserListItem
            key={user.id}
            user={user}
            onSelect={() => handleSelectUser(user.id)}
            disabled={isCreating}
          />
        ))}
      </Flex>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Chat"
      accessibilityLabel="New chat modal"
      size="sm"
    >
      <Box paddingX={2}>
        <Box marginBottom={4}>
          <SearchField
            id="new-chat-search"
            accessibilityLabel="Search users"
            placeholder="Search users..."
            value={searchQuery}
            onChange={({ value }) => setSearchQuery(value)}
          />
        </Box>

        <Box maxHeight={400} overflow="auto">
          {renderUserList()}
        </Box>
      </Box>
    </BaseModal>
  );
};

interface UserListItemProps {
  user: UserResponse;
  onSelect: () => void;
  disabled: boolean;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onSelect, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TapArea
      onTap={onSelect}
      disabled={disabled}
      rounding={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        padding={2}
        rounding={2}
        color={isHovered ? 'secondary' : 'default'}
      >
        <Flex alignItems="center" gap={3}>
          <UserAvatar
            imageId={user.imageId}
            name={user.username}
            size="md"
          />
          <Text weight="bold">{user.username}</Text>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default NewChatModal;