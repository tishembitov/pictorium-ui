// src/modules/pin/components/filters/PinSortSelect.tsx

import React from 'react';
import { SelectList, Box } from 'gestalt';
import { SORT_OPTIONS } from '../../types/pin.types';
import { usePinPreferencesStore } from '../../stores/pinPreferencesStore';

interface PinSortSelectProps {
  size?: 'md' | 'lg';
}

export const PinSortSelect: React.FC<PinSortSelectProps> = ({ size = 'lg' }) => {
  const sort = usePinPreferencesStore((s) => s.sort);
  const setSortFromValue = usePinPreferencesStore((s) => s.setSortFromValue);

  // Найти текущее значение
  const currentValue = SORT_OPTIONS.find(
    (opt) => opt.field === sort.field && opt.direction === sort.direction
  )?.value ?? 'newest';

  const handleChange = ({ value }: { value: string }) => {
    setSortFromValue(value);
  };

  return (
    <Box width={140}>
      <SelectList
        id="pin-sort-select"
        label="Sort"
        labelDisplay="hidden"
        value={currentValue}
        onChange={handleChange}
        size={size}
      >
        {SORT_OPTIONS.map((option) => (
          <SelectList.Option
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </SelectList>
    </Box>
  );
};

export default PinSortSelect;