import { Box, Text } from '@radix-ui/themes';
import { CSSProperties } from 'react';

interface NumberDisplayProps {
  value: number;
  variant?: 'default' | 'addend' | 'result';
  className?: string;
  style?: CSSProperties;
  maxDigits?: number; // Maximum number of digits to align with
}

export function NumberDisplay({ 
  value, 
  variant = 'default', 
  className,
  style,
  maxDigits = 4 // Default to 4 digits (supports up to 9999)
}: NumberDisplayProps) {
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

  const renderDigitsWithPlaceValue = () => {
    // Ensure consistent string conversion and padding
    const valueStr = String(value);
    const digits = valueStr.split('');
    
    // Create padded array more explicitly
    const paddedDigits = [];
    for (let i = 0; i < maxDigits - digits.length; i++) {
      paddedDigits.push('');
    }
    paddedDigits.push(...digits);
    
    return paddedDigits.map((digit, index) => {
      const placeValue = maxDigits - index - 1; // 3=thousands, 2=hundreds, 1=tens, 0=ones
      const placeLabels = ['ones', 'tens', 'hundreds', 'thousands'];
      const isEmptyPlace = digit === '';
      
      return (
        <Box
          key={`${value}-${placeValue}-${index}-${digit || 'empty'}`}
          className="digit-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Place value label */}
          <Text
            size="1"
            className="place-value-label"
            style={{
              color: 'var(--gray-9)',
              fontWeight: '500',
              textAlign: 'center'
            }}
          >
            {!isEmptyPlace && placeLabels[placeValue]}
          </Text>
          
          {/* Digit */}
          <span
            className={`digit-box ${isEmptyPlace ? 'digit-box--empty' : ''}`}
            style={{
              backgroundColor: isEmptyPlace ? 'transparent' : 'var(--gray-2)',
              border: isEmptyPlace ? '2px dashed var(--gray-4)' : '2px solid var(--gray-4)',
              transition: 'all 0.2s ease',
              opacity: isEmptyPlace ? 0.3 : 1
            }}
          >
            {digit}
          </span>
        </Box>
      );
    });
  };

  return (
    <Box 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'monospace',
        fontSize: '2rem',
        lineHeight: '1.2',
        width: 'fit-content', // Ensure it can grow to fit content
        minWidth: 'fit-content', // Prevent shrinking below content size
        overflow: 'visible', // Ensure digits aren't clipped
        ...getVariantStyles(),
        ...style
      }}
    >
      {renderDigitsWithPlaceValue()}
    </Box>
  );
}