// src/shared/components/layout/HeaderSearch.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchField, Box } from 'gestalt';
import { ROUTES } from '../../utils/constants';

export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleChange = useCallback(({ value }: { value: string }) => {
    setQuery(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement>; value: string }) => {
      if (event.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

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
      />
    </Box>
  );
};

export default HeaderSearch;