// src/modules/board/components/BoardCreateModal.tsx

import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Layer,
  Modal,
  Text,
  Switch,
  Icon,
  TapArea,
} from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/components';
import { useCreateBoard } from '../hooks/useCreateBoard';
import { useCreateBoardWithPin } from '../hooks/useCreateBoardWithPin';
import { boardCreateSchema, type BoardCreateFormData } from './boardCreateSchema';

interface BoardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (boardId: string, boardName: string) => void; // ✅ Добавлен boardName
  initialTitle?: string;
  pinId?: string;
}

const BOARD_SUGGESTIONS = ['Travel', 'Recipes', 'Home Decor', 'Fashion', 'Art'];

export const BoardCreateModal: React.FC<BoardCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTitle = '',
  pinId,
}) => {
  const [keepOpen, setKeepOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { createBoard, isLoading: isCreatingBoard } = useCreateBoard({
    onSuccess: (data) => {
      handleSuccess(data.id, data.title);
    },
  });

  const { createBoardWithPin, isLoading: isCreatingWithPin } = useCreateBoardWithPin(
    pinId || '',
    {
      onSuccess: (data) => {
        handleSuccess(data.id, data.title);
      },
      autoSelect: true,
    }
  );

  const isLoading = isCreatingBoard || isCreatingWithPin;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
  } = useForm<BoardCreateFormData>({
    resolver: zodResolver(boardCreateSchema),
    defaultValues: { title: initialTitle },
    mode: 'onChange',
  });

  const handleSuccess = useCallback((boardId: string, boardName: string) => {
    onSuccess?.(boardId, boardName); // ✅ Передаём оба значения
    if (keepOpen) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      reset({ title: '' });
    } else {
      onClose();
    }
  }, [onSuccess, keepOpen, reset, onClose]);

  const handleClose = useCallback(() => {
    reset({ title: '' });
    setShowSuccess(false);
    onClose();
  }, [reset, onClose]);

  const handleCreate = useCallback(() => {
    handleSubmit((data: BoardCreateFormData) => {
      if (pinId) {
        createBoardWithPin(data);
      } else {
        createBoard(data);
      }
    })();
  }, [handleSubmit, pinId, createBoardWithPin, createBoard]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    reset({ title: suggestion });
  }, [reset]);

  const titleValue = getValues('title');

  if (!isOpen) return null;

  return (
    <Layer>
      <Modal
        accessibilityModalLabel="Create board"
        heading={
          <Box paddingX={6} paddingY={4}>
            <Flex alignItems="center" gap={3}>
              <Box
                color="primary"
                rounding="circle"
                padding={2}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon accessibilityLabel="" icon="board" color="inverse" size={16} />
              </Box>
              <Heading size="400" accessibilityLevel={1}>
                Create board
              </Heading>
            </Flex>
          </Box>
        }
        onDismiss={handleClose}
        footer={
          <Box paddingX={6} paddingY={3}>
            <Flex justifyContent="end" gap={2}>
              <Button text="Cancel" onClick={handleClose} size="lg" color="gray" />
              <Button
                text={isLoading ? 'Creating...' : 'Create'}
                onClick={handleCreate}
                color="red"
                disabled={isLoading || !isValid || !titleValue?.trim()}
                size="lg"
              />
            </Flex>
          </Box>
        }
        size="sm"
      >
        <Box paddingX={6} paddingY={4}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <Flex direction="column" gap={4}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormField
                    id="create-board-title"
                    label="Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder='Like "Places to Go" or "Recipes to Make"'
                    errorMessage={errors.title?.message}
                  />
                )}
              />

              <Box>
                <Text size="100" color="subtle">Quick suggestions</Text>
                <Box marginTop={2}>
                  <Flex gap={2} wrap>
                    {BOARD_SUGGESTIONS.map((suggestion) => (
                      <TapArea 
                        key={suggestion} 
                        onTap={() => handleSuggestionClick(suggestion)}
                        rounding="pill"
                      >
                        <Box rounding="pill" color="secondary" paddingX={3} paddingY={1}>
                          <Text size="100">{suggestion}</Text>
                        </Box>
                      </TapArea>
                    ))}
                  </Flex>
                </Box>
              </Box>

              {pinId && (
                <Box color="infoBase" rounding={3} padding={3}>
                  <Flex alignItems="center" gap={2}>
                    <Icon accessibilityLabel="" icon="pin" size={16} color="inverse" />
                    <Text color="inverse" size="200">
                      Pin will be saved to this board
                    </Text>
                  </Flex>
                </Box>
              )}

              <Box color="secondary" rounding={3} padding={3}>
                <Flex alignItems="center" justifyContent="between">
                  <Box>
                    <Text weight="bold" size="200">Keep creating</Text>
                    <Text color="subtle" size="100">Create multiple boards quickly</Text>
                  </Box>
                  <Switch
                    id="keep-modal-open"
                    switched={keepOpen}
                    onChange={() => setKeepOpen(!keepOpen)}
                  />
                </Flex>
              </Box>

              {showSuccess && (
                <Box color="successBase" rounding={3} padding={3}>
                  <Flex alignItems="center" gap={2}>
                    <Icon accessibilityLabel="" icon="check-circle" color="inverse" size={16} />
                    <Text color="inverse" size="200">
                      {pinId ? 'Board created and pin saved!' : 'Board created! Add another one.'}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Flex>
          </form>
        </Box>
      </Modal>
    </Layer>
  );
};

export default BoardCreateModal;