// src/shared/components/layout/HeaderLogo.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Icon, Text } from 'gestalt';
import { ROUTES } from '../../utils/constants';

export const HeaderLogo: React.FC = () => {
  return (
    <Link to={ROUTES.HOME} style={{ textDecoration: 'none' }}>
      <Flex alignItems="center" gap={1}>
        <Box color="errorBase" rounding="circle" padding={2}>
          <Icon 
            accessibilityLabel="PinThis Logo" 
            icon="pin" 
            color="inverse" 
            size={20}
          />
        </Box>
        <Box display="none" smDisplay="block">
          <Text weight="bold" size="400" color="default">
            PinThis
          </Text>
        </Box>
      </Flex>
    </Link>
  );
};

export default HeaderLogo;