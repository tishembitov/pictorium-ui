// src/modules/pin/components/PinCreateForm.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Button, Divider, Text, Icon, TapArea, Spinner } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormTextArea } from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [boardPickerAnchor, setBoardPickerAnchor] = useState<HTMLDivElement | null>(null);
  const [isSavingToBoard, setIsSavingToBoard] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { upload, isUploading } = useImageUpload();
  const { boards, isLoading: isBoardsLoading, refetch: refetchBoards } = useMyBoards({
    enabled: isAuthenticated,
  });

  // Хук для сохранения в доску после создания пина
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  // ==================== Handlers ====================

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);

      try {
        const result = await upload(file, {
          category: 'pins',
          generateThumbnail: true,
          thumbnailWidth: 236,
        });

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
      } catch (error) {
        console.error('Upload failed:', error);
        URL.revokeObjectURL(newPreviewUrl);
        setPreviewUrl(null);
        setUploadedImage(null);
        toast.error('Failed to upload image');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, setValue, previewUrl, toast]
  );

  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedImage(null);
    setValue('imageId', '', { shouldValidate: true });
    setValue('thumbnailId', undefined);
  }, [previewUrl, setValue]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  // ==================== Computed ====================

  const hasImage = !!uploadedImage;
  const hasBoard = !!localSelectedBoard;
  const hasBoards = boards.length > 0;
  const canSubmit = hasImage && isValid && !!titleValue?.trim() && !isUploading && hasBoard;
  const isLoading = isCreating || isUploading || isSavingToBoard;

  // Текст для board selector
  const boardSelectorText = localSelectedBoard?.title || 'Select a board';

  // Helper text для board section
  const getBoardHelperText = (): string | null => {
    if (localSelectedBoard) return null;
    if (!hasBoards) return 'Create a board to save your pin';
    return 'Select a board to save your pin';
  };

  // ✅ Исправлено: вынесли логику в отдельную функцию
  const getValidationMessage = (): string | null => {
    if (!hasImage) return 'Upload an image';
    if (!titleValue?.trim()) return 'Add a title';
    if (!hasBoard) return 'Select a board';
    return null;
  };

  // ✅ Исправлено: вынесли логику в отдельную функцию
  const getSubmitButtonText = (): string => {
    if (isSavingToBoard) return 'Saving...';
    if (isCreating || isUploading) return 'Creating...';
    return 'Create Pin';
  };

  // ==================== Render ====================

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Flex gap={6} wrap>
        {/* Left Column - Image */}
        <Box width={280}>
          <Box marginBottom={2}>
            <Text weight="bold" size="200">Pin image</Text>
            <Text color="subtle" size="100">Recommended: 1000×1500 px</Text>
          </Box>

          <Box
            position="relative"
            width="100%"
            rounding={3}
            overflow="hidden"
            dangerouslySetInlineStyle={{
              __style: {
                aspectRatio: '2 / 3',
                backgroundColor: 'var(--bg-secondary)',
                border: previewUrl ? 'none' : '2px dashed var(--border-default)',
              },
            }}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Pin preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {isUploading && (
                  <Box
                    position="absolute"
                    top
                    left
                    right
                    bottom
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    dangerouslySetInlineStyle={{
                      __style: { backgroundColor: 'rgba(255,255,255,0.8)' },
                    }}
                  >
                    <Flex direction="column" alignItems="center" gap={2}>
                      <Spinner accessibilityLabel="Uploading" show />
                      <Text size="200" weight="bold">Uploading...</Text>
                    </Flex>
                  </Box>
                )}
              </>
            ) : (
              <TapArea onTap={handleUploadClick} rounding={3} disabled={isUploading} fullWidth fullHeight>
                <Box
                  width="100%"
                  height="100%"
                  display="flex"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  padding={4}
                >
                  {isUploading ? (
                    <Spinner accessibilityLabel="Uploading" show />
                  ) : (
                    <>
                      <Box marginBottom={2} color="secondary" rounding="circle" padding={3}>
                        <Icon accessibilityLabel="Upload image" icon="camera" size={24} color="subtle" />
                      </Box>
                      <Text weight="bold" align="center" size="200">Click to upload</Text>
                      <Box marginTop={1}>
                        <Text color="subtle" align="center" size="100">or drag and drop</Text>
                      </Box>
                    </>
                  )}
                </Box>
              </TapArea>
            )}
          </Box>

          {hasImage && !isUploading && (
            <Box marginTop={2}>
              <Flex gap={2}>
                <Button text="Change" onClick={handleUploadClick} size="sm" color="gray" />
                <Button text="Remove" onClick={handleRemoveImage} size="sm" color="transparent" />
              </Flex>
            </Box>
          )}

          {errors.imageId && (
            <Box marginTop={2}>
              <Text color="error" size="100">{errors.imageId.message}</Text>
            </Box>
          )}

          {uploadedImage && !isUploading && (
            <Box marginTop={2}>
              <Text color="subtle" size="100">
                {uploadedImage.originalWidth} × {uploadedImage.originalHeight} px
              </Text>
            </Box>
          )}
        </Box>

        {/* Right Column - Form Fields */}
        <Box flex="grow" minWidth={280} maxWidth={400}>
          {/* Board Selection */}
          <Box marginBottom={4}>
            <Box marginBottom={2}>
              <Flex alignItems="center" gap={1}>
                <Text weight="bold" size="200">Save to board</Text>
                <Text color="error" size="200">*</Text>
              </Flex>
            </Box>

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

            {/* Helper text */}
            {getBoardHelperText() && (
              <Box marginTop={1}>
                <Text color="subtle" size="100">{getBoardHelperText()}</Text>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Title */}
          <Box marginTop={4} marginBottom={4}>
            <Box marginBottom={1}>
              <Flex alignItems="center" gap={1}>
                <Text weight="bold" size="200">Title</Text>
                <Text color="error" size="200">*</Text>
              </Flex>
            </Box>
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
          </Box>

          {/* Description */}
          <Box marginBottom={4}>
            <Box marginBottom={1}>
              <Text weight="bold" size="200">Description</Text>
            </Box>
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
          </Box>

          {/* Link */}
          <Box marginBottom={4}>
            <Box marginBottom={1}>
              <Text weight="bold" size="200">Destination link</Text>
            </Box>
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
          </Box>

          <Divider />

          {/* Tags */}
          <Box marginTop={4}>
            <Box marginBottom={1}>
              <Text weight="bold" size="200">Tags</Text>
            </Box>
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
          </Box>
        </Box>
      </Flex>

      {/* Footer */}
      <Box marginTop={6} padding={4}>
        <Divider />
        <Box paddingY={4}>
          <Flex justifyContent="between" alignItems="center">
            <Box>
              {!canSubmit && !isLoading && (
                <Flex gap={2} alignItems="center">
                  <Icon accessibilityLabel="" icon="workflow-status-warning" size={14} color="subtle" />
                  <Text size="200" color="subtle">
                    {getValidationMessage()}
                  </Text>
                </Flex>
              )}
            </Box>

            <Flex gap={2}>
              {onCancel && (
                <Button text="Cancel" onClick={onCancel} size="md" color="gray" disabled={isLoading} />
              )}
              <Button
                text={getSubmitButtonText()}
                type="submit"
                size="md"
                color="red"
                disabled={isLoading || !canSubmit}
              />
            </Flex>
          </Flex>
        </Box>
      </Box>

      <BoardCreateModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onSuccess={handleCreateBoardSuccess}
      />
    </form>
  );
};

export default PinCreateForm;