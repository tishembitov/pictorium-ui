// src/modules/board/components/BoardCreateModal.tsx

import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Layer,
  Modal,
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
}

export const BoardCreateModal: React.FC<BoardCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createBoard, isLoading } = useCreateBoard({
    onSuccess: (data) => {
      onSuccess?.(data.id);
      onClose();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BoardCreateFormData>({
    resolver: zodResolver(boardCreateSchema),
    defaultValues: {
      title: '',
    },
  });

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Wrapper для совместимости с Gestalt Button onClick
  const handleCreateClick = useCallback(() => {
    handleSubmit((data: BoardCreateFormData) => {
      createBoard(data);
    })();
  }, [handleSubmit, createBoard]);

  if (!isOpen) return null;

  return (
    <Layer>
      <Modal
        accessibilityModalLabel="Create board"
        heading={
          <Heading size="400" accessibilityLevel={1}>
            Create board
          </Heading>
        }
        onDismiss={handleClose}
        footer={
          <Flex justifyContent="end" gap={2}>
            <Button
              text="Cancel"
              onClick={handleClose}
              color="gray"
              disabled={isLoading}
            />
            <Button
              text={isLoading ? 'Creating...' : 'Create'}
              onClick={handleCreateClick}
              color="red"
              disabled={isLoading}
            />
          </Flex>
        }
        size="sm"
      >
        <Box paddingX={4} paddingY={2}>
          <form onSubmit={handleSubmit((data) => createBoard(data))}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <FormField
                  id="board-title"
                  label="Name"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Like 'Places to visit' or 'Recipes'"
                  errorMessage={errors.title?.message}
                />
              )}
            />
          </form>
        </Box>
      </Modal>
    </Layer>
  );
};

export default BoardCreateModal;