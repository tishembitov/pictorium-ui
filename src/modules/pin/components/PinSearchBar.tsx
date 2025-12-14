// src/modules/pin/components/PinSearchBar.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, SearchField } from 'gestalt';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePinFiltersStore } from '../stores/pinFiltersStore';

interface PinSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  navigateOnSearch?: boolean;
}

export const PinSearchBar: React.FC<PinSearchBarProps> = ({
  placeholder = 'Search pins...',
  onSearch,
  navigateOnSearch = true,
}) => {
  const navigate = useNavigate();
  const setQuery = usePinFiltersStore((state) => state.setQuery);
  const currentQuery = usePinFiltersStore((state) => state.filter.q);
  
  const [inputValue, setInputValue] = useState(currentQuery || '');
  const debouncedValue = useDebounce(inputValue, 300);

  // Update store when debounced value changes
  React.useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    } else {
      setQuery(debouncedValue);
    }
  }, [debouncedValue, onSearch, setQuery]);

  const handleChange = useCallback(({ value }: { value: string }) => {
    setInputValue(value);
  }, []);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      if (event.key === 'Enter' && inputValue.trim() && navigateOnSearch) {
        navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
      }
    },
    [inputValue, navigate, navigateOnSearch]
  );

  return (
    <Box width="100%">
      <SearchField
        id="pin-search"
        accessibilityLabel="Search pins"
        accessibilityClearButtonLabel="Clear search"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
    </Box>
  );
};

export default PinSearchBar;