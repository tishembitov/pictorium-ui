// src/shared/components/forms/FormFooter.tsx

import React from 'react';
import { Box, Flex, Button, Divider, Text, Icon } from 'gestalt';

interface FormFooterProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  validationMessage?: string | null;
  submitColor?: 'red' | 'blue' | 'gray';
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  isDisabled = false,
  validationMessage,
  submitColor = 'red',
}) => {
  return (
    <Box marginTop={6} padding={4}>
      <Divider />
      <Box paddingY={4}>
        <Flex justifyContent="between" alignItems="center">
          <Box>
            {validationMessage && !isLoading && (
              <Flex gap={2} alignItems="center">
                <Icon
                  accessibilityLabel=""
                  icon="workflow-status-warning"
                  size={14}
                  color="subtle"
                />
                <Text size="200" color="subtle">
                  {validationMessage}
                </Text>
              </Flex>
            )}
          </Box>

          <Flex gap={2}>
            {onCancel && (
              <Button
                text={cancelText}
                onClick={onCancel}
                size="md"
                color="gray"
                disabled={isLoading}
              />
            )}
            <Button
              text={isLoading ? 'Saving...' : submitText}
              type={onSubmit ? 'button' : 'submit'}
              onClick={onSubmit}
              size="md"
              color={submitColor}
              disabled={isLoading || isDisabled}
            />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default FormFooter;