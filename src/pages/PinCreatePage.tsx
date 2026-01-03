// src/pages/PinCreatePage.tsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Divider, 
  Flex, 
  Text, 
  IconButton, 
  Tooltip,
} from 'gestalt';
import { PinCreateForm } from '@/modules/pin';
import { useSelectedBoardStore } from '@/modules/board';

const PinCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  const handleSuccess = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <Box paddingY={4} maxWidth={720} marginStart="auto" marginEnd="auto">
      {/* Header */}
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
          <Box flex="grow">
            <Heading size="400" accessibilityLevel={1}>
              Create Pin
            </Heading>
            <Text color="subtle" size="200">
              Share something inspiring
            </Text>
          </Box>
          
          {/* Show current default board */}
          {selectedBoard && (
            <Box 
              paddingX={3} 
              paddingY={2} 
              rounding="pill" 
              color="secondary"
            >
              <Flex alignItems="center" gap={2}>
                <Text size="100" color="subtle">Default board:</Text>
                <Text size="200" weight="bold">{selectedBoard.title}</Text>
              </Flex>
            </Box>
          )}
        </Flex>
      </Box>

      <Divider />

      {/* Form */}
      <Box marginTop={4}>
        <PinCreateForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Box>
    </Box>
  );
};

export default PinCreatePage;