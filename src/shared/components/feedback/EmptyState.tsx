// src/shared/components/feedback/EmptyState.tsx
import React, { type ReactNode, type ComponentProps } from 'react';
import { Box, Text, Heading, Icon, Button, Flex } from 'gestalt';

// Get icon type from Gestalt Icon component
type GestaltIconName = ComponentProps<typeof Icon>['icon'];

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: GestaltIconName;
  action?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'folder',
  action,
  secondaryAction,
  children,
}) => {
  return (
    <Box
      display="flex"
      direction="column"
      alignItems="center"
      justifyContent="center"
      paddingY={12}
      paddingX={4}
    >
      <Box
        marginBottom={4}
        color="secondary"
        rounding="circle"
        padding={4}
      >
        <Icon
          accessibilityLabel=""
          icon={icon}
          color="subtle"
          size={48}
        />
      </Box>
      
      <Box marginBottom={2}>
        <Heading size="400" align="center">
          {title}
        </Heading>
      </Box>
      
      {description && (
        <Box marginBottom={action ? 6 : 0} maxWidth={400}>
          <Text align="center" color="subtle">
            {description}
          </Text>
        </Box>
      )}
      
      {children}
      
      {(action || secondaryAction) && (
        <Flex gap={3} justifyContent="center">
          {action && (
            <Button
              text={action.text}
              onClick={action.onClick}
              size="lg"
              color="red"
            />
          )}
          {secondaryAction && (
            <Button
              text={secondaryAction.text}
              onClick={secondaryAction.onClick}
              size="lg"
              color="gray"
            />
          )}
        </Flex>
      )}
    </Box>
  );
};

export default EmptyState;