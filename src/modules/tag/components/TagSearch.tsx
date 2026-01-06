// src/modules/tag/components/TagSearch.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Spinner } from 'gestalt';
import { useSearchTags } from '../hooks/useSearchTags';
import { TagChip } from './TagChip';
import type { TagResponse } from '../types/tag.types';

interface TagSearchProps {
  onTagSelect?: (tag: TagResponse) => void;
  placeholder?: string;
  showRecentTags?: boolean;
  recentTags?: TagResponse[];
  maxSuggestions?: number;
  navigateOnSelect?: boolean;
}

export const TagSearch: React.FC<TagSearchProps> = ({
  onTagSelect,
  placeholder = 'Search tags...',
  showRecentTags = false,
  recentTags = [],
  maxSuggestions = 8,
  navigateOnSelect = true,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data: suggestions, isLoading } = useSearchTags(query, {
    limit: maxSuggestions,
    enabled: query.length > 0,
  });

  const totalOptions = (suggestions?.length || 0) + (query.trim() ? 1 : 0);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setFocusedIndex(-1);
    if (e.target.value.length > 0) {
      setIsOpen(true);
    }
  }, []);

  const handleTagSelect = useCallback((tag: TagResponse) => {
    if (onTagSelect) {
      onTagSelect(tag);
    } else if (navigateOnSelect) {
      navigate(`/search?q=${encodeURIComponent(tag.name)}`);
    }
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onTagSelect, navigateOnSelect, navigate]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  }, [query, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && suggestions && focusedIndex < suggestions.length) {
        handleTagSelect(suggestions[focusedIndex]!);
      } else {
        handleSubmit();
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
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  }, [suggestions, focusedIndex, totalOptions, handleTagSelect, handleSubmit]);

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
    if (query.length > 0 || (showRecentTags && recentTags.length > 0)) {
      setIsOpen(true);
    }
  }, [query, showRecentTags, recentTags]);

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

  const showDropdown = !!(isOpen && (
    (suggestions && suggestions.length > 0) || 
    (showRecentTags && recentTags.length > 0 && !query) ||
    query.trim() ||
    isLoading
  ));

  let optionIndex = 0;

  return (
    <div className="tag-search">
      <div className="tag-search__input-wrapper">
        <span className="tag-search__icon" aria-hidden="true">
          <Icon accessibilityLabel="" icon="search" size={20} color="subtle" />
        </span>
        <input
          ref={inputRef}
          type="text"
          className="tag-search__input"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search tags"
        />
      </div>

      {showDropdown && (
        <div 
          ref={dropdownRef} 
          className="tag-input__dropdown"
        >
          {isLoading && (
            <div className="tag-input__dropdown-loading">
              <Spinner accessibilityLabel="Searching tags" show size="sm" />
            </div>
          )}

          {!isLoading && suggestions && suggestions.length > 0 && (
            <>
              <div className="tag-input__dropdown-header">
                <span className="tag-input__dropdown-header-text">Tags</span>
              </div>
              {suggestions.map((tag) => {
                const currentIndex = optionIndex++;
                return (
                  <button
                    key={tag.id}
                    ref={el => { optionRefs.current[currentIndex] = el; }}
                    type="button"
                    className={`tag-input__dropdown-item ${focusedIndex === currentIndex ? 'tag-input__dropdown-item--focused' : ''}`}
                    onClick={() => handleTagSelect(tag)}
                    onKeyDown={(e) => handleOptionKeyDown(e, currentIndex)}
                    onMouseEnter={() => setFocusedIndex(currentIndex)}
                  >
                    <span className="tag-input__dropdown-icon" aria-hidden="true">
                      <Icon accessibilityLabel="" icon="tag" size={16} color="subtle" />
                    </span>
                    <span className="tag-input__dropdown-text">{tag.name}</span>
                  </button>
                );
              })}
            </>
          )}

          {!query && showRecentTags && recentTags.length > 0 && (
            <>
              <div className="tag-input__dropdown-header">
                <span className="tag-input__dropdown-header-text">Recent Tags</span>
              </div>
              <div className="tag-input__dropdown-recent">
                {recentTags.slice(0, 5).map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    onClick={() => handleTagSelect(tag)}
                  />
                ))}
              </div>
            </>
          )}

          {!isLoading && query.trim() && (() => {
            const searchIndex = suggestions?.length || 0;
            return (
              <button
                ref={el => { optionRefs.current[searchIndex] = el; }}
                type="button"
                className={`tag-input__dropdown-item tag-input__dropdown-item--create ${focusedIndex === searchIndex ? 'tag-input__dropdown-item--focused' : ''}`}
                onClick={handleSubmit}
                onKeyDown={(e) => handleOptionKeyDown(e, searchIndex)}
                onMouseEnter={() => setFocusedIndex(searchIndex)}
              >
                <span className="tag-input__dropdown-icon" aria-hidden="true">
                  <Icon accessibilityLabel="" icon="search" size={16} color="default" />
                </span>
                <span className="tag-input__dropdown-text">
                  Search for "<strong>{query}</strong>"
                </span>
              </button>
            );
          })()}

          {!isLoading && query && (!suggestions || suggestions.length === 0) && (
            <output className="tag-input__dropdown-empty">
              No tags found matching "{query}"
            </output>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSearch;