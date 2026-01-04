// src/modules/pin/components/PinCreateForm.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Button, Divider, Text, Icon, TapArea, Spinner } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { FormField, FormTextArea } from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
import { TagInput } from '@/modules/tag';
import { 
  useSavePinToBoard, 
  useSelectedBoardStore,
  useSelectBoard,
  useMyBoards,
  BoardCreateModal,
} from '@/modules/board';
import { useBoardPins } from '@/modules/board/hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
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

// ==================== Sub-components ====================

const BoardPreviewImage: React.FC<{ boardId: string; size?: number }> = ({ 
  boardId, 
  size = 40 
}) => {
  const { pins } = useBoardPins(boardId, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <Box
      width={size}
      height={size}
      rounding={2}
      overflow="hidden"
      color="secondary"
      display="flex"
      alignItems="center"
      justifyContent="center"
      dangerouslySetInlineStyle={{
        __style: coverData?.url ? {
          backgroundImage: `url(${coverData.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {},
      }}
    >
      {!coverData?.url && (
        <Icon accessibilityLabel="" icon="board" size={16} color="subtle" />
      )}
    </Box>
  );
};

const BoardSelectorItem: React.FC<{
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ board, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TapArea onTap={onSelect} rounding={3}>
      <Box
        padding={3}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelected 
              ? 'rgba(0, 0, 0, 0.08)' 
              : isHovered 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'transparent',
            border: isSelected ? '2px solid #111' : '2px solid transparent',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          <BoardPreviewImage boardId={board.id} size={48} />
          
          <Box flex="grow">
            <Text weight="bold" size="300" lineClamp={1}>
              {board.title}
            </Text>
          </Box>

          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={20} color="default" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

// ==================== Main Component ====================

export const PinCreateForm: React.FC<PinCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { isAuthenticated } = useAuth();
  
  // Get global selected board as initial value
  const globalSelectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();
  
  // State
  const [localSelectedBoard, setLocalSelectedBoard] = useState<BoardResponse | null>(
    () => globalSelectedBoard
  );
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardSelectorAnchor, setBoardSelectorAnchor] = useState<HTMLDivElement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Hooks
  const { upload, isUploading } = useImageUpload();
  const { boards, isLoading: isBoardsLoading } = useMyBoards({ enabled: isAuthenticated });

  // Save to board after creation
  const { savePinToBoard } = useSavePinToBoard({
    showToast: false,
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Create pin mutation
  const { createPin, isLoading: isCreating } = useCreatePin({
    onSuccess: (createdPin) => {
      // Save to selected board
      if (localSelectedBoard) {
        savePinToBoard({ boardId: localSelectedBoard.id, pinId: createdPin.id });
        // Update global selected board
        selectBoard(localSelectedBoard.id);
        toast.success(`Pin created and saved to "${localSelectedBoard.title}"`);
      } else {
        toast.success('Pin created!');
      }
      
      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      if (localSelectedBoard) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(localSelectedBoard.id) });
      }
      
      onSuccess?.();
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

  const titleValue = useWatch({
    control,
    name: 'title',
  });

  // ==================== Handlers ====================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [upload, setValue, previewUrl, toast]);

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

  // Board selection handlers
  const handleBoardSelectorToggle = useCallback(() => {
    setShowBoardSelector(prev => !prev);
  }, []);

  const handleBoardSelectorDismiss = useCallback(() => {
    setShowBoardSelector(false);
  }, []);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    setLocalSelectedBoard(board);
    setShowBoardSelector(false);
  }, []);

  const handleCreateBoardClick = useCallback(() => {
    setShowBoardSelector(false);
    setShowCreateBoardModal(true);
  }, []);

  const handleCreateBoardSuccess = useCallback((boardId: string) => {
    // Найти созданную доску в списке (после refetch) или создать временный объект
    const newBoard = boards.find(b => b.id === boardId);
    if (newBoard) {
      setLocalSelectedBoard(newBoard);
    }
    setShowCreateBoardModal(false);
    // Refetch boards list
    void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
  }, [boards, queryClient]);

  const setBoardSelectorAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setBoardSelectorAnchor(node);
  }, []);

  // Submit
  const onSubmit = (data: PinCreateFormData) => {
    if (!uploadedImage) return;

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
  const canSubmit = hasImage && isValid && !!titleValue?.trim() && !isUploading && hasBoard;
  const isLoading = isCreating || isUploading;

  const displayBoardName = localSelectedBoard?.title || 'Select board';

  // ==================== Render ====================

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Main Layout */}
      <Flex gap={6} wrap>
        {/* Left Column - Image */}
        <Box width={280}>
          <Box marginBottom={2}>
            <Text weight="bold" size="200">
              Pin image
            </Text>
            <Text color="subtle" size="100">
              Recommended: 1000×1500 px
            </Text>
          </Box>

          {/* Image Container */}
          <Box
            position="relative"
            width="100%"
            rounding={3}
            overflow="hidden"
            dangerouslySetInlineStyle={{
              __style: {
                aspectRatio: '2 / 3',
                backgroundColor: 'var(--bg-secondary)',
                border: previewUrl 
                  ? 'none' 
                  : '2px dashed var(--border-default)',
              },
            }}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Pin preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
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
                      __style: {
                        backgroundColor: 'rgba(255,255,255,0.8)',
                      },
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
              <TapArea
                onTap={handleUploadClick}
                rounding={3}
                disabled={isUploading}
                fullWidth
                fullHeight
              >
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
                      <Box 
                        marginBottom={2} 
                        color="secondary" 
                        rounding="circle" 
                        padding={3}
                      >
                        <Icon
                          accessibilityLabel="Upload image"
                          icon="camera"
                          size={24}
                          color="subtle"
                        />
                      </Box>
                      <Text weight="bold" align="center" size="200">
                        Click to upload
                      </Text>
                      <Box marginTop={1}>
                        <Text color="subtle" align="center" size="100">
                          or drag and drop
                        </Text>
                      </Box>
                    </>
                  )}
                </Box>
              </TapArea>
            )}
          </Box>

          {/* Image actions */}
          {hasImage && !isUploading && (
            <Box marginTop={2}>
              <Flex gap={2}>
                <Button
                  text="Change"
                  onClick={handleUploadClick}
                  size="sm"
                  color="gray"
                />
                <Button
                  text="Remove"
                  onClick={handleRemoveImage}
                  size="sm"
                  color="transparent"
                />
              </Flex>
            </Box>
          )}

          {errors.imageId && (
            <Box marginTop={2}>
              <Text color="error" size="100">
                {errors.imageId.message}
              </Text>
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
          {/* Board Selection - Pinterest Style */}
          <Box marginBottom={4}>
            <Box marginBottom={2}>
              <Flex alignItems="center" gap={1}>
                <Text weight="bold" size="200">Save to board</Text>
                <Text color="error" size="200">*</Text>
              </Flex>
            </Box>
            
            {/* Board Selector Trigger */}
            <Box ref={setBoardSelectorAnchorRef}>
              <TapArea onTap={handleBoardSelectorToggle} rounding={3}>
                <Box
                  padding={3}
                  rounding={3}
                  display="flex"
                  alignItems="center"
                  justifyContent="between"
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
                      border: hasBoard ? '2px solid #111' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    },
                  }}
                >
                  <Flex alignItems="center" gap={3} flex="grow">
                    {localSelectedBoard ? (
                      <>
                        <BoardPreviewImage boardId={localSelectedBoard.id} size={40} />
                        <Text weight="bold" size="300" lineClamp={1}>
                          {displayBoardName}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Box
                          width={40}
                          height={40}
                          rounding={2}
                          color="secondary"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon accessibilityLabel="" icon="board" size={20} color="subtle" />
                        </Box>
                        <Text color="subtle" size="300">
                          {displayBoardName}
                        </Text>
                      </>
                    )}
                  </Flex>
                  <Icon
                    accessibilityLabel=""
                    icon={showBoardSelector ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color="default"
                  />
                </Box>
              </TapArea>
            </Box>

            {/* Board Selector Dropdown */}
            {showBoardSelector && boardSelectorAnchor && (
              <Box marginTop={2}>
                <Box
                  rounding={4}
                  overflow="hidden"
                  dangerouslySetInlineStyle={{
                    __style: {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '1px solid rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <Box padding={3} color="default">
                    {/* Header */}
                    <Box marginBottom={3}>
                      <Flex justifyContent="between" alignItems="center">
                        <Text weight="bold" size="300">
                          Select a board
                        </Text>
                        <TapArea onTap={handleBoardSelectorDismiss} rounding="circle">
                          <Icon accessibilityLabel="Close" icon="cancel" size={20} />
                        </TapArea>
                      </Flex>
                    </Box>

                    {/* Boards List */}
                    <Box maxHeight={240} overflow="scrollY">
                      {isBoardsLoading ? (
                        <Box display="flex" justifyContent="center" padding={4}>
                          <Spinner accessibilityLabel="Loading" show size="sm" />
                        </Box>
                      ) : boards.length === 0 ? (
                        <Box padding={4}>
                          <Text align="center" color="subtle" size="200">
                            No boards yet. Create your first board!
                          </Text>
                        </Box>
                      ) : (
                        <Flex direction="column" gap={1}>
                          {boards.map((board) => (
                            <BoardSelectorItem
                              key={board.id}
                              board={board}
                              isSelected={localSelectedBoard?.id === board.id}
                              onSelect={() => handleBoardSelect(board)}
                            />
                          ))}
                        </Flex>
                      )}
                    </Box>

                    <Divider />

                    {/* Create Board */}
                    <Box marginTop={3}>
                      <TapArea onTap={handleCreateBoardClick} rounding={3}>
                        <Box
                          padding={3}
                          rounding={3}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="secondary"
                        >
                          <Flex alignItems="center" gap={2}>
                            <Icon accessibilityLabel="" icon="add" size={20} />
                            <Text weight="bold" size="300">
                              Create board
                            </Text>
                          </Flex>
                        </Box>
                      </TapArea>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {!hasBoard && (
              <Box marginTop={1}>
                <Text color="subtle" size="100">
                  Select a board to save your pin
                </Text>
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
                    {!hasImage && 'Upload an image'}
                    {hasImage && !titleValue?.trim() && 'Add a title'}
                    {hasImage && titleValue?.trim() && !hasBoard && 'Select a board'}
                  </Text>
                </Flex>
              )}
            </Box>

            <Flex gap={2}>
              {onCancel && (
                <Button
                  text="Cancel"
                  onClick={onCancel}
                  size="md"
                  color="gray"
                  disabled={isLoading}
                />
              )}
              <Button
                text={isCreating ? 'Creating...' : 'Create Pin'}
                type="submit"
                size="md"
                color="red"
                disabled={isLoading || !canSubmit}
              />
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onSuccess={handleCreateBoardSuccess}
      />
    </form>
  );
};

export default PinCreateForm;