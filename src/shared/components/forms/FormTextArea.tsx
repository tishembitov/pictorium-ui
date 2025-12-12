// src/shared/components/forms/FormTextArea.tsx
import React from 'react';
import { Box, TextArea } from 'gestalt';

interface FormTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  maxLength?: number;
  name?: string;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  errorMessage,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  name,
}) => {
  const handleChange = ({ value }: { value: string }) => {
    onChange(value);
  };

  return (
    <Box>
      <TextArea
        id={id}
        name={name || id}
        label={label}
        value={value}
        onChange={handleChange}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder={placeholder}
        helperText={helperText}
        errorMessage={errorMessage}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength ? { characterCount: maxLength, errorAccessibilityLabel: 'Character limit exceeded' } : undefined}
      />
    </Box>
  );
};

export default FormTextArea;