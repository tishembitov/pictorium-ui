// src/modules/storage/components/UploadProgress.tsx

import React from 'react';
import { Box, Text, Spinner, Icon, Flex, TapArea } from 'gestalt';
import type { UploadStatus, UploadProgress as UploadProgressType } from '../types/storage.types';
import { formatFileSize } from '../utils/fileUtils';

interface UploadProgressProps {
  status: UploadStatus;
  progress: UploadProgressType;
  fileName?: string;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  showDetails?: boolean;
}

export const UploadProgressComponent: React.FC<UploadProgressProps> = ({
  status,
  progress,
  fileName,
  error,
  onRetry,
  onCancel,
  showDetails = true,
}) => {
  const getStatusColor = (): 'success' | 'error' | 'subtle' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'idle':
        return 'subtle';
      default:
        return 'default';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'idle':
        return 'Waiting...';
      case 'preparing':
        return 'Preparing...';
      case 'uploading':
        return `Uploading ${progress.percentage}%`;
      case 'confirming':
        return 'Confirming...';
      case 'completed':
        return 'Completed';
      case 'error':
        return error || 'Upload failed';
      default:
        return '';
    }
  };

  const getProgressBarColor = (): string => {
    if (status === 'completed') {
      return 'var(--color-success)';
    }
    if (status === 'error') {
      return 'var(--color-error)';
    }
    return 'var(--color-primary)';
  };

  const isInProgress = status === 'preparing' || status === 'uploading' || status === 'confirming';

  return (
    <Box padding={2}>
      <Flex direction="column" gap={2}>
        {/* File name */}
        {fileName && (
          <Text size="200" overflow="breakWord" lineClamp={1}>
            {fileName}
          </Text>
        )}

        {/* Progress bar */}
        <Box
          height={4}
          rounding={2}
          color="secondary"
          overflow="hidden"
          position="relative"
        >
          <Box
            height="100%"
            rounding={2}
            dangerouslySetInlineStyle={{
              __style: {
                width: `${progress.percentage}%`,
                backgroundColor: getProgressBarColor(),
                transition: 'width 0.2s ease',
              },
            }}
          />
        </Box>

        {/* Status and details */}
        <Flex alignItems="center" justifyContent="between">
          <Flex alignItems="center" gap={2}>
            {isInProgress && <Spinner accessibilityLabel="Uploading" show size="sm" />}
            {status === 'completed' && (
              <Icon accessibilityLabel="Completed" icon="check-circle" color="success" size={16} />
            )}
            {status === 'error' && (
              <Icon accessibilityLabel="Error" icon="workflow-status-problem" color="error" size={16} />
            )}
            <Text size="100" color={getStatusColor()}>
              {getStatusText()}
            </Text>
          </Flex>

          {showDetails && (
            <Text size="100" color="subtle">
              {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
            </Text>
          )}
        </Flex>

        {/* Actions */}
        {(status === 'error' && onRetry) || (isInProgress && onCancel) ? (
          <Flex gap={2}>
            {status === 'error' && onRetry && (
              <TapArea onTap={onRetry}>
                <Text size="100" color="default" weight="bold">
                  Retry
                </Text>
              </TapArea>
            )}
            {isInProgress && onCancel && (
              <TapArea onTap={onCancel}>
                <Text size="100" color="subtle">
                  Cancel
                </Text>
              </TapArea>
            )}
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
};

// Export with alias to avoid naming conflict with type
export { UploadProgressComponent as UploadProgress };

export default UploadProgressComponent;