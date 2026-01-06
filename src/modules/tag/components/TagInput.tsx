// src/modules/tag/components/TagInput.tsx

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Icon, Spinner } from 'gestalt';
import { useSearchTags } from '../hooks/useSearchTags';
import { TagChip } from './TagChip';
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data: suggestions, isLoading } = useSearchTags(inputValue, {
    limit: 5,
    enabled: inputValue.length > 0,
  });

  const filteredSuggestions = useMemo(() => {
    return suggestions?.filter(
      (tag) => !selectedTags.includes(tag.name)
    ) ?? [];
  }, [suggestions, selectedTags]);

  const showCreateOption = inputValue.trim() && 
    !selectedTags.includes(inputValue.trim().toLowerCase()) &&
    !filteredSuggestions.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  const totalOptions = filteredSuggestions.length + (showCreateOption ? 1 : 0);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setFocusedIndex(-1);
    if (e.target.value.length > 0) {
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
    setFocusedIndex(-1);
    inputRef.current?.focus();
  }, [selectedTags, onChange, maxTags]);

  const handleRemoveTag = useCallback((tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  }, [selectedTags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
        handleAddTag(filteredSuggestions[focusedIndex]!.name);
      } else if (focusedIndex === filteredSuggestions.length && showCreateOption) {
        handleAddTag(inputValue);
      } else if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      const nextIndex = Math.min(focusedIndex + 1, totalOptions - 1);
      setFocusedIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(focusedIndex - 1, -1);
      setFocusedIndex(prevIndex);
      if (prevIndex === -1) {
        inputRef.current?.focus();
      } else {
        optionRefs.current[prevIndex]?.focus();
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]!);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  }, [inputValue, selectedTags, focusedIndex, filteredSuggestions, showCreateOption, totalOptions, handleAddTag, handleRemoveTag]);

  const handleOptionKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, totalOptions - 1);
      setFocusedIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1;
      setFocusedIndex(prevIndex);
      if (prevIndex < 0) {
        inputRef.current?.focus();
      } else {
        optionRefs.current[prevIndex]?.focus();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
      inputRef.current?.focus();
    }
  }, [totalOptions]);

  const handleFocus = useCallback(() => {
    if (inputValue.length > 0) {
      setIsOpen(true);
    }
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset refs array when options change
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, totalOptions);
  }, [totalOptions]);

  const canAddMore = selectedTags.length < maxTags;
  const showDropdown = !!(isOpen && (filteredSuggestions.length > 0 || showCreateOption || isLoading));

  return (
    <div className="tag-input">
      {label && (
        <label htmlFor={id} className="tag-input__label">
          {label}
        </label>
      )}

      {selectedTags.length > 0 && (
        <div className="tag-input__selected">
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
        </div>
      )}

      <div className="tag-input__field-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={`tag-input__field ${errorMessage ? 'tag-input__field--error' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={canAddMore ? placeholder : 'Maximum tags reached'}
          disabled={disabled || !canAddMore}
          autoComplete="off"
          aria-label={label}
        />

        {showDropdown && (
          <div 
            ref={dropdownRef} 
            className="tag-input__dropdown"
          >
            {isLoading && (
              <div className="tag-input__dropdown-loading">
                <Spinner accessibilityLabel="Loading tags" show size="sm" />
              </div>
            )}

            {!isLoading && filteredSuggestions.map((tag, index) => (
              <button
                key={tag.id}
                ref={el => { optionRefs.current[index] = el; }}
                type="button"
                className={`tag-input__dropdown-item ${focusedIndex === index ? 'tag-input__dropdown-item--focused' : ''}`}
                onClick={() => handleAddTag(tag.name)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span className="tag-input__dropdown-icon" aria-hidden="true">
                  <Icon accessibilityLabel="" icon="tag" size={16} color="subtle" />
                </span>
                <span className="tag-input__dropdown-text">{tag.name}</span>
              </button>
            ))}

            {!isLoading && showCreateOption && (
              <button
                ref={el => { optionRefs.current[filteredSuggestions.length] = el; }}
                type="button"
                className={`tag-input__dropdown-item tag-input__dropdown-item--create ${focusedIndex === filteredSuggestions.length ? 'tag-input__dropdown-item--focused' : ''}`}
                onClick={() => handleAddTag(inputValue)}
                onKeyDown={(e) => handleOptionKeyDown(e, filteredSuggestions.length)}
                onMouseEnter={() => setFocusedIndex(filteredSuggestions.length)}
              >
                <span className="tag-input__dropdown-icon" aria-hidden="true">
                  <Icon accessibilityLabel="" icon="add" size={16} color="default" />
                </span>
                <span className="tag-input__dropdown-text">
                  <span className="tag-input__dropdown-create-label">Create:</span>
                  "{inputValue.trim()}"
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {(helperText || errorMessage) && (
        <p className={`tag-input__helper ${errorMessage ? 'tag-input__error' : ''}`}>
          {errorMessage || helperText || `${selectedTags.length}/${maxTags} tags`}
        </p>
      )}
    </div>
  );
};

export default TagInput;