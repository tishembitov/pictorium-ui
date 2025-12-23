// src/pages/PinCreatePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Divider, 
  Flex, 
  Text, 
  IconButton, 
  Tooltip,
  Icon,
} from 'gestalt';
import { PinCreateForm } from '@/modules/pin';
import { BoardPicker, useSelectedBoard } from '@/modules/board';

const PinCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBoard } = useSelectedBoard();

  const handleSuccess = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box paddingY={6} maxWidth={900} marginStart="auto" marginEnd="auto">
      {/* Header */}
      <Box marginBottom={6}>
        <Flex justifyContent="between" alignItems="center">
          {/* Left: Back button and title */}
          <Flex alignItems="center" gap={4}>
            <Tooltip text="Go back">
              <IconButton
                accessibilityLabel="Go back"
                icon="arrow-back"
                onClick={handleBack}
                size="lg"
                bgColor="transparent"
              />
            </Tooltip>
            <Flex direction="column">
              <Heading size="400" accessibilityLevel={1}>
                Create Pin
              </Heading>
              <Text color="subtle" size="200">
                Share something inspiring
              </Text>
            </Flex>
          </Flex>

          {/* Right: Board selection */}
          <Flex alignItems="center" gap={3}>
            <Flex direction="column" alignItems="end">
              <Text size="100" color="subtle">
                Saving to
              </Text>
              {selectedBoard ? (
                <Flex alignItems="center" gap={2}>
                  <Icon accessibilityLabel="" icon="board" size={14} color="default" />
                  <Text weight="bold" size="200">
                    {selectedBoard.title}
                  </Text>
                </Flex>
              ) : (
                <Text color="subtle" size="200">
                  No board selected
                </Text>
              )}
            </Flex>
            <BoardPicker size="md" />
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