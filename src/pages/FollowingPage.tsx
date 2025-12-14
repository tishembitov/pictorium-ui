// ================================================
// FILE: src/pages/FollowingPage.tsx
// ================================================
import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Box, Heading, IconButton, Flex, Spinner, Text, Divider } from 'gestalt';
import { 
  FollowingList, 
  useUserByUsername,
  UserAvatar,
} from '@/modules/user';
import { ErrorMessage } from '@/shared/components';
import { ROUTES, buildPath } from '@/app/router/routeConfig';

const FollowingPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const { user, isLoading, isError, error, refetch } = useUserByUsername(username);

  const handleBack = () => {
    if (username) {
      navigate(buildPath.profile(username));
    } else {
      navigate(-1);
    }
  };

  const handleUserClick = () => {
    if (username) {
      navigate(buildPath.profile(username));
    }
  };

  const handleRetry = () => {
    void refetch();
  };

  if (!username) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading" show size="lg" />
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="User not found"
          message={error?.message || `User @${username} doesn't exist`}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box paddingY={4} maxWidth={600} marginStart="auto" marginEnd="auto">
      {/* Header */}
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={3}>
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleBack}
            size="md"
            bgColor="transparent"
          />
          <Flex alignItems="center" gap={2} flex="grow">
            <UserAvatar
              imageId={user.imageId}
              name={user.username}
              size="sm"
              onClick={handleUserClick}
            />
            <Box>
              <Heading size="400" accessibilityLevel={1}>
                Following
              </Heading>
              <Text color="subtle" size="200">
                @{user.username}
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Box>

      <Divider />

      {/* Following List */}
      <Box marginTop={4}>
        <FollowingList
          userId={user.id}
          emptyMessage={`@${username} isn't following anyone yet`}
        />
      </Box>
    </Box>
  );
};

export default FollowingPage;