// src/pages/PinEditPage.tsx

import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Box, Heading, Divider, Spinner, Flex, IconButton, Tooltip } from 'gestalt';
import { PinEditForm, usePin } from '@/modules/pin';
import { useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { ROUTES, buildPath } from '@/app/router/routeConfig';

const PinEditPage: React.FC = () => {
  const { pinId } = useParams<{ pinId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm } = useConfirmModal();

  const { pin, isLoading, isError, error, refetch } = usePin(pinId);
  const isOwner = useIsOwner(pin?.userId);

  const handleSuccess = () => {
    // ✅ Исправлено: используем pin.updated вместо pin.saved
    toast.pin.updated();
    if (pinId) {
      navigate(buildPath.pin(pinId));
    }
  };

  const handleCancel = () => {
    if (pinId) {
      confirm({
        title: 'Discard changes?',
        message: 'Your changes will be lost.',
        confirmText: 'Discard',
        cancelText: 'Keep editing',
        destructive: true,
        onConfirm: () => navigate(buildPath.pin(pinId)),
      });
    } else {
      navigate(-1);
    }
  };

  const handleBack = () => {
    handleCancel();
  };

  const handleRetry = () => {
    void refetch();
  };

  if (!pinId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading pin" show size="lg" />
      </Box>
    );
  }

  if (isError || !pin) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Failed to load pin"
          message={error?.message || 'Pin not found'}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  if (!isOwner) {
    toast.errors.permission();
    return <Navigate to={buildPath.pin(pinId)} replace />;
  }

  return (
    <Box paddingY={4} maxWidth={800} marginStart="auto" marginEnd="auto">
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={3}>
          <Tooltip text="Go back">
            <IconButton
              accessibilityLabel="Go back"
              icon="arrow-back"
              onClick={handleBack}
              size="md"
              bgColor="transparent"
            />
          </Tooltip>
          <Heading size="400" accessibilityLevel={1}>
            Edit Pin
          </Heading>
        </Flex>
      </Box>

      <Divider />

      <Box marginTop={6}>
        <PinEditForm pin={pin} onSuccess={handleSuccess} onCancel={handleCancel} />
      </Box>
    </Box>
  );
};

export default PinEditPage;