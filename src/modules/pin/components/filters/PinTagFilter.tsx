// src/modules/pin/components/PinTagFilter.tsx

import React from 'react';
import { Box } from 'gestalt';
import { TagInput, TagList } from '@/modules/tag';

interface PinTagFilterProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  label?: string;
  showSelectedAbove?: boolean;
}

export const PinTagFilter: React.FC<PinTagFilterProps> = ({
  selectedTags,
  onChange,
  maxTags = 5,
  label = 'Filter by tags',
  showSelectedAbove = false,
}) => {

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <Box>
      {/* Selected tags above input */}
      {showSelectedAbove && selectedTags.length > 0 && (
        <Box marginBottom={2}>
          <TagList
            tags={selectedTags}
            size="sm"
            removable
            onRemove={handleRemoveTag}
          />
        </Box>
      )}

      {/* Tag input */}
      <TagInput
        id="pin-tag-filter"
        label={label}
        selectedTags={selectedTags}
        onChange={onChange}
        placeholder="Add tags to filter..."
        maxTags={maxTags}
        helperText={`${selectedTags.length}/${maxTags} tags selected`}
      />
    </Box>
  );
};

export default PinTagFilter;