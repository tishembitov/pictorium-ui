// src/shared/components/layout/Footer.tsx
import React from 'react';
import { Box, Text, Link as GestaltLink, Flex } from 'gestalt';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      as="footer"
      color="default"
      paddingX={4}
      paddingY={6}
      display="flex"
      direction="column"
      alignItems="center"
      dangerouslySetInlineStyle={{
        __style: {
          borderTop: '1px solid var(--border-light)',
        },
      }}
    >
      <Box marginBottom={4}>
        <Flex gap={6} wrap justifyContent="center">
          <GestaltLink href="#" display="inline">
            <Text size="200">About</Text>
          </GestaltLink>
          <GestaltLink href="#" display="inline">
            <Text size="200">Terms</Text>
          </GestaltLink>
          <GestaltLink href="#" display="inline">
            <Text size="200">Privacy</Text>
          </GestaltLink>
          <GestaltLink href="#" display="inline">
            <Text size="200">Help</Text>
          </GestaltLink>
        </Flex>
      </Box>
      
      <Text size="200" color="subtle">
        © {currentYear} PinThis. All rights reserved.
      </Text>
    </Box>
  );
};

export default Footer;