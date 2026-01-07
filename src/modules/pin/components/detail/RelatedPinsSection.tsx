// src/modules/pin/components/detail/RelatedPinsSection.tsx

import React from 'react';
import { Spinner, Icon } from 'gestalt';
import { PinGrid } from '../PinGrid';
import type { PinResponse } from '../../types/pin.types';

interface RelatedPinsSectionProps {
  pins: PinResponse[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  pinTitle?: string | null;
}

export const RelatedPinsSection: React.FC<RelatedPinsSectionProps> = ({
  pins,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  pinTitle,
}) => {
  // Initial loading state
  if (isLoading && pins.length === 0) {
    return (
      <section className="related-pins">
        <div className="related-pins__loading">
          <Spinner accessibilityLabel="Loading related pins" show size="md" />
        </div>
      </section>
    );
  }

  // Empty state
  if (!isLoading && pins.length === 0) {
    return (
      <section className="related-pins">
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
      <div className="related-pins__grid">
        <PinGrid
          pins={pins}
          isLoading={false}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          emptyMessage=""
        />
      </div>
    </section>
  );
};

export default RelatedPinsSection;