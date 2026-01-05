// src/modules/pin/components/PinCreateForm.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, Divider, Text, Icon, TapArea } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  FormTextArea,
  FormSection,
  FormFooter,
  ImageUploadArea,
} from '@/shared/components';
import { TagInput } from '@/modules/tag';
import {
  useSelectedBoardStore,
  useSelectBoard,
  useMyBoards,
  useSavePinToBoard,
  BoardCreateModal,
  BoardPickerDropdown,
} from '@/modules/board';
import { useCreatePin } from '../hooks/useCreatePin';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/modules/auth';
import { pinCreateSchema, type PinCreateFormData } from './pinCreateSchema';
import { ensurePinLinkProtocol } from '../utils/pinUtils';
import type { BoardResponse } from '@/modules/board';
import type { UploadResult } from '@/modules/storage';

interface PinCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UploadedImage {
  imageId: string;
  thumbnailId?: string;
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export const PinCreateForm: React.FC<PinCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const globalSelectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // State
  const [localSelectedBoard, setLocalSelectedBoard] = useState<BoardResponse | null>(
    () => globalSelectedBoard
  );
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [boardPickerAnchor, setBoardPickerAnchor] = useState<HTMLDivElement | null>(null);
  const [isSavingToBoard, setIsSavingToBoard] = useState(false);

  // Hooks
  const { boards, isLoading: isBoardsLoading, refetch: refetchBoards } = useMyBoards({
    enabled: isAuthenticated,
  });

  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: () => {
      setIsSavingToBoard(false);
      if (localSelectedBoard) {
        selectBoard(localSelectedBoard.id);
        toast.success(`Pin created and saved to "${localSelectedBoard.title}"`);
      }
      onSuccess?.();
    },
    onError: () => {
      setIsSavingToBoard(false);
      toast.success('Pin created! (Failed to save to board)');
      onSuccess?.();
    },
  });

  const { createPin, isLoading: isCreating } = useCreatePin({
    onSuccess: (createdPin) => {
      if (localSelectedBoard) {
        setIsSavingToBoard(true);
        savePinToBoard({ boardId: localSelectedBoard.id, pinId: createdPin.id });
      } else {
        toast.success('Pin created!');
        onSuccess?.();
      }
    },
    navigateToPin: false,
    showToast: false,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<PinCreateFormData>({
    resolver: zodResolver(pinCreateSchema),
    defaultValues: {
      imageId: '',
      thumbnailId: undefined,
      title: '',
      description: '',
      href: '',
      tags: [],
    },
    mode: 'onChange',
  });

  const titleValue = useWatch({ control, name: 'title' });

  // Handlers
  const handleImageUpload = useCallback(
    (result: UploadResult) => {
      setUploadedImage({
        imageId: result.imageId,
        thumbnailId: result.thumbnailId,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        thumbnailWidth: result.thumbnailWidth,
        thumbnailHeight: result.thumbnailHeight,
      });
      setValue('imageId', result.imageId, { shouldValidate: true });
      if (result.thumbnailId) {
        setValue('thumbnailId', result.thumbnailId);
      }
    },
    [setValue]
  );

  const handleImageRemove = useCallback(() => {
    setUploadedImage(null);
    setValue('imageId', '', { shouldValidate: true });
    setValue('thumbnailId', undefined);
  }, [setValue]);

  const handleBoardPickerToggle = useCallback(() => {
    setShowBoardPicker((prev) => !prev);
    setBoardSearchQuery('');
  }, []);

  const handleBoardPickerDismiss = useCallback(() => {
    setShowBoardPicker(false);
    setBoardSearchQuery('');
  }, []);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    setLocalSelectedBoard(board);
    setShowBoardPicker(false);
    setBoardSearchQuery('');
  }, []);

  const handleCreateBoardClick = useCallback(() => {
    setShowBoardPicker(false);
    setShowCreateBoardModal(true);
  }, []);

  const handleCreateBoardSuccess = useCallback(
    (boardId: string, boardName: string) => {
      setShowCreateBoardModal(false);
      void refetchBoards();
      setLocalSelectedBoard({ id: boardId, title: boardName } as BoardResponse);
    },
    [refetchBoards]
  );

  const setBoardPickerAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setBoardPickerAnchor(node);
  }, []);

  const onSubmit = (data: PinCreateFormData) => {
    if (!uploadedImage || !localSelectedBoard) return;

    createPin({
      imageId: uploadedImage.imageId,
      thumbnailId: uploadedImage.thumbnailId,
      originalWidth: uploadedImage.originalWidth,
      originalHeight: uploadedImage.originalHeight,
      thumbnailWidth: uploadedImage.thumbnailWidth,
      thumbnailHeight: uploadedImage.thumbnailHeight,
      title: data.title,
      description: data.description || undefined,
      href: data.href ? ensurePinLinkProtocol(data.href) : undefined,
      tags: data.tags?.length ? data.tags : undefined,
    });
  };

  // Computed
  const hasImage = !!uploadedImage;
  const hasBoard = !!localSelectedBoard;
  const hasBoards = boards.length > 0;
  const canSubmit = hasImage && isValid && !!titleValue?.trim() && hasBoard;
  const isLoading = isCreating || isSavingToBoard;

  const boardSelectorText = localSelectedBoard?.title || 'Select a board';

  const getBoardHelperText = (): string | null => {
    if (localSelectedBoard) return null;
    if (!hasBoards) return 'Create a board to save your pin';
    return 'Select a board to save your pin';
  };

  const getValidationMessage = (): string | null => {
    if (!hasImage) return 'Upload an image';
    if (!titleValue?.trim()) return 'Add a title';
    if (!hasBoard) return 'Select a board';
    return null;
  };

  const getSubmitButtonText = (): string => {
    if (isSavingToBoard) return 'Saving...';
    if (isCreating) return 'Creating...';
    return 'Create Pin';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex gap={6} wrap>
        {/* Left Column - Image */}
        <Box width={280}>
          <FormSection title="Pin image" description="Recommended: 1000×1500 px">
            <ImageUploadArea
              onUploadComplete={handleImageUpload}
              onRemove={handleImageRemove}
              category="pins"
              generateThumbnail
              aspectRatio="2 / 3"
              placeholderText="Click to upload"
              placeholderSubtext="or drag and drop"
              errorMessage={errors.imageId?.message}
            />
          </FormSection>
        </Box>

        {/* Right Column - Form Fields */}
        <Box flex="grow" minWidth={280} maxWidth={400}>
          {/* Board Selection */}
          <FormSection title="Save to board" required>
            <Box ref={setBoardPickerAnchorRef}>
              <TapArea onTap={handleBoardPickerToggle} rounding={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="between"
                  paddingX={3}
                  paddingY={2}
                  rounding={2}
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
                      cursor: 'pointer',
                    },
                  }}
                >
                  <Flex alignItems="center" gap={2}>
                    <Icon accessibilityLabel="" icon="board" size={16} color="default" />
                    <Text
                      weight="bold"
                      size="200"
                      lineClamp={1}
                      color={localSelectedBoard ? 'default' : 'subtle'}
                    >
                      {boardSelectorText}
                    </Text>
                  </Flex>
                  <Icon
                    accessibilityLabel=""
                    icon={showBoardPicker ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color="default"
                  />
                </Box>
              </TapArea>
            </Box>

            <BoardPickerDropdown
              isOpen={showBoardPicker}
              anchorElement={boardPickerAnchor}
              onDismiss={handleBoardPickerDismiss}
              boards={boards}
              isLoading={isBoardsLoading}
              selectedBoardId={localSelectedBoard?.id ?? null}
              searchQuery={boardSearchQuery}
              onSearchChange={setBoardSearchQuery}
              onSelectBoard={handleBoardSelect}
              onCreateNew={handleCreateBoardClick}
              title="Select a board"
              size="md"
            />

            {getBoardHelperText() && (
              <Box marginTop={1}>
                <Text color="subtle" size="100">
                  {getBoardHelperText()}
                </Text>
              </Box>
            )}
          </FormSection>

          <Divider />

          {/* Title */}
          <Box marginTop={4}>
            <FormSection title="Title" required>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormField
                    id="pin-title"
                    label=""
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Add a title"
                    errorMessage={errors.title?.message}
                    maxLength={200}
                    size="md"
                  />
                )}
              />
            </FormSection>
          </Box>

          {/* Description */}
          <FormSection title="Description">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <FormTextArea
                  id="pin-description"
                  label=""
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Tell everyone what your Pin is about"
                  errorMessage={errors.description?.message}
                  maxLength={400}
                  rows={3}
                />
              )}
            />
          </FormSection>

          {/* Link */}
          <FormSection title="Destination link">
            <Controller
              name="href"
              control={control}
              render={({ field }) => (
                <FormField
                  id="pin-href"
                  label=""
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Add a link"
                  errorMessage={errors.href?.message}
                  type="url"
                  size="md"
                />
              )}
            />
          </FormSection>

          <Divider />

          {/* Tags */}
          <Box marginTop={4}>
            <FormSection title="Tags">
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    id="pin-tags"
                    label=""
                    selectedTags={field.value || []}
                    onChange={field.onChange}
                    placeholder="Search or create tags"
                    maxTags={10}
                    errorMessage={errors.tags?.message}
                  />
                )}
              />
            </FormSection>
          </Box>
        </Box>
      </Flex>

      {/* Footer */}
      <FormFooter
        onCancel={onCancel}
        submitText={getSubmitButtonText()}
        cancelText="Cancel"
        isLoading={isLoading}
        isDisabled={!canSubmit}
        validationMessage={getValidationMessage()}
      />

      <BoardCreateModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onSuccess={handleCreateBoardSuccess}
      />
    </form>
  );
};

export default PinCreateForm;