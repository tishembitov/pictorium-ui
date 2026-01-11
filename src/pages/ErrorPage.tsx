// ================================================
// FILE: src/pages/ErrorPage.tsx
// ================================================
import React from 'react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Box, Heading, Text, Button, Flex, Icon, Divider } from 'gestalt';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useToast } from '@/shared/hooks/useToast';
import { ROUTES } from '@/app/router/routes';
import { env } from '@/app/config/env';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  // Extract error details
  const getErrorDetails = () => {
    if (isRouteErrorResponse(error)) {
      return {
        status: error.status,
        title: error.statusText || 'Error',
        message: error.data?.message || 'An unexpected error occurred',
        stack: null,
      };
    }

    if (error instanceof Error) {
      return {
        status: 500,
        title: 'Application Error',
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      status: 500,
      title: 'Unknown Error',
      message: 'Something went wrong. Please try again.',
      stack: null,
    };
  };

  const { status, title, message, stack } = getErrorDetails();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleReload = () => {
    globalThis.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCopyError = () => {
    const errorInfo = `
Error: ${title}
Status: ${status}
Message: ${message}
URL: ${globalThis.location.href}
Time: ${new Date().toISOString()}
${stack ? `\nStack:\n${stack}` : ''}
    `.trim();

    void copy(errorInfo);
    toast.copy.link();
  };

  return (
    <Box
      display="flex"
      direction="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding={8}
      color="default"
    >
      {/* Error Icon */}
      <Box marginBottom={4} color="errorBase" rounding="circle" padding={4}>
        <Icon
          accessibilityLabel="Error"
          icon="workflow-status-problem"
          color="inverse"
          size={48}
        />
      </Box>

      {/* Error Status */}
      <Box marginBottom={2}>
        <Text size="600" weight="bold" color="error">
          {status}
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Heading size="400" align="center">
          {title}
        </Heading>
      </Box>

      <Box marginBottom={6} maxWidth={500}>
        <Text align="center" color="subtle">
          {message}
        </Text>
      </Box>

      {/* Action Buttons */}
      <Flex gap={3} wrap justifyContent="center">
        <Button
          text="Go back"
          onClick={handleGoBack}
          size="lg"
          color="gray"
        />
        <Button
          text="Reload page"
          onClick={handleReload}
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

      {/* Copy Error for Support */}
      <Box marginTop={4}>
        <Button
          text="Copy error details"
          onClick={handleCopyError}
          size="sm"
          color="gray"
          iconEnd="link"
        />
      </Box>

      {/* Debug info in development */}
      {env.isDevelopment && stack && (
        <Box marginTop={8} width="100%" maxWidth={800}>
          <Divider />
          <Box marginTop={4}>
            <Heading size="300" accessibilityLevel={2}>
              Stack Trace (Development Only)
            </Heading>
            <Box 
              marginTop={2} 
              padding={4} 
              color="secondary" 
              rounding={2} 
              overflow="auto"
            >
              <Text size="100" overflow="breakWord">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                  {stack}
                </pre>
              </Text>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ErrorPage;