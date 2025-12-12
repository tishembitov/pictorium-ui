import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchField, Box } from 'gestalt';

export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Инициализируем значение из URL один раз
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  const handleChange = useCallback(({ value }: { value: string }) => {
    setQuery(value);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [query, navigate]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      if (event.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <Box width="100%">
      <SearchField
        id="header-search"
        accessibilityLabel="Search pins"
        accessibilityClearButtonLabel="Clear search"
        placeholder="Search for ideas..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleClear}
      />
    </Box>
  );
};

export default HeaderSearch;