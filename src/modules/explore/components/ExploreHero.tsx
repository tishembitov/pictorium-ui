// src/modules/explore/components/ExploreHero.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Button, Heading } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { FeaturedCollection } from '../types/explore.types';

interface ExploreHeroProps {
  collection: FeaturedCollection & { imageId?: string | null };
  onExplore?: (query: string) => void;
}

export const ExploreHero: React.FC<ExploreHeroProps> = ({
  collection,
  onExplore,
}) => {
  const navigate = useNavigate();
  
  const { data: imageData } = useImageUrl(collection.imageId, {
    enabled: !!collection.imageId,
  });

  const handleExplore = () => {
    if (onExplore) {
      onExplore(collection.query);
    } else {
      navigate(`/search?q=${encodeURIComponent(collection.query)}`);
    }
  };

  // Separate background properties to avoid shorthand conflicts
  const hasImage = !!imageData?.url;
  const gradientOverlay = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))';
  const fallbackGradient = collection.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <Box
      rounding={4}
      overflow="hidden"
      position="relative"
      marginBottom={6}
      dangerouslySetInlineStyle={{
        __style: {
          // Use separate properties instead of shorthand 'background'
          backgroundImage: hasImage 
            ? `${gradientOverlay}, url(${imageData.url})`
            : fallbackGradient,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: 280,
        },
      }}
    >
      <Box
        position="absolute"
        top
        left
        right
        bottom
        display="flex"
        direction="column"
        justifyContent="center"
        alignItems="center"
        padding={8}
      >
        {/* Title */}
        <Box marginBottom={2}>
          <Heading
            size="400"
            color="inverse"
            align="center"
            accessibilityLevel={1}
          >
            {collection.title}
          </Heading>
        </Box>

        {/* Subtitle */}
        {collection.subtitle && (
          <Box marginBottom={6} maxWidth={400}>
            <Text color="inverse" align="center" size="300">
              {collection.subtitle}
            </Text>
          </Box>
        )}

        {/* CTA Button */}
        <Button
          text="Explore"
          onClick={handleExplore}
          color="white"
          size="lg"
        />
      </Box>
    </Box>
  );
};

export default ExploreHero;