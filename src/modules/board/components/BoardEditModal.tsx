// src/modules/board/components/BoardEditModal.tsx

import React, { useCallback, useEffect } from 'react';
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
import { z } from 'zod';
import { FormField } from '@/shared/components';
import { useUpdateBoard } from '../hooks/useUpdateBoard';
import { TEXT_LIMITS } from '@/shared/utils/constants';
import type { BoardResponse } from '../types/board.types';

const boardEditSchema = z.object({
  title: z
    .string()
    .min(1, 'Board title is required')
    .max(TEXT_LIMITS.BOARD_TITLE, `Title must be less than ${TEXT_LIMITS.BOARD_TITLE} characters`),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

type BoardEditFormData = z.infer<typeof boardEditSchema>;

interface BoardEditModalProps {
  board: BoardResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BoardEditModal: React.FC<BoardEditModalProps> = ({
  board,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateBoard, isLoading } = useUpdateBoard({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BoardEditFormData>({
    resolver: zodResolver(boardEditSchema),
    defaultValues: {
      title: board.title,
      description: '',
    },
  });

  // Reset form when board changes
  useEffect(() => {
    reset({
      title: board.title,
      description: '',
    });
  }, [board, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSave = useCallback(() => {
    handleSubmit((data: BoardEditFormData) => {
      updateBoard({ boardId: board.id, data });
    })();
  }, [handleSubmit, updateBoard, board.id]);

  if (!isOpen) return null;

  return (
    <Layer>
      <Modal
        accessibilityModalLabel="Edit board"
        heading={
          <Box padding={4}>
            <Heading size="400" accessibilityLevel={1}>
              Edit board
            </Heading>
          </Box>
        }
        onDismiss={handleClose}
        footer={
          <Box padding={4}>
            <Flex justifyContent="between" alignItems="center">
              <Flex gap={2}>
                <Button
                  text="Cancel"
                  onClick={handleClose}
                  color="gray"
                  disabled={isLoading}
                />
                <Button
                  text={isLoading ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  color="red"
                  disabled={isLoading || !isDirty}
                />
              </Flex>
            </Flex>
          </Box>
        }
        size="sm"
      >
        <Box padding={4}>
          <form onSubmit={handleSubmit((data) => updateBoard({ boardId: board.id, data }))}>
            <Flex direction="column" gap={4}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormField
                    id="edit-board-title"
                    label="Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Like 'Places to visit' or 'Recipes'"
                    errorMessage={errors.title?.message}
                    maxLength={TEXT_LIMITS.BOARD_TITLE}
                  />
                )}
              />
{/* 
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <FormTextArea
                    id="edit-board-description"
                    label="Description"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="What's your board about?"
                    errorMessage={errors.description?.message}
                    rows={3}
                  />
                )}
              /> */}

              {/* <Box>
                <Text size="100" color="subtle">
                  Tip: Drag and drop to reorder your boards
                </Text>
              </Box> */}
            </Flex>
          </form>
        </Box>
      </Modal>
    </Layer>
  );
};

export default BoardEditModal;