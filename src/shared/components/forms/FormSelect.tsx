// src/shared/components/forms/FormSelect.tsx
import React from 'react';
import { Box, SelectList } from 'gestalt';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  disabled?: boolean;
  size?: 'md' | 'lg';
  name?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  helperText,
  errorMessage,
  disabled = false,
  size = 'lg',
  name,
}) => {
  const handleChange = ({ value }: { value: string }) => {
    onChange(value);
  };

  return (
    <Box>
      <SelectList
        id={id}
        name={name || id}
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        helperText={helperText}
        errorMessage={errorMessage}
        disabled={disabled}
        size={size}
      >
        {options.map((option) => (
          <SelectList.Option
            key={option.value}
            label={option.label}
            value={option.value}
            disabled={option.disabled}
          />
        ))}
      </SelectList>
    </Box>
  );
};

export default FormSelect;