// src/pages/PinDetailPage.tsx

import React, { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Spinner, Icon } from 'gestalt';
import { 
  PinDetailImage,
  PinDetailContent,
  RelatedPinsSection,
  usePin, 
  useRelatedPins,
} from '@/modules/pin';
import { ROUTES } from '@/app/router/routeConfig';

const PinDetailPage: React.FC = () => {
  const { pinId } = useParams<{ pinId: string }>();
  const navigate = useNavigate();

  const { pin, isLoading, isError, error, refetch } = usePin(pinId);

  const {
    pins: relatedPins,
    isLoading: isLoadingRelated,
    isFetchingNextPage: isFetchingMoreRelated,
    hasNextPage: hasMoreRelated,
    fetchNextPage: fetchMoreRelated,
  } = useRelatedPins(pinId, { enabled: !!pin });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pinId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleFetchMoreRelated = () => {
    fetchMoreRelated();
  };

  if (!pinId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <div className="pin-detail-page pin-detail-page--loading">
        <div className="pin-detail-loader">
          <Spinner accessibilityLabel="Loading pin" show size="lg" />
        </div>
      </div>
    );
  }

  if (isError || !pin) {
    return (
      <div className="pin-detail-page pin-detail-page--error">
        <div className="pin-detail-error">
          <div className="pin-detail-error__icon">
            <Icon accessibilityLabel="" icon="workflow-status-problem" size={64} color="subtle" />
          </div>
          <h1 className="pin-detail-error__title">Pin not found</h1>
          <p className="pin-detail-error__message">
            {error?.message || 'This pin may have been deleted or is no longer available.'}
          </p>
          <div className="pin-detail-error__actions">
            <button 
              className="pin-detail-error__btn pin-detail-error__btn--primary"
              onClick={handleRetry}
            >
              Try again
            </button>
            <button 
              className="pin-detail-error__btn pin-detail-error__btn--secondary"
              onClick={handleGoBack}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-detail-page">
      {/* Back Button */}
      <button 
        className="pin-detail-back-btn"
        onClick={handleGoBack}
        aria-label="Go back"
      >
        <Icon accessibilityLabel="" icon="arrow-back" size={20} color="dark" />
      </button>

      {/* Main Pin Card */}
      <article className="pin-detail-card">
        <div className="pin-detail-card__image">
          <PinDetailImage pin={pin} />
        </div>
        <div className="pin-detail-card__content">
          <PinDetailContent pin={pin} onBack={handleGoBack} />
        </div>
      </article>

      {/* Related Pins - только карточки */}
      <RelatedPinsSection
        pins={relatedPins}
        isLoading={isLoadingRelated}
        isFetchingNextPage={isFetchingMoreRelated}
        hasNextPage={hasMoreRelated}
        fetchNextPage={handleFetchMoreRelated}
        pinTitle={pin.title}
      />
    </div>
  );
};

export default PinDetailPage;