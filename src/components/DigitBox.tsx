import { Box, Text } from '@radix-ui/themes';
import { CSSProperties } from 'react';

interface DigitBoxProps {
  // Display mode props
  value?: string | number; // For display mode
  isEmpty?: boolean; // For empty placeholder digits
  variant?: 'default' | 'addend' | 'result'; // For different number types
  
  // Interactive mode props
  isInteractive?: boolean; // Switch between display and select modes
  selectedValue?: string; // Current selected value (for selectors)
  placeholder?: string; // Placeholder text
  disabled?: boolean; // Disable interaction
  onValueChange?: (value: string) => void; // Selection callback
  
  // Common props
  placeValueLabel?: string; // ones, tens, hundreds, thousands
  showPlaceValueLabel?: boolean;
  className?: string;
  style?: CSSProperties;
  questionKey?: string; // For forcing re-renders
}

export function DigitBox({
  value,
  isEmpty = false,
  variant = 'default',
  isInteractive = false,
  selectedValue,
  placeholder = '?',
  disabled = false,
  onValueChange,
  placeValueLabel,
  showPlaceValueLabel = true,
  className,
  style,
  questionKey
}: DigitBoxProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'addend':
        return {
          color: 'var(--gray-12)',
          fontWeight: '600'
        };
      case 'result':
        return {
          color: 'var(--blue-10)',
          fontWeight: 'bold'
        };
      default:
        return {
          color: 'var(--gray-12)',
          fontWeight: '500'
        };
    }
  };

  // Preserve numeric 0 by using nullish coalescing instead of logical OR
  const displayValue = isInteractive ? selectedValue : (value !== null && value !== undefined ? String(value) : '');
  const hasValue = displayValue !== '' && displayValue !== null && displayValue !== undefined;
  const isEmptyPlace = isEmpty || (!hasValue && !isInteractive);

  return (
    <Box 
      className={`digit-container ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      {/* Place value label */}
      {showPlaceValueLabel && placeValueLabel && (
        <Text
          size="1"
          className="place-value-label"
          style={{
            color: isInteractive ? 'var(--blue-9)' : 'var(--gray-9)',
            fontWeight: '500',
            textAlign: 'center'
          }}
        >
          {placeValueLabel}
        </Text>
      )}
      
      {/* Digit display or selector */}
      {isInteractive ? (
        <select
          key={`${questionKey}-${selectedValue}`}
          value={hasValue ? String(selectedValue) : ''}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
          className={`digit-selector-trigger digit-box ${hasValue ? 'digit-selected' : 'digit-empty'}`}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            border: hasValue
              ? '2px solid var(--blue-7)'
              : '2px solid var(--gray-6)',
            backgroundColor: disabled
              ? 'var(--gray-2)'
              : hasValue
                ? 'var(--blue-2)'
                : 'var(--gray-1)',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            color: hasValue ? 'var(--blue-12)' : 'var(--gray-9)',
            boxShadow: hasValue ? '0 2px 8px rgba(0, 100, 200, 0.2)' : 'none',
            fontSize: 'var(--digit-font-size)',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: 0,
            borderRadius: '8px',
            width: 'var(--digit-box-size)',
            height: 'var(--digit-box-size)',
            lineHeight: 'var(--digit-box-size)',
            boxSizing: 'border-box',
            appearance: 'none',
            MozAppearance: 'none',
            WebkitAppearance: 'none'
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <option key={digit} value={String(digit)}>
              {digit}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`digit-box ${isEmptyPlace ? 'digit-box--empty' : ''}`}
          style={{
            backgroundColor: isEmptyPlace ? 'transparent' : 'var(--gray-2)',
            border: isEmptyPlace ? '2px dashed var(--gray-4)' : '2px solid var(--gray-4)',
            transition: 'all 0.2s ease',
            opacity: isEmptyPlace ? 0.3 : 1,
            ...getVariantStyles()
          }}
        >
          {displayValue}
        </span>
      )}
    </Box>
  );
}