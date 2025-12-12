// src/shared/components/forms/FormField.tsx
import React from 'react';
import { Box, TextField } from 'gestalt';

type TextFieldType = 'text' | 'email' | 'password' | 'url' | 'date';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  type?: TextFieldType;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: 'current-password' | 'username' | 'new-password' | 'on' | 'off';
  maxLength?: number;
  size?: 'sm' | 'md' | 'lg';
  name?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  errorMessage,
  type = 'text',
  disabled = false,
  readOnly = false,
  autoComplete,
  maxLength,
  size = 'lg',
  name,
}) => {
  const handleChange = ({ value }: { value: string }) => {
    onChange(value);
  };

  return (
    <Box>
      <TextField
        id={id}
        name={name || id}
        label={label}
        value={value}
        onChange={handleChange}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder={placeholder}
        helperText={helperText}
        errorMessage={errorMessage}
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        maxLength={maxLength ? { characterCount: maxLength, errorAccessibilityLabel: 'Character limit exceeded' } : undefined}
        size={size}
      />
    </Box>
  );
};

export default FormField;