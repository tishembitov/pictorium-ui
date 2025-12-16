// ================================================
// FILE: src/pages/NotFoundPage.tsx
// ================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text, Button, Flex, Icon } from 'gestalt';
import { CategoryGrid } from '@/modules/tag';
import { ROUTES } from '@/app/router/routeConfig';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box paddingY={8}>
      {/* Main Error */}
      <Box
        display="flex"
        direction="column"
        alignItems="center"
        justifyContent="center"
        minHeight="40vh"
      >
        {/* 404 Icon */}
        <Box marginBottom={4} color="secondary" rounding="circle" padding={6}>
          <Icon
            accessibilityLabel="Page not found"
            icon="workflow-status-problem"
            color="subtle"
            size={64}
          />
        </Box>

        <Box marginBottom={2}>
          <Heading size="600" align="center">
            404
          </Heading>
        </Box>

        <Box marginBottom={2}>
          <Heading size="400" align="center">
            Page not found
          </Heading>
        </Box>

        <Box marginBottom={6} maxWidth={400}>
          <Text align="center" color="subtle">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track!
          </Text>
        </Box>

        <Flex gap={3} wrap justifyContent="center">
          <Button
            text="Go back"
            onClick={handleGoBack}
            size="lg"
            color="gray"
          />
          <Button
            text="Go to Home"
            onClick={handleGoHome}
            size="lg"
            color="red"
          />
        </Flex>
      </Box>

      {/* Suggestions */}
      <Box marginTop={8}>
        <Box marginBottom={4}>
          <Heading size="400" align="center" accessibilityLevel={2}>
            Or explore something new
          </Heading>
        </Box>

        <CategoryGrid
          limit={6}
          size="md"
          showTitle={false}
        />
      </Box>
    </Box>
  );
};

export default NotFoundPage;