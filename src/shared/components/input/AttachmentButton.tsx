// src/shared/components/input/AttachmentButton.tsx

import React, { useRef, useCallback } from 'react';
import { IconButton, Tooltip } from 'gestalt';
import { ATTACHMENTS } from '@/shared/utils/constants';

interface AttachmentButtonProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxFileSize?: number;
  onError?: (message: string) => void;
}

const getIconSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  switch (size) {
    case 'sm':
      return 'xs';
    case 'lg':
      return 'lg';
    default:
      return 'md';
  }
};

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelect,
  accept = ATTACHMENTS.ACCEPT_STRING,
  multiple = false,
  disabled = false,
  size = 'md',
  maxFileSize = ATTACHMENTS.MAX_FILE_SIZE,
  onError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        const maxMB = Math.round(maxFileSize / (1024 * 1024));
        return `File "${file.name}" is too large. Max size: ${maxMB}MB`;
      }

      const allowedTypes = accept.split(',').map((t) => t.trim());
      const isAllowed = allowedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return `File type "${file.type || 'unknown'}" is not supported`;
      }

      return null;
    },
    [accept, maxFileSize]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0 && onError) {
        onError(errors[0]!);
      }

      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }

      e.target.value = '';
    },
    [onFileSelect, onError, validateFile]
  );

  const iconSize = getIconSize(size);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <Tooltip text="Attach image">
        <IconButton
          accessibilityLabel="Attach image"
          icon="paper-clip"
          onClick={handleClick}
          size={iconSize}
          bgColor="transparent"
          disabled={disabled}
        />
      </Tooltip>
    </>
  );
};

export default AttachmentButton;