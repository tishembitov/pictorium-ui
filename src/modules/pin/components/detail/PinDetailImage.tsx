// src/modules/pin/components/detail/PinDetailImage.tsx

import React, { useState, useCallback, useRef } from 'react';
import { Layer, TapArea, Spinner, Icon } from 'gestalt';
import { useImageUrl, useDownloadImage } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailImageProps {
  pin: PinResponse;
}

export const PinDetailImage: React.FC<PinDetailImageProps> = ({ pin }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const { toast } = useToast();
  const { download, isDownloading } = useDownloadImage();

  const { data: imageData, isLoading } = useImageUrl(pin.imageId, {
    enabled: !!pin.imageId,
  });

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsImageLoaded(true);
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      await download(pin.imageId, {
        fileName: pin.title || 'pin-image',
        onSuccess: () => {
          toast.download.success();
        },
      });
    } catch {
      toast.download.error('Failed to download image');
    }
  }, [download, pin.imageId, pin.title, toast]);

  // Вычисляем aspect ratio для контейнера
  const aspectRatio =
    pin.originalHeight && pin.originalWidth
      ? pin.originalHeight / pin.originalWidth
      : 1;

  // Ограничиваем максимальную высоту
  const containerPaddingBottom = `${Math.min(aspectRatio * 100, 150)}%`;

  // Loading state
  if (isLoading) {
    return (
      <div className="pin-image-container pin-image-container--loading">
        <div className="pin-image-skeleton">
          <Spinner accessibilityLabel="Loading image" show size="md" />
        </div>
      </div>
    );
  }

  // Error state
  if (imageError || !imageData?.url) {
    return (
      <div className="pin-image-container pin-image-container--error">
        <div className="pin-image-error">
          <Icon accessibilityLabel="" icon="camera" size={48} color="subtle" />
          <span className="pin-image-error__text">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Image Container */}
      <div 
        className={`pin-image-container ${isHovered ? 'pin-image-container--hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TapArea onTap={toggleFullscreen} fullWidth>
          <div 
            className="pin-image-wrapper"
            style={{ paddingBottom: containerPaddingBottom }}
          >
            {/* Loading placeholder */}
            {!isImageLoaded && (
              <div className="pin-image-placeholder">
                <Spinner accessibilityLabel="Loading" show size="sm" />
              </div>
            )}

            <img
              ref={imageRef}
              src={imageData.url}
              alt={pin.title || 'Pin image'}
              className={`pin-image ${isImageLoaded ? 'pin-image--loaded' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        </TapArea>

        {/* Hover Overlay */}
        <div className={`pin-image-overlay ${isHovered && isImageLoaded ? 'pin-image-overlay--visible' : ''}`}>
          {/* Top gradient */}
          <div className="pin-image-overlay__gradient pin-image-overlay__gradient--top" />
          
          {/* Bottom gradient */}
          <div className="pin-image-overlay__gradient pin-image-overlay__gradient--bottom" />

          {/* Action buttons */}
          <div className="pin-image-actions">
            <button 
              className="pin-image-action-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label="Download image"
            >
              <Icon 
                accessibilityLabel="" 
                icon={isDownloading ? 'clock' : 'download'} 
                size={20} 
                color="inverse" 
              />
            </button>
            
            <button 
              className="pin-image-action-btn"
              onClick={toggleFullscreen}
              aria-label="View fullscreen"
            >
              <Icon accessibilityLabel="" icon="maximize" size={20} color="inverse" />
            </button>
          </div>

          {/* Zoom hint */}
          <div className="pin-image-zoom-hint">
            <Icon accessibilityLabel="" icon="search" size={16} color="inverse" />
            <span>Click to zoom</span>
          </div>
        </div>

        {/* Image dimensions badge */}
        {pin.originalWidth && pin.originalHeight && isHovered && isImageLoaded && (
          <div className="pin-image-dimensions">
            {pin.originalWidth} × {pin.originalHeight}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <Layer>
          <div className="pin-fullscreen">
            <div className="pin-fullscreen__backdrop" onClick={toggleFullscreen} />
            
            <div className="pin-fullscreen__content">
              <img
                src={imageData.url}
                alt={pin.title || 'Pin image'}
                className="pin-fullscreen__image"
              />
            </div>

            {/* Controls */}
            <div className="pin-fullscreen__controls">
              <button 
                className="pin-fullscreen__btn"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Icon accessibilityLabel="Download" icon="download" size={24} color="inverse" />
              </button>
              
              <button 
                className="pin-fullscreen__btn pin-fullscreen__btn--close"
                onClick={toggleFullscreen}
              >
                <Icon accessibilityLabel="Close" icon="cancel" size={24} color="inverse" />
              </button>
            </div>

            {/* Image info */}
            {pin.title && (
              <div className="pin-fullscreen__info">
                <span className="pin-fullscreen__title">{pin.title}</span>
              </div>
            )}
          </div>
        </Layer>
      )}
    </>
  );
};

export default PinDetailImage;