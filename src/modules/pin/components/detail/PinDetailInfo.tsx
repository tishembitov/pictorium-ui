// src/modules/pin/components/detail/PinDetailInfo.tsx

import React from 'react';
import { Box, Flex, Text, Link as GestaltLink, Icon } from 'gestalt';
import { TagList } from '@/modules/tag';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailInfoProps {
  pin: PinResponse;
}

/**
 * Информация о пине: заголовок, описание, ссылка, теги.
 * Ответственность: отображение метаданных пина.
 */
export const PinDetailInfo: React.FC<PinDetailInfoProps> = ({ pin }) => {
  const hasContent = pin.title || pin.description || pin.href || pin.tags.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Box>
      <Flex direction="column" gap={3}>
        {/* Title */}
        {pin.title && (
          <Text size="500" weight="bold">
            {pin.title}
          </Text>
        )}

        {/* Description */}
        {pin.description && (
          <Text color="subtle" size="300">
            {pin.description}
          </Text>
        )}

        {/* External Link */}
        {pin.href && (
          <Box>
            <GestaltLink
              href={pin.href}
              target="blank"
              rel="nofollow"
              display="inlineBlock"
            >
              <Flex alignItems="center" gap={1}>
                <Icon
                  accessibilityLabel=""
                  icon="link"
                  size={16}
                  color="default"
                />
                <Text size="200" underline>
                  {extractDomain(pin.href)}
                </Text>
              </Flex>
            </GestaltLink>
          </Box>
        )}

        {/* Tags */}
        {pin.tags.length > 0 && (
          <Box marginTop={2}>
            <TagList tags={pin.tags} navigateOnClick size="sm" />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

/**
 * Извлекает домен из URL для отображения.
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default PinDetailInfo;