// src/shared/components/forms/FormSection.tsx

import React, { type ReactNode } from 'react';
import { Box, Text, Flex } from 'gestalt';

interface FormSectionProps {
  title: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  required = false,
  children,
}) => {
  return (
    <Box marginBottom={4}>
      <Box marginBottom={2}>
        <Flex alignItems="center" gap={1}>
          <Text weight="bold" size="200">
            {title}
          </Text>
          {required && (
            <Text color="error" size="200">
              *
            </Text>
          )}
        </Flex>
        {description && (
          <Text color="subtle" size="100">
            {description}
          </Text>
        )}
      </Box>
      {children}
    </Box>
  );
};

export default FormSection;