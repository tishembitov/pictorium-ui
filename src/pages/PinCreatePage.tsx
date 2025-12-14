// ================================================
// FILE: src/pages/PinCreatePage.tsx
// ================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Divider, Flex, Text, IconButton, Tooltip } from 'gestalt';
import { PinCreateForm } from '@/modules/pin';
import { BoardPicker, useSelectedBoard } from '@/modules/board';
import { useToast } from '@/shared/hooks/useToast';

const PinCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedBoard } = useSelectedBoard();

  const handleSuccess = () => {
    toast.success('Pin created successfully!');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box paddingY={4} maxWidth={800} marginStart="auto" marginEnd="auto">
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
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
              Create Pin
            </Heading>
          </Flex>

          {/* Board Picker */}
          <Flex alignItems="center" gap={2}>
            <Text size="200" color="subtle">Save to:</Text>
            <BoardPicker size="md" />
            {selectedBoard && (
              <Text size="200" weight="bold">
                {selectedBoard.title}
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>

      <Divider />

      {/* Form */}
      <Box marginTop={6}>
        <PinCreateForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Box>
    </Box>
  );
};

export default PinCreatePage;