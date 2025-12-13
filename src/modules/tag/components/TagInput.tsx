// src/modules/tag/components/TagInput.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Flex, 
  Text, 
  TapArea,
  Popover,
  Spinner,
} from 'gestalt';
import { useSearchTags } from '../hooks/useSearchTags';
import { TagChip } from './TagChip';
import type { TagResponse } from '../types/tag.types';
import { TEXT_LIMITS } from '@/shared/utils/constants';

interface TagInputProps {
  id: string;
  label?: string;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  id,
  label = 'Tags',
  selectedTags,
  onChange,
  placeholder = 'Search or create tags...',
  maxTags = 10,
  disabled = false,
  errorMessage,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions, isLoading } = useSearchTags(inputValue, {
    limit: 5,
    enabled: inputValue.length > 0,
  });

  // Filter out already selected tags from suggestions
  const filteredSuggestions = suggestions?.filter(
    (tag) => !selectedTags.includes(tag.name)
  ) ?? [];

  const handleInputChange = useCallback(({ value }: { value: string }) => {
    setInputValue(value);
    if (value.length > 0) {
      setIsOpen(true);
    }
  }, []);

  const handleAddTag = useCallback((tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    
    if (!trimmedTag) return;
    if (trimmedTag.length > TEXT_LIMITS.TAG_NAME) return;
    if (selectedTags.includes(trimmedTag)) return;
    if (selectedTags.length >= maxTags) return;

    onChange([...selectedTags, trimmedTag]);
    setInputValue('');
    setIsOpen(false);
  }, [selectedTags, onChange, maxTags]);

  const handleRemoveTag = useCallback((tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  }, [selectedTags, onChange]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      if (event.key === 'Enter' && inputValue.trim()) {
        event.preventDefault();
        handleAddTag(inputValue);
      } else if (event.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
        handleRemoveTag(selectedTags[selectedTags.length - 1]!);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [inputValue, selectedTags, handleAddTag, handleRemoveTag]
  );

  const handleSuggestionClick = useCallback((tag: TagResponse) => {
    handleAddTag(tag.name);
  }, [handleAddTag]);

  const handleFocus = useCallback(() => {
    if (inputValue.length > 0) {
      setIsOpen(true);
    }
  }, [inputValue]);

  // Set anchor ref
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = () => {
      setTimeout(() => setIsOpen(false), 150);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const canAddMore = selectedTags.length < maxTags;
  const showSuggestions = isOpen && (filteredSuggestions.length > 0 || inputValue.trim());

  return (
    <Box>
      {/* Label */}
      {label && (
        <Box marginBottom={2}>
          <Text size="100" weight="bold">
            {label}
          </Text>
        </Box>
      )}

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Box marginBottom={2}>
          <Flex wrap gap={2}>
            {selectedTags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                size="sm"
                removable
                onRemove={handleRemoveTag}
                disabled={disabled}
              />
            ))}
          </Flex>
        </Box>
      )}

      {/* Input */}
      <Box ref={setAnchorRef}>
        <TextField
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={canAddMore ? placeholder : 'Maximum tags reached'}
          disabled={disabled || !canAddMore}
          errorMessage={errorMessage}
          helperText={helperText || `${selectedTags.length}/${maxTags} tags`}
          size="lg"
          ref={inputRef}
        />
      </Box>

      {/* Suggestions Dropdown */}
      {showSuggestions && anchorElement && (
        <Popover
          anchor={anchorElement}
          onDismiss={() => setIsOpen(false)}
          idealDirection="down"
          positionRelativeToAnchor={false}
          size="flexible"
          color="white"
        >
          <Box padding={2} minWidth={200} maxHeight={300} overflow="auto">
            {isLoading && (
              <Box padding={3} display="flex" justifyContent="center">
                <Spinner accessibilityLabel="Loading tags" show size="sm" />
              </Box>
            )}

            {!isLoading && filteredSuggestions.length > 0 && (
              <Flex direction="column" gap={1}>
                {filteredSuggestions.map((tag) => (
                  <TapArea
                    key={tag.id}
                    onTap={() => handleSuggestionClick(tag)}
                    rounding={2}
                  >
                    <Box padding={2} rounding={2}>
                      <Text size="200">{tag.name}</Text>
                    </Box>
                  </TapArea>
                ))}
              </Flex>
            )}

            {/* Create new tag option */}
            {!isLoading && inputValue.trim() && !selectedTags.includes(inputValue.trim().toLowerCase()) && (
              <TapArea
                onTap={() => handleAddTag(inputValue)}
                rounding={2}
              >
                <Box 
                  padding={2} 
                  rounding={2}
                  color="secondary"
                  marginTop={filteredSuggestions.length > 0 ? 1 : 0}
                >
                  <Flex alignItems="center" gap={2}>
                    <Text size="200" weight="bold">Create:</Text>
                    <Text size="200">"{inputValue.trim()}"</Text>
                  </Flex>
                </Box>
              </TapArea>
            )}

            {!isLoading && filteredSuggestions.length === 0 && !inputValue.trim() && (
              <Box padding={2}>
                <Text size="200" color="subtle">
                  Type to search tags...
                </Text>
              </Box>
            )}
          </Box>
        </Popover>
      )}
    </Box>
  );
};

export default TagInput;