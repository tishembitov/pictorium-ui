// src/shared/components/forms/SocialLinkInput.tsx

import React from 'react';
import { Box, Flex, Text } from 'gestalt';

interface SocialLinkInputProps {
  id: string;
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
}

export const SocialLinkInput: React.FC<SocialLinkInputProps> = ({
  id,
  label,
  prefix,
  value,
  onChange,
  placeholder = 'username',
  errorMessage,
}) => {
  return (
    <Box>
      <Box marginBottom={1}>
        <Text size="200" weight="bold">
          {label}
        </Text>
      </Box>
      <Flex alignItems="center">
        <Box
          paddingX={3}
          paddingY={2}
          color="secondary"
          rounding={2}
          dangerouslySetInlineStyle={{
            __style: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
        >
          <Text color="subtle" size="200">
            {prefix}
          </Text>
        </Box>
        <Box flex="grow">
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 16,
              border: '1px solid var(--border-default)',
              borderLeft: 'none',
              borderRadius: '0 8px 8px 0',
              outline: 'none',
            }}
          />
        </Box>
      </Flex>
      {errorMessage && (
        <Box marginTop={1}>
          <Text color="error" size="100">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SocialLinkInput;