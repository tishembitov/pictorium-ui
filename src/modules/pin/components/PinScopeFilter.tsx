// src/modules/pin/components/PinScopeFilter.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon, 
  Popover, 
  Layer,
  Divider,
} from 'gestalt';
import { useAuth } from '@/modules/auth';
import { usePinFiltersStore, selectFilter } from '../stores/pinFiltersStore';
import { getCurrentScope } from '../utils/pinFilterUtils';
import { 
  getScopeOptionsForContext,
  type PinScope,
  type PinScopeOption,
} from '../types/pinFilter.types';

// ============================================
// Types
// ============================================

type FilterSize = 'sm' | 'md' | 'lg';
type GestaltPadding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type TextSize = '100' | '200' | '300';

interface PinScopeFilterProps {
  context?: 'home' | 'profile' | 'user';
  isOwnProfile?: boolean;
  userId?: string;
  size?: FilterSize;
  showLabel?: boolean;
}

interface ScopeOptionItemProps {
  option: PinScopeOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

interface ItemStyleState {
  isSelected: boolean;
  isHovered: boolean;
  isDisabled: boolean;
}

// ============================================
// Style Helpers
// ============================================

/**
 * Get all item styles based on state
 */
const getItemStyles = (state: ItemStyleState) => {
  const { isSelected, isHovered, isDisabled } = state;
  
  let backgroundColor = 'transparent';
  if (isSelected) {
    backgroundColor = 'rgba(230, 0, 35, 0.08)';
  } else if (isHovered && !isDisabled) {
    backgroundColor = '#f0f0f0';
  }

  return {
    backgroundColor,
    border: isSelected ? '2px solid #e60023' : '2px solid transparent',
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
  };
};

/**
 * Size configuration map
 */
const SIZE_CONFIG: Record<FilterSize, {
  paddingX: GestaltPadding;
  paddingY: GestaltPadding;
  iconSize: number;
  textSize: TextSize;
}> = {
  sm: { paddingX: 2, paddingY: 1, iconSize: 14, textSize: '100' },
  md: { paddingX: 3, paddingY: 2, iconSize: 16, textSize: '200' },
  lg: { paddingX: 4, paddingY: 3, iconSize: 20, textSize: '300' },
};

// ============================================
// Sub-components
// ============================================

const ScopeOptionItem: React.FC<ScopeOptionItemProps> = React.memo(({ 
  option, 
  isSelected, 
  onSelect, 
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconName = option.icon || 'pin';

  const styles = getItemStyles({ isSelected, isHovered, isDisabled: disabled });

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <TapArea 
      onTap={disabled ? undefined : onSelect} 
      rounding={2}
      disabled={disabled}
    >
      <Box
        padding={2}
        rounding={2}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInlineStyle={{ __style: styles }}
      >
        <Flex alignItems="center" gap={3}>
          <Box
            width={36}
            height={36}
            rounding={2}
            color={isSelected ? 'primary' : 'secondary'}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon 
              accessibilityLabel="" 
              icon={iconName} 
              size={18} 
              color={isSelected ? 'inverse' : 'default'} 
            />
          </Box>

          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200">
              {option.label}
            </Text>
            {option.description && (
              <Text color="subtle" size="100">
                {option.description}
              </Text>
            )}
          </Box>

          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={16} color="success" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
});

ScopeOptionItem.displayName = 'ScopeOptionItem';

// ============================================
// Main Component
// ============================================

export const PinScopeFilter: React.FC<PinScopeFilterProps> = ({
  context = 'home',
  isOwnProfile = false,
  userId,
  size = 'md',
  showLabel = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  
  const { isAuthenticated } = useAuth();
  
  // Use stable selectors
  const filter = usePinFiltersStore(selectFilter);
  const setScope = usePinFiltersStore((state) => state.setScope);
  const setUserScope = usePinFiltersStore((state) => state.setUserScope);

  // Memoize computed values
  const currentScope = useMemo(() => getCurrentScope(filter), [filter]);
  
  const availableOptions = useMemo(() => 
    getScopeOptionsForContext(context, isOwnProfile),
    [context, isOwnProfile]
  );

  const currentOption = useMemo(() => 
    availableOptions.find(opt => opt.value === currentScope) || availableOptions[0],
    [availableOptions, currentScope]
  );

  // Check if any options require auth
  const hasAuthRequiredOptions = useMemo(() => 
    availableOptions.some(opt => opt.requiresAuth),
    [availableOptions]
  );

  // Handlers
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((scope: PinScope) => {
    if (userId) {
      setUserScope(userId, scope);
    } else {
      setScope(scope);
    }
    setIsOpen(false);
  }, [userId, setScope, setUserScope]);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // Get size configuration
  const sizeConfig = SIZE_CONFIG[size];

  // Don't render if only one option
  if (availableOptions.length <= 1) {
    return null;
  }

  return (
    <>
      <Box ref={setAnchorRef}>
        <TapArea onTap={handleToggle} rounding={2}>
          <Box
            paddingX={sizeConfig.paddingX}
            paddingY={sizeConfig.paddingY}
            rounding={2}
            color="secondary"
            display="flex"
            alignItems="center"
          >
            <Flex alignItems="center" gap={2}>
              <Icon 
                accessibilityLabel="" 
                icon={currentOption?.icon || 'pin'} 
                size={sizeConfig.iconSize} 
                color="default" 
              />
              {showLabel && (
                <Text size={sizeConfig.textSize} weight="bold">
                  {currentOption?.label || 'All'}
                </Text>
              )}
              <Icon 
                accessibilityLabel="" 
                icon="arrow-down" 
                size={10} 
                color="subtle" 
              />
            </Flex>
          </Box>
        </TapArea>
      </Box>

      {isOpen && anchorElement && (
        <Layer>
          <Popover
            anchor={anchorElement}
            onDismiss={handleDismiss}
            idealDirection="down"
            positionRelativeToAnchor={false}
            size="flexible"
            color="white"
          >
            <Box padding={3} width={280}>
              <Box marginBottom={2}>
                <Text weight="bold" size="300">
                  Filter by
                </Text>
              </Box>

              <Divider />

              <Box marginTop={2}>
                <Flex direction="column" gap={1}>
                  {availableOptions.map((option) => {
                    const isDisabled = option.requiresAuth === true && !isAuthenticated;
                    
                    return (
                      <ScopeOptionItem
                        key={option.value}
                        option={option}
                        isSelected={currentScope === option.value}
                        onSelect={() => handleSelect(option.value)}
                        disabled={isDisabled}
                      />
                    );
                  })}
                </Flex>
              </Box>

              {!isAuthenticated && hasAuthRequiredOptions && (
                <>
                  <Box marginTop={2}>
                    <Divider />
                  </Box>
                  <Box marginTop={2}>
                    <Text align="center" color="subtle" size="100">
                      Sign in to see your saved and liked pins
                    </Text>
                  </Box>
                </>
              )}
            </Box>
          </Popover>
        </Layer>
      )}
    </>
  );
};

export default PinScopeFilter;