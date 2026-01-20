// src/modules/pin/components/detail/RelatedPinsSection.tsx

import React, { useCallback } from 'react';
import { Spinner, Icon, Box, Masonry } from 'gestalt';
import { useSimilarPins, SearchPinCard, type PinSearchResult } from '@/modules/search';
import { EmptyState } from '@/shared/components';

interface RelatedPinsSectionProps {
  pinId: string;
  pinTitle?: string | null;
  limit?: number;
}

const COLUMN_WIDTH = 236;
const GUTTER_WIDTH = 16;
const MIN_COLUMNS = 2;

const GridItem = ({ data }: { data: PinSearchResult }) => {
  return <SearchPinCard pin={data} showHighlights={false} />;
};

export const RelatedPinsSection: React.FC<RelatedPinsSectionProps> = ({
  pinId,
  pinTitle,
  limit = 20,
}) => {
  const { pins, isLoading, isError } = useSimilarPins(pinId, { limit });

  const getScrollContainer = useCallback((): HTMLElement | Window => window, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="related-pins">
        <div className="related-pins__header">
          <h2 className="related-pins__title">More like this</h2>
        </div>
        <div className="related-pins__loading">
          <Spinner accessibilityLabel="Loading related pins" show size="md" />
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section className="related-pins">
        <div className="related-pins__header">
          <h2 className="related-pins__title">More like this</h2>
        </div>
        <EmptyState
          title="Failed to load related pins"
          description="Please try again later"
          icon="workflow-status-problem"
        />
      </section>
    );
  }

  // Empty state
  if (pins.length === 0) {
    return (
      <section className="related-pins">
        <div className="related-pins__header">
          <h2 className="related-pins__title">More like this</h2>
        </div>
        <div className="related-pins__empty">
          <div className="related-pins__empty-icon">
            <Icon accessibilityLabel="" icon="sparkle" size={48} color="subtle" />
          </div>
          <p className="related-pins__empty-text">
            {pinTitle 
              ? `No similar pins found for "${pinTitle}"`
              : 'No similar pins found'}
          </p>
          <a href="/explore" className="related-pins__explore-btn">
            <Icon accessibilityLabel="" icon="compass" size={16} color="inverse" />
            <span>Explore more</span>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="related-pins">
      <div className="related-pins__header">
        <h2 className="related-pins__title">More like this</h2>
      </div>
      
      <div className="related-pins__grid">
        <Box width="100%">
          <Masonry
            items={pins}
            renderItem={GridItem}
            columnWidth={COLUMN_WIDTH}
            gutterWidth={GUTTER_WIDTH}
            minCols={MIN_COLUMNS}
            scrollContainer={getScrollContainer}
            virtualize
          />
        </Box>
      </div>
    </section>
  );
};

export default RelatedPinsSection;