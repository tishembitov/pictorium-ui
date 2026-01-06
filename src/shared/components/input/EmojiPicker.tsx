// src/shared/components/input/EmojiPicker.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Box, IconButton, Layer, FixedZIndex } from 'gestalt';
import EmojiPickerReact, {
  EmojiClickData,
  Theme,
  EmojiStyle,
  Categories,
  SuggestionMode,
} from 'emoji-picker-react';
import { Z_INDEX } from '@/shared/utils/constants';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getIconSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  switch (size) {
    case 'sm':
      return 'xs';
    case 'lg':
      return 'lg';
    default:
      return 'md';
  }
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerHeight = 400;
      const pickerWidth = 350;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= pickerHeight || spaceBelow > spaceAbove) {
        top = rect.bottom + 8;
      } else {
        top = rect.top - pickerHeight - 8;
      }

      let left = rect.left;
      if (left + pickerWidth > window.innerWidth - 16) {
        left = window.innerWidth - pickerWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setPosition({ top, left });
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      if (!isOpen) {
        updatePosition();
      }
      setIsOpen((prev) => !prev);
    }
  }, [disabled, isOpen, updatePosition]);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      onEmojiSelect(emojiData.emoji);
      setIsOpen(false);
    },
    [onEmojiSelect]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updatePosition();

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, updatePosition]);

  const iconSize = getIconSize(size);

  return (
    <>
      <IconButton
        ref={buttonRef}
        accessibilityLabel="Add emoji"
        icon="sparkle"
        onClick={handleToggle}
        size={iconSize}
        bgColor="transparent"
        disabled={disabled}
      />

      {isOpen && (
        <Layer zIndex={new FixedZIndex(Z_INDEX.POPOVER)}>
          <Box
            ref={pickerRef}
            position="fixed"
            dangerouslySetInlineStyle={{
              __style: {
                top: position.top,
                left: position.left,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                borderRadius: 12,
                overflow: 'hidden',
              },
            }}
          >
            <EmojiPickerReact
              onEmojiClick={handleEmojiClick}
              theme={Theme.LIGHT}
              emojiStyle={EmojiStyle.NATIVE}
              width={350}
              height={400}
              searchPlaceholder="Search emoji..."
              suggestedEmojisMode={SuggestionMode.RECENT}
              categories={[
                { category: Categories.SUGGESTED, name: 'Recent' },
                { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
                { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
                { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
                { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
                { category: Categories.ACTIVITIES, name: 'Activities' },
                { category: Categories.OBJECTS, name: 'Objects' },
                { category: Categories.SYMBOLS, name: 'Symbols' },
                { category: Categories.FLAGS, name: 'Flags' },
              ]}
              previewConfig={{
                showPreview: false,
              }}
              skinTonesDisabled
              autoFocusSearch={false}
              lazyLoadEmojis
            />
          </Box>
        </Layer>
      )}
    </>
  );
};

export default EmojiPicker;