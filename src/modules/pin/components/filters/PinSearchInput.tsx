// src/modules/pin/components/filters/PinSearchInput.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SearchField } from 'gestalt';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface PinSearchInputProps {
  /** Controlled value (optional) */
  value?: string;
  /** Callback when value changes (debounced) */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** ID for the input */
  id?: string;
}

export const PinSearchInput: React.FC<PinSearchInputProps> = ({
  value: controlledValue,
  onChange,
  placeholder = 'Search pins...',
  debounceMs = 300,
  id = 'pin-search-input',
}) => {
  // Determine if component is controlled
  const isControlled = controlledValue !== undefined;
  
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  
  // Current value depends on controlled/uncontrolled mode
  const currentValue = isControlled ? controlledValue : internalValue;
  
  // Debounce the current value
  const debouncedValue = useDebounce(currentValue, debounceMs);
  
  // Track if this is the first render to avoid calling onChange on mount
  const isFirstRender = useRef(true);

  // Notify parent when debounced value changes (in useEffect, not during render)
  useEffect(() => {
    // Skip the first render to avoid unnecessary callback on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    onChange?.(debouncedValue);
  }, [debouncedValue, onChange]);

  const handleChange = useCallback(({ value }: { value: string }) => {
    if (!isControlled) {
      setInternalValue(value);
    }
    // For controlled mode, parent should update via onChange callback
  }, [isControlled]);

  return (
    <SearchField
      id={id}
      accessibilityLabel="Search pins"
      accessibilityClearButtonLabel="Clear"
      placeholder={placeholder}
      value={currentValue}
      onChange={handleChange}
    />
  );
};

export default PinSearchInput;