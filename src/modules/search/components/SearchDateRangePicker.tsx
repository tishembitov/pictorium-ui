// src/modules/search/components/SearchDateRangePicker.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, TextField, IconButton, Popover, Text, Button, TapArea } from 'gestalt';
import { format, parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

interface SearchDateRangePickerProps {
  fromDate: Date | null;
  toDate: Date | null;
  onFromChange: (date: Date | null) => void;
  onToChange: (date: Date | null) => void;
  onClear?: () => void;
}

const formatDateDisplay = (from: Date | null, to: Date | null): string => {
  if (!from && !to) {
    return 'Any date';
  }
  const fromStr = from ? format(from, 'MMM d') : '...';
  const toStr = to ? format(to, 'MMM d') : '...';
  return `${fromStr} - ${toStr}`;
};

export const SearchDateRangePicker: React.FC<SearchDateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  
  const [fromInput, setFromInput] = useState(
    fromDate ? format(fromDate, 'yyyy-MM-dd') : ''
  );
  const [toInput, setToInput] = useState(
    toDate ? format(toDate, 'yyyy-MM-dd') : ''
  );

  const handleFromChange = useCallback(({ value }: { value: string }) => {
    setFromInput(value);
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        onFromChange(startOfDay(parsed));
      }
    } else {
      onFromChange(null);
    }
  }, [onFromChange]);

  const handleToChange = useCallback(({ value }: { value: string }) => {
    setToInput(value);
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        onToChange(endOfDay(parsed));
      }
    } else {
      onToChange(null);
    }
  }, [onToChange]);

  const handleClear = useCallback(() => {
    setFromInput('');
    setToInput('');
    onFromChange(null);
    onToChange(null);
    onClear?.();
    setIsOpen(false);
  }, [onFromChange, onToChange, onClear]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hasValue = fromDate || toDate;
  const displayValue = formatDateDisplay(fromDate, toDate);

  return (
    <Box position="relative">
      <div ref={setAnchorElement}>
        <TapArea onTap={handleOpen} rounding={2}>
          <Box
            display="flex"
            alignItems="center"
            padding={2}
            rounding={2}
            color={hasValue ? 'selected' : 'transparent'}
            dangerouslySetInlineStyle={{
              __style: {
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              },
            }}
          >
            <Flex alignItems="center" gap={2}>
              <IconButton
                accessibilityLabel="Date range"
                icon="calendar"
                size="sm"
                bgColor="transparent"
                onClick={handleOpen}
              />
              <Text size="200" weight={hasValue ? 'bold' : 'normal'}>
                {displayValue}
              </Text>
            </Flex>
          </Box>
        </TapArea>
      </div>

      {isOpen && anchorElement && (
        <Popover
          anchor={anchorElement}
          onDismiss={handleClose}
          idealDirection="down"
          positionRelativeToAnchor={false}
          size="flexible"
          color="white"
        >
          <Box padding={4} width={280}>
            <Flex direction="column" gap={3}>
              <Text weight="bold">Date Range</Text>
              
              <TextField
                id="date-from"
                label="From"
                type="date"
                value={fromInput}
                onChange={handleFromChange}
              />
              
              <TextField
                id="date-to"
                label="To"
                type="date"
                value={toInput}
                onChange={handleToChange}
              />
              
              <Flex justifyContent="between">
                <Button
                  text="Clear"
                  onClick={handleClear}
                  size="sm"
                  color="gray"
                />
                <Button
                  text="Apply"
                  onClick={handleClose}
                  size="sm"
                  color="red"
                />
              </Flex>
            </Flex>
          </Box>
        </Popover>
      )}
    </Box>
  );
};

export default SearchDateRangePicker;