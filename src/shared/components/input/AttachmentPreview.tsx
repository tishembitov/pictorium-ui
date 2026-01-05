// src/shared/components/input/AttachmentPreview.tsx

import React, { useMemo, useEffect } from 'react';
import { Box, Flex, Text, IconButton, Icon, Mask, Spinner } from 'gestalt';
import { formatFileSize } from '@/modules/storage/utils/fileUtils';

export interface AttachmentFile {
  id: string;
  file: File;
  previewUrl?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  isUploaded?: boolean;
  uploadedId?: string;
  error?: string;
}

interface AttachmentPreviewProps {
  files: AttachmentFile[];
  onRemove: (id: string) => void;
  compact?: boolean;
}

// Используем иконки которые есть в Gestalt
const getFileIcon = (type: string): 'camera' | 'video-camera' | 'file-unknown' => {
  if (type.startsWith('image/')) return 'camera';
  if (type.startsWith('video/')) return 'video-camera';
  return 'file-unknown';
};

const getFileExtension = (name: string): string => {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
};

interface FileItemProps {
  file: AttachmentFile;
  onRemove: () => void;
  compact?: boolean;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, compact }) => {
  const isImage = file.file.type.startsWith('image/');
  const hasPreview = isImage && file.previewUrl;
  const size = compact ? 64 : 80;

  return (
    <Box position="relative">
      <Box
        width={size}
        height={size}
        rounding={2}
        overflow="hidden"
        color="secondary"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        {hasPreview ? (
          <Mask rounding={2}>
            <img
              src={file.previewUrl}
              alt={file.file.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Mask>
        ) : (
          <Flex direction="column" alignItems="center" gap={1}>
            <Icon
              accessibilityLabel=""
              icon={getFileIcon(file.file.type)}
              size={compact ? 20 : 24}
              color="subtle"
            />
            <Text size="100" color="subtle">
              {getFileExtension(file.file.name)}
            </Text>
          </Flex>
        )}

        {/* Upload progress */}
        {file.isUploading && (
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
              __style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
            }}
          >
            <Spinner accessibilityLabel="Uploading" show size="sm" />
          </Box>
        )}

        {/* Error */}
        {file.error && (
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
              __style: { backgroundColor: 'rgba(255, 0, 0, 0.3)' },
            }}
          >
            <Icon accessibilityLabel="Error" icon="workflow-status-problem" color="inverse" size={16} />
          </Box>
        )}

        {/* Success */}
        {file.isUploaded && !file.error && (
          <Box
            position="absolute"
            bottom
            right
            padding={1}
            rounding="circle"
            dangerouslySetInlineStyle={{
              __style: { backgroundColor: 'var(--color-success)', margin: 4 },
            }}
          >
            <Icon accessibilityLabel="Done" icon="check" color="inverse" size={10} />
          </Box>
        )}
      </Box>

      {/* Remove button */}
      <Box
        position="absolute"
        dangerouslySetInlineStyle={{
          __style: { top: -8, right: -8 },
        }}
      >
        <Box
          rounding="circle"
          color="default"
          dangerouslySetInlineStyle={{
            __style: { boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
          }}
        >
          <IconButton
            accessibilityLabel="Remove"
            icon="cancel"
            size="xs"
            onClick={onRemove}
            bgColor="white"
          />
        </Box>
      </Box>

      {/* File info */}
      {!compact && (
        <Box marginTop={1} maxWidth={size}>
          <Text size="100" color="subtle" lineClamp={1}>
            {file.file.name}
          </Text>
          <Text size="100" color="subtle">
            {formatFileSize(file.file.size)}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  files,
  onRemove,
  compact = false,
}) => {
  // Generate preview URLs for images
  const filesWithPreviews = useMemo(() => {
    return files.map((f) => {
      if (f.previewUrl || !f.file.type.startsWith('image/')) {
        return f;
      }
      return {
        ...f,
        previewUrl: URL.createObjectURL(f.file),
      };
    });
  }, [files]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      filesWithPreviews.forEach((f) => {
        if (f.previewUrl && f.file.type.startsWith('image/')) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, [filesWithPreviews]);

  if (files.length === 0) return null;

  return (
    <Box paddingY={2}>
      <Flex gap={2} wrap>
        {filesWithPreviews.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onRemove={() => onRemove(file.id)}
            compact={compact}
          />
        ))}
      </Flex>
    </Box>
  );
};

export default AttachmentPreview;