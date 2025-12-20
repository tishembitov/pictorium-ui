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
} from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/components';
import { useCreateBoard } from '../hooks/useCreateBoard';
import { boardCreateSchema, type BoardCreateFormData } from './boardCreateSchema';

interface BoardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (boardId: string) => void;
  initialTitle?: string;
}

export const BoardCreateModal: React.FC<BoardCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTitle = '',
}) => {
  const [keepOpen, setKeepOpen] = useState(false);

  const { createBoard, isLoading } = useCreateBoard({
    onSuccess: (data) => {
      onSuccess?.(data.id);
      if (!keepOpen) {
        onClose();
      }
      reset({ title: '' });
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
  } = useForm<BoardCreateFormData>({
    resolver: zodResolver(boardCreateSchema),
    defaultValues: {
      title: initialTitle,
    },
    mode: 'onChange',
  });

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCreate = useCallback(() => {
    handleSubmit((data: BoardCreateFormData) => {
      createBoard(data);
    })();
  }, [handleSubmit, createBoard]);

  // ✅ Используем getValues вместо watch для избежания предупреждения
  const titleValue = getValues('title');

  if (!isOpen) return null;

  return (
    <Layer>
      <Modal
        accessibilityModalLabel="Create board"
        heading={
          <Box paddingX={8} paddingY={4}>
            <Heading size="400" accessibilityLevel={1} align="center">
              Create board
            </Heading>
          </Box>
        }
        onDismiss={handleClose}
        footer={
          <Box paddingX={8} paddingY={4}>
            <Flex justifyContent="end" gap={2}>
              <Button
                text="Create"
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
        <Box paddingX={8} paddingY={4}>
          <form onSubmit={handleSubmit((data) => createBoard(data))}>
            <Flex direction="column" gap={6}>
              {/* Name Field */}
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

              {/* Keep Open Switch */}
              <Flex alignItems="center" justifyContent="between">
                <Box>
                  <Text weight="bold" size="200">
                    Keep this modal open
                  </Text>
                  <Text color="subtle" size="100">
                    Create multiple boards quickly
                  </Text>
                </Box>
                <Switch
                  id="keep-modal-open"
                  switched={keepOpen}
                  onChange={() => setKeepOpen(!keepOpen)}
                />
              </Flex>
            </Flex>
          </form>
        </Box>
      </Modal>
    </Layer>
  );
};

export default BoardCreateModal;