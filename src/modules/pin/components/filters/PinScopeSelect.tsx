// src/modules/pin/components/filters/PinScopeSelect.tsx

import React from 'react';
import { SelectList, Box } from 'gestalt';
import type { PinScope, ScopeOption } from '../../types/pin.types';
import { SCOPE_OPTIONS } from '../../types/pin.types';

interface PinScopeSelectProps {
  value: PinScope;
  onChange: (scope: PinScope) => void;
  options?: ScopeOption[];
  size?: 'md' | 'lg';
  label?: string;
}

export const PinScopeSelect: React.FC<PinScopeSelectProps> = ({
  value,
  onChange,
  options = SCOPE_OPTIONS,
  size = 'lg',
  label = 'Show',
}) => {
  const handleChange = ({ value: newValue }: { value: string }) => {
    onChange(newValue as PinScope);
  };

  return (
    <Box width={160}>
      <SelectList
        id="pin-scope-select"
        label={label}
        labelDisplay="hidden"
        value={value}
        onChange={handleChange}
        size={size}
      >
        {options.map((option) => (
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

export default PinScopeSelect;